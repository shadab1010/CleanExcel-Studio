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
    try { return require('./data/touchstone_data.js'); } catch (e) { }
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

  AU_STATES: {
    "NSW": "NSW", "NEW SOUTH WALES": "NSW",
    "VIC": "VIC", "VICTORIA": "VIC",
    "QLD": "QLD", "QUEENSLAND": "QLD",
    "WA": "WA", "WESTERN AUSTRALIA": "WA",
    "SA": "SA", "SOUTH AUSTRALIA": "SA",
    "TAS": "TAS", "TASMANIA": "TAS",
    "ACT": "ACT", "AUSTRALIAN CAPITAL TERRITORY": "ACT",
    "NT": "NT", "NORTHERN TERRITORY": "NT"
  },

  UK_COUNTIES: [
    // England Ceremonial & Historic
    "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire",
    "Cheshire", "City of London", "Cornwall", "Cumbria", "Derbyshire", "Devon",
    "Dorset", "Durham", "County Durham", "East Riding of Yorkshire", "East Sussex",
    "Essex", "Gloucestershire", "Greater London", "Greater Manchester", "Hampshire",
    "Herefordshire", "Hertfordshire", "Isle of Wight", "Kent", "Lancashire",
    "Leicestershire", "Lincolnshire", "Merseyside", "Norfolk", "North Yorkshire",
    "Northamptonshire", "Northumberland", "Nottinghamshire", "Oxfordshire", "Rutland",
    "Shropshire", "Somerset", "South Yorkshire", "Staffordshire", "Suffolk",
    "Surrey", "Tyne and Wear", "Warwickshire", "West Midlands", "West Sussex",
    "West Yorkshire", "Wiltshire", "Worcestershire", "Yorkshire",
    // Scotland
    "Aberdeenshire", "Angus", "Argyll", "Argyll and Bute", "Ayrshire", "East Ayrshire",
    "North Ayrshire", "South Ayrshire", "Banffshire", "Berwickshire", "Bute",
    "Caithness", "Clackmannanshire", "Dumfriesshire", "Dumfries and Galloway",
    "Dunbartonshire", "East Dunbartonshire", "West Dunbartonshire", "East Lothian",
    "Falkirk", "Fife", "Highland", "Inverness-shire", "Inverclyde", "Kincardineshire",
    "Kinross-shire", "Kirkcudbrightshire", "Lanarkshire", "North Lanarkshire",
    "South Lanarkshire", "Midlothian", "Moray", "Nairnshire", "Orkney", "Peeblesshire",
    "Perthshire", "Perth and Kinross", "Renfrewshire", "East Renfrewshire",
    "Ross and Cromarty", "Roxburghshire", "Scottish Borders", "Selkirkshire",
    "Shetland", "Stirlingshire", "Sutherland", "West Lothian", "Western Isles",
    // Wales
    "Anglesey", "Isle of Anglesey", "Blaenau Gwent", "Bridgend", "Caerphilly",
    "Cardiff", "Carmarthenshire", "Ceredigion", "Cardiganshire", "Conwy",
    "Denbighshire", "Flintshire", "Glamorgan", "South Glamorgan", "Mid Glamorgan",
    "West Glamorgan", "Gwynedd", "Merthyr Tydfil", "Monmouthshire", "Gwent",
    "Neath Port Talbot", "Newport", "Pembrokeshire", "Powys", "Rhondda Cynon Taf",
    "Swansea", "Torfaen", "Vale of Glamorgan", "Wrexham", "Clwyd", "Dyfed",
    // Northern Ireland
    "Antrim", "County Antrim", "Armagh", "County Armagh", "Down", "County Down",
    "Fermanagh", "County Fermanagh", "Londonderry", "Derry", "County Londonderry",
    "Tyrone", "County Tyrone"
  ],

  STREET_SUFFIXES: [
    "Street", "St", "Road", "Rd", "Avenue", "Ave", "Lane", "Ln", "Drive", "Dr",
    "Way", "Close", "Cl", "Court", "Ct", "Crescent", "Cres", "Place", "Pl",
    "Terrace", "Ter", "Gardens", "Gdns", "Garden", "Gdn", "Hill", "Park", "Pk",
    "Row", "Square", "Sq", "Mews", "Walk", "Yard", "Parade", "Rise", "Vale",
    "Grove", "Gr", "Wharf", "Gate", "End", "Bank", "Alley", "Broadway", "Circus",
    "Highway", "Hwy", "Boulevard", "Blvd", "View", "Villas", "Villa", "Mead",
    "Meadow", "Meadows", "Green", "Grange", "Quay", "Ridge", "Approach", "Brae",
    "Bypass", "Chase", "Common", "Corner", "Croft", "Cross", "Dell", "Field",
    "Fields", "Fold", "Heath", "Heights", "Isle", "Mount", "Orchard", "Path",
    "Reach", "Ride", "Side", "Track", "Water", "Wynd", "Broad", "Passage"
  ],

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

  formatCountry(countryStr, format = 'iso2', rawCountry = '') {
    if (!countryStr && !rawCountry) return '';
    if (format === 'original' && rawCountry) return rawCountry;
    const target = countryStr || rawCountry;
    const upper = String(target).trim().toUpperCase();
    if (format === 'fullname') {
      return this.FULLNAME_MAP[upper] || target;
    }
    if (format === 'iso2-uk') {
      if (['GB', 'UK', 'UNITED KINGDOM', 'GREAT BRITAIN', 'ENGLAND', 'SCOTLAND', 'WALES'].includes(upper)) {
        return 'UK';
      }
    }
    if (this.ISO2_MAP[upper]) {
      return (format === 'iso2-uk' && this.ISO2_MAP[upper] === 'GB') ? 'UK' : this.ISO2_MAP[upper];
    }
    if (upper.length === 2) return upper;
    return target;
  },

  // Regex patterns for international postal codes
  UK_POSTCODE_REGEX: /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i,
  CA_POSTCODE_REGEX: /\b([A-Z]\d[A-Z]\s*\d[A-Z]\d)\b/i,

  // Helper to split street and city using street suffix boundary and structural rules
  splitStreetAndCity(str) {
    str = String(str || '').trim();
    if (!str) return { s: '', c: '' };
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const suffixPattern = this.STREET_SUFFIXES.map(s => escapeRegExp(s)).join('|');

    // 1. Suffix boundary followed by city words (e.g. "742 Evergreen Terrace Springfield", "22 High Street WITNEY")
    const streetSplitRegex = new RegExp(`^(.*?\\b(?:${suffixPattern})\\b(?:\\s+(?:SW|SE|NW|NE|North|South|East|West))?)(?:\\s+(.+))$`, 'i');
    const m = str.match(streetSplitRegex);
    if (m && m[2]) {
      return { s: m[1].trim(), c: m[2].trim() };
    }

    const hasStreetNumber = /^\d+[a-zA-Z]?(?:[-\/]\d+)?\s+/i.test(str) || /^(?:apt|unit|suite|ste|#|p\.?o\.?\s*box)\b/i.test(str);
    const endsWithSuffix = new RegExp(`\\b(?:${suffixPattern})(?:\\s+(?:SW|SE|NW|NE|North|South|East|West))?$`, 'i').test(str);
    const hasAnySuffix = new RegExp(`\\b(?:${suffixPattern})\\b`, 'i').test(str);

    // 2. If it ends with a street suffix (e.g. "742 Evergreen Terrace", "123 Main St", "22 High Street")
    if (endsWithSuffix) {
      return { s: str, c: '' };
    }

    // 3. If it has NEITHER house number NOR any street suffix -> It is pure City! (e.g. "Springfield", "Los Angeles", "WITNEY", "Salt Lake City")
    if (!hasStreetNumber && !hasAnySuffix) {
      return { s: '', c: str };
    }

    // 4. If it has a house number but no suffix, with multiple words (e.g. "742 Evergreen Springfield")
    const words = str.split(/\s+/);
    if (hasStreetNumber && words.length > 2) {
      const c = words.pop();
      return { s: words.join(' '), c: c };
    }

    if (hasStreetNumber) {
      return { s: str, c: '' };
    }

    return { s: '', c: str };
  },

  parseAddress(raw, options = {}) {
    let text = String(raw || '').trim();
    if (!text) return { street: '', city: '', state: '', county: '', postal: '', country: '' };

    const opts = {
      defaultCountry: options.defaultCountry !== undefined ? options.defaultCountry : 'US',
      countryFormat: options.countryFormat || 'iso2', // iso2 | iso2-uk | fullname | original
      casing: options.casing || 'titlecase', // titlecase | uppercase | original
      cleanStreetRules: options.cleanStreetRules !== false,
      ...options
    };

    let country = '';
    let rawCountry = '';
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
      rawCountry = cm[1];
      country = this.COUNTRIES[cm[1].toUpperCase()];
      text = text.slice(0, cm.index).trim();
    }

    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sortedUkCounties = [...this.UK_COUNTIES].sort((a, b) => b.length - a.length);
    const ukCountyPattern = sortedUkCounties.map(c => escapeRegExp(c)).join('|');

    // 2. Check for UK (Postcode like "SW1A 2AA" / "OX28 6RB", explicit United Kingdom, or ends with UK county)
    const isUkCountyEnd = new RegExp(`(?:,\\s*|\\s+)\\b(${ukCountyPattern})\\b\\.?$`, 'i').test(text);
    if (country === 'United Kingdom' || this.UK_POSTCODE_REGEX.test(text) || (isUkCountyEnd && (opts.defaultCountry === 'GB' || opts.defaultCountry === 'UK'))) {
      country = country || 'United Kingdom';
      const pm = text.match(this.UK_POSTCODE_REGEX);
      if (pm) {
        postal = pm[1].toUpperCase().replace(/\s+/g, ' ');
        text = text.replace(pm[0], '').replace(/,\s*,/g, ',').trim();
      }

      if (text.includes(',')) {
        const parts = text.split(',').map(p => p.trim()).filter(Boolean);
        // Check if last part is a known UK county
        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1];
          const isCounty = new RegExp(`^(${ukCountyPattern})$`, 'i').test(lastPart);
          if (isCounty) {
            county = parts.pop();
          }
        }
        if (parts.length >= 2) {
          city = parts.pop();
          street = parts.join(', ');
        } else if (parts.length === 1) {
          const res = this.splitStreetAndCity(parts[0]);
          street = res.s;
          city = res.c;
        }
      } else {
        // Space-separated UK address, e.g. "22 High Street WITNEY Oxfordshire"
        const countyMatch = text.match(new RegExp(`(?:,\\s*|\\s+)\\b(${ukCountyPattern})\\b\\.?$`, 'i'));
        if (countyMatch) {
          county = countyMatch[1];
          text = text.slice(0, countyMatch.index).trim();
        }
        // Now text is "22 High Street WITNEY"
        const res = this.splitStreetAndCity(text);
        street = res.s;
        city = res.c;
      }

      return this.formatResult(street, city, state, county, postal, country, rawCountry, opts, true);
    }

    // 3. Check for Australia (AU state + 4-digit postcode or explicit Australia)
    const auStateKeys = Object.keys(this.AU_STATES).sort((a, b) => b.length - a.length);
    const auStateRegex = new RegExp(`(?:,\\s*|\\s+)\\b(${auStateKeys.join('|')})\\b(?:\\s+(\\d{4}))?\\.?$`, 'i');
    const auMatch = (country === 'Australia' || auStateRegex.test(text)) ? text.match(auStateRegex) : null;

    if (country === 'Australia' || auMatch) {
      country = country || 'Australia';
      const auPostMatch = text.match(/\b(\d{4})\b/);
      if (auPostMatch) {
        postal = auPostMatch[1];
        text = text.replace(auPostMatch[0], '').trim();
      }
      const sm = text.match(new RegExp(`(?:,\\s*|\\s+)\\b(${auStateKeys.join('|')})\\b\\.?$`, 'i'));
      if (sm) {
        state = this.AU_STATES[sm[1].toUpperCase()];
        text = text.slice(0, sm.index).trim();
      }

      if (text.includes(',')) {
        const parts = text.split(',').map(p => p.trim()).filter(Boolean);
        city = parts.pop();
        street = parts.join(', ');
      } else {
        const res = this.splitStreetAndCity(text);
        street = res.s;
        city = res.c;
      }
      return this.formatResult(street, city, state, county, postal, country, rawCountry, opts);
    }

    // 4. Check for Canada (Postal code like "M5V 3X5" or explicit Canada)
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
        const res = this.splitStreetAndCity(text);
        street = res.s;
        city = res.c;
      }
      return this.formatResult(street, city, state, county, postal, country, rawCountry, opts);
    }

    // 5. Check for Germany (e.g. "Friedrichstraße 43, 10117 Berlin, Germany")
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
      return this.formatResult(street, city, state, county, postal, country, rawCountry, opts);
    }

    // 6. Default / United States (US)
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
        let beforeParts = parts.slice(0, stateIdx);
        // Check if any part before state is a county (e.g. "Davidson County" or "County of ...")
        const countyBeforeIdx = beforeParts.findIndex(p => /\bcounty\b/i.test(p));
        if (countyBeforeIdx !== -1) {
          county = beforeParts[countyBeforeIdx].replace(/\bcounty\b/i, '').trim();
          beforeParts.splice(countyBeforeIdx, 1);
        }

        if (beforeParts.length > 1) {
          city = beforeParts[beforeParts.length - 1];
          street = beforeParts.slice(0, beforeParts.length - 1).join(', ');
        } else if (beforeParts.length === 1) {
          const res = this.splitStreetAndCity(beforeParts[0]);
          street = res.s;
          city = res.c;
        }
        // County is between state and postal (e.g. "DAVIDSON" in "...,TN,DAVIDSON,37212")
        if (!county && parts.length > stateIdx + 1) {
          const candidateCounty = parts[stateIdx + 1];
          if (!candidateCounty.match(/^\d{5}/)) {
            county = candidateCounty;
          }
        }
      } else {
        street = text;
      }
    } else {
      // Space-separated or flexible order US address
      // 1. Check glued state + zip anywhere: e.g. "IL 62704" or "TN37212"
      const gluedMatch = text.match(/\b([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)\b/);
      if (gluedMatch && this.US_STATES[gluedMatch[1].toUpperCase()]) {
        state = this.US_STATES[gluedMatch[1].toUpperCase()];
        postal = gluedMatch[2];
        text = text.replace(gluedMatch[0], ' ').trim();
      } else {
        // 2. Postal code anywhere (5 digits or 5+4)
        const allZips = [...text.matchAll(/\b(\d{5}(?:-\d{4})?)\b/g)];
        if (allZips.length > 0) {
          const zipMatch = allZips[allZips.length - 1];
          postal = zipMatch[1];
          text = text.slice(0, zipMatch.index) + ' ' + text.slice(zipMatch.index + zipMatch[0].length);
        }

        // 3. State anywhere (full names first, then 2-letter codes)
        const sortedStates = Object.keys(this.US_STATES).sort((a, b) => b.length - a.length);
        for (const stKey of sortedStates) {
          const stRegex = new RegExp(`\\b${stKey}\\b`, 'i');
          const m = text.match(stRegex);
          if (m) {
            state = this.US_STATES[stKey.toUpperCase()];
            text = text.replace(m[0], ' ').trim();
            break;
          }
        }
      }

      text = text.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();

      if (state || postal) {
        const res = this.splitStreetAndCity(text);
        street = res.s;
        city = res.c;
      } else {
        street = text;
      }
    }

    return this.formatResult(street, city, state, county, postal, country, rawCountry, opts);
  },

  formatResult(street, city, state, county, postal, country, rawCountry = '', opts = {}, isUk = false) {
    if (street && opts.cleanStreetRules !== false) {
      street = street.replace(/^(?:unit\s*#?\d+[a-zA-Z]?|no\s*\d+\s*bldg|bldg\s*#?\d+[a-zA-Z]?)[, -]+/i, '');
      street = street.replace(/,\s*[a-zA-Z0-9]+\s+(?:bldg|building)\.?/gi, '');
      street = street.replace(/['"]+/g, '');
      street = street.replace(/\s*#\s*$/g, '');
      street = street.replace(/\s+/g, ' ').trim();
    }

    const formatCase = (str, isUkPostTown = false) => {
      if (!str) return '';
      if (opts.casing === 'uppercase') return str.toUpperCase();
      if (opts.casing === 'original') return str;
      if (opts.casing === 'titlecase' || !opts.casing) {
        // In UK Royal Mail standards, post town is officially printed in UPPERCASE
        // If raw was all-caps (e.g. WITNEY), preserve uppercase
        if (isUkPostTown && str === str.toUpperCase() && str.length > 1) {
          return str;
        }
        let titled = str.toLowerCase().replace(/(^|\s|-|\/)([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
        titled = titled.replace(/\b(sw|nw|se|ne)\b/gi, m => m.toUpperCase());
        return titled;
      }
      return str;
    };

    let finalCountry = country;
    if (finalCountry || rawCountry) {
      finalCountry = this.formatCountry(finalCountry, opts.countryFormat || 'iso2', rawCountry);
      if (opts.casing === 'uppercase' && finalCountry) {
        finalCountry = finalCountry.toUpperCase();
      }
    }

    return {
      street: formatCase(street),
      city: formatCase(city, isUk),
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
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getMergedOccupancy) {
      return CustomCodesDB.getMergedOccupancy();
    }
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
    // Single unit residential / Permanent general residential
    { code: "301", patterns: [/1\s*unit/i, /single\s*unit/i, /1\s*family\s*apartment/i, /one\s*unit/i, /1\s*apt\b/i, /1\s*bldg/i, /1\s*building/i, /single\s*dwelling/i] },
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
    // Entertainment & Recreation (Theaters/Gyms/Sports Courts)
    { code: "317", patterns: [/theater/i, /theatre/i, /cinema/i, /gymnasium/i, /\bgym\b/i, /fitness/i, /bowling/i, /arena/i, /stadium/i, /amusement/i, /arcade/i, /skating rink/i, /basketball court/i, /volleyball court/i, /tennis court/i, /pickleball court/i, /badminton court/i, /squash court/i, /racquetball court/i, /sports court/i, /\bcourts?\b/i] },
    // Parking / Garages
    { code: "318", patterns: [/\bgarages?\b/i, /parking/i, /parking garage/i, /parking structure/i, /parking deck/i, /parking ramp/i, /car park/i, /multilevel parking/i, /parking facility/i] },
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
    // Transport - Sea Ports / Docks / Harbors
    { code: "354", patterns: [/port\b/i, /marine terminal/i, /dock/i, /harbor/i, /wharf/i] },
    // Aviation Hangar
    { code: "355", patterns: [/hangar/i, /aircraft hangar/i] },
    // Rail
    { code: "352", patterns: [/railroad/i, /railway/i, /train station/i, /rail depot/i] },
    // Utilities
    { code: "364", patterns: [/power plant/i, /generating station/i, /substation/i, /electric utility/i] },
    { code: "362", patterns: [/water treatment/i, /water plant/i, /water reservoir/i] },
    { code: "365", patterns: [/telecom/i, /cell tower/i, /broadcast/i, /antenna site/i] },
    // Solar
    { code: "3001", patterns: [/solar farm/i, /solar array/i, /photovoltaic/i, /solar park/i] }
  ],

  /**
   * Resolves Apartment / Residential Unit count rule:
   * - 1 unit / 1 bldg ➔ 301 (Permanent Dwelling: General Residential / 1 Unit)
   * - 2, 3, 4 units / 2-4 family ➔ 303 (Permanent Dwelling: Multi Family 2-4 Units)
   * - >= 5 units / apartment complex ➔ 306 (Apartments / Condominiums 5+ Units)
   */
  resolveApartmentUnits(text, otherCells = []) {
    if (!text && (!otherCells || otherCells.length === 0)) return null;
    const combined = [text, ...(Array.isArray(otherCells) ? otherCells : [])].filter(Boolean).join(' ');
    if (!combined) return null;

    const isApartmentOrResidential = /\b(?:apartment|apartments|apt|apts|condo|condos|condominium|condominiums|residential|living\s*units?|flats?|multi-?family|dwelling)\b/i.test(combined);
    if (!isApartmentOrResidential) return null;

    const allTokens = [text, ...(Array.isArray(otherCells) ? otherCells : [])].filter(Boolean);
    let unitCount = null;

    for (const token of allTokens) {
      const trimmed = String(token).trim();

      // Direct whole number in a cell (e.g. "1", "2", "3", "4", "5", "12", "24")
      if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10);
        if (num >= 1 && num <= 10000) {
          unitCount = num;
          break;
        }
      }

      // Explicit patterns: "1 unit", "3 units", "4 bldg", "1 building", "2 apts", "1 family", "2-4 units", "5+ units"
      const unitMatch = trimmed.match(/\b(\d+)\s*(?:units?|living\s*units?|apts?|apartments?|bldgs?|buildings?|families|family|flats?)\b/i);
      if (unitMatch) {
        unitCount = parseInt(unitMatch[1], 10);
        break;
      }

      const reverseMatch = trimmed.match(/\b(?:units?|living\s*units?|apts?|bldgs?|buildings?|flats?)\s*[:#\-]?\s*(\d+)\b/i);
      if (reverseMatch) {
        unitCount = parseInt(reverseMatch[1], 10);
        break;
      }

      if (/\b(?:single|one)\s*(?:unit|family|building|bldg|apt)\b/i.test(trimmed)) {
        unitCount = 1;
        break;
      }
      if (/\b(?:two)\s*(?:units?|families|buildings?|bldgs?|apts?)\b/i.test(trimmed)) {
        unitCount = 2;
        break;
      }
      if (/\b(?:three)\s*(?:units?|families|buildings?|bldgs?|apts?)\b/i.test(trimmed)) {
        unitCount = 3;
        break;
      }
      if (/\b(?:four)\s*(?:units?|families|buildings?|bldgs?|apts?)\b/i.test(trimmed)) {
        unitCount = 4;
        break;
      }
      if (/\b(?:five)\s*(?:units?|families|buildings?|bldgs?|apts?)\b/i.test(trimmed)) {
        unitCount = 5;
        break;
      }
      if (/\b2\s*-\s*4\s*units?\b/i.test(trimmed)) {
        unitCount = 3;
        break;
      }
      if (/\b5\s*\+\s*units?\b/i.test(trimmed)) {
        unitCount = 5;
        break;
      }
    }

    if (unitCount !== null) {
      if (unitCount === 1) {
        return "301";
      } else if (unitCount >= 2 && unitCount <= 4) {
        return "303";
      } else if (unitCount >= 5) {
        return "306";
      }
    }

    return null;
  },

  matchTextToCode(text) {
    if (!text) return null;
    const cleanText = String(text).trim();
    if (!cleanText) return null;

    // 0. Check continuous self-training memory database with top priority
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('occupancy', cleanText);
      if (learned) {
        return typeof learned === 'object' ? String(learned.code || learned.occCode) : String(learned);
      }
    }

    // 1. Check custom user-defined keywords with top priority
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getCustomKeywords) {
      const customRules = CustomCodesDB.getCustomKeywords('occupancy');
      for (let i = 0; i < customRules.length; i++) {
        const cr = customRules[i];
        if (cr.keywords && Array.isArray(cr.keywords)) {
          for (let j = 0; j < cr.keywords.length; j++) {
            const kw = cr.keywords[j];
            if (kw) {
              const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pat = new RegExp(`\\b${escaped}\\b`, 'i');
              if (pat.test(cleanText) || cleanText.toLowerCase().includes(kw.toLowerCase())) {
                return cr.code;
              }
            }
          }
        }
      }
    }

    // 2. Check Apartment / Residential Unit count rule
    const aptUnitCode = this.resolveApartmentUnits(cleanText);
    if (aptUnitCode) return aptUnitCode;

    // 3. Built-in pattern rules
    for (let i = 0; i < this.RULES.length; i++) {
      const r = this.RULES[i];
      for (let j = 0; j < r.patterns.length; j++) {
        if (r.patterns[j].test(cleanText)) {
          return r.code;
        }
      }
    }

    // 4. Match against all Touchstone database dictionary keywords & categories
    const lower = cleanText.toLowerCase();
    for (const [code, info] of Object.entries(this.CODES)) {
      if (code === '300') continue;
      if (info.keywords && Array.isArray(info.keywords)) {
        for (let j = 0; j < info.keywords.length; j++) {
          const kw = String(info.keywords[j] || '').trim().toLowerCase();
          if (kw) {
            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pat = new RegExp(`\\b${escaped}\\b`, 'i');
            if (pat.test(cleanText) || (kw.length > 3 && lower.includes(kw))) {
              return code;
            }
          }
        }
      }
      if (info.category) {
        const catLower = info.category.toLowerCase();
        if (catLower.length > 4 && lower.includes(catLower)) {
          return code;
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
   * Compares multi-column inputs and classifies into Touchstone UNICEDE Occupancy Code
   * Strict Priority Order: Column 1 (1st priority) ➔ Column 2 (2nd priority) ➔ Column 3 (3rd priority) ➔ Extras
   */
  classifyRow(col1, col2, col3, extraDescs = []) {
    const c1 = String(col1 || '').trim();
    const c2 = String(col2 || '').trim();
    const c3 = String(col3 || '').trim();
    const extras = Array.isArray(extraDescs) ? extraDescs.map(e => String(e || '').trim()) : [];

    const isAllBlank = !c1 && !c2 && !c3 && extras.every(e => !e);
    if (isAllBlank) {
      return {
        col1: '', col2: '', col3: '',
        existingCode: '', bldgDesc: '', occDesc: '',
        occCode: '',
        category: '',
        status: 'blank',
        statusText: 'Blank',
        comparisonStatus: 'blank',
        comparisonMessage: 'Blank'
      };
    }

    let matchedCode = null;

    // Helper to evaluate a cell for occupancy classification
    const evalCell = (cellText) => {
      if (!cellText || cellText === '—' || cellText === '-' || cellText.toLowerCase() === 'n/a') return null;

      // 1. Direct match on valid known numeric/custom code
      if (this.CODES[cellText] && cellText !== '300') {
        return cellText;
      }

      // 2. Multi-component check (if semicolon separated, test primary first)
      if (cellText.includes(';')) {
        const primary = cellText.split(';')[0].trim();
        const mPrimary = this.matchTextToCode(primary);
        if (mPrimary && mPrimary !== '300') return mPrimary;
      }

      // 3. Match text against dictionary & custom rules
      const m = this.matchTextToCode(cellText);
      if (m && m !== '300') return m;

      return null;
    };

    // === Priority 1: Check Column 1 FIRST ===
    if (c1) {
      matchedCode = evalCell(c1);
    }

    // === Priority 2: If Col 1 didn't match, check Column 2 ===
    if (!matchedCode && c2) {
      matchedCode = evalCell(c2);
    }

    // === Priority 3: If Col 2 didn't match, check Column 3 ===
    if (!matchedCode && c3) {
      matchedCode = evalCell(c3);
    }

    // === Priority 4: Check Extra Columns (Col 4, Col 5...) sequentially ===
    if (!matchedCode) {
      for (let i = 0; i < extras.length; i++) {
        if (extras[i]) {
          const m = evalCell(extras[i]);
          if (m) {
            matchedCode = m;
            break;
          }
        }
      }
    }

    // === Priority 5: Fallback to combined text across all populated columns ===
    if (!matchedCode) {
      const combined = [c1, c2, c3, ...extras].filter(Boolean).join(' ');
      if (combined) {
        const m = this.matchTextToCode(combined);
        if (m && m !== '300') {
          matchedCode = m;
        }
      }
    }

    // === Check Cross-Column Apartment & Unit Count Rule ===
    // If the row is an apartment / residential dwelling, unit count across any column refines the code:
    // 1 unit ➔ 301, 2-4 units ➔ 303, >=5 units ➔ 306
    const aptCrossColCode = this.resolveApartmentUnits(c1, [c2, c3, ...extras]);
    if (aptCrossColCode) {
      const isExplicitNonResCode = c1 && /^\d{3,4}$/.test(c1) && !['300', '301', '302', '303', '306'].includes(c1);
      if (!isExplicitNonResCode) {
        matchedCode = aptCrossColCode;
      }
    }

    // If still no match and Col 1 was an explicit code (even 300)
    if (!matchedCode && c1 && this.CODES[c1]) {
      matchedCode = c1;
    }

    matchedCode = matchedCode || '300';
    const info = this.CODES[matchedCode] || { code: matchedCode, category: 'Unknown occupancy' };

    // Determine comparison status with Col 1 if Col 1 was numeric code
    let statusKey = 'assigned';
    let statusText = `Assigned (${matchedCode})`;

    if (c1 && /^\d{3,4}$/.test(c1)) {
      if (c1 === matchedCode) {
        statusKey = 'match';
        statusText = `✓ Confirmed (${matchedCode})`;
      } else if (c1 === '300' && matchedCode !== '300') {
        statusKey = 'upgraded';
        statusText = `✨ Resolved (300 ➔ ${matchedCode})`;
      } else {
        statusKey = 'mismatch';
        statusText = `⚠️ Review (${c1} ➔ ${matchedCode})`;
      }
    } else {
      statusKey = 'assigned';
      statusText = `✨ Assigned (${matchedCode})`;
    }

    return {
      col1: c1,
      col2: c2,
      col3: c3,
      existingCode: c1,
      bldgDesc: c2,
      occDesc: c3,
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
   * 2. Object with column arrays: { existingCodes: [...], bldgDescs: [...], occDescs: [...], extraCols: [...] }
   */
  cleanColumn(input, options = {}) {
    const results = [];

    if (input && typeof input === 'object' && !Array.isArray(input) && (input.bldgDescs || input.occDescs || input.extraCols)) {
      const codes = input.existingCodes || [];
      const bldgs = input.bldgDescs || [];
      const occs = input.occDescs || [];
      const extraCols = input.extraCols || [];
      const maxLen = Math.max(codes.length, bldgs.length, occs.length, ...(extraCols.map(c => c.length)));

      for (let i = 0; i < maxLen; i++) {
        const ex = (codes[i] || '').trim();
        const bldg = (bldgs[i] || '').trim();
        const occ = (occs[i] || '').trim();
        const rowExtra = extraCols.map(colArr => (colArr[i] || '').trim());

        const originalParts = [ex, bldg, occ, ...rowExtra];
        const isAllBlank = !ex && !bldg && !occ && rowExtra.every(e => !e);
        if (isAllBlank && options.removeEmptyLines) continue;

        if (isAllBlank) {
          results.push({
            lineNum: i + 1,
            original: originalParts.join('\t').trim(),
            existingCode: '',
            bldgDesc: '',
            occDesc: '',
            extraCols: rowExtra,
            allCols: originalParts,
            occCode: '',
            category: '',
            status: 'empty',
            statusText: 'Blank',
            comparisonStatus: 'empty',
            comparisonMessage: 'Blank',
            cleaned: '',
            changed: false
          });
          continue;
        }

        const res = this.classifyRow(ex, bldg, occ, rowExtra);
        const cleanedParts = [res.existingCode, res.bldgDesc, res.occDesc, ...rowExtra, res.occCode, res.category].filter(c => c !== undefined && c !== '');

        results.push({
          lineNum: i + 1,
          original: originalParts.join('\t').trim(),
          existingCode: res.existingCode,
          bldgDesc: res.bldgDesc,
          occDesc: res.occDesc,
          extraCols: rowExtra,
          allCols: originalParts,
          occCode: res.occCode,
          category: res.category,
          status: res.status,
          statusText: res.statusText,
          comparisonStatus: res.status,
          comparisonMessage: res.statusText,
          cleaned: cleanedParts.join('\t'),
          changed: true
        });
      }
      return results;
    }

    const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          existingCode: '',
          bldgDesc: '',
          occDesc: '',
          occCode: '',
          category: '',
          status: 'empty',
          statusText: 'Blank',
          comparisonStatus: 'empty',
          comparisonMessage: 'Blank',
          cleaned: '',
          changed: false
        });
        return;
      }

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
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getMergedConstruction) {
      return CustomCodesDB.getMergedConstruction();
    }
    const td = _resolveTouchstoneData();
    return (td && td.CONSTRUCTION) || {};
  },

  // ISO Commercial Fire Rating / Construction Classes (ISO 1–6)
  ISO_CLASSES: {
    "1": { iso: "ISO 1", name: "Frame", code: "101", touchstoneCategory: "Wood Frame (Modern)", description: "Combustible walls, floors, and roofs (wood stud, stick built)." },
    "2": { iso: "ISO 2", name: "Joisted Masonry", code: "119", touchstoneCategory: "Joisted Masonry", description: "Exterior masonry walls with combustible (wood) floors and roof." },
    "3": { iso: "ISO 3", name: "Noncombustible", code: "152", touchstoneCategory: "Light Metal / Non-Combustible", description: "Exterior walls, floors, and roofs of noncombustible or light gauge steel materials." },
    "4": { iso: "ISO 4", name: "Masonry Noncombustible", code: "111", touchstoneCategory: "Masonry Non-Combustible", description: "Exterior masonry walls (≥4 in) with noncombustible or steel floor and roof." },
    "5": { iso: "ISO 5", name: "Modified Fire Resistive", code: "131", touchstoneCategory: "Reinforced Concrete / MFR", description: "Exterior walls, floors, and roof of masonry/concrete with 1 to 2-hour fire rating." },
    "6": { iso: "ISO 6", name: "Fire Resistive", code: "131", touchstoneCategory: "Reinforced Concrete / FR", description: "Exterior walls, floors, and roof of reinforced concrete or protected structural steel (≥2 hr fire rating)." }
  },

  RULES: [
    // === ISO Commercial Fire Rating / Construction Classes (ISO 1–6) ===
    // ISO 1: Frame (101)
    { code: "101", patterns: [/\biso\s*[-_]?\s*(?:class\s*)?1\s*[-_:]?\s*frame\b/i, /\biso\s*[-_]?\s*(?:class\s*)?1\b/i] },

    // ISO 2: Joisted Masonry (119)
    { code: "119", patterns: [/\biso\s*[-_]?\s*(?:class\s*)?2\s*[-_:]?\s*joisted\s+masonry\b/i, /\biso\s*[-_]?\s*(?:class\s*)?2\b/i] },

    // ISO 4: Masonry Noncombustible (111) - more specific than general noncombustible
    { code: "111", patterns: [/\biso\s*[-_]?\s*(?:class\s*)?4\s*[-_:]?\s*masonry\s+non[- ]?combust[ia]ble\b/i, /\biso\s*[-_]?\s*(?:class\s*)?4\b/i, /masonry\s+non[- ]?combust[ia]ble/i, /non[- ]?combust[ia]ble\s+masonry/i, /\bmnc\b/i, /masonry\s+nc\b/i] },

    // ISO 3: Noncombustible (152) - Light metal / unprotected steel noncombustible
    { code: "152", patterns: [/\biso\s*[-_]?\s*(?:class\s*)?3\s*[-_:]?\s*non[- ]?combust[ia]ble\b/i, /\biso\s*[-_]?\s*(?:class\s*)?3\b/i, /(?<!masonry\s+)non[- ]?combust[ia]ble(?!\s*masonry)/i, /(?<!masonry\s+)noncombust[ia]ble(?!\s*masonry)/i] },

    // ISO 5: Modified Fire Resistive (131)
    { code: "131", patterns: [/\biso\s*[-_]?\s*(?:class\s*)?5\s*[-_:]?\s*mod(?:ified)?\s+fire\s+resistive\b/i, /\biso\s*[-_]?\s*(?:class\s*)?5\b/i, /modified\s+fire\s+resistive/i, /\bmfr\b/i] },

    // ISO 6: Fire Resistive (131)
    { code: "131", patterns: [/\biso\s*[-_]?\s*(?:class\s*)?6\s*[-_:]?\s*fire\s+resistive\b/i, /\biso\s*[-_]?\s*(?:class\s*)?6\b/i, /fire\s+resistive/i, /\bfr\b/i] },

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
    { code: "111", patterns: [/masonry\s+non[- ]?combust[ia]ble/i, /non[- ]?combust[ia]ble\s+masonry/i, /\bmnc\b/i, /masonry\s+nc\b/i, /\biso\s*(?:class\s*)?4\b/i, /\bmasonry\b/i, /\bbrick\b/i, /exterior\s+brick/i, /brick\s+finish/i, /brick\s+exterior/i, /brick\s+facade/i, /brick\s+wall/i, /concrete\s+block/i, /\bcmu\b/i, /hollow\s+block/i] },

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

    // 0. Check continuous self-training memory database with top priority
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('construction', clean);
      if (learned) {
        return typeof learned === 'object' ? String(learned.code || learned.conCode) : String(learned);
      }
    }

    // Direct exact match on known valid numeric or custom code (except 100 unless explicit)
    if (this.CODES[clean]) {
      return clean;
    }

    // Check custom user-defined keywords with top priority
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.getCustomKeywords) {
      const customRules = CustomCodesDB.getCustomKeywords('construction');
      for (let i = 0; i < customRules.length; i++) {
        const cr = customRules[i];
        if (cr.keywords && Array.isArray(cr.keywords)) {
          for (let j = 0; j < cr.keywords.length; j++) {
            const kw = cr.keywords[j];
            if (kw) {
              const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pat = new RegExp(`\\b${escaped}\\b`, 'i');
              if (pat.test(clean) || clean.toLowerCase().includes(kw.toLowerCase())) {
                return cr.code;
              }
            }
          }
        }
      }
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

    // Match category descriptions and keywords from CODES
    const lower = textWithoutPercent.toLowerCase();
    for (const [c, info] of Object.entries(this.CODES)) {
      if (c === '100') continue;
      if (info.keywords && Array.isArray(info.keywords)) {
        for (let j = 0; j < info.keywords.length; j++) {
          const kw = String(info.keywords[j] || '').trim().toLowerCase();
          if (kw) {
            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pat = new RegExp(`\\b${escaped}\\b`, 'i');
            if (pat.test(clean) || (kw.length > 3 && lower.includes(kw))) {
              return c;
            }
          }
        }
      }
      if (info.category) {
        const catLower = info.category.toLowerCase();
        if (catLower.length > 4 && lower.includes(catLower)) {
          return c;
        }
      }
    }

    return null;
  },

  /**
   * Evaluates Wood Construction Underwriting Rule (Stories & Year Built):
   * 1. If Construction is Wood:
   *    - Stories <= 4 (or less than 4 or 4) ➔ Code 101 (Wood Frame Modern)
   *    - Stories > 4 and <= 7 (between 5 and 7):
   *        - If Year Built > 2005 ➔ Code 101 (Wood Frame Modern)
   *        - If Year Built <= 2005 (or missing) ➔ BLANK ("")
   *    - Stories >= 8 (8 or greater) ➔ BLANK ("")
   */
  evaluateWoodConstructionRules(matchedCode, allCells = []) {
    const combined = allCells.filter(Boolean).join(' ');
    const isWoodCode = ['101', '102', '103', '104', '107', '108'].includes(matchedCode);
    const hasWoodText = /\b(?:wood|timber|wood\s*frame|stick\s*built|wood\s*stud|plywood)\b/i.test(combined);
    const isWood = isWoodCode || (matchedCode === '100' && hasWoodText);
    if (!isWood) return null;

    let stories = null;
    let yearBuilt = null;

    for (const cell of allCells) {
      if (!cell) continue;
      const str = String(cell).trim();

      // Look for explicit story patterns: "4 stories", "10 floors", "8 st", "3 story", "10-story"
      const storyMatch = str.match(/\b(\d+(?:\.\d+)?)\s*(?:stories|story|floors?|flrs?|stry|st)\b/i);
      if (storyMatch) {
        stories = parseFloat(storyMatch[1]);
      } else if (/^\d{1,2}(?:\.\d+)?$/.test(str)) {
        const num = parseFloat(str);
        if (num >= 1 && num <= 80 && !this.CODES[str]) {
          stories = num;
        }
      }

      // Look for 4-digit Year Built (1753 - 2026)
      const yearMatches = str.match(/\b(1[7-9]\d{2}|20[0-2]\d)\b/g);
      if (yearMatches && yearMatches.length > 0) {
        const parsedYears = yearMatches.map(y => parseInt(y, 10)).filter(y => y >= 1753 && y <= 2026);
        if (parsedYears.length > 0) {
          // Resolve multi-year to oldest year as per underwriting rules
          yearBuilt = Math.min(...parsedYears);
        }
      }
    }

    // 1. Stories >= 8 ➔ Invalid for Wood Frame ➔ BLANK
    if (stories !== null && stories >= 8) {
      return {
        code: '',
        category: '',
        status: 'invalid',
        statusText: '⚠️ Wood Frame ≥ 8 Stories → Blank',
        comparisonMessage: `⚠️ Wood Frame ≥ 8 Stories (${stories} stories) → Blank`
      };
    }

    // 2. Stories <= 4 ➔ Direct Code 101 (Wood Frame Modern)
    if (stories !== null && stories <= 4) {
      return {
        code: '101',
        category: 'Wood Frame (Modern)',
        status: 'assigned',
        statusText: '✨ Wood Frame (≤ 4 Stories)',
        comparisonMessage: `✓ Wood Frame (${stories} stories ≤ 4)`
      };
    }

    // 3. Stories > 4 and <= 7 (between 5 and 7 stories): requires Year Built > 2005
    if (stories !== null && stories > 4 && stories <= 7) {
      if (yearBuilt !== null && yearBuilt > 2005) {
        return {
          code: '101',
          category: 'Wood Frame (Modern)',
          status: 'assigned',
          statusText: `✨ Wood Frame ${stories} St (> 2005)`,
          comparisonMessage: `✓ Wood Frame ${stories} Stories Built ${yearBuilt} (> 2005)`
        };
      } else {
        // Year Built <= 2005 or missing ➔ BLANK
        const reason = yearBuilt !== null ? `Built ${yearBuilt} (≤ 2005)` : `Missing YB > 2005`;
        return {
          code: '',
          category: '',
          status: 'invalid',
          statusText: `⚠️ Wood ${stories} St (${reason}) → Blank`,
          comparisonMessage: `⚠️ Wood Frame ${stories} Stories (${reason}) → Blank`
        };
      }
    }

    // 4. Default if stories not specified: if Year Built provided and > 2005 or standard wood -> 101
    return {
      code: '101',
      category: 'Wood Frame (Modern)',
      status: 'assigned',
      statusText: '✨ Assigned (101)',
      comparisonMessage: '✓ Wood Frame (Modern)'
    };
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

  /**
   * Compares multi-column inputs and classifies into Touchstone UNICEDE Construction Code
   * Strict Priority Order: Column 1 (1st priority) ➔ Column 2 (2nd priority) ➔ Column 3 (3rd priority) ➔ Extras
   */
  classifyRow(col1, col2, col3, extraDescs = []) {
    let c1 = String(col1 || '').trim();
    if (c1 === '—' || c1 === '-' || c1.toLowerCase() === 'n/a') c1 = '';
    let c2 = String(col2 || '').trim();
    if (c2 === '—' || c2 === '-' || c2.toLowerCase() === 'n/a') c2 = '';
    let c3 = String(col3 || '').trim();
    if (c3 === '—' || c3 === '-' || c3.toLowerCase() === 'n/a') c3 = '';
    const extras = Array.isArray(extraDescs) ? extraDescs.map(e => String(e || '').trim()) : [];

    const isAllBlank = !c1 && !c2 && !c3 && extras.every(e => !e);
    if (isAllBlank) {
      return {
        col1: '', col2: '', col3: '',
        existingCode: '', bldgDesc: '', conDesc: '',
        conCode: '',
        category: '',
        status: 'blank',
        statusText: 'Blank',
        comparisonStatus: 'blank',
        comparisonMessage: 'Blank'
      };
    }

    let matchedCode = null;

    // Helper to evaluate a cell for construction classification (handles percentages & rules)
    const evalCell = (cellText) => {
      if (!cellText || cellText === '—' || cellText === '-' || cellText.toLowerCase() === 'n/a') return null;

      // 1. Direct match on valid known numeric/custom code
      if (this.CODES[cellText] && cellText !== '100') {
        return cellText;
      }

      // 2. Check if percentage components exist in this cell
      const pctComps = this.parsePercentageComponents(cellText).filter(c => c && c.percent !== null);
      if (pctComps.length > 0) {
        pctComps.sort((a, b) => b.percent - a.percent);
        const top = pctComps[0].text;
        const mTop = this.matchTextToCode(top);
        if (mTop && mTop !== '100') return mTop;
      }

      // 3. Match text against dictionary & rules
      const m = this.matchTextToCode(cellText);
      if (m && m !== '100') return m;

      return null;
    };

    // === Priority 1: Check Column 1 FIRST ===
    if (c1) {
      matchedCode = evalCell(c1);
    }

    // === Priority 2: If Col 1 didn't match, check Column 2 ===
    if (!matchedCode && c2) {
      matchedCode = evalCell(c2);
    }

    // === Priority 3: If Col 2 didn't match, check Column 3 ===
    if (!matchedCode && c3) {
      matchedCode = evalCell(c3);
    }

    // === Priority 4: Check Extra Columns (Col 4, Col 5...) sequentially ===
    if (!matchedCode) {
      for (let i = 0; i < extras.length; i++) {
        if (extras[i]) {
          const m = evalCell(extras[i]);
          if (m) {
            matchedCode = m;
            break;
          }
        }
      }
    }

    // === Priority 5: Fallback to combined text across all populated columns ===
    if (!matchedCode) {
      const combined = [c1, c2, c3, ...extras].filter(Boolean).join(' ');
      if (combined) {
        const m = this.matchTextToCode(combined);
        if (m && m !== '100') {
          matchedCode = m;
        }
      }
    }

    // If still no match and Col 1 was an explicit code (even 100)
    if (!matchedCode && c1 && this.CODES[c1]) {
      matchedCode = c1;
    }

    // === Check Wood Construction Underwriting Rule (Stories & Year Built) ===
    const woodRuleResult = this.evaluateWoodConstructionRules(matchedCode, [c1, c2, c3, ...extras]);
    if (woodRuleResult) {
      return {
        col1: c1,
        col2: c2,
        col3: c3,
        existingCode: c1,
        bldgDesc: c2,
        conDesc: c3,
        conCode: woodRuleResult.code,
        category: woodRuleResult.category,
        group: woodRuleResult.code ? 'Wood construction' : '',
        status: woodRuleResult.status,
        statusText: woodRuleResult.statusText,
        comparisonStatus: woodRuleResult.status,
        comparisonMessage: woodRuleResult.comparisonMessage
      };
    }

    matchedCode = matchedCode || '100';
    const info = this.CODES[matchedCode] || { code: matchedCode, category: 'Unknown', group: 'Unknown construction' };

    let statusKey = 'assigned';
    let statusText = 'Assigned';

    if (c1 && /^\d{3,4}$/.test(c1)) {
      if (c1 === matchedCode) {
        statusKey = 'match';
        statusText = '✓ Confirmed (' + matchedCode + ')';
      } else if (c1 === '100' && matchedCode !== '100') {
        statusKey = 'upgraded';
        statusText = '✨ Resolved (100 ➔ ' + matchedCode + ')';
      } else {
        statusKey = 'mismatch';
        statusText = '⚠️ Review (' + c1 + ' ➔ ' + matchedCode + ')';
      }
    } else {
      statusKey = 'assigned';
      statusText = '✨ Assigned (' + matchedCode + ')';
    }

    return {
      col1: c1,
      col2: c2,
      col3: c3,
      existingCode: c1,
      bldgDesc: c2,
      conDesc: c3,
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

    if (input && typeof input === 'object' && !Array.isArray(input) && (input.bldgDescs || input.conDescs || input.extraCols)) {
      const codes = input.existingCodes || [];
      const bldgs = input.bldgDescs || [];
      const cons = input.conDescs || [];
      const extraCols = input.extraCols || [];
      const maxLen = Math.max(codes.length, bldgs.length, cons.length, ...(extraCols.map(c => c.length)));

      for (let i = 0; i < maxLen; i++) {
        const ex = (codes[i] || '').trim();
        const bldg = (bldgs[i] || '').trim();
        const con = (cons[i] || '').trim();
        const rowExtra = extraCols.map(colArr => (colArr[i] || '').trim());

        const originalParts = [ex, bldg, con, ...rowExtra];
        const isAllBlank = !ex && !bldg && !con && rowExtra.every(e => !e);
        if (isAllBlank && options.removeEmptyLines) continue;

        if (isAllBlank) {
          results.push({
            lineNum: i + 1,
            original: originalParts.join('\t').trim(),
            existingCode: '',
            bldgDesc: '',
            conDesc: '',
            extraCols: rowExtra,
            allCols: originalParts,
            conCode: '',
            category: '',
            group: '',
            status: 'empty',
            statusText: 'Blank',
            comparisonStatus: 'empty',
            comparisonMessage: 'Blank',
            cleaned: '',
            changed: false
          });
          continue;
        }

        const res = this.classifyRow(ex, bldg, con, rowExtra);
        const cleanedParts = [res.existingCode, res.bldgDesc, res.conDesc, ...rowExtra, res.conCode, res.category].filter(c => c !== undefined && c !== '');

        results.push({
          lineNum: i + 1,
          original: originalParts.join('\t').trim(),
          existingCode: res.existingCode,
          bldgDesc: res.bldgDesc,
          conDesc: res.conDesc,
          extraCols: rowExtra,
          allCols: originalParts,
          conCode: res.conCode,
          category: res.category,
          group: res.group,
          status: res.status,
          statusText: res.statusText,
          comparisonStatus: res.status,
          comparisonMessage: res.statusText,
          cleaned: cleanedParts.join('\t'),
          changed: true
        });
      }
      return results;
    }

    const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          existingCode: '',
          bldgDesc: '',
          conDesc: '',
          conCode: '',
          category: '',
          group: '',
          status: 'empty',
          statusText: 'Blank',
          comparisonStatus: 'empty',
          comparisonMessage: 'Blank',
          cleaned: '',
          changed: false
        });
        return;
      }

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
  },
  foundation_type: {
    id: 'foundation_type',
    name: 'Foundation Type',
    icon: '🏛️',
    badge: 'UNICEDE® 0-12',
    description: 'Touchstone / UNICEDE Foundation Type Classifier (Codes 0-12): Unknown (0), Masonry basement (1), Concrete basement (2), Masonry wall (3), Crawlspace cripple wall (4), Crawlspace masonry (5), Post & pier (6), Footing (7), Mat / slab (8), Pile (9), No basement (10), Engineering foundation (11), Crawlspace - raised (12).',
    cleaner: null // Attached below
  },
  foundation_connection: {
    id: 'foundation_connection',
    name: 'Foundation Connection',
    icon: '🔗',
    badge: 'UNICEDE® 0-6',
    description: 'Touchstone / UNICEDE Location Foundation Connection: Hurricane ties (1), Nails/Screws (2), Anchor Bolts (3), Gravity/Friction (4), Adhesive/Epoxy (5), Structurally Connected (6). Industrial anchorage: Unanchored (4), Anchored (6).',
    cleaner: null // Attached below
  },
  foundation: {
    id: 'foundation',
    name: 'Foundation Type',
    icon: '🏛️',
    badge: 'UNICEDE® 0-12',
    description: 'Touchstone / UNICEDE Foundation Type Classifier (Codes 0-12).',
    cleaner: null // Attached below
  },
  short_column: {
    id: 'short_column',
    name: 'Short Column',
    icon: '🏛️',
    badge: 'UNICEDE® 0-2',
    description: 'Touchstone / UNICEDE Short Column Classifier: Unknown/default (0), No (1), Yes (2). Applicable for CA EQ, HI EQ, JP EQ, US EQ models (old concrete structures, spandrel beams, infill walls).',
    cleaner: null // Attached below
  },
  building_exterior_opening: {
    id: 'building_exterior_opening',
    name: 'Building Exterior Opening',
    icon: '🪟',
    badge: 'UNICEDE® 0-2',
    description: 'Touchstone / UNICEDE Building Exterior Opening Classifier: Unknown (0), Less than 50% of wall open / default (1), More than 50% of wall open (2). Applicable for CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional). Shear walls with >50% openings have less seismic resistance.',
    cleaner: null // Attached below
  },
  soft_story: {
    id: 'soft_story',
    name: 'Soft Story',
    icon: '🏚️',
    badge: 'UNICEDE® 0-2',
    description: 'Touchstone / UNICEDE Soft Story Classifier: Unknown/default (0), No (1), Yes (2). Applicable for CA EQ, HI EQ, JP EQ, NZ EQ, US EQ models (stories >= 2, first-floor garages, open fronts, tuck-under parking, pancaking collapse vulnerability).',
    cleaner: null // Attached below
  },
  ornamentation: {
    id: 'ornamentation',
    name: 'Ornamentation',
    icon: '🏛️',
    badge: 'UNICEDE® 0-3',
    description: 'Touchstone / UNICEDE Ornamentation Classifier: Unknown/default (0), None (1), Average (2), Extensive (3). Applicable for CA EQ, HI EQ, JP EQ, US EQ models (Optional). Decorative elements (unreinforced/unbraced parapet walls, entryway roofs) that can fall during earthquake shaking.',
    cleaner: null // Attached below
  },
  building_shape: {
    id: 'building_shape',
    name: 'Building Shape',
    icon: '📐',
    badge: 'UNICEDE® 0-8',
    description: 'Touchstone / UNICEDE Building Shape Classifier: Unknown/default (0), Square (1), Rectangle (2), Circular (3), L-shaped (4), T-shaped (5), U-shaped (6), H-shaped (7), Complex (8). Applicable for CA EQ, HI EQ, JP EQ, NZ EQ, US EQ models (Optional). Classifies building footprint geometry and vulnerability.',
    cleaner: null // Attached below
  },
  building_condition: {
    id: 'building_condition',
    name: 'Building Condition',
    icon: '🏗️',
    badge: 'UNICEDE® 0-3',
    description: 'Touchstone / UNICEDE Building Condition Classifier: Unknown (0), Average (1), Good (2), Poor (3). Applicable for CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST models (Optional). General qualitative description of the building cladding condition and maintenance.',
    cleaner: null // Attached below
  },
  stores: {
    id: 'stores',
    name: 'No of Stores',
    icon: '🏢',
    badge: 'Whole No / No Negatives',
    description: 'Underwriting Stories / Floors Engine: Decimals round UP (3.5➔4, 4.2➔5), multi-values/ranges pick max (2&3➔3, 1,2➔2, 2/3➔3), negative values leave blank (-5➔blank), none/blank leaves blank.',
    cleaner: null // Attached below
  },
  coordinates: {
    id: 'coordinates',
    name: 'Coordinates Converter',
    icon: '🌐',
    badge: 'DMS ➔ Decimal (6 Dec)',
    description: 'Coordinate Converter: Converts Degrees, Minutes, Seconds (DMS) coordinates to 6-decimal Decimal Degrees (DD). Logic: DD = Deg + (Min / 60) + (Sec / 3600), Direction: N(+), E(+), S(-), W(-), preserves existing decimals, order, and row alignment.',
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

    // 0. Check continuous self-training memory database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('year', str);
      if (learned !== undefined && learned !== null && learned !== '') {
        return String(learned);
      }
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
  get COVERING_ATTACHMENT() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.COVERING_ATTACHMENT) || {}; },
  get DECK_ATTACHMENT() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.DECK_ATTACHMENT) || {}; },
  get ANCHORAGE() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.ANCHORAGE) || {}; },
  get HAIL() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.HAIL) || {}; },
  get TANK() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.TANK) || {}; },
  get CHIMNEY() { const td = _resolveTouchstoneData(); return (td && td.ROOF && td.ROOF.CHIMNEY) || {}; }
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

  COVERING_ATTACHMENT_WEAKNESS: {
    '4': 100, // Mortar (brittle / weakest)
    '2': 80,  // Nails/staples
    '3': 50,  // Adhesive/epoxy
    '1': 20,  // Screws (strongest)
    '0': 0
  },

  DECK_ATTACHMENT_WEAKNESS: {
    '2': 80,  // Nails (generic)
    '5': 70,  // 6d nails @ 6/12
    '6': 60,  // 8d nails @ 6/12
    '7': 50,  // 8d nails @ 6/6 (HVHZ hurricane resistance)
    '3': 40,  // Adhesive/epoxy
    '1': 20,  // Screws/bolts
    '4': 10,  // Structurally connected (strongest)
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
    COVERING_ATTACHMENT: {
      '1': ['screws', 'screwed', 'mechanical screws', 'self tapping screws', 'fastened with screws', 'screwed covering', 'stress plates screws', 'mechanically attached screws'],
      '2': ['nails', 'staples', 'nailed', 'stapled', 'roofing nails', 'wire staples', 'nailed shingles', 'nails staples', 'shingle nails'],
      '3': ['adhesive', 'epoxy', 'adhered', 'fully adhered', 'glued', 'foam adhesive', 'tile adhesive', 'hot asphalt adhesive', 'cold adhesive', 'chemically bonded', 'adhesive covering'],
      '4': ['mortar', 'mortar set', 'mortar bed', 'mud set', 'cement mortar', 'mortar bedded', 'wet laid tile', 'mortar set tile']
    },
    DECK_ATTACHMENT: {
      '1': ['screws bolts', 'screws', 'bolts', 'deck screws', 'bolted deck', 'screw attached deck', 'lag bolts', 'puddle welded', 'welded deck', 'fastened with screws'],
      '2': ['nails', 'nailed deck', 'deck nails', 'face nailed', 'nailed sheathing', 'nailed subfloor'],
      '3': ['adhesive epoxy', 'structural adhesive', 'glued deck', 'adhesive deck', 'subfloor adhesive', 'foam adhesive deck'],
      '4': ['structurally connected', 'shear studs', 'monolithic deck', 'composite deck connection', 'welded steel deck', 'integral connection'],
      '5': ['6d nails @ 6 spacing 12 on center', '6d nails 6 12', '6d @ 6/12', '6d 6 12', '6d nails 6 inch', '6d nails', '6d at 6 12', '6d @ 6 12', '6d 6 on center'],
      '6': ['8d nails @ 6 spacing 12 on center', '8d nails 6 12', '8d @ 6/12', '8d 6 12', '8d nails 6 inch', '8d nails', '8d at 6 12', '8d @ 6 12'],
      '7': ['8d nails @ 6 spacing 6 on center', '8d nails 6 6', '8d @ 6/6', '8d 6 6', '8d at 6 6', '8d @ 6 6', 'hvhz deck nailing', 'miami dade deck nailing']
    },
    ANCHORAGE: {
      '1': ['hurricane ties', 'hurricane ties 1', 'hurricane tie', 'hurricane straps', 'hurricane strap', 'hurricane clips', 'hurricane clip', 'seismic ties', 'seismic tie', 'seismic straps', 'uplift straps', 'truss ties', 'rafter ties', 'hurricane tie down'],
      '2': ['nails screws', 'nails screws 2', 'nails', 'screws', 'nailed', 'screwed', 'toe nailing', 'toe nailed', 'toenailed', 'toe nail', 'toenail', 'screws nails'],
      '3': ['anchor bolts', 'anchor bolts 3', 'anchor bolt', 'through bolts', 'through bolt', 'expansion bolts', 'expansion bolt', 'bolted connection', 'bolted', 'anchor bolted'],
      '4': ['gravity friction', 'gravity friction 4', 'gravity', 'friction', 'gravity or friction', 'unanchored', 'no ties', 'dead load only', 'friction only', 'no anchorage'],
      '5': ['adhesive epoxy', 'adhesive epoxy 5', 'epoxy', 'chemical anchor', 'resin anchor', 'epoxy anchor', 'structural adhesive', 'glued connection', 'epoxy anchored'],
      '6': ['structurally connected', 'structurally connected 6', 'structural connection', 'structurally anchored', 'concrete tie beam', 'tie beam', 'monolithic tie', 'welded connection', 'embedded plates', 'bond beam'],
      '7': ['clips', 'clips 7', 'framing clips', 'metal clips', 'roof clips', 'simpson clips', 'framing clip', 'metal clip', 'roof clip']
    },
    HAIL: {
      '1': ['impact class a', 'impact resistant a', 'class a hail', 'class 1 hail', 'ul 2218 class 1'],
      '2': ['impact class b', 'impact resistant b', 'class b hail', 'class 2 hail', 'ul 2218 class 2'],
      '3': ['impact class c', 'impact resistant c', 'class c hail', 'class 3 hail', 'ul 2218 class 3'],
      '4': ['impact class d', 'impact resistant d', 'class d hail', 'class 4 hail', 'ul 2218 class 4', 'fm 4473 class 4', 'class 4 impact']
    },
    TANK: {
      '1': ['no tank', 'no rooftop tank', 'without tank'],
      '2': ['tank', 'rooftop tank', 'water tank', 'chiller tank', 'fuel tank', 'roof tank']
    },
    CHIMNEY: {
      '1': ['no chimney', 'without chimney'],
      '2': ['chimney less than 2', 'chimney <2ft', 'short chimney', 'chimney under 2 feet'],
      '3': ['chimney 2-5ft', 'chimney 2 to 5', 'standard chimney', 'chimney 3ft', 'chimney 4ft'],
      '4': ['chimney more than 5', 'chimney >5ft', 'tall chimney', 'chimney 6ft', 'chimney 8ft']
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
    if (!synonymCategory) return candidates;
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

    // Explicit verbal / inequality pitch cues
    if (/(?:>|more\s*than|greater\s*than)\s*30(?:\s*(?:deg|degree|degrees|°))?\b/i.test(lower) ||
      /\b(?:high\s*pitch|high\s*slope|steep\s*pitch|steep\s*slope|steep|sharp\s*pitch)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/(?:>|more\s*than|greater\s*than)\s*30/i), isExplicit: true });
    } else if (/(?:<|less\s*than|under)\s*10(?:\s*(?:deg|degree|degrees|°))?\b/i.test(lower) ||
      /\b(?:low\s*pitch|low\s*slope|shallow\s*pitch|nearly\s*flat|flat\s*pitch)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: getPct(/(?:<|less\s*than|under)\s*10/i), isExplicit: true });
    } else if (/\b(?:10\s*(?:to|-)\s*30|medium\s*pitch|medium\s*slope|mod(?:erate)?\s*pitch|standard\s*pitch|normal\s*pitch)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:medium\s*pitch|medium\s*slope)\b/), isExplicit: true });
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
    if (degMatch && !candidates.some(c => c.isExplicit)) {
      const deg = parseFloat(degMatch[1]);
      let code = '2';
      if (deg < 10) code = '1';
      else if (deg <= 30.5) code = '2';
      else code = '3';
      candidates.push({ code, percent: defaultPct, isExplicit: true, deg: deg });
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
   * Detect all covering attachment candidates in a text segment
   */
  findCoveringAttachmentCandidates(text, defaultPct) {
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

    // Explicit code check (e.g. "Covering Attachment: 1", "Roof Covering Attachment (2)")
    const explicitMatch = text.match(/(?:cov(?:ering)?\s*attach(?:ment)?|covering\s*fasten(?:ing)?)[\s:]*(?:code\s*|#|\(\s*)?([0-4])(?:\s*\)|\b)/i);
    if (explicitMatch && RoofTaxonomy.COVERING_ATTACHMENT[explicitMatch[1]]) {
      candidates.push({ code: explicitMatch[1], percent: defaultPct, isExplicitCode: true });
    }

    // 4. Mortar
    if (/\b(?:mortar(?:\s*set|\s*bed|\s*bedded)?|mud\s*set|wet\s*laid(?:\s*tile)?|cement\s*mortar|bedded\s*in\s*mortar)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:mortar|mud\s*set|wet\s*laid)\b/) });
    }

    // 3. Adhesive/epoxy
    if (/\b(?:fully\s*adhered|adhered(?:\s*membrane)?|foam\s*adhesive|tile\s*adhesive|hot\s*(?:mop|asphalt)\s*adhesive|cold\s*adhesive|epoxy\s*(?:adhered|bonded)|glued\s*(?:membrane|covering)|chemical\s*adhesive)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\b(?:adhered|adhesive|epoxy|glued)\b/) });
    }

    // 2. Nails/staples
    if (/\b(?:roofing\s*nails?|nails?\s*(?:\/|\s*or\s*|\s*and\s*)?staples?|staples?(?:\s*fastened)?|nailed\s*(?:shingles?|tiles?|covering)|stapled\s*felt|wire\s*staples?)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:nails?\s*(?:\/|and)?\s*staples?|roofing\s*nails?|stapled)\b/) });
    }

    // 1. Screws
    if (/\b(?:mechanical\s*screws?|self\s*tapping\s*screws?|screwed\s*(?:membrane|covering|panels?)|stress\s*plates?\s*screws?|fastened\s*with\s*screws|screws\s*covering)\b/i.test(lower) ||
      (/\bwith\s*screws\b/i.test(lower) && !/\b(?:deck|subfloor|truss|rafter)\b/i.test(lower))) {
      candidates.push({ code: '1', percent: getPct(/\b(?:screws?|screwed)\b/) });
    }

    // Fuzzy matching fallback
    if (candidates.length === 0 && this.SYNONYMS.COVERING_ATTACHMENT) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.COVERING_ATTACHMENT, defaultPct, 0.72));
    }

    return candidates;
  },

  /**
   * Detect all deck attachment candidates in a text segment
   */
  findDeckAttachmentCandidates(text, defaultPct) {
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

    // Explicit code check (e.g. "Deck Attachment: 5", "Deck Attach (7)")
    const explicitMatch = text.match(/(?:deck\s*attach(?:ment)?|deck\s*fasten(?:ing)?)[\s:]*(?:code\s*|#|\(\s*)?([0-7])(?:\s*\)|\b)/i);
    if (explicitMatch && RoofTaxonomy.DECK_ATTACHMENT[explicitMatch[1]]) {
      candidates.push({ code: explicitMatch[1], percent: defaultPct, isExplicitCode: true });
    }

    // 7. 8d nails @ 6 spacing, 6 on center (HVHZ schedule)
    if (/\b8d\s*(?:nails?)?\s*@?\s*6(?:\s*(?:in|inch|")?|[\s\/\-])(?:spacing,?\s*)?6\b/i.test(lower) ||
      /\b8d\s*@\s*6\s*[\/,]\s*6\b/i.test(lower) ||
      /\b8d\s*6\s*6\b/i.test(lower) ||
      /\b(?:hvhz|miami[-\s]?dade)\s*(?:deck\s*)?nailing\b/i.test(lower)) {
      candidates.push({ code: '7', percent: getPct(/\b8d.*6.*6\b/) });
    }

    // 6. 8d nails @ 6 spacing, 12 on center
    if (/\b8d\s*(?:nails?)?\s*@?\s*6(?:\s*(?:in|inch|")?|[\s\/\-])(?:spacing,?\s*)?12\b/i.test(lower) ||
      /\b8d\s*@\s*6\s*[\/,]\s*12\b/i.test(lower) ||
      /\b8d\s*6\s*12\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b8d.*6.*12\b/) });
    }

    // 5. 6d nails @ 6 spacing, 12 on center
    if (/\b6d\s*(?:nails?)?\s*@?\s*6(?:\s*(?:in|inch|")?|[\s\/\-])(?:spacing,?\s*)?12\b/i.test(lower) ||
      /\b6d\s*@\s*6\s*[\/,]\s*12\b/i.test(lower) ||
      /\b6d\s*6\s*12\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\b6d.*6.*12\b/) });
    }

    // 4. Structurally connected deck
    if (/\b(?:structurally\s*connected\s*deck|welded\s*(?:metal|steel)\s*deck|puddle\s*welds?|shear\s*studs?|monolithic\s*concrete\s*deck|composite\s*deck\s*connection)\b/i.test(lower) ||
      (/\bstructurally\s*connected\b/i.test(lower) && /\bdeck\b/i.test(lower))) {
      candidates.push({ code: '4', percent: getPct(/\b(?:structurally\s*connected|welded\s*deck|shear\s*studs?)\b/) });
    }

    // 3. Adhesive/epoxy deck
    if (/\b(?:deck(?:ing)?\s*adhesive|subfloor\s*adhesive|foam\s*adhesive\s*deck|glued\s*(?:deck|sheathing)|epoxy\s*bonded\s*deck)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\b(?:deck\s*adhesive|glued\s*deck)\b/) });
    }

    // 1. Screws/bolts
    if (/\b(?:deck\s*screws?|bolted\s*deck|screw\s*attached\s*deck|lag\s*bolts?\s*deck)\b/i.test(lower) ||
      (/\b(?:screws?\s*(?:\/|\s*and\s*|\s*or\s*)?bolts?)\b/i.test(lower) && /\bdeck\b/i.test(lower))) {
      candidates.push({ code: '1', percent: getPct(/\b(?:screws?\s*bolts?|deck\s*screws?|bolted\s*deck)\b/) });
    }

    // 2. Nails (generic deck nails)
    if (!candidates.some(c => ['5', '6', '7'].includes(c.code)) &&
      /\b(?:nailed\s*(?:deck|sheathing|subfloor)|deck\s*nails?|face\s*nailed\s*deck)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\bnailed\s*deck\b/) });
    }

    // Fuzzy matching fallback
    if (candidates.length === 0 && this.SYNONYMS.DECK_ATTACHMENT) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.DECK_ATTACHMENT, defaultPct, 0.72));
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

    // 3. Anchor bolts
    if (/\b(?:anchor\s*bolts?|anchored\s*(?:by|with)?\s*bolts?|through[\s-]?bolts?|expansion\s*bolts?|bolted\s*(?:connection|anchorage)?)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: getPct(/\b(?:anchor\s*bolts?|through[\s-]?bolts?|expansion\s*bolts?|bolted)\b/) });
    }

    // 6. Structurally Connected
    if (/\b(?:structurally\s*connected\s*(?:to\s*wall|connection)?|monolithic(?:ally)?\s*(?:connected|tied)?|concrete\s*tie[\s-]?beam|reinforced\s*tie[\s-]?beam|welded\s*(?:anchorage|truss\s*connection)?|embedded\s*plates?)\b/i.test(lower) &&
      !/\bdeck\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\b(?:structurally\s*connected|tie[\s-]?beam|welded)\b/) });
    } else if (/\b(?:concrete\s*tie[\s-]?beam|reinforced\s*tie[\s-]?beam|monolithic\s*tie\s*beam)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: getPct(/\btie[\s-]?beam\b/) });
    }

    // 7. Clips (when not hurricane clips)
    if (/\b(?:framing\s*clips?|metal\s*clips?|roof\s*clips?|simpson\s*clips?)\b/i.test(lower) ||
      (/\bclips?\b/i.test(lower) && !/\b(?:hurricane|paper)\b/i.test(lower) && !/\bdeck\b/i.test(lower))) {
      candidates.push({ code: '7', percent: getPct(/\b(?:clips?|framing\s*clips?|metal\s*clips?|roof\s*clips?|simpson\s*clips?)\b/) });
    }

    // 5. Adhesive epoxy
    if (/\b(?:adhesive\s*epoxy\s*(?:anchors?|anchorage)?|epoxy\s*(?:anchors?|anchored)|chemical\s*anchors?|resin\s*anchors?)\b/i.test(lower)) {
      candidates.push({ code: '5', percent: getPct(/\b(?:adhesive\s*epoxy|epoxy\s*anchor|chemical\s*anchor)\b/) });
    }

    // 4. Gravity/friction
    if (/\b(?:gravity\s*(?:\/|\s*or\s*|\s+)?friction|gravity(?:\s*load)?\s*only|friction\s*only|unanchored|no\s*(?:anchorage|ties|straps))\b/i.test(lower)) {
      candidates.push({ code: '4', percent: getPct(/\b(?:gravity|friction|unanchored)\b/) });
    }

    // 2. Nails/Screws (Toe-nailing or general roof-to-wall connection)
    // Only detect if explicitly toe-nailed or explicit roof anchorage nails/screws (not covering/deck attachment words)
    if (/\b(?:toe[\s-]?nail(?:ed|ing|s)?|anchorage[\s:]*\s*nails?|anchored\s*with\s*(?:nails|screws)|rafter\s*toe\s*nailing|truss\s*nailing)\b/i.test(lower) ||
      (/\b(?:nails?\s*\/\s*screws?|screws?\s*\/\s*nails?)\b/i.test(lower) && !/\b(?:shingle|felt|tile|deck)\b/i.test(lower))) {
      candidates.push({ code: '2', percent: getPct(/\b(?:toe[\s-]?nail(?:ed|ing)?|nails?\s*\/\s*screws?)\b/) });
    } else if (/\b(?:screws|nails)\b/i.test(lower) && !candidates.length && !/\b(?:shingle|felt|tile|deck|plywood|osb|metal\s*panel)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: getPct(/\b(?:nails|screws)\b/) });
    }

    // Fuzzy matching fallback if regex didn't match
    if (candidates.length === 0 && this.SYNONYMS.ANCHORAGE) {
      candidates.push(...this.findFuzzyCandidates(text, this.SYNONYMS.ANCHORAGE, defaultPct, 0.70));
    }

    return candidates;
  },

  /**
   * Detect Hail Impact Resistance candidates
   */
  findHailCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();
    if (/\b(?:(?:impact\s*resistant\s*|class\s*|ul\s*2218\s*class\s*|fm\s*4473\s*class\s*)(?:4|d)\b|class\s*4\s*impact|2[-\s]?inch\s*steel\s*ball)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: defaultPct });
    } else if (/\b(?:(?:impact\s*resistant\s*|class\s*|ul\s*2218\s*class\s*|fm\s*4473\s*class\s*)(?:3|c)\b|class\s*3\s*impact|1\.75\s*inch\s*steel)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
    } else if (/\b(?:(?:impact\s*resistant\s*|class\s*|ul\s*2218\s*class\s*|fm\s*4473\s*class\s*)(?:2|b)\b|class\s*2\s*impact|1\.5\s*inch\s*steel)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: defaultPct });
    } else if (/\b(?:(?:impact\s*resistant\s*|class\s*|ul\s*2218\s*class\s*|fm\s*4473\s*class\s*)(?:1|a)\b|class\s*1\s*impact|1\.25\s*inch\s*steel)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: defaultPct });
    }
    return candidates;
  },

  /**
   * Detect Rooftop Tank candidates
   */
  findTankCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();
    if (/\b(?:no\s*(?:rooftop\s*)?tank|without\s*tank|tank:\s*no)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: defaultPct });
    } else if (/\b(?:rooftop\s*tank|roof\s*tank|water\s*tank\s*on\s*roof|chiller\s*tank|fuel\s*tank\s*on\s*roof|tank:\s*yes)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: defaultPct });
    }
    return candidates;
  },

  /**
   * Detect Chimney candidates
   */
  findChimneyCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();
    if (/\b(?:no\s*chimney|without\s*chimney|chimney:\s*no)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: defaultPct });
    } else if (/\b(?:chimney\s*(?:<|less\s*than|under)\s*2\s*(?:ft|feet)?|chimney\s*short)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: defaultPct });
    } else if (/\b(?:chimney\s*(?:>|more\s*than|greater\s*than|over)\s*5\s*(?:ft|feet)?|tall\s*chimney|chimney\s*(?:6|7|8|10)\s*(?:ft|feet)?)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: defaultPct });
    } else if (/\b(?:chimney\s*(?:2\s*[-–to]\s*5|2-5)\s*(?:ft|feet)?|chimney\s*(?:3|4)\s*(?:ft|feet)?)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
    } else if (/\bchimney\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
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
        const wA = (weaknessMap && weaknessMap[a.code]) || 0;
        const wB = (weaknessMap && weaknessMap[b.code]) || 0;
        return wB - wA;
      });
      return unique[0].code;
    }

    // No percentages present: pick WEAKER material (higher weakness score)
    unique.sort((a, b) => {
      const wA = (weaknessMap && weaknessMap[a.code]) || 0;
      const wB = (weaknessMap && weaknessMap[b.code]) || 0;
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
   * Parse a single row or tab-delimited row into the 7 primary components + additional fields
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
        covAttachCode: '',
        covAttach: '',
        covAttachName: '',
        covAttachShort: '',
        coveringAttachmentCode: '',
        coveringAttachment: '',
        deckAttachCode: '',
        deckAttach: '',
        deckAttachName: '',
        deckAttachShort: '',
        deckAttachmentCode: '',
        deckAttachment: '',
        anchorageCode: '',
        anchorage: '',
        anchorageName: '',
        anchorageShort: '',
        hailCode: '',
        hail: '',
        hailName: '',
        hailShort: '',
        tankCode: '',
        tank: '',
        tankName: '',
        tankShort: '',
        chimneyCode: '',
        chimney: '',
        chimneyName: '',
        chimneyShort: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank'
      };
    }

    // 0. Check continuous self-training memory database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learnedRoof = CustomCodesDB.matchLearned('roof', str);
      if (learnedRoof && typeof learnedRoof === 'object') {
        const geomCode = String(learnedRoof.geometryCode || learnedRoof.geomCode || learnedRoof.geom || '0');
        const pitchCode = String(learnedRoof.pitchCode || learnedRoof.pitch || '0');
        const covCode = String(learnedRoof.coveringCode || learnedRoof.covCode || learnedRoof.cov || '0');
        const deckCode = String(learnedRoof.deckCode || learnedRoof.deck || '0');
        const covAttachCode = String(learnedRoof.covAttachCode || learnedRoof.covAttach || learnedRoof.coveringAttachmentCode || '0');
        const deckAttachCode = String(learnedRoof.deckAttachCode || learnedRoof.deckAttach || learnedRoof.deckAttachmentCode || '0');
        const anchorCode = String(learnedRoof.anchorageCode || learnedRoof.anchorCode || learnedRoof.anchor || '0');

        const geomObj = RoofTaxonomy.GEOMETRY[geomCode];
        const pitchObj = RoofTaxonomy.PITCH[pitchCode];
        const covObj = RoofTaxonomy.COVERING[covCode];
        const deckObj = RoofTaxonomy.DECK[deckCode];
        const covAttachObj = RoofTaxonomy.COVERING_ATTACHMENT[covAttachCode];
        const deckAttachObj = RoofTaxonomy.DECK_ATTACHMENT[deckAttachCode];
        const anchorObj = RoofTaxonomy.ANCHORAGE[anchorCode];

        const format = options.format || 'code_only';
        function formatField(obj) {
          if (!obj) return '';
          if (format === 'code_only') return obj.code;
          if (format === 'name_only') return obj.name;
          if (format === 'short_code') return `${obj.shortName} (${obj.code})`;
          return `${obj.name} (${obj.code})`;
        }

        const recCount = (geomCode && geomCode !== '0' ? 1 : 0) + (pitchCode && pitchCode !== '0' ? 1 : 0) + (covCode && covCode !== '0' ? 1 : 0) + (deckCode && deckCode !== '0' ? 1 : 0) + (covAttachCode && covAttachCode !== '0' ? 1 : 0) + (deckAttachCode && deckAttachCode !== '0' ? 1 : 0) + (anchorCode && anchorCode !== '0' ? 1 : 0);

        return {
          original: rawRow,
          geometryCode: geomCode,
          geometry: formatField(geomObj) || geomCode,
          geometryName: geomObj ? geomObj.name : '',
          geometryShort: geomObj ? geomObj.shortName : '',
          pitchCode: pitchCode,
          pitch: formatField(pitchObj) || pitchCode,
          pitchName: pitchObj ? pitchObj.name : '',
          pitchShort: pitchObj ? pitchObj.shortName : '',
          coveringCode: covCode,
          covering: formatField(covObj) || covCode,
          coveringName: covObj ? covObj.name : '',
          coveringShort: covObj ? covObj.shortName : '',
          deckCode: deckCode,
          deck: formatField(deckObj) || deckCode,
          deckName: deckObj ? deckObj.name : '',
          deckShort: deckObj ? deckObj.shortName : '',
          covAttachCode: covAttachCode,
          covAttach: formatField(covAttachObj) || covAttachCode,
          covAttachName: covAttachObj ? covAttachObj.name : '',
          covAttachShort: covAttachObj ? covAttachObj.shortName : '',
          coveringAttachmentCode: covAttachCode,
          coveringAttachment: formatField(covAttachObj) || covAttachCode,
          deckAttachCode: deckAttachCode,
          deckAttach: formatField(deckAttachObj) || deckAttachCode,
          deckAttachName: deckAttachObj ? deckAttachObj.name : '',
          deckAttachShort: deckAttachObj ? deckAttachObj.shortName : '',
          deckAttachmentCode: deckAttachCode,
          deckAttachment: formatField(deckAttachObj) || deckAttachCode,
          anchorageCode: anchorCode,
          anchorage: formatField(anchorObj) || anchorCode,
          anchorageName: anchorObj ? anchorObj.name : '',
          anchorageShort: anchorObj ? anchorObj.shortName : '',
          hailCode: '0', hail: '', tankCode: '0', tank: '', chimneyCode: '0', chimney: '',
          recognizedCount: recCount,
          status: 'match',
          statusText: '🧠 Trained & Learned (From Memory)'
        };
      }
    }

    // Unknown / 0-unknown: any input that is purely "unknown" or "0-unknown" (or variants)
    // maps all seven roof fields to code 0 (Unknown/default).
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
        covAttachCode: '0',
        covAttach: unknownDisplay(fmt),
        covAttachName: 'Unknown/default',
        covAttachShort: 'Unknown',
        coveringAttachmentCode: '0',
        coveringAttachment: unknownDisplay(fmt),
        deckAttachCode: '0',
        deckAttach: unknownDisplay(fmt),
        deckAttachName: 'Unknown/default',
        deckAttachShort: 'Unknown',
        deckAttachmentCode: '0',
        deckAttachment: unknownDisplay(fmt),
        anchorageCode: '0',
        anchorage: unknownDisplay(fmt),
        anchorageName: 'Unknown/default',
        anchorageShort: 'Unknown',
        hailCode: '0',
        hail: '0',
        hailName: 'Unknown/Non-impact-resistant',
        hailShort: 'Non-impact',
        tankCode: '0',
        tank: '0',
        tankName: 'Unknown/default',
        tankShort: 'Unknown',
        chimneyCode: '0',
        chimney: '0',
        chimneyName: 'Unknown/default',
        chimneyShort: 'Unknown',
        recognizedCount: 7,
        status: 'match',
        statusText: '✓ Complete (All 7 Fields Defaulted to 0)'
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
    const covAttachCandidates = [];
    const deckAttachCandidates = [];
    const anchorCandidates = [];
    const hailCandidates = [];
    const tankCandidates = [];
    const chimneyCandidates = [];

    for (const seg of segments) {
      geomCandidates.push(...this.findGeometryCandidates(seg.text, seg.percent));
      pitchCandidates.push(...this.findPitchCandidates(seg.text, seg.percent));
      deckCandidates.push(...this.findDeckCandidates(seg.text, seg.percent));
      covCandidates.push(...this.findCoveringCandidates(seg.text, seg.percent));
      covAttachCandidates.push(...this.findCoveringAttachmentCandidates(seg.text, seg.percent));
      deckAttachCandidates.push(...this.findDeckAttachmentCandidates(seg.text, seg.percent));
      anchorCandidates.push(...this.findAnchorageCandidates(seg.text, seg.percent));
      hailCandidates.push(...this.findHailCandidates(seg.text, seg.percent));
      tankCandidates.push(...this.findTankCandidates(seg.text, seg.percent));
      chimneyCandidates.push(...this.findChimneyCandidates(seg.text, seg.percent));
    }

    // Fallback full-text scan if any field wasn't found via segments
    if (geomCandidates.length === 0) geomCandidates.push(...this.findGeometryCandidates(fullText, null));
    if (pitchCandidates.length === 0) pitchCandidates.push(...this.findPitchCandidates(fullText, null));
    if (deckCandidates.length === 0) deckCandidates.push(...this.findDeckCandidates(fullText, null));
    if (covCandidates.length === 0) covCandidates.push(...this.findCoveringCandidates(fullText, null));
    if (covAttachCandidates.length === 0) covAttachCandidates.push(...this.findCoveringAttachmentCandidates(fullText, null));
    if (deckAttachCandidates.length === 0) deckAttachCandidates.push(...this.findDeckAttachmentCandidates(fullText, null));
    if (anchorCandidates.length === 0) anchorCandidates.push(...this.findAnchorageCandidates(fullText, null));
    if (hailCandidates.length === 0) hailCandidates.push(...this.findHailCandidates(fullText, null));
    if (tankCandidates.length === 0) tankCandidates.push(...this.findTankCandidates(fullText, null));
    if (chimneyCandidates.length === 0) chimneyCandidates.push(...this.findChimneyCandidates(fullText, null));

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

    // Resolve Covering, Deck, Attachments & Anchorage
    let covCode = this.resolveCandidates(covCandidates, this.COVERING_WEAKNESS, 'covering');
    let deckCode = this.resolveCandidates(deckCandidates, this.DECK_WEAKNESS, 'deck');
    let covAttachCode = this.resolveCandidates(covAttachCandidates, this.COVERING_ATTACHMENT_WEAKNESS, 'covering_attachment');
    let deckAttachCode = this.resolveCandidates(deckAttachCandidates, this.DECK_ATTACHMENT_WEAKNESS, 'deck_attachment');
    let anchorCode = this.resolveCandidates(anchorCandidates, this.ANCHORAGE_WEAKNESS, 'anchorage');
    let hailCode = this.resolveCandidates(hailCandidates, null, 'hail');
    let tankCode = this.resolveCandidates(tankCandidates, null, 'tank');
    let chimneyCode = this.resolveCandidates(chimneyCandidates, null, 'chimney');

    // Resolve labels
    const geomObj = RoofTaxonomy.GEOMETRY[geomCode];
    const pitchObj = RoofTaxonomy.PITCH[pitchCode];
    const covObj = RoofTaxonomy.COVERING[covCode];
    const deckObj = RoofTaxonomy.DECK[deckCode];
    const covAttachObj = RoofTaxonomy.COVERING_ATTACHMENT[covAttachCode];
    const deckAttachObj = RoofTaxonomy.DECK_ATTACHMENT[deckAttachCode];
    const anchorObj = RoofTaxonomy.ANCHORAGE[anchorCode];
    const hailObj = RoofTaxonomy.HAIL[hailCode];
    const tankObj = RoofTaxonomy.TANK[tankCode];
    const chimneyObj = RoofTaxonomy.CHIMNEY[chimneyCode];

    const format = options.format || 'code_only';

    function formatField(obj) {
      if (!obj) return '';
      if (format === 'code_only') return obj.code;
      if (format === 'name_only') return obj.name;
      if (format === 'short_code') return `${obj.shortName} (${obj.code})`;
      return `${obj.name} (${obj.code})`;
    }

    const geomDisplay = formatField(geomObj);
    const pitchDisplay = formatField(pitchObj);
    const covDisplay = formatField(covObj);
    const deckDisplay = formatField(deckObj);
    const covAttachDisplay = formatField(covAttachObj);
    const deckAttachDisplay = formatField(deckAttachObj);
    const anchorDisplay = formatField(anchorObj);

    const recognizedCount = (geomCode ? 1 : 0) + (pitchCode ? 1 : 0) + (covCode ? 1 : 0) + (deckCode ? 1 : 0) + (covAttachCode ? 1 : 0) + (deckAttachCode ? 1 : 0) + (anchorCode ? 1 : 0);

    let status = 'assigned';
    let statusText = `Separated (${recognizedCount}/7 Fields)`;
    if (recognizedCount === 7) {
      status = 'match';
      statusText = '✓ Complete (All 7 Fields Identified)';
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
      covAttachCode: covAttachCode || '',
      covAttach: covAttachDisplay,
      covAttachName: covAttachObj ? covAttachObj.name : '',
      covAttachShort: covAttachObj ? covAttachObj.shortName : '',
      coveringAttachmentCode: covAttachCode || '',
      coveringAttachment: covAttachDisplay,
      coveringAttachmentName: covAttachObj ? covAttachObj.name : '',
      deckAttachCode: deckAttachCode || '',
      deckAttach: deckAttachDisplay,
      deckAttachName: deckAttachObj ? deckAttachObj.name : '',
      deckAttachShort: deckAttachObj ? deckAttachObj.shortName : '',
      deckAttachmentCode: deckAttachCode || '',
      deckAttachment: deckAttachDisplay,
      deckAttachmentName: deckAttachObj ? deckAttachObj.name : '',
      anchorageCode: anchorCode || '',
      anchorage: anchorDisplay,
      anchorageName: anchorObj ? anchorObj.name : '',
      anchorageShort: anchorObj ? anchorObj.shortName : '',
      hailCode: hailCode || '',
      hail: hailObj ? hailObj.name : '',
      hailName: hailObj ? hailObj.name : '',
      hailShort: hailObj ? hailObj.shortName : '',
      tankCode: tankCode || '',
      tank: tankObj ? tankObj.name : '',
      tankName: tankObj ? tankObj.name : '',
      tankShort: tankObj ? tankObj.shortName : '',
      chimneyCode: chimneyCode || '',
      chimney: chimneyObj ? chimneyObj.name : '',
      chimneyName: chimneyObj ? chimneyObj.name : '',
      chimneyShort: chimneyObj ? chimneyObj.shortName : '',
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

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          geometry: '—',
          geometryCode: '',
          geometryName: '',
          geometryShort: '',
          pitch: '—',
          pitchCode: '',
          pitchName: '',
          pitchShort: '',
          covering: '—',
          coveringCode: '',
          coveringName: '',
          coveringShort: '',
          deck: '—',
          deckCode: '',
          deckName: '',
          deckShort: '',
          covAttach: '—',
          covAttachCode: '',
          covAttachName: '',
          covAttachShort: '',
          coveringAttachment: '—',
          coveringAttachmentCode: '',
          deckAttach: '—',
          deckAttachCode: '',
          deckAttachName: '',
          deckAttachShort: '',
          deckAttachment: '—',
          deckAttachmentCode: '',
          anchorage: '—',
          anchorageCode: '',
          anchorageName: '',
          anchorageShort: '',
          recognizedCount: 0,
          status: 'empty',
          statusText: 'Blank',
          changed: false
        });
        return;
      }

      const parsed = this.parseRoofRow(line, options);
      // Cleaned output contains pure codes for direct Excel columns (7 primary Touchstone fields)
      const cleaned = [
        parsed.geometryCode || '',
        parsed.pitchCode || '',
        parsed.coveringCode || '',
        parsed.deckCode || '',
        parsed.covAttachCode || '',
        parsed.deckAttachCode || '',
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
        covAttach: parsed.covAttach,
        covAttachCode: parsed.covAttachCode,
        covAttachName: parsed.covAttachName,
        covAttachShort: parsed.covAttachShort,
        coveringAttachment: parsed.coveringAttachment,
        coveringAttachmentCode: parsed.coveringAttachmentCode,
        deckAttach: parsed.deckAttach,
        deckAttachCode: parsed.deckAttachCode,
        deckAttachName: parsed.deckAttachName,
        deckAttachShort: parsed.deckAttachShort,
        deckAttachment: parsed.deckAttachment,
        deckAttachmentCode: parsed.deckAttachmentCode,
        anchorage: parsed.anchorage,
        anchorageCode: parsed.anchorageCode,
        anchorageName: parsed.anchorageName,
        anchorageShort: parsed.anchorageShort,
        hail: parsed.hail,
        hailCode: parsed.hailCode,
        tank: parsed.tank,
        tankCode: parsed.tankCode,
        chimney: parsed.chimney,
        chimneyCode: parsed.chimneyCode,
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
  get WALL_SIDING() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.WALL_SIDING) || {}; },
  get GLASS_TYPE() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.GLASS_TYPE) || {}; },
  get GLASS_PERCENTAGE() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.GLASS_PERCENTAGE) || {}; },
  get WINDOW_PROTECTION() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.WINDOW_PROTECTION) || {}; },
  get EXTERIOR_DOORS() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.EXTERIOR_DOORS) || {}; },
  get BUILDING_EXTERIOR_OPENING() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.BUILDING_EXTERIOR_OPENING) || {}; },
  get BRICK_VENEER() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.BRICK_VENEER) || {}; },
  get FIRE_RATING_WALL_SIDING() { const td = _resolveTouchstoneData(); return (td && td.WALL && td.WALL.FIRE_RATING_WALL_SIDING) || {}; }
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

  GLASS_TYPE_WEAKNESS: {
    '1': 100, // Annealed (breaks into large shards)
    '3': 70,  // Heat strengthened
    '5': 50,  // Insulating glass units (IGU)
    '2': 40,  // Tempered (crumbles safely)
    '4': 20,  // Laminated (impact resistant)
    '0': 0
  },

  GLASS_PCT_WEAKNESS: {
    '4': 100, // Greater than 60%
    '3': 70,  // Between 20% and 60%
    '2': 40,  // Between 5% and 20%
    '1': 20,  // Less than 5%
    '0': 0
  },

  WINDOW_PROT_WEAKNESS: {
    '1': 100, // No protection
    '2': 60,  // Non-engineered shutters
    '3': 20,  // Engineered shutters
    '0': 0
  },

  EXT_DOORS_WEAKNESS: {
    '5': 100, // Sliding doors
    '2': 80,  // Double width doors
    '1': 60,  // Single width doors
    '6': 40,  // Reinforced sliding doors
    '4': 30,  // Reinforced double width doors
    '3': 20,  // Reinforced single width doors
    '0': 0
  },

  OPENING_WEAKNESS: {
    '2': 100, // More than 50% wall open
    '1': 30,  // Less than 50% wall open
    '0': 0
  },

  BRICK_VENEER_WEAKNESS: {
    '1': 100, // More than 90%
    '0': 70,  // 50-90% (Default)
    '2': 50,  // 25-50%
    '3': 20,  // 0-25%
  },

  FIRE_RATING_WEAKNESS: {
    '3': 100, // Class C
    '2': 60,  // Class B
    '1': 20,  // Class A
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
      parts = text.split(/\band\b|\b&\b/i);
    } else if (text.includes('/') && !text.includes('%')) {
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
      candidates.push({ code: '1', percent: getPct(/\bbrick\b/) });
    }

    return candidates;
  },

  /**
   * Detect Glass Type candidates (Glass Type: Codes 0–5)
   */
  findGlassTypeCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    // 4. Laminated impact glass
    if (/\b(?:laminated(?:\s*glass)?|impact\s*glass|hurricane\s*glass|pvb|sentry-?glas|missile\s*(?:impact|resistant)\s*glass|security\s*glass)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: defaultPct });
    }

    // 5. Insulating glass units (IGU / double / triple pane)
    if (/\b(?:insulating\s*glass(?:\s*units?)?|igu\b|insulated\s*glass|double\s*pane|triple\s*pane|double\s*glazed|triple\s*glazed|thermal\s*glazing|dual\s*pane)\b/i.test(lower)) {
      candidates.push({ code: '5', percent: defaultPct });
    }

    // 2. Tempered safety glass
    if (/\b(?:tempered(?:\s*glass)?|toughened\s*glass|safety\s*glass|fully\s*tempered)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: defaultPct });
    }

    // 3. Heat strengthened glass
    if (/\b(?:heat\s*strengthened|semi-?tempered|hs\s*glass)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
    }

    // 1. Annealed float / plate glass
    if (/\b(?:annealed(?:\s*glass)?|float\s*glass|plate\s*glass|standard\s*plate\s*glass|regular\s*glass|monolithic\s*annealed)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: defaultPct });
    }

    return candidates;
  },

  /**
   * Detect Glass Percentage candidates (Glass Percentage: Codes 0–4)
   */
  findGlassPercentageCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    // Check for explicit comparison prefixes e.g. "<5% glass", "< 5%", "less than 5%", ">60%"
    if (/\b(?:less\s*than\s*5%|< ?5%|under\s*5%(?:\s*glass)?|minimal\s*glass|solid\s*wall\s*minimal\s*windows)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: 3 });
      return candidates;
    }
    if (/\b(?:greater\s*than\s*60%|> ?60%|more\s*than\s*60%|curtain\s*wall|all-?glass\s*(?:facade|envelope)|glass\s*tower|glazed\s*curtainwall)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: 80 });
      return candidates;
    }
    if (/\b(?:between\s*20%\s*and\s*60%|20-?60%\s*glass|20%\s*to\s*60%\s*glass|ribbon\s*windows|high\s*fenestration)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: 40 });
      return candidates;
    }
    if (/\b(?:between\s*5%\s*and\s*20%|5-?20%\s*glass|5%\s*to\s*20%\s*glass|moderate\s*glazing|standard\s*windows)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: 12 });
      return candidates;
    }

    // Check for explicit glass percentage pattern e.g. "15% glass", "glazing 45%", "glass: 70%"
    const mGlassPct = text.match(/(?:(?:glass|glazing|fenestration|window\s*area)\s*(?:is|:|=)?\s*([<>~]?\s*\d+(?:\.\d+)?)\s*%|([<>~]?\s*\d+(?:\.\d+)?)\s*%\s*(?:glass|glazing|fenestration|window\s*area))/i);
    if (mGlassPct) {
      const rawStr = (mGlassPct[1] || mGlassPct[2] || '').trim();
      const isLess = rawStr.startsWith('<');
      const isGreater = rawStr.startsWith('>');
      const val = parseFloat(rawStr.replace(/[<>~]/g, ''));
      if (isLess && val <= 5) candidates.push({ code: '1', percent: val });
      else if (isGreater && val >= 60) candidates.push({ code: '4', percent: val });
      else if (val < 5) candidates.push({ code: '1', percent: val });
      else if (val <= 20) candidates.push({ code: '2', percent: val });
      else if (val <= 60) candidates.push({ code: '3', percent: val });
      else candidates.push({ code: '4', percent: val });
      return candidates;
    }

    return candidates;
  },

  /**
   * Detect Window Protection candidates (Window Protection: Codes 0–3)
   */
  findWindowProtectionCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    // 3. Engineered shutters
    if (/\b(?:engineered\s*shutters?|hurricane\s*shutters?|impact\s*shutters?|roll-?down\s*shutters?|motorized\s*shutters?|miami-?dade\s*(?:noa|shutters?)|astm\s*e1996|impact\s*screens?|storm\s*shutters?\s*engineered|certified\s*shutters?|bermuda\s*shutters?\s*impact)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
    }

    // 2. Non-engineered shutters
    if (/\b(?:non-?engineered\s*shutters?|plywood\s*(?:covers?|panels?|shutters?)|storm\s*panels?\s*(?:uncertified|plywood)?|temporary\s*shutters?|wood(?:en)?\s*shutters?|manual\s*storm\s*panels?|accordion\s*shutters?\s*non-?engineered|unrated\s*shutters?)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: defaultPct });
    }

    // 1. No protection
    if (/\b(?:no\s*(?:window\s*)?protection|unprotected\s*windows?|no\s*shutters?|without\s*shutters?|standard\s*glazing\s*unprotected)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: defaultPct });
    }

    return candidates;
  },

  /**
   * Detect Exterior Doors candidates (Exterior Doors: Codes 0–6)
   */
  findExteriorDoorsCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    // 6. Reinforced sliding doors
    if (/\b(?:reinforced\s*sliding\s*(?:glass\s*)?doors?|impact\s*sliding\s*doors?|hurricane\s*sliding\s*doors?|heavy\s*duty\s*sliding\s*doors?)\b/i.test(lower)) {
      candidates.push({ code: '6', percent: defaultPct });
    }

    // 5. Sliding doors
    if (/\b(?:sliding\s*(?:glass\s*)?doors?|patio\s*doors?|glass\s*sliders?|sliding\s*patio\s*doors?)\b/i.test(lower) && !candidates.some(c => c.code === '6')) {
      candidates.push({ code: '5', percent: defaultPct });
    }

    // 4. Reinforced double width doors
    if (/\b(?:reinforced\s*double\s*(?:width\s*)?doors?|impact\s*double\s*doors?|reinforced\s*french\s*doors?|heavy\s*duty\s*double\s*doors?|hurricane\s*double\s*doors?)\b/i.test(lower)) {
      candidates.push({ code: '4', percent: defaultPct });
    }

    // 3. Reinforced single width doors
    if (/\b(?:reinforced\s*single\s*(?:width\s*)?doors?|impact\s*single\s*doors?|reinforced\s*(?:entry|exterior)\s*doors?|heavy\s*duty\s*single\s*doors?|hurricane\s*single\s*doors?)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
    }

    // 2. Double width doors
    if (/\b(?:double\s*(?:width\s*)?doors?|french\s*doors?|double\s*entry\s*doors?|pair\s*of\s*doors?|2\s*leaf\s*doors?|double\s*exterior\s*doors?)\b/i.test(lower) && !candidates.some(c => c.code === '4')) {
      candidates.push({ code: '2', percent: defaultPct });
    }

    // 1. Single width doors
    if (/\b(?:single\s*(?:width\s*)?doors?|single\s*door|standard\s*entry\s*door|single\s*exterior\s*door|1\s*leaf\s*door)\b/i.test(lower) && !candidates.some(c => c.code === '3')) {
      candidates.push({ code: '1', percent: defaultPct });
    }

    return candidates;
  },

  /**
   * Detect Building Exterior Opening candidates (Building Exterior Opening: Codes 0–2)
   */
  findBuildingExteriorOpeningCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    // 2. More than 50% wall open
    if (/\b(?:more\s*than\s*50%(?:\s*of)?(?:\s*wall)?\s*open|> ?50%\s*open|>= ?50%\s*open|open\s*storefront|large\s*openings?|ground\s*floor\s*open|open\s*facade)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: 75 });
      return candidates;
    }

    // 1. Less than 50% wall open
    if (/\b(?:less\s*than\s*50%(?:\s*of)?(?:\s*wall)?\s*open|< ?50%\s*open|<= ?50%\s*open|standard\s*openings?|punched\s*openings?|solid\s*walls?)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: 25 });
      return candidates;
    }

    // Check for explicit opening percentage e.g. "60% open", "openings: 30%"
    const mOpenPct = text.match(/(?:(?:wall\s*openings?|exterior\s*openings?|open\s*wall)\s*(?:is|:|=)?\s*([<>~]?\s*\d+(?:\.\d+)?)\s*%|([<>~]?\s*\d+(?:\.\d+)?)\s*%\s*(?:wall\s*open|openings?|open))/i);
    if (mOpenPct) {
      const rawStr = (mOpenPct[1] || mOpenPct[2] || '').trim();
      const isGreater = rawStr.startsWith('>');
      const val = parseFloat(rawStr.replace(/[<>~]/g, ''));
      if (isGreater || val > 50) candidates.push({ code: '2', percent: val });
      else candidates.push({ code: '1', percent: val });
      return candidates;
    }

    return candidates;
  },

  /**
   * Detect Brick Veneer percentage candidates (Brick Veneer: Codes 0–3)
   */
  findBrickVeneerCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    // Look for explicit brick veneer % e.g. "95% brick veneer", "brick veneer 30%"
    const mBV = text.match(/(?:(?:brick\s*veneer|masonry\s*veneer)\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%\s*(?:brick\s*veneer|masonry\s*veneer))/i);
    if (mBV) {
      const val = parseFloat(mBV[1] || mBV[2]);
      if (val > 90) candidates.push({ code: '1', percent: val });
      else if (val >= 25 && val <= 50) candidates.push({ code: '2', percent: val });
      else if (val < 25) candidates.push({ code: '3', percent: val });
      else candidates.push({ code: '0', percent: val }); // 50-90% default
      return candidates;
    }

    // 1. More than 90%
    if (/\b(?:more\s*than\s*90%\s*brick\s*veneer|> ?90%\s*(?:brick\s*veneer|veneer)|all\s*brick\s*veneer|100%\s*brick\s*veneer)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: defaultPct });
    }

    // 2. 25-50%
    if (/\b(?:25-?50%\s*(?:brick\s*veneer|veneer)|25%\s*to\s*50%\s*brick\s*veneer|partial\s*brick\s*veneer)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: defaultPct });
    }

    // 3. 0-25%
    if (/\b(?:0-?25%\s*(?:brick\s*veneer|veneer)|0%\s*to\s*25%\s*brick\s*veneer|minimal\s*brick\s*veneer|brick\s*wainscot)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
    }

    return candidates;
  },

  /**
   * Detect Fire Rating for Wall Siding candidates (Fire Rating: Codes 0–3)
   */
  findFireRatingWallSidingCandidates(text, defaultPct) {
    const candidates = [];
    const lower = text.toLowerCase();

    // 1. Fire Rated Class A
    if (/\b(?:fire\s*rated\s*class\s*a|class\s*a\s*fire(?:\s*rating)?|class\s*a\s*siding|non-?combustible\s*siding|flame\s*spread\s*class\s*a)\b/i.test(lower)) {
      candidates.push({ code: '1', percent: defaultPct });
    }

    // 2. Fire Rated Class B
    if (/\b(?:fire\s*rated\s*class\s*b|class\s*b\s*fire(?:\s*rating)?|class\s*b\s*siding|treated\s*wood\s*siding\s*class\s*b)\b/i.test(lower)) {
      candidates.push({ code: '2', percent: defaultPct });
    }

    // 3. Fire Rated Class C
    if (/\b(?:fire\s*rated\s*class\s*c|class\s*c\s*fire(?:\s*rating)?|class\s*c\s*siding|standard\s*untreated\s*wood\s*siding)\b/i.test(lower)) {
      candidates.push({ code: '3', percent: defaultPct });
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
      unique.sort((a, b) => {
        const pA = a.percent !== null ? a.percent : -1;
        const pB = b.percent !== null ? b.percent : -1;
        if (pB !== pA) return pB - pA; // Higher % wins
        // Tie-breaker: weaker material wins
        const wA = (weaknessMap && weaknessMap[a.code]) || 0;
        const wB = (weaknessMap && weaknessMap[b.code]) || 0;
        return wB - wA;
      });
      return unique[0].code;
    }

    // No percentages present: pick WEAKER material
    unique.sort((a, b) => {
      const wA = (weaknessMap && weaknessMap[a.code]) || 0;
      const wB = (weaknessMap && weaknessMap[b.code]) || 0;
      return wB - wA;
    });

    return unique[0].code;
  },

  /**
   * Parse a single row or tab-delimited input into all 9 Touchstone Wall Detail fields
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
        glassTypeCode: '0',
        glassType: '',
        glassTypeName: '',
        glassPercentageCode: '0',
        glassPercentage: '',
        glassPercentageName: '',
        windowProtectionCode: '0',
        windowProtection: '',
        windowProtectionName: '',
        exteriorDoorsCode: '0',
        exteriorDoors: '',
        exteriorDoorsName: '',
        buildingOpeningCode: '0',
        buildingOpening: '',
        buildingOpeningName: '',
        brickVeneerCode: '0',
        brickVeneer: '',
        brickVeneerName: '',
        fireRatingCode: '0',
        fireRating: '',
        fireRatingName: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank'
      };
    }

    // 0. Check continuous self-training memory database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learnedWall = CustomCodesDB.matchLearned('wall', str);
      if (learnedWall) {
        let wType = '';
        let wSiding = '';
        if (typeof learnedWall === 'object') {
          wType = String(learnedWall.wallTypeCode ?? learnedWall.wallType ?? learnedWall.type ?? '');
          wSiding = String(learnedWall.wallSidingCode ?? learnedWall.wallSiding ?? learnedWall.siding ?? '');
        } else if (typeof learnedWall === 'string') {
          const parts = learnedWall.split(/[\t,]/);
          wType = parts[0]?.trim() || '';
          wSiding = parts[1]?.trim() || '';
        }
        if (wType || wSiding) {
          const typeObj = WallTaxonomy.WALL_TYPE[wType];
          const sidingObj = WallTaxonomy.WALL_SIDING[wSiding];
          const format = options.format || 'code_only';
          const recCount = (wType ? 1 : 0) + (wSiding ? 1 : 0);
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
            glassTypeCode: '0',
            glassType: '0',
            glassPercentageCode: '0',
            glassPercentage: '0',
            windowProtectionCode: '0',
            windowProtection: '0',
            exteriorDoorsCode: '0',
            exteriorDoors: '0',
            buildingOpeningCode: '0',
            buildingOpening: '0',
            brickVeneerCode: '0',
            brickVeneer: '0',
            fireRatingCode: '0',
            fireRating: '0',
            recognizedCount: recCount,
            status: recCount === 2 ? 'match' : (recCount === 1 ? 'assigned' : 'mismatch'),
            statusText: recCount === 2 ? '✓ Learned (Both Fields)' : (recCount === 1 ? '✓ Learned (1 Field)' : '⚠️ Unrecognized')
          };
        }
      }
    }

    // Unknown / 0-unknown: any input that is purely "unknown" or "0-unknown"
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
        glassTypeCode: '0',
        glassType: '0',
        glassPercentageCode: '0',
        glassPercentage: '0',
        windowProtectionCode: '0',
        windowProtection: '0',
        exteriorDoorsCode: '0',
        exteriorDoors: '0',
        buildingOpeningCode: '0',
        buildingOpening: '0',
        brickVeneerCode: '0',
        brickVeneer: '0',
        fireRatingCode: '0',
        fireRating: '0',
        recognizedCount: 9,
        status: 'match',
        statusText: '✓ Complete (All Wall Fields Defaulted to 0)'
      };
    }

    // Check if row is tab-separated numbers (e.g. "1\t4" or "3\t1\t2\t2\t3\t2\t1\t0\t1")
    const numTabMatch = str.match(/^([0-9])\s*[\t,]\s*([0-9])(?:\s*[\t,]\s*([0-9]))?(?:\s*[\t,]\s*([0-9]))?(?:\s*[\t,]\s*([0-9]))?(?:\s*[\t,]\s*([0-9]))?(?:\s*[\t,]\s*([0-9]))?(?:\s*[\t,]\s*([0-9]))?(?:\s*[\t,]\s*([0-9]))?$/);
    if (numTabMatch) {
      const wType = numTabMatch[1] || '';
      const wSiding = numTabMatch[2] || '';
      const gType = numTabMatch[3] || '0';
      const gPct = numTabMatch[4] || '0';
      const wProt = numTabMatch[5] || '0';
      const extDr = numTabMatch[6] || '0';
      const bOpen = numTabMatch[7] || '0';
      const bVen = numTabMatch[8] || '0';
      const fRate = numTabMatch[9] || '0';

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
        glassTypeCode: gType,
        glassType: gType,
        glassPercentageCode: gPct,
        glassPercentage: gPct,
        windowProtectionCode: wProt,
        windowProtection: wProt,
        exteriorDoorsCode: extDr,
        exteriorDoors: extDr,
        buildingOpeningCode: bOpen,
        buildingOpening: bOpen,
        brickVeneerCode: bVen,
        brickVeneer: bVen,
        fireRatingCode: fRate,
        fireRating: fRate,
        recognizedCount: 2,
        status: 'match',
        statusText: '✓ Complete (Wall Fields Identified)'
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
    const glassTypeCandidates = [];
    const glassPctCandidates = [];
    const winProtCandidates = [];
    const extDoorsCandidates = [];
    const bOpenCandidates = [];
    const bVenCandidates = [];
    const fRateCandidates = [];

    for (const seg of segments) {
      typeCandidates.push(...this.findWallTypeCandidates(seg.text, seg.percent));
      sidingCandidates.push(...this.findWallSidingCandidates(seg.text, seg.percent));
      glassTypeCandidates.push(...this.findGlassTypeCandidates(seg.text, seg.percent));
      glassPctCandidates.push(...this.findGlassPercentageCandidates(seg.text, seg.percent));
      winProtCandidates.push(...this.findWindowProtectionCandidates(seg.text, seg.percent));
      extDoorsCandidates.push(...this.findExteriorDoorsCandidates(seg.text, seg.percent));
      bOpenCandidates.push(...this.findBuildingExteriorOpeningCandidates(seg.text, seg.percent));
      bVenCandidates.push(...this.findBrickVeneerCandidates(seg.text, seg.percent));
      fRateCandidates.push(...this.findFireRatingWallSidingCandidates(seg.text, seg.percent));
    }

    // Fallback full-text scan if any category wasn't found via segments
    if (typeCandidates.length === 0) typeCandidates.push(...this.findWallTypeCandidates(fullText, null));
    if (sidingCandidates.length === 0) sidingCandidates.push(...this.findWallSidingCandidates(fullText, null));
    if (glassTypeCandidates.length === 0) glassTypeCandidates.push(...this.findGlassTypeCandidates(fullText, null));
    if (glassPctCandidates.length === 0) glassPctCandidates.push(...this.findGlassPercentageCandidates(fullText, null));
    if (winProtCandidates.length === 0) winProtCandidates.push(...this.findWindowProtectionCandidates(fullText, null));
    if (extDoorsCandidates.length === 0) extDoorsCandidates.push(...this.findExteriorDoorsCandidates(fullText, null));
    if (bOpenCandidates.length === 0) bOpenCandidates.push(...this.findBuildingExteriorOpeningCandidates(fullText, null));
    if (bVenCandidates.length === 0) bVenCandidates.push(...this.findBrickVeneerCandidates(fullText, null));
    if (fRateCandidates.length === 0) fRateCandidates.push(...this.findFireRatingWallSidingCandidates(fullText, null));

    // Resolve WallType and WallSiding applying Underwriting Rules
    let wallTypeCode = this.resolveCandidates(typeCandidates, this.WALL_TYPE_WEAKNESS, 'wallType');
    let wallSidingCode = this.resolveCandidates(sidingCandidates, this.WALL_SIDING_WEAKNESS, 'wallSiding');

    // Contextual cross-resolution:
    if (wallSidingCode === '1' && !wallTypeCode) {
      if (/\b(?:frame|wood|stud)\b/i.test(fullText)) {
        wallTypeCode = '3';
      } else if (/\b(?:cmu|block|masonry\s*backup)\b/i.test(fullText)) {
        wallTypeCode = '2';
      }
    }

    if (wallSidingCode === '7' && !wallTypeCode) {
      if (/\b(?:cmu|block|masonry)\b/i.test(fullText)) {
        wallTypeCode = '2';
      } else if (/\b(?:frame|wood|stud)\b/i.test(fullText)) {
        wallTypeCode = '3';
      }
    }

    if (wallTypeCode === '1' && !wallSidingCode) {
      wallSidingCode = '1';
    }

    // Resolve Additional Wall Detail fields (Codes default to '0' Unknown if not specified)
    let glassTypeCode = this.resolveCandidates(glassTypeCandidates, this.GLASS_TYPE_WEAKNESS, 'glassType') || '0';
    let glassPercentageCode = this.resolveCandidates(glassPctCandidates, this.GLASS_PCT_WEAKNESS, 'glassPercentage') || '0';
    let windowProtectionCode = this.resolveCandidates(winProtCandidates, this.WINDOW_PROT_WEAKNESS, 'windowProtection') || '0';
    let exteriorDoorsCode = this.resolveCandidates(extDoorsCandidates, this.EXT_DOORS_WEAKNESS, 'exteriorDoors') || '0';
    let buildingOpeningCode = this.resolveCandidates(bOpenCandidates, this.OPENING_WEAKNESS, 'buildingOpening') || '0';
    let brickVeneerCode = this.resolveCandidates(bVenCandidates, this.BRICK_VENEER_WEAKNESS, 'brickVeneer') || '0';
    let fireRatingCode = this.resolveCandidates(fRateCandidates, this.FIRE_RATING_WEAKNESS, 'fireRating') || '0';

    // Auto-derive Class A Fire Rating for known non-combustible sidings if not explicitly rated
    if (fireRatingCode === '0') {
      if (wallSidingCode === '8' || wallSidingCode === '1' || wallSidingCode === '5') {
        // Fiber cement (8), Brick (1), Stone (5) are inherently Class A
        if (/\b(?:class\s*a|non-?combustible|fire\s*rated)\b/i.test(fullText)) {
          fireRatingCode = '1';
        }
      }
    }

    // Resolve labels
    const wallTypeObj = WallTaxonomy.WALL_TYPE[wallTypeCode];
    const wallSidingObj = WallTaxonomy.WALL_SIDING[wallSidingCode];
    const glassTypeObj = WallTaxonomy.GLASS_TYPE[glassTypeCode];
    const glassPctObj = WallTaxonomy.GLASS_PERCENTAGE[glassPercentageCode];
    const winProtObj = WallTaxonomy.WINDOW_PROTECTION[windowProtectionCode];
    const extDoorsObj = WallTaxonomy.EXTERIOR_DOORS[exteriorDoorsCode];
    const bOpenObj = WallTaxonomy.BUILDING_EXTERIOR_OPENING[buildingOpeningCode];
    const bVenObj = WallTaxonomy.BRICK_VENEER[brickVeneerCode];
    const fRateObj = WallTaxonomy.FIRE_RATING_WALL_SIDING[fireRatingCode];

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

    let recognizedCount = (wallTypeCode ? 1 : 0) + (wallSidingCode ? 1 : 0);
    if (glassTypeCode !== '0') recognizedCount++;
    if (glassPercentageCode !== '0') recognizedCount++;
    if (windowProtectionCode !== '0') recognizedCount++;
    if (exteriorDoorsCode !== '0') recognizedCount++;
    if (buildingOpeningCode !== '0') recognizedCount++;
    if (brickVeneerCode !== '0') recognizedCount++;
    if (fireRatingCode !== '0') recognizedCount++;

    let status = 'assigned';
    let statusText = `Separated (${recognizedCount} Wall Fields)`;
    if (wallTypeCode && wallSidingCode) {
      status = 'match';
      statusText = `✓ Complete (${recognizedCount} Wall Detail Fields Identified)`;
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
      glassTypeCode: glassTypeCode,
      glassType: glassTypeCode !== '0' ? (glassTypeObj ? `${glassTypeObj.name} (${glassTypeCode})` : glassTypeCode) : '0',
      glassTypeName: glassTypeObj ? glassTypeObj.name : 'Unknown/default',
      glassTypeShort: glassTypeObj ? glassTypeObj.shortName : 'Unknown',
      glassPercentageCode: glassPercentageCode,
      glassPercentage: glassPercentageCode !== '0' ? (glassPctObj ? `${glassPctObj.name} (${glassPercentageCode})` : glassPercentageCode) : '0',
      glassPercentageName: glassPctObj ? glassPctObj.name : 'Unknown/default',
      glassPercentageShort: glassPctObj ? glassPctObj.shortName : 'Unknown',
      windowProtectionCode: windowProtectionCode,
      windowProtection: windowProtectionCode !== '0' ? (winProtObj ? `${winProtObj.name} (${windowProtectionCode})` : windowProtectionCode) : '0',
      windowProtectionName: winProtObj ? winProtObj.name : 'Unknown/default',
      windowProtectionShort: winProtObj ? winProtObj.shortName : 'Unknown',
      exteriorDoorsCode: exteriorDoorsCode,
      exteriorDoors: exteriorDoorsCode !== '0' ? (extDoorsObj ? `${extDoorsObj.name} (${exteriorDoorsCode})` : exteriorDoorsCode) : '0',
      exteriorDoorsName: extDoorsObj ? extDoorsObj.name : 'Unknown/default',
      exteriorDoorsShort: extDoorsObj ? extDoorsObj.shortName : 'Unknown',
      buildingOpeningCode: buildingOpeningCode,
      buildingOpening: buildingOpeningCode !== '0' ? (bOpenObj ? `${bOpenObj.name} (${buildingOpeningCode})` : buildingOpeningCode) : '0',
      buildingOpeningName: bOpenObj ? bOpenObj.name : 'Unknown',
      buildingOpeningShort: bOpenObj ? bOpenObj.shortName : 'Unknown',
      brickVeneerCode: brickVeneerCode,
      brickVeneer: brickVeneerCode !== '0' ? (bVenObj ? `${bVenObj.name} (${brickVeneerCode})` : brickVeneerCode) : '0',
      brickVeneerName: bVenObj ? bVenObj.name : 'Unknown/default',
      brickVeneerShort: bVenObj ? bVenObj.shortName : 'Unknown',
      fireRatingCode: fireRatingCode,
      fireRating: fireRatingCode !== '0' ? (fRateObj ? `${fRateObj.name} (${fireRatingCode})` : fireRatingCode) : '0',
      fireRatingName: fRateObj ? fRateObj.name : 'Unknown/No Rating',
      fireRatingShort: fRateObj ? fRateObj.shortName : 'Unknown',
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

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          wallType: '—',
          wallTypeCode: '',
          wallTypeName: '',
          wallTypeShort: '',
          wallSiding: '—',
          wallSidingCode: '',
          wallSidingName: '',
          wallSidingShort: '',
          glassTypeCode: '0',
          glassPercentageCode: '0',
          windowProtectionCode: '0',
          exteriorDoorsCode: '0',
          buildingOpeningCode: '0',
          brickVeneerCode: '0',
          fireRatingCode: '0',
          recognizedCount: 0,
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const parsed = this.parseWallRow(line, options);
      // Cleaned output contains primary codes for direct Excel columns (WallType\tWallSiding)
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
        glassType: parsed.glassType,
        glassTypeCode: parsed.glassTypeCode,
        glassTypeName: parsed.glassTypeName,
        glassTypeShort: parsed.glassTypeShort,
        glassPercentage: parsed.glassPercentage,
        glassPercentageCode: parsed.glassPercentageCode,
        glassPercentageName: parsed.glassPercentageName,
        glassPercentageShort: parsed.glassPercentageShort,
        windowProtection: parsed.windowProtection,
        windowProtectionCode: parsed.windowProtectionCode,
        windowProtectionName: parsed.windowProtectionName,
        windowProtectionShort: parsed.windowProtectionShort,
        exteriorDoors: parsed.exteriorDoors,
        exteriorDoorsCode: parsed.exteriorDoorsCode,
        exteriorDoorsName: parsed.exteriorDoorsName,
        exteriorDoorsShort: parsed.exteriorDoorsShort,
        buildingOpening: parsed.buildingOpening,
        buildingOpeningCode: parsed.buildingOpeningCode,
        buildingOpeningName: parsed.buildingOpeningName,
        buildingOpeningShort: parsed.buildingOpeningShort,
        brickVeneer: parsed.brickVeneer,
        brickVeneerCode: parsed.brickVeneerCode,
        brickVeneerName: parsed.brickVeneerName,
        brickVeneerShort: parsed.brickVeneerShort,
        fireRating: parsed.fireRating,
        fireRatingCode: parsed.fireRatingCode,
        fireRatingName: parsed.fireRatingName,
        fireRatingShort: parsed.fireRatingShort,
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

/**
 * CleanExcel - Touchstone UNICEDE® Foundation Connection Classifier Engine
 * 
 * Analyzes and classifies foundation connection descriptions into Touchstone UNICEDE Codes 0–6:
 *  - Code 0: Unknown/default (0)
 *  - Code 1: Hurricane ties (1) (hurricane straps, seismic ties, uplift straps, hold-downs, clips)
 *  - Code 2: Nails/Screws (2) (toe-nailing, screws, nails, wood screws)
 *  - Code 3: Anchor Bolts (3) (sill plate bolts, foundation bolts, anchor bolts, expansion bolts, J-bolts)
 *  - Code 4: Gravity/Friction (4) (unanchored, dead load only, gravity, friction, resting on foundation)
 *            [For industrial facilities: Unanchored equipment]
 *  - Code 5: Adhesive/Epoxy (5) (chemical adhesive anchor, structural epoxy, resin anchor)
 *  - Code 6: Structurally Connected (6) (monolithic concrete tie, welded connection, embed plates, continuous rebar)
 *            [For industrial facilities: Anchored equipment]
 * 
 * Verisk Retrofit Rule:
 *  - For Verisk Earthquake Model for the United States, you must specify Gravity/Friction (4) if you want to use the Retrofit Measures option Foundation anchorage (bolting) (4).
 */
