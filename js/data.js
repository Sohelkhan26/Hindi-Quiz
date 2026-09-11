/**
 * Data Loader & Indexer
 * Asynchronously loads and normalizes educational content from JSON files.
 */

class DataLoader {
  constructor() {
    this.vowels = [];
    this.consonants = [];
    this.nukta = [];
    this.matras = null;
    this.conjuncts = [];
    this.confusing = [];
    this.words = [];
    this.allCharacters = [];
    this.isLoaded = false;
  }

  async init() {
    if (this.isLoaded) return;
    try {
      const [
        vowelsRes,
        consonantsRes,
        nuktaRes,
        matrasRes,
        conjunctsRes,
        confusingRes,
        wordsRes
      ] = await Promise.all([
        fetch('./data/vowels.json').then(r => r.json()),
        fetch('./data/consonants.json').then(r => r.json()),
        fetch('./data/nukta.json').then(r => r.json()),
        fetch('./data/matras.json').then(r => r.json()),
        fetch('./data/conjuncts.json').then(r => r.json()),
        fetch('./data/confusing.json').then(r => r.json()),
        fetch('./data/words.json').then(r => r.json())
      ]);

      this.vowels = vowelsRes;
      this.consonants = consonantsRes;
      this.nukta = nuktaRes;
      this.matras = matrasRes;
      this.conjuncts = conjunctsRes;
      this.confusing = confusingRes;
      this.words = wordsRes;

      // Build unified character list for practice & lookup
      this.allCharacters = [
        ...this.vowels.map(v => ({ ...v, type: 'vowel' })),
        ...this.consonants.map(c => ({ ...c, type: 'consonant' })),
        ...this.nukta.map(n => ({ ...n, type: 'nukta' })),
        ...this.conjuncts.map(j => ({ ...j, type: 'conjunct' }))
      ];

      this.isLoaded = true;
    } catch (e) {
      console.error('Failed to load JSON alphabet datasets:', e);
      throw e;
    }
  }

  getAll() {
    return this.allCharacters;
  }

  getVowels() {
    return this.vowels;
  }

  getConsonants() {
    return this.consonants;
  }

  getNukta() {
    return this.nukta;
  }

  getMatras() {
    return this.matras;
  }

  getConjuncts() {
    return this.conjuncts;
  }

  getConfusing() {
    return this.confusing;
  }

  getWords() {
    return this.words;
  }

  getById(id) {
    return this.allCharacters.find(c => c.id === id) || null;
  }
}

export const Data = new DataLoader();
