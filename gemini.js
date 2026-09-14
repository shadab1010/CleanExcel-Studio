/**
 * CleanExcel - Google Gemini AI Integration Service
 * Model: gemini-2.5-flash
 */

const GeminiService = {
  DEFAULT_API_KEY: '',
  MODEL_NAME: 'gemini-2.5-flash',
  API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',

  getApiKey() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('cleanexcel_gemini_api_key') || this.DEFAULT_API_KEY;
    }
    return this.DEFAULT_API_KEY;
  },

  setApiKey(key) {
    if (typeof localStorage === 'undefined') return;
    if (key && key.trim()) {
      localStorage.setItem('cleanexcel_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('cleanexcel_gemini_api_key');
    }
  },

  isConfigured() {
    const key = this.getApiKey();
    return !!(key && key.trim().length > 5);
  },

  hasCustomKey() {
    if (typeof localStorage === 'undefined') return false;
    const key = localStorage.getItem('cleanexcel_gemini_api_key');
    return !!(key && key.trim().length > 5);
  },

  getMaskedKeyDisplay() {
    const key = this.getApiKey();
    if (!key || key.trim().length === 0) return 'Not Configured';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '••••••••••••••••••••••••••••••••••••';
    return `${trimmed.slice(0, 4)}••••••••••••••••••••••••••••${trimmed.slice(-4)}`;
  },

  /**
   * Internal helper: Base API endpoint
   */
  _getEndpoint(modelName) {
    const model = modelName || this.MODEL_NAME;
    return `${this.API_BASE}/${model}:generateContent`;
  },

  /**
   * Internal helper: Secure HTTP headers carrying the API key
   */
  _getHeaders(customKey) {
    const apiKey = (customKey || this.getApiKey() || '').trim();
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['x-goog-api-key'] = apiKey;
    }
    return headers;
  },

  /**
   * Robust JSON extractor: safely handles markdown code fences (```json ... ```)
   * and extracts arrays or objects without throwing syntax errors.
   */
  _extractJSON(text) {
    if (!text || typeof text !== 'string') return null;
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    try {
      return JSON.parse(clean);
    } catch (e) {
      const arrayMatch = clean.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]);
        } catch (e2) {}
      }
      const objMatch = clean.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch (e3) {}
      }
      throw new Error(`Failed to parse AI response as JSON. Response preview: ${text.slice(0, 120)}...`);
    }
  },

  /**
   * Internal resilient HTTP request helper:
   * - Validates key presence
   * - Retries with URL query param if custom header is blocked
   * - Retries without thinkingConfig if unsupported
   * - Falls back to alternative models if 404
   */
  async _makeRequest(payload, customKey, modelOverride) {
    const key = (customKey || this.getApiKey() || '').trim();
    if (!key) {
      throw new Error('No Gemini API Key provided. Please enter your Google Gemini API key in Gemini AI Settings.');
    }

    const currentModel = modelOverride || this.MODEL_NAME;
    const url = this._getEndpoint(currentModel);
    let res;

    try {
      res = await fetch(url, {
        method: 'POST',
        headers: this._getHeaders(key),
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      // Fallback with key query parameter if headers are stripped by proxies/extensions
      const fallbackUrl = `${url}?key=${encodeURIComponent(key)}`;
      try {
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (fallbackErr) {
        throw new Error(`Network connection to Google Gemini failed: ${netErr.message || fallbackErr.message}. Check your internet connection or browser security extensions.`);
      }
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson.error ? errJson.error.message : `HTTP ${res.status}`;

      // If error is related to thinkingConfig, retry without it
      if (payload.generationConfig && payload.generationConfig.thinkingConfig && (res.status === 400 || errMsg.toLowerCase().includes('thinking'))) {
        const cleanPayload = JSON.parse(JSON.stringify(payload));
        delete cleanPayload.generationConfig.thinkingConfig;
        return this._makeRequest(cleanPayload, key, currentModel);
      }

      // If model not found (404), fallback to alternative Flash models
      if (res.status === 404 && currentModel !== 'gemini-1.5-flash') {
        const altModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        for (const alt of altModels) {
          if (alt === currentModel) continue;
          try {
            return await this._makeRequest(payload, key, alt);
          } catch (e) {}
        }
      }

      throw new Error(errMsg);
    }

    const data = await res.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      throw new Error('Gemini returned an empty response. Content may have been filtered.');
    }
    return textOutput;
  },

  /**
   * Test API key connectivity
   */
  async testConnection(customKey) {
    const key = (customKey || this.getApiKey() || '').trim();
    if (!key) throw new Error('No Gemini API Key provided. Please paste your API key above.');

    const payload = {
      contents: [{ parts: [{ text: 'Respond with exactly: "Google Gemini 2.5 Flash is connected."' }] }]
    };

    const text = await this._makeRequest(payload, key);
    return {
      success: true,
      model: this.MODEL_NAME,
      message: text.trim()
    };
  },

  /**
   * Helper to invoke Gemini with a system prompt and user text, expecting JSON
   */
  async callGemini(systemPrompt, userText) {
    const payload = {
      generationConfig: {
        responseMimeType: 'application/json',
        response_mime_type: 'application/json'
      },
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        { parts: [{ text: userText }] }
      ]
    };

    return this._makeRequest(payload);
  },

  /**
   * Use Gemini AI to parse and split addresses across any country (US, UK, Germany, Canada, etc.)
   */
  async parseAddressesWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const nonBlankLines = rawLines.map((line, idx) => ({ idx, line: String(line || '').trim() })).filter(item => item.line.length > 0);
    if (nonBlankLines.length === 0) return [];

    const systemPrompt = `You are CleanExcel Studio AI, an expert address parser with worldwide international knowledge (US, UK, Germany, Canada, France, Australia, Japan, etc.).
Parse each input address into an array of JSON objects matching this exact structure:
[
  {
    "lineNum": <int: 1-based original line index>,
    "street": "<street name & number, e.g. 10 Downing Street, 1908 Grand Avenue, 350 King Street West, Friedrichstraße 43>",
    "city": "<city or town, e.g. London, Nashville, Berlin, Toronto>",
    "state": "<state code or province code, e.g. TN, ON, CA, or empty string if not applicable>",
    "county": "<county or district name if present in appraisal records or UK counties, e.g. Davidson, Anchorage, Surrey, or empty string>",
    "postal": "<postal code, zip code, or PLZ, e.g. SW1A 2AA, 37212, 10117, M5V 3X5, or empty string>",
    "country": "<standard ISO 3166-1 alpha-2 two-letter country code in UPPERCASE, e.g. US for United States, GB for United Kingdom, DE for Germany, CA for Canada>"
  }
]

Strict Rules:
1. For country, ALWAYS output standard 2-letter ISO 3166-1 alpha-2 codes (e.g. US for United States, GB for United Kingdom, DE for Germany, CA for Canada, AU for Australia).
2. For US appraisal records with [Street], [City], [State], [County], [Postal], extract County into the "county" field (e.g. DAVIDSON in "1908 Grand Avenue,NASHVILLE,TN,DAVIDSON,37212").
3. For UK addresses, extract the building & street into "street" (e.g. "22 High Street"), the post town into "city" (e.g. "WITNEY", "London"), the county into "county" (e.g. "Oxfordshire", "Surrey"), the alphanumeric postcode into "postal" (e.g. "OX28 6RB", "SW1A 2AA"), and "GB" into "country".
4. For Germany addresses, extract the 5-digit PLZ (e.g. 10117) into "postal" and "DE" into "country".
5. For Canada addresses, extract the postal code (e.g. M5V 3X5) into "postal", province into "state", and "CA" into "country".
6. For Australia addresses, extract suburb into "city", state (NSW, VIC, QLD, WA, SA, TAS, ACT, NT) into "state", 4-digit postcode into "postal", and "AU" into "country".
7. Remove noise prefixes like "Unit 4, ", "No1 bldg, ", or trailing "#" from the street address.
8. Preserve number ranges with hyphens like "145-146 MIRAMAR BOULEVARD".`;

    const BATCH_SIZE = 50;
    const parsedArray = [];

    for (let i = 0; i < nonBlankLines.length; i += BATCH_SIZE) {
      const batch = nonBlankLines.slice(i, i + BATCH_SIZE);
      const userText = batch.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
      
      const textOutput = await this.callGemini(systemPrompt, userText);
      const batchParsed = this._extractJSON(textOutput) || [];
      if (Array.isArray(batchParsed)) {
        parsedArray.push(...batchParsed);
      }

      // Delay between batches to respect Gemini Free Tier rate limits (15 requests/min)
      if (i + BATCH_SIZE < nonBlankLines.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Map back to original line order
    const casing = options.casing || 'titlecase';
    const countryFormat = options.countryFormat || 'iso2';
    const formatCase = (str) => {
      if (!str) return '';
      if (casing === 'uppercase') return str.toUpperCase();
      if (casing === 'titlecase') {
        let titled = str.toLowerCase().replace(/(^|\s|-|\/)([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
        return titled.replace(/\b(sw|nw|se|ne)\b/gi, m => m.toUpperCase());
      }
      return str;
    };

    const resultsMap = new Map();
    parsedArray.forEach(item => {
      const rawC = item.country || (options.defaultCountry || 'US');
      const formattedC = (typeof window !== 'undefined' && window.AddressSplitter)
        ? window.AddressSplitter.formatCountry(rawC, countryFormat)
        : rawC;

      resultsMap.set(item.lineNum, {
        street: formatCase(item.street || ''),
        city: formatCase(item.city || ''),
        state: (item.state || '').toUpperCase(),
        county: formatCase(item.county || ''),
        postal: (item.postal || '').toUpperCase(),
        country: formattedC
      });
    });

    return rawLines.map((line, i) => {
      const lineNum = i + 1;
      const parsed = resultsMap.get(lineNum) || (window.AddressSplitter ? window.AddressSplitter.parseAddress(line, options) : {});
      return {
        lineNum,
        original: line,
        cleaned: `${parsed.street} \t ${parsed.city} \t ${parsed.state} \t ${parsed.county} \t ${parsed.postal}${parsed.country ? ' \t ' + parsed.country : ''}`,
        street: parsed.street,
        city: parsed.city,
        state: parsed.state,
        county: parsed.county,
        postal: parsed.postal,
        country: parsed.country,
        changed: true,
        aiEnhanced: true
      };
    });
  },

  /**
   * Use Gemini AI to clean street column following user rules
   */
  async cleanStreetsWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const nonBlankLines = rawLines.map((line, idx) => ({ idx, line: String(line || '').trim() })).filter(item => item.line.length > 0);
    if (nonBlankLines.length === 0) return [];

    const systemPrompt = `You are CleanExcel Studio AI Street Cleaner.
Clean each address according to these strict rules:
1. Strip these 29 noise symbols: ,./<>?;':"|[]{}=+-_()#$%^&*@!
2. Strip these words: street, building, builfin, unit, st, bldg (case-insensitive).
3. Normalize building prefix like "Bldg 1 - 1521 Greens Road" to "521 GREENS ROAD".
4. For multi-addresses like "8901 Meadowbrook Blvd, 1401, 1405... and 1421 Randol Crossing Lane" take the first primary address "8901 MEADOWBROOK BLVD".
5. If "500 Malabar Road SW,Magnolia Cove Drive" take the first address "500 MALABAR ROAD SW".
6. STRICTLY PRESERVE hyphens in number ranges like "145-146 MIRAMAR BOULEVARD".
Output ONLY a JSON array: [{"lineNum": <int>, "cleaned": "<UPPERCASE cleaned street address>"}]`;

    const userText = nonBlankLines.map(item => `Line ${item.idx + 1}: ${item.line}`).join('\n');
    const textOutput = await this.callGemini(systemPrompt, userText);
    const parsedArray = this._extractJSON(textOutput) || [];
    const resultsMap = new Map();
    parsedArray.forEach(item => {
      resultsMap.set(item.lineNum, item.cleaned);
    });

    return rawLines.map((line, i) => {
      const lineNum = i + 1;
      const cleaned = resultsMap.get(lineNum) || (window.StreetCleaner ? window.StreetCleaner.cleanAddress(line, options) : line);
      return {
        lineNum,
        original: line,
        cleaned: cleaned,
        changed: line.trim() !== cleaned,
        aiEnhanced: true
      };
    });
  },

  /**
   * Classify Occupancy Description and Building Description into UNICEDE Touchstone Occupancy Class Code using Gemini 2.5
   */
  async classifyOccupancyWithAI(inputData, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');
    let rowsToProcess = [];

    if (inputData && typeof inputData === 'object' && !Array.isArray(inputData) && (inputData.bldgDescs || inputData.occDescs || inputData.extraCols)) {
      const codes = inputData.existingCodes || [];
      const bldgs = inputData.bldgDescs || [];
      const occs = inputData.occDescs || [];
      const extraCols = inputData.extraCols || [];
      const maxLen = Math.max(codes.length, bldgs.length, occs.length, ...(extraCols.map(c => c.length)));

      for (let i = 0; i < maxLen; i++) {
        const rowExtra = extraCols.map(col => (col[i] || '').trim());
        rowsToProcess.push({
          idx: i,
          existingCode: (codes[i] || '').trim(),
          bldgDesc: (bldgs[i] || '').trim(),
          occDesc: (occs[i] || '').trim(),
          extraCols: rowExtra
        });
      }
    } else {
      const rawLines = Array.isArray(inputData) ? inputData : String(inputData || '').split(/\r\n|\r|\n/);
      rowsToProcess = rawLines.map((line, idx) => {
        const parsed = (typeof window !== 'undefined' && window.OccupancyClassifier)
          ? window.OccupancyClassifier.parseRow(line)
          : { existingCode: '', bldgDesc: '', occDesc: line };
        return {
          idx,
          existingCode: parsed.existingCode,
          bldgDesc: parsed.bldgDesc,
          occDesc: parsed.occDesc,
          extraCols: []
        };
      });
    }

    const nonBlankRows = rowsToProcess.filter(r => r.existingCode || r.bldgDesc || r.occDesc || (r.extraCols && r.extraCols.some(Boolean)));

    if (nonBlankRows.length === 0) {
      return [];
    }

    const systemPrompt = `You are CleanExcel Studio AI Insurance Occupancy Classifier.
You analyze commercial, residential, industrial, and institutional occupancy and building descriptions to assign the official UNICEDE® / AIR-Worldwide Touchstone Occupancy Class Code.

Key UNICEDE Touchstone Occupancy Code Schema:
- 300: Unknown occupancy
- 301: Permanent Dwelling: General Residential
- 302: Permanent Dwelling: Single Family (Dwellings, Family Homes)
- 303: Permanent Dwelling: Multi Family (Duplex, Triplex, Quadplex)
- 304: Temporary Lodging (Hotels, Motels, Resorts, Inns)
- 305: Group Institutional Housing (Nursing Homes, Convalescent Centers, Assisted Living, Independent Living, Extended Care, Dormitories, Residence Halls, Convents, Motherhouses)
- 306: Apartments / Condominiums
- 307: Terraced Housing / Townhomes
- 311: General Commercial
- 312: Retail Trade (Stores, Supermarkets, Malls, Strip Centers)
- 313: Wholesale Trade (Warehouses, Storage Facilities, Distribution Centers, Logistics)
- 314: Personal & Repair Services (Salons, Dry Cleaners, Laundromats)
- 315: Professional, Technical, Business Services (Offices, Banks, Financial, Law Firms)
- 316: Health Care Services (Hospitals, Clinics, Outpatient, Medical Offices)
- 317: Entertainment & Recreation (Theaters, Gyms, Arenas, Bowling, Stadiums)
- 318: Parking Structures / Garages
- 319: Golf Courses
- 321: General Industrial
- 322: Heavy Fabrication and Assembly
- 323: Light Fabrication and Assembly
- 324: Food and Drug Processing
- 325: Chemical Processing
- 326: Metal Processing
- 327: High Technology (Data Centers, Cleanrooms)
- 328: Mining and Mineral Processing
- 329: Oil & Gas Refining / Petrochemical
- 330: Paper and Wood Products
- 331: Restaurant occupancy (Restaurants, Diners, Fast Food, Cafes, Bars & Grills)
- 335: Mercantile - Wholesale & Retail Wholesale
- 336: Automotive Repair Shops and Car Washes
- 341: Public Administration
- 342: Church / Religious Places of Worship (Churches, Ministries, Rectories, Cathedrals, Sanctuaries, Synagogues, Mosques, Temples, Dioceses, Parishes)
- 343: Government - General Services (Courthouses, City Halls, Post Offices)
- 344: Government - Emergency Services (Police, Fire, Ambulance Stations)
- 345: General Education
- 346: Primary and Secondary Schools / Colleges / Universities (High Schools, Elementary Schools, Middle Schools, Academies)
- 351: General Transportation
- 352: Rail Transportation
- 353: Airport Transportation / Terminals
- 354: Marine / Port Cargo Facilities
- 355: Aircraft Hangars
- 356: Bus Terminals
- 361: General Utilities
- 362: Water Supply / Treatment
- 363: Wastewater / Sewer Treatment
- 364: Electric Power Generation / Substation
- 365: Telecommunications / Cell Towers
- 366: Commercial Condominiums
- 367: Mobile Homes / Manufactured Housing
- 371: Miscellaneous / Vacant / Agricultural
- 382: Builder's Risk - Residential
- 383: Builder's Risk - Commercial
- 384: Builder's Risk - Industrial
- 400: Industrial Facility Occupancies
- 3001: Solar Occupancy / Solar Farms

Instructions:
1. For each line, analyze both "bldgDesc" (Building Description) and "occDesc" (Occupancy Description).
2. If "occDesc" contains percentages (e.g. 97%), the dominant percentage (>50%) or primary occupancy takes precedence.
3. Compare with "existingCode" (if provided):
   - If existingCode matches: confirmed.
   - If existingCode was 300 (Unknown) or differed: provide the accurate code.
4. Output ONLY a JSON array with one object per input line:
[{"lineNum": <int>, "occCode": "<string>", "category": "<string>"}]`;

    const userText = nonBlankRows.map(item => 
      `Line ${item.idx + 1}: ExistingCode="${item.existingCode}" | BuildingDesc="${item.bldgDesc}" | OccupancyDesc="${item.occDesc}"`
    ).join('\n');

    const textOutput = await this.callGemini(systemPrompt, userText);
    const parsedArray = this._extractJSON(textOutput) || [];
    const resultsMap = new Map();
    parsedArray.forEach(item => {
      resultsMap.set(item.lineNum, {
        occCode: String(item.occCode || '300'),
        category: item.category || 'Unknown occupancy'
      });
    });

    return rowsToProcess.map((row, i) => {
      const lineNum = i + 1;
      const aiItem = resultsMap.get(lineNum);
      const ex = row.existingCode;

      if (aiItem) {
        let statusKey = 'assigned';
        let statusText = 'Assigned';
        if (ex) {
          if (ex === aiItem.occCode) {
            statusKey = 'match';
            statusText = `✓ Confirmed (${aiItem.occCode})`;
          } else if (ex === '300' && aiItem.occCode !== '300') {
            statusKey = 'upgraded';
            statusText = `✨ Resolved (300 ➔ ${aiItem.occCode})`;
          } else {
            statusKey = 'mismatch';
            statusText = `⚠️ Review (${ex} ➔ ${aiItem.occCode})`;
          }
        } else {
          statusKey = 'assigned';
          statusText = `✨ Assigned (${aiItem.occCode})`;
        }

        const extraCols = row.extraCols || [];
        const origParts = [row.existingCode, row.bldgDesc, row.occDesc, ...extraCols];
        const cleanParts = [row.existingCode, row.bldgDesc, row.occDesc, ...extraCols, aiItem.occCode, aiItem.category].filter(Boolean);

        return {
          lineNum,
          original: origParts.join('\t').trim(),
          existingCode: row.existingCode,
          bldgDesc: row.bldgDesc,
          occDesc: row.occDesc,
          extraCols: extraCols,
          allCols: origParts,
          occCode: aiItem.occCode,
          category: aiItem.category,
          status: statusKey,
          statusText: statusText,
          comparisonStatus: statusKey,
          comparisonMessage: statusText,
          cleaned: cleanParts.join('\t'),
          changed: true,
          aiEnhanced: true
        };
      }

      const extraCols = row.extraCols || [];
      const origParts = [row.existingCode, row.bldgDesc, row.occDesc, ...extraCols];
      const local = (typeof window !== 'undefined' && window.OccupancyClassifier)
        ? window.OccupancyClassifier.classifyRow(row.existingCode, row.bldgDesc, row.occDesc, extraCols)
        : { existingCode: row.existingCode, bldgDesc: row.bldgDesc, occDesc: row.occDesc, occCode: '300', category: 'Unknown occupancy', status: 'assigned', statusText: 'Assigned', comparisonStatus: 'assigned', comparisonMessage: 'Assigned' };

      const cleanParts = [local.existingCode, local.bldgDesc, local.occDesc, ...extraCols, local.occCode, local.category].filter(Boolean);

      return {
        lineNum,
        original: origParts.join('\t').trim(),
        existingCode: local.existingCode,
        bldgDesc: local.bldgDesc,
        occDesc: local.occDesc,
        extraCols: extraCols,
        allCols: origParts,
        occCode: local.occCode,
        category: local.category,
        status: local.status,
        statusText: local.statusText,
        comparisonStatus: local.status,
        comparisonMessage: local.statusText,
        cleaned: cleanParts.join('\t'),
        changed: true,
        aiEnhanced: false
      };
    });
  },

  /**
   * Use Gemini AI to accurately classify structural engineering / construction descriptions into Touchstone UNICEDE Construction Codes
   */
  async classifyConstructionWithAI(inputPayload) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    let rowsToProcess = [];
    if (inputPayload && typeof inputPayload === 'object' && !Array.isArray(inputPayload) && (inputPayload.bldgDescs || inputPayload.conDescs || inputPayload.extraCols)) {
      const codes = inputPayload.existingCodes || [];
      const bldgs = inputPayload.bldgDescs || [];
      const cons = inputPayload.conDescs || [];
      const extraCols = inputPayload.extraCols || [];
      const maxLen = Math.max(codes.length, bldgs.length, cons.length, ...(extraCols.map(c => c.length)));
      for (let i = 0; i < maxLen; i++) {
        const rowExtra = extraCols.map(col => (col[i] || '').trim());
        rowsToProcess.push({
          idx: i,
          existingCode: (codes[i] || '').trim(),
          bldgDesc: (bldgs[i] || '').trim(),
          conDesc: (cons[i] || '').trim(),
          extraCols: rowExtra
        });
      }
    } else {
      const lines = typeof inputPayload === 'string' ? inputPayload.split(/\r\n|\r|\n/) : inputPayload;
      rowsToProcess = lines.map((line, idx) => {
        const row = (typeof window !== 'undefined' && window.ConstructionClassifier)
          ? window.ConstructionClassifier.parseRow(line)
          : { existingCode: '', bldgDesc: '', conDesc: String(line || '').trim() };
        return {
          idx,
          existingCode: row.existingCode,
          bldgDesc: row.bldgDesc,
          conDesc: row.conDesc,
          extraCols: []
        };
      });
    }

    const nonBlankRows = rowsToProcess.filter(r => r.existingCode || r.bldgDesc || r.conDesc || (r.extraCols && r.extraCols.some(Boolean)));
    if (nonBlankRows.length === 0) return [];

    const systemPrompt = `You are CleanExcel Studio AI, an expert structural engineering and property appraisal analyst specialized in Verisk Touchstone UNICEDE® Construction Class Codes.
Map each building and construction description to its official Verisk Touchstone construction code:

Primary Reference Schema:
- 100: Unknown construction
- 101: Wood Frame (Modern) (stud wall, stick built, detached single/multi-family)
- 102: Light Wood Frame (studless, light timber trusses)
- 103: Masonry Veneer (wood-framed faced with single wythe of brick/stone)
- 104: Heavy Timber (mill construction, masonry walls with heavy wood columns, glulam)
- 107: Lightweight Cladding (fiber cement, light gauge steel support)
- 111: Masonry (exterior masonry walls, general brick/block)
- 112: Adobe (adobe clay blocks, mud mortar)
- 113: Rubble Stone Masonry (irregular stones in cement mortar)
- 114: Unreinforced Masonry - Bearing Wall (URM, unreinforced brick, load bearing)
- 115: Unreinforced Masonry - Bearing Frame (URM infill walls)
- 116: Reinforced Masonry (load bearing reinforced brick or CMU concrete block)
- 117: Reinforced Masonry Shear Wall with MRF
- 118: Reinforced Masonry Shear Wall without MRF
- 119: Joisted Masonry (JM, masonry exterior walls with combustible wood floor/roof joists)
- 120: Confined Masonry (masonry confined by tie-columns/beams)
- 131: Reinforced Concrete (RC, poured/cast-in-place concrete columns and beams)
- 132: Reinforced Concrete Shear Wall with MRF
- 133: Reinforced Concrete Shear Wall without MRF (concrete box system)
- 134: Reinforced Concrete MRF - Ductile (ductile moment resisting frame)
- 135: Reinforced Concrete MRF - Non-Ductile
- 136: Tilt-Up (reinforced concrete wall panels cast on ground and tilted up)
- 137: Pre-cast Concrete (prefabricated post and beam concrete frame)
- 138: Pre-cast Concrete with Shear Wall
- 139: Reinforced Concrete MRF
- 151: Steel (structural steel columns and beams)
- 152: Light Metal (pre-engineered metal building / PEMB, light gauge steel, corrugated siding/shed)
- 153: Braced Steel Frame (steel braced with diagonal members)
- 154: Steel MRF - Perimeter
- 155: Steel MRF - Distributed
- 156: Steel MRF (moment resisting frame)
- 157: Steel Frame with URM infill
- 158: Steel Frame with Concrete Shear Wall
- 159: Steel Reinforced Concrete (SRC, encased steel)
- 160: Steel Long Span (trussed arches, column-free spaces >100 ft)
- 191: Mobile Homes / Manufactured Housing
- 192: Mobile Home (permanent foundation)
- 193: Mobile Home (tied down)
- 194: Mobile Home (not tied down)
- 201: Suspension Bridge
- 202: Truss Bridge
- 203: Major Bridge
- 221: Storage Tank
- 227: Underground Pipeline
- 228: At Grade Pipeline
- 231: Chimney
- 234: Tower (communication, lattice)
- 500: Solar, rooftop (unknown anchorage)
- 501: Solar, rooftop, anchored (flush mounted/anchored)
- 502: Solar, rooftop, ballasted (flat roof ballasted)
- 510: Solar ground mounted (tracker or fixed)
- 513: Solar ground mounted, fixed tilt
- 514: BESS (battery energy storage system)

Instructions:
1. Analyze both "bldgDesc" (Building Description) and "conDesc" (Construction / Exterior Wall Finish / Material Description).
2. Construction description ("conDesc") takes primary priority for structural framing and materials.
3. UNDERWRITING RULE FOR EXTERIOR WALL FINISH / WALL MATERIALS:
   - If Exterior Wall Finish is STONE (or stone facade, stone finish, stone wall, stone masonry, fieldstone) -> ALWAYS assign Construction Code 113 (Rubble Stone Masonry).
   - If Exterior Wall Finish is BRICK (or brick finish, exterior brick, brick wall, general brick/masonry) -> ALWAYS assign Construction Code 111 (Masonry).
4. ISO COMMERCIAL FIRE / CONSTRUCTION CLASS UNDERWRITING RULES:
   - ISO 1 (Frame) -> ALWAYS assign Construction Code 101 (Wood Frame Modern).
   - ISO 2 (Joisted Masonry) -> ALWAYS assign Construction Code 119 (Joisted Masonry).
   - ISO 3 (Noncombustible) -> ALWAYS assign Construction Code 152 (Light Metal / Non-Combustible).
   - ISO 4 (Masonry Noncombustible) -> ALWAYS assign Construction Code 111 (Masonry).
   - ISO 5 (Modified Fire Resistive) -> ALWAYS assign Construction Code 131 (Reinforced Concrete / MFR).
   - ISO 6 (Fire Resistive) -> ALWAYS assign Construction Code 131 (Reinforced Concrete / FR).
5. If existingCode was 100 (Unknown) or differed: provide the accurate code, category, and group.
6. Output ONLY a JSON array with one object per input line:
[{"lineNum": <int>, "conCode": "<string>", "category": "<string>", "group": "<string>"}]`;

    const userText = nonBlankRows.map(item => {
      const extraStr = (item.extraCols && item.extraCols.length > 0 && item.extraCols.some(Boolean)) ? ` | ExtraCols="${item.extraCols.join('; ')}"` : '';
      return `Line ${item.idx + 1}: ExistingCode="${item.existingCode}" | BuildingDesc="${item.bldgDesc}" | ConstructionDesc="${item.conDesc}"${extraStr}`;
    }).join('\n');

    const textOutput = await this.callGemini(systemPrompt, userText);
    const parsedArray = this._extractJSON(textOutput) || [];
    const resultsMap = new Map();
    parsedArray.forEach(item => {
      resultsMap.set(item.lineNum, {
        conCode: String(item.conCode || '100'),
        category: item.category || 'Unknown',
        group: item.group || 'Unknown construction'
      });
    });

    return rowsToProcess.map((row, i) => {
      const lineNum = i + 1;
      const aiItem = resultsMap.get(lineNum);
      const ex = row.existingCode;
      const extraCols = row.extraCols || [];
      const origParts = [row.existingCode, row.bldgDesc, row.conDesc, ...extraCols];

      if (aiItem) {
        let statusKey = 'assigned';
        let statusText = 'Assigned';
        if (ex) {
          if (ex === aiItem.conCode) {
            statusKey = 'match';
            statusText = `✓ Confirmed (${aiItem.conCode})`;
          } else if (ex === '100' && aiItem.conCode !== '100') {
            statusKey = 'upgraded';
            statusText = `✨ Resolved (100 ➔ ${aiItem.conCode})`;
          } else {
            statusKey = 'mismatch';
            statusText = `⚠️ Review (${ex} ➔ ${aiItem.conCode})`;
          }
        } else {
          statusKey = 'assigned';
          statusText = `✨ Assigned (${aiItem.conCode})`;
        }

        const cleanParts = [row.existingCode, row.bldgDesc, row.conDesc, ...extraCols, aiItem.conCode, aiItem.category].filter(Boolean);

        return {
          lineNum,
          original: origParts.join('\t').trim(),
          existingCode: row.existingCode,
          bldgDesc: row.bldgDesc,
          conDesc: row.conDesc,
          extraCols: extraCols,
          allCols: origParts,
          conCode: aiItem.conCode,
          category: aiItem.category,
          group: aiItem.group,
          status: statusKey,
          statusText: statusText,
          comparisonStatus: statusKey,
          comparisonMessage: statusText,
          cleaned: cleanParts.join('\t'),
          changed: true,
          aiEnhanced: true
        };
      }

      const local = (typeof window !== 'undefined' && window.ConstructionClassifier)
        ? window.ConstructionClassifier.classifyRow(row.existingCode, row.bldgDesc, row.conDesc, extraCols)
        : { existingCode: row.existingCode, bldgDesc: row.bldgDesc, conDesc: row.conDesc, conCode: '100', category: 'Unknown', group: 'Unknown construction', status: 'assigned', statusText: 'Assigned', comparisonStatus: 'assigned', comparisonMessage: 'Assigned' };

      const cleanParts = [local.existingCode, local.bldgDesc, local.conDesc, ...extraCols, local.conCode, local.category].filter(Boolean);

      return {
        lineNum,
        original: origParts.join('\t').trim(),
        existingCode: local.existingCode,
        bldgDesc: local.bldgDesc,
        conDesc: local.conDesc,
        extraCols: extraCols,
        allCols: origParts,
        conCode: local.conCode,
        category: local.category,
        group: local.group,
        status: local.status,
        statusText: local.statusText,
        comparisonStatus: local.status,
        comparisonMessage: local.statusText,
        cleaned: cleanParts.join('\t'),
        changed: true,
        aiEnhanced: false
      };
    });
  },

  /**
   * Use Gemini AI to classify exterior wall finish data into WallType and WallSiding
   */
  async cleanWallsWithAI(rawLines, options = {}) {
    if (!rawLines || rawLines.length === 0) return [];
    const validLines = rawLines.map((l, idx) => ({ lineNum: idx + 1, text: l })).filter(x => x.text.trim().length > 0);
    if (validLines.length === 0) return [];
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const systemPrompt = `You are CleanExcel Studio AI, an expert structural engineering and property cat modeling analyst specialized in Verisk Touchstone UNICEDE® Wall Detail Fields.
Your goal is to parse and classify each exterior wall input line into two Touchstone fields:
1. "wallTypeCode": The structural or backing wall material code (0 to 9)
2. "wallSidingCode": The weather protection, siding, or exterior cladding material code (0 to 8)

TOUCHSTONE UNICEDE WALL DETAIL SPECIFICATIONS:

Field 1: WallType (Codes 0 to 9):
- 0: Unknown/default
- 1: Brick/unreinforced masonry (URM, solid brick bearing)
- 2: Reinforced masonry (RM, CMU concrete block with rebar)
- 3: Plywood (wood frame sheathing, plywood, CDX)
- 4: Wood planks (wood boards, tongue-and-groove T&G)
- 5: Particle board/OSB (oriented strand board, waferboard)
- 6: Metal panels (light gauge steel panels, corrugated steel)
- 7: Pre-cast concrete elements (tilt-up, precast panels)
- 8: Cast-in-place concrete (poured concrete, reinforced concrete monolithic)
- 9: Gypsum board (exterior gypsum sheathing, DensGlass)

Field 2: WallSiding (Codes 0 to 8):
- 0: Unknown/default
- 1: Veneer brick/masonry (brick veneer, masonry veneer, face brick)
- 2: Wood shingles (wood shingles, cedar shakes)
- 3: Clapboards (wood clapboard, lap siding, bevel siding)
- 4: Aluminum/vinyl siding (vinyl siding, aluminum siding, PVC, metal siding)
- 5: Stone panels (natural stone, granite panels, limestone)
- 6: Exterior insulation finishing system (EIFS, synthetic stucco, Dryvit)
- 7: Stucco (traditional cement stucco / plaster)
- 8: Fiber cement board (HardiePlank, James Hardie, cementitious)

UNDERWRITING RULES:
1. With Percentages: If explicit percentages are provided (e.g. 70% Brick, 30% Vinyl), pick the material with the HIGHER percentage (Brick 1).
2. Without Percentages: If multiple materials are listed without percentages (e.g. Brick Veneer and Vinyl Siding), pick the WEAKER material (Vinyl Siding 4 is weaker than Brick Veneer 1).
3. Equal Percentages (50% / 50% Tie): If two materials have equal percentages, pick the WEAKER material (e.g. 50% Brick Veneer / 50% Vinyl Siding -> Vinyl Siding 4).

WEAKNESS RANKING (higher = weaker):
WallSiding: Vinyl (4) > Wood Shingles (2) > Clapboard (3) > EIFS (6) > Stucco (7) > Fiber Cement (8) > Stone Panels (5) > Brick Veneer (1)
WallType: Gypsum (9) > OSB (5) > Wood Planks (4) > Plywood (3) > Brick/URM (1) > Metal Panels (6) > Precast (7) > Reinforced Masonry (2) > Cast-in-place Concrete (8)

OUTPUT FORMAT:
Output ONLY a JSON array of objects:
[{"lineNum": <int>, "wallTypeCode": "<code 0-9>", "wallSidingCode": "<code 0-8>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSON(responseText) || [];

    const aiMap = new Map();
    aiItems.forEach(item => {
      if (item && item.lineNum) {
        aiMap.set(item.lineNum, item);
      }
    });

    const WallTaxonomy = window.WallTaxonomy || (window.WallClassifier && window.WallClassifier.taxonomy);
    const format = options.format || 'code_only';

    return rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      const local = window.WallClassifier ? window.WallClassifier.parseWallRow(line, options) : {};
      const aiItem = aiMap.get(lineNum);

      let wallTypeCode = local.wallTypeCode || '0';
      let wallSidingCode = local.wallSidingCode || '0';
      let aiEnhanced = false;

      if (aiItem) {
        if (aiItem.wallTypeCode !== undefined && aiItem.wallTypeCode !== null) {
          wallTypeCode = String(aiItem.wallTypeCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.wallSidingCode !== undefined && aiItem.wallSidingCode !== null) {
          wallSidingCode = String(aiItem.wallSidingCode).trim();
          aiEnhanced = true;
        }
      }

      const wallTypeObj = WallTaxonomy?.WALL_TYPE?.[wallTypeCode];
      const wallSidingObj = WallTaxonomy?.WALL_SIDING?.[wallSidingCode];

      let wallTypeDisplay = wallTypeCode;
      if (wallTypeObj) {
        if (format === 'name_only') wallTypeDisplay = wallTypeObj.name;
        else if (format === 'name_code') wallTypeDisplay = `${wallTypeObj.name} (${wallTypeObj.code})`;
        else if (format === 'short_code') wallTypeDisplay = `${wallTypeObj.shortName} (${wallTypeObj.code})`;
      }

      let wallSidingDisplay = wallSidingCode;
      if (wallSidingObj) {
        if (format === 'name_only') wallSidingDisplay = wallSidingObj.name;
        else if (format === 'name_code') wallSidingDisplay = `${wallSidingObj.name} (${wallSidingObj.code})`;
        else if (format === 'short_code') wallSidingDisplay = `${wallSidingObj.shortName} (${wallSidingObj.code})`;
      }

      const recCount = (wallTypeCode && wallTypeCode !== '0' ? 1 : 0) + (wallSidingCode && wallSidingCode !== '0' ? 1 : 0);

      return {
        lineNum,
        original: line,
        cleaned: `${wallTypeCode}\t${wallSidingCode}`,
        wallType: wallTypeDisplay,
        wallTypeCode: wallTypeCode,
        wallTypeName: wallTypeObj ? wallTypeObj.name : '',
        wallTypeShort: wallTypeObj ? wallTypeObj.shortName : '',
        wallSiding: wallSidingDisplay,
        wallSidingCode: wallSidingCode,
        wallSidingName: wallSidingObj ? wallSidingObj.name : '',
        wallSidingShort: wallSidingObj ? wallSidingObj.shortName : '',
        recognizedCount: recCount,
        status: recCount === 2 ? 'match' : (recCount > 0 ? 'assigned' : 'mismatch'),
        statusText: recCount === 2 ? '✓ Complete (Both Fields Identified)' : (recCount > 0 ? `Separated (${recCount}/2 Fields)` : '⚠️ Unrecognized Wall Format'),
        changed: true,
        aiEnhanced
      };
    }).filter(Boolean);
  },

  /**
   * Use Gemini AI to parse and classify roof descriptions into 4 Touchstone UNICEDE® Roof Detail Fields:
   * 1. Roof Geometry (0–10)
   * 2. Roof Pitch (0–3)
   * 3. Roof Covering (0–12)
   * 4. Roof Deck (0–8)
   * 5. Roof Anchorage (0–7)
   */
  async classifyRoofWithAI(rawLines, options = {}) {
    if (!rawLines || rawLines.length === 0) return [];
    const validLines = rawLines.map((l, idx) => ({ lineNum: idx + 1, text: l })).filter(x => x.text.trim().length > 0);
    if (validLines.length === 0) return [];
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const systemPrompt = `You are CleanExcel Studio AI, an expert structural engineering and catastrophe risk modeling analyst specialized in Verisk Touchstone UNICEDE® Roof Detail Fields.
Your goal is to parse and classify each roof input line into five Touchstone fields:
1. "geometryCode": Roof Geometry code (0 to 10)
2. "pitchCode": Roof Pitch code (0 to 3)
3. "coveringCode": Roof Covering code (0 to 12)
4. "deckCode": Roof Deck code (0 to 8)
5. "anchorageCode": Roof Anchorage code (0 to 7)

TOUCHSTONE UNICEDE ROOF DETAIL SPECIFICATIONS:

Field 1: Roof Geometry (Codes 0 to 10):
- 0: Unknown/default
- 1: Flat (flat, zero pitch, horizontal, low slope)
- 2: Gable end without bracing (unbraced gable, pitched gable, A-frame, gable end)
- 3: Hip (hipped, full hip, dutch hip)
- 4: Complex (multi-gable, cross-gable, irregular, combination, custom geometry, dome, turret)
- 5: Stepped (terraced, clerestory, sawtooth)
- 6: Shed (skillion, mono-pitch, single pitch, single slope, lean-to)
- 7: Mansard (french roof, curb roof)
- 8: Gable end with bracing (gable braced, reinforced gable, strapped gable)
- 9: Pyramid (pyramidal, pavilion roof)
- 10: Gambrel (barn roof, dutch roof)

Field 2: Roof Pitch (Codes 0 to 3):
- 0: Unknown/default
- 1: Low (less than 10° or <= 2:12 ratio, shallow pitch, nearly flat)
- 2: Medium (10° to 30° or 3:12 to 7:12 ratio, moderate pitch, standard pitch)
- 3: High (more than 30° or >= 8:12 ratio, steep pitch, high slope)

Field 3: Roof Covering (Codes 0 to 12):
- 0: Unknown/default
- 1: Asphalt shingles (composition, 3-tab, architectural, fiberglass, laminate)
- 2: Wooden shingles (wood shakes, cedar shingles/shakes)
- 3: Clay/concrete tiles (spanish tiles, barrel tiles, terra cotta, mission tiles, cement tiles, S-tile)
- 4: Light metal panels (corrugated metal/steel/iron, tin roof, R-panel, 5V crimp, light metal, steel roofing)
- 5: Slate (natural slate, Vermont slate)
- 6: Built-up roof with gravel (BUR with gravel, tar and gravel, asphalt and gravel, pea gravel)
- 7: Single-ply membrane (single-ply, single ply, 1-ply, EPDM, TPO, PVC, rubber membrane, adhered membrane, thermoplastic)
- 8: Standing seam metal roofs (standing seam metal/steel/aluminum, SSMR, architectural standing seam)
- 9: Built-up roof without gravel (smooth BUR, modified bitumen, mod-bit, SBS, APP, torch-down, roll roofing, cap sheet)
- 10: Single-ply membrane ballasted (ballasted single-ply, gravel ballasted EPDM/TPO/PVC)
- 11: Hurricane Wind-Rated Roof Coverings (Miami-Dade NOA, FM 1-90, FM 1-120, TAS 106, UL 580)
- 12: Photovoltaic (solar roof, solar shingles, rooftop solar panels, BIPV)

Field 4: Roof Deck (Codes 0 to 8):
- 0: Unknown/default
- 1: Plywood (CDX, wood sheathing, ply deck)
- 2: Wood planks (wooden planks, tongue-and-groove T&G, timber deck)
- 3: Particle board/OSB (oriented strand board, waferboard, aspenite, chipboard)
- 4: Metal deck with insulation board (steel deck with insulation, B-deck w/ polyiso/rigid board)
- 5: Metal deck with concrete (composite steel deck with concrete topping, LWC on metal deck)
- 6: Pre-cast concrete slabs (precast concrete, hollow-core slabs, precast planks, double tee)
- 7: Reinforced concrete slabs (cast-in-place concrete, CIP, poured concrete, monolithic concrete deck)
- 8: Light metal (bare metal deck, light gauge steel deck, uninsulated corrugated metal deck)

Field 5: Roof Anchorage (Codes 0 to 7):
- 0: Unknown/default
- 1: Hurricane Ties (hurricane straps, hurricane clips, seismic ties, uplift straps)
- 2: Nails/Screws (toe-nailing, nails, screws)
- 3: Anchor bolts (through bolts, expansion bolts, anchor bolted)
- 4: Gravity/friction (unanchored, dead load only, friction only)
- 5: Adhesive epoxy (chemical anchor, structural adhesive, epoxy)
- 6: Structurally Connected (monolithic concrete tie beam, welded, bond beam)
- 7: Clips (framing clips, metal clips, roof clips)

UNDERWRITING RULES:
1. With Percentages: If explicit percentages are provided (e.g. "SINGLE PLY MEMBRANE (50%); SHINGLES, ASPHALT (47%); STEEL (3%)"), pick the covering material with the HIGHER percentage (Single-ply 7 wins with 50%).
2. Without Percentages: If multiple materials are listed without percentages, pick the WEAKER material according to cat modeling vulnerability.
3. Explicit Codes: If the input contains a code in parentheses like "(7)" or "Code 7", verify and assign that code.

WEAKNESS RANKING (higher = weaker):
Covering: Wood Shingles (2) > Asphalt Shingles (1) > Clay/Concrete Tiles (3) > Slate (5) > Smooth BUR/Mod-Bit (9) > Ballasted Single-Ply (10) > Single-Ply Membrane (7) > BUR with Gravel (6) > Light Metal Panels (4) > Photovoltaic (12) > Standing Seam (8) > Hurricane Wind-Rated (11)
Geometry: Gable unbraced (2) > Gambrel (10) > Shed (6) > Flat (1) > Complex (4) > Stepped (5) > Mansard (7) > Gable braced (8) > Pyramid (9) > Hip (3)
Pitch: Low (1) > Medium (2) > High (3)
Deck: Light Metal (8) > OSB (3) > Wood Planks (2) > Plywood (1) > Metal Deck w/ Insulation (4) > Metal Deck w/ Concrete (5) > Pre-cast Concrete (6) > Reinforced Concrete (7)
Anchorage: Gravity/friction (4) > Nails/Screws (2) > Clips (7) > Hurricane Ties (1) > Anchor bolts (3) > Adhesive epoxy (5) > Structurally Connected (6)

OUTPUT FORMAT:
Output ONLY a JSON array of objects:
[{"lineNum": <int>, "geometryCode": "<0-10>", "pitchCode": "<0-3>", "coveringCode": "<0-12>", "deckCode": "<0-8>", "anchorageCode": "<0-7>"}]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSON(responseText) || [];

    const aiMap = new Map();
    if (Array.isArray(aiItems)) {
      aiItems.forEach(item => {
        if (item && item.lineNum) {
          aiMap.set(Number(item.lineNum), item);
        }
      });
    }

    const RoofTaxonomy = window.RoofTaxonomy || (window.RoofClassifier && window.RoofClassifier.taxonomy);
    const format = options.format || 'code_only';

    return rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      const local = window.RoofClassifier ? window.RoofClassifier.parseRoofRow(line, options) : {};
      const aiItem = aiMap.get(lineNum);

      let geomCode = local.geometryCode || '';
      let pitchCode = local.pitchCode || '';
      let covCode = local.coveringCode || '';
      let deckCode = local.deckCode || '';
      let anchorCode = local.anchorageCode || '';
      let aiEnhanced = false;

      if (aiItem) {
        if (aiItem.geometryCode !== undefined && aiItem.geometryCode !== null && aiItem.geometryCode !== '0') {
          geomCode = String(aiItem.geometryCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.pitchCode !== undefined && aiItem.pitchCode !== null && aiItem.pitchCode !== '0') {
          pitchCode = String(aiItem.pitchCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.coveringCode !== undefined && aiItem.coveringCode !== null && aiItem.coveringCode !== '0') {
          covCode = String(aiItem.coveringCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.deckCode !== undefined && aiItem.deckCode !== null && aiItem.deckCode !== '0') {
          deckCode = String(aiItem.deckCode).trim();
          aiEnhanced = true;
        }
        if (aiItem.anchorageCode !== undefined && aiItem.anchorageCode !== null && aiItem.anchorageCode !== '0') {
          anchorCode = String(aiItem.anchorageCode).trim();
          aiEnhanced = true;
        }
      }

      const geomObj = RoofTaxonomy?.GEOMETRY?.[geomCode];
      const pitchObj = RoofTaxonomy?.PITCH?.[pitchCode];
      const covObj = RoofTaxonomy?.COVERING?.[covCode];
      const deckObj = RoofTaxonomy?.DECK?.[deckCode];
      const anchorObj = RoofTaxonomy?.ANCHORAGE?.[anchorCode];

      let geomDisplay = geomCode;
      if (geomObj) {
        if (format === 'name_only') geomDisplay = geomObj.name;
        else if (format === 'name_code') geomDisplay = `${geomObj.name} (${geomObj.code})`;
        else if (format === 'short_code') geomDisplay = `${geomObj.shortName} (${geomObj.code})`;
      }

      let pitchDisplay = pitchCode;
      if (pitchObj) {
        if (format === 'name_only') pitchDisplay = pitchObj.name;
        else if (format === 'name_code') pitchDisplay = `${pitchObj.name} (${pitchObj.code})`;
        else if (format === 'short_code') pitchDisplay = `${pitchObj.shortName} (${pitchObj.code})`;
      }

      let covDisplay = covCode;
      if (covObj) {
        if (format === 'name_only') covDisplay = covObj.name;
        else if (format === 'name_code') covDisplay = `${covObj.name} (${covObj.code})`;
        else if (format === 'short_code') covDisplay = `${covObj.shortName} (${covObj.code})`;
      }

      let deckDisplay = deckCode;
      if (deckObj) {
        if (format === 'name_only') deckDisplay = deckObj.name;
        else if (format === 'name_code') deckDisplay = `${deckObj.name} (${deckObj.code})`;
        else if (format === 'short_code') deckDisplay = `${deckObj.shortName} (${deckObj.code})`;
      }

      let anchorDisplay = anchorCode;
      if (anchorObj) {
        if (format === 'name_only') anchorDisplay = anchorObj.name;
        else if (format === 'name_code') anchorDisplay = `${anchorObj.name} (${anchorObj.code})`;
        else if (format === 'short_code') anchorDisplay = `${anchorObj.shortName} (${anchorObj.code})`;
      }

      const recCount = (geomCode ? 1 : 0) + (pitchCode ? 1 : 0) + (covCode ? 1 : 0) + (deckCode ? 1 : 0) + (anchorCode ? 1 : 0);

      return {
        lineNum,
        original: line,
        cleaned: `${geomCode}\t${pitchCode}\t${covCode}\t${deckCode}\t${anchorCode}`,
        geometry: geomDisplay,
        geometryCode: geomCode,
        geometryName: geomObj ? geomObj.name : '',
        geometryShort: geomObj ? geomObj.shortName : '',
        pitch: pitchDisplay,
        pitchCode: pitchCode,
        pitchName: pitchObj ? pitchObj.name : '',
        pitchShort: pitchObj ? pitchObj.shortName : '',
        covering: covDisplay,
        coveringCode: covCode,
        coveringName: covObj ? covObj.name : '',
        coveringShort: covObj ? covObj.shortName : '',
        deck: deckDisplay,
        deckCode: deckCode,
        deckName: deckObj ? deckObj.name : '',
        deckShort: deckObj ? deckObj.shortName : '',
        anchorage: anchorDisplay,
        anchorageCode: anchorCode,
        anchorageName: anchorObj ? anchorObj.name : '',
        anchorageShort: anchorObj ? anchorObj.shortName : '',
        recognizedCount: recCount,
        status: recCount === 5 ? 'match' : (recCount > 0 ? 'assigned' : 'empty'),
        statusText: recCount === 5 ? '✓ Complete (All 5 Fields Identified)' : (recCount > 0 ? `Separated (${recCount}/5 Fields)` : 'Blank'),
        changed: true,
        aiEnhanced
      };
    }).filter(Boolean);
  },

  /**
   * Parse Year Built records with Gemini 2.5 Flash
   * Enforces 1753 <= Year <= Current Year and selects older/lesser year for multi-year entries
   */
  async parseYearWithAI(rawLines, options = {}) {
    if (!this.isConfigured()) throw new Error('Please configure a Gemini API key in Gemini AI Settings.');

    const minYear = typeof options.minYear === 'number' && !isNaN(options.minYear) ? options.minYear : 1753;
    const maxYear = typeof options.maxYear === 'number' && !isNaN(options.maxYear) ? options.maxYear : new Date().getFullYear();

    const validLines = rawLines.map((line, idx) => ({ lineNum: idx + 1, text: String(line || '').trim() })).filter(v => v.text.length > 0);
    if (validLines.length === 0) return [];

    const systemPrompt = `You are CleanExcel Studio AI, an expert insurance underwriting validator specializing in commercial and residential property Year Built fields.
Task: Extract and standardize the 4-digit Year Built for each record.

UNDERWRITING RULES:
1. Valid Range: Must be between ${minYear} and ${maxYear} inclusive. If a year is less than ${minYear} or greater than ${maxYear}, it is out-of-range and MUST be an empty string ("").
2. Multi-Year / Range Rule (CRITICAL): When multiple years or a range is present (e.g. "1995/2005", "2005/1995", "2005-1995", "Built 2005 / Ren 1995", "1995 & 2005", "2005/95"), ALWAYS select the LESSER / OLDER year (the original construction year, e.g. 1995).
3. If no valid year can be found, return empty string ("").

OUTPUT FORMAT:
Output ONLY a valid JSON array of objects:
[
  { "lineNum": <int: 1-based original line index>, "year": "<4-digit string or empty string>" }
]`;

    const userLinesText = validLines.map(v => `${v.lineNum}. ${v.text}`).join('\n');
    const responseText = await this.callGemini(systemPrompt, userLinesText);
    const aiItems = this._extractJSON(responseText) || [];

    const aiMap = new Map();
    aiItems.forEach(item => {
      if (item && item.lineNum !== undefined) {
        aiMap.set(item.lineNum, String(item.year || '').trim());
      }
    });

    const yearCleaner = (typeof window !== 'undefined' && window.YearBuiltCleaner)
      ? window.YearBuiltCleaner
      : (typeof YearBuiltCleaner !== 'undefined' ? YearBuiltCleaner : null);

    return rawLines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = String(line || '').trim();
      if (!trimmed && options.removeEmptyLines) return null;

      let cleaned = '';
      let aiEnhanced = false;

      if (aiMap.has(lineNum)) {
        const candidate = aiMap.get(lineNum);
        const y = parseInt(candidate, 10);
        if (!isNaN(y) && y >= minYear && y <= maxYear) {
          cleaned = String(y);
          aiEnhanced = true;
        }
      }

      if (!cleaned && yearCleaner) {
        cleaned = yearCleaner.cleanYear(line, options);
      }

      let status = 'cleaned';
      let statusText = 'Cleaned';

      if (!trimmed) {
        status = 'empty';
        statusText = 'Blank';
      } else if (trimmed === cleaned) {
        status = 'unchanged';
        statusText = '✓ Valid Year';
      } else if (!cleaned) {
        status = 'mismatch';
        statusText = `⚠️ Out of Range (<${minYear} or >${maxYear})`;
      } else {
        const hasMultiple = /\b\d{4}\b.*\b\d{4}\b/.test(line) || /[/\\-]/.test(line);
        status = 'assigned';
        statusText = hasMultiple ? `✨ Older Year Selected (${cleaned})` : `✨ Standardized (${cleaned})`;
      }

      return {
        lineNum,
        original: line,
        cleaned,
        year: cleaned,
        changed: trimmed !== cleaned,
        status,
        statusText,
        aiEnhanced
      };
    }).filter(Boolean);
  }
};

if (typeof window !== 'undefined') {
  window.GeminiService = GeminiService;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiService;
}