const FoundationConnectionClassifier = {
  get TAXONOMY() {
    const td = _resolveTouchstoneData();
    if (td && td.FOUNDATION && td.FOUNDATION.FOUNDATION_CONNECTION) {
      return td.FOUNDATION.FOUNDATION_CONNECTION;
    }
    return {
      "0": { code: "0", name: "Unknown/default", shortName: "Unknown / Default", industrialEquiv: "Unknown/default" },
      "1": { code: "1", name: "Hurricane ties", shortName: "Hurricane ties" },
      "2": { code: "2", name: "Nails/Screws", shortName: "Nails / Screws" },
      "3": { code: "3", name: "Anchor Bolts", shortName: "Anchor Bolts" },
      "4": { code: "4", name: "Gravity/Friction", shortName: "Gravity / Friction", industrialEquiv: "Unanchored" },
      "5": { code: "5", name: "Adhesive/Epoxy", shortName: "Adhesive / Epoxy" },
      "6": { code: "6", name: "Structurally Connected", shortName: "Structurally Connected", industrialEquiv: "Anchored" }
    };
  },

  PATTERNS: [
    // Code 1: Hurricane ties
    {
      code: '1',
      regex: /\b(?:hurricane\s*(?:ties?|straps?|clips?)|seismic\s*(?:ties?|clips?|straps?)|uplift\s*straps?|hold\s*[-–—]?\s*downs?|simpson\s*(?:ties?|strong[- ]tie|straps?)|tie\s*[-–—]?\s*downs?|foundation\s*clips?)\b/i
    },
    // Code 5: Adhesive/Epoxy (check before generic anchor/screws)
    {
      code: '5',
      regex: /\b(?:adhesive\s*(?:\/|\band\b)?\s*epoxy|epoxy\s*(?:anchors?|dowels?|bonding|adhesive)?|chemical\s*(?:anchors?|adhesive)|resin\s*anchors?|structural\s*epoxy|glued\s*to\s*foundation|epoxy)\b/i
    },
    // Code 6: Structurally Connected (and industrial: Anchored)
    {
      code: '6',
      regex: /\b(?:structurally\s*connected|structural\s*connection|monolithic(?:\s*(?:concrete|tie\s*beam|connection))?|welded(?:\s*(?:connection|plates?|embeds?))?|embed(?:\s*plates?)?|continuous\s*rebar|cast[- ]in[- ]place\s*embed|\banchored\s*equipment\b|\banchored\b(?!\s*bolt)|\banchor\b(?!\s*bolt))\b/i
    },
    // Code 3: Anchor Bolts
    {
      code: '3',
      regex: /\b(?:anchor\s*bolts?|foundation\s*bolts?|sill\s*(?:plate\s*)?bolts?|bolted(?:\s*foundation|\s*sill|\s*to\s*foundation)?|bolting|expansion\s*bolts?|j\s*[-–—]?\s*bolts?|wedge\s*anchors?|foundation\s*anchorage\s*\(\s*bolting\s*\)|mechanical\s*anchor\s*bolts?)\b/i
    },
    // Code 4: Gravity/Friction (and industrial: Unanchored)
    {
      code: '4',
      regex: /\b(?:gravity\s*(?:\/|\band\b)?\s*friction|gravity(?:\s*load)?|friction(?:\s*only)?|unanchored(?:\s*equipment)?|dead\s*(?:weight|load)(?:\s*only)?|resting\s*on\s*foundation|unbolted|no\s*(?:mechanical\s*)?connection|none|not\s*anchored)\b/i
    },
    // Code 2: Nails/Screws
    {
      code: '2',
      regex: /\b(?:nails?\s*(?:\/|\band\b)?\s*screws?|toe\s*[-–—]?\s*nail(?:ing|ed|s)?|framing\s*nails?|wood\s*screws?|mechanical\s*screws?|nailed|screwed|face\s*nailed|\bnails?\b|\bscrews?\b)\b/i
    },
    // Code 0: Unknown/default
    {
      code: '0',
      regex: /\b(?:unknown|default|unk|tbd|unspecified)\b/i
    }
  ],

  /**
   * Classifies a raw foundation connection description or code
   */
  classify(raw, options = {}) {
    if (raw === undefined || raw === null) return { code: '', name: '', shortName: '', status: 'empty', statusText: 'Blank' };
    const str = String(raw).trim();
    if (!str) return { code: '', name: '', shortName: '', status: 'empty', statusText: 'Blank' };

    // 0. Check continuous self-training learned memory
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('foundation_connection', str) || CustomCodesDB.matchLearned('foundation', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = typeof learned === 'object' ? (learned.foundationConnectionCode || learned.code || '') : String(learned);
        if (c && this.TAXONOMY[c]) {
          const item = this.TAXONOMY[c];
          return this._formatResult(str, c, item, options, true);
        }
      }
    }

    // 1. Direct numeric code match (0 to 6)
    const directCode = str.match(/(?:(?:foundation\s*connection|connection|code)\s*[:=]?\s*|^|\b)([0-6])(?:\b|$)/i);
    if (directCode && str.length <= 8) {
      const code = directCode[1];
      const item = this.TAXONOMY[code];
      return this._formatResult(str, code, item, options);
    }

    // 2. Pattern matching
    for (const p of this.PATTERNS) {
      if (p.regex.test(str)) {
        const item = this.TAXONOMY[p.code];
        return this._formatResult(str, p.code, item, options);
      }
    }

    // Default unknown / unrecognized
    return {
      original: str,
      code: '',
      name: '',
      shortName: '',
      cleaned: '',
      perils: ['CA EQ', 'HI EQ', 'HI TC', 'JP EQ', 'NZ EQ', 'US EQ', 'US HU', 'US ST'],
      status: 'mismatch',
      statusText: '⚠️ Unrecognized Connection',
      changed: true
    };
  },

  _formatResult(original, code, item, options = {}, isLearned = false) {
    const format = options.format || 'code_only';
    const name = item ? item.name : '';
    const shortName = item ? item.shortName : '';
    const perils = item && item.perils ? item.perils : ['CA EQ', 'HI EQ', 'HI TC', 'JP EQ', 'NZ EQ', 'US EQ', 'US HU', 'US ST'];
    const industrialEquiv = item && item.industrialEquiv ? item.industrialEquiv : null;
    const retrofitNote = item && item.retrofitNote ? item.retrofitNote : null;

    let cleaned = code;
    if (format === 'name_only') cleaned = name;
    else if (format === 'name_code') cleaned = `${name} (${code})`;
    else if (format === 'short_code') cleaned = `${shortName} (${code})`;
    else if (format === 'code_name') cleaned = `${code} - ${shortName}`;

    const status = isLearned ? 'assigned' : (code === '0' ? 'unchanged' : 'assigned');
    const statusText = isLearned ? `🧠 Learned (${shortName})` : `✓ Code ${code} (${shortName})`;

    return {
      original,
      code,
      name,
      shortName,
      cleaned,
      perils,
      industrialEquiv,
      retrofitNote,
      status,
      statusText,
      changed: original !== cleaned
    };
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line !== undefined && line !== null) ? String(line).trim() : '';
      if (options.removeEmptyLines && !trimmed) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          name: '',
          shortName: '',
          foundationConnectionCode: '',
          foundationConnection: '—',
          foundationConnectionName: '',
          foundationConnectionShort: '',
          perils: 'CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST',
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const res = this.classify(trimmed, options);
      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: res.cleaned,
        code: res.code,
        name: res.name,
        shortName: res.shortName,
        foundationConnectionCode: res.code,
        foundationConnection: res.cleaned,
        foundationConnectionName: res.name,
        foundationConnectionShort: res.shortName,
        perils: res.perils && Array.isArray(res.perils) ? res.perils.join(', ') : 'CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST',
        industrialEquiv: res.industrialEquiv,
        retrofitNote: res.retrofitNote,
        changed: res.changed,
        status: res.status,
        statusText: res.statusText
      });
    });

    return results;
  }
};

