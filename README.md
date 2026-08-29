# UniMan

[Türkçe](README.tr.md)

Offline-first student assistant for schedule, GPA, final targets, notes, and reminders. Built with **React Native (Expo SDK 57)**. All data stays on the device in **SQLite** — no account, no backend.

**Package:** `com.kodlarinefendisi.uniman`

## Highlights

- **Colorful Edu UI** — rounded cards, gradients, per-course colors (from course name).
- **Swipe tabs** — five main screens; swipe the header, tap dots, or use arrows (no bottom tab bar).
- **Course hub** — tap a course on Home for schedule, grades, attendance, notes, and quick actions.
- **Morning summary** — daily 07:30 local notification + Today card on Home.
- **Weekly report & focus mode** — week overview screen and Pomodoro-style focus timer from free slots.
- **Onboarding** — short intro, then profile (name, department). App unlocks after profile is saved.
- **Privacy** — data never leaves the phone unless you export a JSON backup.

## Screens

| Tab | What it does |
|-----|----------------|
| **Home** | Greeting, next exam, today’s classes, morning summary, weekly summary, **My courses**, semester AGNO, free hours, links to weekly report. |
| **Schedule** | Day / week view, Mon–Fri timetable, class reminders (1 / 2 / 3 h before), share week as text. |
| **Calc** | **Final:** required score from midterm + weighted activities. **AGNO:** semester GPA (4.00 and 100-point), filtered by active semester in Settings. |
| **Notes** | Course-tagged notes, markdown preview, optional photo, pin, search & filter. |
| **Track** | Exam/homework reminders (local notifications) and attendance limits. |

### Extra routes

| Screen | What it does |
|--------|----------------|
| **Course hub** | Per-course dashboard: quick add note, bump attendance, final calc, reminder, focus mode. |
| **Weekly report** | Generated summary: exams, attendance warnings, free hours, semester AGNO. |
| **Focus** | 25 / 45 / 15 minute timer for study sessions. |
| **Settings** | Profile, active semester, theme, notifications, morning summary toggle, backup. |

## Course linking

Course names are shared across schedule, AGNO, attendance, notes, and final targets via `lib/courseCatalog.ts`. Chips suggest existing names; course hub ties everything together.

## Architecture

```
Expo Router screens
  → Zustand (useAppStore)
  → expo-sqlite (uniman.db)
  → expo-notifications (local only)
```

Key modules: `lib/gpa.ts`, `lib/finalGrade.ts`, `lib/morningSummary.ts`, `lib/weeklyReport.ts`, `lib/freeHours.ts`, `components/SwipeTabShell.tsx`, `components/edu.tsx`.

## Backup

Settings → export JSON (courses, schedule, reminders, notes, exam targets, attendance, profile, theme, **active semester**, **morning summary**). Import replaces on-device data after confirmation. Note photo URIs are device-local and may not work after import on another phone.

## Run locally

Requires JDK 17, Android SDK, and a device or emulator.

**First install / after adding native modules** (e.g. photo picker):

```bash
npm install
npx expo run:android
```

**Daily JS development** (dev client already on device/emulator):

```bash
npm start
```

Reload: Metro terminal `r`, or emulator **Ctrl+M → Reload**.

## Sideload APK (Android)

Standalone preview APK (no dev client):

```bash
npx eas-cli build --platform android --profile preview
```

Download the APK from the Expo build page, copy to the phone, install (allow unknown sources). iPhone cannot install this APK.

## Docs

Expo SDK reference: [docs.expo.dev v57](https://docs.expo.dev/versions/v57.0.0/)
