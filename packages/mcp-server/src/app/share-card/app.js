import { App } from '@modelcontextprotocol/ext-apps';

// ─── State ──────────────────────────────────────────────────────────

let currentSign = 'aries';
let currentQuote = '';
let currentAuthor = '';
let hasInitialData = false;

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
      hasInitialData = !!(currentQuote && currentAuthor);
      setActiveSign(currentSign);
      updateSignPickerState();
    }
  } catch {
    // Non-JSON results are ignored for safety — no raw HTML injection
  }
};

app.connect();

// ─── Card Rendering ─────────────────────────────────────────────────

/**
 * Safely render SVG into the preview container.
 * Uses DOMParser to parse SVG and validate it's a real SVG element,
 * preventing script injection via innerHTML.
 */
function renderCard(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.documentElement;

  // Verify we got a valid SVG element (not a parse error document)
  if (svgEl.tagName !== 'svg' || doc.querySelector('parsererror')) {
    showError('Invalid card data received');
    return;
  }

  // Strip any script elements or event handlers for defense in depth
  svgEl.querySelectorAll('script, foreignObject').forEach((el) => el.remove());

  cardPreview.replaceChildren(document.importNode(svgEl, true));
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

function updateSignPickerState() {
  // Disable sign picker until we have quote/author data to send
  document.querySelectorAll('.sign-btn').forEach((btn) => {
    btn.disabled = !hasInitialData;
    btn.style.opacity = hasInitialData ? '1' : '0.4';
  });
}

// Initialize picker as disabled until data arrives
updateSignPickerState();

document.getElementById('sign-picker').addEventListener('click', async (e) => {
  const btn = e.target.closest('.sign-btn');
  if (!btn || btn.disabled || btn.dataset.sign === currentSign) return;

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
      try {
        const data = JSON.parse(textContent.text);
        if (data.svg) {
          renderCard(data.svg);
          return;
        }
      } catch {
        // Non-JSON response
      }
    }
    // If we get here, no SVG was rendered
    hideLoading();
    showError('No card data in response');
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
