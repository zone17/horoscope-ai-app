// ─── Philosopher Picker — MCP App ──────────────────────────────────
//
// Interactive UI that COMPOSES existing atomic verbs:
//   • listPhilosophers({tradition, era})      — registry.ts
//   • recommendPhilosophers(sign, count)      — recommend.ts
//
// No new workflows or orchestration. The Picker is a rendering surface over
// pure data. Selection state is local; the only "output" is the confirmed
// council, returned to the MCP client via `app.callServerTool`.

import { App } from '@modelcontextprotocol/ext-apps';
import {
  PHILOSOPHERS,
  TRADITIONS,
  SIGN_NAMES,
  SIGN_SYMBOLS,
} from './philosophers.data.js';
import { listPhilosophers, recommendPhilosophers } from './compose.js';

const MAX_COUNCIL = 5;
const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

// ─── State ──────────────────────────────────────────────────────────

const state = {
  view: 'recommended',     // 'recommended' | 'all' | 'tradition'
  sign: 'aries',
  tradition: TRADITIONS[0],
  selected: new Set(),     // philosopher names
  confirmed: false,
};

// ─── DOM References ─────────────────────────────────────────────────

const els = {
  maxCount: document.getElementById('max-count'),
  councilSlots: document.getElementById('council-slots'),
  confirmBtn: document.getElementById('confirm-btn'),
  viewTabs: document.getElementById('view-tabs'),
  signRow: document.getElementById('sign-row'),
  signPicker: document.getElementById('sign-picker'),
  traditionRow: document.getElementById('tradition-row'),
  traditionPicker: document.getElementById('tradition-picker'),
  list: document.getElementById('philosopher-list'),
  resultBanner: document.getElementById('result-banner'),
  resultMessage: document.getElementById('result-message'),
  cardTemplate: document.getElementById('philosopher-card-template'),
};

els.maxCount.textContent = String(MAX_COUNCIL);

// ─── MCP App connection ─────────────────────────────────────────────

const mcpApp = new App({ name: 'philosopher-picker', version: '1.0.0' });

mcpApp.ontoolresult = (result) => {
  // Accept optional initial state from the server tool (e.g., pre-seeded sign).
  const textContent = result.content?.find((c) => c.type === 'text');
  if (!textContent?.text) return;
  try {
    const data = JSON.parse(textContent.text);
    if (data.sign && SIGNS.includes(data.sign)) {
      state.sign = data.sign;
      renderSignPicker();
      renderList();
    }
  } catch {
    // Non-JSON result — ignore. Never inject raw HTML.
  }
};

mcpApp.connect();

// ─── Renderers ──────────────────────────────────────────────────────

function renderSignPicker() {
  els.signPicker.innerHTML = '';
  for (const sign of SIGNS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sign-btn' + (sign === state.sign ? ' active' : '');
    btn.dataset.sign = sign;
    btn.title = SIGN_NAMES[sign];
    btn.setAttribute('aria-label', SIGN_NAMES[sign]);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', sign === state.sign ? 'true' : 'false');
    btn.textContent = SIGN_SYMBOLS[sign];
    els.signPicker.appendChild(btn);
  }
}

function renderTraditionPicker() {
  els.traditionPicker.innerHTML = '';
  for (const t of TRADITIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tradition-btn' + (t === state.tradition ? ' active' : '');
    btn.dataset.tradition = t;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', t === state.tradition ? 'true' : 'false');
    btn.textContent = t;
    els.traditionPicker.appendChild(btn);
  }
}

function renderViewTabs() {
  for (const tab of els.viewTabs.querySelectorAll('.tab')) {
    const isActive = tab.dataset.view === state.view;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
  els.signRow.classList.toggle('hidden', state.view !== 'recommended');
  els.traditionRow.classList.toggle('hidden', state.view !== 'tradition');
}

function getCurrentList() {
  if (state.view === 'recommended') {
    // Compose: recommendPhilosophers(sign, 10) — give the user breathing room.
    const recs = recommendPhilosophers(state.sign, 10);
    // Merge registry details (description, quote) with the recommendation.
    // `r.reasonKind` ('affinity' | 'wildcard') drives the badge; `r.reason` is the
    // canonical human string from buildReason() and is shown as the card tooltip/label.
    return recs.map((r) => {
      const registry = PHILOSOPHERS.find((p) => p.name === r.name) || {};
      return {
        ...registry,
        ...r,
        reasonLabel: r.reasonKind === 'wildcard' ? 'Surprise pick' : `Matches your ${r.element.toLowerCase()} sign`,
      };
    });
  }
  if (state.view === 'tradition') {
    // Compose: listPhilosophers({tradition}).
    return listPhilosophers({ tradition: state.tradition }).map((p) => ({
      ...p,
      reasonLabel: '',
      reasonKind: '',
    }));
  }
  // 'all' — no filter, just listPhilosophers().
  return listPhilosophers().map((p) => ({
    ...p,
    reasonLabel: '',
    reasonKind: '',
  }));
}

function renderList() {
  const list = getCurrentList();
  els.list.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No philosophers match this filter.';
    els.list.appendChild(empty);
    return;
  }

  const canAdd = state.selected.size < MAX_COUNCIL && !state.confirmed;
  for (const p of list) {
    const card = renderCard(p, canAdd);
    els.list.appendChild(card);
  }
}

