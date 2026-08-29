# UniMan

[English](README.md)

Program, AGNO, final hedefi, not ve hatırlatma için **çevrimdışı** öğrenci asistanı. **React Native (Expo SDK 57)**. Tüm veriler telefonda **SQLite**’ta kalır — hesap yok, sunucu yok.

**Paket:** `com.kodlarinefendisi.uniman`

## Öne çıkanlar

- **Renkli Edu arayüz** — oval kartlar, gradientler, derse göre otomatik renk.
- **Kaydırmalı sekmeler** — üst barı kaydır, noktalara dokun veya okları kullan (alt tab bar yok).
- **Ders merkezi** — ana sayfadaki ders kartından program, not, devamsızlık ve hızlı işlemler.
- **Sabah özeti** — her gün 07:30 bildirim + ana sayfada Bugün kartı.
- **Haftalık rapor & odak modu** — haftalık özet ekranı ve pomodoro tarzı çalışma sayacı.
- **İlk açılış** — kısa tanıtım, profil (ad, bölüm). Profil kaydedilmeden uygulama açılmaz.
- **Gizlilik** — veriler telefondan çıkmaz; yalnızca JSON yedek dışa aktarırsan paylaşırsın.

## Sekmeler

| Sekme | Ne işe yarar? |
|-------|----------------|
| **Ana sayfa** | Selamlama, sıradaki sınav, bugünkü dersler, sabah özeti, haftalık özet, **Derslerim**, dönem AGNO, boş saatler. |
| **Program** | Gün / hafta görünümü, Pazartesi–Cuma programı, 1 / 2 / 3 saat önce bildirim, haftayı paylaş. |
| **Hesap** | **Final:** vize + ağırlıklı etkinliklerden gerekli not. **AGNO:** ayarlardaki aktif döneme göre ortalama. |
| **Notlar** | Derse etiketli notlar, markdown önizleme, isteğe bağlı fotoğraf, sabitleme, arama. |
| **Takip** | Sınav/ödev hatırlatmaları ve devamsızlık limiti. |

### Ek ekranlar

| Ekran | Ne işe yarar? |
|-------|----------------|
| **Ders merkezi** | Derse özel özet: + not, + devamsızlık, final, hatırlatma, odak modu. |
| **Haftalık rapor** | Sınavlar, devamsızlık uyarıları, boş saatler, dönem AGNO. |
| **Odak modu** | 25 / 45 / 15 dakika çalışma sayacı. |
| **Ayarlar** | Profil, aktif dönem, tema, bildirimler, sabah özeti, yedek. |

## Ders birleştirme

Program, AGNO, devamsızlık, notlar ve final hesapları aynı ders kataloğunu kullanır (`lib/courseCatalog.ts`).

## Mimari

```
Expo Router ekranları
  → Zustand (useAppStore)
  → expo-sqlite (uniman.db)
  → expo-notifications (yalnızca yerel)
```

## Yedek

Ayarlar → JSON dışa aktar (dersler, program, hatırlatmalar, notlar, final hedefleri, devamsızlık, profil, tema, **aktif dönem**, **sabah özeti**). Not fotoğrafları cihaza özel URI’dır; başka telefonda içe aktarınca görünmeyebilir.

## Çalıştırma

JDK 17, Android SDK ve emülatör veya cihaz gerekir.

**İlk kurulum / native paket sonrası** (ör. fotoğraf seçici):

```bash
npm install
npx expo run:android
```

**Günlük geliştirme** (dev client zaten yüklüyse):

```bash
npm start
```

Yenileme: Metro terminalinde `r`, veya emülatörde **Ctrl+M → Reload**.

## Telefona APK

Bağımsız preview `.apk` (dev client değil):

```bash
npx eas-cli build --platform android --profile preview
```

Expo build sayfasından APK’yı indir, telefona at, kur. iPhone bu APK’yı kuramaz.

## Dokümantasyon

Expo SDK: [docs.expo.dev v57](https://docs.expo.dev/versions/v57.0.0/)
