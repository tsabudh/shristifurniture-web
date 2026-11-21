// Zero-dependency static site generator. Usage: node build/build.mjs
// Writes HTML (English at /, Nepali at /ne/), sitemap and the catalog source into public/ and build/out/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EN, NE } from './data/strings.mjs';
import { CATEGORIES, PRODUCTS } from './data/products.mjs';
import { SERVICES } from './data/services.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'build', 'out');
const SITE = 'https://shristifurniture.com.np';
const CATALOG = '/catalog/shristi-furniture-catalog.pdf';
// TODO(owner): real numbers. Digits only with country code for WhatsApp.
const WA = '9779800000000';
const PHONE = '+9779800000000';
const PHONE_TEXT = '+977 98XXXXXXXX';
const LANGS = { en: EN, ne: NE };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = (n, lang) => new Intl.NumberFormat(lang === 'ne' ? 'ne-NP-u-nu-deva' : 'en-IN').format(n);
const L = (lang) => (lang === 'ne' ? '/ne' : '');
const href = (lang, p) => L(lang) + p;

// ---------- data ----------
const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
const prices = loadPrices();
const products = PRODUCTS.map(([slug, cat, nameEn, nameNe, descEn, descNe], i) => {
  const key = slug.split('/')[1];
  const dir = path.join(PUB, 'images', 'products', slug);
  if (!fs.existsSync(dir)) throw new Error(`No images for ${slug}`);
  const images = fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).sort().map((f) => `/images/products/${slug}/${f}`);
  if (!images.length) throw new Error(`Empty image folder: ${slug}`);
  return { i, slug, key, cat, en: { name: nameEn, desc: descEn }, ne: { name: nameNe, desc: descNe }, images, price: prices.get(key) ?? null };
});
const byKey = Object.fromEntries(products.map((p) => [p.key, p]));
const imgsOf = (dirSlug) => {
  const dir = path.join(PUB, 'images', 'products', dirSlug);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).sort().map((f) => `/images/products/${dirSlug}/${f}`);
};

function loadPrices() {
  const file = path.join(ROOT, 'build', 'data', 'prices.csv');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, 'slug,price_npr\n' + PRODUCTS.map((p) => `${p[0].split('/')[1]},`).join('\n') + '\n');
  }
  const m = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/).slice(1)) {
    const [slug, v] = line.split(',').map((s) => s?.trim());
    if (!slug || !v) continue;
    const n = Number(v.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(n) || n <= 0) throw new Error(`Bad price for ${slug}: ${v}`);
    m.set(slug, n);
  }
  return m;
}

// ---------- helpers ----------
const priceHtml = (p, lang) => {
  const t = LANGS[lang];
  if (p.price == null) return `<span class="price ask">${esc(t.ask_price)}</span>`;
  const sym = lang === 'ne' ? 'रू' : 'Rs.';
  return lang === 'ne'
    ? `<span class="price">${sym} ${nf(p.price, lang)} <span class="from">${esc(t.from)}</span></span>`
    : `<span class="price"><span class="from">${esc(t.from)}</span> ${sym} ${nf(p.price, lang)}</span>`;
};
const waLink = (lang, name) => `https://wa.me/${WA}?text=${encodeURIComponent(`${LANGS[lang].wa_hi} ${name}`)}`;
const waGeneral = (lang) => `https://wa.me/${WA}?text=${encodeURIComponent(LANGS[lang].wa_hi_general)}`;
const pUrl = (lang, p) => href(lang, `/product/${p.key}/`);

function card(p, lang) {
  const t = LANGS[lang];
  const name = p[lang].name;
  const second = p.images[1] ? `<img class="alt" src="${p.images[1]}" alt="" loading="lazy" decoding="async">` : '';
  return `<article class="card" data-cat="${p.cat}" data-i="${p.i}" data-name="${esc((p.en.name + ' ' + p.ne.name).toLowerCase())}" data-price="${p.price ?? ''}">
  <a class="card-img" href="${pUrl(lang, p)}" aria-label="${esc(name)}"><img src="${p.images[0]}" alt="${esc(name)}" loading="lazy" decoding="async">${second}</a>
  <div class="card-body"><p class="card-cat">${esc(catMap[p.cat][lang])}</p><h3><a href="${pUrl(lang, p)}">${esc(name)}</a></h3>
  <div class="card-row">${priceHtml(p, lang)}<a class="wa-link" href="${waLink(lang, name)}" rel="noopener">${esc(t.enquire)}</a></div></div></article>`;
}

