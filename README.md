# EvisGame

EvisGame, 2–4 yaş çocuklar için tasarlanmış sakin ve cezasız bir mini oyun koleksiyonudur. Renk, şekil, boyut, sayı ve hayvan eşleştirmelerine ek olarak kart hafıza, hareketli balon yakalama ve rakam çizme modları sunar.

## Özellikler

- iPhone ve Android için kurulabilir PWA
- Çevrimdışı oyun ve otomatik uygulama kabuğu önbelleği
- Normal, iOS ve Android maskable ikon setleri
- Safe-area, yüksek DPI, yatay/dikey ekran ve çoklu dokunma desteği
- Sürükle-bırak ve dokun-yerleştir kontrolleri
- Yazısız, animasyonlu kategori menüsü ve her oyun için canlı döngü önizlemesi
- Kart çevirme hafıza modu ve hareketli balonlara dokunma modu
- 0–9 rakamlarını yalnızca rakam yüzeyinde çoklu çizgiyle çizme; hareketli iz rehberi, otomatik yakınlık kontrolü ve temiz rakama dönüşüm animasyonu
- Bölümü yeniden başlatma ve onaylı ilerleme sıfırlama kontrolleri
- Her 3–5 oyun arasında 5–10 saniyelik demo reklam; ebeveyn işlemi arkasında kalıcı demo reklamsız seçenek
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

## Mobil oyun bahçesi · v2

- 11 mini oyun: mevcut sekiz oyuna meyve toplama, müzik sırası ve örüntü tamamlama eklendi.
- Bahçe, Deniz ve Uzay dünyaları; dünya tercihi cihazda saklanır.
- Büyük resimli kartlar, dokunmatik alanlarla aynı konumdaki erişilebilir menü düğmeleri, bölüm HUD'ı ve tamamlanma rozetleri.
- Canvas ile çözünürlükten bağımsız meyveler, sepetler, müzik tuşları ve detaylandırılmış hayvanlar. Harici resim isteği yok.
- Meyve bahçesinde sepette gösterilen türü toplayın. Müzik atölyesinde ışıklı sırayı izleyip tekrarlayın; dairesel ok gösterimi tekrar oynatır. Örüntü oyununda eksik şekli seçin.
- Klavyede yön tuşları seçim, Enter/Space etkileşim sağlar. Menü düğmeleri Tab ile seçilebilir.
- Mevcut kayıt anahtarı ve ebeveyn/reklam demo akışı korunur. Yeni dosya service worker önbelleğine dahil edilmiştir.

### Geliştirme kontrolü

`index.html` temel oyun döngüsünü, `playground.js` görsel dünyaları, menüyü ve yeni mini oyunları içerir. Framework veya derleme adımı gerekmez.

Canvas ve oyun mantığı kontrolleri için Node.js ve `@napi-rs/canvas` gerekir:

```bash
npm install --no-save @napi-rs/canvas
node tests/playground.cjs
```

İsteğe bağlı `EVIS_RENDER_DIR=/tmp/evis-renders` değişkeniyle Canvas ekran çıktıları alınır. Kontroller dört ekran ölçüsünde 11 modun çizimini, yeni oyunların tamamlanmasını, yanlış seçimleri, müzik gösterimi sırasında giriş kilidini ve ilerleme kaydını doğrular. Bu kontroller gerçek telefon tarayıcısının dokunma, ses ve PWA testinin yerine geçmez.
