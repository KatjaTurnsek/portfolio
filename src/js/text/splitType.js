/**
 * @file splitType.js
 * @description Lazy SplitType loader (avoids breaking if dependency changes).
 */

/** @type {any|null} */
let _SplitType = null;
/** @type {Promise<any>|null} */
let _loading = null;

/**
 * Get SplitType (lazy loaded). Returns null if not available.
 * @returns {Promise<any|null>}
 */
export async function getSplitType() {
  if (_SplitType) return _SplitType;
  if (_loading) return _loading;

  _loading = (async () => {
    // Prefer global (if you ever load it via script)
    if (typeof window !== 'undefined' && window.SplitType) {
      _SplitType = window.SplitType;
      return _SplitType;
    }

    // Try module import
    try {
      const mod = await import('split-type');
      _SplitType = mod?.default || mod;
      return _SplitType || null;
    } catch {
      return null;
    } finally {
      _loading = null;
    }
  })();

  return _loading;
}
