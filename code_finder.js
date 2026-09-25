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
      if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getMergedList) {
        return CustomCodesDB.getMergedList('occupancy');
      }
      const td = _getTouchstoneData();
      return (td && td.getOccupancyList()) || [];
    },

    clearCache() {
      this._cachedConstructionData = null;
      this._cachedRoofData = null;
      this._cachedWallData = null;
      this._cachedFoundationData = null;
      this._cachedFoundationConnectionData = null;
      this._cachedShortColumnData = null;
      this._cachedBuildingExteriorOpeningData = null;
      this._cachedSoftStoryData = null;
      this._cachedOrnamentationData = null;
      this._cachedBuildingShapeData = null;
      this._cachedBuildingConditionData = null;
      this._index = null;
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
      if (section === 'foundation_type' || section === 'foundationType') {
        return this.getFoundationTypeData();
      }
      if (section === 'foundation' || section === 'foundation_connection' || section === 'foundationConnection') {
        return this.getFoundationConnectionData();
      }
      if (section === 'short_column' || section === 'shortColumn') {
        return this.getShortColumnData();
      }
      if (section === 'building_exterior_opening' || section === 'buildingExteriorOpening' || section === 'exterior_opening') {
        return this.getBuildingExteriorOpeningData();
      }
      if (section === 'soft_story' || section === 'softStory') {
        return this.getSoftStoryData();
      }
      if (section === 'ornamentation' || section === 'ornament') {
        return this.getOrnamentationData();
      }
      if (section === 'building_shape' || section === 'buildingShape' || section === 'shape') {
        return this.getBuildingShapeData();
      }
      if (section === 'building_condition' || section === 'buildingCondition' || section === 'condition') {
        return this.getBuildingConditionData();
      }
      return [];
    },

    /**
     * Extract Building Condition taxonomy (Codes 0–3)
     */
    getBuildingConditionData() {
      if (this._cachedBuildingConditionData) return this._cachedBuildingConditionData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.BUILDING_CONDITION) ||
                  (root.BuildingConditionClassifier && root.BuildingConditionClassifier.taxonomy && root.BuildingConditionClassifier.taxonomy.BUILDING_CONDITION) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: String(code),
          category: info.name,
          shortName: info.shortName,
          group: 'Building Condition (Codes 0–3)',
          subSection: 'building_condition',
          description: info.description || '',
          perils: info.perils || ['CA EQ', 'HI EQ', 'HI TC', 'JP EQ', 'NZ EQ', 'US EQ', 'US HU', 'US ST'],
          requirement: info.requirement || 'Optional',
          note: info.note || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: [
            'Applicable Perils: CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST (Optional).',
            'Defaults to Unknown (0), but default is Average (1) for earthquake models.',
            'Underwriting Rule: Buildings with signs of distress/duress (settlement cracks, loose tiles, chimney damage, deferred maintenance) suffer severe compounded damage during earthquakes and hurricanes.'
          ]
        };

        // Add learned keywords if available
        if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getLearned) {
          const learned = CustomCodesDB.getLearned('building_condition');
          if (learned) {
            for (const [phrase, learnedCode] of Object.entries(learned)) {
              if (String(learnedCode) === String(code) && !item.keywords.includes(phrase.toLowerCase())) {
                item.keywords.push(phrase.toLowerCase());
              }
            }
          }
        }

        items.push(item);
      }

      this._cachedBuildingConditionData = items;
      return items;
    },

    /**
     * Extract Building Shape taxonomy (Codes 0–8)
     */
    getBuildingShapeData() {
      if (this._cachedBuildingShapeData) return this._cachedBuildingShapeData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.BUILDING_SHAPE) ||
                  (root.BuildingShapeClassifier && root.BuildingShapeClassifier.taxonomy && root.BuildingShapeClassifier.taxonomy.BUILDING_SHAPE) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: String(code),
          category: info.name,
          shortName: info.shortName,
          group: 'Building Shape (Codes 0–8)',
          subSection: 'building_shape',
          description: info.description || '',
          perils: info.perils || ['CA EQ', 'HI EQ', 'JP EQ', 'NZ EQ', 'US EQ'],
          requirement: info.requirement || 'Optional',
          note: info.note || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: [
            'Applicable Perils: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional).',
            'Underwriting Rule: Simple regular forms (squares, rectangles) perform better in earthquakes than combinations like L- and T-shaped buildings due to stress concentrations at re-entrant corners.'
          ]
        };

        // Add learned keywords if available
        if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getLearned) {
          const learned = CustomCodesDB.getLearned('building_shape');
          if (learned) {
            for (const [phrase, learnedCode] of Object.entries(learned)) {
              if (String(learnedCode) === String(code) && !item.keywords.includes(phrase.toLowerCase())) {
                item.keywords.push(phrase.toLowerCase());
              }
            }
          }
        }

        items.push(item);
      }

      this._cachedBuildingShapeData = items;
      return items;
    },

    /**
     * Extract Ornamentation taxonomy (Codes 0–3)
     */
    getOrnamentationData() {
      if (this._cachedOrnamentationData) return this._cachedOrnamentationData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.ORNAMENTATION) ||
                  (root.OrnamentationClassifier && root.OrnamentationClassifier.taxonomy && root.OrnamentationClassifier.taxonomy.ORNAMENTATION) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: String(code),
          category: info.name,
          shortName: info.shortName,
          group: 'Ornamentation (Codes 0–3)',
          subSection: 'ornamentation',
          description: info.description || '',
          perils: info.perils || ['CA EQ', 'HI EQ', 'JP EQ', 'US EQ'],
          requirement: info.requirement || 'Optional',
          note: info.note || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: [
            'Applicable Perils: CA EQ, HI EQ, JP EQ, US EQ (Optional).',
            'Earthquake Risk: Decorative elements like unreinforced/unbraced parapet walls or entryway roofs can break off and fall during excessive shaking.'
          ]
        };

        // Add learned keywords if available
        if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getLearned) {
          const learned = CustomCodesDB.getLearned('ornamentation');
          if (learned) {
            for (const [phrase, learnedCode] of Object.entries(learned)) {
              if (String(learnedCode) === String(code) && !item.keywords.includes(phrase.toLowerCase())) {
                item.keywords.push(phrase.toLowerCase());
              }
            }
          }
        }

        items.push(item);
      }

      this._cachedOrnamentationData = items;
      return items;
    },

    /**
     * Extract Soft Story taxonomy (Codes 0–2)
     */
    getSoftStoryData() {
      if (this._cachedSoftStoryData) return this._cachedSoftStoryData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.SOFT_STORY) ||
                  (root.SoftStoryClassifier && root.SoftStoryClassifier.taxonomy && root.SoftStoryClassifier.taxonomy.SOFT_STORY) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: String(code),
          category: info.name,
          shortName: info.shortName,
          group: 'Soft Story (Codes 0–2)',
          subSection: 'soft_story',
          description: info.description || '',
          perils: info.perils || ['CA EQ', 'HI EQ', 'JP EQ', 'NZ EQ', 'US EQ'],
          requirement: info.requirement || 'Optional',
          note: info.note || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: [
            'Applicable Perils: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional).',
            'Applicable only if stories >= 2. First-floor garages and taller first floors are prone to soft-story behavior and collapse.'
          ]
        };

        // Add learned keywords if available
        if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getLearned) {
          const learned = CustomCodesDB.getLearned('soft_story');
          if (learned) {
            for (const [phrase, learnedCode] of Object.entries(learned)) {
              if (String(learnedCode) === String(code) && !item.keywords.includes(phrase.toLowerCase())) {
                item.keywords.push(phrase.toLowerCase());
              }
            }
          }
        }

        items.push(item);
      }

      this._cachedSoftStoryData = items;
      return items;
    },

    /**
     * Extract Building Exterior Opening taxonomy (Codes 0–2)
     */
    getBuildingExteriorOpeningData() {
      if (this._cachedBuildingExteriorOpeningData) return this._cachedBuildingExteriorOpeningData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.BUILDING_EXTERIOR_OPENING) ||
                  (root.BuildingExteriorOpeningClassifier && root.BuildingExteriorOpeningClassifier.taxonomy && root.BuildingExteriorOpeningClassifier.taxonomy.BUILDING_EXTERIOR_OPENING) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: String(code),
          category: info.name,
          shortName: info.shortName,
          group: 'Building Exterior Opening (Codes 0–2)',
          subSection: 'building_exterior_opening',
          description: info.description || '',
          perils: info.perils || ['CA EQ', 'HI EQ', 'JP EQ', 'NZ EQ', 'US EQ'],
          requirement: info.requirement || 'Optional',
          note: info.note || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: [
            'Applicable Perils: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional).',
            'Shear wall earthquake resistance: walls with >50% openings have reduced seismic resistance.'
          ]
        };

        // Add learned keywords if available
        if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getLearned) {
          const learned = CustomCodesDB.getLearned('building_exterior_opening');
          if (learned) {
            for (const [phrase, learnedCode] of Object.entries(learned)) {
              if (String(learnedCode) === String(code) && !item.keywords.includes(phrase.toLowerCase())) {
                item.keywords.push(phrase.toLowerCase());
              }
            }
          }
        }

        items.push(item);
      }

      this._cachedBuildingExteriorOpeningData = items;
      return items;
    },

    /**
     * Extract short column taxonomy (Codes 0–2)
     */
    getShortColumnData() {
      if (this._cachedShortColumnData) return this._cachedShortColumnData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.SHORT_COLUMN) ||
                  (root.ShortColumnClassifier && root.ShortColumnClassifier.taxonomy && root.ShortColumnClassifier.taxonomy.SHORT_COLUMN) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: String(code),
          category: info.name,
          shortName: info.shortName,
          group: 'Short Column (Codes 0–2)',
          subSection: 'short_column',
          description: info.description || '',
          perils: info.perils || ['CA EQ', 'HI EQ', 'JP EQ', 'US EQ'],
          requirement: info.requirement || 'Optional',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: [
            'Applicable Perils: CA EQ, HI EQ, JP EQ, US EQ (Optional).',
            'Applies to old concrete structures in which the fill height of some column has been restricted by spandrel beams or infill walls.'
          ]
        };

        // Add learned keywords if available
        if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getLearned) {
          const learned = CustomCodesDB.getLearned('short_column');
          if (learned) {
            for (const [phrase, learnedCode] of Object.entries(learned)) {
              if (String(learnedCode) === String(code) && !item.keywords.includes(phrase.toLowerCase())) {
                item.keywords.push(phrase.toLowerCase());
              }
            }
          }
        }

        items.push(item);
      }

      this._cachedShortColumnData = items;
      return items;
    },

    /**
     * Extract foundation type taxonomy (Codes 0–12)
     */
    getFoundationTypeData() {
      if (this._cachedFoundationTypeData) return this._cachedFoundationTypeData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.FOUNDATION && td.FOUNDATION.FOUNDATION_TYPE) ||
                  (root.FoundationTypeClassifier && root.FoundationTypeClassifier.taxonomy && root.FoundationTypeClassifier.taxonomy.FOUNDATION_TYPE) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: code,
          title: `${info.name} (Code ${code})`,
          name: info.name,
          shortName: info.shortName || info.name,
          category: 'Foundation Type (Codes 0–12)',
          group: 'Foundation Type (Codes 0–12)',
          subSection: 'foundation_type',
          section: 'foundation_type',
          description: info.description || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: []
        };

        if (code === '8') item.rules.push('Most mid-rise buildings and commercial properties are built on mat foundations.');
        if (code === '9') item.rules.push('High-rise buildings tend to be supported on pile foundations. Piles are generally superior performers in earthquakes.');
        if (code === '10') item.rules.push('Not applicable for Verisk US Earthquake Model.');
        if (code === '4') item.rules.push('Mandatory selection in Verisk EQ Model for US when applying Retrofit Bracing of cripple walls (1).');
        if (code === '3') item.rules.push('Touchstone maps this to Crawlspace cripple wall (4) upon import.');

        if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getLearned) {
          const learned = CustomCodesDB.getLearned('foundation_type') || CustomCodesDB.getLearned('foundation');
          if (learned) {
            for (const [kw, c] of Object.entries(learned)) {
              if (String(c) === String(code) && !item.keywords.includes(kw)) {
                item.keywords.push(kw);
              }
            }
          }
        }

        items.push(item);
      }

      this._cachedFoundationTypeData = items;
      return items;
    },

    /**
     * Extract foundation connection taxonomy (Codes 0–6)
     */
    getFoundationConnectionData() {
      if (this._cachedFoundationConnectionData) return this._cachedFoundationConnectionData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.FOUNDATION && td.FOUNDATION.FOUNDATION_CONNECTION) ||
                  (root.FoundationConnectionClassifier && root.FoundationConnectionClassifier.TAXONOMY) || {};

      for (const [code, info] of Object.entries(tax)) {
        const item = {
          code: String(code),
          category: info.name,
          shortName: info.shortName,
          group: 'Foundation Connection (Codes 0–6)',
          subSection: 'foundation_connection',
          description: info.description || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: []
        };

        if (info.industrialEquiv) {
          item.rules.push(`Industrial facilities equipment anchorage: ${info.industrialEquiv} (${code})`);
        }
        if (info.retrofitNote) {
          item.rules.push(info.retrofitNote);
        }
        if (info.perils && Array.isArray(info.perils)) {
          item.rules.push(`Perils: ${info.perils.join(', ')}`);
        }

        items.push(item);
      }

      this._cachedFoundationConnectionData = items;
      return items;
    },

    /**
     * Extract construction taxonomy from CustomCodesDB / ConstructionClassifier.CODES + underwriting rules
     */
    getConstructionData() {
      if (this._cachedConstructionData) return this._cachedConstructionData;

      const items = [];
      const codesObj = (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getMergedConstruction)
        ? CustomCodesDB.getMergedConstruction()
        : ((root.ConstructionClassifier && root.ConstructionClassifier.CODES) || {});

      for (const [code, info] of Object.entries(codesObj)) {
        const item = {
          code: String(code),
          category: info.category || `Construction Code ${code}`,
          group: info.group || 'General Construction',
          description: info.description || '',
          keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
          rules: [],
          isCustom: !!info.isCustom,
          isModified: !!info.isModified
        };

        // Enrich with mandatory underwriting memory rules & ISO standards
        if (code === '113') {
          item.rules.push('⭐ MANDATORY UNDERWRITING RULE: STONE in Exterior Wall Finish / Construction MUST ALWAYS map to Code 113 (Rubble Stone Masonry).');
          if (!item.keywords.includes('stone')) item.keywords.push('stone', 'stone facade', 'stone wall', 'stone finish', 'stone masonry', 'fieldstone', 'rubble');
        } else if (code === '111') {
          item.rules.push('⭐ MANDATORY UNDERWRITING RULE: BRICK in Exterior Wall Finish / Construction MUST ALWAYS map to Code 111 (Masonry).');
          item.rules.push('🏢 ISO Class 4: Masonry Noncombustible ➔ Code 111 (Masonry).');
          if (!item.keywords.includes('brick')) item.keywords.push('iso 4', 'iso 4 masonry noncombustible', 'masonry noncombustible', 'mnc', 'masonry nc', 'brick', 'brick facade', 'brick wall', 'brick finish', 'exterior brick', 'general masonry');
        } else if (code === '101') {
          item.rules.push('🏢 ISO Class 1: Frame ➔ Code 101 (Wood Frame Modern).');
          if (!item.keywords.includes('frame')) item.keywords.push('iso 1', 'iso 1 frame', 'iso frame', 'frame', 'wood frame', 'stud wall', 'timber frame', '2x4', 'plywood sheathing');
        } else if (code === '136') {
          if (!item.keywords.includes('tilt-up')) item.keywords.push('tilt-up', 'tilt up', 'precast panel', 'concrete wall panel');
        } else if (code === '152') {
          item.rules.push('🏢 ISO Class 3: Noncombustible ➔ Code 152 (Light Metal / Non-Combustible).');
          if (!item.keywords.includes('noncombustible')) item.keywords.push('iso 3', 'iso 3 noncombustible', 'noncombustible', 'light metal', 'corrugated metal', 'pre-engineered metal', 'butler building', 'steel siding', 'pemb');
        } else if (code === '114') {
          if (!item.keywords.includes('unreinforced masonry')) item.keywords.push('unreinforced masonry', 'urm', 'bearing wall', 'unreinforced brick');
        } else if (code === '116') {
          if (!item.keywords.includes('reinforced masonry')) item.keywords.push('reinforced masonry', 'rm', 'concrete block', 'cmu', 'grouted masonry');
        } else if (code === '119') {
          item.rules.push('🏢 ISO Class 2: Joisted Masonry ➔ Code 119 (Joisted Masonry).');
          if (!item.keywords.includes('joisted masonry')) item.keywords.push('iso 2', 'iso 2 joisted masonry', 'joisted masonry', 'jm', 'wood floor masonry', 'combustible roof');
        } else if (code === '131') {
          item.rules.push('🏢 ISO Class 5: Modified Fire Resistive ➔ Code 131 (Reinforced Concrete / MFR).');
          item.rules.push('🏢 ISO Class 6: Fire Resistive ➔ Code 131 (Reinforced Concrete / FR).');
          if (!item.keywords.includes('fire resistive')) item.keywords.push('iso 5', 'iso 5 modified fire resistive', 'modified fire resistive', 'mfr', 'iso 6', 'iso 6 fire resistive', 'fire resistive', 'fr', 'reinforced concrete', 'rc frame', 'concrete column', 'concrete beam');
        } else if (code === '151') {
          if (!item.keywords.includes('structural steel')) item.keywords.push('structural steel', 'steel frame', 'steel column', 'i-beam');
        } else if (code === '191') {
          if (!item.keywords.includes('mobile home')) item.keywords.push('mobile home', 'manufactured home', 'tie-down');
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

      // 1. Roof Geometry (Codes 0-10)
      if (tax.GEOMETRY) {
        for (const [code, info] of Object.entries(tax.GEOMETRY)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '1. Roof Geometry',
            subSection: 'geometry',
            description: this.getRoofGeometryDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.GEOMETRY_WEAKNESS && root.RoofClassifier.GEOMETRY_WEAKNESS[code]) || 0,
            keywords: this.getRoofGeometryKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No % / Tie): Weaker geometry wins (e.g. Gable 2 over Hip 3).']
          };
          items.push(item);
        }
      }

      // 2. Roof Pitch (Codes 0-3)
      if (tax.PITCH) {
        for (const [code, info] of Object.entries(tax.PITCH)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '2. Roof Pitch',
            subSection: 'pitch',
            description: this.getRoofPitchDescription(code),
            weaknessScore: 0,
            keywords: this.getRoofPitchKeywords(code),
            rules: ['Derived from pitch angles, slope ratio e.g. 4:12, or roof geometry (Flat ➔ Low pitch).']
          };
          items.push(item);
        }
      }

      // 3. Roof Covering (Codes 0-12)
      if (tax.COVERING) {
        for (const [code, info] of Object.entries(tax.COVERING)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '3. Roof Covering',
            subSection: 'covering',
            description: this.getRoofCoveringDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.COVERING_WEAKNESS && root.RoofClassifier.COVERING_WEAKNESS[code]) || 0,
            keywords: this.getRoofCoveringKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No % / Tie): Weaker material wins.']
          };
          items.push(item);
        }
      }

      // 4. Roof Deck (Codes 0-8)
      if (tax.DECK) {
        for (const [code, info] of Object.entries(tax.DECK)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '4. Roof Deck',
            subSection: 'deck',
            description: this.getRoofDeckDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.DECK_WEAKNESS && root.RoofClassifier.DECK_WEAKNESS[code]) || 0,
            keywords: this.getRoofDeckKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No % / Tie): Weaker material wins.']
          };
          items.push(item);
        }
      }

      // 5. Roof Covering Attachment (Codes 0-4)
      if (tax.COVERING_ATTACHMENT) {
        for (const [code, info] of Object.entries(tax.COVERING_ATTACHMENT)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '5. Roof Covering Attachment',
            subSection: 'cov_attach',
            description: this.getRoofCoveringAttachmentDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.COVERING_ATTACHMENT_WEAKNESS && root.RoofClassifier.COVERING_ATTACHMENT_WEAKNESS[code]) || 0,
            keywords: this.getRoofCoveringAttachmentKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No %): Weaker attachment wins (e.g. Mortar 4 over Screws 1).']
          };
          items.push(item);
        }
      }

      // 6. Roof Deck Attachment (Codes 0-7)
      if (tax.DECK_ATTACHMENT) {
        for (const [code, info] of Object.entries(tax.DECK_ATTACHMENT)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '6. Roof Deck Attachment',
            subSection: 'deck_attach',
            description: this.getRoofDeckAttachmentDescription(code),
            weaknessScore: (root.RoofClassifier && root.RoofClassifier.DECK_ATTACHMENT_WEAKNESS && root.RoofClassifier.DECK_ATTACHMENT_WEAKNESS[code]) || 0,
            keywords: this.getRoofDeckAttachmentKeywords(code),
            rules: ['Rule 1 (With %): Higher % wins.', 'Rule 2 (No %): Weaker attachment schedule wins (e.g. Nails 2 over 8d @ 6/6).']
          };
          items.push(item);
        }
      }

      // 7. Roof Anchorage (Codes 0-7)
      if (tax.ANCHORAGE) {
        for (const [code, info] of Object.entries(tax.ANCHORAGE)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '7. Roof Anchorage',
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

      // Additional Roof Fields: Hail (0-4), Tank (0-2), Chimney (0-4)
      if (tax.HAIL) {
        for (const [code, info] of Object.entries(tax.HAIL)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Additional: Hail Impact Resistance',
            subSection: 'hail',
            description: (info.description) || 'Hail impact resistance classification.',
            weaknessScore: 0,
            keywords: info.keywords || [],
            rules: ['Touchstone Hail impact resistance classification (UL 2218 / FM 4473 Class 1-4).']
          });
        }
      }

      if (tax.TANK) {
        for (const [code, info] of Object.entries(tax.TANK)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Additional: Rooftop Tank',
            subSection: 'tank',
            description: (info.description) || 'Rooftop water/chiller tank presence.',
            weaknessScore: 0,
            keywords: info.keywords || [],
            rules: ['Touchstone Tank field (0=Unknown, 1=No, 2=Yes).']
          });
        }
      }

      if (tax.CHIMNEY) {
        for (const [code, info] of Object.entries(tax.CHIMNEY)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Additional: Chimney',
            subSection: 'chimney',
            description: (info.description) || 'Rooftop chimney presence and height.',
            weaknessScore: 0,
            keywords: info.keywords || [],
            rules: ['Touchstone Chimney field (0=Unknown, 1=No, 2=<2ft, 3=2-5ft, 4=>5ft).']
          });
        }
      }

      this._cachedRoofData = items;
      return items;
    },

    /**
     * Extract exterior wall taxonomy from WallTaxonomy + weakness rankings (All 9 Touchstone Wall Detail fields)
     */
    getWallData() {
      if (this._cachedWallData) return this._cachedWallData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.WALL) || (root.WallClassifier && root.WallClassifier.taxonomy) || (root.WallTaxonomy) || {};

      // 1. Wall Siding (Weather Envelope) Codes 0-8
      if (tax.WALL_SIDING) {
        for (const [code, info] of Object.entries(tax.WALL_SIDING)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '1. Wall Siding (Exterior Weather Envelope)',
            subSection: 'siding',
            description: info.description || this.getWallSidingDescription(code),
            perils: info.perils || ["AU WF", "CA EQ", "HI EQ", "HI TC", "JP EQ", "NZ EQ", "US EQ", "US HU", "US ST", "US WF"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.WALL_SIDING_WEAKNESS && root.WallClassifier.WALL_SIDING_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : this.getWallSidingKeywords(code),
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
            group: '2. Wall Type (Structural Wall Backing)',
            subSection: 'type',
            description: info.description || this.getWallTypeDescription(code),
            perils: info.perils || ["CA EQ", "HI EQ", "HI TC", "JP EQ", "NZ EQ", "US EQ", "US HU", "US ST"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.WALL_TYPE_WEAKNESS && root.WallClassifier.WALL_TYPE_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : this.getWallTypeKeywords(code),
            rules: [
              'Rule 1 (With %): Higher % wins.',
              'Rule 2 (No %): Weaker backing wins (e.g. Plywood & Concrete ➔ Plywood 3).',
              'Rule 3 (Tied %): Equal % picks weaker material.'
            ]
          };
          items.push(item);
        }
      }

      // 3. Glass Type (Codes 0-5)
      if (tax.GLASS_TYPE) {
        for (const [code, info] of Object.entries(tax.GLASS_TYPE)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '3. Glass Type',
            subSection: 'glass_type',
            description: info.description || 'Glass type specification.',
            perils: info.perils || ["HI TC", "US HU", "US ST", "US WF"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.GLASS_TYPE_WEAKNESS && root.WallClassifier.GLASS_TYPE_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone Glass Type (1=Annealed, 2=Tempered, 3=Heat strengthened, 4=Laminated, 5=Insulating glass units).']
          });
        }
      }

      // 4. Glass Percentage (Codes 0-4)
      if (tax.GLASS_PERCENTAGE) {
        for (const [code, info] of Object.entries(tax.GLASS_PERCENTAGE)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '4. Glass Percentage',
            subSection: 'glass_pct',
            description: info.description || 'Wall area covered by glass percentage.',
            perils: info.perils || ["HI TC", "US HU", "US ST"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.GLASS_PCT_WEAKNESS && root.WallClassifier.GLASS_PCT_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone Glass Percentage (1=<5%, 2=5-20%, 3=20-60%, 4=>60%). Higher glass area increases building vulnerability.']
          });
        }
      }

      // 5. Window Protection (Codes 0-3)
      if (tax.WINDOW_PROTECTION) {
        for (const [code, info] of Object.entries(tax.WINDOW_PROTECTION)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '5. Window Protection',
            subSection: 'window_protection',
            description: info.description || 'Window wind/impact protection system.',
            perils: info.perils || ["HI TC", "US HU", "US ST"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.WINDOW_PROT_WEAKNESS && root.WallClassifier.WINDOW_PROT_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone Window Protection (1=No protection, 2=Non-engineered shutters, 3=Engineered shutters).']
          });
        }
      }

      // 6. Exterior Doors (Codes 0-6)
      if (tax.EXTERIOR_DOORS) {
        for (const [code, info] of Object.entries(tax.EXTERIOR_DOORS)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '6. Exterior Doors',
            subSection: 'exterior_doors',
            description: info.description || 'Exterior door type and reinforcement.',
            perils: info.perils || ["HI TC", "US HU", "US ST"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.EXT_DOORS_WEAKNESS && root.WallClassifier.EXT_DOORS_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone Exterior Doors (1=Single width, 2=Double width, 3=Reinforced single, 4=Reinforced double, 5=Sliding, 6=Reinforced sliding).']
          });
        }
      }

      // 7. Building Exterior Opening (Codes 0-2)
      if (tax.BUILDING_EXTERIOR_OPENING) {
        for (const [code, info] of Object.entries(tax.BUILDING_EXTERIOR_OPENING)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '7. Building Exterior Opening',
            subSection: 'opening',
            description: info.description || 'Percentage of exterior walls that are open (windows/doors).',
            perils: info.perils || ["CA EQ", "HI EQ", "JP EQ", "NZ EQ", "US EQ"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.OPENING_WEAKNESS && root.WallClassifier.OPENING_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone Exterior Openings (1=<50% wall open / default, 2=>50% wall open). >50% open walls reduce seismic resistance.']
          });
        }
      }

      // 8. Brick Veneer Percentage (Codes 0-3)
      if (tax.BRICK_VENEER) {
        for (const [code, info] of Object.entries(tax.BRICK_VENEER)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '8. Brick Veneer %',
            subSection: 'brick_veneer',
            description: info.description || 'Percentage of exterior walls that are brick veneer.',
            perils: info.perils || ["CA EQ", "HI EQ", "JP EQ", "US EQ"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.BRICK_VENEER_WEAKNESS && root.WallClassifier.BRICK_VENEER_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone Brick Veneer (0=50-90% default, 1=>90%, 2=25-50%, 3=0-25%). Used in conjunction with 103 - Masonry Veneer construction code.']
          });
        }
      }

      // 9. Fire Rating for Wall Siding (Codes 0-3)
      if (tax.FIRE_RATING_WALL_SIDING) {
        for (const [code, info] of Object.entries(tax.FIRE_RATING_WALL_SIDING)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: '9. Fire Rating for Wall Siding',
            subSection: 'fire_rating',
            description: info.description || 'Fire rating classification for wall siding.',
            perils: info.perils || ["AU WF", "US WF"],
            weaknessScore: (root.WallClassifier && root.WallClassifier.FIRE_RATING_WEAKNESS && root.WallClassifier.FIRE_RATING_WEAKNESS[code]) || 0,
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone Fire Rating for Wall Siding (0=Unknown/No Rating, 1=Class A, 2=Class B, 3=Class C). Added June 2024 for US/AU Wildfire models.']
          });
        }
      }

      this._cachedWallData = items;
      return items;
    },

    /**
     * Extract foundation taxonomy from TouchstoneData.FOUNDATION / FoundationClassifier
     */
    getFoundationData() {
      if (this._cachedFoundationData) return this._cachedFoundationData;

      const items = [];
      const td = _getTouchstoneData();
      const tax = (td && td.FOUNDATION) || (root.FoundationClassifier && root.FoundationClassifier.TAXONOMY) || {};

      // 1. Foundation Type (Codes 0-12)
      if (tax.FOUNDATION_TYPE) {
        for (const [code, info] of Object.entries(tax.FOUNDATION_TYPE)) {
          const item = {
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Foundation Type (Codes 0–12)',
            subSection: 'foundation_type',
            description: info.description || '',
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: []
          };

          if (code === '1' || code === '2') {
            item.rules.push('Required when Floor of Interest = -1 (Basement).');
            item.rules.push('Supported in UK/Central Europe Inland Flood models.');
          } else if (code === '3') {
            item.rules.push('Note: Touchstone maps code 3 to Crawlspace cripple wall (4) upon import.');
          } else if (code === '4') {
            item.rules.push('Required for Verisk US Earthquake Model when applying Retrofit Measures option Bracing of cripple walls (1).');
          } else if (code === '8') {
            item.rules.push('Most mid-rise buildings and commercial properties are built on mat foundations.');
          } else if (code === '9') {
            item.rules.push('High-rise buildings tend to be supported on pile foundations. Piles are generally superior performers in earthquakes.');
          } else if (code === '10') {
            item.rules.push('Not applicable for Verisk US Earthquake Model.');
            item.rules.push('Invalid combination: Floor of Interest = -1 (Basement) and Foundation Type = No basement (10) in UK/European models.');
          }

          items.push(item);
        }
      }

      // 2. Foundation Connection (Codes 0-3)
      if (tax.FOUNDATION_CONNECTION) {
        for (const [code, info] of Object.entries(tax.FOUNDATION_CONNECTION)) {
          items.push({
            code: String(code),
            category: info.name,
            shortName: info.shortName,
            group: 'Foundation Connection (Codes 0–3)',
            subSection: 'foundation_connection',
            description: info.description || '',
            keywords: Array.isArray(info.keywords) ? [...info.keywords] : [],
            rules: ['Touchstone UNICEDE® Foundation Connection specification.']
          });
        }
      }

      this._cachedFoundationData = items;
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

    getRoofCoveringAttachmentDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.COVERING_ATTACHMENT && td.ROOF.COVERING_ATTACHMENT[code] && td.ROOF.COVERING_ATTACHMENT[code].description) || 'Touchstone UNICEDE roof covering attachment.';
    },

    getRoofCoveringAttachmentKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.COVERING_ATTACHMENT && td.ROOF.COVERING_ATTACHMENT[code] && td.ROOF.COVERING_ATTACHMENT[code].keywords) || [];
    },

    getRoofDeckAttachmentDescription(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.DECK_ATTACHMENT && td.ROOF.DECK_ATTACHMENT[code] && td.ROOF.DECK_ATTACHMENT[code].description) || 'Touchstone UNICEDE roof deck attachment.';
    },

    getRoofDeckAttachmentKeywords(code) {
      const td = _getTouchstoneData();
      return (td && td.ROOF && td.ROOF.DECK_ATTACHMENT && td.ROOF.DECK_ATTACHMENT[code] && td.ROOF.DECK_ATTACHMENT[code].keywords) || [];
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

      // 5a. Foundation Type detection
      if (section === 'foundation_type' || section === 'foundationType') {
        if (root.FoundationTypeClassifier && root.FoundationTypeClassifier.classifyFoundationType) {
          const match = root.FoundationTypeClassifier.classifyFoundationType(clean);
          if (match && match.code) {
            const item = this.getByCode(match.code, 'foundation_type');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'foundation_type', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 5b. Foundation Connection detection
      if (section === 'foundation' || section === 'foundation_connection' || section === 'foundationConnection') {
        if (root.FoundationConnectionClassifier && root.FoundationConnectionClassifier.classify) {
          const res = root.FoundationConnectionClassifier.classify(clean);
          if (res && res.code && res.code !== '0') {
            const item = this.getByCode(res.code, 'foundation_connection');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'foundation_connection', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 6. Short Column detection
      if (section === 'short_column' || section === 'shortColumn') {
        if (root.ShortColumnClassifier && root.ShortColumnClassifier.classifyShortColumn) {
          const match = root.ShortColumnClassifier.classifyShortColumn(clean);
          if (match && match.code) {
            const item = this.getByCode(match.code, 'short_column');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'short_column', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 7. Building Exterior Opening detection
      if (section === 'building_exterior_opening' || section === 'buildingExteriorOpening' || section === 'exterior_opening') {
        if (root.BuildingExteriorOpeningClassifier && root.BuildingExteriorOpeningClassifier.classifyBuildingExteriorOpening) {
          const match = root.BuildingExteriorOpeningClassifier.classifyBuildingExteriorOpening(clean);
          if (match && match.code) {
            const item = this.getByCode(match.code, 'building_exterior_opening');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'building_exterior_opening', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 8. Soft Story detection
      if (section === 'soft_story' || section === 'softStory') {
        if (root.SoftStoryClassifier && root.SoftStoryClassifier.classifySoftStory) {
          const match = root.SoftStoryClassifier.classifySoftStory(clean);
          if (match && match.code) {
            const item = this.getByCode(match.code, 'soft_story');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'soft_story', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 9. Ornamentation detection
      if (section === 'ornamentation' || section === 'ornament') {
        if (root.OrnamentationClassifier && root.OrnamentationClassifier.classifyOrnamentation) {
          const match = root.OrnamentationClassifier.classifyOrnamentation(clean);
          if (match && match.code) {
            const item = this.getByCode(match.code, 'ornamentation');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'ornamentation', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 10. Building Shape detection
      if (section === 'building_shape' || section === 'buildingShape' || section === 'shape') {
        if (root.BuildingShapeClassifier && root.BuildingShapeClassifier.classifyBuildingShape) {
          const match = root.BuildingShapeClassifier.classifyBuildingShape(clean);
          if (match && match.code) {
            const item = this.getByCode(match.code, 'building_shape');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'building_shape', { limit: 1 });
        return results.length > 0 ? results[0] : null;
      }

      // 11. Building Condition detection
      if (section === 'building_condition' || section === 'buildingCondition' || section === 'condition') {
        if (root.BuildingConditionClassifier && root.BuildingConditionClassifier.classifyBuildingCondition) {
          const match = root.BuildingConditionClassifier.classifyBuildingCondition(clean);
          if (match && match.code) {
            const item = this.getByCode(match.code, 'building_condition');
            if (item) return item;
          }
        }
        const results = this.search(clean, 'building_condition', { limit: 1 });
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
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('cleanexcel:custom_db_updated', function() {
        CodeFinder.clearCache();
      });
    }
  }

})(typeof window !== 'undefined' ? window : global);
