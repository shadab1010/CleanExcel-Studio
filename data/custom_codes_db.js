/**
 * CleanExcel Studio - Custom Underwriting Codes Database & Storage Manager
 * 
 * Provides live persistence (localStorage + JSON export/import) for user-defined
 * Occupancy and Construction codes, descriptions, categories, and keyword rules.
 * Automatically merges with the built-in Touchstone UNICEDE® master dataset.
 */

(function (root) {
  'use strict';

  const STORAGE_KEY = 'cleanexcel_underwriting_custom_db_v1';

  // In-memory fallback if localStorage is unavailable
  let _memoryStore = {
    occupancy: {},
    construction: {},
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString()
    }
  };

  function _getStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return {
              occupancy: parsed.occupancy || {},
              construction: parsed.construction || {},
              metadata: parsed.metadata || { version: '1.0', lastUpdated: new Date().toISOString() }
            };
          }
        }
      }
    } catch (err) {
      console.warn('[CustomCodesDB] Error accessing localStorage:', err);
    }
    return _memoryStore;
  }

  function _saveStorage(data) {
    _memoryStore = data;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        data.metadata = data.metadata || {};
        data.metadata.lastUpdated = new Date().toISOString();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('[CustomCodesDB] Failed to persist to localStorage:', err);
    }
    _notifySubscribers();
  }

  const _subscribers = new Set();
  function _notifySubscribers() {
    _subscribers.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
    if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('cleanexcel:custom_db_updated', {
        detail: { timestamp: Date.now() }
      }));
    }
  }

  function _getTouchstoneData() {
    if (typeof TouchstoneData !== 'undefined') return TouchstoneData;
    if (root.TouchstoneData) return root.TouchstoneData;
    if (typeof globalThis !== 'undefined' && globalThis.TouchstoneData) return globalThis.TouchstoneData;
    return null;
  }

  const CustomCodesDB = {
    STORAGE_KEY,

    /**
     * Subscribe to database change events
     */
    subscribe(callback) {
      if (typeof callback === 'function') {
        _subscribers.add(callback);
        return () => _subscribers.delete(callback);
      }
      return () => { };
    },

    /**
     * Get all raw custom overrides / additions for a section ('occupancy' | 'construction')
     */
    getCustomData(section) {
      const store = _getStorage();
      return (section && store[section]) || {};
    },

    /**
     * Get merged dictionary for Occupancy codes (Built-in + Custom overrides/additions)
     */
    getMergedOccupancy() {
      const td = _getTouchstoneData();
      const base = (td && td.OCCUPANCY) ? { ...td.OCCUPANCY } : {};
      const custom = this.getCustomData('occupancy');

      for (const [code, item] of Object.entries(custom)) {
        if (item._deleted) {
          delete base[code];
        } else {
          base[code] = {
            ...base[code],
            ...item,
            code: String(code),
            isCustom: !td || !td.OCCUPANCY || !td.OCCUPANCY[code],
            isModified: !!(td && td.OCCUPANCY && td.OCCUPANCY[code])
          };
        }
      }
      return base;
    },

    /**
     * Get merged dictionary for Construction codes (Built-in + Custom overrides/additions)
     */
    getMergedConstruction() {
      const td = _getTouchstoneData();
      const base = (td && td.CONSTRUCTION) ? { ...td.CONSTRUCTION } : {};
      const custom = this.getCustomData('construction');

      for (const [code, item] of Object.entries(custom)) {
        if (item._deleted) {
          delete base[code];
        } else {
          base[code] = {
            ...base[code],
            ...item,
            code: String(code),
            isCustom: !td || !td.CONSTRUCTION || !td.CONSTRUCTION[code],
            isModified: !!(td && td.CONSTRUCTION && td.CONSTRUCTION[code])
          };
        }
      }
      return base;
    },

    /**
     * Get merged list of code objects for a given section ('occupancy' | 'construction')
     */
    getMergedList(section) {
      if (section === 'occupancy') {
        return Object.values(this.getMergedOccupancy());
      }
      if (section === 'construction') {
        return Object.values(this.getMergedConstruction());
      }
      return [];
    },

    /**
     * Get a single code definition
     */
    getCode(section, code) {
      const strCode = String(code).trim();
      if (section === 'occupancy') {
        return this.getMergedOccupancy()[strCode] || null;
      }
      if (section === 'construction') {
        return this.getMergedConstruction()[strCode] || null;
      }
      return null;
    },

    /**
     * Add or update a code in the custom database
     * @param {'occupancy'|'construction'} section
     * @param {string|number} code
     * @param {Object} details { category, group, description, keywords }
     */
    saveCode(section, code, details) {
      if (!section || !code) {
        throw new Error('Section and Code are required.');
      }
      const strCode = String(code).trim();
      const store = _getStorage();
      if (!store[section]) store[section] = {};

      const td = _getTouchstoneData();
      const isBaseItem = !!(td && td[section.toUpperCase()] && td[section.toUpperCase()][strCode]);

      // Normalize keywords array
      let keywordsArr = [];
      if (Array.isArray(details.keywords)) {
        keywordsArr = details.keywords.map(k => String(k).trim()).filter(Boolean);
      } else if (typeof details.keywords === 'string') {
        keywordsArr = details.keywords
          .split(/[,;\n]+/)
          .map(k => k.trim())
          .filter(Boolean);
      }

      store[section][strCode] = {
        code: strCode,
        category: (details.category || '').trim() || (isBaseItem ? td[section.toUpperCase()][strCode].category : `Code ${strCode}`),
        group: (details.group || '').trim() || (isBaseItem ? td[section.toUpperCase()][strCode].group : 'Custom Group'),
        description: (details.description || '').trim(),
        keywords: keywordsArr,
        isCustom: !isBaseItem,
        isModified: isBaseItem,
        updatedAt: new Date().toISOString()
      };

      _saveStorage(store);
      return store[section][strCode];
    },

    /**
     * Delete a code or mark standard code as deleted
     */
    deleteCode(section, code) {
      const strCode = String(code).trim();
      const store = _getStorage();
      if (!store[section]) store[section] = {};

      const td = _getTouchstoneData();
      const isBaseItem = !!(td && td[section.toUpperCase()] && td[section.toUpperCase()][strCode]);

      if (isBaseItem) {
        // Mark built-in code as deleted/hidden
        store[section][strCode] = { _deleted: true, updatedAt: new Date().toISOString() };
      } else {
        // Remove custom code entirely
        delete store[section][strCode];
      }

      _saveStorage(store);
      return true;
    },

    /**
     * Reset a single code back to built-in Touchstone defaults
     */
    resetCode(section, code) {
      const strCode = String(code).trim();
      const store = _getStorage();
      if (store[section] && store[section][strCode]) {
        delete store[section][strCode];
        _saveStorage(store);
      }
      return true;
    },

    /**
     * Reset an entire section back to factory defaults
     */
    resetSection(section) {
      const store = _getStorage();
      if (store[section]) {
        store[section] = {};
        _saveStorage(store);
      }
      return true;
    },

    /**
     * Reset the entire custom database back to factory defaults
     */
    resetAll() {
      const store = {
        occupancy: {},
        construction: {},
        metadata: {
          version: '1.0',
          lastUpdated: new Date().toISOString()
        }
      };
      _saveStorage(store);
      return true;
    },

    /**
     * Export all custom database records and rules as a downloadable JSON object/string
     */
    exportDatabaseJSON(pretty = true) {
      const store = _getStorage();
      const payload = {
        name: 'CleanExcel Studio - Underwriting Custom Codes Database',
        exportedAt: new Date().toISOString(),
        version: '1.0',
        occupancy: store.occupancy || {},
        construction: store.construction || {}
      };
      return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
    },

    /**
     * Export complete merged database (including all built-in codes + custom additions)
     */
    exportCompleteMasterJSON(pretty = true) {
      const payload = {
        name: 'CleanExcel Studio - Complete Underwriting Taxonomy Master Database',
        exportedAt: new Date().toISOString(),
        version: '1.0',
        occupancy: this.getMergedOccupancy(),
        construction: this.getMergedConstruction()
      };
      return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
    },

    /**
     * Import custom codes database from JSON object or string
     */
    importDatabaseJSON(input) {
      let data = input;
      if (typeof input === 'string') {
        try {
          data = JSON.parse(input);
        } catch (e) {
          throw new Error('Invalid JSON format: ' + e.message);
        }
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data payload.');
      }

      const store = _getStorage();
      let importedCount = 0;

      // Import occupancy items
      if (data.occupancy && typeof data.occupancy === 'object') {
        for (const [code, item] of Object.entries(data.occupancy)) {
          if (item && typeof item === 'object') {
            store.occupancy[String(code)] = item;
            importedCount++;
          }
        }
      }

      // Import construction items
      if (data.construction && typeof data.construction === 'object') {
        for (const [code, item] of Object.entries(data.construction)) {
          if (item && typeof item === 'object') {
            store.construction[String(code)] = item;
            importedCount++;
          }
        }
      }

      _saveStorage(store);
      return { success: true, count: importedCount };
    },

    /**
     * Get keyword patterns for custom-registered rules to inject into cleaner classifiers
     */
    getCustomKeywords(section) {
      const customMap = this.getCustomData(section);
      const list = [];
      for (const [code, item] of Object.entries(customMap)) {
        if (!item._deleted && item.keywords && item.keywords.length > 0) {
          list.push({
            code: String(code),
            category: item.category,
            description: item.description,
            keywords: item.keywords
          });
        }
      }
      return list;
    }
  };

  // Expose globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomCodesDB;
  }
  root.CustomCodesDB = CustomCodesDB;

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
