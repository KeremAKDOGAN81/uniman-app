# UniMan

[Türkçe](README.tr.md)

Offline-first student assistant for schedule, GPA, final targets, notes, and reminders. Built with **React Native (Expo SDK 57)**. All data stays on the device in **SQLite** — no account, no backend.

**Package:** `com.kodlarinefendisi.uniman`

## Highlights

- **Colorful Edu UI** — rounded cards, gradients, per-course colors (assigned automatically from course name).
- **Swipe tabs** — five main screens; switch with horizontal swipe or header arrows (no bottom tab bar).
- **Onboarding** — short intro, then profile setup (name, department, optional university/class). App unlocks after profile is saved.
- **Privacy** — data never leaves the phone unless you export a JSON backup.

## Screens

| Tab | What it does |
|-----|----------------|
| **Home** | Greeting with your name, next exam countdown, today’s classes (now / next), weekly summary, unified **My courses**, GPA & open reminders. |
| **Schedule** | Mon–Fri timetable, class reminders (1 / 2 / 3 h before), share week as text, link a class to AGNO or attendance. |
| **Calc** | **Final** pane: required final score from midterm + weighted activities. **AGNO** pane: semester GPA (4.00 and 100-point). Stat tiles show last result or *Not calculated*. |
| **Notes** | Notes tagged by course, search & filter by tag; open from schedule with course prefilled. |
| **Track** | Exam/homework reminders (local notifications) and attendance limits with progress bars. |

## Course linking

Course names are shared across schedule, AGNO, attendance, notes, and final targets via a single catalog (`lib/courseCatalog.ts`). Adding a class can prompt linking it to AGNO or attendance; chips suggest existing course names everywhere.

## Architecture

```
Expo Router screens
  → Zustand (useAppStore)
  → expo-sqlite (uniman.db)
  → expo-notifications (local only)
```

Business logic: `lib/gpa.ts`, `lib/finalGrade.ts`, `lib/homeInsights.ts`, `lib/copy.ts`, `lib/profile.ts`, `lib/shareSchedule.ts`.

UI building blocks: `components/edu.tsx`, `components/SwipeTabShell.tsx`.

## Backup

Settings → export JSON (courses, schedule, reminders, notes, profile, theme). Import replaces on-device data after confirmation.

## Run locally

Requires JDK 17, Android SDK, and a device or emulator. First native build:

```bash
npm install
npx expo run:android
```

Daily JS development:

```bash
npm start
# or: npx expo start --dev-client
```

Rebuild native code only after adding a native module.

## Sideload APK (Android)

Install the preview `.apk` from EAS (not a Windows `.exe`):

```bash
npx eas-cli build --platform android --profile preview
```

When the build finishes, download the APK from the Expo page, copy it to the phone, and install (allow unknown sources if prompted). iPhone cannot install this APK.

## Docs

Expo SDK reference: [docs.expo.dev v57](https://docs.expo.dev/versions/v57.0.0/)
