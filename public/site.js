(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  $$('[data-year]').forEach((e) => (e.textContent = new Date().getFullYear()));

  // overlay menu
  const ov = $('#overlay'), mb = $('.menu-btn');
  const setMenu = (open) => { ov.hidden = !open; mb.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; if (open) $('.overlay-close').focus(); else mb.focus(); };
  mb.addEventListener('click', () => setMenu(true));
  $('.overlay-close').addEventListener('click', () => setMenu(false));
  ov.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ov.hidden) setMenu(false); });

  // scroll reveal (content stays visible without JS / IntersectionObserver)
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  // shop: filter + sort
  const grid = $('#grid');
  if (grid) {
    const cards = $$('.card', grid), chips = $$('.chip[data-c]'), sortSel = $('#sort'), count = $('.count');
    const ne = count.dataset.lang === 'ne', base = new Intl.NumberFormat('en-IN');
    const nfmt = { format: (n) => (ne ? base.format(n).replace(/\d/g, (d) => '०१२३४५६७८९'[d]) : base.format(n)) };
    let cat = new URLSearchParams(location.search).get('c') || '';
    if (!chips.some((c) => c.dataset.c === cat)) cat = '';
    const apply = () => {
      let shown = 0;
      cards.forEach((c) => { const ok = !cat || c.dataset.cat === cat; c.hidden = !ok; if (ok) shown++; });
      chips.forEach((c) => c.classList.toggle('on', c.dataset.c === cat));
      const v = sortSel.value, price = (c) => (c.dataset.price === '' ? Infinity : +c.dataset.price);
      const cmp = { feat: (a, b) => a.dataset.i - b.dataset.i, az: (a, b) => a.dataset.name.localeCompare(b.dataset.name), lo: (a, b) => price(a) - price(b) || a.dataset.i - b.dataset.i, hi: (a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)) || a.dataset.i - b.dataset.i }[v];
      [...cards].sort(cmp).forEach((c) => grid.appendChild(c));
      count.textContent = count.dataset.tpl.replace('{n}', nfmt.format(shown)).replace('{t}', nfmt.format(cards.length));
    };
    chips.forEach((c) => c.addEventListener('click', (e) => { e.preventDefault(); cat = c.dataset.c; history.replaceState(null, '', cat ? `?c=${cat}` : location.pathname); apply(); }));
    sortSel.addEventListener('change', apply);
    apply();
  }

  // product gallery: scroll-snap + mouse drag + buttons + dots
  $$('[data-gallery]').forEach((g) => {
    const tr = $('.track', g), dots = $$('.dot', g), n = $$('.slide', tr).length;
    const go = (i) => tr.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * tr.clientWidth, behavior: 'smooth' });
    const cur = () => Math.round(tr.scrollLeft / tr.clientWidth);
    tr.addEventListener('scroll', () => { const c = cur(); dots.forEach((d, i) => d.classList.toggle('on', i === c)); }, { passive: true });
    $('.g-prev', g)?.addEventListener('click', () => go(cur() - 1));
    $('.g-next', g)?.addEventListener('click', () => go(cur() + 1));
    dots.forEach((d) => d.addEventListener('click', () => go(+d.dataset.n)));
    tr.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(cur() + 1); if (e.key === 'ArrowLeft') go(cur() - 1); });
    let down = false, sx = 0, sl = 0, moved = false;
    tr.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; tr.classList.add('drag'); tr.setPointerCapture(e.pointerId); });
    tr.addEventListener('pointermove', (e) => { if (!down) return; moved = true; tr.scrollLeft = sl - (e.clientX - sx); });
    const end = () => { if (!down) return; down = false; tr.classList.remove('drag'); go(cur()); };
    tr.addEventListener('pointerup', end); tr.addEventListener('pointercancel', end);
  });

  // contact form -> WhatsApp (no backend needed)
  const f = $('.quote');
  if (f) f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(f), text = `${f.dataset.greet} ${d.get('what')}\n${f.dataset.name}: ${d.get('name')}\n${d.get('msg') || ''}`.trim();
    window.open(`https://wa.me/${f.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
})();
