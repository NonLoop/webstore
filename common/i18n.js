/**
 * Webstore bilingual helper (zh / en).
 * Auto-detects browser language on first visit; remembers choice in localStorage.
 *
 * Usage:
 *   <script src="../common/i18n.js"></script>           <!-- in <head>, sync -->
 *   markup: <span lang="zh">…</span><span lang="en">…</span>
 *   optional: <html data-i18n-key="lovelines_lang"> for per-product storage
 *   end of body: WebstoreI18n.mount({ reveal: '.feature' })
 */
(function (global) {
  var KEY_DEFAULT = 'webstore_lang';
  var root = document.documentElement;

  function storageKey() {
    return root.getAttribute('data-i18n-key') || KEY_DEFAULT;
  }

  function normalize(lang) {
    if (!lang) return null;
    lang = String(lang).toLowerCase();
    if (lang.indexOf('zh') === 0) return 'zh';
    if (lang.indexOf('en') === 0) return 'en';
    return null;
  }

  function detect() {
    try {
      var saved = localStorage.getItem(storageKey());
      var fromSaved = normalize(saved);
      if (fromSaved) return fromSaved;
    } catch (e) {}

    var list = [];
    if (navigator.languages && navigator.languages.length) {
      for (var i = 0; i < navigator.languages.length; i++) list.push(navigator.languages[i]);
    }
    list.push(navigator.language || navigator.userLanguage || 'en');

    for (var j = 0; j < list.length; j++) {
      var hit = normalize(list[j]);
      if (hit) return hit;
    }
    return 'en';
  }

  function syncButtons(lang) {
    var buttons = document.querySelectorAll('.lang button[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    }
  }

  function apply(lang) {
    lang = normalize(lang) || 'en';
    root.lang = lang;
    root.setAttribute('data-lang', lang);
    try { localStorage.setItem(storageKey(), lang); } catch (e) {}
    syncButtons(lang);
    try {
      global.dispatchEvent(new CustomEvent('webstore:lang', { detail: { lang: lang } }));
    } catch (e) {}
    return lang;
  }

  // Apply ASAP to avoid bilingual flash
  apply(detect());

  function bindToggle() {
    var buttons = document.querySelectorAll('.lang button[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (ev) {
        apply(ev.currentTarget.getAttribute('data-lang'));
      });
    }
  }

  function fillYear() {
    var nodes = document.querySelectorAll('[data-year], #year');
    var y = String(new Date().getFullYear());
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = y;
  }

  function reveal(selector) {
    if (!selector) return;
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    var reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}
    if (reduce || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          entries[j].target.classList.add('in');
          io.unobserve(entries[j].target);
        }
      }
    }, { threshold: 0.18 });
    for (var k = 0; k < els.length; k++) io.observe(els[k]);
  }

  function mount(opts) {
    opts = opts || {};
    bindToggle();
    fillYear();
    syncButtons(root.getAttribute('data-lang') || detect());
    if (opts.reveal) reveal(opts.reveal);
  }

  global.WebstoreI18n = {
    detect: detect,
    apply: apply,
    mount: mount,
    getLang: function () { return root.getAttribute('data-lang') || detect(); }
  };
})(window);