const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a14 14 0 0 1-5.7-5c-.4-.6-1.4-1.9-1.4-3.2s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.3-.1.6a8 8 0 0 0 2.6 2.4c.3.2.5.1.7-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z"/></svg>';

// ---------- layout ----------
function layout({ lang, p, title, desc, body, og, bodyClass = '' }) {
  const t = LANGS[lang];
  const other = lang === 'en' ? 'ne' : 'en';
  const nav = [['/', t.nav_home], ['/shop/', t.nav_shop], ['/services/', t.nav_services], ['/gallery/', t.nav_gallery], ['/about/', t.nav_about], ['/contact/', t.nav_contact]];
  const brand = lang === 'ne' ? t.brandNe : t.brand;
  const ogImg = SITE + (og || '/images/og.jpg');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${href(lang, p)}">
<link rel="alternate" hreflang="en" href="${SITE}${p}">
<link rel="alternate" hreflang="ne" href="${SITE}/ne${p}">
<link rel="alternate" hreflang="x-default" href="${SITE}${p}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${ogImg}">
<meta property="og:url" content="${SITE}${href(lang, p)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${lang === 'ne' ? 'ne_NP' : 'en_US'}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">${esc(t.skip)}</a>
<header class="bar">
  <div class="wrap bar-in">
    <a class="brand" href="${href(lang, '/')}" aria-label="${esc(brand)}"><img src="/favicon.svg" alt="" width="30" height="30"><span>${esc(brand)}</span></a>
    <div class="bar-right">
      <a class="lang" href="${href(other, p)}" hreflang="${other}" lang="${other}" aria-label="${esc(t.lang_other_label)}">${esc(t.lang_other)}</a>
      <a class="pill pill-line" href="${CATALOG}" download>${esc(t.catalog)}</a>
      <button class="menu-btn" aria-expanded="false" aria-controls="overlay"><span class="menu-label">${esc(t.menu)}</span><span class="menu-icon" aria-hidden="true"></span></button>
    </div>
  </div>
</header>
<div id="overlay" class="overlay" hidden>
  <div class="wrap overlay-in">
    <button class="overlay-close" aria-label="${esc(t.close)}">${esc(t.close)} ×</button>
    <nav aria-label="Main">${nav.map(([u, l]) => `<a href="${href(lang, u)}">${esc(l)}</a>`).join('')}</nav>
    <div class="overlay-foot"><a class="btn btn-primary" href="${CATALOG}" download>${esc(t.catalog_dl)}</a><a class="lang-big" href="${href(other, p)}" hreflang="${other}" lang="${other}">${esc(t.lang_other)}</a></div>
  </div>
</div>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-grid">
    <div><p class="foot-brand">${esc(brand)}</p><p class="muted">${esc(t.footer_p)}</p><a class="btn btn-primary" href="${CATALOG}" download>${esc(t.catalog_dl)}</a></div>
    <div><p class="foot-h">${esc(t.footer_links)}</p><ul>${nav.map(([u, l]) => `<li><a href="${href(lang, u)}">${esc(l)}</a></li>`).join('')}</ul></div>
    <div><p class="foot-h">${esc(t.footer_contact)}</p><ul><li><a href="tel:${PHONE}">${PHONE_TEXT}</a></li><li><a href="https://wa.me/${WA}" rel="noopener">${esc(t.whatsapp)}</a></li><li>${esc(t.hours_v)}</li></ul></div>
  </div>
  <div class="wrap foot-bar"><p>&copy; <span data-year>2026</span> ${esc(brand)}. ${esc(t.rights)}</p><a href="#top">${esc(t.back_top)} ↑</a></div>
</footer>
<script src="/site.js" defer></script>
</body>
</html>
`;
}

const write = (rel, html) => {
  const f = path.join(PUB, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
};
const pageFile = (lang, p) => (lang === 'ne' ? 'ne' : '') + p + 'index.html';

// ---------- pages ----------
function home(lang) {
  const t = LANGS[lang];
  const hero = byKey['bed-single'].images.find((f) => f.includes('35236646')) || byKey['bed-single'].images[0];
  const cats = CATEGORIES.map((c) => {
    const ps = products.filter((p) => p.cat === c.key);
    return `<a class="tile reveal" href="${href(lang, '/shop/')}?c=${c.key}"><img src="${ps[0].images[0]}" alt="" loading="lazy" decoding="async"><div class="tile-body"><h3>${esc(c[lang])}</h3><p>${nf(ps.length, lang)} ${esc(t.items)}</p></div></a>`;
  }).join('');
  const featKeys = ['sofa-set', 'bed-double', 'dining-set-6', 'wardrobe-hinged', 'chair-ergonomic', 'tv-stand', 'newari-door', 'bed-single'];
  const feat = featKeys.map((k) => card(byKey[k], lang)).join('');
  const svcs = SERVICES.map((s, n) => `<a class="svc reveal" href="${href(lang, `/services/${s.slug}/`)}"><span class="svc-n">${lang === 'ne' ? nf(n + 1, 'ne') : String(n + 1).padStart(2, '0')}</span><div><h3>${esc(s[lang].title)}</h3><p>${esc(s[lang].short)}</p></div><span class="svc-go" aria-hidden="true">→</span></a>`).join('');
  const gal = galleryItems(lang).slice(0, 6).map((g) => `<a class="gal-i reveal" href="${g.href}"><img src="${g.src}" alt="${esc(g.label)}" loading="lazy" decoding="async"><span>${esc(g.label)}</span></a>`).join('');
  const body = `
<section class="hero" id="top"><img class="hero-img" src="${hero}" alt="" fetchpriority="high"><div class="hero-shade"></div>
 <div class="wrap hero-in"><p class="eyebrow">${esc(t.hero_eyebrow)}</p><h1>${esc(t.hero_h1)}</h1><p class="lede">${esc(t.hero_lede)}</p>
 <div class="cta-row"><a class="btn btn-primary" href="${href(lang, '/shop/')}">${esc(t.hero_cta)}</a><a class="btn btn-ghost" href="${waGeneral(lang)}" rel="noopener">${WA_ICON} ${esc(t.cta_wa)}</a></div></div>
 <ul class="wrap hero-stats"><li><strong>${esc(t.stat1)}</strong><span>${esc(t.stat1s)}</span></li><li><strong>${esc(t.stat2)}</strong><span>${esc(t.stat2s)}</span></li><li><strong>${esc(t.stat3)}</strong><span>${esc(t.stat3s)}</span></li></ul></section>
<section class="section"><div class="wrap"><header class="sec-head reveal"><p class="eyebrow">${esc(t.cats_eyebrow)}</p><h2>${esc(t.cats_h2)}</h2><p class="muted lead">${esc(t.cats_lede)}</p></header><div class="tiles">${cats}</div></div></section>
<section class="section alt"><div class="wrap"><header class="sec-head row reveal"><div><p class="eyebrow">${esc(t.feat_eyebrow)}</p><h2>${esc(t.feat_h2)}</h2></div><a class="more" href="${href(lang, '/shop/')}">${esc(t.view_all)} →</a></header><div class="grid">${feat}</div></div></section>
<section class="section"><div class="wrap"><header class="sec-head reveal"><p class="eyebrow">${esc(t.svc_eyebrow)}</p><h2>${esc(t.svc_h2)}</h2><p class="muted lead">${esc(t.svc_lede)}</p></header><div class="svc-list">${svcs}</div></div></section>
<section class="banner"><div class="wrap banner-in reveal"><div><h2>${esc(t.cat_banner_h2)}</h2><p>${esc(t.cat_banner_p)}</p></div><a class="btn btn-light" href="${CATALOG}" download>${esc(t.catalog_dl)} ↓</a></div></section>
<section class="section"><div class="wrap"><header class="sec-head row reveal"><div><p class="eyebrow">${esc(t.gal_eyebrow)}</p><h2>${esc(t.gal_h2)}</h2></div><a class="more" href="${href(lang, '/gallery/')}">${esc(t.nav_gallery)} →</a></header><div class="gal-grid">${gal}</div></div></section>
<section class="section cta-sec"><div class="wrap cta-in reveal"><h2>${esc(t.cta_h2)}</h2><p>${esc(t.cta_p)}</p><div class="cta-row"><a class="btn btn-primary" href="${waGeneral(lang)}" rel="noopener">${WA_ICON} ${esc(t.cta_wa)}</a><a class="btn btn-line" href="${href(lang, '/contact/')}">${esc(t.nav_contact)}</a></div></div></section>`;
  return layout({ lang, p: '/', title: `${lang === 'ne' ? t.brandNe : t.brand} — ${t.hero_h1}`, desc: t.hero_lede, body, og: hero });
}

function shop(lang) {
  const t = LANGS[lang];
  const chips = [`<a class="chip on" href="${href(lang, '/shop/')}" data-c="">${esc(t.all)} <small>${nf(products.length, lang)}</small></a>`]
    .concat(CATEGORIES.map((c) => `<a class="chip" href="${href(lang, '/shop/')}?c=${c.key}" data-c="${c.key}">${esc(c[lang])} <small>${nf(products.filter((p) => p.cat === c.key).length, lang)}</small></a>`)).join('');
  const hasPrices = products.some((p) => p.price != null);
  const body = `
<section class="page-head" id="top"><div class="wrap"><h1>${esc(t.shop_h1)}</h1><p class="muted lead">${esc(t.shop_lede)}</p></div></section>
<section class="section tight"><div class="wrap">
 <div class="toolbar"><div class="chips" role="group" aria-label="${esc(t.cats_eyebrow)}">${chips}</div>
 <label class="sort"><span>${esc(t.sort)}</span><select id="sort"><option value="feat">${esc(t.sort_feat)}</option><option value="az">${esc(t.sort_az)}</option>${hasPrices ? `<option value="lo">${esc(t.sort_lo)}</option><option value="hi">${esc(t.sort_hi)}</option>` : ''}</select></label></div>
 <p class="count" aria-live="polite" data-tpl="${esc(t.showing_tpl)}" data-lang="${lang}">${esc(t.showing_tpl.replace('{n}', nf(products.length, lang)).replace('{t}', nf(products.length, lang)))}</p>
 <div class="grid" id="grid">${products.map((p) => card(p, lang)).join('')}</div>
</div></section>`;
  return layout({ lang, p: '/shop/', title: `${t.shop_h1} — ${lang === 'ne' ? t.brandNe : t.brand}`, desc: t.shop_lede, body });
}

function product(lang, p) {
  const t = LANGS[lang];
  const name = p[lang].name;
  const slides = p.images.map((src, n) => `<figure class="slide"><img src="${src}" alt="${esc(name)} ${n + 1}" ${n ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" draggable="false"></figure>`).join('');
  const dots = p.images.map((_, n) => `<button class="dot${n ? '' : ' on'}" aria-label="${n + 1}" data-n="${n}"></button>`).join('');
  const rel = products.filter((x) => x.cat === p.cat && x.i !== p.i).slice(0, 4);
  const body = `
<section class="section tight" id="top"><div class="wrap">
 <nav class="crumbs" aria-label="Breadcrumb"><a href="${href(lang, '/shop/')}">${esc(t.breadcrumb_shop)}</a> / <a href="${href(lang, '/shop/')}?c=${p.cat}">${esc(catMap[p.cat][lang])}</a></nav>
 <div class="prod">
  <div class="gallery" data-gallery><div class="track" tabindex="0" aria-label="${esc(name)}">${slides}</div>
   ${p.images.length > 1 ? `<div class="g-ctl"><button class="g-prev" aria-label="${esc(t.prev)}">←</button><span class="g-hint">${esc(t.drag)}</span><button class="g-next" aria-label="${esc(t.next)}">→</button></div><div class="dots">${dots}</div>` : ''}</div>
  <div class="info"><p class="eyebrow">${esc(catMap[p.cat][lang])}</p><h1>${esc(name)}</h1><p class="lead">${esc(p[lang].desc)}</p>
   <div class="info-price">${priceHtml(p, lang)}${p.price == null ? '' : `<small class="muted">${esc(t.prod_price)}</small>`}</div>
   <div class="cta-row"><a class="btn btn-primary" href="${waLink(lang, name)}" rel="noopener">${WA_ICON} ${esc(t.enquire)}</a><a class="btn btn-line" href="${CATALOG}" download>${esc(t.catalog)} ↓</a></div>
   <ul class="ticks"><li>${esc(t.prod_feat1)}</li><li>${esc(t.prod_feat2)}</li><li>${esc(t.prod_feat3)}</li></ul></div>
 </div></div></section>
<section class="section alt"><div class="wrap"><header class="sec-head"><h2>${esc(t.related)}</h2></header><div class="grid">${rel.map((x) => card(x, lang)).join('')}</div></div></section>`;
  return layout({ lang, p: `/product/${p.key}/`, title: `${name} — ${lang === 'ne' ? t.brandNe : t.brand}`, desc: p[lang].desc, body, og: p.images[0] });
}

function servicesIndex(lang) {
  const t = LANGS[lang];
  const items = SERVICES.map((s, n) => `<a class="svc-card reveal" href="${href(lang, `/services/${s.slug}/`)}"><img src="${imgsOf(s.images[0])[0]}" alt="" loading="lazy" decoding="async"><div><span class="svc-n">${lang === 'ne' ? nf(n + 1, 'ne') : String(n + 1).padStart(2, '0')}</span><h3>${esc(s[lang].title)}</h3><p>${esc(s[lang].short)}</p><span class="more">${esc(t.learn_more)} →</span></div></a>`).join('');
  const body = `<section class="page-head" id="top"><div class="wrap"><h1>${esc(t.svc_h1)}</h1><p class="muted lead">${esc(t.svc_idx_lede)}</p></div></section><section class="section tight"><div class="wrap svc-cards">${items}</div></section>`;
  return layout({ lang, p: '/services/', title: `${t.svc_h1} — ${lang === 'ne' ? t.brandNe : t.brand}`, desc: t.svc_idx_lede, body });
}

function service(lang, s) {
  const t = LANGS[lang];
  const c = s[lang];
  const imgs = s.images.flatMap((d) => imgsOf(d).slice(0, 3));
  const steps = c.steps.map(([h, d], n) => `<li class="step reveal"><span class="step-n">${lang === 'ne' ? nf(n + 1, 'ne') : String(n + 1).padStart(2, '0')}</span><h3>${esc(h)}</h3><p>${esc(d)}</p></li>`).join('');
  const others = SERVICES.filter((x) => x.slug !== s.slug).map((x) => `<a class="chip" href="${href(lang, `/services/${x.slug}/`)}">${esc(x[lang].title)}</a>`).join('');
  const body = `
<section class="page-head" id="top"><div class="wrap"><nav class="crumbs"><a href="${href(lang, '/services/')}">${esc(t.svc_h1)}</a></nav><h1>${esc(c.title)}</h1><p class="muted lead">${esc(c.lead)}</p><div class="cta-row"><a class="btn btn-primary" href="${waLink(lang, c.title)}" rel="noopener">${WA_ICON} ${esc(t.request_quote)}</a></div></div></section>
<section class="section tight"><div class="wrap"><div class="svc-photos">${imgs.map((src) => `<img src="${src}" alt="" loading="lazy" decoding="async">`).join('')}</div></div></section>
<section class="section alt"><div class="wrap"><header class="sec-head"><h2>${esc(t.process)}</h2></header><ol class="steps">${steps}</ol></div></section>
<section class="section"><div class="wrap split"><div><h2>${esc(c.materialsTitle)}</h2></div><ul class="ticks big">${c.materials.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div></section>
<section class="section cta-sec"><div class="wrap cta-in"><h2>${esc(t.cta_h2)}</h2><p>${esc(t.cta_p)}</p><div class="cta-row"><a class="btn btn-primary" href="${waLink(lang, c.title)}" rel="noopener">${WA_ICON} ${esc(t.request_quote)}</a></div></div></section>
<section class="section tight"><div class="wrap"><p class="eyebrow">${esc(t.other_services)}</p><div class="chips">${others}</div></div></section>`;
  return layout({ lang, p: `/services/${s.slug}/`, title: `${c.title} — ${lang === 'ne' ? t.brandNe : t.brand}`, desc: c.lead, body, og: imgs[0] });
}

function galleryItems(lang) {
  const items = [];
  for (const src of byKey['bed-single'].images) items.push({ src, label: byKey['bed-single'][lang].name, href: pUrl(lang, byKey['bed-single']) });
  for (const k of ['hotel-room', 'cafe-furniture', 'lobby-sofas', 'dining-set-6', 'sofa-set', 'wardrobe-hinged', 'bed-king', 'workstation']) {
    const p = byKey[k]; items.push({ src: p.images[0], label: p[lang].name, href: pUrl(lang, p) });
  }
  for (const s of [SERVICES[1], SERVICES[4]]) for (const src of s.images.flatMap((d) => imgsOf(d).slice(0, 2))) items.push({ src, label: s[lang].title, href: href(lang, `/services/${s.slug}/`) });
  // spread single beds and others so the first few are varied
  const beds = items.slice(0, 12), rest = items.slice(12), mixed = [];
  while (beds.length || rest.length) { if (rest.length) mixed.push(rest.shift()); if (beds.length) mixed.push(beds.shift()); if (beds.length) mixed.push(beds.shift()); }
  return mixed;
}

function gallery(lang) {
  const t = LANGS[lang];
  const items = galleryItems(lang).map((g) => `<li class="reveal"><a href="${g.href}"><img src="${g.src}" alt="${esc(g.label)}" loading="lazy" decoding="async"><span>${esc(g.label)}</span></a></li>`).join('');
  const body = `<section class="page-head" id="top"><div class="wrap"><h1>${esc(t.gal_h2)}</h1><p class="muted lead">${esc(t.gal_lede)}</p></div></section><section class="section tight"><div class="wrap"><ul class="masonry">${items}</ul></div></section>`;
  return layout({ lang, p: '/gallery/', title: `${t.nav_gallery} — ${lang === 'ne' ? t.brandNe : t.brand}`, desc: t.gal_lede, body });
}

function about(lang) {
  const t = LANGS[lang];
  const img = imgsOf('services/made-to-order')[0];
  const vals = [1, 2, 3, 4].map((n) => `<li class="reveal"><h3>${esc(t[`about_v${n}`])}</h3><p>${esc(t[`about_v${n}p`])}</p></li>`).join('');
  const body = `<section class="page-head" id="top"><div class="wrap"><h1>${esc(t.about_h1)}</h1></div></section>
<section class="section tight"><div class="wrap split"><img class="about-img" src="${img}" alt="" loading="lazy"><div><p class="lead">${esc(t.about_p1)}</p><p class="lead">${esc(t.about_p2)}</p><div class="cta-row"><a class="btn btn-primary" href="${href(lang, '/contact/')}">${esc(t.nav_contact)}</a></div></div></div></section>
<section class="section alt"><div class="wrap"><ul class="values">${vals}</ul></div></section>`;
  return layout({ lang, p: '/about/', title: `${t.about_h1} — ${lang === 'ne' ? t.brandNe : t.brand}`, desc: t.about_p1, body, og: img });
}

function contact(lang) {
  const t = LANGS[lang];
  const opts = [...SERVICES.map((s) => s[lang].title), ...CATEGORIES.map((c) => c[lang]), t.f_other].map((o) => `<option>${esc(o)}</option>`).join('');
  const body = `<section class="page-head" id="top"><div class="wrap"><h1>${esc(t.contact_h1)}</h1></div></section>
<section class="section tight"><div class="wrap contact-grid">
 <dl class="contact-list">
  <div><dt>${esc(t.phone)}</dt><!-- TODO(owner): real phone number. --><dd><a href="tel:${PHONE}">${PHONE_TEXT}</a></dd></div>
  <div><dt>${esc(t.whatsapp)}</dt><dd><a href="https://wa.me/${WA}" rel="noopener">${esc(t.msg_us)}</a></dd></div>
  <div><dt>${esc(t.showroom)}</dt><!-- TODO(owner): real address and Google Maps link. --><dd>${esc(t.address_v)}<br><a href="https://maps.google.com/" rel="noopener">${esc(t.map)}</a></dd></div>
  <div><dt>${esc(t.hours)}</dt><!-- TODO(owner): real opening hours. --><dd>${esc(t.hours_v)}</dd></div>
 </dl>
 <form class="quote" data-wa="${WA}" data-greet="${esc(t.wa_hi)}" data-name="${esc(t.f_name)}">
  <h2>${esc(t.form_h)}</h2>
  <label>${esc(t.f_name)}<input name="name" autocomplete="name" required></label>
  <label>${esc(t.f_what)}<select name="what">${opts}</select></label>
  <label>${esc(t.f_msg)}<textarea name="msg" rows="4"></textarea></label>
  <button class="btn btn-primary" type="submit">${WA_ICON} ${esc(t.f_send)}</button>
  <p class="muted small">${esc(t.f_note)}</p>
 </form></div></section>`;
  return layout({ lang, p: '/contact/', title: `${t.contact_h1} — ${lang === 'ne' ? t.brandNe : t.brand}`, desc: t.cta_p, body });
}

function notFound() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 — Shristi Furniture</title><link rel="stylesheet" href="/styles.css"><meta name="robots" content="noindex"></head><body><main class="wrap nf"><h1>${esc(EN.notfound_h)} · ${esc(NE.notfound_h)}</h1><p>${esc(EN.notfound_p)}<br>${esc(NE.notfound_p)}</p><p><a class="btn btn-primary" href="/">${esc(EN.nav_home)}</a> <a class="btn btn-line" href="/ne/">${esc(NE.nav_home)}</a></p></main></body></html>\n`;
}

// ---------- run ----------
for (const d of ['ne', 'shop', 'product', 'services', 'gallery', 'about', 'contact']) fs.rmSync(path.join(PUB, d), { recursive: true, force: true });
const urls = [];
for (const lang of ['en', 'ne']) {
  const add = (p, html) => { write(pageFile(lang, p), html); urls.push(href(lang, p)); };
  add('/', home(lang)); add('/shop/', shop(lang)); add('/services/', servicesIndex(lang)); add('/gallery/', gallery(lang)); add('/about/', about(lang)); add('/contact/', contact(lang));
  for (const s of SERVICES) add(`/services/${s.slug}/`, service(lang, s));
  for (const p of products) add(`/product/${p.key}/`, product(lang, p));
}
write('404.html', notFound());
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);

// catalog source (printed to PDF by build/catalog.sh)
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'catalog-data.json'), JSON.stringify({
  categories: CATEGORIES,
  products: products.map((p) => ({ key: p.key, slug: p.slug, cat: p.cat, en: p.en.name, ne: p.ne.name, descEn: p.en.desc, descNe: p.ne.desc, price: p.price, images: p.images.slice(0, 2) })),
}));
console.log(`built ${urls.length} pages, ${products.length} products, ${products.filter((p) => p.price != null).length} with prices`);
