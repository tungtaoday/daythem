"""Notification engine logic: layered config, segments, fatigue heuristic, events.

Delivery is LOCAL on the device (expo-notifications). The backend only decides
PARAMS: it merges owner config (defaults → group → user-admin) with the user's own
prefs, computes targeting segments, and adjusts the marketing contact policy by a
fatigue heuristic built on logged notification events.
"""
import json
import os
import uuid
from datetime import timedelta
from typing import Optional

from sqlalchemy import select, func

from daythem.config import settings
from daythem.adapters.orm import TeacherORM, ClassORM, StudentORM, TuitionORM, NotifEventORM
from daythem.service.handlers import _now, _vn_month

# Built-in defaults — owner config files override these.
DEFAULT_CONFIG = {
    "rules": {
        "class_reminder":   {"enabled": True, "lead_minutes": 30},
        "morning_summary":  {"enabled": True, "at": "07:00"},
        "tuition_reminder": {"enabled": True, "day_of_month": 28, "at": "09:00"},
        "report_reminder":  {"enabled": True, "weekday": 7, "at": "19:00"},  # 7 = Chủ nhật
    },
    "contact_policy": {
        "quiet_hours": ["22:00", "07:00"],
        "max_marketing_per_week": 2,
        "marketing_min_gap_hours": 24,
    },
    "marketing_opt_in_default": True,
}


def _load_json(path: str) -> dict:
    if not os.path.isfile(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _deep_merge(base: dict, over: dict) -> dict:
    """Two-level deep merge (enough for rules / contact_policy)."""
    out = {k: (dict(v) if isinstance(v, dict) else v) for k, v in base.items()}
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def compute_segments(teacher: TeacherORM, session) -> list[str]:
    segs: list[str] = []
    age_days = (_now() - teacher.created_at).days if teacher.created_at else 999
    if age_days < 7:
        segs.append("new_user")
    n_classes = session.scalar(
        select(func.count(ClassORM.id)).where(ClassORM.teacher_id == teacher.id, ClassORM.archived == False)  # noqa: E712
    ) or 0
    if n_classes == 0:
        segs.append("no_class")
    else:
        segs.append("has_class")
        n_students = session.scalar(
            select(func.count(StudentORM.id))
            .join(ClassORM, StudentORM.class_id == ClassORM.id)
            .where(ClassORM.teacher_id == teacher.id, StudentORM.archived == False)  # noqa: E712
        ) or 0
        if n_students == 0:
            segs.append("no_student")
        # unpaid this month?
        unpaid = session.scalar(
            select(func.count(TuitionORM.id))
            .join(ClassORM, TuitionORM.class_id == ClassORM.id)
            .where(ClassORM.teacher_id == teacher.id, TuitionORM.paid == False,  # noqa: E712
                   TuitionORM.month == _vn_month())
        ) or 0
        if unpaid > 0:
            segs.append("has_unpaid")
    for t in (teacher.notif_tags or []):
        segs.append(str(t))
    return segs


def marketing_fatigue(teacher_id: str, session, base_max_per_week: int) -> int:
    """Heuristic: if the user keeps dismissing marketing without opening, throttle.
    Returns an adjusted max-marketing-per-week (>=0)."""
    since = _now() - timedelta(days=14)
    rows = session.execute(
        select(NotifEventORM.event_type, func.count(NotifEventORM.id))
        .where(NotifEventORM.teacher_id == teacher_id,
               NotifEventORM.channel == "marketing",
               NotifEventORM.created_at >= since)
        .group_by(NotifEventORM.event_type)
    ).all()
    counts = {etype: c for etype, c in rows}
    opened = counts.get("opened", 0)
    dismissed = counts.get("dismissed", 0)
    if opened > 0:
        return base_max_per_week  # engaged → no throttle
    if dismissed >= 6:
        return 0                  # clearly annoyed → stop
    if dismissed >= 3:
        return 1                  # fatigued → minimal
    return base_max_per_week


def resolve_config(teacher: TeacherORM, session) -> dict:
    segments = compute_segments(teacher, session)
    file_cfg = _load_json(settings.NOTIFY_CONFIG_PATH)

    cfg = _deep_merge(DEFAULT_CONFIG, {
        "rules": file_cfg.get("defaults", {}).get("rules", {}),
        "contact_policy": file_cfg.get("defaults", {}).get("contact_policy", {}),
    })
    if "marketing_opt_in_default" in file_cfg.get("defaults", {}):
        cfg["marketing_opt_in_default"] = file_cfg["defaults"]["marketing_opt_in_default"]

    # group overrides (by segment)
    groups = file_cfg.get("groups", {})
    for seg in segments:
        if seg in groups:
            cfg = _deep_merge(cfg, groups[seg])

    # user-admin override
    users = file_cfg.get("users", {})
    if teacher.id in users:
        cfg = _deep_merge(cfg, users[teacher.id])

    # user's OWN prefs win (utility on/off + times + DND + marketing opt-in)
    prefs = teacher.notif_prefs or {}
    if prefs.get("rules"):
        cfg["rules"] = _deep_merge(cfg["rules"], prefs["rules"])
    # DND from prefs or legacy columns
    dnd = prefs.get("quiet_hours")
    if not dnd and teacher.dnd_start and teacher.dnd_end:
        dnd = [teacher.dnd_start, teacher.dnd_end]
    if dnd:
        cfg["contact_policy"]["quiet_hours"] = dnd

    marketing_opt_in = prefs.get("marketing_opt_in")
    if marketing_opt_in is None:
        marketing_opt_in = cfg.get("marketing_opt_in_default", True)

    # fatigue-adjust marketing cap
    base_cap = cfg["contact_policy"].get("max_marketing_per_week", 2)
    cfg["contact_policy"]["max_marketing_per_week"] = marketing_fatigue(teacher.id, session, base_cap)

    return {
        "rules": cfg["rules"],
        "contact_policy": cfg["contact_policy"],
        "marketing_opt_in": bool(marketing_opt_in),
        "segments": segments,
    }


def active_campaigns(teacher: TeacherORM, session) -> list[dict]:
    """Marketing campaigns targeted at this user's segments (owner-edited file)."""
    prefs = teacher.notif_prefs or {}
    opt_in = prefs.get("marketing_opt_in")
    if opt_in is None:
        opt_in = _load_json(settings.NOTIFY_CONFIG_PATH).get("defaults", {}).get("marketing_opt_in_default", True)
    if not opt_in:
        return []
    cap = resolve_config(teacher, session)["contact_policy"].get("max_marketing_per_week", 2)
    if cap <= 0:
        return []  # fatigue says stop

    data = _load_json(settings.NOTIFY_CAMPAIGNS_PATH)
    campaigns = data.get("campaigns", []) if isinstance(data, dict) else []
    segs = set(compute_segments(teacher, session))
    out = []
    for c in campaigns:
        if not c.get("active") or not c.get("title"):
            continue
        target = c.get("segments")  # None/[] = everyone
        if target and not (segs & set(target)):
            continue
        out.append({
            "id": str(c.get("id") or c.get("title")),
            "title": c.get("title", ""),
            "body": c.get("body", ""),
            "cta_url": c.get("cta_url") or None,
            "at": c.get("at") or None,          # optional "HH:MM" schedule; else show soon
        })
    return out[:cap]


def log_event(session, teacher_id: str, channel: str, rule: Optional[str], event_type: str) -> None:
    session.add(NotifEventORM(
        id=str(uuid.uuid4()), teacher_id=teacher_id,
        channel=(channel or "utility")[:20], rule=(rule or None),
        event_type=(event_type or "delivered")[:20],
    ))
