/**
 * Full-Screen Tofugu-Style Practice Engine
 * Renders all characters across the screen in responsive cards.
 * Accepts Avro and/or Bangla input. Does NOT reveal answers on wrong attempts.
 * Right answers & explanations are revealed only after clicking "Finish Quiz".
 * Tracks characters with 5 or more wrong attempts in localStorage.
 */

import { Data } from './data.js';
import { Speech } from './speech.js';
import { Storage } from './storage.js';

export const Practice = {
  activeCategory: 'all',
  inputMode: 'both', // 'avro', 'bangla', 'both'
  cards: [],
  solvedCount: 0,
  isFinished: false,
  wrongAttemptMap: {}, // { [charId]: number }

  init() {
    this.bindControls();
    this.loadCards();
  },

  bindControls() {
    // Category tabs
    document.querySelectorAll('.quiz-filter-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.quiz-filter-tab').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.cat;
        this.loadCards();
      });
    });

    // Input mode toggle buttons
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.inputMode = e.currentTarget.dataset.mode;
        this.updateInputPlaceholders();
      });
    });

    // Finish Quiz button
    document.getElementById('btnFinishQuiz')?.addEventListener('click', () => {
      this.finishQuiz();
    });

    // Restart Quiz button
    document.getElementById('btnRestartQuiz')?.addEventListener('click', () => {
      this.loadCards();
    });

    // Review Board button from modal
    document.getElementById('btnReviewBoard')?.addEventListener('click', () => {
      document.getElementById('quizResultsModal')?.classList.add('hidden');
    });

    // Practice only 5+ weak characters button
    document.getElementById('btnPracticeOnlyWeak')?.addEventListener('click', () => {
      document.getElementById('quizResultsModal')?.classList.add('hidden');
      this.filterToWeakCharacters();
    });
  },

  filterToWeakCharacters() {
    const weakList = Storage.getWeakCharacters();
    if (weakList.length === 0) {
      alert('আপনার কোনো ৫+ বার ভুল হওয়া বর্ণ নেই!');
      return;
    }

    document.querySelectorAll('.quiz-filter-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === 'weak');
    });
    this.activeCategory = 'weak';
    this.loadCards();
  },

  loadCards() {
    this.isFinished = false;
    this.solvedCount = 0;
    this.wrongAttemptMap = {};

    let list = [];

    if (this.activeCategory === 'vowels') {
      list = Data.getVowels();
    } else if (this.activeCategory === 'consonants') {
      list = Data.getConsonants();
    } else if (this.activeCategory === 'nukta') {
      list = Data.getNukta();
    } else if (this.activeCategory === 'conjuncts') {
      list = Data.getConjuncts();
    } else if (this.activeCategory === 'weak') {
      const weakStored = Storage.getWeakCharacters();
      if (weakStored.length === 0) {
        alert('এখনো কোনো বর্ণ ৫ বা তার বেশি বার ভুল হয়নি।');
        this.activeCategory = 'all';
        document.querySelectorAll('.quiz-filter-tab').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === 'all');
        });
        list = Data.getAll();
      } else {
        // Map stored weak IDs back to full character data
        list = weakStored.map(w => Data.getById(w.id) || w);
      }
    } else {
      list = Data.getAll();
    }

    this.cards = list.map(item => ({
      ...item,
      isSolved: false,
      userAnswer: '',
      attempts: 0
    }));

    this.renderBoard();
    this.updateStats();

    // Auto-focus the first input
    setTimeout(() => {
      const firstInput = document.querySelector('.card-input:not([disabled])');
      if (firstInput) firstInput.focus();
    }, 100);
  },

  updateInputPlaceholders() {
    const inputs = document.querySelectorAll('.card-input');
    let ph = 'e.g. ka / ক';
    if (this.inputMode === 'avro') ph = 'e.g. ka';
    if (this.inputMode === 'bangla') ph = 'যেমন: ক';

    inputs.forEach(inp => {
      if (!inp.disabled) inp.placeholder = ph;
    });
  },

  renderBoard() {
    const grid = document.getElementById('kanaQuizGrid');
    if (!grid) return;

    if (this.cards.length === 0) {
      grid.innerHTML = `<div class="empty-quiz-notice">কোনো বর্ণ পাওয়া যায়নি। অন্য বিভাগ নির্বাচন করুন।</div>`;
      return;
    }

    let placeholder = 'e.g. ka / ক';
    if (this.inputMode === 'avro') placeholder = 'e.g. ka';
    if (this.inputMode === 'bangla') placeholder = 'যেমন: ক';

    grid.innerHTML = this.cards.map((card, idx) => {
      const dev = card.devanagari || card.hindi || '';
      return `
        <div class="kana-card" id="card-${idx}" data-idx="${idx}">
          <div class="kana-glyph">${dev}</div>
          <input type="text" 
                 class="card-input" 
                 data-idx="${idx}"
                 placeholder="${placeholder}"
                 autocomplete="off" 
                 autocorrect="off" 
                 autocapitalize="off" 
                 spellcheck="false" />
          <div class="card-solution hidden" id="sol-${idx}"></div>
        </div>
      `;
    }).join('');

    // Bind input and key events
    grid.querySelectorAll('.card-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const idx = parseInt(e.currentTarget.dataset.idx, 10);
          this.checkCard(idx, e.currentTarget.value.trim());
        }
      });
    });

    // Close modal if open
    document.getElementById('quizResultsModal')?.classList.add('hidden');
  },

  checkCard(idx, value) {
    if (this.isFinished) return;
    const card = this.cards[idx];
    if (!card || card.isSolved) return;

    const cardEl = document.getElementById(`card-${idx}`);
    const inputEl = cardEl?.querySelector('.card-input');
    if (!inputEl) return;

    const normalizedVal = value.trim().toLowerCase();
    if (!normalizedVal) return;

    // Check validity based on active input mode
    let isCorrect = false;
    const validAvros = Array.isArray(card.avro) 
      ? card.avro.map(a => a.toLowerCase()) 
      : [String(card.avro || '').toLowerCase()];
    
    const validBangla = card.bengali ? card.bengali.split(' ')[0].trim() : '';

    if (this.inputMode === 'avro') {
      isCorrect = validAvros.includes(normalizedVal);
    } else if (this.inputMode === 'bangla') {
      isCorrect = (normalizedVal === validBangla);
    } else {
      // Both accepted
      isCorrect = validAvros.includes(normalizedVal) || (normalizedVal === validBangla);
    }

    if (isCorrect) {
      card.isSolved = true;
      card.userAnswer = value;
      this.solvedCount += 1;

      cardEl.classList.add('correct');
      inputEl.disabled = true;
      inputEl.classList.add('solved-input');

      Speech.playCorrect();
      this.updateStats();

      // If this card previously had 5+ errors and user got it right, record it
      Storage.recordCorrect(card);

      // Smoothly focus NEXT unsolved card
      this.focusNextUnsolved(idx);

      // Check if all cards are solved
      if (this.solvedCount === this.cards.length) {
        setTimeout(() => this.finishQuiz(), 400);
      }
    } else {
      // WRONG ATTEMPT:
      // Do NOT reveal the right answer!
      // Shake the card, increment wrong count, keep input for retrying
      card.attempts += 1;
      const charId = card.id || `char_${idx}`;
      this.wrongAttemptMap[charId] = (this.wrongAttemptMap[charId] || 0) + 1;

      // Check if reached 5 or more wrong attempts
      if (this.wrongAttemptMap[charId] >= 5) {
        Storage.recordWrong(card);
      }

      cardEl.classList.add('incorrect-shake');
      Speech.playIncorrect();

      setTimeout(() => {
        cardEl.classList.remove('incorrect-shake');
      }, 500);

      // Clear input and keep focus so user can try as many times as they want
      inputEl.value = '';
      inputEl.focus();
    }
  },

  focusNextUnsolved(currentIdx) {
    const total = this.cards.length;
    for (let step = 1; step < total; step++) {
      const nextIdx = (currentIdx + step) % total;
      if (!this.cards[nextIdx].isSolved) {
        const nextInput = document.querySelector(`.card-input[data-idx="${nextIdx}"]`);
        if (nextInput && !nextInput.disabled) {
          nextInput.focus();
          return;
        }
      }
    }
  },

  updateStats() {
    const countEl = document.getElementById('quizScoreTracker');
    if (countEl) {
      countEl.textContent = `${this.solvedCount} / ${this.cards.length}`;
    }
  },

  finishQuiz() {
    this.isFinished = true;
    const modal = document.getElementById('quizResultsModal');
    const modalScore = document.getElementById('modalScoreText');
    const modalPercentage = document.getElementById('modalPercentageText');
    const weakSection = document.getElementById('modalWeakList');

    const total = this.cards.length;
    const solved = this.solvedCount;
    const percent = total > 0 ? Math.round((solved / total) * 100) : 0;

    if (modalScore) modalScore.textContent = `${solved} / ${total}`;
    if (modalPercentage) modalPercentage.textContent = `${percent}%`;

    // Reveal right answers on the cards that were NOT solved!
    this.cards.forEach((card, idx) => {
      const cardEl = document.getElementById(`card-${idx}`);
      const solEl = document.getElementById(`sol-${idx}`);
      const inputEl = cardEl?.querySelector('.card-input');

      if (!card.isSolved) {
        cardEl?.classList.add('unsolved');
        if (inputEl) inputEl.disabled = true;

        const primaryAvro = Array.isArray(card.avro) ? card.avro[0] : card.avro;
        const cleanBangla = card.bengali ? card.bengali.split(' ')[0] : '';

        if (solEl) {
          solEl.innerHTML = `
            <span class="sol-bangla">${cleanBangla}</span>
            <span class="sol-avro">${primaryAvro}</span>
          `;
          solEl.classList.remove('hidden');
          solEl.title = card.soundTip || '';
        }
      }
    });

    // Check for characters with 5+ wrong attempts in storage
    const weakList = Storage.getWeakCharacters();
    if (weakSection) {
      if (weakList.length > 0) {
        weakSection.innerHTML = `
          <div class="weak-list-header">⚠️ ৫ বা তার বেশি বার ভুল হওয়া বর্ণসমূহ:</div>
          <div class="weak-badges-row">
            ${weakList.map(w => `
              <span class="weak-badge" title="${w.soundTip || ''}">
                <strong>${w.devanagari}</strong> = ${w.bengali} (${w.avro}) [ভুল: ${w.wrongCount}]
              </span>
            `).join('')}
          </div>
        `;
        document.getElementById('btnPracticeOnlyWeak')?.classList.remove('hidden');
      } else {
        weakSection.innerHTML = `<p class="no-weak-notice">🎉 দারুণ! কোনো বর্ণেই ৫ বার বা তার বেশি ভুল হয়নি।</p>`;
        document.getElementById('btnPracticeOnlyWeak')?.classList.add('hidden');
      }
    }

    modal?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