function renderCard(p, canAdd) {
  const frag = els.cardTemplate.content.cloneNode(true);
  const article = frag.querySelector('.philosopher-card');
  const nameEl = frag.querySelector('.pc-name');
  const tradEl = frag.querySelector('.pc-tradition');
  const descEl = frag.querySelector('.pc-description');
  const quoteEl = frag.querySelector('.pc-quote');
  const reasonEl = frag.querySelector('.pc-reason');
  const toggleEl = frag.querySelector('.pc-toggle');

  const isSelected = state.selected.has(p.name);
  article.classList.toggle('selected', isSelected);
  article.dataset.name = p.name;

  nameEl.textContent = p.name;
  tradEl.textContent = p.tradition;
  descEl.textContent = p.description || '';
  quoteEl.textContent = p.sampleQuote ? `“${p.sampleQuote}”` : '';

  if (p.reasonLabel) {
    reasonEl.textContent = p.reasonLabel;
    if (p.reasonKind) reasonEl.classList.add(p.reasonKind);
    // Surface the canonical human reason (from buildReason) as hover detail
    // so the "why" behind the badge is reachable without cluttering the card.
    if (p.reason) reasonEl.title = p.reason;
  } else {
    reasonEl.textContent = '';
  }

  toggleEl.textContent = isSelected ? 'Remove' : 'Add';
  toggleEl.classList.toggle('selected', isSelected);
  toggleEl.disabled = state.confirmed || (!isSelected && !canAdd);
  toggleEl.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

  return frag;
}

function renderCouncil() {
  els.councilSlots.replaceChildren();

  if (state.selected.size === 0) {
    const empty = document.createElement('span');
    empty.className = 'council-empty';
    empty.textContent = 'No council yet — pick up to 5 philosophers.';
    els.councilSlots.appendChild(empty);
  } else {
    for (const name of state.selected) {
      const slot = document.createElement('span');
      slot.className = 'council-slot';
      const label = document.createElement('span');
      label.textContent = name;
      slot.appendChild(label);

      if (!state.confirmed) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.setAttribute('aria-label', `Remove ${name}`);
        remove.dataset.name = name;
        remove.dataset.action = 'remove';
        remove.textContent = '×';
        slot.appendChild(remove);
      }
      els.councilSlots.appendChild(slot);
    }
  }

  els.confirmBtn.disabled = state.selected.size === 0 || state.confirmed;
  els.confirmBtn.textContent = state.confirmed ? 'Council confirmed' : 'Confirm council';
}

function showBanner(message, { error = false } = {}) {
  els.resultBanner.classList.remove('hidden', 'error');
  if (error) els.resultBanner.classList.add('error');
  els.resultMessage.textContent = message;
}

// ─── Event Handlers ─────────────────────────────────────────────────

els.viewTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  const view = tab.dataset.view;
  if (!view || view === state.view) return;
  state.view = view;
  renderViewTabs();
  if (state.view === 'tradition') renderTraditionPicker();
  if (state.view === 'recommended') renderSignPicker();
  renderList();
});

els.signPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('.sign-btn');
  if (!btn) return;
  const sign = btn.dataset.sign;
  if (!sign || sign === state.sign) return;
  state.sign = sign;
  renderSignPicker();
  renderList();
});

els.traditionPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('.tradition-btn');
  if (!btn) return;
  const tradition = btn.dataset.tradition;
  if (!tradition || tradition === state.tradition) return;
  state.tradition = tradition;
  renderTraditionPicker();
  renderList();
});

els.list.addEventListener('click', (e) => {
  const toggle = e.target.closest('.pc-toggle');
  if (!toggle) return;
  const card = toggle.closest('.philosopher-card');
  if (!card) return;
  const name = card.dataset.name;
  if (!name || state.confirmed) return;

  if (state.selected.has(name)) {
    state.selected.delete(name);
  } else if (state.selected.size < MAX_COUNCIL) {
    state.selected.add(name);
  }
  renderList();
  renderCouncil();
});

els.councilSlots.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="remove"]');
  if (!btn || state.confirmed) return;
  const name = btn.dataset.name;
  if (!name) return;
  state.selected.delete(name);
  renderList();
  renderCouncil();
});

els.confirmBtn.addEventListener('click', async () => {
  if (state.selected.size === 0 || state.confirmed) return;
  state.confirmed = true;
  renderList();
  renderCouncil();

  const council = Array.from(state.selected).map((name) => {
    const p = PHILOSOPHERS.find((x) => x.name === name);
    return { name: p.name, tradition: p.tradition, era: p.era };
  });

  const payload = {
    sign: state.sign,
    philosophers: council.map((c) => c.name),
    council,
  };

  try {
    // Report the selection back via the philosopher_recommend tool.
    // Using an EXISTING verb — no new workflow, just echoing the chosen set
    // through a tool call so the client sees the structured output.
    const result = await mcpApp.callServerTool({
      name: 'philosopher_picker_confirm',
      arguments: payload,
    });

    const textContent = result.content?.find((c) => c.type === 'text');
    const message = textContent?.text
      ? `Council confirmed: ${council.map((c) => c.name).join(', ')}`
      : `Council confirmed: ${council.map((c) => c.name).join(', ')}`;
    showBanner(message);
  } catch (err) {
    // Allow user to re-edit if the call fails.
    state.confirmed = false;
    renderList();
    renderCouncil();
    showBanner(err?.message || 'Failed to submit council.', { error: true });
  }
});

// ─── Initial Render ─────────────────────────────────────────────────

renderSignPicker();
renderTraditionPicker();
renderViewTabs();
renderCouncil();
renderList();
