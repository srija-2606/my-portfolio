/* ============================================================
   main.js – Accessible interactions
   ============================================================ */

'use strict';

// ---------- Mobile Nav Toggle ----------
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.setAttribute('aria-hidden', String(isOpen));
    mobileMenu.classList.toggle('is-open', !isOpen);
    navToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-label', 'Open navigation menu');
      navToggle.focus();
    }
  });
}

// ---------- Intersection Observer – fade-in ----------
const fadeEls = document.querySelectorAll(
  '.project-card, .stat-item, .skill-chip, .timeline-item, .about-grid, .contact-grid'
);
if ('IntersectionObserver' in window) {
  fadeEls.forEach(el => el.classList.add('fade-in'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => observer.observe(el));
}

// ---------- Project Filter (projects.html) ----------
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card[data-category]');

if (filterBtns.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      projectCards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
        card.setAttribute('aria-hidden', String(!show));
      });

      // Announce to screen readers
      const visible = [...projectCards].filter(c => c.style.display !== 'none').length;
      announceToSR(`Showing ${visible} project${visible !== 1 ? 's' : ''}`);
    });
  });
}

// ---------- Contact Form Validation ----------
const form = document.getElementById('contact-form');

if (form) {
  const fields = {
    name:    { el: document.getElementById('name'),    errEl: document.getElementById('name-error') },
    email:   { el: document.getElementById('email'),   errEl: document.getElementById('email-error') },
    subject: { el: document.getElementById('subject'), errEl: document.getElementById('subject-error') },
    message: { el: document.getElementById('message'), errEl: document.getElementById('message-error') },
    consent: { el: document.getElementById('consent'), errEl: document.getElementById('consent-error') },
  };

  const successMsg   = document.getElementById('form-success');
  const errorSummary = document.getElementById('form-error-summary');
  const errorList    = document.getElementById('error-list');
  const charCount    = document.getElementById('char-count');

  // Real-time character count
  if (fields.message.el && charCount) {
    fields.message.el.addEventListener('input', () => {
      const len = fields.message.el.value.length;
      charCount.textContent = len;
      if (len > 1000) {
        fields.message.el.classList.add('is-invalid');
        fields.message.errEl.textContent = 'Message must be 1000 characters or fewer.';
      } else {
        fields.message.el.classList.remove('is-invalid');
        fields.message.errEl.textContent = '';
      }
    });
  }

  // Inline validation on blur
  Object.values(fields).forEach(({ el, errEl }) => {
    if (!el) return;
    el.addEventListener('blur', () => validateField(el, errEl));
    el.addEventListener('input', () => {
      if (el.classList.contains('is-invalid')) validateField(el, errEl);
    });
  });

  function validateField(el, errEl) {
    let error = '';
    if (el.type === 'checkbox') {
      if (!el.checked) error = 'You must agree to the privacy policy.';
    } else if (el.tagName === 'SELECT') {
      if (!el.value) error = 'Please select a subject.';
    } else if (el.id === 'email') {
      if (!el.value.trim()) error = 'Email address is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) error = 'Please enter a valid email address.';
    } else if (el.id === 'message') {
      if (!el.value.trim()) error = 'Message is required.';
      else if (el.value.trim().length < 10) error = 'Message must be at least 10 characters.';
      else if (el.value.length > 1000) error = 'Message must be 1000 characters or fewer.';
    } else {
      if (!el.value.trim()) error = `${el.labels?.[0]?.textContent?.replace('*','').trim() || 'This field'} is required.`;
    }
    errEl.textContent = error;
    el.classList.toggle('is-invalid', !!error);
    el.setAttribute('aria-invalid', String(!!error));
    return !error;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let errors = [];
    let firstInvalid = null;

    Object.entries(fields).forEach(([key, { el, errEl }]) => {
      if (!el) return;
      const valid = validateField(el, errEl);
      if (!valid) {
        errors.push({ id: el.id, msg: errEl.textContent });
        if (!firstInvalid) firstInvalid = el;
      }
    });

    if (errors.length) {
      // Show error summary
      errorList.innerHTML = errors.map(e =>
        `<li><a href="#${e.id}">${e.msg}</a></li>`
      ).join('');
      errorSummary.removeAttribute('hidden');
      successMsg.setAttribute('hidden', '');
      errorSummary.focus();
    } else {
      // Hide errors, show success
      errorSummary.setAttribute('hidden', '');
      successMsg.removeAttribute('hidden');
      form.reset();
      if (charCount) charCount.textContent = '0';
      successMsg.focus();

      // Reset aria-invalid
      Object.values(fields).forEach(({ el }) => {
        if (el) {
          el.classList.remove('is-invalid');
          el.removeAttribute('aria-invalid');
        }
      });
    }
  });
}

// ---------- SR Announcer ----------
function announceToSR(msg) {
  let live = document.getElementById('sr-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'sr-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.className = 'sr-only';
    document.body.appendChild(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = msg; });
}
