/* ==========================================================================
   Барбершоп «Латунь» — скрипты
   ========================================================================== */

// сигнал для запасного таймера в <head>: скрипт загрузился, анимации можно включать
window.latunReady = true;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Блокировка скролла страницы (меню, лайтбокс) без сдвига вёрстки из-за полосы прокрутки
function lockScroll(lock) {
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar', lock ? `${scrollbar}px` : '0px');
  document.body.classList.toggle('is-locked', lock);
}

/* ---------- Шапка: фон при скролле, кнопка «Наверх», активный пункт меню ---------- */
const header = document.getElementById('header');
const toTop = document.getElementById('toTop');
const navLinks = [...document.querySelectorAll('.nav__link')];
const navSections = navLinks.map((link) => document.querySelector(link.getAttribute('href')));

function updateActiveLink() {
  const line = header.offsetHeight + window.innerHeight / 3;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let active = -1;
  navSections.forEach((section, i) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= line && rect.bottom > line) active = i;
  });
  if (atBottom) active = navSections.length - 1;
  navLinks.forEach((link, i) => {
    link.classList.toggle('is-active', i === active);
    if (i === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 20);
  toTop.classList.toggle('is-visible', y > 600);
  updateActiveLink();
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

/* ---------- Бургер-меню ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
// пока меню открыто, Tab не уходит на страницу под ним
const behindMenu = [document.getElementById('main'), document.querySelector('.footer'), toTop];

function setMenu(open) {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.classList.toggle('is-open', open);
  header.classList.toggle('is-open', open);
  behindMenu.forEach((el) => { el.inert = open; });
  lockScroll(open);
}

burger.addEventListener('click', () => {
  setMenu(burger.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});

// Клик вне меню (например, по логотипу или шапке) закрывает его
document.addEventListener('click', (e) => {
  if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) setMenu(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    burger.focus();
  }
});

// На десктопе меню всегда видно — сбрасываем мобильное состояние
window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
  if (e.matches) setMenu(false);
});

/* ---------- Плавный скролл к якорям с учётом шапки ---------- */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  const top = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
  window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  history.replaceState(null, '', id);
  // переносим фокус в секцию, чтобы ссылка-пропуск и Tab работали с нового места
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

/* ---------- Появление секций при скролле ---------- */
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealItems.forEach((el, i) => {
    // небольшая задержка для соседних карточек
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    observer.observe(el);
  });
} else {
  revealItems.forEach((el) => el.classList.add('is-visible'));
}

/* ---------- Галерея и лайтбокс ---------- */
const galleryButtons = [...document.querySelectorAll('.gallery__item')];
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbCaption = document.getElementById('lbCaption');
let lbIndex = 0;
let lbReturnFocus = null;

function showPhoto(index) {
  lbIndex = (index + galleryButtons.length) % galleryButtons.length;
  const btn = galleryButtons[lbIndex];
  const thumb = btn.querySelector('img');
  lbImage.src = btn.dataset.full;
  lbImage.alt = thumb.alt;
  lbCaption.textContent = `${thumb.alt} · ${lbIndex + 1} / ${galleryButtons.length}`;
}

function openLightbox(index) {
  lbReturnFocus = document.activeElement;
  showPhoto(index);
  lightbox.hidden = false;
  lockScroll(true);
  document.addEventListener('keydown', onLightboxKey);
  document.getElementById('lbClose').focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lockScroll(false);
  document.removeEventListener('keydown', onLightboxKey);
  if (lbReturnFocus) lbReturnFocus.focus();
}

galleryButtons.forEach((btn, i) => btn.addEventListener('click', () => openLightbox(i)));
document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => showPhoto(lbIndex - 1));
document.getElementById('lbNext').addEventListener('click', () => showPhoto(lbIndex + 1));

// Клик вне картинки закрывает
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target.classList.contains('lightbox__figure')) closeLightbox();
});

