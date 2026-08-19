# UniMan

[English](README.md)

Öğrenci not, GPA, ders programı, not ve hatırlatma uygulaması. React Native (Expo SDK 57). Veriler telefonda SQLite’ta kalır; backend yoktur.

Web karşılığı: [UniMan](https://github.com/KeremAKDOGAN81/UniMan)

**Paket:** `com.kodlarinefendisi.uniman`

## Ne var?

- **Ana sayfa** — bugünün dersleri (şimdi / sıradaki), sınav geri sayımı, GPA özeti, JSON yedek.
- **Hesap** — vize + istenen sayıda ek etkinlik (yüzde ile). Finalden kaç alman gerektiği web UniMan ile aynı formülle hesaplanır. AGNO aynı sekmede ikinci panel: AKTS × harf katsayısı, 4.00 ve 100’lük.
- **Program** — Pazartesi–Cuma saatlik dersler. İsteğe bağlı yerel bildirim: dersten 1 / 2 / 3 saat önce (her hafta tekrarlar).
- **Notlar** — kısa notlar; programdan derse göre başlık gelir. Başlık veya içerikte arama.
- **Takip** — sınav/ödev yerel bildirimi ve devamsızlık.
- Açık renkli tema varsayılan; koyu temaya geçilebilir, kayıtlı kalır.

## Mimari

```
Ekranlar (Expo Router)
  → Zustand
  → expo-sqlite (uniman.db)
  → expo-notifications (yerel)
```

İş kuralları `lib/finalGrade.ts` ve `lib/gpa.ts` içinde; UI’dan ayrı durur.

## Çalıştırma

JDK 17, Android SDK ve emülatör veya cihaz gerekir. İlk native derleme:

```bash
npm install
npx expo run:android
```

Günlük JS:

```bash
npx expo start --dev-client
```

Native paket eklenince `run:android` tekrar gerekir.

## Telefona APK

Windows `.exe` değil. Android’e `.apk` kurulur. EAS:

```bash
npx eas-cli build --platform android --profile preview
```

Derleme bitince Expo sayfasından APK’yı indir, telefona at, kur (gerekirse bilinmeyen kaynaklara izin ver). iPhone bu APK’yı kuramaz.
