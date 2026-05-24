# DayThem — Project Configuration

@claude/CLAUDE.md

## Project Context

**DayThem** — App quản lý lớp dạy thêm cho giáo viên cá nhân (private tutoring management app for individual teachers). Vietnamese market, mobile-first, friendly UX ưu tiên người không rành tech.

**Type:** `frontend-prototype` — standalone HTML/JSX prototype, no backend, no Python.

---

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Browser (React 18 + Babel standalone, no build step) |
| Language | JSX transpiled in-browser via `@babel/standalone` |
| Styling | CSS custom properties (`oklch()` color space) + Be Vietnam Pro font |
| Output | `DayThem.html` — single self-contained file (~240 KB) |

---

## File Map

```
C:\DayThem\
├── DayThem.html                         # ← Main deliverable (single-file app)
└── claude\                              # Team Claude Code config (read-only reference)

Source bundle (design2):
C:\Users\cts\.claude\projects\C--DayThem\
  771d8795-b38d-4636-9635-f3ccc6f704cb\
    tool-results\design2_files\daythem\project\
      ├── styles.css          Design tokens, CSS vars, animations
      ├── design-canvas.jsx   Pan/zoom canvas: DCSection, DCArtboard, DCPostIt
      ├── shared.jsx          Icons, StatusBar, TabBar, Avatar, Chip, seed data
      ├── home.jsx            HomeA/B/C (dashboard variants)
      ├── home_d.jsx          HomeD assistant feed + NudgeCard
      ├── flows.jsx           Attendance, Tuition, StudentProfile, ReportFlow
      ├── announce.jsx        CancelClass, MakeupFlow (poll), ZaloGroupPreview
      ├── settings.jsx        ClassSettings, StudentFeeModal, ScheduleModal
      ├── onboarding.jsx      5-step onboarding (Zalo OAuth, Phone OTP, Setup)
      ├── ios-frame.jsx       iOS 26 Liquid Glass components (IOSDevice, etc.)
      └── canvas.jsx          Root App component — DCSection layout
```

---

## Design System

- **Colors:** `--green-500` (primary), `--coral-500` (accent), `--honey-100` (warm bg)
- **Font:** Be Vietnam Pro (loaded via Google Fonts `<link>`)
- **Screens:** 390×820 px iOS frames (borderRadius 36px)
- **Canvas sections:** Onboarding → Home → Attendance → Tuition → Student → Report → Announce → Settings

---

## Aggregate Abbreviations (DayThem Domain)

| Aggregate | Abbrev | Notes |
|-----------|--------|-------|
| Class (Lớp) | CLS | The main teaching class |
| Student (Học sinh) | STU | |
| Attendance (Điểm danh) | ATT | |
| Tuition (Học phí) | TUI | |
| Announcement (Thông báo) | ANN | Includes makeup/cancel |
| Report (Báo cáo) | RPT | Weekly parent report |
| Teacher (Giáo viên) | TCH | App owner / single user |

---

## Building DayThem.html

To rebuild `DayThem.html` from the source files, read all 9 JSX files + styles.css from the design2 bundle path above and concatenate them into one `<script type="text/babel" data-presets="react">` block in order:

1. `styles.css` (inline as `<style>`, strip `@import` line)
2. `shared.jsx`
3. `design-canvas.jsx`
4. `home.jsx`
5. `home_d.jsx`
6. `flows.jsx`
7. `announce.jsx`
8. `settings.jsx`
9. `onboarding.jsx`
10. `ios-frame.jsx`
11. `canvas.jsx`

HTML shell needs:
- `<link>` to Google Fonts (Be Vietnam Pro 400/500/600/700)
- React 18 + ReactDOM from unpkg CDN
- `@babel/standalone` from unpkg CDN
- `<div id="root">` mount point

---

## Workflow Adaptation (Frontend Prototype)

This project is a **design prototype**, not a production service. Apply the team workflow with adjustments:

| Stage | Standard | DayThem adaptation |
|-------|----------|--------------------|
| 📋 Document UC | Use cases in `docs/` | Brief note in chat is enough |
| 🏗️ Design Domain | Aggregate model | Design token / component planning |
| 🧪 Write Tests | E2E tests | Visual check in browser |
| 💻 Implement | Python code | Edit JSX source → rebuild HTML |
| ▶️ Run Tests | pytest | Open `DayThem.html` in browser |
| 🔎 Review | Code review | Check all 8+ canvas sections render |

**Task Mode:** Default **Flexible** for UI/UX changes, **Strict** for new domain flows (new screen, new user journey).

---

## Zalo Integration Notes

- **Zalo OAuth** = happy path for login (1 tap, gets name + avatar)
- **Phone + OTP** = fallback (6-cell auto-advance, auto-submit)
- Zalo used for: group announcements, parent messages, makeup poll, tuition reminders
- App distinguishes: **group messages** (cancel, makeup, announcements) vs **private messages** (tuition, individual alerts)

---

## Key UX Decisions

- Default all students **present** in attendance — tap to mark absent
- Tuition reminder has 3 templates: nhẹ nhàng / trực tiếp / kèm số tài khoản
- Makeup poll: live vote simulation, slot badge "Nhiều nhất" → confirm 1 tap
- Onboarding Zalo link step is **skippable** — never block teacher from entering app
- HomeD (assistant feed) cards: each card = 1 decision → swipe/dismiss → "Tất cả việc xong 🌿"
