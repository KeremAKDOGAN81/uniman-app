# UniMan

Öğrenci not, GPA, ders programı ve hatırlatma uygulaması. React Native (Expo SDK 57), veriler telefonda SQLite’ta kalır, backend yoktur.

Web referans: [UniMan](https://github.com/KeremAKDOGAN81/UniMan)

## Ne var?

- **Hesap** — vize + istenen sayıda ek etkinlik (yüzde ile). Finalden kaç alman gerektiği web UniMan ile aynı formülle hesaplanır.
- **AGNO** — AKTS × harf katsayısı, 4.00 ve 100’lük.
- **Program** — Pazartesi–Cuma saatlik dersler; ana sayfada bugün.
- **Takip** — sınav/ödev yerel bildirimi, devamsızlık, kısa notlar.
- **Yedek** — JSON dışa/içe aktar (ana sayfa).
- Açık renkli tema varsayılan; koyu temaya geçilebilir.

## Mimari

```
Ekranlar (Expo Router)
  → Zustand
  → expo-sqlite (uniman.db)
  → expo-notifications (yerel)
```

İş kuralları `lib/finalGrade.ts` ve `lib/gpa.ts` içinde; UI’dan ayrı durur.

## Çalıştırma

```bash
npm install
npx expo run:android   # ilk native derleme (emülatör)
npx expo start --dev-client
```

Sonraki JS değişiklikleri Fast Refresh ile gelir. Native paket eklenince `run:android` tekrar gerekir.

## Paket

`com.kodlarinefendisi.uniman`
