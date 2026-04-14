import { App } from '@modelcontextprotocol/ext-apps';

// ─── State ──────────────────────────────────────────────────────────

let currentSign = 'aries';
let currentQuote = '';
let currentAuthor = '';

const SIGN_NAMES = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};

// ─── DOM References ─────────────────────────────────────────────────

const cardPreview = document.getElementById('card-preview');
const signLabel = document.getElementById('sign-label');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMsg = document.getElementById('error-message');

// ─── App Initialization ─────────────────────────────────────────────

const app = new App({ name: 'share-card', version: '1.0.0' });

app.ontoolresult = (result) => {
  // Parse the initial tool result to get SVG and data
  const textContent = result.content?.find((c) => c.type === 'text');
  if (!textContent?.text) return;

  try {
    const data = JSON.parse(textContent.text);
    if (data.svg) {
      renderCard(data.svg);
    }
    if (data.sign) {
      currentSign = data.sign;
      currentQuote = data.quote || '';
      currentAuthor = data.quoteAuthor || '';
      setActiveSign(currentSign);
    }
  } catch {
    // If not JSON, try rendering as raw SVG
    if (textContent.text.includes('<svg')) {
      renderCard(textContent.text);
    }
  }
};

app.connect();

// ─── Card Rendering ─────────────────────────────────────────────────

function renderCard(svg) {
  cardPreview.innerHTML = svg;
  hideLoading();
  hideError();
}

// ─── Sign Picker ────────────────────────────────────────────────────

function setActiveSign(sign) {
  document.querySelectorAll('.sign-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sign === sign);
  });
  signLabel.textContent = SIGN_NAMES[sign] || sign;
}

document.getElementById('sign-picker').addEventListener('click', async (e) => {
  const btn = e.target.closest('.sign-btn');
  if (!btn || btn.dataset.sign === currentSign) return;

  const newSign = btn.dataset.sign;
  currentSign = newSign;
  setActiveSign(newSign);
  showLoading();
  hideError();

  try {
    const result = await app.callServerTool({
      name: 'content_share_card',
      arguments: {
        sign: newSign,
        quote: currentQuote,
        quote_author: currentAuthor,
      },
    });

    const textContent = result.content?.find((c) => c.type === 'text');
    if (textContent?.text) {
      const data = JSON.parse(textContent.text);
      if (data.svg) {
        renderCard(data.svg);
      }
    }
  } catch (err) {
    showError(err.message || 'Failed to generate card');
  }
});

// ─── Loading & Error ────────────────────────────────────────────────

function showLoading() {
  loadingEl.classList.remove('hidden');
}

function hideLoading() {
  loadingEl.classList.add('hidden');
}

function showError(msg) {
  hideLoading();
  errorMsg.textContent = msg;
  errorEl.classList.remove('hidden');
}

function hideError() {
  errorEl.classList.add('hidden');
}
