# UniMan

[Türkçe](README.tr.md)

Student app for grades, GPA, weekly schedule, notes, and reminders. Built with React Native (Expo SDK 57). Data stays on the phone in SQLite — there is no backend.

Web counterpart: [UniMan](https://github.com/KeremAKDOGAN81/UniMan)

**Package:** `com.kodlarinefendisi.uniman`

## Features

- **Home** — today’s classes with now / next, exam countdown, GPA snapshot, JSON backup.
- **Calc** — midterm plus extra activities (each with a weight). Required final score uses the same formula as web UniMan. GPA (AGNO) lives here as a second pane: ECTS × letter points, 4.00 and 100-point scales.
- **Schedule** — Monday–Friday slots. Optional local notification 1 / 2 / 3 hours before class (repeats weekly).
- **Notes** — quick notes; prefilled from a class on the schedule. Search by title or body.
- **Track** — exam/homework reminders (local notifications) and attendance.
- Light theme by default; dark theme is optional and persisted.

## Architecture

```
Screens (Expo Router)
  → Zustand
  → expo-sqlite (uniman.db)
  → expo-notifications (local)
```

Grade math lives in `lib/finalGrade.ts` and `lib/gpa.ts`, not in the UI.

## Run locally

Needs JDK 17, Android SDK, and a device or emulator. First native compile:

```bash
npm install
npx expo run:android
```

Day-to-day JS:

```bash
npx expo start --dev-client
```

Rebuild native code only after adding a native module.

## Sideload APK (Android)

Not a Windows `.exe`. Install the `.apk` from EAS:

```bash
npx eas-cli build --platform android --profile preview
```

When the build finishes, open the Expo page, download the APK, copy it to the phone, and install (allow unknown sources if asked). iPhone cannot install this APK.
