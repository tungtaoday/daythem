"""Canh app xuat hien tren App Store -> bao Telegram -> tu tat.

Cron goi moi 10 phut. Thay flag file la thoat ngay (da bao roi, khong bao lai).
"""
import json
import pathlib
import sys
import urllib.request

sys.path.insert(0, "/opt/daythem/src")
FLAG = pathlib.Path("/opt/daythem/.appstore_live")

if FLAG.exists():
    sys.exit(0)

url = "https://itunes.apple.com/lookup?bundleId=vn.daythem.app&country=vn"
try:
    with urllib.request.urlopen(url, timeout=30) as r:
        d = json.load(r)
except Exception:
    sys.exit(0)  # mang loi thi lan sau thu lai

if d.get("resultCount", 0) > 0:
    app = d["results"][0]
    from daythem.adapters.telegram import _send
    _send(
        "🎉 <b>GieoChữ ĐÃ LÊN APP STORE!</b>\n\n"
        f"<b>{app.get('trackName')}</b> · phiên bản {app.get('version')}\n"
        f"{app.get('trackViewUrl')}\n\n"
        "Nhắn Claude để nối link vào landing + fanpage + tin nhắn tuyển GV."
    )
    FLAG.write_text(app.get("trackViewUrl") or "live")
