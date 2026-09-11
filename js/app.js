/**
 * Application Orchestrator
 * Streamlined to two core sections: Practice (Tofugu style) and Learn.
 */

import { Data } from './data.js';
import { Storage } from './storage.js';
import { Learn } from './learn.js';
import { Practice } from './practice.js';
import { VisitorCounter } from './counter.js';

class AppController {
  constructor() {
    this.currentView = 'practice'; // Default directly to Practice, like Tofugu
  }

  async start() {
    try {
      this.initTheme();

      // Load data
      await Data.init();

      // Initialize practice & learn
      Practice.init();
      Learn.init();

      // Initialize unique visitor counter in header
      VisitorCounter.init('visitorCountBadge');

      this.bindNavigation();

      const initialHash = window.location.hash.replace('#', '');
      if (initialHash === 'learn') {
        this.navigate('learn');
      } else {
        this.navigate('practice');
      }
    } catch (e) {
      console.error('Initialization error:', e);
    }
  }

  initTheme() {
    const settings = Storage.getSettings();
    const isDark = settings.darkMode === true;
    document.documentElement.classList.toggle('dark', isDark);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = isDark ? '☀️' : '🌙';
      themeToggleBtn.title = isDark ? 'Light Mode' : 'Dark Mode';
      themeToggleBtn.addEventListener('click', () => {
        const nextDark = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', nextDark);
        themeToggleBtn.innerHTML = nextDark ? '☀️' : '🌙';
        themeToggleBtn.title = nextDark ? 'Light Mode' : 'Dark Mode';
        settings.darkMode = nextDark;
        Storage.saveSettings(settings);
      });
    }
  }

  bindNavigation() {
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.navTarget;
        this.navigate(target);
      });
    });

    window.addEventListener('hashchange', () => {
      const target = window.location.hash.replace('#', '') || 'practice';
      if (target !== this.currentView) {
        this.navigate(target, false);
      }
    });
  }

  navigate(viewName, updateHash = true) {
    if (viewName !== 'learn' && viewName !== 'practice') {
      viewName = 'practice';
    }

    this.currentView = viewName;

    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.navTarget === viewName);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.add('hidden');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    if (updateHash) {
      window.location.hash = viewName;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.App = new AppController();
document.addEventListener('DOMContentLoaded', () => {
  window.App.start();
});
