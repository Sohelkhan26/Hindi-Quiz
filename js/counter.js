/**
 * Actual Unique Visitor Counter
 * Only increments once per unique visitor (persisted in localStorage).
 * Returns the live total unique count from CounterAPI.
 */

const COUNTER_NAMESPACE = 'hindi-alphabet-bangla-tofugu';
const COUNTER_KEY = 'unique_visitors';
const HAS_VISITED_KEY = 'has_counted_unique_visit_v1';
const CACHED_COUNT_KEY = 'cached_unique_visitor_count';

export const VisitorCounter = {
  async init(elementId = 'visitorCountBadge') {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Load cached count first
    let count = parseInt(localStorage.getItem(CACHED_COUNT_KEY) || '1', 10);
    this.render(el, count);

    const hasVisited = localStorage.getItem(HAS_VISITED_KEY) === 'true';

    try {
      // If the user has never visited this site before on this browser, increment (/up)
      // Otherwise, just fetch the current count (/get)
      const action = hasVisited ? 'get' : 'up';
      const endpoint = `https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/${action}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.count === 'number') {
          count = data.count;
          localStorage.setItem(CACHED_COUNT_KEY, count.toString());
          localStorage.setItem(HAS_VISITED_KEY, 'true');
          this.render(el, count, true);
          return;
        }
      }
    } catch (e) {
      // In case network is offline, increment locally if first time
      if (!hasVisited) {
        count += 1;
        localStorage.setItem(CACHED_COUNT_KEY, count.toString());
        localStorage.setItem(HAS_VISITED_KEY, 'true');
      }
    }

    this.render(el, count, false);
  },

  render(el, count, isLive = false) {
    el.innerHTML = `
      <span class="visitor-icon">👥</span>
      <span class="visitor-label">Visitors:</span>
      <span class="visitor-num">${Number(count).toLocaleString('en-US')}</span>
    `;
  }
};
