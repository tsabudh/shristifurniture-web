// Builds build/out/catalog.html (bilingual A4 catalog). Run via build/catalog.sh. Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'build', 'out');
const { categories, products } = JSON.parse(fs.readFileSync(path.join(OUT, 'catalog-data.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dev = (n) => String(n).replace(/\d/g, (d) => '०१२३४५६७८९'[d]);
const price = (p) => p.price == null
  ? '<span class="ask">Ask for price · मूल्य सोध्नुहोस्</span>'
  : `<b>Rs. ${new Intl.NumberFormat('en-IN').format(p.price)}</b> <span class="ne">रू ${dev(new Intl.NumberFormat('en-IN').format(p.price))}</span>`;
const PER_PAGE = 9;
let pages = '';
for (const c of categories) {
  const items = products.filter((p) => p.cat === c.key);
  for (let i = 0; i < items.length; i += PER_PAGE) {
    const chunk = items.slice(i, i + PER_PAGE);
    pages += `<section class="page"><header class="ph"><div><h2>${esc(c.en)}</h2><p class="ne">${esc(c.ne)}</p></div><span>Shristi Furniture · श्रृष्टि फर्निचर</span></header><div class="grid">${chunk.map((p) => `
<article><img src="thumbs/${p.key}.jpg" alt=""><h3>${esc(p.en)}</h3><p class="ne">${esc(p.ne)}</p><p class="pr">${price(p)}</p></article>`).join('')}</div>
<footer class="pf">${esc(c.en)} · ${esc(c.ne)}</footer></section>`;
  }
}
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shristi Furniture — Catalog / क्याटलग</title><style>
@page{size:A4;margin:0}*{box-sizing:border-box}
body{margin:0;font-family:"Noto Sans","Noto Sans Devanagari",sans-serif;color:#221a13;font-size:10pt}
.ne{font-family:"Noto Sans Devanagari","Noto Sans",sans-serif}
.page{width:210mm;height:297mm;padding:14mm 14mm 12mm;page-break-after:always;position:relative;overflow:hidden;background:#fbf9f5}
.cover{background:#1d1611;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:22mm 18mm}
.cover h1{font-size:44pt;line-height:1.05;margin:0 0 6mm;letter-spacing:-.02em}.cover .ne{font-size:28pt;line-height:1.4;margin:0 0 10mm;color:#f0c9a6}
.cover p{margin:0 0 3mm;font-size:12pt;max-width:130mm;color:#e9dfd2}.cover .k{color:#f0c9a6;font-size:9pt;letter-spacing:.18em;text-transform:uppercase;margin-bottom:6mm}
.cover .hero{width:100%;height:100mm;object-fit:cover;border-radius:6mm;margin:6mm 0}
.ph{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #9a4f20;padding-bottom:4mm;margin-bottom:6mm}
.ph h2{margin:0;font-size:22pt;line-height:1.1}.ph .ne{margin:1mm 0 0;font-size:13pt;color:#9a4f20}.ph span{font-size:8pt;color:#6a5d50}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm 5mm}
article img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:3mm;background:#e8e0d4;display:block}
article h3{font-size:9.5pt;margin:2.5mm 0 .5mm;line-height:1.25}article .ne{margin:0;font-size:9pt;color:#6a5d50;line-height:1.5}
.pr{margin:1.5mm 0 0;font-size:8.5pt}.ask{color:#6a5d50}
.pf{position:absolute;left:14mm;right:14mm;bottom:7mm;font-size:7.5pt;color:#8c7f71;border-top:1px solid #e6ddd0;padding-top:2mm}
.end h2{font-size:24pt;margin:0 0 3mm}.end .ne{font-size:16pt;color:#9a4f20;margin:0 0 8mm}.end ul{padding-left:5mm;line-height:1.9}.end .box{margin-top:10mm;padding:8mm;border-radius:4mm;background:#f2ede4}
</style></head><body>
<section class="page cover"><div><p class="k">Showroom &amp; workshop · Kathmandu</p><h1>Shristi<br>Furniture</h1><p class="ne">श्रृष्टि फर्निचर — क्याटलग</p><p>Furniture for homes, offices, hotels and shops. Ready-made or built to your size, wood and finish.</p><p class="ne">घर, कार्यालय, होटल र पसलका लागि फर्निचर। तयारी वा तपाईँको नाप, काठ र फिनिशमा बनाइने।</p></div>
<img class="hero" src="thumbs/bed-single.jpg" alt=""><div><p>Phone / फोन: +977 98XXXXXXXX &nbsp;·&nbsp; WhatsApp: +977 98XXXXXXXX</p><p>Prices in Nepali rupees (रू). Photos are for style reference. / मूल्य नेपाली रुपैयाँमा। फोटो शैली हेर्नका लागि हो।</p></div></section>
${pages}
<section class="page end"><h2>Services</h2><p class="ne">सेवाहरू</p><ul><li>Made-to-order furniture · नापअनुसार बनाइने फर्निचर</li><li>Modular kitchen &amp; wardrobe · मोड्युलर किचन र वार्डरोब</li><li>Repair, polish &amp; painting · मर्मत, पालिश र रङरोगन</li><li>Re-upholstery · रि-अप्होल्स्ट्री</li><li>Home &amp; office interior fit-outs · घर र कार्यालयको इन्टेरियर</li></ul>
<div class="box"><p><b>Visit or call us · भेट्नुहोस् वा फोन गर्नुहोस्</b></p><p>+977 98XXXXXXXX · WhatsApp · Sunday–Friday 10:00–18:00 / आइतबार–शुक्रबार बिहान १०:०० – साँझ ६:००</p><p>shristifurniture.com.np</p></div></section>
</body></html>`;
fs.writeFileSync(path.join(OUT, 'catalog.html'), html);
console.log('catalog.html written;', products.length, 'products');
