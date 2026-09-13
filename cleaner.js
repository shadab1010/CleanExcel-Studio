/**
 * CleanExcel - Column Cleaning Engines
 * Modular cleaning rules for different Excel column types.
 * Compatible with both ES Modules and standard browser globals.
/**
 * Resolve Touchstone UNICEDE® Master Data (from data/touchstone_data.js)
 */
function _resolveTouchstoneData() {
  if (typeof TouchstoneData !== 'undefined') return TouchstoneData;
  if (typeof window !== 'undefined' && window.TouchstoneData) return window.TouchstoneData;
  if (typeof globalThis !== 'undefined' && globalThis.TouchstoneData) return globalThis.TouchstoneData;
  if (typeof require !== 'undefined') {
    try { return require('./data/touchstone_data.js'); } catch (e) {}
  }
  return null;
}

/**
 * parseExcelRows(text) — Excel-aware row splitter
 *
 * When you copy from Excel, cells that contain embedded newlines (Alt+Enter)
 * are wrapped in double-quotes in the clipboard TSV, e.g.:
 *   "3 - Hip roof\n7 - Braced gable roof"<TAB>next_col
 *
 * A naive split(/\r\n|\r|\n/) would break that one cell into two rows.
 * This function respects RFC-4180 quoting so embedded newlines inside
 * quoted cells do NOT produce extra rows.
 *
 * Returns an array of row strings (unquoted, with internal newlines preserved
 * as spaces so downstream parsers continue to work correctly).
 */
