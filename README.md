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

## Kule topu ve görsel yenilenme · v2.4

### Kule topu (yeni)

Dönen sarmal bir kulede zıplayan topu aşağı indiren yeni oyun, ana menünün ilk kartıdır.

- **Dokun:** top bir katı kırar. **Basılı tut:** top art arda katları parçalar. Parmağı kaldırınca top yeniden zıplar.
- Renkli dilimler kırılır; koyu dilimler kırılmaz, yalnızca topu yumuşak bir “boing” ile geri zıplatır. Kaybetme, süre veya can yoktur.
- Basılı tutarak art arda kırmak ateş göstergesini doldurur; dolunca top birkaç saniyeliğine alev alır ve koyu dilimleri de kırar.
- Altın zemine ulaşınca “Süper!” kutlaması, konfeti ve bir sonraki kule. Her seviye yeni renk teması, altıgen/sekizgen kat ve farklı sarmal dizilim getirir; seviye cihazda saklanır.
- Sahte 3D çizim: katlar elips izdüşümüyle, ışık yönüne göre gölgelenen yan duvarlarla ve arkadan öne sıralamayla Canvas'a çizilir. Kırılan katlar dönen parçalara ayrılır; top zıplarken ezilip uzar, sekmelerde boya lekesi bırakır, gözleriyle duygusunu gösterir.
- Tüm uzunluklar kat yarıçapının katıdır; ekran döndürülünce oyun durumu korunur. Parça, iz ve dalga sayıları sınırlıdır. Azaltılmış harekette sarsıntı, iz ve parçalar kapanır.

### Diğer oyunlara görsel iyileştirmeler

- **Canlı arka plan:** Bahçe'de kayan bulutlar ve ışınları dönen gülen güneş, Deniz'de yükselen kabarcıklar, Uzay'da parıldayan yıldızlar ve kayan yıldız.
- **Sahne geçişleri:** yeni ekran, dokunulan noktadan büyüyen renkli bir baloncukla açılır.
- **Menü:** kartlar sırayla yaylanarak gelir, üzerlerinden parlak bir ışık geçer; başlık harfleri renkli dalga yapar; Kule topu kartında canlı dönen kule önizlemesi ve “YENİ” etiketi. Meyve bahçesi “Diğer oyunlar” altına taşındı.
- **Açılış ekranı:** zıplayan ayıcık, etrafında dönen oyuncaklar ve nabız gibi atan başlat düğmesi.
- **Üst bilgi:** her oyunda simge rozeti ve bir sonraki yıldıza doğru dolan halka; öğrenme oyunlarında “0 / 2” yerine dolan yıldızlar.
- **Balonlar:** gökkuşağı yansımalı kenarlar, patlarken damlacıklar ve yaylanarak yeniden doğan balonlar.
- **Neşeli müzik:** çalınan enstrümanın rengine bürünen kart, yayılan ses dalgası ve sallanarak yükselen notalar.
- **Sihirli bahçe:** rüzgârda sallanan çimenler, uçuşan polenler, kanat çırpan kelebekler.
- **Meyve bahçesi:** dönerek ve iz bırakarak uçan meyveler, zıplayan ve dolan sepet, düşen yapraklar.
- **Akvaryum:** dalgalanan ışık huzmeleri, sallanan yosunlar, yükselen kabarcıklar, çakıllar.
- **Işık şöleni:** parlayan (ışık toplamalı) havai fişek parçacıkları, yerçekimi ve sürtünme, alevli roket izi, ay ve tepe silueti.
- **Oyuncakları devir:** sert çarpışmalarda toz bulutu; boya ve oyuncak ekranlarında dokunma halkaları artık görünür.
- **Hafıza:** dönerken ışık alan kartlar ve desenli kart sırtı. Konfeti 3D döner, bir kısmı yıldız şeklindedir.

Ayrıca sayfa açılırken erken gelen görüntü alanı olayında oluşan `buildBackground is not defined` hatası giderildi.

Testler 16 modu dört ekran ölçüsünde çizer; kuleyi dokunma/basılı tutma ile kırmayı, koyu dilimde yalnızca zıplamayı, ateş modunu, hedefe ulaşmayı, seviye kaydını, ekran ölçüsü değişimini, modal kilidini ve sahne geçişini doğrular. Gerçek Chromium'da konsol hatasız çalıştığı ve kule kırılırken 60 fps verdiği kontrol edildi. Gerçek telefonda dokunma, ses ve titreşim kontrolünün yerine geçmez.

## Yaşa göre menü ve 4+ hızlı oyunlar · v2.5

Ana menünün üstünde **2–3 yaş / 4+ yaş** seçici var; seçim cihazda hatırlanır.

- **2–3 yaş:** mevcut sakin dokun-keşfet oyunları (Boya dünyası, Oyuncakları devir, Balonlar, Neşeli müzik, Sihirli bahçe, Meyve bahçesi, Diğer oyunlar, Birlikte öğrenelim). Hiçbiri kaldırılmadı.
- **4+ yaş:** altı hypercasual oyun. Her birinin seviyesi, puanı, ilerleme çubuğu ve kartında “Sv” rozeti vardır. Kaybetmek hiçbir zaman çıkmaz sokak değildir: “Tekrar!” der ve aynı seviye bir an sonra yeniden kurulur.

