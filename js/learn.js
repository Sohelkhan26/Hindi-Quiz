/**
 * Learn Section Controller
 * Simple reference viewer for Hindi characters, matras, and words.
 */

import { Data } from './data.js';
import { Speech } from './speech.js';
import { Practice } from './practice.js';

export const Learn = {
  currentCategory: 'vowels',
  currentIndex: 0,
  currentList: [],
  selectedConsonantForMatra: 'क',

  init() {
    this.bindCategoryTabs();
    this.bindMatraSelector();
    this.selectCategory('vowels');
  },

  bindCategoryTabs() {
    const tabs = document.querySelectorAll('.learn-nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.category;
        this.selectCategory(cat);
      });
    });

    document.addEventListener('keydown', (e) => {
      const learnContainer = document.getElementById('view-learn');
      if (!learnContainer || learnContainer.classList.contains('hidden')) return;

      if (e.key === 'ArrowLeft') {
        this.prevCard();
      } else if (e.key === 'ArrowRight') {
        this.nextCard();
      }
    });
  },

  selectCategory(category) {
    this.currentCategory = category;
    this.currentIndex = 0;

    document.querySelectorAll('.learn-nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.category === category);
    });

    const cardViewer = document.getElementById('learnCardViewer');
    const matraViewer = document.getElementById('learnMatraViewer');
    const wordsViewer = document.getElementById('learnWordsViewer');

    if (category === 'matras') {
      cardViewer?.classList.add('hidden');
      wordsViewer?.classList.add('hidden');
      matraViewer?.classList.remove('hidden');
      this.renderMatraSection();
      return;
    }

    if (category === 'words') {
      cardViewer?.classList.add('hidden');
      matraViewer?.classList.add('hidden');
      wordsViewer?.classList.remove('hidden');
      this.renderWordsSection();
      return;
    }

    matraViewer?.classList.add('hidden');
    wordsViewer?.classList.add('hidden');
    cardViewer?.classList.remove('hidden');

    if (category === 'vowels') {
      this.currentList = Data.getVowels();
    } else if (category === 'consonants') {
      this.currentList = Data.getConsonants();
    } else if (category === 'nukta') {
      this.currentList = Data.getNukta();
    } else if (category === 'conjuncts') {
      this.currentList = Data.getConjuncts();
    }

    this.renderCharacterGrid();
    this.renderActiveCard();
  },

  renderCharacterGrid() {
    const gridEl = document.getElementById('characterPillGrid');
    if (!gridEl) return;

    gridEl.innerHTML = this.currentList.map((item, idx) => {
      const dev = item.devanagari || item.hindi || '';
      const ben = item.bengali ? item.bengali.split(' ')[0] : '';
      const isSelected = idx === this.currentIndex;
      return `
        <button class="char-pill ${isSelected ? 'active' : ''}" data-index="${idx}">
          <span class="pill-dev">${dev}</span>
          <span class="pill-ben">${ben}</span>
        </button>
      `;
    }).join('');

    gridEl.querySelectorAll('.char-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        this.currentIndex = idx;
        this.renderActiveCard();
        this.updateGridSelection();
      });
    });
  },

  updateGridSelection() {
    const pills = document.querySelectorAll('#characterPillGrid .char-pill');
    pills.forEach((p, idx) => {
      p.classList.toggle('active', idx === this.currentIndex);
    });
  },

  renderActiveCard() {
    const cardEl = document.getElementById('activeLearnCard');
    if (!cardEl || !this.currentList[this.currentIndex]) return;

    const item = this.currentList[this.currentIndex];
    const dev = item.devanagari || item.hindi || '';
    const ben = item.bengali || '';
    const avro = Array.isArray(item.avro) ? item.avro.join(', ') : (item.avro || '');
    const groupName = item.groupName || '';

    cardEl.innerHTML = `
      <div class="card-header-meta">
        <span class="badge-group">${groupName || 'বর্ণ'}</span>
        <span class="card-counter">${this.currentIndex + 1} / ${this.currentList.length}</span>
      </div>

      <div class="devanagari-hero-box">
        <div class="hero-character-wrapper">
          <span class="devanagari-hero">${dev}</span>
          <button class="btn-audio-hero" id="btnPlayCharAudio" title="উচ্চারণ শুনুন">
            🔊
          </button>
        </div>

        <div class="character-bridges">
          <div class="bridge-item">
            <span class="bridge-label">বাংলা সমতুল্য</span>
            <span class="bridge-value bengali-text">${ben}</span>
          </div>
          <div class="bridge-item">
            <span class="bridge-label">Avro / Roman</span>
            <span class="bridge-value avro-text">${avro}</span>
          </div>
        </div>
      </div>

      ${item.soundTip ? `
      <div class="bridge-tip-box">
        <p>${item.soundTip}</p>
      </div>` : ''}

      ${item.exampleHindi ? `
      <div class="card-example-section">
        <div class="example-header">
          <span>হিন্দি শব্দে প্রয়োগ</span>
          <button class="btn-audio-small" id="btnPlayWordAudio" style="background:none;border:none;cursor:pointer;color:#1d78b9;font-weight:600;">
            🔊 শুনুন
          </button>
        </div>
        <div class="example-card">
          <div class="ex-hindi">${item.exampleHindi}</div>
          <div class="ex-details">
            <strong>${item.exampleBangla}</strong> <span>(${item.exampleMeaning})</span>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="card-navigation-bar">
        <button class="btn-nav" id="btnPrevCard" ${this.currentIndex === 0 ? 'disabled' : ''}>
          ← পূর্ববর্তী
        </button>
        <button class="btn-quick-quiz" id="btnQuickPracticeThis">
          🎯 এই বর্ণগুলো কুইজে প্র্যাকটিস করুন
        </button>
        <button class="btn-nav" id="btnNextCard" ${this.currentIndex === this.currentList.length - 1 ? 'disabled' : ''}>
          পরবর্তী →
        </button>
      </div>
    `;

    cardEl.querySelector('#btnPlayCharAudio')?.addEventListener('click', () => {
      Speech.speak(dev);
    });

    cardEl.querySelector('#btnPlayWordAudio')?.addEventListener('click', () => {
      Speech.speak(item.audioWord || item.exampleHindi);
    });

    cardEl.querySelector('#btnPrevCard')?.addEventListener('click', () => this.prevCard());
    cardEl.querySelector('#btnNextCard')?.addEventListener('click', () => this.nextCard());

    cardEl.querySelector('#btnQuickPracticeThis')?.addEventListener('click', () => {
      window.App.navigate('practice');
      Practice.activeCategory = this.currentCategory;
      document.querySelectorAll('.quiz-filter-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === this.currentCategory);
      });
      Practice.loadCards();
    });

    this.updateGridSelection();
  },

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      this.renderActiveCard();
    }
  },

  nextCard() {
    if (this.currentIndex < this.currentList.length - 1) {
      this.currentIndex += 1;
      this.renderActiveCard();
    }
  },

  bindMatraSelector() {
    const buttons = document.querySelectorAll('.matra-consonant-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        buttons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedConsonantForMatra = e.currentTarget.dataset.char;
        this.renderMatraSection();
      });
    });
  },

  renderMatraSection() {
    const container = document.getElementById('matraMatrixContainer');
    const matraData = Data.getMatras();
    if (!container || !matraData) return;

    const consonant = this.selectedConsonantForMatra || 'क';
    const consonantObj = Data.getConsonants().find(c => c.devanagari === consonant) || { bengali: 'ক', avro: ['k'] };
    const bengaliBase = consonantObj.bengali ? consonantObj.bengali.split(' ')[0] : 'ক';

    container.innerHTML = `
      <div class="matra-grid">
        ${matraData.matras.map(m => {
          let combinedHindi = '';
          let combinedBangla = '';

          if (m.symbol === '्') {
            combinedHindi = consonant + '्';
            combinedBangla = bengaliBase + '্';
          } else if (m.symbol === 'ि') {
            combinedHindi = 'ि' + consonant;
            combinedBangla = bengaliBase + m.bengaliKar;
          } else if (consonant === 'र' && (m.symbol === 'ु' || m.symbol === 'ू')) {
            combinedHindi = m.symbol === 'ु' ? 'रु' : 'रू';
            combinedBangla = bengaliBase + m.bengaliKar;
          } else {
            combinedHindi = consonant + m.symbol;
            combinedBangla = bengaliBase + m.bengaliKar;
          }

          return `
            <div class="matra-card" data-speak="${combinedHindi}">
              <div class="matra-symbols">
                <span class="matra-sign">${m.symbol}</span>
                <span>↔</span>
                <span class="matra-bengali-kar">${m.bengaliKar}</span>
              </div>
              <div class="matra-combined">
                <span>${combinedHindi}</span>
                <span style="color:var(--text-muted);">${combinedBangla}</span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted);">${m.explanation}</p>
            </div>
          `;
        }).join('')}
      </div>

      <div class="special-ra-box">
        <h4>⚡ ${matraData.specialRuleRa.title}</h4>
        <p style="font-size:0.9rem;color:var(--text-muted);">${matraData.specialRuleRa.explanation}</p>
        <div class="special-ra-examples">
          ${matraData.specialRuleRa.examples.map(ex => `
            <div class="ra-ex-item" data-speak="${ex.devanagari.split('=')[1]?.trim() || ex.devanagari}">
              <strong style="color:#1d78b9;">${ex.devanagari}</strong>
              <span>${ex.bengali}</span>
              <span style="font-size:0.85rem;color:var(--text-muted);">${ex.word}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.matra-card, .ra-ex-item').forEach(card => {
      card.addEventListener('click', (e) => {
        const text = e.currentTarget.dataset.speak;
        if (text) Speech.speak(text);
      });
    });
  },

  renderWordsSection() {
    const container = document.getElementById('wordsListContainer');
    const words = Data.getWords();
    if (!container || !words) return;

    container.innerHTML = `
      <div class="words-grid">
        ${words.map(w => `
          <div class="word-card" data-word="${w.hindi}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="word-hindi">${w.hindi}</span>
              <button style="background:none;border:none;cursor:pointer;font-size:1.1rem;">🔊</button>
            </div>
            <div class="word-breakdown">
              <code>${w.breakdown}</code>
            </div>
            <div class="word-details">
              <div><strong>${w.bengaliPhonetic}</strong> (${w.avro})</div>
              <div>অর্থ: ${w.bengali} (${w.english})</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.word-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const word = e.currentTarget.dataset.word;
        if (word) Speech.speak(word);
      });
    });
  }
};
