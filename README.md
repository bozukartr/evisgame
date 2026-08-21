# EvisGame

EvisGame, 2–4 yaş çocuklar için tasarlanmış sakin ve cezasız bir mini oyun koleksiyonudur. Renk, şekil, boyut, sayı ve hayvan eşleştirmelerine ek olarak kart hafıza, hareketli balon yakalama ve rakam çizme modları sunar.

## Özellikler

- iPhone ve Android için kurulabilir PWA
- Çevrimdışı oyun ve otomatik uygulama kabuğu önbelleği
- Normal, iOS ve Android maskable ikon setleri
- Safe-area, yüksek DPI, yatay/dikey ekran ve çoklu dokunma desteği
- Sürükle-bırak ve dokun-yerleştir kontrolleri
- Kart çevirme hafıza modu ve hareketli balonlara dokunma modu
- 0–9 rakamlarını çoklu çizgiyle çizme; eksik ve taşan çizgileri birlikte değerlendiren toleranslı yakınlık kontrolü
- Bölümü yeniden başlatma ve onaylı ilerleme sıfırlama kontrolleri
- Ses, titreşim, azaltılmış hareket ve ekran kilidi uyumu
- Yerel ilerleme kaydı; hiçbir kişisel veri veya ağ tabanlı analiz yok

## Yerel çalıştırma

Service worker yalnızca güvenli origin üzerinde çalışır. Proje klasöründe basit bir HTTP sunucusu başlatın:

```bash
python3 -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın.

## GitHub Pages

Manifest ve service worker yolları göreli tanımlanmıştır; bu nedenle proje sitesi olarak `https://bozukartr.github.io/evisgame/` altında çalışır.