function parseExcelRows(text) {
  if (typeof text !== 'string') return [];
  const rows = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && i + 1 < len && text[i + 1] === '"') {
        // Escaped double-quote inside a quoted field: ""
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (!inQuotes && (ch === '\r' || ch === '\n')) {
      // Real row boundary
      if (ch === '\r' && i + 1 < len && text[i + 1] === '\n') {
        i++; // skip the \n of \r\n
      }
      rows.push(current);
      current = '';
      i++;
      continue;
    }

    if (inQuotes && (ch === '\r' || ch === '\n')) {
      // Embedded newline inside a quoted cell — treat as a space so the
      // entire cell text stays on one logical row and downstream classifiers
      // can still parse it as a single multi-description entry.
      if (ch === '\r' && i + 1 < len && text[i + 1] === '\n') {
        i++;
      }
      current += ' ';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  // Push the last unterminated row (if text didn't end with a newline)
  if (current) {
    rows.push(current);
  }

  return rows;
}


function escapeRegexClass(chars) {
  return chars.map(c => {
    if (c === '\\') return '\\\\';
    if (c === ']') return '\\]';
    if (c === '^') return '\\^';
    if (c === '-') return '\\-';
    return c;
  }).join('');
}

const StreetCleaner = {
  // Exact symbols string requested: ,./<>?;'\:"|[]{}=+-_()#$%^&*@!
  defaultSymbolsString: String.raw`,./<>?;'\:"|[]{}=+-_()#$%^&*@!`,

  get defaultSymbols() {
    return this.defaultSymbolsString.split('');
  },

  // Default words to strip: street, builfin (typo of building), building, unit, st, bldg
  defaultWords: ['street', 'builfin', 'building', 'unit', 'st', 'bldg'],

  /**
   * Common street type suffixes for address boundary detection
   */
  streetSuffixes: 'blvd|boulevard|road|rd|street|st|avenue|ave|drive|dr|lane|ln|way|court|ct|circle|cir|place|pl|parkway|pkwy|highway|hwy|trail|trl|terrace|ter',
  directionals: 'sw|nw|se|ne|n|s|e|w|north|south|east|west',

  /**
   * Cleans a single street address line according to specified options.
   * @param {string} raw - The raw street address line
   * @param {object} options - Configuration options
   * @returns {string} - The cleaned address
   */
  cleanAddress(raw, options = {}) {
    if (!raw || typeof raw !== 'string') return '';

    const opts = {
      preserveNumberHyphen: options.preserveNumberHyphen !== false, // default true
      extractPrimaryAddress: options.extractPrimaryAddress !== false, // default true
      stripBldgPrefix: options.stripBldgPrefix !== false, // default true
      wordsToRemove: options.wordsToRemove || this.defaultWords,
      symbolsToRemove: options.symbolsToRemove || this.defaultSymbols,
      casing: options.casing || 'uppercase', // 'uppercase' | 'titlecase' | 'original'
      collapseSpaces: options.collapseSpaces !== false, // default true
      ...options
    };

    let text = raw.trim();
    if (!text) return '';

    // Step 0A: Handle Building / Bldg Prefix at the beginning
    // e.g. "Bldg 1 - 1521 Greens Road" -> "521 Greens Road"
    // e.g. "Bldg 1 - 521 Greens Road"  -> "521 Greens Road"
    // e.g. "Building A - 123 Main St"   -> "123 Main St"
    if (opts.stripBldgPrefix) {
      const bldgPrefixMatch = text.match(/^(?:bldg|building)\s*([0-9a-zA-Z]+)?\s*[-–—:]\s*(.*)$/i);
      if (bldgPrefixMatch) {
        const bldgId = bldgPrefixMatch[1] || '';
        let rest = bldgPrefixMatch[2].trim();

        if (bldgId && /^\d+$/.test(bldgId)) {
          const duplicateBldgRegex = new RegExp(`^${bldgId}(\\d{2,}\\b.*)$`);
          if (duplicateBldgRegex.test(rest)) {
            rest = rest.replace(duplicateBldgRegex, '$1');
          }
        }
        text = rest;
      }
    }

    // Step 0B: Multi-Address / Secondary Street Splitting
    // e.g. "8901 Meadowbrook Blvd, 1401, 1405... Randol Crossing Lane." -> "8901 Meadowbrook Blvd"
    // e.g. "500 Malabar Road SW,Magnolia Cove Drive" -> "500 Malabar Road SW"
    if (opts.extractPrimaryAddress) {
      const multiAddrRegex = new RegExp(
        `^(\\s*\\d+[a-zA-Z0-9-]*\\s+[A-Za-z0-9\\s]+?\\b(?:${this.streetSuffixes})\\b(?:\\s+(?:${this.directionals}))?)\\s*[,;](.*)$`,
        'i'
      );
      const multiMatch = text.match(multiAddrRegex);
      if (multiMatch) {
        const primaryCandidate = multiMatch[1].trim();
        const secondaryCandidate = multiMatch[2].trim();

        const secondHasStreet = new RegExp(`\\b(?:${this.streetSuffixes})\\b`, 'i').test(secondaryCandidate);
        const secondHasMultiUnits = /\b\d+\s*,\s*\d+|\band\s+\d+/i.test(secondaryCandidate);

        if (secondHasStreet || secondHasMultiUnits) {
          text = primaryCandidate;
        }
      }
    }

    // Step 1: Protect number-to-number hyphens like "145-146" or alphanumeric ranges (e.g. 4-B, 102-104)
    const PROTECT_TOKEN = '\uE000';
    if (opts.preserveNumberHyphen) {
      text = text.replace(/(\b\d+[a-zA-Z]?)-([a-zA-Z0-9]+\b)/g, `$1${PROTECT_TOKEN}$2`);
    }

    // Step 2: Remove specified words (whole words, case-insensitive)
    if (opts.wordsToRemove && opts.wordsToRemove.length > 0) {
      const escapedWords = opts.wordsToRemove
        .filter(w => w && w.trim())
        .map(w => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      if (escapedWords.length > 0) {
        const wordRegex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
        text = text.replace(wordRegex, ' ');
      }
    }

    // Step 3: Remove specified special characters: ,./<>?;'\:"|[]{}=+-_()#$%^&*@!
    if (opts.symbolsToRemove && opts.symbolsToRemove.length > 0) {
      const escapedSymbols = escapeRegexClass(opts.symbolsToRemove);
      const symbolRegex = new RegExp(`[${escapedSymbols}]`, 'g');
      text = text.replace(symbolRegex, ' ');
    }

    // Step 4: Restore protected hyphens (e.g. 145-146)
    if (opts.preserveNumberHyphen) {
      text = text.replace(/\uE000/g, '-');
    }

    // Step 5: Collapse multiple spaces & trim
    if (opts.collapseSpaces) {
      text = text.replace(/\s+/g, ' ').trim();
    }

    // Step 6: Handle casing
    if (opts.casing === 'uppercase') {
      text = text.toUpperCase();
    } else if (opts.casing === 'titlecase') {
      text = text.toLowerCase().replace(/(^|\s|-|\/)([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
    }

    return text;
  },

  cleanColumn(input, options = {}) {
    let lines = [];
    if (Array.isArray(input)) {
      lines = input;
    } else if (typeof input === 'string') {
      lines = input.split(/\r\n|\r|\n/);
    }

    const removeEmpty = options.removeEmptyLines === true;
    const results = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (removeEmpty && !trimmed) return;

      const cleaned = this.cleanAddress(line, options);
      results.push({
        lineNum: index + 1,
        original: line,
        cleaned: cleaned,
        changed: line.trim() !== cleaned
      });
    });

    return results;
  }
};

/**
 * Address Splitter Engine - Universal International & US Address Parser
 * Supports: US (with County), UK, Germany, Canada, Australia, etc.
 */
const AddressSplitter = {
  COUNTRIES: {
    "UNITED KINGDOM": "United Kingdom", "UK": "United Kingdom", "GREAT BRITAIN": "United Kingdom",
    "ENGLAND": "United Kingdom", "SCOTLAND": "United Kingdom", "WALES": "United Kingdom", "GB": "United Kingdom",
    "GERMANY": "Germany", "DEUTSCHLAND": "Germany", "DE": "Germany",
    "CANADA": "Canada", "CA": "Canada",
    "UNITED STATES": "US", "USA": "US", "US": "US", "U.S.A.": "US", "U.S.": "US",
    "AUSTRALIA": "Australia", "AU": "Australia",
    "FRANCE": "France", "FR": "France",
    "ITALY": "Italy", "ITALIA": "Italy", "IT": "Italy",
    "SPAIN": "Spain", "ESPAÑA": "Spain", "ES": "Spain",
    "NETHERLANDS": "Netherlands", "HOLLAND": "Netherlands", "NL": "Netherlands"
  },

  CANADIAN_PROVINCES: {
    "AB": "AB", "BC": "BC", "MB": "MB", "NB": "NB", "NL": "NL", "NS": "NS", "NT": "NT", "NU": "NU",
    "ON": "ON", "PE": "PE", "QC": "QC", "SK": "SK", "YT": "YT",
    "ALBERTA": "AB", "BRITISH COLUMBIA": "BC", "MANITOBA": "MB", "NEW BRUNSWICK": "NB",
    "NEWFOUNDLAND": "NL", "NOVA SCOTIA": "NS", "ONTARIO": "ON", "PRINCE EDWARD ISLAND": "PE",
    "QUEBEC": "QC", "SASKATCHEWAN": "SK", "YUKON": "YT"
  },

  US_STATES: {
    "AL": "AL", "AK": "AK", "AZ": "AZ", "AR": "AR", "CA": "CA", "CO": "CO", "CT": "CT", "DE": "DE",
    "FL": "FL", "GA": "GA", "HI": "HI", "ID": "ID", "IL": "IL", "IN": "IN", "IA": "IA", "KS": "KS",
    "KY": "KY", "LA": "LA", "ME": "ME", "MD": "MD", "MA": "MA", "MI": "MI", "MN": "MN", "MS": "MS",
    "MO": "MO", "MT": "MT", "NE": "NE", "NV": "NV", "NH": "NH", "NJ": "NJ", "NM": "NM", "NY": "NY",
    "NC": "NC", "ND": "ND", "OH": "OH", "OK": "OK", "OR": "OR", "PA": "PA", "RI": "RI", "SC": "SC",
    "SD": "SD", "TN": "TN", "TX": "TX", "UT": "UT", "VT": "VT", "VA": "VA", "WA": "WA", "WV": "WV",
    "WI": "WI", "WY": "WY", "DC": "DC", "PR": "PR",
    // Full names
    "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR", "CALIFORNIA": "CA",
    "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE", "FLORIDA": "FL", "GEORGIA": "GA",
    "HAWAII": "HI", "IDAHO": "ID", "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
    "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD", "MASSACHUSETTS": "MA",
    "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS", "MISSOURI": "MO", "MONTANA": "MT",
    "NEBRASKA": "NE", "NEVADA": "NV", "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM",
    "NEW YORK": "NY", "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
    "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
    "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT", "VERMONT": "VT",
    "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV", "WISCONSIN": "WI", "WYOMING": "WY"
  },

  ISO2_MAP: {
    "UNITED STATES": "US", "USA": "US", "US": "US", "U.S.A.": "US", "U.S.": "US", "AMERICA": "US",
    "UNITED KINGDOM": "GB", "UK": "GB", "GREAT BRITAIN": "GB", "ENGLAND": "GB", "SCOTLAND": "GB", "WALES": "GB", "NORTHERN IRELAND": "GB", "GB": "GB",
    "GERMANY": "DE", "DEUTSCHLAND": "DE", "DE": "DE",
    "CANADA": "CA", "CA": "CA",
    "AUSTRALIA": "AU", "AU": "AU",
    "FRANCE": "FR", "FR": "FR",
    "ITALY": "IT", "ITALIA": "IT", "IT": "IT",
    "SPAIN": "ES", "ESPAÑA": "ES", "ES": "ES",
    "NETHERLANDS": "NL", "HOLLAND": "NL", "NL": "NL",
    "JAPAN": "JP", "JP": "JP",
    "INDIA": "IN", "IN": "IN",
    "CHINA": "CN", "CN": "CN",
    "BRAZIL": "BR", "BRASIL": "BR", "BR": "BR",
    "MEXICO": "MX", "MÉXICO": "MX", "MX": "MX",
    "SWITZERLAND": "CH", "CH": "CH",
    "AUSTRIA": "AT", "AT": "AT",
    "BELGIUM": "BE", "BE": "BE",
    "SWEDEN": "SE", "SE": "SE",
    "NORWAY": "NO", "NO": "NO",
    "DENMARK": "DK", "DK": "DK",
    "FINLAND": "FI", "FI": "FI",
    "IRELAND": "IE", "IE": "IE",
    "NEW ZEALAND": "NZ", "NZ": "NZ",
    "SINGAPORE": "SG", "SG": "SG",
    "SOUTH AFRICA": "ZA", "ZA": "ZA",
    "UNITED ARAB EMIRATES": "AE", "UAE": "AE", "AE": "AE"
  },

  FULLNAME_MAP: {
    "US": "United States", "USA": "United States", "UNITED STATES": "United States",
    "GB": "United Kingdom", "UK": "United Kingdom", "UNITED KINGDOM": "United Kingdom",
    "DE": "Germany", "GERMANY": "Germany",
    "CA": "Canada", "CANADA": "Canada",
    "AU": "Australia", "AUSTRALIA": "Australia",
    "FR": "France", "FRANCE": "France",
    "IT": "Italy", "ITALY": "Italy",
    "ES": "Spain", "SPAIN": "Spain",
    "NL": "Netherlands", "NETHERLANDS": "Netherlands",
    "JP": "Japan", "JAPAN": "Japan",
    "IN": "India", "INDIA": "India",
    "CN": "China", "CHINA": "China",
    "BR": "Brazil", "BRAZIL": "Brazil",
    "MX": "Mexico", "MEXICO": "Mexico"
  },

  formatCountry(countryStr, format = 'iso2') {
    if (!countryStr) return '';
    const upper = String(countryStr).trim().toUpperCase();
    if (format === 'fullname') {
      return this.FULLNAME_MAP[upper] || countryStr;
    }
    if (format === 'iso2-uk') {
      if (upper === 'GB' || upper === 'UK' || upper === 'UNITED KINGDOM' || upper === 'GREAT BRITAIN' || upper === 'ENGLAND' || upper === 'SCOTLAND' || upper === 'WALES') {
        return 'UK';
      }
    }
    if (this.ISO2_MAP[upper]) {
      return (format === 'iso2-uk' && this.ISO2_MAP[upper] === 'GB') ? 'UK' : this.ISO2_MAP[upper];
    }
    if (upper.length === 2) return upper;
    return countryStr;
  },

  // Regex patterns for international postal codes
  UK_POSTCODE_REGEX: /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i,
  CA_POSTCODE_REGEX: /\b([A-Z]\d[A-Z]\s*\d[A-Z]\d)\b/i,

  parseAddress(raw, options = {}) {
    let text = String(raw || '').trim();
    if (!text) return { street: '', city: '', state: '', county: '', postal: '', country: '' };

    const opts = {
      defaultCountry: options.defaultCountry !== undefined ? options.defaultCountry : 'US',
      countryFormat: options.countryFormat || 'iso2', // iso2 | iso2-uk | fullname
      casing: options.casing || 'titlecase', // titlecase | uppercase | original
      cleanStreetRules: options.cleanStreetRules !== false,
      ...options
    };

    let country = '';
    let postal = '';
    let state = '';
    let county = '';
    let city = '';
    let street = '';

    // 1. Detect Country at end if present
    const countryKeys = Object.keys(this.COUNTRIES).sort((a, b) => b.length - a.length);
    const countryRegex = new RegExp(`(?:,\\s*|\\s+)\\b(${countryKeys.join('|')})\\b\\.?$`, 'i');
    const cm = text.match(countryRegex);
    if (cm) {
      country = this.COUNTRIES[cm[1].toUpperCase()];
      text = text.slice(0, cm.index).trim();
    }

    // 2. Check for UK (Postcode like "SW1A 2AA" or explicit United Kingdom)
    if (country === 'United Kingdom' || this.UK_POSTCODE_REGEX.test(text)) {
      country = country || 'United Kingdom';
      const pm = text.match(this.UK_POSTCODE_REGEX);
      if (pm) {
        postal = pm[1].toUpperCase().replace(/\s+/g, ' ');
        text = text.replace(pm[0], '').replace(/,\s*,/g, ',').trim();
      }
      if (text.includes(',')) {
        const parts = text.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          county = parts[parts.length - 1];
          city = parts[parts.length - 2];
          street = parts.slice(0, parts.length - 2).join(', ');
        } else if (parts.length === 2) {
          city = parts[1];
          street = parts[0];
        } else {
          street = text;
        }
      } else {
        const words = text.split(/\s+/);
        if (words.length > 2) {
          city = words.pop();
          street = words.join(' ');
        } else {
          street = text;
        }
      }
      return this.formatResult(street, city, state, county, postal, country, opts);
    }

    // 3. Check for Canada (Postal code like "M5V 3X5" or explicit Canada)
    if (country === 'Canada' || this.CA_POSTCODE_REGEX.test(text)) {
      country = country || 'Canada';
      const pm = text.match(this.CA_POSTCODE_REGEX);
      if (pm) {
        postal = pm[1].toUpperCase().replace(/\s+/g, ' ');
        text = text.replace(pm[0], '').trim();
      }
      const provKeys = Object.keys(this.CANADIAN_PROVINCES).sort((a, b) => b.length - a.length);
      const provRegex = new RegExp(`(?:,\\s*|\\s+)\\b(${provKeys.join('|')})\\b\\.?$`, 'i');
      const prm = text.match(provRegex);
      if (prm) {
        state = this.CANADIAN_PROVINCES[prm[1].toUpperCase()];
        text = text.slice(0, prm.index).trim();
      }
      if (text.includes(',')) {
        const parts = text.split(',').map(p => p.trim()).filter(Boolean);
        city = parts.pop();
        street = parts.join(', ');
      } else {
        const words = text.split(/\s+/);
        city = words.pop();
        street = words.join(' ');
      }
      return this.formatResult(street, city, state, county, postal, country, opts);
    }

    // 4. Check for Germany (e.g. "Friedrichstraße 43, 10117 Berlin, Germany")
    if (country === 'Germany') {
      const plzMatch = text.match(/\b(\d{5})\b/);
      if (plzMatch) {
        postal = plzMatch[1];
        text = text.replace(plzMatch[0], '').replace(/,\s*,/g, ',').trim();
      }
      if (text.includes(',')) {
        const parts = text.split(',').map(p => p.trim()).filter(Boolean);
        street = parts[0];
        city = parts.slice(1).join(' ').trim();
      } else {
        const words = text.split(/\s+/);
        city = words.pop();
        street = words.join(' ');
      }
      return this.formatResult(street, city, state, county, postal, country, opts);
    }

    // 5. Default / United States (US)
    country = country || opts.defaultCountry || 'US';

    if (text.includes(',')) {
      const parts = text.split(',').map(p => p.trim()).filter(Boolean);

      // Find State index (e.g. "TN", "AK")
      let stateIdx = -1;
      for (let i = parts.length - 1; i >= 0; i--) {
        const upper = parts[i].toUpperCase();
        if (this.US_STATES[upper] && upper.length === 2) {
          state = this.US_STATES[upper];
          stateIdx = i;
          break;
        }
        const glued = upper.match(/^([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/);
        if (glued && this.US_STATES[glued[1]]) {
          state = this.US_STATES[glued[1]];
          postal = glued[2];
          stateIdx = i;
          break;
        }
      }

      // Find Postal
      if (!postal) {
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i].trim();
          const hasStreetWord = new RegExp(`\\b(?:${StreetCleaner.streetSuffixes})\\b`, 'i').test(p);
          if (!hasStreetWord) {
            const m = p.match(/^\s*(\d{5}(?:-\d{4})?)\s*$/) || p.match(/\b(\d{5}(?:-\d{4})?)\s*$/);
            if (m) {
              postal = m[1];
              break;
            }
          }
        }
      }

      if (stateIdx !== -1) {
        // City is immediately before state
        if (stateIdx > 0) {
          city = parts[stateIdx - 1];
        }
        // Street is everything before city
        if (stateIdx > 1) {
          street = parts.slice(0, stateIdx - 1).join(', ');
        }
        // County is between state and postal (e.g. "DAVIDSON" in "...,TN,DAVIDSON,37212")
        if (parts.length > stateIdx + 1) {
          const candidateCounty = parts[stateIdx + 1];
          if (!candidateCounty.match(/^\d{5}/)) {
            county = candidateCounty;
          }
        }
      } else {
        street = text;
      }
    } else {
      // Space-separated US address: e.g. "1908 Grand Avenue Nashville TN37212"
      const gluedMatch = text.match(/(?:,\s*|\s+)\b([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)\b\.?$/i);
      if (gluedMatch && this.US_STATES[gluedMatch[1].toUpperCase()]) {
        state = this.US_STATES[gluedMatch[1].toUpperCase()];
        postal = gluedMatch[2];
        text = text.slice(0, gluedMatch.index).trim();
      } else {
        const zipMatch = text.match(/(?:,\s*|\s+)\b(\d{5}(?:-\d{4})?)\b\.?$/);
        if (zipMatch) {
          postal = zipMatch[1];
          text = text.slice(0, zipMatch.index).trim();
          const stateKeys = Object.keys(this.US_STATES).filter(k => k.length === 2);
          const stateRegex = new RegExp(`(?:,\\s*|\\s+)\\b(${stateKeys.join('|')})\\b\\.?$`, 'i');
          const stateMatch = text.match(stateRegex);
          if (stateMatch) {
            state = this.US_STATES[stateMatch[1].toUpperCase()];
            text = text.slice(0, stateMatch.index).trim();
          }
        }
      }

      if (state) {
        const suffixes = StreetCleaner.streetSuffixes;
        const dirs = StreetCleaner.directionals;
        const streetRegex = new RegExp(`^(.*?\\b(?:${suffixes})\\b(?:\\s+(?:${dirs}))?(?:\\s+(?:apt|unit|suite|ste|#)\\s*[^\\s]+)?)(?:\\s+(.*))?$`, 'i');
        const m = text.match(streetRegex);
        if (m && m[2]) {
          street = m[1].trim();
          city = m[2].trim();
        } else {
          const words = text.split(/\s+/);
          if (words.length > 1) {
            city = words.pop();
            street = words.join(' ');
          } else {
            street = text;
          }
        }
      } else {
        street = text;
      }
    }

    return this.formatResult(street, city, state, county, postal, country, opts);
  },

  formatResult(street, city, state, county, postal, country, opts) {
    if (street && opts.cleanStreetRules) {
      street = street.replace(/^(?:unit\s*#?\d+[a-zA-Z]?|no\s*\d+\s*bldg|bldg\s*#?\d+[a-zA-Z]?)[, -]+/i, '');
      street = street.replace(/,\s*[a-zA-Z0-9]+\s+(?:bldg|building)\.?/gi, '');
      street = street.replace(/['"]+/g, '');
      street = street.replace(/\s*#\s*$/g, '');
      street = street.replace(/\s+/g, ' ').trim();
    }

    const formatCase = (str) => {
      if (!str) return '';
      if (opts.casing === 'uppercase') return str.toUpperCase();
      if (opts.casing === 'titlecase' || !opts.casing) {
        let titled = str.toLowerCase().replace(/(^|\s|-|\/)([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
        titled = titled.replace(/\b(sw|nw|se|ne)\b/gi, m => m.toUpperCase());
        return titled;
      }
      return str;
    };

    let finalCountry = country;
    if (finalCountry) {
      finalCountry = this.formatCountry(finalCountry, opts.countryFormat || 'iso2');
    }

    return {
      street: formatCase(street),
      city: formatCase(city),
      state: state ? state.toUpperCase() : '',
      county: formatCase(county),
      postal: postal,
      country: finalCountry
    };
  },

  cleanColumn(input, options = {}) {
    let lines = [];
    if (Array.isArray(input)) {
      lines = input;
    } else if (typeof input === 'string') {
      lines = input.split(/\r\n|\r|\n/);
    }

    const removeEmpty = options.removeEmptyLines === true;
    const results = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (removeEmpty && !trimmed) return;

      const parsed = this.parseAddress(line, options);
      results.push({
        lineNum: index + 1,
        original: line,
        cleaned: `${parsed.street} \t ${parsed.city} \t ${parsed.state} \t ${parsed.county} \t ${parsed.postal}${parsed.country ? ' \t ' + parsed.country : ''}`,
        street: parsed.street,
        city: parsed.city,
        state: parsed.state,
        county: parsed.county,
        postal: parsed.postal,
        country: parsed.country,
        changed: true
      });
    });

    return results;
  }
};

/**
 * Touchstone / UNICEDE® Occupancy Class Code Classifier Engine
 * Maps commercial and residential occupancy and building descriptions to official insurance codes (300-384, 400+, etc.)
 */
const OccupancyClassifier = {
  get CODES() {
    const td = _resolveTouchstoneData();
    return (td && td.OCCUPANCY) || {};
  },

  RULES: [
    // Restaurants
    { code: "331", patterns: [/restaurant/i, /diner/i, /\bcafe\b/i, /fast food/i, /bistro/i, /bar (?:and|&) grill/i, /pizzeria/i, /drive-thru/i, /bakery/i, /coffee shop/i, /\bpub\b/i, /\btavern\b/i, /buffet/i] },
    // Automotive
    { code: "336", patterns: [/auto(?:motive)? repair/i, /car wash/i, /oil change/i, /tire shop/i, /body shop/i, /mechanic/i, /service bay/i, /auto body/i, /collision repair/i, /dealership service/i] },
    // Churches & Religious & Ministries & Rectories
    { code: "342", patterns: [/church/i, /sanctuary/i, /chapel/i, /synagogue/i, /mosque/i, /temple/i, /religious/i, /cathedral/i, /house of worship/i, /parish/i, /ministry/i, /rectory/i, /diocese/i, /monastery/i, /seminary/i, /basilica/i, /pastoral/i, /crossings/i] },
    // Education & Schools
    { code: "346", patterns: [/school/i, /elementary/i, /middle school/i, /high school/i, /college/i, /university/i, /academy/i, /daycare/i, /pre-school/i, /kindergarten/i, /campus/i, /mullen academy/i] },
    // Group Institutional Housing: Nursing homes, Assisted Living, Extended Care, Dorms
    { code: "305", patterns: [/nursing home/i, /nurs(?:ing)? ctr/i, /nursing care/i, /convalescent/i, /extended care/i, /assisted living/i, /independent living/i, /senior living/i, /retirement home/i, /group home/i, /dormitory/i, /\bdorm\b/i, /residence hall/i, /motherhouse/i, /mother house/i, /convent/i, /rest home/i, /elderly care/i] },
    // Healthcare / Medical
    { code: "316", patterns: [/hospital/i, /clinic/i, /medical/i, /healthcare/i, /health care/i, /doctor/i, /dental/i, /urgent care/i, /dialysis/i, /physician/i, /surgery center/i] },
    // Hotels / Lodging
    { code: "304", patterns: [/hotel/i, /motel/i, /\binn\b/i, /lodging/i, /resort/i, /bed (?:and|&) breakfast/i, /\bhostel\b/i] },
    // Apartments / Condos
    { code: "306", patterns: [/apartment/i, /condo(?:minium)?/i, /apt building/i, /apartments/i, /multi-unit residential/i, /condo units/i] },
    // Townhouses
    { code: "307", patterns: [/townhouse/i, /townhome/i, /terraced/i, /row house/i] },
    // Multi-Family
    { code: "303", patterns: [/multi-family/i, /multi family/i, /duplex/i, /triplex/i, /fourplex/i, /quadplex/i, /2-4 family/i] },
    // Single Family
    { code: "302", patterns: [/single family/i, /\bsfd\b/i, /single-family/i, /single family dwelling/i, /\bhouse\b/i, /\bdwelling\b/i, /single detached/i, /residence/i, /family home/i] },
    // Warehouses
    { code: "313", patterns: [/warehouse/i, /wholesale/i, /distribution center/i, /storage facility/i, /self[- ]storage/i, /mini[- ]storage/i, /logistics center/i, /freight storage/i] },
    // Retail
    { code: "312", patterns: [/retail/i, /store/i, /\bshop\b/i, /shopping center/i, /strip mall/i, /supermarket/i, /\bmall\b/i, /grocery/i, /department store/i, /boutique/i, /plaza/i] },
    // Professional Offices
    { code: "315", patterns: [/office/i, /\bbank\b/i, /financial/i, /professional/i, /corporate/i, /law firm/i, /accounting/i, /insurance agency/i, /consulting/i, /admin office/i] },
    // Entertainment
    { code: "317", patterns: [/theater/i, /theatre/i, /cinema/i, /gymnasium/i, /\bgym\b/i, /fitness/i, /bowling/i, /arena/i, /stadium/i, /amusement/i, /arcade/i, /skating rink/i] },
    // Parking
    { code: "318", patterns: [/parking garage/i, /parking structure/i, /parking deck/i, /parking ramp/i] },
    // Golf
    { code: "319", patterns: [/golf course/i, /clubhouse/i, /country club/i] },
    // High Tech
    { code: "327", patterns: [/data center/i, /datacenter/i, /server farm/i, /semiconductor/i, /cleanroom/i, /high tech/i] },
    // Food Processing
    { code: "324", patterns: [/food processing/i, /drug processing/i, /pharmaceutical manufacturing/i, /bottling plant/i, /brewery/i, /winery/i, /distillery/i, /meat packing/i] },
    // Chemical
    { code: "325", patterns: [/chemical processing/i, /chemical plant/i, /refinery/i, /plastics manufacturing/i] },
    // Heavy Industrial
    { code: "322", patterns: [/heavy fabrication/i, /heavy industrial/i, /foundry/i, /steel mill/i, /heavy manufacturing/i] },
    // Light Industrial
    { code: "323", patterns: [/light fabrication/i, /light manufacturing/i, /assembly plant/i, /machine shop/i, /light industrial/i] },
    // Emergency
    { code: "344", patterns: [/fire station/i, /police station/i, /emergency services/i, /ambulance/i, /paramedic/i] },
    // Government
    { code: "343", patterns: [/government/i, /city hall/i, /courthouse/i, /municipal/i, /post office/i, /civic center/i] },
    // Transport
    { code: "353", patterns: [/airport/i, /air terminal/i, /aviation/i] },
    { code: "354", patterns: [/port\b/i, /marine terminal/i, /dock/i, /harbor/i, /wharf/i] },
    { code: "355", patterns: [/hangar/i, /aircraft hangar/i] },
    { code: "352", patterns: [/railroad/i, /railway/i, /train station/i, /rail depot/i] },
    // Utilities
    { code: "364", patterns: [/power plant/i, /generating station/i, /substation/i, /electric utility/i] },
    { code: "362", patterns: [/water treatment/i, /water plant/i, /water reservoir/i] },
    { code: "365", patterns: [/telecom/i, /cell tower/i, /broadcast/i, /antenna site/i] },
    // Solar
    { code: "3001", patterns: [/solar farm/i, /solar array/i, /photovoltaic/i, /solar park/i] }
  ],

  matchTextToCode(text) {
    if (!text) return null;
    for (let i = 0; i < this.RULES.length; i++) {
      const r = this.RULES[i];
      for (let j = 0; j < r.patterns.length; j++) {
        if (r.patterns[j].test(text)) {
          return r.code;
        }
      }
    }
    return null;
  },

  /**
   * Parses row splitting by tab (Excel multi-column paste) or comma
   * Supports:
   * 3 columns: [Existing OccupancyCode, Building Description, Occupancy Description]
   * 2 columns: [Building Description, Occupancy Description]
   * 1 column:  [Occupancy / Building Description]
   */
  parseRow(rawLine) {
    const text = String(rawLine || '').trim();
    if (text.includes('\t')) {
      const parts = text.split('\t').map(p => p.trim());
      if (parts.length >= 3) {
        // If parts[0] is numeric/code (e.g. 305, 346, or empty string), then it's Existing Code
        if (/^\d{0,4}$/.test(parts[0])) {
          return {
            existingCode: parts[0],
            bldgDesc: parts[1] || '',
            occDesc: parts.slice(2).join(' ') || ''
          };
        }
        // Otherwise treat as bldgDesc, occDesc, extra
        return {
          existingCode: '',
          bldgDesc: parts[0] || '',
          occDesc: parts.slice(1).join(' ') || ''
        };
      } else if (parts.length === 2) {
        if (/^\d{3,4}$/.test(parts[0])) {
          return {
            existingCode: parts[0],
            bldgDesc: parts[1] || '',
            occDesc: ''
          };
        }
        return {
          existingCode: '',
          bldgDesc: parts[0] || '',
          occDesc: parts[1] || ''
        };
      }
    }

    if (text.includes(',')) {
      const parts = text.split(',').map(p => p.trim());
      if (parts.length >= 3 && /^\d{0,4}$/.test(parts[0])) {
        return {
          existingCode: parts[0],
          bldgDesc: parts[1] || '',
          occDesc: parts.slice(2).join(', ') || ''
        };
      }
      return {
        existingCode: '',
        bldgDesc: parts[0] || '',
        occDesc: parts.slice(1).join(', ') || ''
      };
    }

    return { existingCode: '', bldgDesc: '', occDesc: text };
  },

  /**
   * Compares 3 data fields and classifies into Touchstone UNICEDE Occupancy Code
   */
  classifyRow(existingCode, bldgDesc, occDesc) {
    const ex = String(existingCode || '').trim();
    const bldg = String(bldgDesc || '').trim();
    const occ = String(occDesc || '').trim();

    // If occDesc has multiple components separated by semicolon (e.g. "NURSING HOME (97%); CHURCH (2%)"),
    // the dominant/primary occupancy is the first part!
    let primaryOcc = occ;
    if (occ.includes(';')) {
      primaryOcc = occ.split(';')[0].trim();
    }

    // Check primary component first: building description or primary occupancy description
    let matchedCode = this.matchTextToCode(bldg);
    if (!matchedCode || matchedCode === '300') {
      matchedCode = this.matchTextToCode(primaryOcc);
    }
    if (!matchedCode || matchedCode === '300') {
      matchedCode = this.matchTextToCode(`${bldg} ${occ}`.trim());
    }

    // Fallback: If nothing matched but an existing code was present and valid in Touchstone schema
    if ((!matchedCode || matchedCode === '300') && ex && this.CODES[ex] && ex !== '300') {
      matchedCode = ex;
    }

    matchedCode = matchedCode || '300';
    const info = this.CODES[matchedCode] || { code: matchedCode, category: 'Unknown occupancy' };

    // Determine comparison status with existing code
    let statusKey = 'assigned';
    let statusText = 'Assigned';

    if (ex) {
      if (ex === matchedCode) {
        statusKey = 'match';
        statusText = `✓ Confirmed (${matchedCode})`;
      } else if (ex === '300' && matchedCode !== '300') {
        statusKey = 'upgraded';
        statusText = `✨ Resolved (300 ➔ ${matchedCode})`;
      } else {
        statusKey = 'mismatch';
        statusText = `⚠️ Review (${ex} ➔ ${matchedCode})`;
      }
    } else {
      statusKey = 'assigned';
      statusText = `✨ Assigned (${matchedCode})`;
    }

    return {
      existingCode: ex,
      bldgDesc: bldg,
      occDesc: occ,
      occCode: info.code,
      category: info.category,
      status: statusKey,
      statusText: statusText,
      comparisonStatus: statusKey,
      comparisonMessage: statusText
    };
  },

  /**
   * Classifies a row string into UNICEDE Touchstone Occupancy Class Code
   */
  classify(rawLine) {
    const row = this.parseRow(rawLine);
    return this.classifyRow(row.existingCode, row.bldgDesc, row.occDesc);
  },

  /**
   * Clean/Classify multiple lines
   * Supports:
   * 1. Multi-line string or array of strings
   * 2. Object with 3 column arrays: { existingCodes: [...], bldgDescs: [...], occDescs: [...] }
   */
  cleanColumn(input, options = {}) {
    const results = [];

    if (input && typeof input === 'object' && !Array.isArray(input) && (input.bldgDescs || input.occDescs)) {
      const codes = input.existingCodes || [];
      const bldgs = input.bldgDescs || [];
      const occs = input.occDescs || [];
      const maxLen = Math.max(codes.length, bldgs.length, occs.length);

      for (let i = 0; i < maxLen; i++) {
        const ex = (codes[i] || '').trim();
        const bldg = (bldgs[i] || '').trim();
        const occ = (occs[i] || '').trim();
        if (!ex && !bldg && !occ && options.removeEmptyLines) continue;

        const res = this.classifyRow(ex, bldg, occ);
        results.push({
          lineNum: i + 1,
          original: `${ex}\t${bldg}\t${occ}`.trim(),
          existingCode: res.existingCode,
          bldgDesc: res.bldgDesc,
          occDesc: res.occDesc,
          occCode: res.occCode,
          category: res.category,
          status: res.status,
          statusText: res.statusText,
          comparisonStatus: res.status,
          comparisonMessage: res.statusText,
          cleaned: `${res.existingCode ? res.existingCode + '\t' : ''}${res.bldgDesc}\t${res.occDesc}\t${res.occCode}\t${res.category}`,
          changed: true
        });
      }
      return results;
    }

    const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      const res = this.classify(trimmed);
      results.push({
        lineNum: idx + 1,
        original: line,
        existingCode: res.existingCode,
        bldgDesc: res.bldgDesc,
        occDesc: res.occDesc,
        occCode: res.occCode,
        category: res.category,
        status: res.status,
        statusText: res.statusText,
        comparisonStatus: res.status,
        comparisonMessage: res.statusText,
        cleaned: `${res.existingCode ? res.existingCode + '\t' : ''}${res.bldgDesc}\t${res.occDesc}\t${res.occCode}\t${res.category}`,
        changed: true
      });
    });

    return results;
  }
};

/**
 * Touchstone / UNICEDE® Construction Class Code Classifier Engine
 * Full reference mapping from Verisk Touchstone Exposure Data Validation Reference
 * https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_con-class-desc.html
 */
const ConstructionClassifier = {
  get CODES() {
    const td = _resolveTouchstoneData();
    return (td && td.CONSTRUCTION) || {};
  },

  RULES: [
    // 1. Joisted Masonry (119) - exterior masonry walls with wood floor/roof joists (ISO Class 2)
    { code: "119", patterns: [/joisted\s+masonry/i, /\bjm\b/i, /masonry\s+joist(?:ed)?/i, /brick\s+joisted/i, /masonry.*wood\s+roof/i, /masonry.*wood\s+joist/i, /masonry.*wood\s+deck/i, /block\s+joisted/i, /masonry.*joist/i, /\biso\s*(?:class\s*)?2\b/i] },

    // 2. Unreinforced Masonry (114) - URM, unreinforced brick, bearing wall
    { code: "114", patterns: [/unreinforced\s+masonry/i, /\burm\b/i, /unreinforced\s+brick/i, /unreinforced\s+stone/i, /plain\s+brick/i, /unreinforced.*bearing/i] },

    // 3. Reinforced Masonry (116, 117, 118) - explicitly reinforced masonry
    { code: "117", patterns: [/reinforced\s+masonry.*shear.*mrf/i] },
    { code: "118", patterns: [/reinforced\s+masonry.*shear/i, /rm\s+shear\s+wall/i] },
    { code: "116", patterns: [/reinforced\s+masonry/i, /\brm\b/i, /reinforced\s+brick/i, /reinforced\s+concrete\s+block/i, /reinforced\s+cmu/i, /cmu\s+reinforced/i] },

    // 4. Adobe & Rubble stone (112, 113) - Underwriting Rule: STONE in exterior wall finish/construction -> 113
    { code: "112", patterns: [/\badobe\b/i, /adobe\s+block/i, /adobe\s+brick/i, /clay\s+blocks/i] },
    { code: "113", patterns: [/\bstone\b/i, /rubble\s+stone/i, /stone\s+masonry/i, /stone\s+finish/i, /stone\s+exterior/i, /stone\s+facade/i, /stone\s+wall/i, /fieldstone/i, /coursed\s+rubble/i, /uncoursed\s+rubble/i] },

    // 5. Masonry Non-Combustible, Noncombustible & General Masonry (111) - Underwriting Rule: BRICK in exterior wall finish/construction -> 111
    { code: "111", patterns: [/masonry\s+non[- ]?combust[ia]ble/i, /\bnon[- ]?combust[ia]ble\b/i, /\bnoncombust[ia]ble\b/i, /\bmnc\b/i, /non[- ]?combust[ia]ble\s+masonry/i, /masonry\s+nc\b/i, /\biso\s*(?:class\s*)?4\b/i, /\bmasonry\b/i, /\bbrick\b/i, /exterior\s+brick/i, /brick\s+finish/i, /brick\s+exterior/i, /brick\s+facade/i, /brick\s+wall/i, /concrete\s+block/i, /\bcmu\b/i, /hollow\s+block/i] },

    // 6. Tilt-Up Concrete (136)
    { code: "136", patterns: [/tilt[- ]?up/i, /tilt[- ]?up\s+concrete/i, /concrete\s+tilt[- ]?up/i, /precast\s+tilt[- ]?up/i, /tilted\s+wall/i] },

    // 7. Pre-cast Concrete (137, 138)
    { code: "138", patterns: [/pre[- ]?cast.*shear\s+wall/i] },
    { code: "137", patterns: [/pre[- ]?cast/i, /precast\s+concrete/i, /precast\s+frame/i, /precast\s+panels/i] },

    // 8. Ductile & Non-Ductile Concrete MRF (134, 135, 139)
    { code: "134", patterns: [/ductile.*concrete/i, /ductile.*moment\s+frame/i, /concrete.*ductile.*frame/i, /concrete\s+mrf\s+ductile/i, /ductile\s+concrete\s+mrf/i, /ductile\s+concrete\s+frame/i, /reinforced\s+concrete\s+mrf\s*-\s*ductile/i, /poured\s+concrete\s+mrf/i] },
    { code: "135", patterns: [/non[- ]?ductile.*concrete/i, /concrete\s+mrf\s+non[- ]?ductile/i, /reinforced\s+concrete\s+mrf\s*-\s*non[- ]?ductile/i] },
    { code: "139", patterns: [/concrete\s+mrf/i, /reinforced\s+concrete\s+mrf/i, /concrete\s+moment\s+frame/i, /concrete\s+moment\s+resisting\s+frame/i] },

    // 9. Concrete Shear Wall (132, 133)
    { code: "132", patterns: [/concrete\s+shear\s+wall.*mrf/i, /rc\s+shear\s+wall.*mrf/i] },
    { code: "133", patterns: [/concrete\s+shear\s+wall/i, /rc\s+shear\s+wall/i, /concrete\s+box/i] },

    // 10. General Reinforced Concrete (131) - includes ISO Class 5 & 6 Modified Fire Resistive / Fire Resistive
    { code: "131", patterns: [/reinforced\s+concrete/i, /\brc\b/i, /poured\s+concrete/i, /cast[- ]in[- ]place\s+concrete/i, /concrete\s+frame/i, /concrete\s+structure/i, /\bconcrete\b/i, /modified\s+fire\s+resistive/i, /fire\s+resistive/i, /\bmfr\b/i, /\bfr\b/i, /\biso\s*(?:class\s*)?[56]\b/i] },

    // 11. Light Metal / Pre-engineered Steel (152) - ISO Class 3
    { code: "152", patterns: [/light\s+metal/i, /pre[- ]?engineered\s+metal/i, /pre[- ]?engineered\s+steel/i, /\bpemb\b/i, /steel\s+siding/i, /corrugated\s+metal/i, /metal\s+building/i, /steel\s+shed/i, /metal\s+clad/i, /sheet\s+metal/i, /corrugated\s+iron/i, /\biso\s*(?:class\s*)?3\b/i] },

    // 12. Braced Steel Frame (153)
    { code: "153", patterns: [/braced\s+steel/i, /steel\s+braced/i, /diagonal\s+steel/i, /braced\s+frame\s+steel/i] },

    // 13. Steel Frame with Shear Wall or URM (157, 158, 159)
    { code: "158", patterns: [/steel\s+frame.*concrete\s+shear/i, /steel.*shear\s+wall/i] },
    { code: "157", patterns: [/steel.*urm/i, /steel.*unreinforced\s+masonry/i] },
    { code: "159", patterns: [/steel\s+reinforced\s+concrete/i, /\bsrc\b/i, /encased\s+structural\s+steel/i] },

    // 14. Steel MRF (154, 155, 156)
    { code: "154", patterns: [/steel\s+mrf\s+perimeter/i, /perimeter\s+steel\s+mrf/i] },
    { code: "155", patterns: [/steel\s+mrf\s+distributed/i, /distributed\s+steel\s+mrf/i] },
    { code: "156", patterns: [/steel\s+mrf/i, /steel\s+moment\s+frame/i, /steel\s+moment\s+resisting\s+frame/i] },

    // 15. Steel Long Span (160)
    { code: "160", patterns: [/steel\s+long\s+span/i, /trussed\s+arches/i, /steel\s+truss/i, /long\s+span\s+steel/i] },

    // 16. Structural Steel / General Steel (151)
    { code: "151", patterns: [/structural\s+steel/i, /steel\s+frame/i, /steel\s+columns\s+and\s+beams/i, /rigid\s+steel/i, /\bsteel\b/i, /heavy\s+steel/i] },

    // 17. Wood Frame Modern (101) & Variants (102, 103, 104, 107) - ISO Class 1
    { code: "103", patterns: [/masonry\s+veneer/i, /brick\s+veneer/i, /stone\s+veneer/i, /wood.*brick\s+veneer/i] },
    { code: "104", patterns: [/heavy\s+timber/i, /mill\s+construction/i, /timber\s+post\s+and\s+beam/i, /glulam/i, /glue[- ]laminated/i] },
    { code: "102", patterns: [/light\s+wood/i, /studless/i, /light\s+timber/i] },
    { code: "107", patterns: [/lightweight\s+cladding/i, /fiber\s+cement/i] },
    { code: "108", patterns: [/\bhale\b/i] },
    { code: "101", patterns: [/wood\s+frame/i, /wood\s+stud/i, /timber\s+frame/i, /stud\s+wall/i, /stick\s+built/i, /wood\s+structure/i, /\bwood\b/i, /\btimber\b/i, /plywood/i, /wood\s+siding/i, /\biso\s*(?:class\s*)?1\b/i, /(?<!(?:concrete|steel|braced|moment|bearing|metal|light)\s+)\bframe\b/i] },

    // 18. Mobile Home / Manufactured Housing (191-194)
    { code: "192", patterns: [/mobile\s+home.*permanent\s+foundation/i, /manufactured\s+home.*permanent\s+foundation/i] },
    { code: "193", patterns: [/mobile\s+home.*tied\s+down/i, /manufactured\s+home.*tied\s+down/i] },
    { code: "194", patterns: [/mobile\s+home.*not\s+tied\s+down/i] },
    { code: "191", patterns: [/mobile\s+home/i, /manufactured\s+home/i, /manufactured\s+housing/i, /\btrailer\s+home\b/i, /double[- ]?wide/i, /single[- ]?wide/i] },

    // 19. Solar (500-514)
    { code: "502", patterns: [/solar.*ballast/i, /ballasted.*solar/i] },
    { code: "501", patterns: [/solar.*anchor/i, /anchored.*solar/i, /flush\s+mount.*solar/i, /attached.*rooftop\s+solar/i, /solar.*attached/i] },
    { code: "500", patterns: [/rooftop\s+solar/i, /solar.*rooftop/i, /solar\s+panel.*roof/i, /roof.*mounted\s+solar/i] },
    { code: "513", patterns: [/solar.*fixed\s+tilt/i, /fixed\s+tilt.*solar/i] },
    { code: "514", patterns: [/\bbess\b/i, /battery\s+energy\s+storage/i] },
    { code: "510", patterns: [/ground\s+mount.*solar/i, /solar.*ground\s+mount/i, /solar\s+farm/i, /\bsolar\b/i] },

    // 20. Bridges (201-203)
    { code: "201", patterns: [/suspension\s+bridge/i, /cable[- ]stayed\s+bridge/i] },
    { code: "202", patterns: [/truss\s+bridge/i, /steel\s+bridge/i] },
    { code: "203", patterns: [/concrete\s+bridge/i, /\bbridge\b/i] },

    // 21. Tanks (221-226)
    { code: "221", patterns: [/storage\s+tank/i, /water\s+tank/i, /fuel\s+tank/i, /oil\s+tank/i, /\btank\b/i] },

    // 22. Pipelines (227-228)
    { code: "227", patterns: [/underground\s+pipeline/i, /subsurface\s+pipe/i] },
    { code: "228", patterns: [/above\s+ground\s+pipeline/i, /at\s+grade\s+pipeline/i, /\bpipeline\b/i] },

    // 23. Chimneys & Towers (231-238)
    { code: "231", patterns: [/\bchimney\b/i, /smokestack/i] },
    { code: "234", patterns: [/communication\s+tower/i, /lattice\s+tower/i, /cell\s+tower/i, /\btower\b/i] },

    // 24. Unknown (100)
    { code: "100", patterns: [/\bunknown\b/i, /\bunk\b/i, /\bother\b/i, /\btbd\b/i, /\bna\b/i, /\bn\/a\b/i] }
  ],

  matchTextToCode(text) {
    if (!text || typeof text !== 'string') return null;
    const clean = text.trim();
    if (!clean || clean === '—' || clean === '-' || clean.toLowerCase() === 'n/a') return null;

    // Direct exact match on known valid numeric code (except 100 unless explicit)
    if (this.CODES[clean]) {
      return clean;
    }

    // Strip out all percentages before any numeric code matching
    // e.g. "MASONRY NON COMBUSTIBLE (100%)" -> "MASONRY NON COMBUSTIBLE"
    const textWithoutPercent = clean
      .replace(/(?:\(?\s*\d+(?:\.\d+)?\s*%\s*\)?)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Look for standalone code numbers (e.g. "Code 101", "[116]", "119")
    // Note: 100 is intentionally excluded here to prevent matching "100 ft", "100%", etc.
    const codeMatch = textWithoutPercent.match(/\b(10[1-8]|11[1-9]|12[0-1]|13[1-9]|14[0-1]|15[1-9]|16[0-9]|17[1-9]|18[1-7]|19[1-4]|20[1-3]|21[1-5]|22[1-8]|23[1-9]|240|50[0-2]|51[0-4]|201[0-9]|202[0-9]|203[0-1]|213[1-9]|214[0-9]|215[0-2]|221[0-9]|222[0-9]|223[0-9]|224[0-9]|225[0-9]|226[0-3]|227[0-9]|228[0-6]|270[1-9]|271[0-9]|2720)\b/);
    if (codeMatch && this.CODES[codeMatch[1]]) {
      return codeMatch[1];
    }

    // Match rules against both textWithoutPercent and clean
    const candidateTexts = [textWithoutPercent, clean].filter(Boolean);
    for (const rule of this.RULES) {
      for (const pattern of rule.patterns) {
        for (const t of candidateTexts) {
          if (pattern.test(t)) {
            return rule.code;
          }
        }
      }
    }

    // Match category descriptions from CODES
    const lower = textWithoutPercent.toLowerCase();
    for (const [c, info] of Object.entries(this.CODES)) {
      if (c === '100') continue;
      const catLower = info.category.toLowerCase();
      if (catLower.length > 4 && lower.includes(catLower)) {
        return c;
      }
    }

    return null;
  },

  parsePercentageComponents(text) {
    if (!text || typeof text !== 'string') return [];
    const raw = text.trim();
    if (!raw || raw === '—' || raw === '-' || raw.toLowerCase() === 'n/a') return [];

    let segments = [];
    if (raw.includes(';')) {
      segments = raw.split(';').map(s => s.trim()).filter(Boolean);
    } else if (raw.includes('\n')) {
      segments = raw.split('\n').map(s => s.trim()).filter(Boolean);
    } else if (raw.includes('/') && /\d+\s*%/.test(raw)) {
      segments = raw.split('/').map(s => s.trim()).filter(Boolean);
    } else if (raw.includes(',') && (raw.match(/%/g) || []).length > 1) {
      segments = raw.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      segments = [raw];
    }

    const list = [];
    for (const seg of segments) {
      const match = seg.match(/(?:\(?\s*(\d+(?:\.\d+)?)\s*%\s*\)?)/);
      let pct = null;
      let desc = seg;

      if (match) {
        pct = parseFloat(match[1]);
        desc = seg.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
      }

      desc = desc.replace(/^[\s:;,\-\(\)\[\]]+|[\s:;,\-\(\)\[\]]+$/g, '').trim();

      if (desc || pct !== null) {
        list.push({
          text: desc,
          percent: pct,
          raw: seg
        });
      }
    }

    return list;
  },

  getHighestComponent(components) {
    if (!components || components.length === 0) return null;
    const sorted = [...components].sort((a, b) => {
      const pA = a.percent !== null ? a.percent : -1;
      const pB = b.percent !== null ? b.percent : -1;
      return pB - pA;
    });
    return sorted[0];
  },

  parseRow(rawLine) {
    const text = String(rawLine || '').trim();
    if (text.includes('\t')) {
      const parts = text.split('\t').map(p => p.trim());
      if (parts.length >= 3) {
        if (/^\d{0,4}$/.test(parts[0])) {
          return {
            existingCode: parts[0],
            bldgDesc: parts[1] || '',
            conDesc: parts.slice(2).join(' ') || ''
          };
        }
        return {
          existingCode: '',
          bldgDesc: parts[0] || '',
          conDesc: parts.slice(1).join(' ') || ''
        };
      } else if (parts.length === 2) {
        if (/^\d{1,4}$/.test(parts[0])) {
          return {
            existingCode: parts[0],
            bldgDesc: parts[1] || '',
            conDesc: ''
          };
        }
        return {
          existingCode: '',
          bldgDesc: parts[0] || '',
          conDesc: parts[1] || ''
        };
      }
    }

    if (text.includes(',')) {
      const parts = text.split(',').map(p => p.trim());
      if (parts.length >= 3 && /^\d{0,4}$/.test(parts[0])) {
        return {
          existingCode: parts[0],
          bldgDesc: parts[1] || '',
          conDesc: parts.slice(2).join(', ') || ''
        };
      }
      return {
        existingCode: '',
        bldgDesc: parts[0] || '',
        conDesc: parts.slice(1).join(', ') || ''
      };
    }

    return { existingCode: '', bldgDesc: '', conDesc: text };
  },

  classifyRow(existingCode, bldgDesc, conDesc) {
    let ex = String(existingCode || '').trim();
    if (ex === '—' || ex === '-' || ex.toLowerCase() === 'n/a') ex = '';
    const bldg = String(bldgDesc || '').trim();
    const con = String(conDesc || '').trim();

    // 1. Rule 1: Check first column (existingCode). Retain for verification against resolved code.

    // 2. Rule 2: Check 2nd column (Building Type/Framing) for percentage values.
    // If multiple percentage components exist in Col 2, extract the one with highest percentage.
    const bldgComponents = this.parsePercentageComponents(bldg);
    const topBldg = this.getHighestComponent(bldgComponents);

    // 3. Rule 3: Check 3rd column (Construction Description) and verify both columns.
    // Compare percentages between Col 2 and Col 3 and select the dominant component with the higher percentage.
    const conComponents = this.parsePercentageComponents(con);
    const topCon = this.getHighestComponent(conComponents);

    let dominantText = '';
    let secondaryText = '';

    const bldgPct = (topBldg && topBldg.percent !== null) ? topBldg.percent : null;
    const conPct = (topCon && topCon.percent !== null) ? topCon.percent : null;

    if (bldgPct !== null && conPct !== null) {
      // Both columns contain explicit percentages: higher percentage takes precedence
      if (conPct > bldgPct) {
        dominantText = topCon.text;
        secondaryText = topBldg.text;
      } else if (bldgPct > conPct) {
        dominantText = topBldg.text;
        secondaryText = topCon.text;
      } else {
        // Equal percentage: Col 3 (material description) prioritized, secondary Col 2
        dominantText = topCon.text || topBldg.text;
        secondaryText = topBldg.text;
      }
    } else if (conPct !== null) {
      // Col 3 specifies explicit percentage (e.g. MASONRY NON COMBUSTIBLE (100%)): Col 3 wins
      dominantText = topCon.text;
      secondaryText = topBldg ? topBldg.text : bldg;
    } else if (bldgPct !== null) {
      // Col 2 specifies explicit percentage (e.g. Wood Frame (100%)): Col 2 wins
      dominantText = topBldg.text;
      secondaryText = topCon ? topCon.text : con;
    } else {
      // Neither column specifies percentages: check Col 3 first, then Col 2
      dominantText = (topCon && topCon.text) ? topCon.text : con;
      secondaryText = (topBldg && topBldg.text) ? topBldg.text : bldg;
    }

    // A. Match dominant description first
    let matchedCode = dominantText ? this.matchTextToCode(dominantText) : null;

    // B. If dominant description didn't resolve to a known code, try secondary description
    if (!matchedCode || matchedCode === '100') {
      if (secondaryText && secondaryText !== dominantText) {
        matchedCode = this.matchTextToCode(secondaryText);
      }
    }

    // C. If still unresolved, try full raw descriptions
    if (!matchedCode || matchedCode === '100') {
      if (con) matchedCode = this.matchTextToCode(con);
    }
    if (!matchedCode || matchedCode === '100') {
      if (bldg) matchedCode = this.matchTextToCode(bldg);
    }
    if (!matchedCode || matchedCode === '100') {
      const combined = (bldg + ' ' + con).trim();
      if (combined) matchedCode = this.matchTextToCode(combined);
    }

    // D. Fallback to existing code if descriptions yielded unknown and existing code is valid
    if ((!matchedCode || matchedCode === '100') && ex && this.CODES[ex] && ex !== '100') {
      matchedCode = ex;
    }

    matchedCode = matchedCode || '100';
    const info = this.CODES[matchedCode] || { code: matchedCode, category: 'Unknown', group: 'Unknown construction' };

    let statusKey = 'assigned';
    let statusText = 'Assigned';

    if (ex) {
      if (ex === matchedCode) {
        statusKey = 'match';
        statusText = '✓ Confirmed (' + matchedCode + ')';
      } else if (ex === '100' && matchedCode !== '100') {
        statusKey = 'upgraded';
        statusText = '✨ Resolved (100 ➔ ' + matchedCode + ')';
      } else {
        statusKey = 'mismatch';
        statusText = '⚠️ Review (' + ex + ' ➔ ' + matchedCode + ')';
      }
    } else {
      statusKey = 'assigned';
      statusText = '✨ Assigned (' + matchedCode + ')';
    }

    return {
      existingCode: ex,
      bldgDesc: bldg,
      conDesc: con,
      conCode: info.code,
      category: info.category,
      group: info.group,
      status: statusKey,
      statusText: statusText,
      comparisonStatus: statusKey,
      comparisonMessage: statusText
    };
  },

  classify(rawLine) {
    const row = this.parseRow(rawLine);
    return this.classifyRow(row.existingCode, row.bldgDesc, row.conDesc);
  },

  cleanColumn(input, options = {}) {
    const results = [];

    if (input && typeof input === 'object' && !Array.isArray(input) && (input.bldgDescs || input.conDescs)) {
      const codes = input.existingCodes || [];
      const bldgs = input.bldgDescs || [];
      const cons = input.conDescs || [];
      const maxLen = Math.max(codes.length, bldgs.length, cons.length);

      for (let i = 0; i < maxLen; i++) {
        const ex = (codes[i] || '').trim();
        const bldg = (bldgs[i] || '').trim();
        const con = (cons[i] || '').trim();
        if (!ex && !bldg && !con && options.removeEmptyLines) continue;

        const res = this.classifyRow(ex, bldg, con);
        results.push({
          lineNum: i + 1,
          original: (ex + '\t' + bldg + '\t' + con).trim(),
          existingCode: res.existingCode,
          bldgDesc: res.bldgDesc,
          conDesc: res.conDesc,
          conCode: res.conCode,
          category: res.category,
          group: res.group,
          status: res.status,
          statusText: res.statusText,
          comparisonStatus: res.status,
          comparisonMessage: res.statusText,
          cleaned: (res.existingCode ? res.existingCode + '\t' : '') + res.bldgDesc + '\t' + res.conDesc + '\t' + res.conCode + '\t' + res.category,
          changed: true
        });
      }
      return results;
    }

    const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      const res = this.classify(trimmed);
      results.push({
        lineNum: idx + 1,
        original: line,
        existingCode: res.existingCode,
        bldgDesc: res.bldgDesc,
        conDesc: res.conDesc,
        conCode: res.conCode,
        category: res.category,
        group: res.group,
        status: res.status,
        statusText: res.statusText,
        comparisonStatus: res.status,
        comparisonMessage: res.statusText,
        cleaned: (res.existingCode ? res.existingCode + '\t' : '') + res.bldgDesc + '\t' + res.conDesc + '\t' + res.conCode + '\t' + res.category,
        changed: true
      });
    });

    return results;
  }
};

const CleanersRegistry = {
  street: {
    id: 'street',
    name: 'Street Address',
    icon: '🏠',
    badge: 'Active Engine',
    description: 'Strips 29 symbols, noise words, resolves building prefixes, and extracts primary address.',
    cleaner: StreetCleaner
  },
  split: {
    id: 'split',
    name: 'Address Splitter',
    icon: '🔀',
    badge: 'Universal Engine',
    description: 'Separates address columns into Street, City, State, County, Postal Code, and Country (ISO-2).',
    cleaner: AddressSplitter
  },
  occupancy: {
    id: 'occupancy',
    name: 'Occupancy Code',
    icon: '🏢',
    badge: 'UNICEDE®',
    description: 'Touchstone / UNICEDE Occupancy Class Code Classifier (Codes 300-384, Commercial, Residential, Industrial, etc.)',
    cleaner: OccupancyClassifier
  },
  construction: {
    id: 'construction',
    name: 'Construction Code',
    icon: '🏗️',
    badge: 'UNICEDE®',
    description: 'Touchstone / UNICEDE Construction Class Code Classifier (Wood 101-108, Masonry 111-121, Concrete 131-141, Steel 151-160, Solar 500-514, etc.)',
    cleaner: ConstructionClassifier
  },
  name: {
    id: 'name',
    name: 'Full Name',
    icon: '👤',
    badge: 'Ready',
    description: 'Removes titles/honorifics, excess punctuation, standardizes casing to Title Case.',
    cleaner: {
      cleanAddress(raw) {
        let text = raw.replace(/\b(mr|mrs|ms|dr|prof|jr|sr|esq|ii|iii|iv)\.?\b/gi, '');
        text = text.replace(/[,./<>?;':"|[\]{}=+\-_()#$%^&*@!]/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        return text.toLowerCase().replace(/(^|\s|-)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
      },
      cleanColumn(input) {
        const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
        return lines.map((l, i) => ({
          lineNum: i + 1,
          original: l,
          cleaned: this.cleanAddress(l),
          changed: l.trim() !== this.cleanAddress(l)
        }));
      }
    }
  },
  phone: {
    id: 'phone',
    name: 'Phone Number',
    icon: '📞',
    badge: 'Ready',
    description: 'Strips formatting symbols, country codes, standardizes to (XXX) XXX-XXXX or clean numeric column.',
    cleaner: {
      cleanAddress(raw) {
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else if (digits.length === 11 && digits.startsWith('1')) {
          return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        return digits;
      },
      cleanColumn(input, options = {}) {
        const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
        return lines.map((l, i) => ({
          lineNum: i + 1,
          original: l,
          cleaned: this.cleanAddress(l),
          changed: l.trim() !== this.cleanAddress(l)
        }));
      }
    }
  },
  email: {
    id: 'email',
    name: 'Email Address',
    icon: '✉️',
    badge: 'Ready',
    description: 'Trims leading/trailing junk, removes spaces, lowercases, and validates structure.',
    cleaner: {
      cleanAddress(raw) {
        return raw.trim().toLowerCase().replace(/\s+/g, '');
      },
      cleanColumn(input) {
        const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
        return lines.map((l, i) => ({
          lineNum: i + 1,
          original: l,
          cleaned: this.cleanAddress(l),
          changed: l.trim() !== this.cleanAddress(l)
        }));
      }
    }
  },
  year: {
    id: 'year',
    name: 'Year Built',
    icon: '📅',
    badge: '1753 - 2026',
    description: 'Validates Year Built between 1753 and the current year (2026). Out-of-range values or noisy formats are cleared to blank.',
    cleaner: null // Attached below
  },
  roof_year: {
    id: 'roof_year',
    name: 'Roof Year Built',
    icon: '🏚️',
    badge: '2-Col Validation',
    description: 'Validates Roof Year Built against Year Built (Year Built required, Roof Year Built <= Year Built, else blank).',
    cleaner: null // Attached below
  },
  roof: {
    id: 'roof',
    name: 'Roof Description',
    icon: '🏠',
    badge: 'UNICEDE® 4-Col',
    description: 'Touchstone / UNICEDE Location Roof Detail Fields: Separates roof descriptions into 1) Roof Geometry, 2) Roof Pitch, 3) Roof Covering, and 4) Roof Deck.',
    cleaner: null // Attached below
  },
  wall: {
    id: 'wall',
    name: 'Exterior Wall Finish',
    icon: '🧱',
    badge: 'UNICEDE® 2-Col',
    description: 'Touchstone / UNICEDE Location Wall Detail Fields: Analyzes exterior wall finishes into 1) WallType (structural/backing) and 2) WallSiding (weather protection), applying higher-% and weaker-material rules.',
    cleaner: null // Attached below
  }
};

/**
 * CleanExcel - Year Built Range Validator & Cleaner Engine
 * Logic:
 *  - Valid Range: 1753 <= Year <= Current Year (e.g. 2026)
 *  - If Year < 1753 -> Blank column
 *  - If Year > Current Year -> Blank column
 *  - Extracts valid 4-digit years from noisy strings (e.g. "Built in 1985", "Yr: 2004", "1,999.0")
 */
const YearBuiltCleaner = {
  defaultMinYear: 1753,
  get defaultMaxYear() {
    return new Date().getFullYear();
  },

  cleanYear(raw, options = {}) {
    if (raw === undefined || raw === null) return '';
    const str = String(raw).trim();
    if (!str || str === '—' || str === '-' || /^(n\/?a|unk|unknown|none|null|nil|tbd|0)$/i.test(str)) {
      return '';
    }

    const minYear = typeof options.minYear === 'number' && !isNaN(options.minYear) ? options.minYear : this.defaultMinYear;
    const maxYear = typeof options.maxYear === 'number' && !isNaN(options.maxYear) ? options.maxYear : this.defaultMaxYear;

    // Remove commas from numbers like "1,985"
    let cleanStr = str.replace(/,/g, '');

    // Underwriting Rule: Support 2-digit year representations in slash/hyphen ranges
    // e.g. "2005/95" or "2005-95" -> "2005/1995"
    cleanStr = cleanStr.replace(/\b(19\d{2}|20\d{2})\s*([/\\-])\s*([3-9]\d)\b/g, (match, y1, sep, y2) => {
      return `${y1}${sep}19${y2}`;
    });
    // e.g. "95/2005" or "95-2005" -> "1995/2005"
    cleanStr = cleanStr.replace(/\b([3-9]\d)\s*([/\\-])\s*(19\d{2}|20\d{2})\b/g, (match, y1, sep, y2) => {
      return `19${y1}${sep}${y2}`;
    });
    // e.g. "95/05" or "95-05" -> "1995/2005"
    cleanStr = cleanStr.replace(/\b([3-9]\d)\s*([/\\-])\s*([0-2]\d)\b/g, (match, y1, sep, y2) => {
      return `19${y1}${sep}20${y2}`;
    });

    // 1. Check for standard 4-digit number matches
    const matches = cleanStr.match(/\b\d{4}\b/g);
    let candidateYear = null;

    if (matches && matches.length > 0) {
      // Underwriting Rule: When multiple years or ranges are present
      // (e.g. "1995/2005", "2005/1995", "2005-1995", "1998/1999"),
      // pick the LESSER / OLDER year (original construction year).
      const validYears = matches
        .map(m => parseInt(m, 10))
        .filter(y => y >= minYear && y <= maxYear);

      if (validYears.length > 0) {
        candidateYear = Math.min(...validYears);
      } else {
        // If none within range, pick the minimum extracted 4-digit number
        const allYears = matches.map(m => parseInt(m, 10));
        candidateYear = Math.min(...allYears);
      }
    } else {
      // 2. Check for float formatted years e.g. "1985.0", "1985.00"
      const floatMatch = cleanStr.match(/\b(\d{4})\.0+\b/);
      if (floatMatch) {
        candidateYear = parseInt(floatMatch[1], 10);
      } else {
        // 3. Fallback: strip non-digits; if exactly 4 digits, parse it
        const digits = cleanStr.replace(/\D/g, '');
        if (digits.length === 4) {
          candidateYear = parseInt(digits, 10);
        }
      }
    }

    if (candidateYear !== null) {
      // Rule: Greater than or equal to minYear (1753) AND no greater than current year
      // If less than minYear -> Blank column
      // If greater than current year -> Blank column
      if (candidateYear >= minYear && candidateYear <= maxYear) {
        return String(candidateYear);
      }
      return '';
    }

    return '';
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      const cleaned = this.cleanYear(line, options);

      let status = 'cleaned';
      let statusText = 'Cleaned';

      if (!trimmed || /^(?:n\/?a|n\.a\.?|none|null|nil|not\s*applicable|-+|—+|\.)$/i.test(trimmed)) {
        status = 'empty';
        statusText = 'Blank';
      } else if (trimmed === cleaned) {
        status = 'unchanged';
        statusText = '✓ Valid Year';
      } else if (!cleaned) {
        status = 'mismatch';
        statusText = '⚠️ Out of Range (<1753 or >Current Year)';
      } else {
        const hasMultiple = /\b\d{4}\b.*\b\d{4}\b/.test(line) || /[/\\-]/.test(line);
        status = 'assigned';
        statusText = hasMultiple ? `✨ Older Year Selected (${cleaned})` : `✨ Standardized (${cleaned})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: cleaned,
        year: cleaned,
        changed: trimmed !== cleaned,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up cleaner reference
CleanersRegistry.year.cleaner = YearBuiltCleaner;

/**
 * CleanExcel - Roof Year Built Underwriting Engine
 * 
 * Rules:
 *  1. Without Year Built, Roof Year cannot be accurate:
 *     If Year Built is missing / empty / invalid (<1753 or >2026), Cleaned Roof Year is BLANK.
 *  2. If Year Built is given but Roof Year Built is not given:
 *     Cleaned Roof Year is BLANK.
 *  3. Roof Year Built cannot be greater than Year Built:
 *     If Year Built is 2005 and Roof Year Built is greater than Year Built (e.g. 2010, 2020),
 *     Cleaned Roof Year is BLANK.
 *     (Supports ruleMode: 'roof_le_yb' (default, Roof Year <= Year Built), 'roof_ge_yb' (>=))
 *  4. Valid Year Range: 1753 <= Year <= Current Year (2026).
 *  5. Multi-year / range input support: extracts older/lesser year (e.g. "1995/2005" -> 1995).
 */
const RoofYearCleaner = {
  defaultMinYear: 1753,
  get defaultMaxYear() {
    return new Date().getFullYear();
  },

  cleanSingleYear(raw, options = {}) {
    return YearBuiltCleaner.cleanYear(raw, options);
  },

  /**
   * Extract all 4-digit years from raw roof year string, resolving 2-digit ranges
   */
  extractAllRoofYears(raw, options = {}) {
    if (raw === undefined || raw === null) return [];
    const str = String(raw).trim();
    if (!str) return [];

    const minYear = typeof options.minYear === 'number' && !isNaN(options.minYear) ? options.minYear : this.defaultMinYear;
    const maxYear = typeof options.maxYear === 'number' && !isNaN(options.maxYear) ? options.maxYear : this.defaultMaxYear;

    let cleanStr = str.replace(/,/g, '');

    // Support 2-digit year representations in slash/hyphen ranges
    cleanStr = cleanStr.replace(/\b(19\d{2}|20\d{2})\s*([/\\-])\s*([0-2]\d)\b/g, (match, y1, sep, y2) => `${y1}${sep}20${y2}`);
    cleanStr = cleanStr.replace(/\b(19\d{2}|20\d{2})\s*([/\\-])\s*([3-9]\d)\b/g, (match, y1, sep, y2) => `${y1}${sep}19${y2}`);
    cleanStr = cleanStr.replace(/\b([3-9]\d)\s*([/\\-])\s*(19\d{2}|20\d{2})\b/g, (match, y1, sep, y2) => `19${y1}${sep}${y2}`);
    cleanStr = cleanStr.replace(/\b([0-2]\d)\s*([/\\-])\s*(19\d{2}|20\d{2})\b/g, (match, y1, sep, y2) => `20${y1}${sep}${y2}`);
    cleanStr = cleanStr.replace(/\b([0-2]\d)\s*([/\\-])\s*([0-2]\d)\b/g, (match, y1, sep, y2) => `20${y1}${sep}20${y2}`);

    const matches = cleanStr.match(/\b\d{4}\b/g);
    if (matches && matches.length > 0) {
      const valid = matches.map(m => parseInt(m, 10)).filter(y => y >= minYear && y <= maxYear);
      return valid.length > 0 ? Array.from(new Set(valid)) : Array.from(new Set(matches.map(m => parseInt(m, 10))));
    }

    const floatMatch = cleanStr.match(/\b(\d{4})\.0+\b/);
    if (floatMatch) return [parseInt(floatMatch[1], 10)];

    const digits = cleanStr.replace(/\D/g, '');
    if (digits.length === 4) return [parseInt(digits, 10)];

    return [];
  },

  /**
   * Underwriting Rule for Roof Year Built:
   * When multiple years or ranges are present (e.g. "2002/2005", "2005/2006", "2002/2003"),
   * filter out any year > Year Built (if Year Built is provided), then pick the HIGHER year.
   */
  cleanSingleRoofYear(raw, options = {}, ybNum = null) {
    const candidateYears = this.extractAllRoofYears(raw, options);
    if (!candidateYears.length) return '';
    if (ybNum !== null && !isNaN(ybNum)) {
      const validGeYb = candidateYears.filter(y => y >= ybNum);
      if (validGeYb.length > 0) {
        return String(Math.max(...validGeYb));
      }
      return '';
    }
    return String(Math.max(...candidateYears));
  },

  validateAndClean(yearBuiltRaw, roofYearRaw, options = {}) {
    const rawYbStr = (yearBuiltRaw !== undefined && yearBuiltRaw !== null) ? String(yearBuiltRaw).trim() : '';
    const rawRyStr = (roofYearRaw !== undefined && roofYearRaw !== null) ? String(roofYearRaw).trim() : '';

    const minYear = typeof options.minYear === 'number' && !isNaN(options.minYear) ? options.minYear : this.defaultMinYear;
    const maxYear = typeof options.maxYear === 'number' && !isNaN(options.maxYear) ? options.maxYear : this.defaultMaxYear;

    // Both completely blank
    if (!rawYbStr && !rawRyStr) {
      return {
        yearBuilt: '',
        roofYearBuilt: '',
        cleaned: '',
        status: 'empty',
        statusText: 'Blank'
      };
    }

    // Parse Year Built (Col 1: picks lesser/older year, e.g. 1995/2005 -> 1995)
    const parsedYb = this.cleanSingleYear(rawYbStr, { minYear, maxYear });
    const ybNum = parsedYb ? parseInt(parsedYb, 10) : null;

    // Rule 1: Without Year Built, Roof Year cannot be accurate -> Blank
    if (!rawYbStr || !parsedYb) {
      return {
        yearBuilt: parsedYb || '',
        roofYearBuilt: rawRyStr,
        cleaned: '',
        status: 'missing_yb',
        statusText: !rawYbStr ? '⚠️ Missing Year Built (Required) → Blank' : `⚠️ Year Built Invalid / Out of Range (${rawYbStr}) → Blank`
      };
    }

    // Rule 2: If Year Built is given but Roof Year Built is not given -> Blank
    const candidateRoofYears = this.extractAllRoofYears(rawRyStr, { minYear, maxYear });
    if (!rawRyStr || candidateRoofYears.length === 0) {
      return {
        yearBuilt: parsedYb,
        roofYearBuilt: '',
        cleaned: '',
        status: 'missing_roof',
        statusText: !rawRyStr ? `⚠️ Roof Year Not Provided (Year Built: ${parsedYb}) → Blank` : `⚠️ Roof Year Out of Range (<${minYear} or >${maxYear}) → Blank`
      };
    }

    // Rule 3: Roof Year Built must be GREATER THAN OR EQUAL TO Year Built (Roof Year Built >= Year Built)
    // 1. If Year Built is 2005 and Roof Year is 2006 -> 2006 >= 2005 -> Output: 2006
    // 2. If Year Built is 2005 and Roof Year is 2006/2007 -> pick higher year 2007 (2007 >= 2005) -> Output: 2007
    // 3. If Year Built is 2005 and Roof Year is 2005 -> 2005 >= 2005 -> Output: 2005 (Original Roof)
    // 4. If Year Built is 2005 and Roof Year is 2004/2003 -> all < 2005 ("not less than year build") -> Output: Blank
    // 5. If Year Built is 2005 and Roof Year is 2004 -> 2004 < 2005 ("not less than year build") -> Output: Blank
    const validYearsGeYb = candidateRoofYears.filter(y => y >= ybNum && y >= minYear && y <= maxYear);
    const ryHasMultiple = candidateRoofYears.length > 1;

    let cleaned = '';
    let status = 'cleaned';
    let statusText = '';

    if (validYearsGeYb.length > 0) {
      const selectedYear = Math.max(...validYearsGeYb);
      cleaned = String(selectedYear);
      status = (selectedYear === ybNum) ? 'unchanged' : 'assigned';
      if (selectedYear === ybNum) {
        statusText = `✓ Valid (Original Roof: ${selectedYear})`;
      } else if (ryHasMultiple) {
        statusText = `✓ Valid (Higher Year: ${selectedYear} ≥ ${ybNum})`;
      } else {
        statusText = `✓ Valid (${selectedYear} ≥ ${ybNum})`;
      }
    } else {
      status = 'mismatch';
      statusText = `⚠️ Roof Year (${candidateRoofYears.join('/')}) < Year Built (${ybNum}) → Blank`;
      cleaned = '';
    }

    return {
      yearBuilt: parsedYb,
      roofYearBuilt: rawRyStr,
      cleaned,
      status,
      statusText
    };
  },

  cleanColumn(input, options = {}) {
    let ybLines = [];
    let ryLines = [];

    if (input && typeof input === 'object' && !Array.isArray(input)) {
      ybLines = Array.isArray(input.yearBuilt) ? input.yearBuilt : (input.yearBuilt || '').split(/\r\n|\r|\n/);
      ryLines = Array.isArray(input.roofYearBuilt) ? input.roofYearBuilt : (input.roofYearBuilt || '').split(/\r\n|\r|\n/);
    } else if (typeof input === 'string') {
      const rows = input.split(/\r\n|\r|\n/);
      rows.forEach(r => {
        const parts = r.split('\t');
        if (parts.length >= 2) {
          ybLines.push(parts[0]);
          ryLines.push(parts[1]);
        } else {
          ybLines.push(r);
          ryLines.push('');
        }
      });
    } else if (Array.isArray(input)) {
      input.forEach(r => {
        if (typeof r === 'string') {
          const parts = r.split('\t');
          ybLines.push(parts[0] || '');
          ryLines.push(parts[1] || '');
        } else if (r && typeof r === 'object') {
          ybLines.push(r.yearBuilt || r.yb || '');
          ryLines.push(r.roofYearBuilt || r.ry || '');
        }
      });
    }

    const totalRows = Math.max(ybLines.length, ryLines.length);
    const results = [];

    // Underwriting UX: If Col 1 has a single Year Built (e.g. "2005") or fewer lines than Col 2,
    // carry forward the last non-empty Year Built so users don't have to retype "2005" on every line!
    let lastKnownYb = '';
    if (ybLines.length >= 1 && ybLines[0] && ybLines[0].trim()) {
      lastKnownYb = ybLines[0].trim();
    }

    for (let idx = 0; idx < totalRows; idx++) {
      let yb = ybLines[idx] !== undefined ? ybLines[idx] : '';
      const ry = ryLines[idx] !== undefined ? ryLines[idx] : '';

      // Carry forward Year Built if current row is blank and previous non-empty was provided
      if (!yb.trim() && lastKnownYb && ry.trim()) {
        yb = lastKnownYb;
      } else if (yb.trim()) {
        lastKnownYb = yb.trim();
      }

      if (!yb.trim() && !ry.trim() && options.removeEmptyLines) {
        continue;
      }

      const res = this.validateAndClean(yb, ry, options);
      const originalPair = `${yb}\t${ry}`;

      results.push({
        lineNum: idx + 1,
        original: originalPair,
        yearBuilt: res.yearBuilt,
        rawYearBuilt: yb,
        roofYearBuilt: res.roofYearBuilt,
        rawRoofYearBuilt: ry,
        cleaned: res.cleaned,
        year: res.cleaned,
        changed: (ry.trim() !== res.cleaned) || (res.status === 'mismatch' || res.status === 'missing_yb'),
        status: res.status,
        statusText: res.statusText
      });
    }

    return results;
  }
};

// Wire up roof year cleaner reference
CleanersRegistry.roof_year.cleaner = RoofYearCleaner;

/**
 * CleanExcel - Touchstone UNICEDE® Roof Detail Fields Taxonomy & Classifier Engine
 * Splits and classifies roof descriptions into 4 distinct Touchstone fields:
 * 1. Roof Geometry (Codes 0–10)
 * 2. Roof Pitch (Codes 0–3)
 * 3. Roof Covering (Codes 0–12)
 * 4. Roof Deck (Codes 0–8)
 * Reference: https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-roof-detail-fields.html?hl=roof
 */
const RoofTaxonomy = {
  get GEOMETRY() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.GEOMETRY) || {}; },
  get PITCH() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.PITCH) || {}; },
  get COVERING() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.COVERING) || {}; },
  get DECK() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.DECK) || {}; },
  get ANCHORAGE() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.ANCHORAGE) || {}; }
};

const RoofClassifier = {
  taxonomy: RoofTaxonomy,

  // Underwriting Vulnerability / Weakness rankings (higher score = weaker material / higher risk)
  GEOMETRY_WEAKNESS: {
    '2': 100, // Gable unbraced (weakest against wind)
    '10': 90, // Gambrel
    '6': 80,  // Shed / monopitch
    '1': 70,  // Flat
    '4': 60,  // Complex
    '5': 50,  // Stepped
    '7': 40,  // Mansard
    '8': 30,  // Gable braced
    '9': 20,  // Pyramid
    '3': 10,  // Hip (strongest against wind)
    '0': 0
  },

  PITCH_WEAKNESS: {
    '1': 30, // Low pitch (<10°) - weakest (highest uplift forces & water ponding)
    '2': 20, // Medium pitch (10°-30°)
    '3': 10, // High pitch (>30°) - strongest against uplift
    '0': 0
  },

  COVERING_WEAKNESS: {
    '2': 120, // Wooden shingles (weakest)
    '1': 110, // Asphalt shingles
    '3': 100, // Clay/concrete tiles
    '5': 90,  // Slate
    '9': 80,  // Smooth BUR / Mod-Bit
    '10': 70, // Ballasted single-ply
    '7': 60,  // Single-ply membrane
    '6': 50,  // BUR with gravel
    '4': 40,  // Light metal panels
    '12': 30, // Photovoltaic
    '8': 20,  // Standing seam metal
    '11': 10, // Hurricane Wind-Rated (strongest)
    '0': 0
  },

  DECK_WEAKNESS: {
    '8': 80, // Light metal (weakest)
    '3': 70, // OSB / Particle board
    '2': 60, // Wood planks
    '1': 50, // Plywood
    '4': 40, // Metal deck w/ insulation board
    '5': 30, // Metal deck w/ concrete
    '6': 20, // Pre-cast concrete slabs
    '7': 10, // Reinforced concrete slabs (strongest)
    '0': 0
  },

  ANCHORAGE_WEAKNESS: {
    '4': 100, // Gravity/friction (weakest against wind uplift / dead load only)
    '2': 80,  // Nails/Screws (toe-nailing)
    '7': 60,  // Clips (framing clips)
    '1': 40,  // Hurricane Ties (engineered hurricane ties/straps)
    '3': 30,  // Anchor bolts
    '5': 25,  // Adhesive epoxy
    '6': 10,  // Structurally Connected (monolithic concrete tie beam / welded, strongest)
    '0': 0
  },

  // Comprehensive synonyms dictionary for fuzzy and similar name matching
  SYNONYMS: {
    GEOMETRY: {
      '1': ['flat', 'level', 'horizontal', 'zero pitch', 'low slope roof', 'flat roof', '0 pitch'],
      '2': ['gable', 'gabled', 'gable unbraced', 'unbraced gable', 'gable end without bracing', 'open gable', 'pitched gable', 'a frame', 'gable end', 'gable roof'],
      '3': ['hip', 'hipped', 'hip roof', 'dutch hip', 'cross hip', 'full hip', 'half hip'],
      '4': ['complex', 'multi gable', 'cross gable', 'irregular', 'combination', 'custom geometry', 'turret', 'dome', 'barrel', 'arched', 'curved roof', 'butterfly'],
      '5': ['stepped', 'step roof', 'terraced', 'clerestory', 'sawtooth', 'monitor'],
      '6': ['shed', 'skillion', 'mono pitch', 'monopitch', 'single pitch', 'single slope', 'lean to', 'pent', 'half gable'],
      '7': ['mansard', 'french roof', 'curb roof'],
      '8': ['gable with bracing', 'gable braced', 'braced gable', 'reinforced gable', 'strapped gable', 'engineered gable'],
      '9': ['pyramid', 'pyramidal', 'pavilion roof', 'pyramid hip'],
      '10': ['gambrel', 'barn roof', 'barn style', 'dutch roof']
    },
    PITCH: {
      '1': ['low', 'low pitch', 'low slope', 'shallow pitch', 'nearly flat', 'flat pitch', 'less than 10', '<10', 'flat slope', '0:12', '1:12', '2:12'],
      '2': ['medium', 'medium pitch', 'medium slope', 'moderate pitch', 'moderate slope', 'standard pitch', 'normal pitch', '10 to 30', '3:12', '4:12', '5:12', '6:12', '7:12'],
      '3': ['high', 'high pitch', 'high slope', 'steep pitch', 'steep slope', 'steep', 'sharp pitch', 'more than 30', 'greater than 30', '>30', '8:12', '9:12', '10:12', '11:12', '12:12']
    },
    COVERING: {
      '1': ['asphalt shingles', 'shingles asphalt', 'asphalt shingle', 'shingles', 'shingle', 'composition shingles', 'comp shingles', 'architectural shingles', 'dimensional shingles', 'fiberglass shingles', 'laminate shingles', '3 tab', '3 tab shingles', 'three tab', 'asphalt'],
      '2': ['wood shingles', 'wooden shingles', 'shingles wood', 'wood shakes', 'shakes wood', 'cedar shakes', 'cedar shingles', 'shake roof', 'wood shake', 'shake', 'shakes'],
      '3': ['clay tiles', 'tiles clay', 'concrete tiles', 'tiles concrete', 'clay concrete tiles', 'clay tile', 'concrete tile', 'spanish tiles', 'barrel tiles', 'terra cotta', 'terracotta', 'mission tiles', 's tile', 's tiles', 'cement tiles', 'tile roof', 'tiles', 'tile', 'roman tiles'],
      '4': ['light metal panels', 'metal panels', 'panels metal', 'steel panels', 'panels steel', 'light metal', 'corrugated metal', 'corrugated steel', 'corrugated iron', 'metal sheets', 'sheet metal', 'tin roof', 'tin panels', 'tin', 'r panel', 'r panels', 'pbr panel', 'u panel', '5v crimp', 'ribbed steel', 'ribbed metal', 'steel roofing', 'metal roofing', 'steel', 'metal', 'aluminum', 'corrugated'],
      '5': ['slate', 'slate tiles', 'vermont slate', 'natural slate', 'slate roof', 'slate shingle'],
      '6': ['built up roof with gravel', 'built up with gravel', 'built up gravel', 'bur with gravel', 'bur gravel', 'gravel bur', 'bur w gravel', 'tar and gravel', 'tar gravel', 'asphalt and gravel', 'pea gravel roof', 'built up', 'built up roof', 'bur'],
      '7': ['single ply membrane', 'single ply', 'singleply', '1 ply membrane', '1 ply', 'single ply roof', 'epdm', 'tpo', 'pvc membrane', 'pvc', 'rubber membrane', 'rubber roof', 'synthetic rubber', 'elastomeric membrane', 'thermoplastic', 'cpe', 'cspe', 'hypalon', 'adhered membrane', 'mechanically attached membrane', 'membrane', 'membrane roof', 'membrane single ply', 'single ply sheet', 'single ply membrane roof'],
      '8': ['standing seam metal roofs', 'standing seam metal', 'standing seam', 'standing seam steel', 'standing seam aluminum', 'ssmr', 'concealed fastener metal', 'architectural standing seam', 'standing seam roof'],
      '9': ['built up roof without gravel', 'built up without gravel', 'bur without gravel', 'smooth bur', 'smooth surface bur', 'modified bitumen', 'mod bit', 'sbs', 'app', 'torch down', 'cap sheet', 'roll roofing', 'cold applied bur', 'smooth bur mod bit'],
      '10': ['single ply membrane ballasted', 'single ply ballasted', 'ballasted single ply', 'ballasted membrane', 'gravel ballasted single ply', 'ballasted epdm', 'ballasted tpo', 'ballasted pvc', 'single ply gravel ballasted'],
      '11': ['hurricane wind rated roof coverings', 'hurricane wind rated', 'hurricane rated', 'high wind rated', 'wind rated', 'miami dade', 'miami dade noa', 'fm 1 90', 'fm 1 120', 'tas 106', 'ul 580', 'wind rated roof'],
      '12': ['photovoltaic', 'solar roof', 'solar shingles', 'solar panels', 'bipv', 'rooftop solar', 'solar array', 'pv panels', 'pv']
    },
    DECK: {
      '1': ['plywood', 'cdx', 'ply sheathing', 'ply deck', 'plywood sheathing', 'wood sheathing', 'ply', 'cdx plywood', 'plywood deck'],
      '2': ['wood planks', 'wooden planks', 'tongue and groove', 'tongue groove', 't g', 'wood boards', 'timber deck', 'plank deck', 'wood decking', 'wood plank deck'],
      '3': ['particle board osb', 'osb', 'oriented strand board', 'particle board', 'waferboard', 'aspenite', 'chipboard', 'osb sheathing', 'osb deck', 'particle board deck'],
      '4': ['metal deck with insulation board', 'metal deck with insulation', 'steel deck with insulation', 'metal deck w insulation', 'steel deck w insulation', 'insulated metal deck', 'insulated steel deck', 'rigid insulation on metal deck', 'iso board on steel deck', 'polyiso on metal deck', 'b deck with insulation', 'metal deck', 'steel deck', 'steel decking', 'b deck', 'metal roof deck', 'steel roof deck'],
      '5': ['metal deck with concrete', 'steel deck with concrete', 'concrete on metal deck', 'concrete over metal deck', 'composite metal deck', 'composite steel deck', 'lwc on steel deck', 'lightweight concrete on metal deck', 'concrete topped metal deck'],
      '6': ['pre cast concrete slabs', 'precast concrete slabs', 'pre cast concrete', 'precast concrete', 'hollow core concrete', 'hollow core', 'precast slabs', 'prestressed concrete', 'precast planks', 'double tee', 'siporex', 'gypsum slabs'],
      '7': ['reinforced concrete slabs', 'reinforced concrete', 'cast in place concrete', 'cast in place', 'cip concrete', 'poured concrete', 'monolithic concrete', 'concrete slab', 'concrete deck', 'concrete roof deck', 'rc slab', 'poured concrete deck'],
      '8': ['light metal', 'light metal deck', 'light gauge steel deck', 'bare metal deck', 'bare steel deck', 'uninsulated metal deck', 'uninsulated steel deck', 'corrugated steel deck']
    },
    ANCHORAGE: {
      '1': ['hurricane ties', 'hurricane ties 1', 'hurricane tie', 'hurricane straps', 'hurricane strap', 'hurricane clips', 'hurricane clip', 'seismic ties', 'seismic tie', 'seismic straps', 'uplift straps', 'truss ties', 'rafter ties', 'hurricane tie down'],
      '2': ['nails screws', 'nails screws 2', 'nails', 'screws', 'nailed', 'screwed', 'toe nailing', 'toe nailed', 'toenailed', 'toe nail', 'toenail', 'screws nails'],
      '3': ['anchor bolts', 'anchor bolts 3', 'anchor bolt', 'through bolts', 'through bolt', 'expansion bolts', 'expansion bolt', 'bolted connection', 'bolted', 'anchor bolted'],
      '4': ['gravity friction', 'gravity friction 4', 'gravity', 'friction', 'gravity or friction', 'unanchored', 'no ties', 'dead load only', 'friction only', 'no anchorage'],
      '5': ['adhesive epoxy', 'adhesive epoxy 5', 'epoxy', 'chemical anchor', 'resin anchor', 'epoxy anchor', 'structural adhesive', 'glued connection', 'epoxy anchored'],
      '6': ['structurally connected', 'structurally connected 6', 'structural connection', 'structurally anchored', 'concrete tie beam', 'tie beam', 'monolithic tie', 'welded connection', 'embedded plates', 'bond beam'],
      '7': ['clips', 'clips 7', 'framing clips', 'metal clips', 'roof clips', 'simpson clips', 'framing clip', 'metal clip', 'roof clip']
    }
  },

  /**
   * Fast text normalizer
   */
  normalizeText(s) {
    if (!s) return '';
    return String(s)
      .toLowerCase()
      .replace(/\(?\d+(?:\.\d+)?\s*%\)?/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Damerau-Levenshtein distance (handles insertions, deletions, substitutions & swaps)
   */
  damerauLevenshtein(a, b) {
    if (a === b) return 0;
    if (!a) return (b || '').length;
    if (!b) return (a || '').length;
    const lenA = a.length;
    const lenB = b.length;
    const dp = [];
    for (let i = 0; i <= lenA; i++) {
      dp[i] = [i];
      for (let j = 1; j <= lenB; j++) {
        dp[i][j] = i === 0 ? j : 0;
      }
    }
    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
        // Transposition check
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
        }
      }
    }
    return dp[lenA][lenB];
  },

  /**
   * Fuzzy token and string similarity scorer
   */
  calculateSimilarity(str1, str2) {
    const s1 = this.normalizeText(str1);
    const s2 = this.normalizeText(str2);
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1.0;

    // Direct containment (only if shorter string is a meaningful token of length >= 4 and ratio >= 0.5)
    if (Math.min(s1.length, s2.length) >= 4 && (s1.includes(s2) || s2.includes(s1))) {
      const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
      if (ratio >= 0.5) {
        return Math.max(0.85, ratio);
      }
    }

    const t1 = s1.split(/\s+/).filter(w => w.length > 1);
    const t2 = s2.split(/\s+/).filter(w => w.length > 1);
    if (t1.length === 0 || t2.length === 0) return 0;

    let intersection = 0;
    for (const w of t1) {
      if (t2.includes(w)) {
        intersection += 1.0;
      } else {
        for (const tw of t2) {
          if (Math.abs(w.length - tw.length) <= 2 && this.damerauLevenshtein(w, tw) <= 1) {
            intersection += 0.95;
            break;
          }
        }
      }
    }

    const union = t1.length + t2.length - intersection;
    const jaccard = union > 0 ? intersection / union : 0;
    const subset = intersection / Math.min(t1.length, t2.length);
    return Math.max(jaccard, subset * 0.9);
  },

  /**
   * Check for explicit numeric code mentions in input, e.g. "Single-ply membrane (7)", "Code 7", "#7"
   */
  extractExplicitCode(text, maxCode) {
    if (!text || typeof text !== 'string') return null;
    const clean = text
      .replace(/\d+\s*%/g, '')
      .replace(/\d+\s*(?:deg|degree|°|:12)/gi, '');
    const m = clean.match(/(?:\bcode\s*|#|\(\s*|\[\s*)(\d{1,2})(?:\s*\)|\s*\]|\b)/i);
    if (m) {
      const c = parseInt(m[1], 10);
      if (c >= 0 && c <= maxCode) {
        return String(c);
      }
    }
    return null;
  },

  /**
   * Match against synonym dictionary using fuzzy similarity
   */
  findFuzzyCandidates(text, synonymCategory, defaultPct, threshold = 0.70) {
    const candidates = [];
    const normInput = this.normalizeText(text);
    if (!normInput) return candidates;

    let bestMatch = null;
    let highestScore = 0;

    for (const [code, aliases] of Object.entries(synonymCategory)) {
      for (const alias of aliases) {
        const score = this.calculateSimilarity(normInput, alias);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = code;
        }
      }
    }

    if (highestScore >= threshold && bestMatch) {
      candidates.push({ code: bestMatch, percent: defaultPct, isFuzzy: true, similarity: highestScore });
    }
    return candidates;
  },

  /**
   * Split text into semantic segments, preserving percentages
   */
  parseSegments(raw) {
    if (!raw || typeof raw !== 'string') return [];
    const text = raw.trim();
    if (!text) return [];

    let parts = [];
    if (text.includes(';')) {
      parts = text.split(';');
    } else if (text.includes('\n')) {
      parts = text.split('\n');
    } else if (text.includes('|')) {
      parts = text.split('|');
    } else if (text.includes('/') && /\d+\s*%/.test(text)) {
      parts = text.split('/');
    } else if (text.includes(',') && (text.match(/%/g) || []).length > 1) {
      parts = text.split(',');
    } else if (/\band\b|\b&\b/i.test(text) && !text.includes('%')) {
      // e.g. "Gable and Hip", "Plywood and reinforced concrete"
      parts = text.split(/\band\b|\b&\b/i);
    } else {
      parts = [text];
    }

    const segments = [];
    for (let p of parts) {
      p = p.trim();
      if (!p) continue;
      let pct = null;
      const match = p.match(/(?:\(?\s*(\d+(?:\.\d+)?)\s*%\s*\)?)/);
      if (match) {
        pct = parseFloat(match[1]);
      }
      segments.push({ text: p, percent: pct });
    }

    return segments;
  },

  /**
   * Detect all geometry candidates in a text segment
   */
  findGeometryCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    function getPct(regex) {
      if (defaultPct !== null && defaultPct !== undefined) return defaultPct;
      const mPrefix = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${regex.source}`, 'i'));
      if (mPrefix) return parseFloat(mPrefix[1]);
      const mSuffix = text.match(new RegExp(`${regex.source}\\s*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?)`, 'i'));
      if (mSuffix && mSuffix[1]) return parseFloat(mSuffix[1]);
      return null;
    }

    // Explicit code mention check
    const explicit = this.extractExplicitCode(text, 10);
    if (explicit && RoofTaxonomy.GEOMETRY[explicit]) {
      candidates.push({ code: explicit, percent: defaultPct, isExplicitCode: true });
    }

    // 10. Gambrel
    if (/\bgambrel\b/i.test(lower) || /\bbarn\s*(?:roof|style)\b/i.test(lower)) {
      candidates.push({ code: '10', percent: getPct(/\b(?:gambrel|barn\s*(?:roof|style))\b/) });
    }
    // 8. Gable with bracing vs 2. Gable without bracing
    if (/\bgable\b/i.test(lower) && /\b(?:with\s*bracing|braced|reinforced|strapped)\b/i.test(lower)) {
      candidates.push({ code: '8', percent: getPct(/\bgable\b/) });
    } else if (/\bgable\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\bgable\b/) });
    }
    // 9. Pyramid
    if (/\bpyramid(?:al)?\b/i.test(lower)) {
      candidates.push({ code: '9', percent: getPct(/\bpyramid(?:al)?\b/) });
    }
    // 3. Hip
    if (/\bhip(?:ped)?\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\bhip(?:ped)?\b/) });
    }
    // 7. Mansard
    if (/\bmansard\b/i.test(lower) || /\bfrench\s*roof\b/i.test(lower)) {
      candidates.push({ code: '7', percent: getPct(/\b(?:mansard|french\s*roof)\b/) });
    }
    // 6. Shed
    if (/\b(?:shed|skillion|mono[-\s]?pitch|single\s*pitch|single\s*slope|lean[-\s]?to)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:shed|skillion|mono[-\s]?pitch|single\s*pitch|single\s*slope|lean[-\s]?to)\b/) });
    }
    // 5. Stepped
    if (/\b(?:stepped?|terraced|clerestory)\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\b(?:stepped?|terraced|clerestory)\b/) });
    }
    // 4. Complex
    if (/\b(?:complex|multi[-\s]?gable|cross[-\s]?gable|irregular|combination|custom\s*geometry|turret|dome|barrel|arch(?:ed)?)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:complex|multi[-\s]?gable|cross[-\s]?gable|irregular)\b/) });
    }
    // 1. Flat
    if (/\bflat\b/i.test(lower) || /\blevel\s*roof\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\bflat\b/) });
    }

    // Fuzzy matching fallback if regex didn't catch anything
    if (candidates.length === 0) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.GEOMETRY, defaultPct, 0.72));
    }

    return candidates;
  },

  /**
   * Detect all pitch candidates in a text segment
   */
  findPitchCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    function getPct(regex) {
      if (defaultPct !== null && defaultPct !== undefined) return defaultPct;
      const mPrefix = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${regex.source}`, 'i'));
      if (mPrefix) return parseFloat(mPrefix[1]);
      const mSuffix = text.match(new RegExp(`${regex.source}\\s*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?)`, 'i'));
      if (mSuffix && mSuffix[1]) return parseFloat(mSuffix[1]);
      return null;
    }

    // Ratio check (e.g. 4:12, 12:12, 12:12 to 24:12)
    const ratioMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*(?:[:/]|in|-)\s*12\b/);
    if (ratioMatch) {
      const rise = parseFloat(ratioMatch[1]);
      const angle = Math.atan(rise / 12) * (180 / Math.PI);
      let code = '2';
      if (angle < 10 || rise <= 2.11) code = '1';
      else if (rise <= 7.5 || angle <= 31) code = '2';
      else code = '3';
      candidates.push({ code, percent: defaultPct, isExplicit: true, rise: `${rise}:12` });
    }

    // Degree check
    const degMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*(?:deg|degree|degrees|°)\b/);
    if (degMatch) {
      const deg = parseFloat(degMatch[1]);
      let code = '2';
      if (deg < 10) code = '1';
      else if (deg <= 30.5) code = '2';
      else code = '3';
      candidates.push({ code, percent: defaultPct, isExplicit: true, deg: deg });
    }

    // Verbal pitch cues
    if (/\b(?:low\s*pitch|low\s*slope|shallow\s*pitch|nearly\s*flat|flat\s*pitch|<10|less\s*than\s*10)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\b(?:low\s*pitch|low\s*slope|shallow\s*pitch)\b/), isExplicit: true });
    }
    if (/\b(?:high\s*pitch|high\s*slope|steep\s*pitch|steep\s*slope|steep|sharp\s*pitch|>30|greater\s*than\s*30|more\s*than\s*30)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\b(?:high\s*pitch|high\s*slope|steep\s*pitch|steep\s*slope|steep)\b/), isExplicit: true });
    }
    if (/\b(?:medium\s*pitch|medium\s*slope|mod(?:erate)?\s*pitch|mod(?:erate)?\s*slope|standard\s*pitch|normal\s*pitch|10\s*to\s*30)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:medium\s*pitch|medium\s*slope)\b/), isExplicit: true });
    }

    // Implied pitch from Flat geometry
    if (/\bflat\b/i.test(lower) && !candidates.some(c => c.isExplicit)) {
      candidates.push({ code: '1', percent: getPct(/\bflat\b/), isImplied: true });
    }

    // Fuzzy pitch fallback
    if (candidates.length === 0) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.PITCH, defaultPct, 0.75));
    }

    return candidates;
  },

  /**
   * Detect all deck candidates in a text segment
   */
  findDeckCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    function getPct(regex) {
      if (defaultPct !== null && defaultPct !== undefined) return defaultPct;
      const mPrefix = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${regex.source}`, 'i'));
      if (mPrefix) return parseFloat(mPrefix[1]);
      const mSuffix = text.match(new RegExp(`${regex.source}\\s*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?)`, 'i'));
      if (mSuffix && mSuffix[1]) return parseFloat(mSuffix[1]);
      return null;
    }

    // Explicit code mention check
    const explicit = this.extractExplicitCode(text, 8);
    if (explicit && RoofTaxonomy.DECK[explicit]) {
      candidates.push({ code: explicit, percent: defaultPct, isExplicitCode: true });
    }

    // 8. Light metal deck
    if (/\b(?:light\s*(?:metal|gauge|steel)|bare\s*(?:metal|steel)|uninsulated\s*(?:metal|steel))\s*(?:deck|decking)?\b/i.test(lower) ||
      /\bcorrugated\s*(?:steel|metal)\s*deck\b/i.test(lower)) {
      candidates.push({ code: '8', percent: getPct(/\b(?:light\s*(?:metal|steel)|bare\s*(?:metal|steel))\b/) });
    }

    // 4. Metal deck with insulation board
    if (/\b(?:metal|steel)\s*deck.*(?:insulat|rigid|polyiso|iso\s*board|board)\b/i.test(lower) ||
      /\b(?:insulat|rigid|polyiso).*(?:metal|steel)\s*deck\b/i.test(lower) ||
      /\bb[-\s]?deck.*(?:insulat|rigid|polyiso)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:metal|steel)\s*deck\b/) });
    }

    // 5. Metal deck with concrete
    if (/\b(?:metal|steel)\s*deck.*(?:concrete|lwc|topping)\b/i.test(lower) ||
      /\bconcrete.*(?:on|over).*(?:metal|steel)\s*deck\b/i.test(lower) ||
      /\bcomposite\s*(?:metal|steel)\s*deck\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\b(?:metal|steel)\s*deck.*(?:concrete|topping)\b/) });
    }

    // 6. Pre-cast concrete slabs
    if (/\b(?:pre[-\s]?cast|hollow[-\s]?core|pre[-\s]?stressed)\s*(?:concrete|slabs?|planks?|decks?|tees?)\b/i.test(lower) ||
      /\b(?:gypsum|siporex)\s*slabs?\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:pre[-\s]?cast|hollow[-\s]?core)\b/) });
    }

    // 7. Reinforced concrete slabs / Concrete deck
    if (/\b(?:reinforced\s*concrete|rc\s*slabs?|cast[-\s]?in[-\s]?place|cip|poured\s*concrete|monolithic\s*concrete)\s*(?:slabs?|decks?|roofs?)?\b/i.test(lower) ||
      (/\bconcrete\s*(?:deck|decking|slabs?)\b/i.test(lower) && !candidates.some(c => c.code === '5' || c.code === '6'))) {
      candidates.push({ code: '7', percent: getPct(/\bconcrete\b/) });
    }

    // Generic metal deck (defaults to 4)
    if (!candidates.some(c => c.code === '4' || c.code === '5' || c.code === '8') && /\b(?:metal|steel)\s*deck(?:ing)?\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:metal|steel)\s*deck\b/) });
    }

    // 3. Particle board / OSB
    if (/\b(?:osb|oriented\s*strand|particle\s*boards?|waferboards?|aspenite|chipboards?)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\b(?:osb|particle\s*board)\b/) });
    }

    // 2. Wood planks / T&G
    if (/\b(?:wood\s*planks?|wooden\s*planks?|tongue\s*(?:and|&)\s*grooves?|t\s*&\s*g|t\s*and\s*g|wood\s*boards?|timber\s*decks?|1x\d+\s*planks?)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:wood\s*planks?|tongue\s*and\s*groove|t\s*&\s*g)\b/) });
    }

    // 1. Plywood
    if (/\b(?:plywood|cdx|ply\s*sheathing|ply\s*decks?|\d+\/\d+["\s]*(?:cdx|plywood))\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\b(?:plywood|cdx)\b/) });
    }

    // Generic wood deck (defaults to Plywood 1)
    if (!candidates.some(c => c.code === '1' || c.code === '2' || c.code === '3') && /\b(?:wood\s*deck(?:ing)?|wood\s*sheathing|timber\s*roof\s*deck)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\bwood\s*deck\b/) });
    }

    // Solitary steel/metal when not clearly a covering
    if (!candidates.length && /\b(?:steel|metal)\b/i.test(lower) && !/\b(?:shingle|tile|membrane|bur|roofing|slate)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:steel|metal)\b/) });
    }

    // Fuzzy matching fallback if regex didn't match
    if (candidates.length === 0) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.DECK, defaultPct, 0.72));
    }

    return candidates;
  },

  /**
   * Detect all covering candidates in a text segment
   */
  findCoveringCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    function getPct(regex) {
      if (defaultPct !== null && defaultPct !== undefined) return defaultPct;
      const mPrefix = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${regex.source}`, 'i'));
      if (mPrefix) return parseFloat(mPrefix[1]);
      const mSuffix = text.match(new RegExp(`${regex.source}\\s*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?)`, 'i'));
      if (mSuffix && mSuffix[1]) return parseFloat(mSuffix[1]);
      return null;
    }

    // Explicit code mention check, e.g. "Single-ply membrane (7)", "Code 7"
    const explicit = this.extractExplicitCode(text, 12);
    if (explicit && RoofTaxonomy.COVERING[explicit]) {
      candidates.push({ code: explicit, percent: defaultPct, isExplicitCode: true });
    }

    // 12. Photovoltaic / Solar
    if (/\b(?:photovoltaic|solar\s*roof|solar\s*shingles?|bipv|solar\s*panels?|solar\s*array|pv\s*panels?)\b/i.test(lower)) {
      candidates.push({ code: '12', percent: getPct(/\b(?:photovoltaic|solar|bipv)\b/) });
    }

    // 11. Hurricane wind-rated
    if (/\b(?:hurricane\s*(?:wind[-\s]?)?rated|high\s*wind\s*rated|wind\s*rated|miami[-\s]?dade(?:\s*noa)?|fm\s*1[-\s]?(?:90|120)|tas\s*106|ul\s*580)\b/i.test(lower)) {
      candidates.push({ code: '11', percent: getPct(/\b(?:hurricane|high\s*wind|miami[-\s]?dade)\b/) });
    }

    // 8. Standing seam metal
    if (/\b(?:standing[-\s]?seam|ssmr|architectural\s*standing[-\s]?seam|standing[-\s]?seam\s*(?:steel|metal|aluminum))\b/i.test(lower)) {
      candidates.push({ code: '8', percent: getPct(/\bstanding[-\s]?seam\b/) });
    }

    // 10. Single-ply ballasted
    if (/\b(?:ballasted\s*(?:membrane|single[-\s]?ply|epdm|tpo|pvc)|single[-\s]?ply.*ballasted|gravel\s*ballasted\s*(?:single[-\s]?ply|membrane))\b/i.test(lower)) {
      candidates.push({ code: '10', percent: getPct(/\bballasted\b/) });
    }

    // 7. Single-ply membrane (Handles "single ply", "single-ply", "singleply", "1-ply", "epdm", "tpo", "pvc", etc.)
    if (!candidates.some(c => c.code === '10') &&
      (/\b(?:(?:single|1|one)[-\s]?ply(?:\s*(?:membrane|roof(?:ing)?|sheet))?|epdm|tpo|pvc(?:\s*membrane)?|rubber\s*(?:membrane|roof)|elastomeric\s*membrane|adhered\s*membrane|membrane,?\s*single[-\s]?ply|thermoplastic)\b/i.test(lower) ||
      (/\bmembrane\b/i.test(lower) && !/\b(?:bur|waterproof\s*deck)\b/i.test(lower)))) {
      candidates.push({ code: '7', percent: getPct(/\b(?:single[-\s]?ply|epdm|tpo|pvc|rubber|membrane)\b/) });
    }

    // 6. BUR with gravel (handles "built up with gravel", "built up/tar and gravel", "tar & gravel", "tar/gravel")
    if (/\b(?:built[-\s]?up.*(?:gravel|tar)|bur.*(?:gravel|tar)|tar\s*(?:and|&|\/)\s*gravel|asphalt\s*(?:and|&|\/)\s*gravel|pea\s*gravel\s*roof)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:gravel.*bur|bur.*gravel|tar\s*(?:and|&|\/)\s*gravel|built[-\s]?up.*gravel)\b/) });
    }

    // 9. Smooth BUR / Mod-Bit (handles "built up, smooth", "built up smooth", "smooth bur", "modified bitumen", etc.)
    if (/\b(?:built[-\s]?up,?\s*smooth|smooth\s*(?:surface\s*)?(?:bur|built[-\s]?up)|bur,?\s*smooth|modified\s*bitumen|mod[-\s]?bit(?:umen)?|sbs|app|torch[-\s]?down|smooth\s*bur|bur.*without\s*gravel|built[-\s]?up.*without\s*gravel|roll\s*roofing|cap\s*sheet)\b/i.test(lower)) {
      candidates.push({ code: '9', percent: getPct(/\b(?:built[-\s]?up,?\s*smooth|modified\s*bitumen|mod[-\s]?bit|smooth\s*bur)\b/) });
    }

    // Generic BUR (defaults to 6)
    if (!candidates.some(c => c.code === '6' || c.code === '9') && /\b(?:built[-\s]?up(?:\s*roof)?|bur)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:built[-\s]?up|bur)\b/) });
    }

    // 5. Slate
    if (/\b(?:slate|vermont\s*slate|slate\s*tiles?|natural\s*slate)\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\bslate\b/) });
    }

    // 3. Clay / concrete tiles (handles "tiles, clay", "tiles, concrete", etc.)
    if (/\b(?:clay\s*tiles?|concrete\s*tiles?|tiles?,?\s*clay|tiles?,?\s*concrete|spanish\s*tiles?|barrel\s*tiles?|terra\s*cotta|mission\s*tiles?|cement\s*tiles?|s[-\s]?tiles?|tiles?\s*roof)\b/i.test(lower) ||
      (/\btiles?\b/i.test(lower) && !/\b(?:floor|wall|carpet)\b/i.test(lower))) {
      candidates.push({ code: '3', percent: getPct(/\btiles?\b/) });
    }

    // 2. Wooden shingles
    if (/\b(?:wood(?:en)?\s*shingles?|shingles?,?\s*wood|wood(?:en)?\s*shakes?|cedar\s*shakes?|cedar\s*shingles?|shakes?\s*roof|shakes?)\b/i.test(lower) &&
      !/\basphalt\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:wood(?:en)?\s*shingles?|shakes?)\b/) });
    }

    // 1. Asphalt shingles (handles "shingles, asphalt", "3-tab", "architectural shingles")
    if (/\b(?:asphalt\s*shingles?|shingles?,?\s*asphalt|composition\s*shingles?|comp\s*shingles?|3[-\s]?tab|architectural\s*shingles?|fiberglass\s*shingles?|laminate\s*shingles?|shingles?|asphalt\s*roofing)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\b(?:asphalt\s*shingles?|shingles?)\b/) });
    }

    // 4. Light metal panels (handles "steel", "copper", "metal panels", "corrugated steel", etc.)
    if (/\b(?:light\s*metal|metal\s*panels?|panels?,?\s*metal|steel\s*panels?|panels?,?\s*steel|corrugated\s*(?:metal|steel|iron|tin)|metal\s*sheets?|sheet\s*metal|tin\s*roof|r[-\s]?panels?|5v\s*crimp|steel\s*roofing|metal\s*roofing|copper)\b/i.test(lower) ||
      (!candidates.some(c => c.code === '8') && /\b(?:steel|metal|aluminum|copper)\b/i.test(lower))) {
      candidates.push({ code: '4', percent: getPct(/\b(?:light\s*metal|metal\s*panels?|corrugated\s*metal|steel|metal|copper)\b/) });
    }

    // Fuzzy matching fallback if regex didn't match
    if (candidates.length === 0) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.COVERING, defaultPct, 0.70));
    }

    return candidates;
  },

  /**
   * Detect all roof anchorage candidates in a text segment
   */
  findAnchorageCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    function getPct(regex) {
      if (defaultPct !== null && defaultPct !== undefined) return defaultPct;
      const mPrefix = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${regex.source}`, 'i'));
      if (mPrefix) return parseFloat(mPrefix[1]);
      const mSuffix = text.match(new RegExp(`${regex.source}\\s*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?)`, 'i'));
      if (mSuffix && mSuffix[1]) return parseFloat(mSuffix[1]);
      return null;
    }

    // Explicit code mention check (e.g. "Anchorage: 1" or "Hurricane Ties (1)")
    const explicitAnchorMatch = text.match(/(?:anchor(?:age)?|ties?|connection)[\s:]*(?:code\s*|#|\(\s*)?([0-7])(?:\s*\)|\b)/i);
    if (explicitAnchorMatch && RoofTaxonomy.ANCHORAGE[explicitAnchorMatch[1]]) {
      candidates.push({ code: explicitAnchorMatch[1], percent: defaultPct, isExplicitCode: true });
    }

    // 1. Hurricane Ties
    if (/\b(?:hurricane\s*(?:ties?|straps?|clips?|anchors?|tie[\s-]down)|seismic\s*(?:ties?|straps?)|uplift\s*straps?|rafter\s*ties?|truss\s*ties?)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\b(?:hurricane\s*(?:ties?|straps?|clips?|anchors?|tie[\s-]down)|seismic\s*(?:ties?|straps?)|uplift\s*straps?|rafter\s*ties?|truss\s*ties?)\b/) });
    }

    // 2. Nails/Screws
    if (/\b(?:nails?(?:\s*\/\s*screws?)?|screws?(?:\s*\/\s*nails?)?|toe[\s-]?nail(?:ed|ing)?|nailed|screwed|fasteners?)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:nails?(?:\s*\/\s*screws?)?|screws?(?:\s*\/\s*nails?)?|toe[\s-]?nail(?:ed|ing)?|nailed|screwed)\b/) });
    }

    // 3. Anchor bolts
    if (/\b(?:anchor\s*bolts?|anchored\s*(?:by|with)?\s*bolts?|through[\s-]?bolts?|expansion\s*bolts?|bolted\s*(?:connection|anchorage)?)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\b(?:anchor\s*bolts?|through[\s-]?bolts?|expansion\s*bolts?|bolted)\b/) });
    }

    // 4. Gravity/friction
    if (/\b(?:gravity\s*(?:\/|\s*or\s*|\s+)?friction|gravity(?:\s*load)?\s*only|friction\s*only|unanchored|no\s*(?:anchorage|ties|straps))\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:gravity|friction|unanchored)\b/) });
    }

    // 5. Adhesive epoxy
    if (/\b(?:adhesive\s*epoxy|epoxy\s*(?:anchors?|anchored|adhesive)?|chemical\s*anchors?|resin\s*anchors?|adhesives?\s*anchors?)\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\b(?:adhesive|epoxy)\b/) });
    }

    // 6. Structurally Connected
    if (/\b(?:structurally\s*connected|structural\s*connection|structurally\s*anchored|monolithic(?:ally)?\s*(?:connected|tied)?|concrete\s*tie[\s-]?beam|reinforced\s*tie[\s-]?beam|welded\s*(?:connection|anchorage)?|embedded\s*plates?)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:structurally\s*connected|structural\s*connection|tie[\s-]?beam|welded)\b/) });
    }

    // 7. Clips (when not hurricane clips)
    if (/\b(?:clips?|framing\s*clips?|metal\s*clips?|roof\s*clips?|simpson\s*clips?)\b/i.test(lower) && !/\bhurricane\b/i.test(lower)) {
      candidates.push({ code: '7', percent: getPct(/\b(?:clips?|framing\s*clips?|metal\s*clips?|roof\s*clips?|simpson\s*clips?)\b/) });
    }

    // Fuzzy matching fallback if regex didn't match
    if (candidates.length === 0 && this.SYNONYMS.ANCHORAGE) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.ANCHORAGE, defaultPct, 0.70));
    }

    return candidates;
  },

  /**
   * Resolver function:
   * Rule 1: If percentage values exist, pick HIGHER %
   * Rule 2: If tied percentage or no percentage, pick WEAKER material
   */
  resolveCandidates(candidates, weaknessMap, categoryName) {
    if (!candidates || candidates.length === 0) return '';
    if (candidates.length === 1) return candidates[0].code;

    // Deduplicate by code, keeping highest percentage if duplicate codes exist
    const codeMap = {};
    for (const c of candidates) {
      if (!codeMap[c.code]) {
        codeMap[c.code] = c;
      } else {
        const existing = codeMap[c.code];
        const curPct = c.percent !== null && c.percent !== undefined ? c.percent : -1;
        const exPct = existing.percent !== null && existing.percent !== undefined ? existing.percent : -1;
        if (curPct > exPct) {
          codeMap[c.code] = c;
        }
      }
    }

    const unique = Object.values(codeMap);
    if (unique.length === 1) return unique[0].code;

    // Check if any candidate has an explicit percentage
    const withPct = unique.filter(c => c.percent !== null && c.percent !== undefined && !isNaN(c.percent));

    if (withPct.length > 0) {
      // Sort by percentage descending; tie-breaker: weaker material
      unique.sort((a, b) => {
        const pA = a.percent !== null && a.percent !== undefined ? a.percent : -1;
        const pB = b.percent !== null && b.percent !== undefined ? b.percent : -1;
        if (pB !== pA) return pB - pA; // Higher % wins
        // Tie-breaker: weaker material (higher weakness score)
        const wA = weaknessMap[a.code] || 0;
        const wB = weaknessMap[b.code] || 0;
        return wB - wA;
      });
      return unique[0].code;
    }

    // No percentages present: pick WEAKER material (higher weakness score)
    unique.sort((a, b) => {
      const wA = weaknessMap[a.code] || 0;
      const wB = weaknessMap[b.code] || 0;
      return wB - wA;
    });

    return unique[0].code;
  },

  /**
   * Convenience backward-compatible detection functions
   */
  detectPitch(text) {
    const candidates = this.findPitchCandidates(text, null);
    return candidates.length > 0 ? candidates[0] : null;
  },

  detectGeometry(text) {
    const candidates = this.findGeometryCandidates(text, null);
    return candidates.length > 0 ? candidates[0].code : null;
  },

  detectDeck(text) {
    const candidates = this.findDeckCandidates(text, null);
    return candidates.length > 0 ? candidates[0].code : null;
  },

  detectCovering(text) {
    const candidates = this.findCoveringCandidates(text, null);
    return candidates.length > 0 ? candidates[0].code : null;
  },

  /**
   * Parse a single row or tab-delimited row into the 4 components
   * Applies Underwriting Rules:
   * 1. If percentage values exist, pick HIGHER %
   * 2. If no percentage values exist, pick WEAKER material (most vulnerable)
   */
  parseRoofRow(rawRow, options = {}) {
    if (!rawRow) rawRow = '';
    const str = String(rawRow).trim();
    if (!str || /^(?:n\/?a|n\.a\.?|none|null|nil|not\s*applicable|-+|—+|\.)$/i.test(str)) {
      return {
        original: rawRow,
        geometryCode: '',
        geometry: '',
        geometryName: '',
        geometryShort: '',
        pitchCode: '',
        pitch: '',
        pitchName: '',
        pitchShort: '',
        coveringCode: '',
        covering: '',
        coveringName: '',
        coveringShort: '',
        deckCode: '',
        deck: '',
        deckName: '',
        deckShort: '',
        anchorageCode: '',
        anchorage: '',
        anchorageName: '',
        anchorageShort: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank'
      };
    }

    // Unknown / 0-unknown: any input that is purely "unknown" or "0-unknown" (or variants)
    // maps all five roof fields to code 0 (Unknown/default).
    if (/^(?:0\s*[-\/]\s*)?unknown\s*(?:[-\/]\s*0)?$/i.test(str) || /^0\s*[-\/]?\s*unknown$/i.test(str)) {
      const unknownDisplay = (fmt) => fmt === 'code_only' ? '0' : fmt === 'name_only' ? 'Unknown/default' : fmt === 'short_code' ? 'Unknown (0)' : 'Unknown/default (0)';
      const fmt = options.format || 'code_only';
      return {
        original: rawRow,
        geometryCode: '0',
        geometry: unknownDisplay(fmt),
        geometryName: 'Unknown/default',
        geometryShort: 'Unknown',
        pitchCode: '0',
        pitch: unknownDisplay(fmt),
        pitchName: 'Unknown/default',
        pitchShort: 'Unknown',
        coveringCode: '0',
        covering: unknownDisplay(fmt),
        coveringName: 'Unknown/default',
        coveringShort: 'Unknown',
        deckCode: '0',
        deck: unknownDisplay(fmt),
        deckName: 'Unknown/default',
        deckShort: 'Unknown',
        anchorageCode: '0',
        anchorage: unknownDisplay(fmt),
        anchorageName: 'Unknown/default',
        anchorageShort: 'Unknown',
        recognizedCount: 5,
        status: 'match',
        statusText: '✓ Complete (All 5 Fields Identified)'
      };
    }

    // If input is tab-separated (from Excel multi-column copy)
    const columns = str.includes('\t') ? str.split('\t').map(c => c.trim()).filter(Boolean) : [str];
    const fullText = columns.join(', ');

    // 1. Parse segments across all columns
    const segments = [];
    columns.forEach(col => {
      segments.push(...this.parseSegments(col));
    });

    const geomCandidates = [];
    const pitchCandidates = [];
    const deckCandidates = [];
    const covCandidates = [];
    const anchorCandidates = [];

    for (const seg of segments) {
      geomCandidates.push(...this.findGeometryCandidates(seg.text, seg.percent));
      pitchCandidates.push(...this.findPitchCandidates(seg.text, seg.percent));
      deckCandidates.push(...this.findDeckCandidates(seg.text, seg.percent));
      covCandidates.push(...this.findCoveringCandidates(seg.text, seg.percent));
      anchorCandidates.push(...this.findAnchorageCandidates(seg.text, seg.percent));
    }

    // Fallback full-text scan if any field wasn't found via segments
    if (geomCandidates.length === 0) geomCandidates.push(...this.findGeometryCandidates(fullText, null));
    if (pitchCandidates.length === 0) pitchCandidates.push(...this.findPitchCandidates(fullText, null));
    if (deckCandidates.length === 0) deckCandidates.push(...this.findDeckCandidates(fullText, null));
    if (covCandidates.length === 0) covCandidates.push(...this.findCoveringCandidates(fullText, null));
    if (anchorCandidates.length === 0) anchorCandidates.push(...this.findAnchorageCandidates(fullText, null));

    // Resolve Geometry
    let geomCode = this.resolveCandidates(geomCandidates, this.GEOMETRY_WEAKNESS, 'geometry');

    // Resolve Pitch: prioritize explicit pitch over implied pitch
    let pitchCode = '';
    const explicitPitch = pitchCandidates.filter(c => c.isExplicit);
    if (explicitPitch.length > 0) {
      pitchCode = this.resolveCandidates(explicitPitch, this.PITCH_WEAKNESS, 'pitch');
    } else {
      pitchCode = this.resolveCandidates(pitchCandidates, this.PITCH_WEAKNESS, 'pitch');
    }

    // Cross-resolution: Flat implies low pitch (1) if no pitch was explicitly detected
    if (geomCode === '1' && !pitchCode) {
      pitchCode = '1';
    }
    if (!geomCode && pitchCode === '1' && /\bflat\b/i.test(fullText)) {
      geomCode = '1';
    }

    // Direct numeric code in input fallback (e.g. single number "1" or "2")
    if (!geomCode && /^\d+$/.test(str) && RoofTaxonomy.GEOMETRY[str]) {
      geomCode = str;
    }

    // Resolve Covering, Deck & Anchorage
    let covCode = this.resolveCandidates(covCandidates, this.COVERING_WEAKNESS, 'covering');
    let deckCode = this.resolveCandidates(deckCandidates, this.DECK_WEAKNESS, 'deck');
    let anchorCode = this.resolveCandidates(anchorCandidates, this.ANCHORAGE_WEAKNESS, 'anchorage');

    // Resolve labels
    const geomObj = RoofTaxonomy.GEOMETRY[geomCode];
    const pitchObj = RoofTaxonomy.PITCH[pitchCode];
    const covObj = RoofTaxonomy.COVERING[covCode];
    const deckObj = RoofTaxonomy.DECK[deckCode];
    const anchorObj = RoofTaxonomy.ANCHORAGE[anchorCode];

    const format = options.format || 'code_only';

    let geomDisplay = '';
    if (geomObj) {
      if (format === 'code_only') geomDisplay = geomObj.code;
      else if (format === 'name_only') geomDisplay = geomObj.name;
      else if (format === 'short_code') geomDisplay = `${geomObj.shortName} (${geomObj.code})`;
      else geomDisplay = `${geomObj.name} (${geomObj.code})`;
    }

    let pitchDisplay = '';
    if (pitchObj) {
      if (format === 'code_only') pitchDisplay = pitchObj.code;
      else if (format === 'name_only') pitchDisplay = pitchObj.name;
      else if (format === 'short_code') pitchDisplay = `${pitchObj.shortName} (${pitchObj.code})`;
      else pitchDisplay = `${pitchObj.name} (${pitchObj.code})`;
    }

    let covDisplay = '';
    if (covObj) {
      if (format === 'code_only') covDisplay = covObj.code;
      else if (format === 'name_only') covDisplay = covObj.name;
      else if (format === 'short_code') covDisplay = `${covObj.shortName} (${covObj.code})`;
      else covDisplay = `${covObj.name} (${covObj.code})`;
    }

    let deckDisplay = '';
    if (deckObj) {
      if (format === 'code_only') deckDisplay = deckObj.code;
      else if (format === 'name_only') deckDisplay = deckObj.name;
      else if (format === 'short_code') deckDisplay = `${deckObj.shortName} (${deckObj.code})`;
      else deckDisplay = `${deckObj.name} (${deckObj.code})`;
    }

    let anchorDisplay = '';
    if (anchorObj) {
      if (format === 'code_only') anchorDisplay = anchorObj.code;
      else if (format === 'name_only') anchorDisplay = anchorObj.name;
      else if (format === 'short_code') anchorDisplay = `${anchorObj.shortName} (${anchorObj.code})`;
      else anchorDisplay = `${anchorObj.name} (${anchorObj.code})`;
    }

    const recognizedCount = (geomCode ? 1 : 0) + (pitchCode ? 1 : 0) + (covCode ? 1 : 0) + (deckCode ? 1 : 0) + (anchorCode ? 1 : 0);

    let status = 'assigned';
    let statusText = `Separated (${recognizedCount}/5 Fields)`;
    if (recognizedCount === 5) {
      status = 'match';
      statusText = '✓ Complete (All 5 Fields Identified)';
    } else if (recognizedCount === 0) {
      status = 'mismatch';
      statusText = '⚠️ Unrecognized Roof Format';
    }

    return {
      original: rawRow,
      geometryCode: geomCode || '',
      geometry: geomDisplay,
      geometryName: geomObj ? geomObj.name : '',
      geometryShort: geomObj ? geomObj.shortName : '',
      pitchCode: pitchCode || '',
      pitch: pitchDisplay,
      pitchName: pitchObj ? pitchObj.name : '',
      pitchShort: pitchObj ? pitchObj.shortName : '',
      coveringCode: covCode || '',
      covering: covDisplay,
      coveringName: covObj ? covObj.name : '',
      coveringShort: covObj ? covObj.shortName : '',
      deckCode: deckCode || '',
      deck: deckDisplay,
      deckName: deckObj ? deckObj.name : '',
      deckShort: deckObj ? deckObj.shortName : '',
      anchorageCode: anchorCode || '',
      anchorage: anchorDisplay,
      anchorageName: anchorObj ? anchorObj.name : '',
      anchorageShort: anchorObj ? anchorObj.shortName : '',
      recognizedCount,
      status,
      statusText
    };
  },

  /**
   * Process a column of roof description data
   */
  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      const parsed = this.parseRoofRow(line, options);
      // Cleaned output contains pure codes for direct Excel columns (Geom\tPitch\tCov\tDeck\tAnchor)
      const cleaned = [
        parsed.geometryCode || '',
        parsed.pitchCode || '',
        parsed.coveringCode || '',
        parsed.deckCode || '',
        parsed.anchorageCode || ''
      ].join('\t');

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: cleaned,
        geometry: parsed.geometry,
        geometryCode: parsed.geometryCode,
        geometryName: parsed.geometryName,
        geometryShort: parsed.geometryShort,
        pitch: parsed.pitch,
        pitchCode: parsed.pitchCode,
        pitchName: parsed.pitchName,
        pitchShort: parsed.pitchShort,
        covering: parsed.covering,
        coveringCode: parsed.coveringCode,
        coveringName: parsed.coveringName,
        coveringShort: parsed.coveringShort,
        deck: parsed.deck,
        deckCode: parsed.deckCode,
        deckName: parsed.deckName,
        deckShort: parsed.deckShort,
        anchorage: parsed.anchorage,
        anchorageCode: parsed.anchorageCode,
        anchorageName: parsed.anchorageName,
        anchorageShort: parsed.anchorageShort,
        recognizedCount: parsed.recognizedCount,
        changed: true,
        status: parsed.status,
        statusText: parsed.statusText
      });
    });

    return results;
  }
};