// Обработчик клавиш вешается только на время, пока лайтбокс открыт
function onLightboxKey(e) {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPhoto(lbIndex - 1);
  if (e.key === 'ArrowRight') showPhoto(lbIndex + 1);
  // фокус не уходит из окна
  if (e.key === 'Tab') {
    const focusable = lightbox.querySelectorAll('button');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

/* ---------- Слайдер отзывов ---------- */
const slider = document.getElementById('slider');
const track = document.getElementById('sliderTrack');
const slides = [...track.children];
const dotsBox = document.getElementById('sliderDots');
const AUTOPLAY_MS = 6000;
let current = 0;
let timer = null;
let hovered = false;
let focused = false;

const dots = slides.map((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'slider__dot';
  dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
  dot.addEventListener('click', () => { goTo(i); restart(); });
  dotsBox.append(dot);
  return dot;
});

function goTo(index) {
  current = (index + slides.length) % slides.length;
  track.style.transform = `translateX(-${current * 100}%)`;
  slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== current)));
  dots.forEach((d, i) => d.setAttribute('aria-current', String(i === current)));
}

// Автопрокрутка не идёт, пока на слайдере мышь или фокус; повторный вызов не плодит интервалы
function start() {
  if (reduceMotion || timer || hovered || focused) return;
  timer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
}
function stop() {
  clearInterval(timer);
  timer = null;
}
function restart() { stop(); start(); }

document.getElementById('sliderPrev').addEventListener('click', () => { goTo(current - 1); restart(); });
document.getElementById('sliderNext').addEventListener('click', () => { goTo(current + 1); restart(); });

// Пауза при наведении и при фокусе внутри слайдера
// (только настоящая мышь: тап на телефоне эмулирует mouseenter без mouseleave)
slider.addEventListener('pointerenter', (e) => {
  if (e.pointerType !== 'mouse') return;
  hovered = true;
  stop();
});
slider.addEventListener('pointerleave', (e) => {
  if (e.pointerType !== 'mouse') return;
  hovered = false;
  start();
});
slider.addEventListener('focusin', () => { focused = true; stop(); });
slider.addEventListener('focusout', (e) => {
  if (slider.contains(e.relatedTarget)) return;
  focused = false;
  start();
});

// Свайп на сенсорных экранах (только горизонтальный жест, вертикальный — прокрутка страницы)
let touchX = null;
let touchY = null;
track.addEventListener('touchstart', (e) => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
  stop();
}, { passive: true });
track.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) goTo(current + (dx < 0 ? 1 : -1));
  touchX = null;
  start();
});
track.addEventListener('touchcancel', () => { touchX = null; start(); });

goTo(0);
start();

/* ---------- Форма записи: маска телефона и валидация ---------- */
const form = document.getElementById('bookingForm');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const submitBtn = form.querySelector('.form__submit');
const PHONE_RE = /^\+375 \((25|29|33|44)\) \d{3}-\d{2}-\d{2}$/;
const NAME_RE = /^\p{L}+(?:[ -]\p{L}+)*$/u;
const PHONE_PREFIX = '+375 (';

// Достаёт 9 цифр номера без кода страны из любого вида:
// «80291234567», «+375291234567», «291234567», «+375 (29) 123-45-67»
function phoneDigits(value) {
  // «+375 (» маски (даже повреждённое правкой внутри него) — код страны, отрезаем целиком
  const prefix = value.match(/^\s*\+(?:\d{0,4}(?=[\s(])|\d{0,3}$)/);
  let digits = (prefix ? value.slice(prefix[0].length) : value).replace(/\D/g, '');
  // коды операторов (25, 29, 33, 44) не начинаются с 37 и 80 — значит, это префиксы
  return digits.replace(/^375/, '').replace(/^80/, '').slice(0, 9);
}

// Форматирует цифры в +375 (XX) XXX-XX-XX
function formatPhone(digits) {
  let out = PHONE_PREFIX + digits.slice(0, 2);
  if (digits.length >= 2) out += ')';
  if (digits.length > 2) out += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) out += `-${digits.slice(5, 7)}`;
  if (digits.length > 7) out += `-${digits.slice(7, 9)}`;
  return out;
}

// Позиция курсора сразу после n-й цифры номера
function caretAfter(formatted, n) {
  if (!n) return PHONE_PREFIX.length;
  let seen = 0;
  for (let i = PHONE_PREFIX.length; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]) && ++seen === n) return i + 1;
  }
  return formatted.length;
}

let lastPhone = '';

