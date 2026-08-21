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
