/**
 * CleanExcel Studio - Custom Underwriting Codes & Self-Training Memory Database
 * 
 * Provides live continuous learning and persistence (localStorage + JSON export/import)
 * for:
 * 1. User-defined Occupancy and Construction codes, descriptions, and keyword rules.
 * 2. Self-Training / Auto-Learning Memory: automatically learns and remembers classifications
 *    whenever the user runs AI or corrects/fixes any row in Occupancy, Construction,
 *    Roof Details, Wall Details, Number of Stores, Year Built, and Addresses.
 * 3. Priority lookup in the deterministic cleaner so learned items execute instantly (0 ms latency).
 */

(function (root) {
  'use strict';

  const STORAGE_KEY = 'cleanexcel_underwriting_custom_db_v1';

  // In-memory fallback if localStorage is unavailable
  let _memoryStore = {
    occupancy: {},
    construction: {},
    learned: {
      occupancy: {},
      construction: {},
      roof: {},
      wall: {},
      foundation_type: {},
      foundation_connection: {},
      foundation: {},
      short_column: {},
      building_exterior_opening: {},
      soft_story: {},
      ornamentation: {},
      building_shape: {},
      building_condition: {},
      stores: {},
      year: {},
      address: {}
    },
    metadata: {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      totalLearnedCount: 0
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
              learned: {
                occupancy: (parsed.learned && parsed.learned.occupancy) || {},
                construction: (parsed.learned && parsed.learned.construction) || {},
                roof: (parsed.learned && parsed.learned.roof) || {},
                wall: (parsed.learned && parsed.learned.wall) || {},
                foundation_type: (parsed.learned && (parsed.learned.foundation_type || parsed.learned.foundationType)) || {},
                foundation_connection: (parsed.learned && (parsed.learned.foundation_connection || parsed.learned.foundationConnection)) || {},
                foundation: (parsed.learned && parsed.learned.foundation) || {},
                short_column: (parsed.learned && (parsed.learned.short_column || parsed.learned.shortColumn)) || {},
                building_exterior_opening: (parsed.learned && (parsed.learned.building_exterior_opening || parsed.learned.buildingExteriorOpening || parsed.learned.exterior_opening)) || {},
                soft_story: (parsed.learned && (parsed.learned.soft_story || parsed.learned.softStory)) || {},
                ornamentation: (parsed.learned && (parsed.learned.ornamentation || parsed.learned.ornament)) || {},
                building_shape: (parsed.learned && (parsed.learned.building_shape || parsed.learned.buildingShape || parsed.learned.shape)) || {},
                building_condition: (parsed.learned && (parsed.learned.building_condition || parsed.learned.buildingCondition || parsed.learned.condition)) || {},
                stores: (parsed.learned && parsed.learned.stores) || {},
                year: (parsed.learned && parsed.learned.year) || {},
                address: (parsed.learned && parsed.learned.address) || {}
              },
              metadata: parsed.metadata || { version: '2.0', lastUpdated: new Date().toISOString(), totalLearnedCount: 0 }
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
        
        // Compute total learned patterns count
        let totalLearned = 0;
        if (data.learned) {
          Object.values(data.learned).forEach(sec => {
            if (sec && typeof sec === 'object') {
              totalLearned += Object.keys(sec).length;
            }
          });
        }
        data.metadata.totalLearnedCount = totalLearned;
        
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
    if (typeof require !== 'undefined') {
      try { return require('./touchstone_data.js'); } catch (e) {}
    }
    return null;
  }

  function _normalizePhrase(phrase) {
    if (!phrase || typeof phrase !== 'string') return '';
    return phrase
      .trim()
      .toLowerCase()
      .replace(/[\t\r\n]+/g, ' ')
      .replace(/\s+/g, ' ');
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
     * Check if a specific keyword or any candidate keywords are already saved/registered for a code
     */
    hasKeyword(section, code, keywords) {
      if (!section || !code || !keywords) return false;
      const strCode = String(code).trim();
      const item = this.getCode(section, strCode);
      if (!item) return false;

      const itemKeywords = Array.isArray(item.keywords)
        ? item.keywords.map(k => String(k || '').trim().toLowerCase()).filter(Boolean)
        : [];
      const catLower = String(item.category || '').toLowerCase();
      const descLower = String(item.description || '').toLowerCase();

      const toCheck = (Array.isArray(keywords) ? keywords : [keywords])
        .map(k => String(k || '').trim().toLowerCase())
        .filter(k => k && k !== '—' && k !== '-' && k !== 'n/a' && k !== 'unknown');

      if (toCheck.length === 0) return false;

      return toCheck.some(k => {
        if (!k) return false;
        if (itemKeywords.includes(k)) return true;
        if (itemKeywords.some(ik => ik === k || ik.includes(k) || k.includes(ik))) return true;
        if (catLower && (catLower === k || catLower.includes(k) || k.includes(catLower))) return true;
        if (descLower && descLower.includes(k)) return true;
        return false;
      });
    },

    /**
     * Add or update a code in the custom database
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
     * Add one or more keywords mapping to a code in the database
     */
    addKeyword(section, code, newKeywords, optionalMetadata = {}) {
      if (!section || !code) {
        throw new Error('Section and Code are required.');
      }
      const strCode = String(code).trim();
      const existing = this.getCode(section, strCode) || {};
      let currentKeywords = Array.isArray(existing.keywords) ? [...existing.keywords] : [];

      const toAdd = (Array.isArray(newKeywords) ? newKeywords : [newKeywords])
        .map(k => String(k || '').trim())
        .filter(k => k && k !== '—' && k !== '-' && k.toLowerCase() !== 'n/a' && k.toLowerCase() !== 'unknown');

      let addedCount = 0;
      for (const kw of toAdd) {
        const kwLower = kw.toLowerCase();
        if (!currentKeywords.some(existingKw => existingKw.toLowerCase() === kwLower)) {
          currentKeywords.push(kw);
          addedCount++;
        }
      }

      const td = _getTouchstoneData();
      const isBaseItem = !!(td && td[section.toUpperCase()] && td[section.toUpperCase()][strCode]);
      const baseItem = isBaseItem ? td[section.toUpperCase()][strCode] : null;

      const category = (optionalMetadata.category || '').trim() || existing.category || (baseItem ? baseItem.category : `Code ${strCode}`);
      const group = (optionalMetadata.group || '').trim() || existing.group || (baseItem ? baseItem.group : 'Custom Underwriting');
      const description = (optionalMetadata.description || '').trim() || existing.description || (baseItem ? baseItem.description : '');

      this.saveCode(section, strCode, {
        category,
        group,
        description,
        keywords: currentKeywords
      });

      return { code: strCode, category, keywords: currentKeywords, addedCount, totalKeywords: currentKeywords.length };
    },

    // =========================================================================
    // === CONTINUOUS SELF-TRAINING & UNDERWRITING MEMORY ENGINE ===
    // =========================================================================

    /**
     * Train and remember a classification pattern into the persistent database.
     * Triggered automatically whenever the user uses AI or makes a manual fix.
     * 
     * @param {'occupancy'|'construction'|'roof'|'wall'|'stores'|'year'|'address'} section
     * @param {string} inputPhrase - The raw input description or keyword
     * @param {Object|string|number} targetResult - The target code/classification object
     * @param {'user_fix'|'ai'|'manual_rule'} [source='user_fix']
     */
    learn(section, inputPhrase, targetResult, source = 'user_fix') {
      if (!section || !inputPhrase || targetResult === undefined || targetResult === null) {
        return null;
      }
      const rawText = String(inputPhrase).trim();
      const normKey = _normalizePhrase(rawText);
      if (!normKey || normKey === '—' || normKey === '-' || normKey === 'unknown' || normKey === '0' || normKey === 'n/a') {
        return null;
      }

      const store = _getStorage();
      if (!store.learned) store.learned = {};
      if (!store.learned[section]) store.learned[section] = {};

      const existing = store.learned[section][normKey] || {};
      const hits = (existing.hits || 0) + 1;

      const learnedItem = {
        key: normKey,
        originalPhrase: rawText,
        result: targetResult,
        source: source, // 'user_fix' (highest priority), 'ai', or 'manual_rule'
        learnedAt: existing.learnedAt || new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        hits: hits
      };

      store.learned[section][normKey] = learnedItem;

      // Also if section is occupancy or construction, register as keyword in codes database
      if ((section === 'occupancy' || section === 'construction') && targetResult) {
        const code = typeof targetResult === 'object' ? targetResult.code : targetResult;
        if (code && code !== '100' && code !== '300') {
          const category = typeof targetResult === 'object' ? targetResult.category : '';
          this.addKeyword(section, code, [rawText], { category });
        }
      }

      _saveStorage(store);
      return learnedItem;
    },

    /**
     * Batch train multiple items at once (e.g. from AI run or file import)
     * @param {'occupancy'|'construction'|'roof'|'wall'|'stores'|'year'|'address'} section
     * @param {Array<{phrase: string, result: any, source?: string}>} items
     * @param {'ai'|'user_fix'|'manual_rule'} [source='ai']
     */
    learnBatch(section, items, source = 'ai') {
      if (!section || !Array.isArray(items) || items.length === 0) return { learnedCount: 0 };
      let count = 0;
      const store = _getStorage();
      if (!store.learned) store.learned = {};
      if (!store.learned[section]) store.learned[section] = {};

      items.forEach(item => {
        if (!item) return;
        const phrase = item.phrase || item.original || item.input || item.occDesc || item.conDesc;
        const result = item.result !== undefined ? item.result : (item.code || item.stores || item.cleaned || item);
        if (!phrase || result === undefined || result === null || result === '' || result === '100' || result === '300') return;

        const normKey = _normalizePhrase(phrase);
        if (!normKey || normKey === '—' || normKey === '-' || normKey === 'unknown' || normKey === '0' || normKey === 'n/a') return;

        const existing = store.learned[section][normKey] || {};
        store.learned[section][normKey] = {
          key: normKey,
          originalPhrase: String(phrase).trim(),
          result: result,
          source: item.source || source,
          learnedAt: existing.learnedAt || new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          hits: (existing.hits || 0) + 1
        };
        count++;
      });

      if (count > 0) {
        _saveStorage(store);
      }
      return { learnedCount: count };
    },

    /**
     * Match an input phrase against the learned underwriting memory.
     * Provides 0 ms instant deterministic classification.
     * 
     * @param {'occupancy'|'construction'|'roof'|'wall'|'stores'|'year'|'address'} section
     * @param {string} inputPhrase
     * @returns {Object|null} The learned result or null if not trained yet.
     */
    matchLearned(section, inputPhrase) {
      if (!section || !inputPhrase) return null;
      const normKey = _normalizePhrase(inputPhrase);
      if (!normKey) return null;

      const store = _getStorage();
      const learnedSection = store.learned && store.learned[section];
      if (!learnedSection) return null;

      // 1. Direct exact match
      if (learnedSection[normKey]) {
        const item = learnedSection[normKey];
        item.hits = (item.hits || 0) + 1;
        item.lastUsedAt = new Date().toISOString();
        return item.result;
      }

      // 2. Sub-phrase match for multi-word descriptions
      for (const [key, item] of Object.entries(learnedSection)) {
        if (key && key.length >= 4) {
          const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          if (regex.test(normKey)) {
            item.hits = (item.hits || 0) + 1;
            item.lastUsedAt = new Date().toISOString();
            return item.result;
          }
        }
      }

      return null;
    },

    /**
     * Get all learned patterns for a section or all sections
     */
    getAllLearned(section) {
      const store = _getStorage();
      if (!store.learned) return {};
      if (section) {
        return store.learned[section] || {};
      }
      return store.learned;
    },

    /**
     * Delete a single learned pattern
     */
    deleteLearned(section, phrase) {
      const normKey = _normalizePhrase(phrase);
      const store = _getStorage();
      if (store.learned && store.learned[section] && store.learned[section][normKey]) {
        delete store.learned[section][normKey];
        _saveStorage(store);
        return true;
      }
      return false;
    },

    /**
     * Clear all learned patterns for a section or everything
     */
    clearLearned(section) {
      const store = _getStorage();
      if (!store.learned) store.learned = {};
      if (section) {
        store.learned[section] = {};
      } else {
        store.learned = { occupancy: {}, construction: {}, roof: {}, wall: {}, foundation: {}, stores: {}, year: {}, address: {} };
      }
      _saveStorage(store);
      return true;
    },

    /**
     * Get comprehensive statistics about the custom codes & self-trained memory
     */
    getStats() {
      const store = _getStorage();
      let totalLearned = 0;
      let totalUserFixes = 0;
      let totalAiLearned = 0;
      let totalHits = 0;
      const sectionCounts = {};

      if (store.learned) {
        for (const [sec, items] of Object.entries(store.learned)) {
          const count = Object.keys(items || {}).length;
          sectionCounts[sec] = count;
          totalLearned += count;
          Object.values(items || {}).forEach(it => {
            if (it.source === 'user_fix') totalUserFixes++;
            else totalAiLearned++;
            totalHits += (it.hits || 0);
          });
        }
      }

      const customOccCount = Object.keys(store.occupancy || {}).length;
      const customConCount = Object.keys(store.construction || {}).length;

      return {
        totalLearned,
        totalUserFixes,
        totalAiLearned,
        totalHits,
        customOccCount,
        customConCount,
        sectionCounts,
        lastUpdated: (store.metadata && store.metadata.lastUpdated) || new Date().toISOString()
      };
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
        store[section][strCode] = { _deleted: true, updatedAt: new Date().toISOString() };
      } else {
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
     * Reset the entire custom database and learned memory back to factory defaults
     */
    resetAll() {
      const store = {
        occupancy: {},
        construction: {},
        learned: {
          occupancy: {},
          construction: {},
          roof: {},
          wall: {},
          foundation_type: {},
          foundation_connection: {},
          foundation: {},
          short_column: {},
          building_exterior_opening: {},
          soft_story: {},
          ornamentation: {},
          building_shape: {},
          building_condition: {},
          stores: {},
          year: {},
          address: {}
        },
        metadata: {
          version: '2.0',
          lastUpdated: new Date().toISOString(),
          totalLearnedCount: 0
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
        name: 'Neural Underwriting - Underwriting Custom Codes & Self-Training Memory Database',
        exportedAt: new Date().toISOString(),
        version: '2.0',
        stats: this.getStats(),
        occupancy: store.occupancy || {},
        construction: store.construction || {},
        learned: store.learned || {}
      };
      return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
    },

    /**
     * Export complete merged database (including all built-in codes + custom additions + learned memory)
     */
    exportCompleteMasterJSON(pretty = true) {
      const store = _getStorage();
      const payload = {
        name: 'Neural Underwriting - Complete Underwriting Taxonomy & Training Master Database',
        exportedAt: new Date().toISOString(),
        version: '2.0',
        stats: this.getStats(),
        occupancy: this.getMergedOccupancy(),
        construction: this.getMergedConstruction(),
        learned: store.learned || {}
      };
      return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
    },

    /**
     * Import custom codes database & learned memory from JSON object or string
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

      // Import learned memory patterns
      if (data.learned && typeof data.learned === 'object') {
        if (!store.learned) store.learned = {};
        for (const [sec, items] of Object.entries(data.learned)) {
          if (items && typeof items === 'object') {
            if (!store.learned[sec]) store.learned[sec] = {};
            for (const [key, learnedObj] of Object.entries(items)) {
              if (learnedObj) {
                store.learned[sec][key] = learnedObj;
                importedCount++;
              }
            }
          }
        }
      }

      _saveStorage(store);
      return { success: true, count: importedCount, stats: this.getStats() };
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
