# UniMan

[English](README.md)

Program, AGNO, final hedefi, not ve hatırlatma için **çevrimdışı** öğrenci asistanı. **React Native (Expo SDK 57)**. Tüm veriler telefonda **SQLite**’ta kalır — hesap yok, sunucu yok.

**Paket:** `com.kodlarinefendisi.uniman`

## Öne çıkanlar

- **Renkli Edu arayüz** — oval kartlar, gradientler, derse göre otomatik renk atama.
- **Kaydırmalı sekmeler** — beş ana ekran; yatay kaydırma veya üst oklarla geçiş (alt tab bar yok).
- **İlk açılış** — kısa tanıtım, ardından profil (ad, soyad, bölüm; isteğe bağlı üniversite/sınıf). Profil kaydedilmeden uygulama açılmaz.
- **Gizlilik** — veriler telefondan çıkmaz; yalnızca JSON yedek dışa aktarırsan paylaşırsın.

## Sekmeler

| Sekme | Ne işe yarar? |
|-------|----------------|
| **Ana sayfa** | İsimle selamlama, sıradaki sınav, bugünkü dersler, haftalık özet, **Derslerim**, AGNO ve açık hatırlatmalar. |
| **Program** | Pazartesi–Cuma programı, dersten 1 / 2 / 3 saat önce bildirim, haftayı metin olarak paylaş, dersi AGNO/devamsızlığa bağla. |
| **Hesap** | **Final:** vize + ağırlıklı etkinliklerden gerekli final notu. **AGNO:** dönem ortalaması (4.00 ve 100’lük). Üst kartlar son değeri veya *Hesaplanmadı* gösterir. |
| **Notlar** | Derse etiketli notlar, arama ve derse göre filtre; programdan derse dokunarak açılabilir. |
| **Takip** | Sınav/ödev hatırlatmaları (yerel bildirim) ve devamsızlık limiti takibi. |

## Ders birleştirme

Program, AGNO, devamsızlık, notlar ve final hesapları aynı ders kataloğunu kullanır (`lib/courseCatalog.ts`). Derse ekleme sonrası AGNO veya devamsızlığa bağlama önerilir; formlarda mevcut ders adları chip olarak çıkar.

## Mimari

```
Expo Router ekranları
  → Zustand (useAppStore)
  → expo-sqlite (uniman.db)
  → expo-notifications (yalnızca yerel)
```

İş kuralları: `lib/gpa.ts`, `lib/finalGrade.ts`, `lib/homeInsights.ts`, `lib/copy.ts`, `lib/profile.ts`, `lib/shareSchedule.ts`.

Arayüz: `components/edu.tsx`, `components/SwipeTabShell.tsx`.

## Yedek

Ayarlar → JSON dışa aktar (dersler, program, hatırlatmalar, notlar, profil, tema). İçe aktarma onaydan sonra cihaz verisini değiştirir.

## Çalıştırma

JDK 17, Android SDK ve emülatör veya cihaz gerekir. İlk native derleme:

```bash
npm install
npx expo run:android
```

Günlük geliştirme:

```bash
npm start
# veya: npx expo start --dev-client
```

Yeni native paket eklenince `run:android` tekrar gerekir.

## Telefona APK

EAS ile preview `.apk` (Windows `.exe` değil):

```bash
npx eas-cli build --platform android --profile preview
```

Derleme bitince Expo sayfasından APK’yı indir, telefona at, kur (gerekirse bilinmeyen kaynaklara izin ver). iPhone bu APK’yı kuramaz.

## Dokümantasyon

Expo SDK: [docs.expo.dev v57](https://docs.expo.dev/versions/v57.0.0/)
