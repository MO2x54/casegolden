// ============================================================
// محكمة الذهبيون — JavaScript الرئيسي
// ============================================================

// ── Countdown Timer ──
const TARGET_DATE = new Date('2026-05-17T01:00:00+02:00'); // 1:00 AM Egypt time

function updateCountdown() {
  const now = new Date();
  const diff = TARGET_DATE - now;

  if (diff <= 0) {
    // Session has started!
    document.getElementById('days').textContent    = '٠٠';
    document.getElementById('hours').textContent   = '٠٠';
    document.getElementById('minutes').textContent = '٠٠';
    document.getElementById('seconds').textContent = '٠٠';
    document.querySelector('.countdown-title').textContent = '🔴 الجلسة منعقدة الآن!';
    document.querySelector('.countdown-title').style.color = '#c0394f';
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('days').textContent    = String(days).padStart(2, '0');
  document.getElementById('hours').textContent   = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ── Road Steps Animation on Scroll ──
function observeSteps() {
  const steps = document.querySelectorAll('.road-step');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateX(0)';
      }
    });
  }, { threshold: 0.2 });

  steps.forEach((step, i) => {
    step.style.opacity = '0';
    step.style.transform = 'translateX(-20px)';
    step.style.transition = `all 0.6s ease ${i * 0.1}s`;
    observer.observe(step);
  });
}

// ── Particles ──
function createParticles() {
  const bg = document.getElementById('particles-bg');
  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      background: rgba(212, 160, 23, ${Math.random() * 0.4 + 0.1});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: particleFloat ${Math.random() * 15 + 10}s ease-in-out infinite;
      animation-delay: ${Math.random() * 10}s;
    `;
    bg.appendChild(particle);
  }

  // Add keyframes for particles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleFloat {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
      25%  { transform: translate(${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 30 + 10)}px, -${Math.floor(Math.random() * 40 + 20)}px) scale(1.2); opacity: 0.7; }
      75%  { transform: translate(${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 20 + 5)}px, ${Math.floor(Math.random() * 30 + 10)}px) scale(0.8); opacity: 0.4; }
    }
  `;
  document.head.appendChild(style);
}

// ── Witness System ──
const witnesses = JSON.parse(localStorage.getItem('court_witnesses') || '[]');

function renderWitnesses() {
  const list = document.getElementById('witness-list');
  list.innerHTML = '';
  witnesses.forEach(name => {
    const tag = document.createElement('div');
    tag.className = 'witness-tag';
    tag.textContent = `🤚 ${name}`;
    list.appendChild(tag);
  });
}

function joinAsWitness() {
  const input = document.getElementById('witness-name');
  const name = input.value.trim();
  if (!name) {
    input.style.borderColor = '#c0394f';
    input.placeholder = 'يجب كتابة اسمك أولاً...';
    setTimeout(() => {
      input.style.borderColor = '';
      input.placeholder = 'اكتب اسمك هنا...';
    }, 2000);
    return;
  }
  if (witnesses.includes(name)) {
    input.value = '';
    input.placeholder = `${name} — سبق وأدليت بشهادتك!`;
    setTimeout(() => { input.placeholder = 'اكتب اسمك هنا...'; }, 3000);
    return;
  }
  witnesses.push(name);
  localStorage.setItem('court_witnesses', JSON.stringify(witnesses));
  input.value = '';
  renderWitnesses();
  showWitnessConfirm(name);
}

function showWitnessConfirm(name) {
  const overlay = document.getElementById('gavel-overlay');
  overlay.querySelector('.gavel-icon').textContent = '🤚';
  overlay.querySelector('.gavel-text').textContent = `${name} — شاهد رسمي في القضية!`;
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('hidden'), 2500);
}

// ── Gavel Opening Animation ──
function showGavelOpening() {
  const overlay = document.getElementById('gavel-overlay');
  overlay.querySelector('.gavel-icon').textContent = '⚖️';
  overlay.querySelector('.gavel-text').textContent = 'مرحباً بك في محكمة الذهبيون';
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('hidden'), 2800);
}

// ── Keyboard shortcut: Enter to join as witness ──
document.addEventListener('DOMContentLoaded', () => {
  observeSteps();
  createParticles();
  renderWitnesses();
  showGavelOpening();

  const input = document.getElementById('witness-name');
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinAsWitness();
  });

  // Hover sound effect (visual feedback on steps)
  document.querySelectorAll('.road-step').forEach(step => {
    step.addEventListener('mouseenter', () => {
      step.style.boxShadow = '0 0 40px rgba(212,160,23,0.3), inset 0 0 30px rgba(212,160,23,0.05)';
    });
    step.addEventListener('mouseleave', () => {
      if (!step.classList.contains('verdict-step')) {
        step.style.boxShadow = '';
      }
    });
  });
});

// ── Expose globally ──
window.joinAsWitness = joinAsWitness;
