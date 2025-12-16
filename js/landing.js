// Landing Page JavaScript

// Initialize TradingView Widget
function initTradingViewWidget() {
  const container = document.getElementById('tradingview_forensic_chart');
  if (container && typeof TradingView !== 'undefined') {
    new TradingView.widget({
      "autosize": true,
      "symbol": "BINANCE:BTCUSDT",
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": "light",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_forensic_chart"
    });
  }
}

// Initialize Mini Charts with Chart.js
function initMiniCharts() {
  const chartCanvas = document.getElementById('mini-chart-1');
  if (!chartCanvas || typeof Chart === 'undefined') return;

  const ctx = chartCanvas.getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: '24h Volume',
        data: [45, 38, 52, 41, 55, 48, 60],
        borderColor: '#1e6fff',
        backgroundColor: 'rgba(30, 111, 255, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { display: false },
          ticks: { display: false }
        },
        x: {
          grid: { display: false },
          ticks: { display: false }
        }
      }
    }
  });
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Animated Background Canvas (Crypto Ticker Animation)
function initCryptoBackground() {
  const canvas = document.getElementById('crypto-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const particles = [];
  const cryptoSymbols = ['₿', '◆', '◇', '✦', '✧', '※', '⟡'];
  let animationId;

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.size = Math.random() * 30 + 10;
      this.opacity = Math.random() * 0.3 + 0.1;
      this.symbol = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)];
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#1e6fff';
      ctx.font = `${this.size}px Arial`;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillText(this.symbol, 0, 0);
      ctx.restore();
    }
  }

  // Create particles
  for (let i = 0; i < 15; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  });
}

// Chart Tab Switching
document.querySelectorAll('.chart-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// Set first chart tab as active
const firstTab = document.querySelector('.chart-tab');
if (firstTab) firstTab.classList.add('active');

// Redirect to Login
function redirectToLogin() {
  window.location.href = 'login.html';
}

// Handle Sign In Button
document.addEventListener('DOMContentLoaded', () => {
  const signInBtn = document.querySelector('.nav-btn-signin');
  if (signInBtn) {
    signInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      redirectToLogin();
    });
  }

  // Handle Hero CTA Buttons
  const ctaButtons = document.querySelectorAll('.btn');
  ctaButtons.forEach(btn => {
    if (btn.textContent.includes('Get Started') || btn.textContent.includes('Start Trading')) {
      btn.addEventListener('click', redirectToLogin);
    }
  });

  // Handle Account Card Buttons
  const accountBtns = document.querySelectorAll('.account-btn');
  accountBtns.forEach(btn => {
    btn.addEventListener('click', redirectToLogin);
  });

  // Initialize all interactive elements
  initTradingViewWidget();
  initMiniCharts();
  initCryptoBackground();
});

// Number Counter Animation (for statistics)
function animateCounters() {
  const counters = document.querySelectorAll('[data-target]');
  
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const increment = target / 100;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        counter.textContent = target + counter.dataset.suffix;
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current) + counter.dataset.suffix;
      }
    }, 20);
  });
}

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe sections
document.querySelectorAll('section').forEach(section => {
  observer.observe(section);
});

// Add scroll animations class
const style = document.createElement('style');
style.textContent = `
  section {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  
  section.in-view {
    opacity: 1;
    transform: translateY(0);
  }

  .feature-card {
    transition: all 0.3s ease;
  }

  .vip-card {
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);

// Language Selector
const langSelect = document.querySelector('.nav-select');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    console.log('Language changed to:', e.target.value);
    // Add language switching logic here
  });
}

// Buy/Sell Button Actions
document.querySelectorAll('.buy-btn, .sell-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    redirectToLogin();
  });
});

// Mobile Menu Toggle (if needed)
function setupMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  if (!navMenu) return;

  // Add mobile hamburger logic here if needed
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      if (navMenu.style.display) navMenu.style.display = '';
    }
  });
}

setupMobileMenu();
