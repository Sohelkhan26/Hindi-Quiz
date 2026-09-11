/**
 * Minimal Storage Manager for Hindi Learning Web App
 * Only tracks characters that have been answered incorrectly 5 or more times.
 * 100% client-side via localStorage.
 */

const STORAGE_KEY = 'hindi_quiz_weak_chars_v2';
const SETTINGS_KEY = 'hindi_quiz_settings_v2';

export const Storage = {
  // Get map of { [charId]: { id, devanagari, bengali, avro, wrongCount } }
  getWrongRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading storage:', e);
      return {};
    }
  },

  // Record an incorrect attempt
  recordWrong(charItem) {
    if (!charItem || !charItem.id) return;
    const records = this.getWrongRecords();
    const id = charItem.id;

    if (!records[id]) {
      records[id] = {
        id,
        devanagari: charItem.devanagari || charItem.hindi || '',
        bengali: charItem.bengali ? charItem.bengali.split(' ')[0] : '',
        avro: Array.isArray(charItem.avro) ? charItem.avro[0] : (charItem.avro || ''),
        soundTip: charItem.soundTip || '',
        wrongCount: 0
      };
    }

    records[id].wrongCount += 1;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error writing storage:', e);
    }
    return records[id].wrongCount;
  },

  // When user successfully answers multiple times, optionally reduce wrong count
  recordCorrect(charItem) {
    if (!charItem || !charItem.id) return;
    const records = this.getWrongRecords();
    const id = charItem.id;

    if (records[id] && records[id].wrongCount >= 5) {
      // If user masters it by answering correctly, we can slowly decrement or keep till cleared
      records[id].wrongCount = Math.max(0, records[id].wrongCount - 1);
      if (records[id].wrongCount < 5) {
        delete records[id];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch (e) {
        console.error('Error writing storage:', e);
      }
    }
  },

  // Returns only characters that have been wrong 5 or more times
  getWeakCharacters() {
    const records = this.getWrongRecords();
    return Object.values(records).filter(c => c.wrongCount >= 5);
  },

  // Clear weak characters
  clearWeakCharacters() {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Settings: dark mode & preferred input mode
  getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { darkMode: false, inputMode: 'both' };
    } catch (e) {
      return { darkMode: false, inputMode: 'both' };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error writing settings:', e);
    }
  }
};