/**
 * CleanExcel - Touchstone UNICEDE® Foundation Type Classifier Engine
 * 
 * Analyzes and classifies foundation type descriptions into Touchstone UNICEDE Codes 0–12:
 *  - Code 0: Unknown/default (0)
 *  - Code 1: Masonry basement (1) (brick/cmu basement, applicable for US, UK, Central Europe Inland Flood models, required when Floor of Interest = -1)
 *  - Code 2: Concrete basement (2) (cast-in-place concrete basement, required when Floor of Interest = -1)
 *  - Code 3: Masonry wall (3) (Touchstone maps this to Crawlspace cripple wall (4) upon import)
 *  - Code 4: Crawlspace cripple wall (wood) (4) (wood stud cripple wall, mandatory in Verisk EQ Model for US when applying Retrofit Bracing of cripple walls (1))
 *  - Code 5: Crawlspace masonry (wood) (5) (masonry stem wall crawlspace)
 *  - Code 6: Post & pier (6) (timber posts/piers, stilt foundation, raised pilings)
 *  - Code 7: Footing (7) (spread footing, strip footing, shallow continuous footing)
 *  - Code 8: Mat / slab (8) (slab-on-grade, raft foundation, floating slab, typical for mid-rise buildings)
 *  - Code 9: Pile (9) (driven piles, drilled caissons, deep foundation, typical for high-rise buildings & earthquake performance)
 *  - Code 10: No basement (10) (slab-on-grade without basement; not applicable for Verisk US EQ model)
 *  - Code 11: Engineering foundation (11) (special engineered foundation, seismic base isolation, micropiles)
 *  - Code 12: Crawlspace - raised (wood) (12) (elevated wood floor over open foundation, raised crawlspace)
 * 
 * Perils Supported:
 *  - CA EQ, CE IF, EU ETC, HI EQ, IT IF (v11.5), JP IF, JP EQ, JP TY, NZ EQ, SK TY (v13), UK/ROI IF (v13.0), US EQ, US HU, US IF
 */
