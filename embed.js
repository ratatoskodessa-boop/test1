(async () => {
  const el = document.querySelector('.vev-embed') || document.currentScript;
  let basePath = el.getAttribute('src').replace('embed.js', '');
  if (basePath && !basePath.endsWith('/')) basePath += '/';

  const { target } = el.dataset;
  const fill = el.hasAttribute('data-fill-width');
  const disableShadowDOM = el.hasAttribute('data-disable-shadow-dom');

  const a = document.createElement('div');
  a.className = 'vev';
  if (!disableShadowDOM) a.attachShadow({ mode: 'open' });
  const b = a.shadowRoot || a;

  const id = 'page-' + Date.now();
  b.innerHTML = '<div class="vev" data-path="' + id + '"></div>';

  if (!target && document.head.contains(document.currentScript)) {
    setTimeout(() => document.body.prepend(a));
  } else {
    if (target) {
      const insert = () => {
        const t = document.getElementById(target) || document.querySelector(target);
        if (t) t.appendChild(a);
      };
      insert();
    } else {
      document.currentScript.after(a);
    }
  }

  if (fill) {
    a.setAttribute(
      'style',
      'width:100vw;min-width:100vw;max-width:100vw;position:relative;overflow:hidden;',
    );
    new ResizeObserver(([entry]) => {
      const { left } = entry.target.getBoundingClientRect();
      const computed = getComputedStyle(entry.target);
      const offsetLeft = left - parseFloat(computed.left) || 0;
      entry.target.style.left = -offsetLeft + 'px';
    }).observe(a);
  }

  const res = await fetch(basePath + 'index.html');
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let manifest = JSON.parse(doc.querySelector("script[type='text/vev']").innerHTML);

  const currentPage = manifest.pages.find((p) => p.key === manifest.route.pageKey);

  if (!currentPage.index) {
    basePath = basePath.replace('/' + currentPage.path, '');
  }

  manifest = JSON.parse(
    JSON.stringify(manifest).replaceAll(
      currentPage.index ? 'assets/' : '../assets/',
      basePath + 'assets/',
    ),
  );
  manifest.embed = true;
  manifest.host = basePath || '/';
  manifest.resolveIndex = true;
  manifest.replaceAssetsPaths = true;

  (window.vevs || (window.vevs = {}))[id] = manifest;

  const createStyleElement = (text) => {
    const el = document.createElement('style');
    el.innerText = text.replaceAll(
      currentPage.index ? 'assets/' : '../assets/',
      basePath + 'assets/',
    );
    return el;
  };

  doc.querySelectorAll('.vev-style').forEach((css) => {
    const a = createStyleElement(css.innerText);
    b.appendChild(a);
    const c = createStyleElement(css.innerText);
    document.head.appendChild(c);
  });

  doc.querySelectorAll('.vev-dep').forEach((s) => {
    const a = document.createElement('script');
    a.src = basePath + 'assets/' + s.src.split('/').slice(-1).join();
    (document.body || document.head).appendChild(a);
  });
})();