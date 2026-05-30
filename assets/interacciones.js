/* ===========================================================
   kaops — interacciones
   =========================================================== */
(function () {
  'use strict';

  /* ---------- Header scroll ---------- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle) {
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  /* ---------- Reveal on scroll (con fallback robusto) ---------- */
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const show = (el, i) => {
    el.style.transitionDelay = Math.min((i || 0) * 60, 240) + 'ms';
    el.classList.add('in');
  };
  // Lo que ya está en (o cerca de) pantalla se revela de inmediato
  const revealInView = () => {
    const vh = window.innerHeight;
    reveals.forEach((el, i) => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) show(el, i);
    });
  };
  revealInView();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { show(e.target, 0); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => { if (!el.classList.contains('in')) io.observe(el); });
  // Red de seguridad: si el IO no dispara (iframes ocultos, etc.) revela todo
  window.addEventListener('load', () => { revealInView(); setTimeout(revealInView, 400); });
  window.addEventListener('scroll', revealInView, { passive: true });

  /* ---------- Cards: spotlight que sigue el cursor ---------- */
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    });
  });

  /* ---------- Tabs de tecnologías ---------- */
  const tabs = document.querySelectorAll('.tech-tab');
  const panels = document.querySelectorAll('.tech-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      const key = tab.dataset.tab;
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === key));
    });
  });

  /* ---------- Terminal animada ---------- */
  const termBody = document.getElementById('termBody');
  if (termBody) {
    const seq = [
      { t: 'prompt', txt: 'kaops@cloud', path: '~/tu-proyecto', cmd: 'kaops diagnostico --infra' },
      { t: 'out',  txt: 'Revisando infraestructura…' },
      { t: 'ok',   txt: '✔ Linux endurecido y actualizado' },
      { t: 'ok',   txt: '✔ GCP: red e IAM con privilegio mínimo' },
      { t: 'ok',   txt: '✔ Terraform: estado limpio y versionado' },
      { t: 'warn', txt: '⚠ 3 recursos ociosos · ahorro estimado 38%/mes' },
      { t: 'blank' },
      { t: 'prompt', txt: 'kaops@cloud', path: '~/tu-proyecto', cmd: 'kaops aplicar --plan optimo' },
      { t: 'out',  txt: 'Desplegando pipeline CI/CD…' },
      { t: 'ok',   txt: '✔ Observabilidad ELK conectada' },
      { t: 'ok',   txt: '✔ Despliegue automatizado · 0 pasos manuales' },
      { t: 'done', txt: '› Todo bajo control. Tú a dormir. 🐧' },
    ];

    let li = 0;
    let runToken = 0;        // invalida bucles antiguos al reiniciar
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    const animOn = () => !document.body.classList.contains('no-term-anim');

    function newLine() {
      const d = document.createElement('div');
      d.className = 'term-line';
      termBody.appendChild(d);
      return d;
    }

    function lineHTML(item) {
      if (item.t === 'prompt') {
        return '<span class="term-prompt">' + item.txt + '</span>:<span class="term-path">' +
          item.path + '</span><span class="term-dim">$</span> <span class="term-cmd">' + item.cmd + '</span>';
      }
      if (item.t === 'blank') return '&nbsp;';
      const cls = item.t === 'ok' ? 'term-ok'
                : item.t === 'warn' ? 'term-path'
                : item.t === 'done' ? 'term-prompt'
                : 'term-out';
      return '<span class="' + cls + '">' + item.txt + '</span>';
    }

    function renderStatic() {
      runToken++;            // detiene cualquier animación en curso
      termBody.innerHTML = '';
      seq.forEach(item => { newLine().innerHTML = lineHTML(item); });
      const last = termBody.lastElementChild;
      if (last) last.appendChild(cursor);
    }

    function typeCmd(el, item, done) {
      el.innerHTML = '<span class="term-prompt">' + item.txt + '</span>:<span class="term-path">' +
        item.path + '</span><span class="term-dim">$</span> <span class="term-cmd"></span>';
      const cmdEl = el.querySelector('.term-cmd');
      cmdEl.appendChild(cursor);
      let i = 0;
      const txt = item.cmd;
      const token = runToken;
      (function tick() {
        if (token !== runToken) return;
        if (i <= txt.length) {
          cmdEl.textContent = txt.slice(0, i);
          cmdEl.appendChild(cursor);
          i++;
          setTimeout(tick, 38 + Math.random() * 40);
        } else {
          setTimeout(done, 360);
        }
      })();
    }

    function run() {
      const token = runToken;
      if (li >= seq.length) {
        // pausa y reinicia
        setTimeout(() => { if (token !== runToken) return; termBody.innerHTML = ''; li = 0; run(); }, 4200);
        return;
      }
      const item = seq[li];
      const el = newLine();

      if (item.t === 'prompt') {
        typeCmd(el, item, () => { if (token !== runToken) return; li++; run(); });
      } else if (item.t === 'blank') {
        el.innerHTML = '&nbsp;';
        li++; setTimeout(() => { if (token === runToken) run(); }, 120);
      } else {
        el.innerHTML = lineHTML(item);
        if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
        el.appendChild(cursor);
        li++;
        setTimeout(() => { if (token === runToken) run(); }, item.t === 'out' ? 520 : 340);
      }
    }

    // Arranca cuando la terminal entra en pantalla (con fallback por si el IO no dispara)
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      if (animOn()) { runToken++; li = 0; setTimeout(run, 400); }
      else renderStatic();
    };
    const tStart = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { tStart.disconnect(); begin(); }
    }, { threshold: 0.2 });
    tStart.observe(termBody);
    // Red de seguridad: si está en viewport al cargar, arranca igualmente
    window.addEventListener('load', () => {
      const r = termBody.getBoundingClientRect();
      if (r.top < window.innerHeight) begin();
    });
    setTimeout(() => {
      const r = termBody.getBoundingClientRect();
      if (r.top < window.innerHeight) begin();
    }, 800);

    // Reacciona al tweak de animación en vivo
    window.addEventListener('tweakchange', (e) => {
      if (!e.detail || !('terminal' in e.detail)) return;
      if (!started) return;
      if (e.detail.terminal) { runToken++; li = 0; termBody.innerHTML = ''; run(); }
      else renderStatic();
    });
  }

  /* ---------- Formulario ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    const success = document.getElementById('formSuccess');
    const setInvalid = (field, bad) => field.closest('.field').classList.toggle('invalid', bad);

    form.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('input', () => {
        if (inp.closest('.field').classList.contains('invalid')) validate(inp);
      });
    });

    function validate(inp) {
      let bad = false;
      if (inp.hasAttribute('required') && !inp.value.trim()) bad = true;
      if (inp.type === 'email' && inp.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) bad = true;
      setInvalid(inp, bad);
      return !bad;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll('input[required], textarea[required]').forEach(inp => {
        if (!validate(inp)) ok = false;
      });
      if (!ok) return;

      const btn = form.querySelector('button[type="submit"]');
      const btnText = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Error al enviar');
        form.style.display = 'none';
        success.classList.add('show');
      } catch (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = btnText; }
        alert('No pude enviar el mensaje. Probá de nuevo o escribime directo. (' + err.message + ')');
      }
    });
  }

})();