// Wire up roof cleaner reference
CleanersRegistry.roof.cleaner = RoofClassifier;

/**
 * CleanExcel - Touchstone UNICEDE® Exterior Wall Detail Fields Taxonomy & Classifier Engine
 * Analyzes and classifies exterior wall descriptions into 2 distinct Touchstone fields:
 * 1. WallType (Codes 0–9): Structural / Backing Wall Material
 * 2. WallSiding (Codes 0–8): Exterior Weather Protection / Cladding Finish
 * 
 * Enforces Underwriting Multi-Component Rules:
 * Rule 1 (With %): Higher percentage wins (e.g. 70% Brick / 30% Vinyl -> Brick 1)
 * Rule 2 (No %): Weaker material wins (e.g. Brick & Vinyl -> Vinyl 4)
 * Rule 3 (50%/50% Tie): Weaker material wins (e.g. 50% Brick / 50% Vinyl -> Vinyl 4)
 * 
 * Reference: https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-wall-detail-fields.html?hl=wall
 */
const WallTaxonomy = {
  get WALL_TYPE() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.WALL_TYPE) || {}; },
  get WALL_SIDING() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.WALL_SIDING) || {}; }
};

const WallClassifier = {
  taxonomy: WallTaxonomy,

  // Underwriting Vulnerability / Weakness rankings (higher score = weaker material / higher risk)
  WALL_TYPE_WEAKNESS: {
    '9': 100, // Gypsum board (weakest against moisture, shear, wind missiles)
    '5': 90,  // Particle board / OSB (vulnerable to water swelling & lower fastener shear)
    '4': 80,  // Wood planks (horizontal/diagonal boards, prone to splitting)
    '3': 70,  // Plywood (wood frame sheathing, combustible, weaker than masonry/concrete)
    '1': 60,  // Brick / unreinforced masonry (extreme seismic hazard, collapse prone)
    '6': 50,  // Metal panels (light gauge steel/aluminum panels, tear-off hazard)
    '7': 30,  // Pre-cast concrete elements (high mass, connection vulnerabilities in EQ)
    '2': 20,  // Reinforced masonry (grouted CMU with rebar, strong resistance)
    '8': 10,  // Cast-in-place concrete (strongest monolithic structural wall)
    '0': 0
  },

  WALL_SIDING_WEAKNESS: {
    '4': 100, // Aluminum / vinyl siding (weakest against wind peel-off, hail puncture, fire melting)
    '2': 90,  // Wood shingles (combustible, wind peel-off, weather rot)
    '3': 80,  // Clapboards (wood lap siding, combustible, wind uplift)
    '6': 70,  // EIFS (Synthetic stucco over foam, highly vulnerable to hail/impact and water leaks)
    '7': 50,  // Stucco (traditional cement plaster, brittle under racking, but non-combustible)
    '8': 40,  // Fiber cement board (HardiePlank, Class A fire, engineered cementitious)
    '5': 30,  // Stone panels (heavy cladding, high fire and wind resistance)
    '1': 20,  // Veneer brick / masonry (strongest exterior envelope against wind, hail, fire)
    '0': 0
  },

  /**
   * Split text into semantic segments, preserving percentages
   */
  parseSegments(raw) {
    if (!raw || typeof raw !== 'string') return [];
    const text = raw.trim();
    if (!text) return [];

    let parts = [];
    if (text.includes(';')) {
      parts = text.split(';');
    } else if (text.includes('\n')) {
      parts = text.split('\n');
    } else if (text.includes('|')) {
      parts = text.split('|');
    } else if (text.includes('/') && /\d+\s*%/.test(text)) {
      parts = text.split('/');
    } else if (text.includes(',') && (text.match(/%/g) || []).length > 1) {
      parts = text.split(',');
    } else if (/\band\b|\b&\b/i.test(text) && !text.includes('%')) {
      // e.g. "Brick Veneer and Vinyl Siding", "Stucco and Clapboard"
      parts = text.split(/\band\b|\b&\b/i);
    } else if (text.includes('/') && !text.includes('%')) {
      // e.g. "Brick / Vinyl", "Masonry / Wood Siding"
      parts = text.split('/');
    } else {
      parts = [text];
    }

    const segments = [];
    for (let p of parts) {
      p = p.trim();
      if (!p) continue;
      let pct = null;
      const match = p.match(/(?:\(?\s*(\d+(?:\.\d+)?)\s*%\s*\)?)/);
      if (match) {
        pct = parseFloat(match[1]);
      }
      segments.push({ text: p, percent: pct });
    }

    return segments;
  },

  /**
   * Detect structural wall / backing material candidates (WallType: Codes 0–9)
   */
  findWallTypeCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    function getPct(regex) {
      if (defaultPct !== null && defaultPct !== undefined) return defaultPct;
      const mPrefix = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${regex.source}`, 'i'));
      if (mPrefix) return parseFloat(mPrefix[1]);
      const mSuffix = text.match(new RegExp(`${regex.source}\\s*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?)`, 'i'));
      if (mSuffix && mSuffix[1]) return parseFloat(mSuffix[1]);
      return null;
    }

    // 9. Gypsum board
    if (/\b(?:gypsum\s*board|gypsum\s*sheathing|exterior\s*gypsum|drywall\s*sheathing|dens-?glass|glass-?mat\s*gypsum|sheetrock\s*sheathing)\b/i.test(lower)) {
      candidates.push({ code: '9', percent: getPct(/\b(?:gypsum|dens-?glass)\b/) });
    }

    // 5. Particle board / OSB
    if (/\b(?:osb|oriented\s*strand|particle\s*boards?|waferboards?|aspenite|chipboards?)\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\b(?:osb|particle\s*board)\b/) });
    }

    // 4. Wood planks
    if (/\b(?:wood\s*planks?|wooden\s*planks?|tongue\s*(?:and|&)\s*grooves?|t\s*&\s*g|wood\s*boards?|lumber\s*sheathing|1x\d+\s*planks?)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:wood\s*planks?|tongue\s*and\s*groove|t\s*&\s*g)\b/) });
    }

    // 3. Plywood (and generic wood frame sheathing)
    if (/\b(?:plywood|cdx|ply\s*sheathing|plywood\s*sheathing|wood\s*sheathing|frame\s*with\s*plywood|wood\s*frame\s*(?:backing|sheathing)?|timber\s*frame\s*backing)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\b(?:plywood|cdx|wood\s*frame)\b/) });
    } else if (/\b(?:wood\s*studs?|timber\s*studs?|wood\s*frame|stick\s*built|frame\s*construction)\b/i.test(lower) && !candidates.some(c => c.code === '4' || c.code === '5')) {
      candidates.push({ code: '3', percent: getPct(/\b(?:wood\s*frame|stick\s*built)\b/) });
    }

    // 6. Metal panels (as structural wall)
    if (/\b(?:metal\s*panels?|steel\s*panels?|corrugated\s*(?:metal|steel)\s*panels?|light\s*metal\s*panels?|insulated\s*metal\s*panels?|imp\b|sandwich\s*panels?|steel\s*studs?|metal\s*studs?|light\s*gauge\s*steel)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:metal\s*panels?|steel\s*panels?|insulated\s*metal\s*panels?|metal\s*studs?)\b/) });
    }

    // 7. Pre-cast concrete elements
    if (/\b(?:pre-?cast\s*concrete|precast\s*concrete|tilt-?up|tilt\s*up|precast\s*panels?|precast\s*wall|pre-?cast\s*elements?|hollow-?core\s*panels?|precast\s*slabs?)\b/i.test(lower)) {
      candidates.push({ code: '7', percent: getPct(/\b(?:pre-?cast|tilt-?up)\b/) });
    }

    // 8. Cast-in-place concrete
    if (/\b(?:cast-?in-?place|cip\s*concrete|poured\s*concrete|reinforced\s*concrete\s*(?:wall|structure|frame)?|rc\s*walls?|monolithic\s*concrete|poured-?in-?place)\b/i.test(lower)) {
      candidates.push({ code: '8', percent: getPct(/\b(?:cast-?in-?place|poured\s*concrete|reinforced\s*concrete)\b/) });
    } else if (/\bconcrete\s*(?:wall|structure)\b/i.test(lower) && !candidates.some(c => c.code === '7' || c.code === '2')) {
      candidates.push({ code: '8', percent: getPct(/\bconcrete\b/) });
    }

    // 2. Reinforced masonry
    if (/\b(?:reinforced\s*masonry|rm\b|cmu\b|concrete\s*blocks?|reinforced\s*(?:concrete\s*)?blocks?|grouted\s*cmu|cmu\s*with\s*rebar|block\s*wall|masonry\s*blocks?)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:reinforced\s*masonry|cmu|concrete\s*block)\b/) });
    }

    // 1. Brick / unreinforced masonry (URM)
    if (/\b(?:unreinforced\s*masonry|urm\b|solid\s*brick|structural\s*brick|brick\s*bearing|masonry\s*bearing|bearing\s*brick|adobe\b|rubble\s*stone|stone\s*masonry)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\b(?:unreinforced\s*masonry|urm|solid\s*brick)\b/) });
    } else if (/\b(?:brick\s*wall|brick\s*structure|brick\s*masonry)\b/i.test(lower) && !/veneer|siding|facade/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\bbrick\b/) });
    }

    return candidates;
  },

  /**
   * Detect exterior weather protection / siding material candidates (WallSiding: Codes 0–8)
   */
  findWallSidingCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    function getPct(regex) {
      if (defaultPct !== null && defaultPct !== undefined) return defaultPct;
      const mPrefix = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${regex.source}`, 'i'));
      if (mPrefix) return parseFloat(mPrefix[1]);
      const mSuffix = text.match(new RegExp(`${regex.source}\\s*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?)`, 'i'));
      if (mSuffix && mSuffix[1]) return parseFloat(mSuffix[1]);
      return null;
    }

    // 8. Fiber cement board (HardiePlank, James Hardie, cementitious)
    if (/\b(?:fiber\s*cement|fibre\s*cement|hardie(?:plank)?|hardie\s*board|james\s*hardie|cementitious\s*siding|cement\s*board\s*siding|fc\s*siding|fiber\s*cement\s*board)\b/i.test(lower)) {
      candidates.push({ code: '8', percent: getPct(/\b(?:fiber\s*cement|hardie(?:plank)?|james\s*hardie)\b/) });
    }

    // 6. EIFS (Exterior insulation finishing system / synthetic stucco)
    if (/\b(?:eifs\b|exterior\s*insulation\s*(?:and\s*)?finish(?:ing)?\s*system|synthetic\s*stucco|dryvit|sto\s*finish|insulation\s*board\s*stucco|foam\s*stucco)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:eifs|synthetic\s*stucco|dryvit)\b/) });
    }

    // 7. Stucco (traditional cement stucco)
    if (!candidates.some(c => c.code === '6') && /\b(?:stucco|traditional\s*stucco|portland\s*cement\s*stucco|cement\s*plaster|plaster\s*finish|hard\s*coat\s*stucco|render\b|exterior\s*plaster)\b/i.test(lower)) {
      candidates.push({ code: '7', percent: getPct(/\b(?:stucco|plaster)\b/) });
    }

    // 5. Stone panels / stone veneer
    if (/\b(?:stone\s*panels?|stone\s*veneer|natural\s*stone|granite\s*panels?|marble\s*panels?|limestone\s*panels?|cut\s*stone|stone\s*facade|stone\s*cladding|slate\s*siding|masonry\s*stone\s*veneer|cast\s*stone\s*panels?)\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\b(?:stone\s*panels?|stone\s*veneer|granite\s*panels?|limestone)\b/) });
    }

    // 4. Aluminum / vinyl siding (and lightweight metal siding)
    if (/\b(?:vinyl\s*siding|aluminum\s*siding|vinyl|aluminum|alu\s*siding|pvc\s*siding|plastic\s*siding|metal\s*siding|tin\s*siding|steel\s*siding|corrugated\s*(?:metal|steel|aluminum)\s*siding)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:vinyl(?:\s*siding)?|aluminum(?:\s*siding)?|metal\s*siding)\b/) });
    }

    // 2. Wood shingles / wood shakes
    if (/\b(?:wood(?:en)?\s*shingles?|wood(?:en)?\s*shakes?|cedar\s*shakes?|cedar\s*shingles?|shake\s*siding|shingle\s*siding)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:wood\s*shingles?|cedar\s*shakes?|shake\s*siding)\b/) });
    }

    // 3. Clapboards / wood lap siding
    if (/\b(?:clapboards?|wood\s*clapboards?|beveled?\s*siding|weatherboards?|wood\s*lap\s*siding|lap\s*siding|wood\s*siding|timber\s*siding|horizontal\s*wood\s*siding|bevel\s*siding)\b/i.test(lower) && !candidates.some(c => c.code === '2')) {
      candidates.push({ code: '3', percent: getPct(/\b(?:clapboards?|lap\s*siding|wood\s*siding|weatherboards?)\b/) });
    }

    // 1. Veneer brick / masonry
    if (/\b(?:brick\s*veneer|masonry\s*veneer|face\s*brick|brick\s*facade|brick\s*siding|brick\s*exterior|brick\s*cladding|masonry\s*cladding|brick\s*front|brick\s*finish)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/\b(?:brick\s*veneer|masonry\s*veneer|face\s*brick|brick\s*siding)\b/) });
    } else if (/\bbrick\b/i.test(lower) && !/\b(?:brick\s*bearing|solid\s*brick|unreinforced\s*brick)\b/i.test(lower)) {
      // In exterior wall finish contexts, generic "Brick" defaults to Brick Veneer (1)
      candidates.push({ code: '1', percent: getPct(/\bbrick\b/) });
    }

    return candidates;
  },

  /**
   * Resolver function enforcing Underwriting Rules:
   * Rule 1: If percentage values exist, pick HIGHER %
   * Rule 2: If no percentage values exist, pick WEAKER material
   * Rule 3: If tied percentages (e.g. 50% vs 50%), pick WEAKER material
   */
  resolveCandidates(candidates, weaknessMap, categoryName) {
    if (!candidates || candidates.length === 0) return '';
    if (candidates.length === 1) return candidates[0].code;

    // Deduplicate by code, keeping highest percentage if duplicate codes exist
    const codeMap = {};
    for (const c of candidates) {
      if (!codeMap[c.code]) {
        codeMap[c.code] = c;
      } else {
        const existing = codeMap[c.code];
        const curPct = c.percent !== null ? c.percent : -1;
        const exPct = existing.percent !== null ? existing.percent : -1;
        if (curPct > exPct) {
          codeMap[c.code] = c;
        }
      }
    }

    const unique = Object.values(codeMap);
    if (unique.length === 1) return unique[0].code;

    // Check if any candidate has an explicit percentage
    const withPct = unique.filter(c => c.percent !== null && c.percent !== undefined && !isNaN(c.percent));

    if (withPct.length > 0) {
      // Sort by percentage descending; tie-breaker: weaker material (higher weakness score)
      unique.sort((a, b) => {
        const pA = a.percent !== null ? a.percent : -1;
        const pB = b.percent !== null ? b.percent : -1;
        if (pB !== pA) return pB - pA; // Higher % wins
        // Tie-breaker (e.g. 50% vs 50%): weaker material wins (higher weakness score)
        const wA = weaknessMap[a.code] || 0;
        const wB = weaknessMap[b.code] || 0;
        return wB - wA;
      });
      return unique[0].code;
    }

    // No percentages present: pick WEAKER material (higher weakness score)
    unique.sort((a, b) => {
      const wA = weaknessMap[a.code] || 0;
      const wB = weaknessMap[b.code] || 0;
      return wB - wA;
    });

    return unique[0].code;
  },

  /**
   * Parse a single row or tab-delimited input into WallType and WallSiding
   */
  parseWallRow(rawRow, options = {}) {
    if (!rawRow) rawRow = '';
    const str = String(rawRow).trim();
    if (!str || /^(?:n\/?a|n\.a\.?|none|null|nil|not\s*applicable|-+|—+|\.)$/i.test(str)) {
      return {
        original: rawRow,
        wallTypeCode: '',
        wallType: '',
        wallTypeName: '',
        wallTypeShort: '',
        wallSidingCode: '',
        wallSiding: '',
        wallSidingName: '',
        wallSidingShort: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank'
      };
    }

    // Unknown / 0-unknown: any input that is purely "unknown" or "0-unknown" (or variants)
    // maps both wall fields to code 0 (Unknown/default).
    if (/^(?:0\s*[-\/]\s*)?unknown\s*(?:[-\/]\s*0)?$/i.test(str) || /^0\s*[-\/]?\s*unknown$/i.test(str)) {
      const unknownDisplay = (fmt) => fmt === 'code_only' ? '0' : fmt === 'name_only' ? 'Unknown/default' : fmt === 'short_code' ? 'Unknown (0)' : 'Unknown/default (0)';
      const fmt = options.format || 'code_only';
      return {
        original: rawRow,
        wallTypeCode: '0',
        wallType: unknownDisplay(fmt),
        wallTypeName: 'Unknown/default',
        wallTypeShort: 'Unknown',
        wallSidingCode: '0',
        wallSiding: unknownDisplay(fmt),
        wallSidingName: 'Unknown/default',
        wallSidingShort: 'Unknown',
        recognizedCount: 2,
        status: 'match',
        statusText: '✓ Complete (Both Fields Identified)'
      };
    }

    // Check if row is already tab-separated numbers (e.g. "1\t4" or "2\t7")
    const numTabMatch = str.match(/^([0-9])\s*[\t,]\s*([0-9])$/);
    if (numTabMatch) {
      const wType = numTabMatch[1];
      const wSiding = numTabMatch[2];
      const typeObj = WallTaxonomy.WALL_TYPE[wType];
      const sidingObj = WallTaxonomy.WALL_SIDING[wSiding];
      const format = options.format || 'code_only';
      return {
        original: rawRow,
        wallTypeCode: wType,
        wallType: format === 'code_only' ? wType : (typeObj ? `${typeObj.name} (${wType})` : wType),
        wallTypeName: typeObj ? typeObj.name : '',
        wallTypeShort: typeObj ? typeObj.shortName : '',
        wallSidingCode: wSiding,
        wallSiding: format === 'code_only' ? wSiding : (sidingObj ? `${sidingObj.name} (${wSiding})` : wSiding),
        wallSidingName: sidingObj ? sidingObj.name : '',
        wallSidingShort: sidingObj ? sidingObj.shortName : '',
        recognizedCount: 2,
        status: 'match',
        statusText: '✓ Complete (Both Fields Identified)'
      };
    }

    // If input is tab-separated (from multi-column copy)
    const columns = str.includes('\t') ? str.split('\t').map(c => c.trim()).filter(Boolean) : [str];
    const fullText = columns.join(', ');

    // 1. Parse segments across all columns
    const segments = [];
    columns.forEach(col => {
      segments.push(...this.parseSegments(col));
    });

    const typeCandidates = [];
    const sidingCandidates = [];

    for (const seg of segments) {
      typeCandidates.push(...this.findWallTypeCandidates(seg.text, seg.percent));
      sidingCandidates.push(...this.findWallSidingCandidates(seg.text, seg.percent));
    }

    // Fallback full-text scan if either category wasn't found via segments
    if (typeCandidates.length === 0) typeCandidates.push(...this.findWallTypeCandidates(fullText, null));
    if (sidingCandidates.length === 0) sidingCandidates.push(...this.findWallSidingCandidates(fullText, null));

    // Resolve WallType and WallSiding applying Underwriting Rules
    let wallTypeCode = this.resolveCandidates(typeCandidates, this.WALL_TYPE_WEAKNESS, 'wallType');
    let wallSidingCode = this.resolveCandidates(sidingCandidates, this.WALL_SIDING_WEAKNESS, 'wallSiding');

    // Contextual cross-resolution:
    // If WallSiding is Veneer brick (1) and no WallType is specified:
    // If text mentions wood frame, WallType = 3 (Plywood); if text mentions CMU/block, WallType = 2
    if (wallSidingCode === '1' && !wallTypeCode) {
      if (/\b(?:frame|wood|stud)\b/i.test(fullText)) {
        wallTypeCode = '3';
      } else if (/\b(?:cmu|block|masonry\s*backup)\b/i.test(fullText)) {
        wallTypeCode = '2';
      }
    }

    // If WallSiding is Stucco (7) and no WallType is specified:
    if (wallSidingCode === '7' && !wallTypeCode) {
      if (/\b(?:cmu|block|masonry)\b/i.test(fullText)) {
        wallTypeCode = '2';
      } else if (/\b(?:frame|wood|stud)\b/i.test(fullText)) {
        wallTypeCode = '3';
      }
    }

    // If WallType is URM (1) and no siding is specified, the brick acts as both structure and siding
    if (wallTypeCode === '1' && !wallSidingCode) {
      wallSidingCode = '1';
    }

    // Resolve labels
    const wallTypeObj = WallTaxonomy.WALL_TYPE[wallTypeCode];
    const wallSidingObj = WallTaxonomy.WALL_SIDING[wallSidingCode];

    const format = options.format || 'code_only';

    let wallTypeDisplay = '';
    if (wallTypeObj) {
      if (format === 'code_only') wallTypeDisplay = wallTypeObj.code;
      else if (format === 'name_only') wallTypeDisplay = wallTypeObj.name;
      else if (format === 'short_code') wallTypeDisplay = `${wallTypeObj.shortName} (${wallTypeObj.code})`;
      else wallTypeDisplay = `${wallTypeObj.name} (${wallTypeObj.code})`;
    }

    let wallSidingDisplay = '';
    if (wallSidingObj) {
      if (format === 'code_only') wallSidingDisplay = wallSidingObj.code;
      else if (format === 'name_only') wallSidingDisplay = wallSidingObj.name;
      else if (format === 'short_code') wallSidingDisplay = `${wallSidingObj.shortName} (${wallSidingObj.code})`;
      else wallSidingDisplay = `${wallSidingObj.name} (${wallSidingObj.code})`;
    }

    const recognizedCount = (wallTypeCode ? 1 : 0) + (wallSidingCode ? 1 : 0);

    let status = 'assigned';
    let statusText = `Separated (${recognizedCount}/2 Fields)`;
    if (recognizedCount === 2) {
      status = 'match';
      statusText = '✓ Complete (Both Fields Identified)';
    } else if (recognizedCount === 0) {
      status = 'mismatch';
      statusText = '⚠️ Unrecognized Wall Format';
    }

    return {
      original: rawRow,
      wallTypeCode: wallTypeCode || '',
      wallType: wallTypeDisplay,
      wallTypeName: wallTypeObj ? wallTypeObj.name : '',
      wallTypeShort: wallTypeObj ? wallTypeObj.shortName : '',
      wallSidingCode: wallSidingCode || '',
      wallSiding: wallSidingDisplay,
      wallSidingName: wallSidingObj ? wallSidingObj.name : '',
      wallSidingShort: wallSidingObj ? wallSidingObj.shortName : '',
      recognizedCount,
      status,
      statusText
    };
  },

  /**
   * Process a column of exterior wall finish data
   */
  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      const parsed = this.parseWallRow(line, options);
      // Cleaned output contains pure codes for direct Excel columns (WallType\tWallSiding)
      const cleaned = [parsed.wallTypeCode || '', parsed.wallSidingCode || ''].join('\t');

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: cleaned,
        wallType: parsed.wallType,
        wallTypeCode: parsed.wallTypeCode,
        wallTypeName: parsed.wallTypeName,
        wallTypeShort: parsed.wallTypeShort,
        wallSiding: parsed.wallSiding,
        wallSidingCode: parsed.wallSidingCode,
        wallSidingName: parsed.wallSidingName,
        wallSidingShort: parsed.wallSidingShort,
        recognizedCount: parsed.recognizedCount,
        changed: true,
        status: parsed.status,
        statusText: parsed.statusText
      });
    });

    return results;
  }
};

// Wire up wall cleaner reference
CleanersRegistry.wall.cleaner = WallClassifier;

// Export for module systems or attach to global window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StreetCleaner, AddressSplitter, OccupancyClassifier, ConstructionClassifier, YearBuiltCleaner, RoofYearCleaner, RoofClassifier, WallClassifier, CleanersRegistry };
}
if (typeof window !== 'undefined') {
  window.StreetCleaner = StreetCleaner;
  window.AddressSplitter = AddressSplitter;
  window.OccupancyClassifier = OccupancyClassifier;
  window.ConstructionClassifier = ConstructionClassifier;
  window.YearBuiltCleaner = YearBuiltCleaner;
  window.RoofYearCleaner = RoofYearCleaner;
  window.RoofClassifier = RoofClassifier;
  window.WallClassifier = WallClassifier;
  window.CleanersRegistry = CleanersRegistry;
  window.parseExcelRows = parseExcelRows;
}