phoneInput.addEventListener('focus', () => {
  if (!phoneInput.value) phoneInput.value = PHONE_PREFIX;
  lastPhone = phoneInput.value;
});
phoneInput.addEventListener('blur', () => {
  if (!phoneDigits(phoneInput.value)) phoneInput.value = '';
  else validatePhone();
});
phoneInput.addEventListener('input', (e) => {
  const value = phoneInput.value;
  const caret = phoneInput.selectionStart ?? value.length;
  let digits = phoneDigits(value);
  let before = phoneDigits(value.slice(0, caret)).length;

  // стёрли только скобку, пробел или дефис — стираем соседнюю цифру, иначе маска вернёт символ обратно
  if (e.inputType && e.inputType.startsWith('delete') && digits === phoneDigits(lastPhone) && value !== lastPhone) {
    if (e.inputType === 'deleteContentBackward' && before > 0) {
      digits = digits.slice(0, before - 1) + digits.slice(before);
      before -= 1;
    } else if (e.inputType === 'deleteContentForward') {
      digits = digits.slice(0, before) + digits.slice(before + 1);
    }
  }

  const formatted = formatPhone(digits);
  phoneInput.value = formatted;
  const pos = caretAfter(formatted, Math.min(before, digits.length));
  if (document.activeElement === phoneInput) phoneInput.setSelectionRange(pos, pos);
  lastPhone = formatted;
});

// Вставка: если вставили номер целиком — заменяем поле, а не дописываем к «+375 (»
phoneInput.addEventListener('paste', (e) => {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (text.replace(/\D/g, '').length < 9) return;
  e.preventDefault();
  phoneInput.value = formatPhone(phoneDigits(text));
  lastPhone = phoneInput.value;
  phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
});

function setError(input, message) {
  const error = document.getElementById(`${input.id}Error`);
  error.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

// Обрезает пробелы по краям и схлопывает двойные внутри
function cleanName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function nameError(value) {
  if (value.length < 2) return 'Введите имя — минимум 2 символа';
  if (!NAME_RE.test(value)) return 'Только буквы, пробел и дефис';
  return '';
}

function validateName() {
  const message = nameError(cleanName(nameInput.value));
  setError(nameInput, message);
  return !message;
}

function phoneError(value) {
  const digits = phoneDigits(value);
  if (digits.length < 9) return 'Введите номер полностью: +375 (XX) XXX-XX-XX';
  if (!PHONE_RE.test(formatPhone(digits))) return 'Код оператора: 25, 29, 33 или 44';
  return '';
}

function validatePhone() {
  const digits = phoneDigits(phoneInput.value);
  phoneInput.value = digits ? formatPhone(digits) : '';
  const message = phoneError(phoneInput.value);
  setError(phoneInput, message);
  return !message;
}

// Ошибка исчезает, как только поле исправлено
nameInput.addEventListener('input', () => {
  if (nameInput.getAttribute('aria-invalid') === 'true') validateName();
});
nameInput.addEventListener('blur', () => {
  nameInput.value = cleanName(nameInput.value);
  if (nameInput.value) validateName();
});
phoneInput.addEventListener('input', () => {
  if (phoneInput.getAttribute('aria-invalid') === 'true' && !phoneError(phoneInput.value)) setError(phoneInput, '');
});

const success = document.getElementById('formSuccess');
let submitting = false;

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (submitting) return; // защита от двойного клика
  nameInput.value = cleanName(nameInput.value);
  const nameOk = validateName();
  const phoneOk = validatePhone();
  if (!nameOk) { nameInput.focus(); return; }
  if (!phoneOk) { phoneInput.focus(); return; }

  submitting = true;
  submitBtn.disabled = true;

  const data = {
    name: nameInput.value,
    phone: phoneInput.value,
    service: form.service.value,
  };
  console.log('Заявка на запись:', data);

  document.getElementById('successName').textContent = data.name;
  form.hidden = true;
  success.hidden = false;
  success.focus();
});

// «Записаться ещё раз»: сбрасываем форму и возвращаем её
document.getElementById('bookAgain').addEventListener('click', () => {
  form.reset();
  setError(nameInput, '');
  setError(phoneInput, '');
  submitting = false;
  submitBtn.disabled = false;
  success.hidden = true;
  form.hidden = false;
  nameInput.focus();
});