| Oyun | Tür | Nasıl oynanır |
| --- | --- | --- |
| Kule topu | Stack Ball | Dokun / basılı tut, katları kır |
| Blok kulesi | Stack (zamanlama) | Kayan blok tam üstteyken dokun; taşan parça kesilip düşer, tam isabette “Mükemmel!” ve blok büyür |
| Meyve ninja | Fruit Ninja (kaydırma) | Parmağını meyvelerin üstünden kaydır; dikenli toplar kalp götürür, 3 kalp bitince seviye yeniden başlar; tek hamlede 3+ meyve kombo |
| Obur delik | Hole.io (sürükleme) | Deliği gezdir; kendinden küçük her şeyi yutar ve büyür. Park, plaj ve oyuncak odası temaları. Büyüme alan tabanlıdır, her seviye mutlaka bitirilebilir |
| Meyve birleştir | Suika (fizik) | Sürükle-bırak; aynı iki meyve birleşip bir büyüğüne dönüşür. Hedef meyveye ulaş; kavanoz taşarsa seviye yeniden başlar |
| Renk sırala | Ball sort (bulmaca) | Tüpe dokun, topu aynı renge taşı. Her bulmaca çözücüyle doğrulanır; geri al düğmesi ve takılınca ipucu var |

Ortak altyapı `arcade.js`: seviye akışı, kayıt (`evisgame-arcade-v1`), HUD, parçacıklar, kutlama ve yeniden deneme. Oyunlar `stack.js`, `slice.js`, `hole.js`, `merge.js`, `sort.js` içindedir. Meyve birleştir Matter.js ile sabit 400×520 kavanoz dünyasında sabit zaman adımıyla çalışır; ekran döndürmek durumu bozmaz. Tüm dosyalar çevrimdışı önbellektedir; “Tüm ilerlemeyi sıfırla” bu oyunların seviyelerini de sıfırlar.

Testler 21 modu dört ekran ölçüsünde çizer ve her yeni oyunun kurallarını doğrular: blok kesme/mükemmel/ıska/kazanma, kaydırarak kesme, kalpler ve sınırlı efektler, deliğin üç seviyede de sonuna kadar yenebildiği, meyve birleşmesi/bekleme süresi/iptal/taşma, üretilen sıralama bulmacalarının çözülebilirliği, geri alma ve kazanma, yaş seçici. Gerçek Chromium'da gerçek fare/dokunma girdisiyle her oyun oynandı: konsol hatası yok, 60 fps.

## Altı yeni 4+ oyun · v2.6

4+ menüsünde artık 12 oyun var; telefonda 3, yatay ekranda 6 sütunlu sık ızgara ile her kart dokunulabilir büyüklükte kalır. Yeni oyunlarda “YENİ” etiketi bulunur.

| Oyun | Tür | Nasıl oynanır |
| --- | --- | --- |
| Basket at | Sapan atışı (fizik) | Topu geri çek, noktalı yay önizlemesine bak, bırak. Çember iki nokta, pano bir çizgidir; çembere çarpıp dönme ve panodan sekme gerçekçidir. İnen topu potaya hafifçe çeken çocuk dostu yardım vardır. 3 ıska seviyeyi yeniden başlatır |
| Tuğla kır | Breakout | Bulut raketi parmakla kaydır; şeker tuğlaları kır. İki vuruşluk çatlayan tuğlalar, “+2 top” ve “kocaman raket” güçleri, 3 can |
| Balon atıcı | Bubble shooter | Nişan al, bırak; duvardan seken nişan çizgisi. 3 veya daha fazla aynı renk patlar, tutunamayan balonlar düşer. Sonraki seviyelerde tavan iner; kesikli çizgiye ulaşırsa yeniden dene |
| Zıpzıp | Doodle Jump | Kurbağa kendi zıplar, parmakla sağa sola yönlendir. Hareketli, kırılan ve yaylı platformlar, yıldızlar; yükseldikçe gökyüzü gece olur. Platform aralıkları zıplama yüksekliğini hiç aşmaz; bitişe yakın yay yoktur |
| Yol boya | Amaze (kaydırmalı bulmaca) | Kaydır ya da topun yanına dokun; top duvara kadar kayar ve yolu boyar. Labirentler kayma hamleleriyle oyulur; her seviye mutlaka bitirilebilir |
| Uçan kuş | Flappy Bird | Dokun, civciv kanat çırpsın. Geniş aralıklar, yavaş hız, ardışık aralıklar arasında büyük sıçrama yok; aralardaki yıldızlar ek puan |

Testler 27 modu dört ekran ölçüsünde çizer ve yeni oyunları doğrular: gerçek çek-bırak girdisiyle basket, ıska/kalp/iptal; tuğla kırma, can kaybı ve kazanma; balon patlatma, düşen balonlar ve çizgi kuralı; Zıpzıp'ın 1, 4 ve 7. seviyelerinin otomatik oyuncuyla sonuna kadar çıkılabildiği; labirentlerin 1, 4 ve 8. seviyede tamamen boyanabildiği; kuşun direklerden geçmesi ve çarpması. Rastgele üretilen seviyeler toplu olarak da denendi (60/60 labirent, 30/30 Zıpzıp, 30/30 Uçan kuş, 60/60 yardımlı basket, önizlemeye göre atılan 63/64 basket). Gerçek Chromium'da gerçek fare girdisiyle her oyun oynandı: konsol hatası yok, 60 fps.
