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

## Boya Dünyası ve Oyuncakları Devir · v2.2

İki yeni oyun ana menünün ilk sırasında bulunur. Akvaryum ve Işık Şöleni, Diğer oyunlar kartından açılır. Toplam 15 mod vardır.

### Boya Dünyası

- Altı renk, kalın ve yumuşak uçlu fırça, kesintisiz gökkuşağı çizgileri, yıldız/kalp damgaları ve silgi.
- Birden fazla parmakla birbirine bağlanmayan ayrı çizgiler; ekran çevrildiğinde oranı korunan tuval.
- Son 48 işlemi geri alma. Tuvali temizlemek de geri alınabilir; eski işlemler çizimden silinmeden temel resme birleştirilir.
- Menüye dönünce aynı çizim korunur. Cihaz depolaması uygunsa çizim PNG olarak otomatik kaydedilir. Kayıt yapılamasa da oturumdaki çizim korunur.
- Çizim Canvas üzerinde önbelleğe alınır; her animasyon karesinde tüm çizgiler yeniden çizilmez.

### Oyuncakları Devir

- Gerçek çarpışmalar, yerçekimi, sürtünme, dönüş ve sekme. Dokunarak itme; sürükleyerek kaldırma ve bırakma.
- Piramit, köprü ve domino düzenleri. Aynı yapıyı tekrar kurma, başka yapıya geçme ve top ekleme düğmeleri.
- Çoklu dokunma için ayrı sürükleme bağlantıları. Menüye çıkıldığında ve dokunma iptalinde bağlantılar temizlenir.
- Sabit fizik zaman adımı, uyuyan cisimler ve en fazla 24 oyuncak ile sınırlı işlem yükü.

Fizik motoru Matter.js 0.20.0 yerel olarak `vendor/` içinde bulunur; çalışma sırasında CDN isteği yapılmaz. MIT lisansı `vendor/MATTER-LICENSE.txt` içindedir. Yeni scriptler ve SVG kapaklar çevrimdışı önbelleğe dahildir.

Testler ayrıca boya çizgisi, geri alınabilir temizleme, çoklu parmak, sınırlı geçmiş, kayıt ve menüden dönüşü; oyuncakların zeminde kalmasını, devrilmesini, üç düzeni, sürükleme bağlantılarının temizlenmesini ve cisim sınırını doğrular.

## Canlı oyuncaklar · v2.3

`personality.js`, SVG gövdelerinin üzerine durumu korunan vektör yüzler çizer. Altı mizaç: Meraklı, Neşeli, Çekingen, Uykucu, Şakacı ve Sevecen. Her birinin göz oranı, göz kırpma aralığı, hareket enerjisi ve kısa ses tonu farklıdır. Çekingen daha yavaş gülümser ve dokunulunca kızarır; Uykucu daha erken mahmurlaşır; Şakacı kıkırdarken göz kırpar; Sevecen'in tepki vurguları kalptir. Blokların küçük amblemleri kişiliklerini dinlenirken de ayırt eder.

- Parmak takibi oyuncak dönüşü ve balıkların ayna yönü hesaba katılarak yapılır. Çoklu dokunmada tutulan oyuncak kendi parmağına, diğerleri en yakın parmağa bakar.
- Tutulma, havalanma, çarpışma, toparlanıp gülme, selamlama, seri dokunmada kıkırdama ve dinlenme durumları vardır. Göz, kaş, ağız ve gövde bağımsız, yumuşak geçişlerle güncellenir.
- Çarpışma sonrası yay hareketi en fazla %9 gövde deformasyonu üretir; fizik geometrisini değiştirmez. Tekrarlanan temaslarda 420 ms tepki aralığı, seslerde genel ve oyuncak başına sınır bulunur.
- Menü, arka plan ve pointer iptali tutulma durumunu temizler. Yeni zamanlayıcı veya ayrı animasyon döngüsü açılmaz.
- 12 yeni blok/top SVG gövdesi; eğimler, parlak kenarlar, yüzey çizgileri ve yumuşak ışık katmanları içerir. 11 oyun nesnesinin yüzsüz SVG sürümü animasyon yüzüyle birleşir; sabit ve hareketli gözler üst üste çizilmez. 37 SVG ve karakter scripti çevrimdışı önbelleğe dahildir.
- Azaltılmış hareket tercihinde gövde sallanması, esneme, yan vurgu parçacıkları ve göz kırpma kaldırılır; dokunma ve yüz ifadeleri çalışmaya devam eder.

Testler 15 modu dört ölçüde çizer; karakter durum önceliği, temas tekrar sınırı, kıkırdama, uyanma, dönen/aynalı bakışlar, pointer iptali ve fizik geometrisinin korunmasını doğrular. `EVIS_REDUCED=1 node tests/playground.cjs` azaltılmış hareketi kontrol eder. `EVIS_RENDER_DIR` ayrıca altı kişiliğin ifade tablosunu ve 90 karelik tutulma–bırakılma–iniş animasyonunu üretir. Bunlar gerçek Canvas ve oyun mantığı testleridir; gerçek telefon tarayıcısındaki dokunma, ses, kare hızı ve PWA kontrolünün yerine geçmez.