const FoundationTypeClassifier = {
  taxonomy: {
    get FOUNDATION_TYPE() {
      const td = _resolveTouchstoneData();
      return (td && td.FOUNDATION && td.FOUNDATION.FOUNDATION_TYPE) || {
        "0": { code: "0", name: "Unknown/default", shortName: "Unknown / Default" },
        "1": { code: "1", name: "Masonry basement", shortName: "Masonry basement" },
        "2": { code: "2", name: "Concrete basement", shortName: "Concrete basement" },
        "3": { code: "3", name: "Masonry wall", shortName: "Masonry wall" },
        "4": { code: "4", name: "Crawlspace cripple wall (wood)", shortName: "Crawlspace cripple wall" },
        "5": { code: "5", name: "Crawlspace masonry (wood)", shortName: "Crawlspace masonry" },
        "6": { code: "6", name: "Post & pier", shortName: "Post & pier" },
        "7": { code: "7", name: "Footing", shortName: "Footing" },
        "8": { code: "8", name: "Mat / slab", shortName: "Mat / slab" },
        "9": { code: "9", name: "Pile", shortName: "Pile" },
        "10": { code: "10", name: "No basement", shortName: "No basement" },
        "11": { code: "11", name: "Engineering foundation", shortName: "Engineering foundation" },
        "12": { code: "12", name: "Crawlspace - raised (wood)", shortName: "Crawlspace - raised" }
      };
    }
  },

  TYPE_PATTERNS: [
    // 12. Crawlspace - raised (wood)
    { code: '12', regex: /\b(?:crawlspace\s*[-–—]?\s*raised|raised\s*(?:wood\s*)?crawlspace|elevated\s*crawlspace|raised\s*floor\s*(?:foundation|system)|raised\s*wood\s*crawl)\b/i },
    // 4. Crawlspace cripple wall (wood)
    { code: '4', regex: /\b(?:cripple\s*wall|crawlspace\s*cripple\s*wall|wood\s*cripple\s*wall|pony\s*wall|cripple\s*studs?|bracing\s*of\s*cripple\s*walls?)\b/i },
    // 5. Crawlspace masonry (wood)
    { code: '5', regex: /\b(?:crawlspace\s*masonry|masonry\s*crawlspace|cmu\s*crawlspace|brick\s*crawlspace|block\s*crawl\s*space|masonry\s*stem\s*wall)\b/i },
    // 3. Masonry wall (Touchstone maps to 4 upon import)
    { code: '3', regex: /\b(?:masonry\s*(?:foundation\s*)?wall|masonry\s*perimeter\s*wall|stem\s*wall\s*masonry|brick\s*wall\s*foundation)\b/i },
    // 1. Masonry basement
    { code: '1', regex: /\b(?:masonry\s*basement|brick\s*basement|cmu\s*basement|block\s*basement|stone\s*basement|masonry\s*cellar|brick\s*cellar)\b/i },
    // 2. Concrete basement
    { code: '2', regex: /\b(?:concrete\s*basement|poured\s*(?:concrete\s*)?basement|reinforced\s*concrete\s*basement|rc\s*basement|cast[- ]in[- ]place\s*basement|full\s*(?:concrete\s*)?basement|poured\s*cellar|concrete\s*cellar)\b/i },
    // 6. Post & pier
    { code: '6', regex: /\b(?:post\s*(?:&|and)\s*pier|pier\s*(?:&|and)\s*(?:beam|post)|timber\s*posts?|pilings?\s*(?:&|and)\s*piers?|stilt\s*(?:foundation|house)?|elevated\s*pilings?|piers?\s*foundation)\b/i },
    // 7. Footing
    { code: '7', regex: /\b(?:spread\s*footings?|strip\s*footings?|pad\s*footings?|shallow\s*footings?|continuous\s*footings?|concrete\s*footings?|\bfootings?\b|shallow\s*foundation)\b/i },
    // 10. No basement (check before generic slab)
    { code: '10', regex: /\b(?:no\s*basement|without\s*basement|non[- ]basement|zero\s*basement|no\s*cellar|at[- ]grade\s*foundation|slab\s*without\s*basement)\b/i },
    // 8. Mat / slab
    { code: '8', regex: /\b(?:mat\s*(?:foundation|slab)?|slab\s*[-–—]?\s*on\s*[-–—]?\s*grade|slab[- ]on[- ]grade|raft\s*foundation|monolithic\s*slab|floating\s*slab|concrete\s*slab\s*(?:foundation)?|mat\s*\/\s*slab|\bslab\b|mid[- ]rise\s*foundation)\b/i },
    // 9. Pile
    { code: '9', regex: /\b(?:pile\s*foundations?|deep\s*foundations?|driven\s*piles?|concrete\s*piles?|steel\s*(?:h[- ])?piles?|auger[- ]cast\s*piles?|caissons?|drilled\s*shafts?|friction\s*piles?|end\s*bearing\s*piles?|\bpiles?\b|high[- ]rise\s*foundation)\b/i },
    // 11. Engineering foundation
    { code: '11', regex: /\b(?:engineer(?:ing|ed)\s*foundations?|special\s*foundations?|geotechnical\s*foundations?|custom\s*engineered\s*foundations?|rock\s*anchors?\s*foundation|seismic\s*base\s*isolation)\b/i },
    // 0. Unknown / Default
    { code: '0', regex: /\b(?:unknown|default|unk|tbd|none|n\/a)\b/i }
  ],

  classifyFoundationType(raw, options = {}) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Check continuous self-training database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('foundation_type', str) || CustomCodesDB.matchLearned('foundation', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = typeof learned === 'object' ? (learned.foundationTypeCode || learned.code || '') : String(learned);
        if (c && this.taxonomy.FOUNDATION_TYPE[c]) {
          return this.taxonomy.FOUNDATION_TYPE[c];
        }
      }
    }

    const cleanStr = str.toLowerCase();

    // 1. Direct explicit numeric code match (0 to 12)
    const codeMatch = cleanStr.match(/(?:\bcode\s*|#|\(\s*|\[\s*|^)(\b(?:1[0-2]|[0-9])\b)(?:\s*\)|\s*\]|\b|$)/);
    if (codeMatch && (cleanStr.length <= 4 || /\b(?:code|#)\s*(?:1[0-2]|[0-9])\b/i.test(cleanStr) || /\(\s*(?:1[0-2]|[0-9])\s*\)/.test(cleanStr))) {
      const c = codeMatch[1];
      if (this.taxonomy.FOUNDATION_TYPE[c]) {
        return this.taxonomy.FOUNDATION_TYPE[c];
      }
    }

    // 2. Exact pattern matching
    for (const p of this.TYPE_PATTERNS) {
      if (p.regex.test(str)) {
        if (this.taxonomy.FOUNDATION_TYPE[p.code]) {
          return this.taxonomy.FOUNDATION_TYPE[p.code];
        }
      }
    }

    // 3. Generic basement fallback
    if (/\bbasement\b/i.test(cleanStr)) {
      if (/\b(?:concrete|poured|rc|cast[- ]in[- ]place)\b/i.test(cleanStr)) {
        return this.taxonomy.FOUNDATION_TYPE['2']; // Concrete basement
      } else if (/\b(?:masonry|brick|cmu|block|stone)\b/i.test(cleanStr)) {
        return this.taxonomy.FOUNDATION_TYPE['1']; // Masonry basement
      } else {
        return this.taxonomy.FOUNDATION_TYPE['2']; // Default basement to Concrete basement
      }
    }

    // 4. Generic crawlspace fallback
    if (/\bcrawl\s*space\b|\bcrawlspace\b/i.test(cleanStr)) {
      if (/\b(?:masonry|brick|cmu|block)\b/i.test(cleanStr)) {
        return this.taxonomy.FOUNDATION_TYPE['5']; // Crawlspace masonry
      } else if (/\b(?:cripple|stud)\b/i.test(cleanStr)) {
        return this.taxonomy.FOUNDATION_TYPE['4']; // Crawlspace cripple wall
      } else if (/\braised\b/i.test(cleanStr)) {
        return this.taxonomy.FOUNDATION_TYPE['12']; // Crawlspace - raised
      } else {
        return this.taxonomy.FOUNDATION_TYPE['4']; // Default crawlspace to cripple wall
      }
    }

    // 5. Taxonomy keywords matching
    const tax = this.taxonomy.FOUNDATION_TYPE;
    for (const [code, item] of Object.entries(tax)) {
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (cleanStr.includes(kw.toLowerCase())) {
            return item;
          }
        }
      }
    }

    return null;
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          foundationTypeCode: '',
          foundationType: '—',
          foundationTypeName: '',
          foundationTypeShort: '',
          perils: 'CA EQ, CE IF, EU ETC, HI EQ, IT IF, JP IF, JP EQ, JP TY, NZ EQ, SK TY, UK/ROI IF, US EQ, US HU, US IF',
          status: 'empty',
          statusText: 'Blank',
          changed: false
        });
        return;
      }

      const match = this.classifyFoundationType(line, options);
      const code = match ? match.code : '';
      const name = match ? match.name : '';
      const shortName = match ? match.shortName : '';

      const format = options.format || 'code_only';
      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = match ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = match ? `${shortName} (${code})` : trimmed;

      let status = 'assigned';
      let statusText = match ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized Foundation Type';

      if (!match) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Foundation Type';
      } else if (trimmed === code) {
        status = 'unchanged';
        statusText = `✓ Valid Code (${code})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: code,
        code: code,
        foundationTypeCode: code,
        foundationType: display,
        foundationTypeName: name,
        foundationTypeShort: shortName,
        perils: match && match.perils ? match.perils.join(', ') : 'CA EQ, CE IF, EU ETC, HI EQ, IT IF, JP IF, JP EQ, JP TY, NZ EQ, SK TY, UK/ROI IF, US EQ, US HU, US IF',
        status,
        statusText,
        changed: trimmed !== code
      });
    });

    return results;
  }
};

/**
 * CleanExcel - Foundation Detail (Type & Connection) Multi-Column Classifier Engine
 * Touchstone / UNICEDE Location Foundation Detail Fields (Codes 0-12 & 0-6)
 */
const FoundationClassifier = {
  get TAXONOMY() {
    if (typeof TouchstoneData !== 'undefined' && TouchstoneData.FOUNDATION) {
      return TouchstoneData.FOUNDATION;
    }
    return {
      FOUNDATION_TYPE: FoundationTypeClassifier.taxonomy.FOUNDATION_TYPE,
      FOUNDATION_CONNECTION: FoundationConnectionClassifier.TAXONOMY
    };
  },

  parseFoundationRow(rawRow, options = {}) {
    if (!rawRow || !rawRow.trim()) {
      return {
        original: rawRow || '',
        foundationTypeCode: '',
        foundationType: '—',
        foundationTypeName: '',
        foundationTypeShort: '',
        foundationConnectionCode: '',
        foundationConnection: '—',
        foundationConnectionName: '',
        foundationConnectionShort: '',
        recognizedCount: 0,
        status: 'empty',
        statusText: 'Blank'
      };
    }

    const str = rawRow.trim();

    // Check learned database first
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('foundation', str) || CustomCodesDB.matchLearned('foundation_type', str);
      if (learned && typeof learned === 'object') {
        const typeCode = learned.foundationTypeCode || learned.typeCode || '';
        const connCode = learned.foundationConnectionCode || learned.connCode || '';
        return this._buildResult(rawRow, typeCode, connCode, options);
      }
    }

    let detectedType = '';
    let detectedConn = '';

    // Handle tab-separated multi-column inputs (e.g. "12\t1" or "Mat slab\tBolted")
    if (str.includes('\t')) {
      const parts = str.split('\t').map(p => p.trim());
      const typePart = parts[0] || '';
      const connPart = parts[1] || '';

      if (typePart) {
        const typeRes = FoundationTypeClassifier.classifyFoundationType(typePart, options);
        if (typeRes && typeRes.code) detectedType = typeRes.code;
      }
      if (connPart) {
        const connRes = FoundationConnectionClassifier.classify(connPart, options);
        if (connRes && connRes.code) detectedConn = connRes.code;
      }
    }

    // If not detected via tab separation, try Type Classifier
    if (!detectedType) {
      const typeRes = FoundationTypeClassifier.classifyFoundationType(str, options);
      if (typeRes && typeRes.code) detectedType = typeRes.code;
    }

    // Try Connection Classifier
    if (!detectedConn) {
      const connRes = FoundationConnectionClassifier.classify(str, options);
      if (connRes && connRes.code && connRes.code !== '0') detectedConn = connRes.code;
    }

    return this._buildResult(rawRow, detectedType, detectedConn, options);
  },

  _buildResult(rawRow, typeCode, connCode, options = {}) {
    const format = options.format || 'code_only';
    const tax = this.TAXONOMY;

    const typeObj = (tax && tax.FOUNDATION_TYPE && tax.FOUNDATION_TYPE[typeCode]) || null;
    const connObj = (tax && tax.FOUNDATION_CONNECTION && tax.FOUNDATION_CONNECTION[connCode]) || null;

    let typeDisplay = typeCode || '—';
    if (typeObj) {
      if (format === 'name_only') typeDisplay = typeObj.name;
      else if (format === 'name_code') typeDisplay = `${typeObj.name} (${typeObj.code})`;
      else if (format === 'short_code') typeDisplay = `${typeObj.shortName} (${typeObj.code})`;
    }

    let connDisplay = connCode || '—';
    if (connObj) {
      if (format === 'name_only') connDisplay = connObj.name;
      else if (format === 'name_code') connDisplay = `${connObj.name} (${connObj.code})`;
      else if (format === 'short_code') connDisplay = `${connObj.shortName} (${connObj.code})`;
    }

    const recognizedCount = (typeCode ? 1 : 0) + (connCode ? 1 : 0);

    let status = 'assigned';
    let statusText = typeCode ? `✓ Identified (${typeObj ? typeObj.shortName : 'Code ' + typeCode})` : '⚠️ Unrecognized Foundation';
    if (recognizedCount === 2) {
      status = 'match';
      statusText = '✓ Complete (Type & Connection)';
    } else if (recognizedCount === 0) {
      status = 'mismatch';
      statusText = '⚠️ Unrecognized Foundation Format';
    }

    return {
      original: rawRow,
      foundationTypeCode: typeCode || '',
      foundationType: typeDisplay,
      foundationTypeName: typeObj ? typeObj.name : '',
      foundationTypeShort: typeObj ? typeObj.shortName : '',
      foundationConnectionCode: connCode || '',
      foundationConnection: connDisplay,
      foundationConnectionName: connObj ? connObj.name : '',
      foundationConnectionShort: connObj ? connObj.shortName : '',
      recognizedCount,
      status,
      statusText
    };
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          foundationType: '—',
          foundationTypeCode: '',
          foundationTypeName: '',
          foundationTypeShort: '',
          foundationConnection: '—',
          foundationConnectionCode: '',
          foundationConnectionName: '',
          foundationConnectionShort: '',
          recognizedCount: 0,
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const parsed = this.parseFoundationRow(line, options);
      const cleaned = parsed.foundationConnectionCode
        ? `${parsed.foundationTypeCode || '0'}\t${parsed.foundationConnectionCode}`
        : (parsed.foundationTypeCode || '');

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: cleaned,
        foundationType: parsed.foundationType,
        foundationTypeCode: parsed.foundationTypeCode,
        foundationTypeName: parsed.foundationTypeName,
        foundationTypeShort: parsed.foundationTypeShort,
        foundationConnection: parsed.foundationConnection,
        foundationConnectionCode: parsed.foundationConnectionCode,
        foundationConnectionName: parsed.foundationConnectionName,
        foundationConnectionShort: parsed.foundationConnectionShort,
        recognizedCount: parsed.recognizedCount,
        changed: true,
        status: parsed.status,
        statusText: parsed.statusText
      });
    });

    return results;
  }
};

// Wire up foundation_type, foundation, and foundation_connection cleaner references
CleanersRegistry.foundation_type.cleaner = FoundationTypeClassifier;
CleanersRegistry.foundationType = CleanersRegistry.foundation_type;
CleanersRegistry.foundation.cleaner = FoundationTypeClassifier;
CleanersRegistry.foundation_connection.cleaner = FoundationConnectionClassifier;
CleanersRegistry.foundationConnection = CleanersRegistry.foundation_connection;

/**
 * CleanExcel - Number of Stories / Stores Underwriting Cleaner Engine
 * 
 * Rules:
 *  1. Negative values leave blank: If input has a negative value, leave blank (e.g. -5 -> blank, -2 -> blank, 0 -> blank).
 *  2. Always whole number (hole no): Decimals round UP (Math.ceil, e.g. 3.5 -> 4, 4.2 -> 5, 1.1 -> 2).
 *  3. Multiple values / Ranges pick Maximum:
 *     - "2 & 3" -> 3
 *     - "1,2" -> 2
 *     - "2/3" -> 3
 *     - "2-4" -> 4
 *     - "2 and 3" -> 3
 *     - "1 to 3" -> 3
 *  4. Blank leaves blank: Empty string or whitespace -> blank ("").
 *  5. "non" / "none" / "n/a" -> blank:
 *     "non", "none", "no", "n/a", "na", "null", "nil", "-", "—", "unknown", "unk", "tbd", "0", "zero" -> blank ("").
 */
const NoOfStoresCleaner = {
  cleanStores(raw, options = {}) {
    if (raw === undefined || raw === null) return '';
    const str = String(raw).trim();
    if (!str) return '';

    // Handle "non", "none", "n/a", "-", "0", etc.
    if (/^(?:non|none|no|n\/?a|n\.a\.?|null|nil|not\s*applicable|unknown|unk|tbd|—+|-+|\.|\/|0|zero)$/i.test(str)) {
      return '';
    }

    // 0. Check continuous self-training memory database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('stores', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        return String(learned);
      }
    }

    // Common number words dictionary
    const wordMap = {
      'single': '1', 'one': '1', 'first': '1',
      'double': '2', 'two': '2', 'second': '2',
      'three': '3', 'third': '3',
      'four': '4', 'fourth': '4',
      'five': '5', 'fifth': '5',
      'six': '6', 'sixth': '6',
      'seven': '7', 'seventh': '7',
      'eight': '8', 'eighth': '8',
      'nine': '9', 'ninth': '9',
      'ten': '10', 'tenth': '10'
    };

    let processed = str;

    // Convert range hyphens between numbers so '-' isn't mistaken for a negative sign
    // e.g. "2-3" -> "2 & 3", "2 - 3" -> "2 & 3"
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/g, '$1 & $2');

    // Normalise negative numbers separated by spaces or word prefixes: e.g. "- 5" -> "-5", "minus 5" -> "-5"
    processed = processed.replace(/-\s+(\d)/g, '-$1');
    processed = processed.replace(/\b(?:negative|minus)\s*(\d+)/gi, '-$1');

    // Replace word numbers when bounded by word boundaries
    Object.keys(wordMap).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processed = processed.replace(regex, wordMap[word]);
    });

    // Extract all numbers (integers, floats, negative numbers)
    // Matches: 3.5, 4.2, -5, -2, 2, 3
    const numberMatches = processed.match(/-?\d+(?:\.\d+)?/g);
    if (!numberMatches || numberMatches.length === 0) {
      return '';
    }

    // Rule: Negative values leave blank (e.g. -5 -> blank, -2 -> blank)
    // Underwriting rule: Negative stories are impossible and must be left blank
    if (numberMatches.some(m => parseFloat(m) < 0)) {
      return '';
    }

    // Process each candidate:
    // Rule: Always whole number -> Math.ceil (round up)
    const roundUp = options.roundUpDecimals !== false;
    const validCandidates = numberMatches
      .map(m => {
        const parsed = parseFloat(m);
        if (isNaN(parsed) || parsed <= 0) return null;
        // Whole number (round up)
        return roundUp ? Math.ceil(parsed) : Math.floor(parsed);
      })
      .filter(n => n !== null && n > 0);

    if (validCandidates.length === 0) {
      return '';
    }

    // Rule: Multiple values / ranges pick maximum
    const pickMax = options.pickMax !== false;
    const finalVal = pickMax ? Math.max(...validCandidates) : validCandidates[0];
    return String(finalVal);
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? input.split(/\r\n|\r|\n/) : input;
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line !== undefined && line !== null) ? String(line).trim() : '';
      if (options.removeEmptyLines && !trimmed) {
        return;
      }

      const cleaned = this.cleanStores(trimmed, options);

      let status = 'unchanged';
      let statusText = '✓ Valid';

      if (!trimmed || /^(?:non|none|no|n\/?a|n\.a\.?|null|nil|not\s*applicable|unknown|unk|tbd|—+|-+|\.|\/|0|zero)$/i.test(trimmed)) {
        status = 'empty';
        statusText = 'Blank';
      } else if (!cleaned) {
        status = 'mismatch';
        if (/(?:^|[^\d])-\s*\d|\b(?:negative|minus)\b/i.test(trimmed)) {
          statusText = '⚠️ Negative Value → Blank';
        } else {
          statusText = '⚠️ Invalid / Blank';
        }
      } else if (trimmed === cleaned) {
        status = 'unchanged';
        statusText = '✓ Valid Stories';
      } else {
        status = 'assigned';
        const hasMultiple = (trimmed.match(/-?\d+(?:\.\d+)?/g) || []).length > 1 || /[/\\&,]|(?:to|and|or)/i.test(trimmed);
        const hadDecimal = /\d+\.\d+/.test(trimmed);

        if (hasMultiple) {
          statusText = `✨ Max (${cleaned})`;
        } else if (hadDecimal) {
          statusText = `✨ Ceil (${cleaned})`;
        } else {
          statusText = `✨ Cleaned (${cleaned})`;
        }
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: cleaned,
        stores: cleaned,
        changed: trimmed !== cleaned,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up stores cleaner reference and alias
CleanersRegistry.stores.cleaner = NoOfStoresCleaner;
CleanersRegistry.stories = CleanersRegistry.stores;

/**
 * CleanExcel - Touchstone UNICEDE® Short Column Classifier Engine
 * 
 * Rules & Details:
 *  - Perils: CA EQ, HI EQ, JP EQ, US EQ
 *  - Requirement: Optional
 *  - Codes:
 *    - 0: Unknown/default (0)
 *    - 1: No (1)
 *    - 2: Yes (2)
 *  - Underwriting Technical Details:
 *    Applies to old concrete structures in which the fill height of some column
 *    has been restricted by spandrel beams or infill walls. If some of the columns
 *    along the perimeter are shorter than the adjacent columns, there is high chance
 *    that the shorter columns can no longer bear the loads for which they were originally designed.
 */
const ShortColumnClassifier = {
  taxonomy: {
    get SHORT_COLUMN() {
      const td = _resolveTouchstoneData();
      return (td && td.SHORT_COLUMN) || {};
    }
  },

  classifyShortColumn(raw, options = {}) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Check continuous self-training database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('short_column', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = String(learned);
        if (this.taxonomy.SHORT_COLUMN[c]) {
          return this.taxonomy.SHORT_COLUMN[c];
        }
      }
    }

    const cleanStr = str.toLowerCase();

    // 1. Direct explicit numeric code match
    const codeMatch = cleanStr.match(/(?:\bcode\s*|#|\(\s*|\[\s*|^)([0-2])(?:\s*\)|\s*\]|\b|$)/);
    if (codeMatch && (cleanStr.length <= 4 || /\b(?:code|#)\s*[0-2]\b/i.test(cleanStr) || /\(\s*[0-2]\s*\)/.test(cleanStr))) {
      const c = codeMatch[1];
      if (this.taxonomy.SHORT_COLUMN[c]) {
        return this.taxonomy.SHORT_COLUMN[c];
      }
    }

    // 2. Keyword & Semantics Matching
    // Yes (2): Short columns present, spandrel beams, infill walls, restricted fill height, perimeter short columns
    if (
      /\b(?:yes|true|y\b|short\s*columns?|short\s*col\b|has\s*short\s*columns?|spandrel(?:\s*beams?)?|infill\s*walls?|restricted\s*height|fill\s*height\s*restricted|shorter\s*perimeter\s*columns?|short\s*column\s*present|present)\b/i.test(cleanStr) &&
      !/\b(?:no|none|without|not\s*present|absent|non[- ]short)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.SHORT_COLUMN['2'] || { code: '2', name: 'Yes', shortName: 'Yes' };
    }

    // No (1): No short columns, without short columns, false, none, absent, zero
    if (
      /\b(?:no\b|false|n\b|none|no\s*short\s*columns?|without\s*short\s*columns?|not\s*present|zero\s*short\s*columns?|absent|non[- ]short)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.SHORT_COLUMN['1'] || { code: '1', name: 'No', shortName: 'No' };
    }

    // Unknown/default (0): unknown, default, unk, tbd, unspecified, 0
    if (
      /\b(?:unknown|default|unk\b|tbd|unspecified|0)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.SHORT_COLUMN['0'] || { code: '0', name: 'Unknown/default', shortName: 'Unknown / Default' };
    }

    // Fuzzy matching against taxonomy keywords
    const scTaxonomy = this.taxonomy.SHORT_COLUMN;
    for (const [code, item] of Object.entries(scTaxonomy)) {
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (cleanStr.includes(kw.toLowerCase())) {
            return item;
          }
        }
      }
    }

    return null;
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          shortColumnCode: '',
          shortColumn: '—',
          shortColumnName: '',
          shortColumnShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, US EQ',
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const match = this.classifyShortColumn(line, options);
      const code = match ? match.code : '';
      const name = match ? match.name : '';
      const shortName = match ? match.shortName : '';

      const format = options.format || 'code_only';
      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = match ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = match ? `${shortName} (${code})` : trimmed;

      let status = 'assigned';
      let statusText = match ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized Short Column';

      if (!match) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Short Column Value';
      } else if (trimmed === code) {
        status = 'unchanged';
        statusText = `✓ Valid Code (${code})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: code,
        code: code,
        shortColumnCode: code,
        shortColumn: display,
        shortColumnName: name,
        shortColumnShort: shortName,
        perils: match && match.perils ? match.perils.join(', ') : 'CA EQ, HI EQ, JP EQ, US EQ',
        requirement: match ? match.requirement : 'Optional',
        changed: trimmed !== code,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up short_column cleaner reference and alias
CleanersRegistry.short_column.cleaner = ShortColumnClassifier;
CleanersRegistry.shortColumn = CleanersRegistry.short_column;

/**
 * CleanExcel - Building Exterior Opening Classifier Engine
 * Touchstone UNICEDE® Building Exterior Opening:
 *  - 0: Unknown (0) (CA EQ, HI EQ, JP EQ, NZ EQ, US EQ - Optional)
 *  - 1: Less than 50% of wall open / default (1) (Default / standard window openings)
 *  - 2: More than 50% of wall open (2) (Large openings / storefront / curtain wall, reduced seismic resistance)
 */
const BuildingExteriorOpeningClassifier = {
  taxonomy: {
    get BUILDING_EXTERIOR_OPENING() {
      const td = _resolveTouchstoneData();
      return (td && td.BUILDING_EXTERIOR_OPENING) || {};
    }
  },

  classifyBuildingExteriorOpening(raw, options = {}) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Check continuous self-training database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('building_exterior_opening', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = String(learned);
        if (this.taxonomy.BUILDING_EXTERIOR_OPENING[c]) {
          return this.taxonomy.BUILDING_EXTERIOR_OPENING[c];
        }
      }
    }

    const cleanStr = str.toLowerCase();

    // 1. Direct explicit numeric code match
    const codeMatch = cleanStr.match(/(?:\bcode\s*|#|\(\s*|\[\s*|^)([0-2])(?:\s*\)|\s*\]|\b|$)/);
    if (codeMatch && (cleanStr.length <= 4 || /\b(?:code|#)\s*[0-2]\b/i.test(cleanStr) || /\(\s*[0-2]\s*\)/.test(cleanStr))) {
      const c = codeMatch[1];
      if (this.taxonomy.BUILDING_EXTERIOR_OPENING[c]) {
        return this.taxonomy.BUILDING_EXTERIOR_OPENING[c];
      }
    }

    // 2. Numerical percentage detection (e.g. ">50%", "75%", "< 50%", "30%", "60 percent")
    const percentMatch = cleanStr.match(/([><=]?\s*\d+(?:\.\d+)?)\s*(?:%|percent)/i);
    if (percentMatch) {
      const numStr = percentMatch[1].replace(/\s+/g, '');
      if (numStr.startsWith('>') || numStr.startsWith('over') || numStr.startsWith('more')) {
        return this.taxonomy.BUILDING_EXTERIOR_OPENING['2'] || { code: '2', name: 'More than 50% of wall open', shortName: 'More than 50% open (2)' };
      }
      if (numStr.startsWith('<') || numStr.startsWith('under') || numStr.startsWith('less')) {
        return this.taxonomy.BUILDING_EXTERIOR_OPENING['1'] || { code: '1', name: 'Less than 50% of wall open / default', shortName: 'Less than 50% open (1)' };
      }
      const val = parseFloat(numStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(val)) {
        if (val > 50) {
          return this.taxonomy.BUILDING_EXTERIOR_OPENING['2'] || { code: '2', name: 'More than 50% of wall open', shortName: 'More than 50% open (2)' };
        } else {
          return this.taxonomy.BUILDING_EXTERIOR_OPENING['1'] || { code: '1', name: 'Less than 50% of wall open / default', shortName: 'Less than 50% open (1)' };
        }
      }
    }

    // 3. Keyword & Semantics Matching
    // Code 2: More than 50% of wall open
    if (
      /\b(?:more\s*than\s*50|greater\s*than\s*50|over\s*50|> ?50|50\s*%\s*\+|50\s*plus|more\s*than\s*half|> ?half|high\s*opening|many\s*openings|storefront|glass\s*facade|curtain\s*wall|heavy\s*glazing|large\s*openings|significant\s*openings|reduced\s*seismic\s*resistance)\b/i.test(cleanStr) &&
      !/\b(?:less|under|<|fewer|minimal|default)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_EXTERIOR_OPENING['2'] || { code: '2', name: 'More than 50% of wall open', shortName: 'More than 50% open (2)' };
    }

    // Code 1: Less than 50% of wall open / default
    if (
      /\b(?:less\s*than\s*50|under\s*50|< ?50|fewer\s*openings|low\s*opening|punched\s*windows|minimal\s*openings|standard\s*openings|standard\s*windows|default\s*opening|less\s*than\s*half|< ?half|shear\s*wall\s*intact|solid\s*wall)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_EXTERIOR_OPENING['1'] || { code: '1', name: 'Less than 50% of wall open / default', shortName: 'Less than 50% open (1)' };
    }

    // Code 0: Unknown / default
    if (
      /\b(?:unknown|unk\b|tbd|unspecified|0)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_EXTERIOR_OPENING['0'] || { code: '0', name: 'Unknown', shortName: 'Unknown (0)' };
    }

    // Fuzzy matching against taxonomy keywords
    const beoTaxonomy = this.taxonomy.BUILDING_EXTERIOR_OPENING;
    for (const [code, item] of Object.entries(beoTaxonomy)) {
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (cleanStr.includes(kw.toLowerCase())) {
            return item;
          }
        }
      }
    }

    return null;
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          buildingExteriorOpeningCode: '',
          buildingExteriorOpening: '—',
          buildingExteriorOpeningName: '',
          buildingExteriorOpeningShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const match = this.classifyBuildingExteriorOpening(line, options);
      const code = match ? match.code : '';
      const name = match ? match.name : '';
      const shortName = match ? match.shortName : '';

      const format = options.format || 'code_only';
      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = match ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = match ? `${shortName}` : trimmed;

      let status = 'assigned';
      let statusText = match ? `✓ Cleaned (${shortName || name})` : '⚠️ Unrecognized Exterior Opening';

      if (!match) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Exterior Opening Value';
      } else if (trimmed === code) {
        status = 'unchanged';
        statusText = `✓ Valid Code (${code})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: code,
        code: code,
        buildingExteriorOpeningCode: code,
        buildingExteriorOpening: display,
        buildingExteriorOpeningName: name,
        buildingExteriorOpeningShort: shortName,
        perils: match && match.perils ? match.perils.join(', ') : 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: match ? match.requirement : 'Optional',
        note: match ? match.note : '',
        changed: trimmed !== code,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up building_exterior_opening cleaner reference and aliases
CleanersRegistry.building_exterior_opening.cleaner = BuildingExteriorOpeningClassifier;
CleanersRegistry.buildingExteriorOpening = CleanersRegistry.building_exterior_opening;
CleanersRegistry.exterior_opening = CleanersRegistry.building_exterior_opening;

/**
 * CleanExcel - Soft Story Classifier Engine
 * Touchstone / UNICEDE® Soft Story Codes:
 *  0: Unknown/default (0)
 *  1: No (1)
 *  2: Yes (2)
 *
 * Models: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional, Defaults to 0)
 * Applicable only if the number of stories is 2 or greater.
 * First-floor garages and taller first floors are likely to exhibit soft-story behavior.
 */
const SoftStoryClassifier = {
  taxonomy: {
    get SOFT_STORY() {
      const td = _resolveTouchstoneData();
      return (td && td.SOFT_STORY) || {};
    }
  },

  classifySoftStory(raw, options = {}) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Check continuous self-training database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('soft_story', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = String(learned);
        if (this.taxonomy.SOFT_STORY[c]) {
          return this.taxonomy.SOFT_STORY[c];
        }
      }
    }

    const cleanStr = str.toLowerCase();

    // 1. Direct explicit numeric code match
    const codeMatch = cleanStr.match(/(?:\bcode\s*|#|\(\s*|\[\s*|^)([0-2])(?:\s*\)|\s*\]|\b|$)/);
    if (codeMatch && (cleanStr.length <= 4 || /\b(?:code|#)\s*[0-2]\b/i.test(cleanStr) || /\(\s*[0-2]\s*\)/.test(cleanStr))) {
      const c = codeMatch[1];
      if (this.taxonomy.SOFT_STORY[c]) {
        return this.taxonomy.SOFT_STORY[c];
      }
    }

    // 2. Keyword & Semantics Matching
    // Yes (2): Soft story present, weak story, tuck-under parking, first-floor garage, ground floor garage, open front, taller first floor, lateral weakness, pancaking
    if (
      /\b(?:yes|true|y\b|soft\s*stor(?:y|ies)|soft\s*storeys?|weak\s*stor(?:y|ies)|weak\s*storeys?|first\s*floor\s*garages?|1st\s*floor\s*garages?|ground\s*floor\s*garages?|tuck[- ]under(?:\s*parking)?|open\s*front|taller\s*first\s*floor|lateral\s*weakness|pancaking|collapse\s*vulnerability|structural\s*weakness|weak\s*first\s*floor|weak\s*floor)\b/i.test(cleanStr) &&
      !/\b(?:no|none|without|not\s*present|absent|non[- ]soft|no\s*soft)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.SOFT_STORY['2'] || { code: '2', name: 'Yes', shortName: 'Yes' };
    }

    // No (1): No soft story, false, none, absent, stiff, regular, uniform stiffness
    if (
      /\b(?:no\b|false|n\b|none|without\s*soft\s*stor(?:y|ies)|no\s*soft\s*stor(?:y|ies)|not\s*present|absent|non[- ]soft|stiff|regular|uniform\s*stiffness|adequate\s*lateral\s*stiffness)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.SOFT_STORY['1'] || { code: '1', name: 'No', shortName: 'No' };
    }

    // Unknown/default (0): unknown, default, unk, tbd, unspecified, 0
    if (
      /\b(?:unknown|default|unk\b|tbd|unspecified|0)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.SOFT_STORY['0'] || { code: '0', name: 'Unknown/default', shortName: 'Unknown / Default' };
    }

    // Fuzzy matching against taxonomy keywords
    const ssTaxonomy = this.taxonomy.SOFT_STORY;
    for (const [code, item] of Object.entries(ssTaxonomy)) {
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (cleanStr.includes(kw.toLowerCase())) {
            return item;
          }
        }
      }
    }

    return null;
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          softStoryCode: '',
          softStory: '—',
          softStoryName: '',
          softStoryShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
          requirement: 'Optional',
          note: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const match = this.classifySoftStory(line, options);
      const code = match ? match.code : '';
      const name = match ? match.name : '';
      const shortName = match ? match.shortName : '';

      const format = options.format || 'code_only';
      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = match ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = match ? `${shortName} (${code})` : trimmed;

      let status = 'assigned';
      let statusText = match ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized Soft Story Value';

      if (!match) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Soft Story Value';
      } else if (trimmed === code) {
        status = 'unchanged';
        statusText = `✓ Valid Code (${code})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: code,
        code: code,
        softStoryCode: code,
        softStory: display,
        softStoryName: name,
        softStoryShort: shortName,
        perils: match && match.perils ? match.perils.join(', ') : 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: match ? match.requirement : 'Optional',
        note: match ? match.note : '',
        changed: trimmed !== code,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up soft_story cleaner reference and aliases
CleanersRegistry.soft_story.cleaner = SoftStoryClassifier;
CleanersRegistry.softStory = CleanersRegistry.soft_story;

/**
 * CleanExcel - Touchstone UNICEDE® Ornamentation Classifier Engine
 * 
 * Rules & Details:
 *  - Perils: CA EQ, HI EQ, JP EQ, US EQ
 *  - Requirement: Optional
 *  - Codes:
 *    - 0: Unknown/default (0)
 *    - 1: None (1)
 *    - 2: Average (2)
 *    - 3: Extensive (3)
 *  - Underwriting Technical Details:
 *    Describes the amount of decorative elements attached to exterior of the building at this location.
 *    Decorative elements may fall during an earthquake. Examples include unreinforced or unbraced parapet
 *    walls or entryway roofs, which can break off during excessive shaking.
 */
const OrnamentationClassifier = {
  taxonomy: {
    get ORNAMENTATION() {
      const td = _resolveTouchstoneData();
      return (td && td.ORNAMENTATION) || {};
    }
  },

  classifyOrnamentation(raw, options = {}) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Check continuous self-training database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('ornamentation', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = String(learned);
        if (this.taxonomy.ORNAMENTATION[c]) {
          return this.taxonomy.ORNAMENTATION[c];
        }
      }
    }

    const cleanStr = str.toLowerCase();

    // 1. Direct explicit numeric code match
    const codeMatch = cleanStr.match(/(?:\bcode\s*|#|\(\s*|\[\s*|^)([0-3])(?:\s*\)|\s*\]|\b|$)/);
    if (codeMatch && (cleanStr.length <= 4 || /\b(?:code|#)\s*[0-3]\b/i.test(cleanStr) || /\(\s*[0-3]\s*\)/.test(cleanStr))) {
      const c = codeMatch[1];
      if (this.taxonomy.ORNAMENTATION[c]) {
        return this.taxonomy.ORNAMENTATION[c];
      }
    }

    // 2. Keyword & Semantics Matching
    // Code 3: Extensive (unreinforced parapet, unbraced parapet, entryway roofs, extensive ornamentation, heavy decorative)
    if (
      /\b(?:extensive|heavy|high|complex|elaborate|unreinforced\s*parapet|unbraced\s*parapet|parapet\s*walls?|entryway\s*roofs?|heavy\s*ornamentation|extensive\s*decorative|highly\s*decorative|cornices?|gargoyles?|facade\s*elements?|many\s*ornaments?|ornate)\b/i.test(cleanStr) &&
      !/\b(?:no\b|none|without|average|moderate|plain|standard)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.ORNAMENTATION['3'] || { code: '3', name: 'Extensive', shortName: 'Extensive' };
    }

    // Code 2: Average (average, moderate, standard, typical, medium, some ornamentation)
    if (
      /\b(?:average|moderate|standard|typical|medium|some\s*ornamentation|moderate\s*decorative|average\s*ornamentation|some\s*decorative|normal\s*ornamentation)\b/i.test(cleanStr) &&
      !/\b(?:no\b|none|without|extensive|heavy|unreinforced\s*parapet)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.ORNAMENTATION['2'] || { code: '2', name: 'Average', shortName: 'Average' };
    }

    // Code 1: None (none, no ornamentation, no decorative elements, unornamented, plain, zero, false)
    if (
      /\b(?:none\b|no\s*ornamentation|no\s*decorative\s*elements?|unornamented|plain\b|without\s*ornamentation|zero\s*ornamentation|no\s*parapet|absent|false)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.ORNAMENTATION['1'] || { code: '1', name: 'None', shortName: 'None' };
    }

    // Code 0: Unknown / default (unknown, default, unk, tbd, unspecified, 0)
    if (
      /\b(?:unknown|default|unk\b|tbd|unspecified|0)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.ORNAMENTATION['0'] || { code: '0', name: 'Unknown/default', shortName: 'Unknown / Default' };
    }

    // Fuzzy matching against taxonomy keywords
    const ornTaxonomy = this.taxonomy.ORNAMENTATION;
    for (const [code, item] of Object.entries(ornTaxonomy)) {
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (cleanStr.includes(kw.toLowerCase())) {
            return item;
          }
        }
      }
    }

    return null;
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          ornamentationCode: '',
          ornamentation: '—',
          ornamentationName: '',
          ornamentationShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, US EQ',
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const match = this.classifyOrnamentation(line, options);
      const code = match ? match.code : '';
      const name = match ? match.name : '';
      const shortName = match ? match.shortName : '';

      const format = options.format || 'code_only';
      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = match ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = match ? `${shortName} (${code})` : trimmed;

      let status = 'assigned';
      let statusText = match ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized Ornamentation Value';

      if (!match) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Ornamentation Value';
      } else if (trimmed === code) {
        status = 'unchanged';
        statusText = `✓ Valid Code (${code})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: code,
        code: code,
        ornamentationCode: code,
        ornamentation: display,
        ornamentationName: name,
        ornamentationShort: shortName,
        perils: match && match.perils ? match.perils.join(', ') : 'CA EQ, HI EQ, JP EQ, US EQ',
        requirement: match ? match.requirement : 'Optional',
        note: match ? match.note : '',
        changed: trimmed !== code,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up ornamentation cleaner reference and aliases
CleanersRegistry.ornamentation.cleaner = OrnamentationClassifier;
CleanersRegistry.ornament = CleanersRegistry.ornamentation;

/**
 * CleanExcel - Touchstone UNICEDE® Building Shape Classifier Engine
 * Rules & Details:
 *  - Perils: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ
 *  - Requirement: Optional
 *  - Codes:
 *    - 0: Unknown/default (0)
 *    - 1: Square (1)
 *    - 2: Rectangle (2)
 *    - 3: Circular (3)
 *    - 4: L-shaped (4)
 *    - 5: T-shaped (5)
 *    - 6: U-shaped (6)
 *    - 7: H-shaped (7)
 *    - 8: Complex (8)
 *  - Underwriting Technical Details:
 *    One of the values to describe the overall shape of the footprint of the building at this location.
 *    Shape is critical for the performance of a structure, especially for large commercial buildings.
 *    In general, simple regular forms, like squares and rectangles, perform better than combinations
 *    of those, such as L- and T-shaped buildings. The sharp corners in these complex shapes are vulnerable.
 */
const BuildingShapeClassifier = {
  taxonomy: {
    get BUILDING_SHAPE() {
      const td = _resolveTouchstoneData();
      return (td && td.BUILDING_SHAPE) || {};
    }
  },

  classifyBuildingShape(raw, options = {}) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Check continuous self-training database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('building_shape', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = String(learned);
        if (this.taxonomy.BUILDING_SHAPE[c]) {
          return this.taxonomy.BUILDING_SHAPE[c];
        }
      }
    }

    const cleanStr = str.toLowerCase();

    // 1. Direct explicit numeric code match
    const codeMatch = cleanStr.match(/(?:\bcode\s*|#|\(\s*|\[\s*|^)([0-8])(?:\s*\)|\s*\]|\b|$)/);
    if (codeMatch && (cleanStr.length <= 4 || /\b(?:code|#)\s*[0-8]\b/i.test(cleanStr) || /\(\s*[0-8]\s*\)/.test(cleanStr))) {
      const c = codeMatch[1];
      if (this.taxonomy.BUILDING_SHAPE[c]) {
        return this.taxonomy.BUILDING_SHAPE[c];
      }
    }

    // 2. Keyword & Semantics Matching
    // Code 7: H-shaped (h-shaped, h shape, h-shape, h-footprint)
    if (
      /\b(?:h[- ]shaped?|h\s*shape|h[- ]footprint|h[- ]layout)\b/i.test(cleanStr) ||
      /^h$/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['7'] || { code: '7', name: 'H-shaped', shortName: 'H-shaped (7)' };
    }

    // Code 6: U-shaped (u-shaped, u shape, u-shape, horseshoe, courtyard, c-shaped, u-footprint)
    if (
      /\b(?:u[- ]shaped?|u\s*shape|horseshoe|courtyard|c[- ]shaped?|c\s*shape|u[- ]footprint|u[- ]layout|open\s*courtyard)\b/i.test(cleanStr) ||
      /^u$/i.test(cleanStr) || /^c$/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['6'] || { code: '6', name: 'U-shaped', shortName: 'U-shaped (6)' };
    }

    // Code 5: T-shaped (t-shaped, t shape, t-shape, tee shaped, t-footprint)
    if (
      /\b(?:t[- ]shaped?|t\s*shape|tee[- ]shaped?|tee\s*shape|t[- ]footprint|t[- ]layout)\b/i.test(cleanStr) ||
      /^t$/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['5'] || { code: '5', name: 'T-shaped', shortName: 'T-shaped (5)' };
    }

    // Code 4: L-shaped (l-shaped, l shape, l-shape, ell shaped, re-entrant l, l-footprint)
    if (
      /\b(?:l[- ]shaped?|l\s*shape|ell[- ]shaped?|ell\s*shape|re[- ]entrant\s*l|l[- ]footprint|l[- ]layout)\b/i.test(cleanStr) ||
      /^l$/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['4'] || { code: '4', name: 'L-shaped', shortName: 'L-shaped (4)' };
    }

    // Code 3: Circular (circular, circle, round, curved, cylinder, cylindrical, oval, elliptical, rotunda)
    if (
      /\b(?:circular|circle|round|curved|cylinder|cylindrical|oval|elliptical|rotunda|curved\s*footprint|curved\s*shape)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['3'] || { code: '3', name: 'Circular', shortName: 'Circular (3)' };
    }

    // Code 1: Square (square, square shape, square footprint, quadrilateral, box, regular square)
    if (
      /\b(?:square|square\s*shape|square\s*footprint|regular\s*square|quadrilateral|perfect\s*square)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['1'] || { code: '1', name: 'Square', shortName: 'Square (1)' };
    }

    // Code 2: Rectangle (rectangle, rectangular, oblong, box shape, rectangular footprint, standard box)
    if (
      /\b(?:rectangle|rectangular|rect\b|rect\.|oblong|box\s*shape|rectangular\s*footprint|standard\s*box|box\s*footprint)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['2'] || { code: '2', name: 'Rectangle', shortName: 'Rectangle (2)' };
    }

    // Code 8: Complex (complex, irregular, multi-wing, cruciform, cross-shaped, y-shaped, z-shaped, polygonal, asymmetrical, angular, star-shaped)
    if (
      /\b(?:complex|irregular|multi[- ]wings?|cruciform|cross[- ]shaped?|cross\s*shape|y[- ]shaped?|y\s*shape|z[- ]shaped?|z\s*shape|polygonal|asymmetrical?|angular|star[- ]shaped?|star\s*shape|irregular\s*footprint|non[- ]regular)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['8'] || { code: '8', name: 'Complex', shortName: 'Complex (8)' };
    }

    // Code 0: Unknown / default (unknown, default, unk, tbd, unspecified, 0)
    if (
      /\b(?:unknown|default|unk\b|tbd|unspecified|0)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_SHAPE['0'] || { code: '0', name: 'Unknown/default', shortName: 'Unknown / Default' };
    }

    // Fuzzy matching against taxonomy keywords
    const shapeTaxonomy = this.taxonomy.BUILDING_SHAPE;
    for (const [code, item] of Object.entries(shapeTaxonomy)) {
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (cleanStr.includes(kw.toLowerCase())) {
            return item;
          }
        }
      }
    }

    return null;
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          buildingShapeCode: '',
          buildingShape: '—',
          buildingShapeName: '',
          buildingShapeShort: '',
          perils: 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
          requirement: 'Optional',
          note: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const match = this.classifyBuildingShape(line, options);
      const code = match ? match.code : '';
      const name = match ? match.name : '';
      const shortName = match ? match.shortName : '';

      const format = options.format || 'code_only';
      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = match ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = match ? `${shortName} (${code})` : trimmed;

      let status = 'assigned';
      let statusText = match ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized Building Shape';

      if (!match) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Building Shape';
      } else if (trimmed === code) {
        status = 'unchanged';
        statusText = `✓ Valid Code (${code})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: code,
        code: code,
        buildingShapeCode: code,
        buildingShape: display,
        buildingShapeName: name,
        buildingShapeShort: shortName,
        perils: match && match.perils ? match.perils.join(', ') : 'CA EQ, HI EQ, JP EQ, NZ EQ, US EQ',
        requirement: match ? match.requirement : 'Optional',
        note: match ? match.note : '',
        changed: trimmed !== code,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up building shape cleaner reference and aliases
CleanersRegistry.building_shape.cleaner = BuildingShapeClassifier;
CleanersRegistry.buildingShape = CleanersRegistry.building_shape;
CleanersRegistry.shape = CleanersRegistry.building_shape;

/**
 * ============================================================================
 * CleanExcel Studio - Touchstone UNICEDE® Building Condition Classifier (Codes 0-3)
 * ============================================================================
 * 
 * Touchstone / UNICEDE Location Building Condition Classifier:
 * One of the following general qualitative descriptions of the condition of the building
 * at this location, based on visual inspection of the building cladding and maintenance:
 *   - 0: Unknown (0) - Unknown or default building maintenance and cladding condition.
 *   - 1: Average (1) - Standard maintenance, typical minor wear, normal aging. Default for earthquake models.
 *   - 2: Good (2) - Well-maintained, recent renovation, sound cladding, intact roof/chimney.
 *   - 3: Poor (3) - Signs of distress or duress (cracking due to aging/settlement/overload, loose roof tiles, damaged cladding/chimney, deferred maintenance, previous storm/quake damage).
 * 
 * Supported Perils: CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST
 * Status: Optional. Defaults to a value in the Touchstone user interface (generally Unknown (0), but Average for EQ models).
 */
const BuildingConditionClassifier = {
  taxonomy: {
    get BUILDING_CONDITION() {
      const td = _resolveTouchstoneData();
      return (td && td.BUILDING_CONDITION) || {};
    }
  },

  classifyBuildingCondition(raw, options = {}) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (!str) return null;

    // Check continuous self-training database
    if (typeof CustomCodesDB !== 'undefined' && CustomCodesDB.matchLearned) {
      const learned = CustomCodesDB.matchLearned('building_condition', str);
      if (learned !== null && learned !== undefined && learned !== '') {
        const c = String(learned);
        if (this.taxonomy.BUILDING_CONDITION[c]) {
          return this.taxonomy.BUILDING_CONDITION[c];
        }
      }
    }

    const cleanStr = str.toLowerCase();

    // 1. Direct explicit numeric code match (0 to 3)
    const codeMatch = cleanStr.match(/(?:\bcode\s*|#|\(\s*|\[\s*|^)([0-3])(?:\s*\)|\s*\]|\b|$)/);
    if (codeMatch && (cleanStr.length <= 4 || /\b(?:code|#)\s*[0-3]\b/i.test(cleanStr) || /\(\s*[0-3]\s*\)/.test(cleanStr))) {
      const c = codeMatch[1];
      if (this.taxonomy.BUILDING_CONDITION[c]) {
        return this.taxonomy.BUILDING_CONDITION[c];
      }
    }

    // 2. Keyword & Semantics Matching
    // Code 3: Poor (signs of distress/duress, cracking, settlement, loose tiles, chimney damage, aging roof, deteriorated, deferred maintenance, overloaded, previous damage, dilapidated)
    if (
      /\b(?:poor|bad|distressed?|duress|cracking|cracks|settlement|ground\s*settlement|damaged?|loose\s*(?:roof\s*)?tiles?|chimney\s*damage|aging\s*roof|deteriorated?|deferred\s*maintenance|overloaded?|overloading|previous\s*(?:storm|hurricane|cyclone|quake|earthquake)\s*damage|severe\s*wear|substandard|dilapidated|blighted|severe\s*distress|decayed?|failing|compromised)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_CONDITION['3'] || { code: '3', name: 'Poor', shortName: 'Poor (3)' };
    }

    // Code 2: Good (well-maintained, recent renovation, sound cladding, intact roof/chimney, superior upkeep, excellent, pristine, mint, new)
    if (
      /\b(?:good|excellent|superior|well[- ]maintained|well\s*kept|mint|new|renovated|recent\s*renovation|pristine|sound(?:\s*cladding)?|high\s*grade|high\s*quality|intact\s*roof|optimal|great)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_CONDITION['2'] || { code: '2', name: 'Good', shortName: 'Good (2)' };
    }

    // Code 1: Average (standard maintenance, normal, moderate, typical, fair, adequate, medium, satisfactory, acceptable, ordinary, typical wear, normal aging)
    if (
      /\b(?:average|standard|normal|moderate|typical|fair|adequate|medium|standard\s*maintenance|satisfactory|acceptable|ordinary|typical\s*wear|normal\s*aging)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_CONDITION['1'] || { code: '1', name: 'Average', shortName: 'Average (1)' };
    }

    // Code 0: Unknown / default (unknown, default, unk, tbd, unspecified, 0, na, n/a)
    if (
      /\b(?:unknown|default|unk\b|tbd|unspecified|not\s*specified|n\/?a|0)\b/i.test(cleanStr)
    ) {
      return this.taxonomy.BUILDING_CONDITION['0'] || { code: '0', name: 'Unknown', shortName: 'Unknown (0)' };
    }

    // Fuzzy matching against taxonomy keywords
    const conditionTaxonomy = this.taxonomy.BUILDING_CONDITION;
    for (const [code, item] of Object.entries(conditionTaxonomy)) {
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (cleanStr.includes(kw.toLowerCase())) {
            return item;
          }
        }
      }
    }

    return null;
  },

  cleanColumn(input, options = {}) {
    const lines = typeof input === 'string' ? parseExcelRows(input) : (Array.isArray(input) ? input : []);
    const results = [];

    lines.forEach((line, idx) => {
      const trimmed = (line || '').trim();
      if (!trimmed && options.removeEmptyLines) return;

      if (!trimmed) {
        results.push({
          lineNum: idx + 1,
          original: line,
          cleaned: '',
          code: '',
          buildingConditionCode: '',
          buildingCondition: '—',
          buildingConditionName: '',
          buildingConditionShort: '',
          perils: 'CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST',
          requirement: 'Optional',
          note: '',
          changed: false,
          status: 'empty',
          statusText: 'Blank'
        });
        return;
      }

      const match = this.classifyBuildingCondition(line, options);
      const code = match ? match.code : '';
      const name = match ? match.name : '';
      const shortName = match ? match.shortName : '';

      const format = options.format || 'code_only';
      let display = code;
      if (format === 'name_only') display = name || trimmed;
      else if (format === 'name_code') display = match ? `${name} (${code})` : trimmed;
      else if (format === 'short_code') display = match ? `${shortName} (${code})` : trimmed;

      let status = 'assigned';
      let statusText = match ? `✓ Cleaned (${name} - Code ${code})` : '⚠️ Unrecognized Building Condition';

      if (!match) {
        status = 'mismatch';
        statusText = '⚠️ Unrecognized Building Condition';
      } else if (trimmed === code) {
        status = 'unchanged';
        statusText = `✓ Valid Code (${code})`;
      }

      results.push({
        lineNum: idx + 1,
        original: line,
        cleaned: code,
        code: code,
        buildingConditionCode: code,
        buildingCondition: display,
        buildingConditionName: name,
        buildingConditionShort: shortName,
        perils: match && match.perils ? match.perils.join(', ') : 'CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST',
        requirement: match ? match.requirement : 'Optional',
        note: match ? match.note : '',
        changed: trimmed !== code,
        status: status,
        statusText: statusText
      });
    });

    return results;
  }
};

// Wire up building condition cleaner reference and aliases
CleanersRegistry.building_condition.cleaner = BuildingConditionClassifier;
CleanersRegistry.buildingCondition = CleanersRegistry.building_condition;
CleanersRegistry.condition = CleanersRegistry.building_condition;

/**
 * ============================================================================
 * CleanExcel Studio - Coordinates & DMS to Decimal Degrees Converter Engine
 * ============================================================================
 * 
 * Logic & Underwriting Rules:
 *  - Formula: Decimal Degrees = Degrees + (Minutes ÷ 60) + (Seconds ÷ 3600)
 *  - Direction rules:
 *      * N (North) = positive (+)
 *      * E (East)  = positive (+)
 *      * S (South) = negative (-)
 *      * W (West)  = negative (-)
 *  - Precision: 6 decimal places (e.g. 29.651000, -82.324000)
 *  - Preserves exact input order (Latitude & Longitude never swapped)
 *  - If coordinate is already in decimal format (e.g. 25.765 or -80.191), keeps it as decimal formatted to 6 decimal places.
 *  - If coordinate is missing/blank/null/empty/N-A, returns "Missing".
 *  - Preserves exact row count and row alignment for multi-row datasets.
 *  - Output columns: Latitude | Longitude
 */
const CoordinatesConverter = {
  convertSingle(raw, isLongitude = false) {
    if (raw === undefined || raw === null) {
      return { value: 'Missing', raw: '', isMissing: true, isDecimal: false, isDms: false, status: 'missing', statusText: 'Missing' };
    }
    const str = String(raw).trim();
    if (!str || /^(?:missing|none|null|n\/?a|unknown|-|—)$/i.test(str)) {
      return { value: 'Missing', raw: str, isMissing: true, isDecimal: false, isDms: false, status: 'missing', statusText: 'Missing' };
    }

    // 1. Detect Cardinal Direction (N, S, E, W)
    let dir = null;
    const dirMatch = str.match(/\b([NSEW])\b|([NSEW])$|^([NSEW])/i);
    if (dirMatch) {
      dir = (dirMatch[1] || dirMatch[2] || dirMatch[3]).toUpperCase();
    } else if (/\bnorth\b/i.test(str)) {
      dir = 'N';
    } else if (/\bsouth\b/i.test(str)) {
      dir = 'S';
    } else if (/\beast\b/i.test(str)) {
      dir = 'E';
    } else if (/\bwest\b/i.test(str)) {
      dir = 'W';
    }

    const hasLeadingMinus = /^\s*-/.test(str);

    // 2. Check if already Decimal
    // Clean off symbols like °, ', ", deg, min, sec, direction letters
    const cleanForCheck = str.replace(/[°º^]|deg(?:rees?)?|min(?:utes?)?|sec(?:onds?)?|[NSEW]|north|south|east|west|['"’′”″]/gi, ' ').trim();
    
    // Extract all numeric tokens (including signed/unsigned floats)
    const numbers = cleanForCheck.match(/[+-]?\d+(?:\.\d+)?/g);
    
    if (!numbers || numbers.length === 0) {
      return { value: 'Missing', raw: str, isMissing: true, isDecimal: false, isDms: false, status: 'missing', statusText: 'Missing' };
    }

    // If single number with or without decimal (e.g. "25.765", "-80.191", "25.765 N", "80.191° W")
    if (numbers.length === 1 && !/['"’′”″]/.test(str)) {
      let num = parseFloat(numbers[0]);
      if (isNaN(num)) {
        return { value: 'Missing', raw: str, isMissing: true, isDecimal: false, isDms: false, status: 'missing', statusText: 'Missing' };
      }
      
      // Direction rules:
      // N = positive (+), E = positive (+)
      // S = negative (-), W = negative (-)
      if (dir === 'S' || dir === 'W') {
        num = -Math.abs(num);
      } else if (dir === 'N' || dir === 'E') {
        num = Math.abs(num);
      } else if (hasLeadingMinus) {
        num = -Math.abs(num);
      }

      const formatted = num.toFixed(6);
      return {
        value: formatted,
        raw: str,
        isMissing: false,
        isDecimal: true,
        isDms: false,
        numeric: num,
        status: 'decimal',
        statusText: 'Already Decimal'
      };
    }

    // 3. DMS Conversion
    // Decimal Degrees = Degrees + (Minutes ÷ 60) + (Seconds ÷ 3600)
    let deg = 0;
    let min = 0;
    let sec = 0;

    if (numbers.length >= 3) {
      deg = Math.abs(parseFloat(numbers[0]));
      min = Math.abs(parseFloat(numbers[1]));
      sec = Math.abs(parseFloat(numbers[2]));
    } else if (numbers.length === 2) {
      deg = Math.abs(parseFloat(numbers[0]));
      min = Math.abs(parseFloat(numbers[1]));
      sec = 0;
    } else if (numbers.length === 1) {
      deg = Math.abs(parseFloat(numbers[0]));
      min = 0;
      sec = 0;
    }

    let dd = deg + (min / 60) + (sec / 3600);

    // Direction rules:
    // * N (North) = positive (+)
    // * E (East)  = positive (+)
    // * S (South) = negative (-)
    // * W (West)  = negative (-)
    if (dir === 'S' || dir === 'W' || hasLeadingMinus) {
      dd = -Math.abs(dd);
    } else {
      dd = Math.abs(dd);
    }

    const formatted = dd.toFixed(6);
    return {
      value: formatted,
      raw: str,
      isMissing: false,
      isDecimal: false,
      isDms: true,
      numeric: dd,
      degrees: deg,
      minutes: min,
      seconds: sec,
      direction: dir,
      status: 'dms',
      statusText: 'Converted (DMS➔DD)'
    };
  },

  splitCoordinateLine(line) {
    if (line === undefined || line === null) return ['', ''];
    const rawLine = String(line).replace(/[\r\n]+/g, '');
    if (!rawLine.trim()) return ['', ''];

    // 1. Tab separated (Excel column copy/paste)
    if (rawLine.includes('\t')) {
      const parts = rawLine.split('\t');
      return [(parts[0] || '').trim(), (parts.slice(1).join('\t') || '').trim()];
    }

    // 2. Semicolon separated
    if (rawLine.includes(';')) {
      const parts = rawLine.split(';');
      return [(parts[0] || '').trim(), (parts.slice(1).join(';') || '').trim()];
    }

    // 3. Comma separated
    if (rawLine.includes(',')) {
      const parts = rawLine.split(',');
      if (parts.length === 2) {
        return [parts[0].trim(), parts[1].trim()];
      }
    }

    const trimmed = rawLine.trim();

    // 4. Space separated with DMS cardinal directions (e.g. 29°39'03.6"N 82°19'26.4"W)
    const dmsPairMatch = trimmed.match(/^(.+?[NSEWnsew])\s+([+-]?\d.+)$/);
    if (dmsPairMatch) {
      return [dmsPairMatch[1].trim(), dmsPairMatch[2].trim()];
    }

    // 5. Space separated 2 numbers (e.g. 25.765 -80.191)
    const spaceNumbers = trimmed.split(/\s+/);
    if (spaceNumbers.length === 2 && !isNaN(Number(spaceNumbers[0])) && !isNaN(Number(spaceNumbers[1]))) {
      return [spaceNumbers[0], spaceNumbers[1]];
    }

    return [trimmed, ''];
  },

  cleanColumn(inputPayload, options = {}) {
    let latLines = [];
    let longLines = [];

    if (inputPayload && typeof inputPayload === 'object' && !Array.isArray(inputPayload)) {
      if (Array.isArray(inputPayload.lat) || Array.isArray(inputPayload.latitude) || Array.isArray(inputPayload.col1)) {
        latLines = (inputPayload.lat || inputPayload.latitude || inputPayload.col1 || []).map(l => String(l || ''));
      }
      if (Array.isArray(inputPayload.long) || Array.isArray(inputPayload.longitude) || Array.isArray(inputPayload.col2)) {
        longLines = (inputPayload.long || inputPayload.longitude || inputPayload.col2 || []).map(l => String(l || ''));
      }
    } else if (Array.isArray(inputPayload)) {
      inputPayload.forEach(item => {
        if (Array.isArray(item)) {
          latLines.push(String(item[0] || ''));
          longLines.push(String(item[1] || ''));
        } else if (item && typeof item === 'object') {
          latLines.push(String(item.lat || item.latitude || item.col1 || ''));
          longLines.push(String(item.long || item.longitude || item.col2 || ''));
        } else {
          const [lat, lng] = this.splitCoordinateLine(String(item || ''));
          latLines.push(lat);
          longLines.push(lng);
        }
      });
    } else if (typeof inputPayload === 'string') {
      const rawRows = inputPayload.split(/\r\n|\r|\n/);
      rawRows.forEach(row => {
        const [lat, lng] = this.splitCoordinateLine(row);
        latLines.push(lat);
        longLines.push(lng);
      });
    }

    const totalRows = Math.max(latLines.length, longLines.length);
    const results = [];

    for (let idx = 0; idx < totalRows; idx++) {
      const rawLat = latLines[idx] !== undefined ? latLines[idx] : '';
      const rawLong = longLines[idx] !== undefined ? longLines[idx] : '';

      if (!rawLat.trim() && !rawLong.trim() && options.removeEmptyLines) {
        continue;
      }

      const latRes = this.convertSingle(rawLat, false);
      const longRes = this.convertSingle(rawLong, true);

      let rowStatus = 'assigned';
      let rowStatusText = '✓ Converted (DMS➔DD)';

      if (latRes.isMissing && longRes.isMissing) {
        rowStatus = 'empty';
        rowStatusText = 'Missing Coordinates';
      } else if (latRes.isMissing) {
        rowStatus = 'mismatch';
        rowStatusText = '⚠️ Missing Latitude';
      } else if (longRes.isMissing) {
        rowStatus = 'mismatch';
        rowStatusText = '⚠️ Missing Longitude';
      } else if (latRes.isDecimal && longRes.isDecimal) {
        rowStatus = 'match';
        rowStatusText = '✓ Already Decimal';
      } else {
        rowStatus = 'assigned';
        rowStatusText = '✓ Converted (DMS➔DD)';
      }

      const changed = (rawLat.trim() !== latRes.value) || (rawLong.trim() !== longRes.value);

      results.push({
        lineNum: idx + 1,
        original: `${rawLat}\t${rawLong}`,
        rawLat: rawLat,
        rawLong: rawLong,
        lat: latRes.value,
        latitude: latRes.value,
        long: longRes.value,
        longitude: longRes.value,
        cleaned: `${latRes.value}\t${longRes.value}`,
        status: rowStatus,
        statusText: rowStatusText,
        changed: changed,
        latNumeric: latRes.numeric,
        longNumeric: longRes.numeric,
        isLatMissing: latRes.isMissing,
        isLongMissing: longRes.isMissing
      });
    }

    return results;
  }
};

// Wire up coordinates converter references and aliases
CleanersRegistry.coordinates.cleaner = CoordinatesConverter;
CleanersRegistry.coordinate = CleanersRegistry.coordinates;
CleanersRegistry.lat_long = CleanersRegistry.coordinates;
CleanersRegistry.latlong = CleanersRegistry.coordinates;
CleanersRegistry.dms = CleanersRegistry.coordinates;
CleanersRegistry.coords = CleanersRegistry.coordinates;

// Export for module systems or attach to global window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StreetCleaner, AddressSplitter, OccupancyClassifier, ConstructionClassifier, YearBuiltCleaner, RoofYearCleaner, RoofClassifier, WallClassifier, FoundationTypeClassifier, FoundationClassifier, FoundationConnectionClassifier, ShortColumnClassifier, BuildingExteriorOpeningClassifier, SoftStoryClassifier, OrnamentationClassifier, BuildingShapeClassifier, BuildingConditionClassifier, NoOfStoresCleaner, CoordinatesConverter, CleanersRegistry };
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
  window.FoundationTypeClassifier = FoundationTypeClassifier;
  window.FoundationClassifier = FoundationClassifier;
  window.FoundationConnectionClassifier = FoundationConnectionClassifier;
  window.ShortColumnClassifier = ShortColumnClassifier;
  window.BuildingExteriorOpeningClassifier = BuildingExteriorOpeningClassifier;
  window.SoftStoryClassifier = SoftStoryClassifier;
  window.OrnamentationClassifier = OrnamentationClassifier;
  window.BuildingShapeClassifier = BuildingShapeClassifier;
  window.BuildingConditionClassifier = BuildingConditionClassifier;
  window.NoOfStoresCleaner = NoOfStoresCleaner;
  window.CoordinatesConverter = CoordinatesConverter;
  window.CleanersRegistry = CleanersRegistry;
  window.parseExcelRows = parseExcelRows;
}




