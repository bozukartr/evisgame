# EvisGame

EvisGame, 2–4 yaş çocuklar için tasarlanmış sakin ve cezasız bir mini oyun koleksiyonudur. Renk, şekil, boyut, sayı ve hayvan eşleştirmelerine ek olarak kart hafıza, hareketli balon yakalama ve rakam çizme modları sunar.

## Özellikler

- iPhone ve Android için kurulabilir PWA
- Çevrimdışı oyun ve otomatik uygulama kabuğu önbelleği
- Normal, iOS ve Android maskable ikon setleri
- Safe-area, yüksek DPI, yatay/dikey ekran ve çoklu dokunma desteği
- Sürükle-bırak ve dokun-yerleştir kontrolleri
- Resimli, animasyonlu kategori menüsü ve her oyun için canlı döngü önizlemesi
- Kart çevirme hafıza modu ve hareketli balonlara dokunma modu
- 0–9 rakamlarını yalnızca rakam yüzeyinde çoklu çizgiyle çizme; hareketli iz rehberi, otomatik yakınlık kontrolü ve temiz rakama dönüşüm animasyonu
- Bölümü yeniden başlatma ve onaylı ilerleme sıfırlama kontrolleri
- Yönlendirmeli oyunlarda her 3–5 bölüm arasında 5–10 saniyelik demo reklam; ebeveyn işlemi arkasında kalıcı demo reklamsız seçenek
- Ses, titreşim, azaltılmış hareket ve ekran kilidi uyumu
- Yerel ilerleme kaydı; hiçbir kişisel veri veya ağ tabanlı analiz yok

## Reklam demosu

Mevcut reklam ekranı yalnızca yerel bir prototiptir; harici reklam isteği veya gerçek ödeme yapmaz. Üretim entegrasyonunda bu katman, çocuklara yönelik yaş işlemesi ve gizlilik ayarları yapılandırılmış bir Google reklam sağlayıcısıyla değiştirilmelidir.

## Yerel çalıştırma

Service worker yalnızca güvenli origin üzerinde çalışır. Proje klasöründe basit bir HTTP sunucusu başlatın:

```bash
python3 -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın.

## GitHub Pages

Manifest ve service worker yolları göreli tanımlanmıştır; bu nedenle proje sitesi olarak `https://bozukartr.github.io/evisgame/` altında çalışır.

## Dokun ve keşfet · v2.1

Ana menüde altı serbest oyun bulunur. Sıra ezberleme, doğru cevap, süre sınırı veya zorunlu bölüm geçişi yoktur:

- **Balonlar:** Her baloncuk patlatılır; boş alana dokunmak da renkli iz bırakır.
- **Neşeli müzik:** Davul, ksilofon ve zil görsellerindeki altı tuş beklemeden çalınır. Farklı tuşlar farklı notalar üretir.
- **Sihirli bahçe:** Filizlere dokunmak çiçekleri büyütür; açan çiçeklerden kelebekler çıkar.
- **Meyve bahçesi:** Her meyve toplanabilir, sepete uçar ve yeniden belirir.
- **Akvaryum:** Balıklar dokunulan yere ve parmağın hareketine doğru yüzer.
- **Işık şöleni:** Gökyüzüne dokunmak renkli yıldız patlamaları oluşturur; parmakla gezdirme de desteklenir.

Önceki eşleştirme, hafıza ve rakam çizme oyunları **Birlikte öğrenelim** alt menüsünde bulunur. Toplam altı serbest, yedi yönlendirmeli mod vardır.

### Görseller ve kullanım

- `assets/play/` içinde 12 özgün, yerel SVG: enstrümanlar, çiçek, kelebek, balık, kaplumbağa, roket, baloncuk ve meyveler.
- Dokunma, parmağı gezdirme ve çoklu dokunma; hareket iptali ve pencere odağı kaybında temizlenen giriş durumu.
- Serbest oyunlarda küçük ödüller oyunu durdurmaz ve reklam demosu açılmaz. Önceki yıldızlar ve oyun kayıtları korunur; keşif sayıları ayrıca kaydedilir.
- Hareket azaltma tercihi, sınırlı efekt sayısı ve ekran boyutuna göre yerleşim.
- Bahçe, Deniz ve Uzay dış dünya temaları korunur. Tüm JavaScript/SVG dosyaları çevrimdışı uygulama kabuğunda önbelleğe alınır.
- Klavyede Tab ile menü, yön tuşlarıyla oyuncak seçimi, Enter/Space ile etkileşim.

### Geliştirme kontrolü

`index.html` temel oyun döngüsünü, `playground.js` menüyü, `sensory.js` serbest oyunları, `touch-art.js` SVG yüklemeyi içerir. Framework veya derleme adımı gerekmez.

Node.js ve `@napi-rs/canvas` ile Canvas/oyun mantığı kontrolleri:

```bash
npm install --no-save @napi-rs/canvas
node tests/playground.cjs
```

`EVIS_RENDER_DIR=/tmp/evis-renders` ile Canvas ekran çıktıları alınır. Kontroller 13 modu dört ekran ölçüsünde çizer; SVG yüklenmesini, anında tepkiyi, kesintisiz oyunu, seri dokunmalarda efekt sınırını, çoklu dokunma/gezdirme/iptali ve kayıtları doğrular. Gerçek telefon tarayıcısının dokunma, ses, DOM ve PWA testinin yerine geçmez.
