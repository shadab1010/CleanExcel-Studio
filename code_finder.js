/**
 * CleanExcel Studio - Universal Touchstone UNICEDE® Code & Description Finder Engine
 * 
 * Provides instantaneous, multi-attribute indexing and search across all classification sections:
 * 1. Occupancy Class Classifier (occupancy) - Codes 300 to 3023
 * 2. Construction Class Classifier (construction) - Codes 100 to 2720
 * 3. Roof Detail Classifier (roof) - Geometry, Pitch, Covering, Deck
 * 4. Exterior Wall Finish Classifier (wall) - WallType, WallSiding
 */

(function (root) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports && (!root.ConstructionClassifier || !root.RoofClassifier)) {
    try {
      const cl = require('./cleaner.js');
      if (cl) {
        if (!root.ConstructionClassifier) root.ConstructionClassifier = cl.ConstructionClassifier;
        if (!root.OccupancyClassifier) root.OccupancyClassifier = cl.OccupancyClassifier;
        if (!root.RoofClassifier) root.RoofClassifier = cl.RoofClassifier;
        if (!root.WallClassifier) root.WallClassifier = cl.WallClassifier;
      }
    } catch (e) { }
  }

  // Resolve Touchstone UNICEDE master data (from data/touchstone_data.js)
  function _getTouchstoneData() {
    if (typeof TouchstoneData !== 'undefined') return TouchstoneData;
    if (root.TouchstoneData) return root.TouchstoneData;
    if (typeof globalThis !== 'undefined' && globalThis.TouchstoneData) return globalThis.TouchstoneData;
    if (typeof require !== 'undefined') {
      try { return require('./data/touchstone_data.js'); } catch (e) {}
    }
    return null;
  }

  // CodeFinder singleton engine
  const CodeFinder = {
    // Section data stores
    get occupancyData() {
      const td = _getTouchstoneData();
      return (td && td.getOccupancyList()) || [];
    },

    /**
     * Get all items for a section
     */
    getAll(section) {
      if (section === 'occupancy') {
        return this.occupancyData;
      }
      if (section === 'construction') {
        return this.getConstructionData();
      }
      if (section === 'roof') {
        return this.getRoofData();
      }
      if (section === 'wall') {
        return this.getWallData();
      }
      return [];
    },

    /**
     * Extract construction taxonomy from ConstructionClassifier.CODES + underwriting rules
     */
    getConstructionData() {
      if (this._cachedConstructionData) return this._cachedConstructionData;

      const items = [];
      const codesObj = (root.ConstructionClassifier && root.ConstructionClassifier.CODES) || {};

      for (const [code, info] of Object.entries(codesObj)) {
        const item = {
          code: String(code),
          category: info.category || `Construction Code ${code}`,
          group: info.group || 'General Construction',
          description: info.description || '',
          keywords: [],
          rules: []
        };

        // Enrich with mandatory underwriting memory rules & ISO standards
        if (code === '113') {
          item.rules.push('⭐ MANDATORY UNDERWRITING RULE: STONE in Exterior Wall Finish / Construction MUST ALWAYS map to Code 113 (Rubble Stone Masonry).');
          item.keywords.push('stone', 'stone facade', 'stone wall', 'stone finish', 'stone masonry', 'fieldstone', 'rubble');
        } else if (code === '111') {
          item.rules.push('⭐ MANDATORY UNDERWRITING RULE: BRICK in Exterior Wall Finish / Construction MUST ALWAYS map to Code 111 (Masonry).');
          item.rules.push('🏢 ISO Class 4: Masonry Noncombustible ➔ Code 111 (Masonry).');
          item.keywords.push('iso 4', 'iso 4 masonry noncombustible', 'masonry noncombustible', 'mnc', 'masonry nc', 'brick', 'brick facade', 'brick wall', 'brick finish', 'exterior brick', 'general masonry');
        } else if (code === '101') {
          item.rules.push('🏢 ISO Class 1: Frame ➔ Code 101 (Wood Frame Modern).');
          item.keywords.push('iso 1', 'iso 1 frame', 'iso frame', 'frame', 'wood frame', 'stud wall', 'timber frame', '2x4', 'plywood sheathing');
        } else if (code === '136') {
          item.keywords.push('tilt-up', 'tilt up', 'precast panel', 'concrete wall panel');
        } else if (code === '152') {
          item.rules.push('🏢 ISO Class 3: Noncombustible ➔ Code 152 (Light Metal / Non-Combustible).');
          item.keywords.push('iso 3', 'iso 3 noncombustible', 'noncombustible', 'light metal', 'corrugated metal', 'pre-engineered metal', 'butler building', 'steel siding', 'pemb');
        } else if (code === '114') {
          item.keywords.push('unreinforced masonry', 'urm', 'bearing wall', 'unreinforced brick');
        } else if (code === '116') {
          item.keywords.push('reinforced masonry', 'rm', 'concrete block', 'cmu', 'grouted masonry');
        } else if (code === '119') {
          item.rules.push('🏢 ISO Class 2: Joisted Masonry ➔ Code 119 (Joisted Masonry).');
          item.keywords.push('iso 2', 'iso 2 joisted masonry', 'joisted masonry', 'jm', 'wood floor masonry', 'combustible roof');
        } else if (code === '131') {
          item.rules.push('🏢 ISO Class 5: Modified Fire Resistive ➔ Code 131 (Reinforced Concrete / MFR).');
          item.rules.push('🏢 ISO Class 6: Fire Resistive ➔ Code 131 (Reinforced Concrete / FR).');
          item.keywords.push('iso 5', 'iso 5 modified fire resistive', 'modified fire resistive', 'mfr', 'iso 6', 'iso 6 fire resistive', 'fire resistive', 'fr', 'reinforced concrete', 'rc frame', 'concrete column', 'concrete beam');
        } else if (code === '151') {
          item.keywords.push('structural steel', 'steel frame', 'steel column', 'i-beam');
        } else if (code === '191') {
          item.keywords.push('mobile home', 'manufactured home', 'tie-down');
        }

        items.push(item);
      }

      this._cachedConstructionData = items;
      return items;
    },

    /**
     * Extract roof taxonomy from RoofTaxonomy + weakness rankings
     */
    getRoofData() {
      if (this._cachedRoofData) return this._cachedRoofData;

      const items = [];
      const tax = (root.RoofClassifier && root.RoofClassifier.taxonomy) || (root.RoofTaxonomy) || {};

      // 1. Roof Covering (Codes 0-12)
      if (tax.COVERING) {
        for (const [code, info] of Object.entries(tax.COVERING)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Roof Covering',
            subSection: 'covering',
            description: this.getRoofCoveringDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.COVERING_WEAKNESS && root.RoofClassifier.COVERING_WEAKNESS[code]) || 0,
            keywords: this.getRoofCoveringKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No % / Tie): Weaker material wins.']
          };
          items.push(item);
        }
      }

      // 2. Roof Deck (Codes 0-8)
      if (tax.DECK) {
        for (const [code, info] of Object.entries(tax.DECK)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Roof Deck',
            subSection: 'deck',
            description: this.getRoofDeckDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.DECK_WEAKNESS && root.RoofClassifier.DECK_WEAKNESS[code]) || 0,
            keywords: this.getRoofDeckKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No % / Tie): Weaker material wins.']
          };
          items.push(item);
        }
      }

      // 3. Roof Geometry (Codes 0-10)
      if (tax.GEOMETRY) {
        for (const [code, info] of Object.entries(tax.GEOMETRY)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Roof Geometry',
            subSection: 'geometry',
            description: this.getRoofGeometryDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.GEOMETRY_WEAKNESS && root.RoofClassifier.GEOMETRY_WEAKNESS[code]) || 0,
            keywords: this.getRoofGeometryKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No % / Tie): Weaker geometry wins (e.g. Gable 2 over Hip 3).']
          };
          items.push(item);
        }
      }

      // 4. Roof Pitch (Codes 0-3)
      if (tax.PITCH) {
        for (const [code, info] of Object.entries(tax.PITCH)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Roof Pitch',
            subSection: 'pitch',
            description: this.getRoofPitchDescription(code),
            weaknessScore: 0,
            keywords: this.getRoofPitchKeywords(code),
            rules: ['Derived from pitch angles, slope ratio e.g. 4:12, or roof geometry (Flat ➔ Low pitch).']
          };
          items.push(item);
        }
      }

      // 5. Roof Anchorage (Codes 0-7)
      if (tax.ANCHORAGE) {
        for (const [code, info] of Object.entries(tax.ANCHORAGE)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Roof Anchorage',
            subSection: 'anchorage',
            description: this.getRoofAnchorageDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.ANCHORAGE_WEAKNESS && root.RoofClassifier.ANCHORAGE_WEAKNESS[code]) || 0,
            keywords: this.getRoofAnchorageKeywords(code),
            rules: [
              'Rule 1 (With %): Higher % wins.',
              'Rule 2 (No %): Weaker anchorage connection wins (e.g. Gravity 4 over Hurricane Ties 1).'
            ]
          };
          items.push(item);
        }
      }

      this._cachedRoofData = items;
      return items;
    },

    /**
     * Extract exterior wall taxonomy from WallTaxonomy + weakness rankings
     */
    getWallData() {
      if (this._cachedWallData) return this._cachedWallData;

      const items = [];
      const tax = (root.WallClassifier && root.WallClassifier.taxonomy) || (root.WallTaxonomy) || {};

      // 1. Wall Siding (Weather Envelope) Codes 0-8
      if (tax.WALL_SIDING) {
        for (const [code, info] of Object.entries(tax.WALL_SIDING)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Wall Siding (Exterior Weather Envelope)',
            subSection: 'siding',
            description: this.getWallSidingDescription(code),
            weaknessScore: (root.WallClassifier && root.WallClassifier.WALL_SIDING_WEAKNESS && root.WallClassifier.WALL_SIDING_WEAKNESS[code]) || 0,
            keywords: this.getWallSidingKeywords(code),
            rules: [
              'Rule 1 (With %): Higher % wins (e.g. 70% Brick Veneer, 30% Vinyl ➔ Brick 1).',
              'Rule 2 (No %): Weaker material wins (e.g. Brick Veneer & Vinyl Siding ➔ Vinyl 4).',
              'Rule 3 (Tied %): Equal % picks weaker material.'
            ]
          };
          items.push(item);
        }
      }

      // 2. Wall Type (Structural Backing) Codes 0-9
      if (tax.WALL_TYPE) {
        for (const [code, info] of Object.entries(tax.WALL_TYPE)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Wall Type (Structural Wall Backing)',
            subSection: 'type',
            description: this.getWallTypeDescription(code),
            weaknessScore: (root.WallClassifier && root.WallClassifier.WALL_TYPE_WEAKNESS && root.WallClassifier.WALL_TYPE_WEAKNESS[code]) || 0,
            keywords: this.getWallTypeKeywords(code),
            rules: [
              'Rule 1 (With %): Higher % wins.',
              'Rule 2 (No %): Weaker backing wins (e.g. Plywood & Concrete ➔ Plywood 3).',
              'Rule 3 (Tied %): Equal % picks weaker material.'
            ]
          };
          items.push(item);
        }
      }

      this._cachedWallData = items;
      return items;
    },

    // Roof helper descriptions and keywords (delegated to master TouchstoneData)
    getRoofCoveringDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.COVERING[code] && td.ROOF.COVERING[code].description) || 'Touchstone UNICEDE roof covering.';
    },

    getRoofCoveringKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.COVERING[code] && td.ROOF.COVERING[code].keywords) || [];
    },

    getRoofDeckDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.DECK[code] && td.ROOF.DECK[code].description) || 'Touchstone UNICEDE roof deck.';
    },

    getRoofDeckKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.DECK[code] && td.ROOF.DECK[code].keywords) || [];
    },

    getRoofGeometryDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.GEOMETRY[code] && td.ROOF.GEOMETRY[code].description) || 'Touchstone UNICEDE roof geometry.';
    },

    getRoofGeometryKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.GEOMETRY[code] && td.ROOF.GEOMETRY[code].keywords) || [];
    },

    getRoofPitchDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.PITCH[code] && td.ROOF.PITCH[code].description) || 'Touchstone UNICEDE roof pitch.';
    },

    getRoofPitchKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.PITCH[code] && td.ROOF.PITCH[code].keywords) || [];
    },

    getRoofAnchorageDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.ANCHORAGE[code] && td.ROOF.ANCHORAGE[code].description) || 'Touchstone UNICEDE roof anchorage.';
    },

    getRoofAnchorageKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.ANCHORAGE[code] && td.ROOF.ANCHORAGE[code].keywords) || [];
    },

    // Wall helper descriptions and keywords (delegated to master TouchstoneData)
    getWallSidingDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.WALL && td.WALL.WALL_SIDING[code] && td.WALL.WALL_SIDING[code].description) || 'Touchstone UNICEDE wall siding.';
    },

    getWallSidingKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.WALL && td.WALL.WALL_SIDING[code] && td.WALL.WALL_SIDING[code].keywords) || [];
    },

    getWallTypeDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.WALL && td.WALL.WALL_TYPE[code] && td.WALL.WALL_TYPE[code].description) || 'Touchstone UNICEDE structural wall type.';
    },

    getWallTypeKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.WALL && td.WALL.WALL_TYPE[code] && td.WALL.WALL_TYPE[code].keywords) || [];
    },

    /**
     * Search taxonomy for a given section or across all sections
     * @param {string} query Search text or code number
     * @param {string} section 'occupancy' | 'construction' | 'roof' | 'wall' | 'all'
     * @param {object} options Optional filtering options
     * @returns {Array} Ranked search results
     */
    search(query, section = 'occupancy', options = {}) {
      if (!query || typeof query !== 'string') {
        const q = '';
        const allItems = this.getAll(section);
        return allItems.slice(0, 30);
      }

      const qRaw = query.trim();
      const qLower = qRaw.toLowerCase();
      if (!qLower) {
        return this.getAll(section).slice(0, 30);
      }

      const isNumeric = /^\d+$/.test(qLower);
      const items = (section === 'all')
        ? [
          ...this.getAll('occupancy').map(i => ({ ...i, section: 'occupancy' })),
          ...this.getAll('construction').map(i => ({ ...i, section: 'construction' })),
          ...this.getAll('roof').map(i => ({ ...i, section: 'roof' })),
          ...this.getAll('wall').map(i => ({ ...i, section: 'wall' }))
        ]
        : this.getAll(section).map(i => ({ ...i, section }));

      const scored = [];

      for (const item of items) {
        let score = 0;
        const code = String(item.code || '');
        const cat = (item.category || '').toLowerCase();
        const shortName = (item.shortName || '').toLowerCase();
        const group = (item.group || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const keywords = (item.keywords || []).map(k => k.toLowerCase());

        // 1. Exact numeric code match
        if (code === qLower) {
          score += 1000;
        } else if (code.startsWith(qLower)) {
          score += 600;
        } else if (code.includes(qLower) && isNumeric) {
          score += 400;
        }

        // 2. Exact or prefix match on category / name
        if (cat === qLower || shortName === qLower) {
          score += 700;
        } else if (cat.startsWith(qLower) || shortName.startsWith(qLower)) {
          score += 500;
        } else if (cat.includes(qLower) || shortName.includes(qLower)) {
          score += 350;
        }

        // 3. Keyword matches
        for (const kw of keywords) {
          if (kw === qLower) {
            score += 650;
            break;
          } else if (kw.startsWith(qLower)) {
            score += 450;
            break;
          } else if (kw.includes(qLower)) {
            score += 250;
            break;
          }
        }

        // 4. Word-by-word matching
        const words = qLower.split(/\s+/).filter(w => w.length > 1);
        if (words.length > 1) {
          let wordsMatched = 0;
          for (const word of words) {
            if (cat.includes(word) || desc.includes(word) || keywords.some(k => k.includes(word))) {
              wordsMatched++;
            }
          }
          if (wordsMatched === words.length) {
            score += 400;
          } else if (wordsMatched > 0) {
            score += wordsMatched * 80;
          }
        }

        // 5. Group match
        if (group.includes(qLower)) {
          score += 150;
        }

        // 6. Description match
        if (desc.includes(qLower)) {
          score += 100;
        }

        // Special rule boosts for user underwriting memory & ISO standards
        if (section === 'construction' || section === 'all') {
          if (code === '113' && (qLower.includes('stone') || qLower.includes('fieldstone') || qLower.includes('rubble'))) {
            score += 800; // Mandatory Stone -> 113 rule
          } else if (code === '111' && (qLower.includes('brick') || qLower.includes('masonry') || qLower.includes('iso 4') || qLower.includes('masonry noncombustible') || qLower.includes('mnc'))) {
            score += 800; // Mandatory Brick / ISO 4 -> 111 rule
          } else if (code === '101' && (qLower.includes('iso 1') || qLower.includes('frame'))) {
            score += 700; // ISO 1 Frame
          } else if (code === '119' && (qLower.includes('iso 2') || qLower.includes('joisted masonry'))) {
            score += 700; // ISO 2 Joisted Masonry
          } else if (code === '152' && (qLower.includes('iso 3') || (qLower.includes('noncombustible') && !qLower.includes('masonry')))) {
            score += 700; // ISO 3 Noncombustible
          } else if (code === '131' && (qLower.includes('iso 5') || qLower.includes('iso 6') || qLower.includes('modified fire resistive') || qLower.includes('fire resistive') || qLower.includes('mfr'))) {
            score += 700; // ISO 5 & 6 Fire Resistive
          }
        }

        if (score > 0) {
          scored.push({ item, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      const limit = options.limit || 50;
      return scored.slice(0, limit).map(s => s.item);
    },

    /**
     * Get specific item by code
     */
    getByCode(code, section = 'occupancy', subSection = null) {
      const items = this.getAll(section);
      const target = String(code).trim();
      return items.find(i => {
        if (subSection && i.subSection && i.subSection !== subSection) return false;
        return String(i.code) === target;
      }) || null;
    },

    /**
     * Detect matching classification from arbitrary text line (used for live editor assistance)
     */
    detect(text, section = 'occupancy') {
      if (!text || typeof text !== 'string') return null;
      const clean = text.trim();
      if (!clean) return null;

      // 1. Occupancy detection
      if (section === 'occupancy') {
        // Try direct code match
        const directCode = clean.match(/\b(30[0-7]|31[1-9]|32[1-9]|33[0-6]|34[1-6]|35[1-6]|36[1-7]|371|38[2-4]|400|3001)\b/);
        if (directCode) {
          const found = this.getByCode(directCode[1], 'occupancy');
          if (found) return found;
        }
        // Try classifier matchTextToCode
        if (root.OccupancyClassifier && root.OccupancyClassifier.matchTextToCode) {
          const matched = root.OccupancyClassifier.matchTextToCode(clean);
          if (matched) {
            return this.getByCode(matched, 'occupancy');
          }
        }
        // Fallback search
        const results = this.search(clean, 'occupancy', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 2. Construction detection
      if (section === 'construction') {
        // Check mandatory Stone -> 113 and Brick -> 111 rules
        if (/\bstone\b/i.test(clean)) {
          return this.getByCode('113', 'construction');
        }
        if (/\bbrick\b/i.test(clean)) {
          return this.getByCode('111', 'construction');
        }
        // Try classifier matchTextToCode
        if (root.ConstructionClassifier && root.ConstructionClassifier.matchTextToCode) {
          const matched = root.ConstructionClassifier.matchTextToCode(clean);
          if (matched) {
            return this.getByCode(matched, 'construction');
          }
        }
        // Try direct code match
        const codeMatch = clean.match(/\b(10[0-8]|11[1-9]|12[0-1]|13[1-9]|14[0-1]|15[1-9]|16[0-9]|17[1-9]|18[1-7]|19[1-4]|20[1-3]|22[1-6]|50[0-2]|51[0-4])\b/);
        if (codeMatch) {
          const found = this.getByCode(codeMatch[1], 'construction');
          if (found) return found;
        }
        const results = this.search(clean, 'construction', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 3. Roof detection
      if (section === 'roof') {
        if (root.RoofClassifier && root.RoofClassifier.parseRoofRow) {
          const res = root.RoofClassifier.parseRoofRow(clean);
          if (res) {
            const coveringCode = res.coveringCode;
            if (coveringCode && coveringCode !== '0') {
              const item = this.getByCode(coveringCode, 'roof', 'covering');
              if (item) return item;
            }
            const geomCode = res.geometryCode;
            if (geomCode && geomCode !== '0') {
              const item = this.getByCode(geomCode, 'roof', 'geometry');
              if (item) return item;
            }
            const deckCode = res.deckCode;
            if (deckCode && deckCode !== '0') {
              const item = this.getByCode(deckCode, 'roof', 'deck');
              if (item) return item;
            }
            const anchorageCode = res.anchorageCode;
            if (anchorageCode && anchorageCode !== '0') {
              const item = this.getByCode(anchorageCode, 'roof', 'anchorage');
              if (item) return item;
            }
          }
        }
        const results = this.search(clean, 'roof', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 4. Wall detection
      if (section === 'wall') {
        if (root.WallClassifier && root.WallClassifier.parseWallRow) {
          const res = root.WallClassifier.parseWallRow(clean);
          if (res) {
            const sidingCode = res.wallSidingCode;
            if (sidingCode && sidingCode !== '0') {
              const item = this.getByCode(sidingCode, 'wall', 'siding');
              if (item) return item;
            }
            const typeCode = res.wallTypeCode;
            if (typeCode && typeCode !== '0') {
              const item = this.getByCode(typeCode, 'wall', 'type');
              if (item) return item;
            }
          }
        }
        const results = this.search(clean, 'wall', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      return null;
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeFinder;
  }
  if (typeof window !== 'undefined') {
    window.CodeFinder = CodeFinder;
  }

})(typeof window !== 'undefined' ? window : global);
