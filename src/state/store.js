/**
 * store.js — Centralised application state
 *
 * Minimal observable pattern. Conceptually equivalent to
 * useState + useEffect (React) or reactive() (Vue).
 * Any framework store can replace it without touching the
 * data layer or the components.
 */

const store = {
  _state: {
    projects:   [],   // array of project objects
    loading:    false,
    error:      null,
  },

  _listeners: new Set(),

  /** Returns a copy of the state (immutable from outside) */
  getState() {
    return { ...this._state };
  },

  /**
   * Updates the state and notifies every subscriber.
   * @param {Partial<typeof this._state>} patch
   */
  setState(patch) {
    this._state = { ...this._state, ...patch };
    this._listeners.forEach(fn => fn(this._state));
  },

  /**
   * Subscribes a function to the state. Returns an unsubscribe.
   * @param {(state: object) => void} fn
   * @returns {() => void}
   */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
};

export default store;
