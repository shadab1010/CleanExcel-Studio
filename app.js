/**
 * CleanExcel - Application UI Controller
 */

// Initial configuration state
const AppState = {
  activeColumnId: 'street',
  // Street cleaner options
  wordsToRemove: JSON.parse(localStorage.getItem('cleanexcel_words_to_remove') || 'null') || ['street', 'builfin', 'building', 'unit', 'st', 'bldg'],
  symbolsToRemove: String.raw`,./<>?;'\:"|[]{}=+-_()#$%^&*@!`.split(''),
  preserveNumberHyphen: true,
  extractPrimaryAddress: true,
  stripBldgPrefix: true,
  casing: 'uppercase', // 'uppercase' | 'titlecase' | 'original'
  removeEmptyLines: false,
  // Address Splitter options
  splitCasing: 'titlecase', // 'titlecase' | 'uppercase' | 'original'
  splitIncludeCounty: true,
  splitIncludeCountry: true,
  splitCountryFormat: 'iso2', // 'iso2' | 'iso2-uk' | 'fullname'
  splitDefaultCountry: 'US',
  splitRemoveEmpty: false,
  // Occupancy Classifier options
  occRemoveEmpty: false,
  occAutoHeader: true,
  // Construction Classifier options
  conRemoveEmpty: false,
  conAutoHeader: true,
  // Year Built options
  yearMin: 1753,
  yearMax: new Date().getFullYear(),
  yearRemoveEmpty: false,
  // Roof Year Built options
  roofYearRuleMode: 'roof_ge_yb',
  roofYearRemoveEmpty: false,
  // Roof Description options
  roofFormat: 'code_only',
  roofRemoveEmpty: false,
  // Exterior Wall Finish options
  wallFormat: 'code_only',
  wallRemoveEmpty: false,
  // Custom User Column Names per 3-column engine
  colNames: {
    occupancy: {
      col1: 'Existing Code',
      col2: 'Building Description',
      col3: 'Occupancy Description'
    },
    construction: {
      col1: 'Existing Code',
      col2: 'Building Type',
      col3: 'Construction Description'
    }
  },
  // View & Filtering options
  viewMode: 'table', // 'table' | 'text'
  searchQuery: '',
  statusFilter: 'all',
  codeFilter: 'all',
  lastCleanedData: []
};

// Sample datasets for testing
const SampleDatasets = {
  street: [
    "Bldg 1 - 1521 Greens Road",
    "8901 Meadowbrook Blvd, 1401, 1405, 1409, 1412,1413, 1417,1420, and 1421 Randol Crossing Lane.",
    "500 Malabar Road SW,Magnolia Cove Drive",
    "145-146 MIRAMAR BOULEVARD",
    "102-104 North Building, 5th Street.",
    "Building 12, Unit #4, 789 Elm Street!",
    "145-146 MIRAMAR BOULEVARD, Street, Unit #4",
    ",./<>?;':\"|[]{}=+-_()#$%^&*@! 145-146 MIRAMAR BOULEVARD builfin unit street",
    "742 Evergreen Terrace, Unit 4-B",
    " - - - Street 145-146 MIRAMAR BOULEVARD - - - ",
    "SUITE #200, 55-57 5TH AVENUE, BUILFIN A"
  ].join('\n'),

  split: [
    "10 Downing Street, London SW1A 2AA, United Kingdom",
    "Friedrichstraße 43, 10117 Berlin, Germany",
    "350 King Street West, Toronto, ON M5V 3X5, Canada",
    "1908 Grand Avenue,NASHVILLE,TN,DAVIDSON,37212",
    "510 L Street # 1003,Anchorage,AK,ANCHORAGE,99501",
    "4455 University Drive, C Bldg.,Anchorage,AK,ANCHORAGE,99508",
    "4455 University Drive, B Bldg.,Anchorage,ak,ANCHORAGE,99508",
    "4225 University Drive,Anchorage,AK,ANCHORAGE,99508",
    "3877 University Drive,Anchorage,AK,ANCHORAGE,99508",
    "4200 University Drive,Anchorage,AK,ANCHORAGE,99508",
    "4300 University Drive,Anchorage,AK,ANCHORAGE,99508",
    "4400 University Drive,Anchorage,AK,ANCHORAGE,99508",
    "7801 DETROIT AVENUE",
    "10204 GRANGER ROAD",
    "Unit 4, 6740 STATE ROAD",
    "ONE HOLY CROSS BOULEVARD",
    "6765 STATE ROAD",
    "6733 REYNOLDS ROAD",
    "3131 SMITH ROAD",
    "No1 bldg, 18491 LAKE SHORE BOULEVARD",
    "283 UNION STREET",
    "6000 QUEENS HIGHWAY",
    "15 NORTH MAPLE STREET",
    "1007 ' SUPERIOR AVENUE",
    "725 GULF ROAD",
    "7800 DETROIT AVENUE #",
    "5232 BROADVIEW ROAD",
    "6550 BAXTER AVENUE",
    "10205 LORAIN AVENUE",
    "3131 SMITH ROAD",
    "2440 MIRAMAR BOULEVARD",
    "44 UNIVERSITY AVENUE",
    "29777 Fairmount Boulevard",
    "1375 W EXCHANGE ST",
    "1908 Grand Avenue Nashville TN37212"
  ].join('\n'),

  occupancy: [
    "305\tEXTENDED CARE CENTER\t",
    "305\tJENNINGS CTR NURS HOME\tNURSING HOME/CONVALESCENT CENTER (100%)",
    "346\tHIGH SCHOOL\t",
    "346\tHIGH SCHOOL\t",
    "305\tNURSING HOME\t",
    "346\tHIGH SCHOOL\t",
    "305\tNURSING CARE FACILITY (Mortgagee: PNC Bank, One Cascade Plaza, Akron, OH, 44308)\tNURSING HOME/CONVALESCENT CENTER (97%); CHURCH, BASIC (2%); UTILITY BUILDINGS (1%)",
    "346\tHIGH SCHOOL\t",
    "305\tNURSING HOME\t",
    "346\tHIGH SCHOOL\t",
    "346\tHIGH SCHOOL\t",
    "342\tCATHEDRAL AND RECTORY\t",
    "346\tHIGH SCHOOL\t",
    "305\tASSISTED LIVING CENTER\t",
    "300\tBUILDING B\t",
    "346\tFORMAN CAMPUS HIGH SCHOOL\t",
    "342\tCHURCH\t",
    "305\tINDEPENDENT LIVING FACILITY (Mortgagee: PNC Bank, One Cascade Plaza, Akron, OH, 44308)\tMULTIPLE RESIDENCE, ASSISTED LIVING (100%)",
    "346\tSCHOOL\t"
  ].join('\n'),

  construction: [
    "101\tSingle Family Residence\tWood Frame (Modern)",
    "100\tCommercial Retail Store\tJoisted Masonry Exterior with Wood Joists",
    "100\tIndustrial Warehouse\tTilt-Up Concrete Wall Panels",
    "152\tPre-Engineered Storage Facility\tLight Metal / Pre-Engineered Steel (PEMB)",
    "100\tMedical Office Building\tDuctile Concrete Moment Frame",
    "151\tHigh-Rise Commercial Office\tStructural Steel Beams and Columns",
    "119\tHistoric Cathedral\tUnreinforced Masonry (URM) Bearing Wall",
    "100\tDistribution Center\tPre-Cast Concrete Frame with Slabs",
    "\tResidential Manufactured Home\tDouble-Wide Manufactured Housing",
    "100\tCommercial Facility\tFlush Mounted Rooftop Solar Array",
    "153\tCorporate Headquarters\tBraced Steel Frame with Diagonal Members",
    "116\tCommunity Center\tReinforced Concrete Block Masonry (CMU)",
    "104\tSki Resort Lodge\tHeavy Timber Mill Construction",
    "100\tIndustrial Facility\tReinforced Concrete Shear Wall Box Structure"
  ].join('\n'),

  year: [
    "1985",
    "1995/2005", // -> 1995 (lesser / older year)
    "2005/1995", // -> 1995 (lesser / older year)
    "2005-1995", // -> 1995 (lesser / older year)
    "Built in 1994",
    "1680",
    "1751", // < 1753 -> blank
    "1753", // valid min -> 1753
    "2004",
    "2035", // > 2026 -> blank
    "1,999.0",
    "05/12/1978",
    "Yr: 2012",
    "UNKNOWN",
    "1720",
    "2026",
    "1998/1999",
    "0",
    "Built: 2018"
  ].join('\n'),

  roof_year: [
    "2005\t2006",
    "2005\t2006/2007",
    "2002\t2002/2005",
    "2005\t2005",
    "2005\t2010",
    "2005\t2020",
    "2005\t2000",
    "1990\t1985",
    "1990\t1995",
    "1995\t",
    "\t2005",
    "2015\t2018",
    "Built in 1988\tRoof 2002",
    "Built in 1988\tRoof 1982",
    "1750\t1755",
    "2000\t2035",
    "1995/2005\t2000",
    "2012\t2012",
    "Unknown\t1999"
  ].join('\n'),

  roof: [
    "Gable, 4:12 pitch, asphalt shingles, plywood deck",
    "Hip roof, steep pitch (9:12), clay tiles, wood planks",
    "Flat, low pitch, Single-ply membrane (TPO), metal deck with insulation",
    "Standing seam metal, 6:12 slope, OSB deck, Gable",
    "Built-up roof with gravel, steel deck with concrete, flat",
    "Mansard, High Pitch, Slate Covering, Pre-cast concrete slabs",
    "Comp Shingle, Plywood, 5:12, Hip",
    "EPDM on Rigid Insulation / Metal Deck / Flat",
    "Mod Bit, Flat, Reinforced Concrete Slab",
    "Asphalt Shingle on 1/2 inch Plywood",
    "Corrugated metal panels, Gable, 2:12 slope",
    "Wood shake / Wood plank deck / Steep 8:12 / Gable",
    "Photovoltaic solar roof, standing seam metal, flat roof",
    "Light metal roof, uninsulated steel deck, shed roof",
    "Gambrel barn roof, architectural shingle, OSB deck, medium pitch",
    "Pyramid hip, 6:12, spanish tile, plywood",
    "Hurricane wind-rated roof covering, reinforced concrete slab, flat",
    "Gable with bracing, 7:12 pitch, composition shingle, plywood sheathing"
  ].join('\n'),

  wall: [
    "70% Brick Veneer / 30% Vinyl Siding",
    "30% Brick Veneer / 70% Vinyl Siding",
    "50% Brick Veneer / 50% Vinyl Siding",
    "Brick Veneer and Vinyl Siding",
    "Stucco on Concrete Block",
    "Brick Veneer on Plywood Wood Frame",
    "EIFS on Exterior Gypsum Board",
    "50% Stucco / 50% Aluminum Siding",
    "80% Stucco / 20% Stone Panels",
    "50% Fiber Cement / 50% Wood Shingles",
    "HardiePlank and Vinyl Siding",
    "Plywood and Cast-in-place Concrete",
    "50% Reinforced Masonry / 50% Wood Planks",
    "Tilt-up Precast Concrete with Painted Stucco finish",
    "Vinyl Siding on OSB sheathing",
    "Poured Concrete with Natural Stone Panels",
    "Clapboards on Plywood Sheathing",
    "Corrugated Metal Panels on Light Gauge Steel Studs",
    "1\t4",
    "2\t7"
  ].join('\n'),

  name: [
    "Mr. Johnathan R. Doe, Esq.",
    "Dr. Jane A. Smith-Taylor",
    "PROFESSOR ROBERT JOHNSON JR.",
    "mrs. emily-claire watson",
    "David  O'Connor (CEO)"
  ].join('\n'),

  phone: [
    "+1 (555) 234-5678 ext 102",
    "555-876-5432",
    "1.555.345.6789",
    "(555) 999 8888",
    "+15551234567"
  ].join('\n'),

  email: [
    " John.Doe@Company.com ",
    "<Jane.Smith+test@domain.co.uk>",
    "info @ corporate-group . org",
    "support@helpdesk.io",
    "ADMIN@SYSTEM.NET"
  ].join('\n')
};

// DOM Elements
let rawInputEl;
let lineNumbersEl;
let outputTableHeadEl;
let outputTableBodyEl;
let outputTextEl;
let outputTableContainerEl;
let emptyPlaceholderEl;
let rawCountBadgeEl;
let cleanCountBadgeEl;
let charsRemovedEl;
let rowsCleanedEl;
let wordsTagsContainerEl;
let newWordInputEl;
let preserveHyphenCheckboxEl;
let extractPrimaryCheckboxEl;
let stripBldgCheckboxEl;
let removeEmptyCheckboxEl;
let splitIncludeCountyCheckboxEl;
let splitIncludeCountryCheckboxEl;
let splitDefaultCountryInputEl;
let splitRemoveEmptyCheckboxEl;
let viewModeTableBtnEl;
let viewModeTextBtnEl;
let geminiModalEl;
let geminiApiKeyInputEl;
let geminiTestStatusEl;
let aiLoadingOverlayEl;
let aiLoadingTitleEl;
let aiLoadingSubtitleEl;

// 3-Column OccupancyCode DOM Elements
let occupancy3ColContainerEl;
let inputEditorContainerEl;
let occInputCodeEl;
let occInputBldgEl;
let occInputOccEl;
let occLinesCodeEl;
let occLinesBldgEl;
let occLinesOccEl;
let btnPaste3ColEl;
let rawPaneTitleEl;
let occCol1InputEl;
let occCol2InputEl;
let occCol3InputEl;
let occAutoHeaderCheckboxEl;
let conAutoHeaderCheckboxEl;

// 2-Column RoofYear DOM Elements
let roofYear2ColContainerEl;
let roofYearInputYbEl;
let roofYearInputRyEl;
let roofYearLinesYbEl;
let roofYearLinesRyEl;
let btnPaste2ColEl;
let roofYearCol1InputEl;
let roofYearCol2InputEl;
let roofYearRuleModeEl;
let roofYearRemoveEmptyCheckboxEl;

// Output Search & Filter DOM Elements
let outputSearchInputEl;
let btnClearSearchEl;
let outputStatusFilterEl;
let outputCodeFilterEl;
let filterCountBadgeEl;

// Secure Gemini Settings DOM Elements
let geminiKeyStatusTextEl;
let geminiKeyMaskedPreviewEl;
let btnClearCustomKeyEl;

document.addEventListener('DOMContentLoaded', () => {
  // Bind DOM elements
  rawInputEl = document.getElementById('raw-input');
  lineNumbersEl = document.getElementById('line-numbers');
  outputTableHeadEl = document.querySelector('.data-table thead');
  outputTableBodyEl = document.getElementById('output-table-body');
  outputTextEl = document.getElementById('output-text');
  outputTableContainerEl = document.getElementById('output-table-container');
  emptyPlaceholderEl = document.getElementById('empty-placeholder');
  rawCountBadgeEl = document.getElementById('raw-count-badge');
  cleanCountBadgeEl = document.getElementById('clean-count-badge');
  charsRemovedEl = document.getElementById('stat-chars-removed');
  rowsCleanedEl = document.getElementById('stat-rows-cleaned');
  wordsTagsContainerEl = document.getElementById('words-tags-container');
  newWordInputEl = document.getElementById('new-word-input');
  preserveHyphenCheckboxEl = document.getElementById('preserve-hyphen-checkbox');
  extractPrimaryCheckboxEl = document.getElementById('extract-primary-checkbox');
  stripBldgCheckboxEl = document.getElementById('strip-bldg-checkbox');
  removeEmptyCheckboxEl = document.getElementById('remove-empty-checkbox');
  splitIncludeCountyCheckboxEl = document.getElementById('split-include-county-checkbox');
  splitIncludeCountryCheckboxEl = document.getElementById('split-include-country-checkbox');
  splitDefaultCountryInputEl = document.getElementById('split-default-country-input');
  splitRemoveEmptyCheckboxEl = document.getElementById('split-remove-empty-checkbox');
  viewModeTableBtnEl = document.getElementById('btn-view-table');
  viewModeTextBtnEl = document.getElementById('btn-view-text');
  geminiModalEl = document.getElementById('gemini-modal');
  geminiApiKeyInputEl = document.getElementById('gemini-api-key-input');
  geminiTestStatusEl = document.getElementById('gemini-test-status');
  aiLoadingOverlayEl = document.getElementById('ai-loading-overlay');
  aiLoadingTitleEl = document.getElementById('ai-loading-title');
  aiLoadingSubtitleEl = document.getElementById('ai-loading-subtitle');

  // 3-Column Elements
  occupancy3ColContainerEl = document.getElementById('occupancy-3col-container');
  inputEditorContainerEl = document.getElementById('input-editor-container');
  occInputCodeEl = document.getElementById('occ-input-code');
  occInputBldgEl = document.getElementById('occ-input-bldg');
  occInputOccEl = document.getElementById('occ-input-occ');
  occLinesCodeEl = document.getElementById('occ-lines-code');
  occLinesBldgEl = document.getElementById('occ-lines-bldg');
  occLinesOccEl = document.getElementById('occ-lines-occ');
  btnPaste3ColEl = document.getElementById('btn-paste-3col');
  rawPaneTitleEl = document.getElementById('raw-pane-title');
  occCol1InputEl = document.getElementById('occ-col-1-input');
  occCol2InputEl = document.getElementById('occ-col-2-input');
  occCol3InputEl = document.getElementById('occ-col-3-input');
  occAutoHeaderCheckboxEl = document.getElementById('occ-auto-header-checkbox');
  conAutoHeaderCheckboxEl = document.getElementById('con-auto-header-checkbox');

  // 2-Column Roof Year Elements
  roofYear2ColContainerEl = document.getElementById('roof-year-2col-container');
  roofYearInputYbEl = document.getElementById('roof-year-input-yb');
  roofYearInputRyEl = document.getElementById('roof-year-input-ry');
  roofYearLinesYbEl = document.getElementById('roof-year-lines-yb');
  roofYearLinesRyEl = document.getElementById('roof-year-lines-ry');
  btnPaste2ColEl = document.getElementById('btn-paste-2col');
  roofYearCol1InputEl = document.getElementById('roof-year-col-1-input');
  roofYearCol2InputEl = document.getElementById('roof-year-col-2-input');
  roofYearRuleModeEl = document.getElementById('roof-year-rule-mode');
  roofYearRemoveEmptyCheckboxEl = document.getElementById('roof-year-remove-empty-checkbox');

  // Search & Filter Elements
  outputSearchInputEl = document.getElementById('output-search-input');
  btnClearSearchEl = document.getElementById('btn-clear-search');
  outputStatusFilterEl = document.getElementById('output-status-filter');
  outputCodeFilterEl = document.getElementById('output-code-filter');
  filterCountBadgeEl = document.getElementById('filter-count-badge');

  // Secure Gemini Modal Elements
  geminiKeyStatusTextEl = document.getElementById('gemini-key-status-text');
  geminiKeyMaskedPreviewEl = document.getElementById('gemini-key-masked-preview');
  btnClearCustomKeyEl = document.getElementById('btn-clear-custom-key');

  // Update Gemini status without exposing plaintext key in DOM
  updateGeminiModalUI();

  // Initialize UI
  renderWordTags();
  bindEvents();
  updateLineNumbers();
  updateStatusFilterOptions();
  updateSearchPlaceholder();
  initCodeFinderUI();
  initVengeanceNavigation();

  // Start with clean, empty workspace ready for user paste
  rawInputEl.value = '';
  if (occInputCodeEl) occInputCodeEl.value = '';
  if (occInputBldgEl) occInputBldgEl.value = '';
  if (occInputOccEl) occInputOccEl.value = '';
  updateLineNumbers();
  updateOccLineNumbers();
  processCleaning();
});

/**
 * Helper to update Gemini modal security display
 */
function updateGeminiModalUI() {
  if (!window.GeminiService) return;
  if (geminiApiKeyInputEl) geminiApiKeyInputEl.value = ''; // NEVER populate secret key in DOM
  const hasCustom = window.GeminiService.hasCustomKey();
  if (geminiKeyStatusTextEl) {
    geminiKeyStatusTextEl.textContent = hasCustom ? '🔒 Custom Key Active' : '🔒 Pre-Configured System Key Active';
  }
  if (geminiKeyMaskedPreviewEl) {
    geminiKeyMaskedPreviewEl.textContent = window.GeminiService.getMaskedKeyDisplay();
  }
  if (btnClearCustomKeyEl) {
    btnClearCustomKeyEl.style.display = hasCustom ? 'inline-flex' : 'none';
  }
}

/**
 * Get active section's column names
 */
function getActiveSectionColNames() {
  const section = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
  if (!AppState.colNames) AppState.colNames = {};
  if (!AppState.colNames[section]) {
    AppState.colNames[section] = (section === 'construction')
      ? { col1: 'Existing Code', col2: 'Building Type', col3: 'Construction Description' }
      : { col1: 'Existing Code', col2: 'Building Description', col3: 'Occupancy Description' };
  }
  return AppState.colNames[section];
}

/**
 * Get user column name for column 1, 2, or 3
 */
function getColumnHeaderName(colIndex) {
  const names = getActiveSectionColNames();
  const section = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
  const defaults = (section === 'construction')
    ? { col1: 'Existing Code', col2: 'Building Type', col3: 'Construction Description' }
    : { col1: 'Existing Code', col2: 'Building Description', col3: 'Occupancy Description' };

  if (colIndex === 1) return (names.col1 || defaults.col1).trim();
  if (colIndex === 2) return (names.col2 || defaults.col2).trim();
  if (colIndex === 3) return (names.col3 || defaults.col3).trim();
  return `Column ${colIndex}`;
}

/**
 * Sync column name input fields from AppState
 */
function updateColumnNameInputsFromState() {
  const names = getActiveSectionColNames();
  if (occCol1InputEl) occCol1InputEl.value = names.col1 || '';
  if (occCol2InputEl) occCol2InputEl.value = names.col2 || '';
  if (occCol3InputEl) occCol3InputEl.value = names.col3 || '';
}

/**
 * Check if a row represents column headers rather than data
 */
function isHeaderRow(cells, section) {
  if (!cells || cells.length === 0) return false;
  const col0 = String(cells[0] || '').trim();
  const col1 = String(cells[1] || '').trim();
  const col2 = String(cells[2] || '').trim();

  // If all cells are blank, not a header
  if (!col0 && !col1 && !col2) return false;

  const headerRegex = /^(code|existing\s*code|bldg|building|type|occupancy|construction|desc|description|class|use|details|col\s*\d|ar|as|at|property|category|name|header)/i;

  const isFirstCellHeader = headerRegex.test(col0) || (col0.length > 0 && isNaN(Number(col0)) && /code|ar/i.test(col0));
  const isSecondCellHeader = headerRegex.test(col1);
  const isThirdCellHeader = headerRegex.test(col2);

  // If at least 2 cells match header patterns
  if ((isFirstCellHeader && isSecondCellHeader) || (isSecondCellHeader && isThirdCellHeader) || (isFirstCellHeader && isThirdCellHeader)) {
    return true;
  }

  // Any explicit keyword in cell 0, 1, or 2 while cell 0 is non-numeric
  const explicitWords = [col0, col1, col2].some(c => /^(existing\s*code|building(\s*description|\s*type)?|occupancy(\s*description)?|construction(\s*description)?|code|description|building)$/i.test(c));
  if (explicitWords && isNaN(Number(col0))) {
    return true;
  }

  return false;
}

/**
 * Apply auto-detected headers from row
 */
function applyDetectedHeaders(rowCells, section) {
  const defaults = (section === 'construction')
    ? { col1: 'Existing Code', col2: 'Building Type', col3: 'Construction Description' }
    : { col1: 'Existing Code', col2: 'Building Description', col3: 'Occupancy Description' };

  const name1 = (rowCells[0] !== undefined && String(rowCells[0]).trim()) || defaults.col1;
  const name2 = (rowCells[1] !== undefined && String(rowCells[1]).trim()) || defaults.col2;
  const name3 = (rowCells[2] !== undefined && String(rowCells[2]).trim()) || defaults.col3;

  if (!AppState.colNames) AppState.colNames = {};
  AppState.colNames[section] = { col1: name1, col2: name2, col3: name3 };
  updateColumnNameInputsFromState();
  showToast(`Auto-detected column names: "${name1}", "${name2}", "${name3}"`, '🏷️');
}

/**
 * Bind user interaction events
 */
let processCleaningDebounceTimer = null;
function debouncedProcessCleaning(delay = 80) {
  if (processCleaningDebounceTimer) clearTimeout(processCleaningDebounceTimer);
  processCleaningDebounceTimer = setTimeout(() => {
    processCleaning();
  }, delay);
}

function bindEvents() {
  // Input live typing / pasting
  rawInputEl.addEventListener('input', () => {
    updateLineNumbers();
    debouncedProcessCleaning(80);
  });

  // Scroll sync for line numbers
  rawInputEl.addEventListener('scroll', () => {
    lineNumbersEl.scrollTop = rawInputEl.scrollTop;
  });

  // Column tabs switching
  const SECTION_CONFIG = {
    street: { name: 'Street Address', icon: '🏠', category: 'address' },
    split: { name: 'Address Splitter', icon: '🔀', category: 'address' },
    occupancy: { name: 'Occupancy Code', icon: '🏢', category: 'underwriting' },
    construction: { name: 'ConstructionCode', icon: '🏗️', category: 'underwriting' },
    year: { name: 'Year Built', icon: '📅', category: 'underwriting' },
    roof_year: { name: 'Roof Year Built', icon: '🏚️', category: 'underwriting' },
    roof: { name: 'Roof Description', icon: '🏠', category: 'underwriting' },
    wall: { name: 'Exterior Wall Finish', icon: '🧱', category: 'underwriting' },
    name: { name: 'Full Name', icon: '👤', category: 'contact' },
    phone: { name: 'Phone Number', icon: '📞', category: 'contact' },
    email: { name: 'Email Address', icon: '✉️', category: 'contact' }
  };

  function switchActiveSection(colId, opts = {}) {
    if (!colId) return;
    const cfg = SECTION_CONFIG[colId] || { name: colId, icon: '📋', category: 'all' };

    // Update AppState
    AppState.activeColumnId = colId;
    window.switchActiveSection = switchActiveSection;

    // Update active tab styling
    let activeTabEl = null;
    document.querySelectorAll('.column-tab').forEach(t => {
      if (t.dataset.column === colId) {
        t.classList.add('active');
        activeTabEl = t;
      } else {
        t.classList.remove('active');
      }
    });

    // If active tab was hidden by category filter, ensure it's visible
    if (activeTabEl && activeTabEl.style.display === 'none') {
      activeTabEl.style.display = 'flex';
    }

    // Scroll active tab into view smoothly
    if (activeTabEl) {
      activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // Update dropdown current section label
    const sectionCurrentLabelEl = document.getElementById('section-current-label');
    if (sectionCurrentLabelEl) {
      sectionCurrentLabelEl.innerHTML = `${cfg.icon} ${cfg.name}`;
    }

    // Update dropdown items active state
    document.querySelectorAll('.dropdown-item').forEach(item => {
      if (item.dataset.target === colId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Show/hide rule drawers
    const streetRulesEl = document.getElementById('street-rules-panel');
    const splitRulesEl = document.getElementById('split-rules-panel');
    const occRulesEl = document.getElementById('occupancy-rules-panel');
    const conRulesEl = document.getElementById('construction-rules-panel');
    const yearRulesEl = document.getElementById('year-rules-panel');
    const roofYearRulesEl = document.getElementById('roof-year-rules-panel');
    const roofRulesEl = document.getElementById('roof-rules-panel');
    const wallRulesEl = document.getElementById('wall-rules-panel');
    if (streetRulesEl) streetRulesEl.style.display = colId === 'street' ? 'flex' : 'none';
    if (splitRulesEl) splitRulesEl.style.display = colId === 'split' ? 'flex' : 'none';
    if (occRulesEl) occRulesEl.style.display = colId === 'occupancy' ? 'flex' : 'none';
    if (conRulesEl) conRulesEl.style.display = colId === 'construction' ? 'flex' : 'none';
    if (yearRulesEl) yearRulesEl.style.display = colId === 'year' ? 'flex' : 'none';
    if (roofYearRulesEl) roofYearRulesEl.style.display = colId === 'roof_year' ? 'flex' : 'none';
    if (roofRulesEl) roofRulesEl.style.display = colId === 'roof' ? 'flex' : 'none';
    if (wallRulesEl) wallRulesEl.style.display = colId === 'wall' ? 'flex' : 'none';

    // Update live inspector on section switch
    const liveInspectorEl = document.getElementById('live-code-inspector');
    if (liveInspectorEl && !['occupancy', 'construction', 'roof', 'wall'].includes(colId)) {
      liveInspectorEl.style.display = 'none';
    }

    // Switch editor pane layout (Occupancy/Construction use 3-col, Roof Year uses 2-col)
    if (colId === 'roof_year') {
      if (roofYear2ColContainerEl) roofYear2ColContainerEl.style.display = 'grid';
      if (occupancy3ColContainerEl) occupancy3ColContainerEl.style.display = 'none';
      if (inputEditorContainerEl) inputEditorContainerEl.style.display = 'none';
      if (btnPaste2ColEl) btnPaste2ColEl.style.display = 'inline-flex';
      if (btnPaste3ColEl) btnPaste3ColEl.style.display = 'none';
      if (rawPaneTitleEl) rawPaneTitleEl.innerHTML = '📥 2-Column Roof Year Built Input <span style="font-size:11px;font-weight:normal;opacity:0.75;">(Year Built &amp; Roof Year)</span>';
      updateRoofYearLineNumbers();
    } else if (colId === 'occupancy' || colId === 'construction') {
      if (roofYear2ColContainerEl) roofYear2ColContainerEl.style.display = 'none';
      if (occupancy3ColContainerEl) occupancy3ColContainerEl.style.display = 'grid';
      if (inputEditorContainerEl) inputEditorContainerEl.style.display = 'none';
      if (btnPaste2ColEl) btnPaste2ColEl.style.display = 'none';
      if (btnPaste3ColEl) btnPaste3ColEl.style.display = 'inline-flex';

      updateColumnNameInputsFromState();

      if (colId === 'construction') {
        if (rawPaneTitleEl) rawPaneTitleEl.innerHTML = '📥 3-Column Construction Input <span style="font-size:11px;font-weight:normal;opacity:0.75;">(AR, AS, AT)</span>';
        if (occInputCodeEl) occInputCodeEl.placeholder = '';
        if (occInputBldgEl) occInputBldgEl.placeholder = '';
        if (occInputOccEl) occInputOccEl.placeholder = '';
      } else {
        if (rawPaneTitleEl) rawPaneTitleEl.innerHTML = '📥 3-Column Occupancy Input <span style="font-size:11px;font-weight:normal;opacity:0.75;">(AR, AS, AT)</span>';
        if (occInputCodeEl) occInputCodeEl.placeholder = '';
        if (occInputBldgEl) occInputBldgEl.placeholder = '';
        if (occInputOccEl) occInputOccEl.placeholder = '';
      }
      updateOccLineNumbers();
    } else {
      if (roofYear2ColContainerEl) roofYear2ColContainerEl.style.display = 'none';
      if (occupancy3ColContainerEl) occupancy3ColContainerEl.style.display = 'none';
      if (inputEditorContainerEl) inputEditorContainerEl.style.display = 'flex';
      if (btnPaste2ColEl) btnPaste2ColEl.style.display = 'none';
      if (btnPaste3ColEl) btnPaste3ColEl.style.display = 'none';
      if (rawPaneTitleEl) {
        if (colId === 'year') {
          rawPaneTitleEl.textContent = '📥 Raw Year Built Input (1753 – 2026)';
        } else if (colId === 'roof') {
          rawPaneTitleEl.textContent = '📥 Raw Roof Description Input';
        } else if (colId === 'wall') {
          rawPaneTitleEl.textContent = '📥 Raw Exterior Wall Finish Input';
        } else {
          rawPaneTitleEl.textContent = '📥 Raw Excel Column Input';
        }
      }
      if (rawInputEl) {
        if (colId === 'roof') {
          rawInputEl.placeholder = 'Paste roof description data here (e.g. "Gable, 4:12 pitch, asphalt shingles, plywood deck")...\nCleanExcel will automatically separate into:\n1. Roof Geometry\n2. Roof Pitch\n3. Roof Covering\n4. Roof Deck';
        } else if (colId === 'wall') {
          rawInputEl.placeholder = 'Paste exterior wall finish data here (e.g. "50% Brick / 50% Vinyl Siding", "Stucco on Concrete Block")...\nCleanExcel will automatically separate into:\n1. WallType (Backing / Structure)\n2. WallSiding (Weather Finish)\nApplying Underwriting Rules: Higher % • Weaker Material Tie-Breaker';
        } else if (colId === 'year') {
          rawInputEl.placeholder = 'Paste Year Built column here (e.g. "1994", "Built in 1985", "1680", "2030")...\nCleanExcel will validate between 1753 and 2026, blanking out-of-range rows.';
        } else {
          rawInputEl.placeholder = 'Paste your raw Excel column here (one record per line)...\n\nExample:\n123 MAIN ST STE 400\nAPT #5B 456 ELM AVE\nPO BOX 789 BLDG 2';
        }
      }
      updateLineNumbers();
    }

    // Reset search and filter on tab change
    AppState.searchQuery = '';
    if (outputSearchInputEl) outputSearchInputEl.value = '';
    if (btnClearSearchEl) btnClearSearchEl.style.display = 'none';
    AppState.statusFilter = 'all';
    AppState.codeFilter = 'all';
    updateStatusFilterOptions();
    updateSearchPlaceholder();

    // Re-process existing input with newly selected engine
    processCleaning();
    if (!opts.silent) {
      showToast(`Switched to ${cfg.name}`, cfg.icon || '🔄');
    }
  }

  // Column tabs switching
  document.querySelectorAll('.column-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const colId = tab.dataset.column;
      if (!colId || tab.classList.contains('disabled')) return;
      switchActiveSection(colId);
    });
  });

  // Section Dropdown Quick Picker wiring
  const btnSectionDropdown = document.getElementById('btn-section-dropdown');
  const sectionDropdownMenu = document.getElementById('section-dropdown-menu');
  const sectionDropdownWrapper = document.getElementById('section-dropdown-wrapper');

  if (btnSectionDropdown && sectionDropdownMenu) {
    btnSectionDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sectionDropdownMenu.style.display !== 'none';
      sectionDropdownMenu.style.display = isOpen ? 'none' : 'block';
      if (sectionDropdownWrapper) {
        sectionDropdownWrapper.classList.toggle('open', !isOpen);
      }
    });

    document.addEventListener('click', (e) => {
      if (sectionDropdownWrapper && !sectionDropdownWrapper.contains(e.target)) {
        sectionDropdownMenu.style.display = 'none';
        sectionDropdownWrapper.classList.remove('open');
      }
    });

    document.querySelectorAll('.dropdown-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.dataset.target;
        if (target) {
          switchActiveSection(target);
          sectionDropdownMenu.style.display = 'none';
          if (sectionDropdownWrapper) {
            sectionDropdownWrapper.classList.remove('open');
          }
        }
      });
    });
  }

  // Category Filter Pills wiring
  document.querySelectorAll('.category-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter;
      document.querySelectorAll('.category-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      document.querySelectorAll('.column-tab').forEach(tab => {
        const cat = tab.dataset.category || 'other';
        if (filter === 'all' || cat === filter) {
          tab.style.display = 'flex';
        } else {
          tab.style.display = 'none';
        }
      });

      // If active tab became hidden, switch to the first visible tab in this category
      const activeTab = document.querySelector('.column-tab.active');
      if (activeTab && activeTab.style.display === 'none') {
        const firstVisible = document.querySelector('.column-tab:not([style*="display: none"])');
        if (firstVisible && firstVisible.dataset.column) {
          switchActiveSection(firstVisible.dataset.column);
        }
      }
    });
  });

  // Toggle Wrap Tabs layout
  const btnToggleWrap = document.getElementById('btn-toggle-wrap');
  const btnToggleWrapLabel = document.getElementById('btn-toggle-wrap-label');
  const tabsContainer = document.getElementById('column-tabs-container');
  if (btnToggleWrap && tabsContainer) {
    btnToggleWrap.addEventListener('click', () => {
      const isWrapped = tabsContainer.classList.toggle('wrapped');
      btnToggleWrap.classList.toggle('active', isWrapped);
      if (btnToggleWrapLabel) {
        btnToggleWrapLabel.textContent = isWrapped ? 'Scroll Mode' : 'Show All (Wrap)';
      }
      showToast(isWrapped ? 'Showing all sections in multi-row grid' : 'Switched to horizontal scroll dock', '📐');
    });
  }

  // Scroll chevrons (‹ and ›)
  const btnScrollLeft = document.getElementById('btn-scroll-tabs-left');
  const btnScrollRight = document.getElementById('btn-scroll-tabs-right');
  if (btnScrollLeft && tabsContainer) {
    btnScrollLeft.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: -260, behavior: 'smooth' });
    });
  }
  if (btnScrollRight && tabsContainer) {
    btnScrollRight.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: 260, behavior: 'smooth' });
    });
  }

  // 3-Column editable header inputs
  [
    { el: occCol1InputEl, key: 'col1' },
    { el: occCol2InputEl, key: 'col2' },
    { el: occCol3InputEl, key: 'col3' }
  ].forEach(({ el, key }) => {
    if (!el) return;
    el.addEventListener('input', () => {
      const section = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
      if (!AppState.colNames) AppState.colNames = {};
      if (!AppState.colNames[section]) AppState.colNames[section] = {};
      AppState.colNames[section][key] = el.value;
      refreshOutputView();
    });
  });

  // Clicking wrapper or edit icon focuses input
  document.querySelectorAll('.occ-col-title-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      const input = wrapper.querySelector('.occ-col-name-input');
      if (input && e.target !== input) {
        input.focus();
        input.select();
      }
    });
  });

  // Auto-header checkboxes
  if (occAutoHeaderCheckboxEl) {
    occAutoHeaderCheckboxEl.addEventListener('change', () => {
      AppState.occAutoHeader = occAutoHeaderCheckboxEl.checked;
    });
  }
  if (conAutoHeaderCheckboxEl) {
    conAutoHeaderCheckboxEl.addEventListener('change', () => {
      AppState.conAutoHeader = conAutoHeaderCheckboxEl.checked;
    });
  }

  // 3-Column Occupancy Input Listeners
  if (occInputCodeEl && occInputBldgEl && occInputOccEl) {
    [occInputCodeEl, occInputBldgEl, occInputOccEl].forEach(textarea => {
      textarea.addEventListener('input', () => {
        updateOccLineNumbers();
        debouncedProcessCleaning(80);
      });

      textarea.addEventListener('paste', (e) => {
        const pasteText = (e.clipboardData || window.clipboardData)?.getData('text');
        if (pasteText && pasteText.includes('\t')) {
          e.preventDefault();
          distribute3ColumnText(pasteText);
          showToast('Pasted and separated 3 Excel columns!', '📋');
        }
      });
    });

    occInputCodeEl.addEventListener('scroll', () => {
      if (occLinesCodeEl) occLinesCodeEl.scrollTop = occInputCodeEl.scrollTop;
    });
    occInputBldgEl.addEventListener('scroll', () => {
      if (occLinesBldgEl) occLinesBldgEl.scrollTop = occInputBldgEl.scrollTop;
    });
    occInputOccEl.addEventListener('scroll', () => {
      if (occLinesOccEl) occLinesOccEl.scrollTop = occInputOccEl.scrollTop;
    });
  }

  // Paste 3 Columns button
  if (btnPaste3ColEl) {
    btnPaste3ColEl.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          distribute3ColumnText(text);
          showToast('Pasted 3 Excel columns from clipboard!', '📋');
        } else {
          showToast('Clipboard is empty', '⚠️');
        }
      } catch (err) {
        showToast('Please press Ctrl+V / Cmd+V into any column box to paste', 'ℹ️');
      }
    });
  }

  // 2-Column Roof Year Input Listeners
  if (roofYearInputYbEl && roofYearInputRyEl) {
    [roofYearInputYbEl, roofYearInputRyEl].forEach(textarea => {
      textarea.addEventListener('input', () => {
        updateRoofYearLineNumbers();
        debouncedProcessCleaning(80);
      });

      textarea.addEventListener('paste', (e) => {
        const pasteText = (e.clipboardData || window.clipboardData)?.getData('text');
        if (pasteText && pasteText.includes('\t')) {
          e.preventDefault();
          distribute2ColumnText(pasteText);
          showToast('Pasted and separated 2 Excel columns!', '📋');
        }
      });
    });

    roofYearInputYbEl.addEventListener('scroll', () => {
      if (roofYearLinesYbEl) roofYearLinesYbEl.scrollTop = roofYearInputYbEl.scrollTop;
    });
    roofYearInputRyEl.addEventListener('scroll', () => {
      if (roofYearLinesRyEl) roofYearLinesRyEl.scrollTop = roofYearInputRyEl.scrollTop;
    });
  }

  // Paste 2 Columns button
  if (btnPaste2ColEl) {
    btnPaste2ColEl.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          distribute2ColumnText(text);
          showToast('Pasted 2 Excel columns from clipboard!', '📋');
        } else {
          showToast('Clipboard is empty', '⚠️');
        }
      } catch (err) {
        showToast('Please press Ctrl+V / Cmd+V into any column box to paste', 'ℹ️');
      }
    });
  }

  // Roof Year Rule Mode and Remove Empty options
  if (roofYearRuleModeEl) {
    roofYearRuleModeEl.addEventListener('change', (e) => {
      AppState.roofYearRuleMode = e.target.value;
      processCleaning();
    });
  }
  if (roofYearRemoveEmptyCheckboxEl) {
    roofYearRemoveEmptyCheckboxEl.addEventListener('change', (e) => {
      AppState.roofYearRemoveEmpty = e.target.checked;
      processCleaning();
    });
  }

  // Occupancy options
  const occRemoveEmptyEl = document.getElementById('occ-remove-empty-checkbox');
  if (occRemoveEmptyEl) {
    occRemoveEmptyEl.addEventListener('change', (e) => {
      AppState.occRemoveEmpty = e.target.checked;
      processCleaning();
    });
  }

  // Year Built options
  const yearRemoveEmptyEl = document.getElementById('year-remove-empty-checkbox');
  if (yearRemoveEmptyEl) {
    yearRemoveEmptyEl.addEventListener('change', (e) => {
      AppState.yearRemoveEmpty = e.target.checked;
      processCleaning();
    });
  }

  // Roof Description format options
  const roofFormatRadios = document.querySelectorAll('input[name="roof-format-radio"]');
  roofFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.roofFormat = e.target.value;
      processCleaning();
    });
  });

  // Exterior Wall Finish format options
  const wallFormatRadios = document.querySelectorAll('input[name="wall-format-radio"]');
  wallFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.wallFormat = e.target.value;
      processCleaning();
    });
  });

  // Street options
  if (preserveHyphenCheckboxEl) {
    preserveHyphenCheckboxEl.addEventListener('change', (e) => {
      AppState.preserveNumberHyphen = e.target.checked;
      processCleaning();
    });
  }

  if (extractPrimaryCheckboxEl) {
    extractPrimaryCheckboxEl.addEventListener('change', (e) => {
      AppState.extractPrimaryAddress = e.target.checked;
      processCleaning();
    });
  }

  if (stripBldgCheckboxEl) {
    stripBldgCheckboxEl.addEventListener('change', (e) => {
      AppState.stripBldgPrefix = e.target.checked;
      processCleaning();
    });
  }

  if (removeEmptyCheckboxEl) {
    removeEmptyCheckboxEl.addEventListener('change', (e) => {
      AppState.removeEmptyLines = e.target.checked;
      processCleaning();
    });
  }

  document.querySelectorAll('[data-casing]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-casing]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.casing = btn.dataset.casing;
      processCleaning();
    });
  });

  // Address Splitter options
  if (splitIncludeCountyCheckboxEl) {
    splitIncludeCountyCheckboxEl.addEventListener('change', (e) => {
      AppState.splitIncludeCounty = e.target.checked;
      processCleaning();
    });
  }

  if (splitIncludeCountryCheckboxEl) {
    splitIncludeCountryCheckboxEl.addEventListener('change', (e) => {
      AppState.splitIncludeCountry = e.target.checked;
      processCleaning();
    });
  }

  if (splitDefaultCountryInputEl) {
    splitDefaultCountryInputEl.addEventListener('input', (e) => {
      AppState.splitDefaultCountry = e.target.value.trim();
      processCleaning();
    });
  }

  if (splitRemoveEmptyCheckboxEl) {
    splitRemoveEmptyCheckboxEl.addEventListener('change', (e) => {
      AppState.splitRemoveEmpty = e.target.checked;
      processCleaning();
    });
  }

  document.querySelectorAll('[data-split-casing]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-split-casing]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.splitCasing = btn.dataset.splitCasing;
      processCleaning();
    });
  });

  document.querySelectorAll('[data-country-format]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-country-format]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.splitCountryFormat = btn.dataset.countryFormat;
      processCleaning();
    });
  });

  // View mode switcher (Table vs Text)
  if (viewModeTableBtnEl && viewModeTextBtnEl) {
    viewModeTableBtnEl.addEventListener('click', () => setViewMode('table'));
    viewModeTextBtnEl.addEventListener('click', () => setViewMode('text'));
  }

  // Add new word to remove on Enter
  if (newWordInputEl) {
    newWordInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = newWordInputEl.value.trim().toLowerCase();
        if (val && !AppState.wordsToRemove.includes(val)) {
          AppState.wordsToRemove.push(val);
          saveWordsToStorage();
          renderWordTags();
          newWordInputEl.value = '';
          processCleaning();
        }
      }
    });
  }

  // Load sample button
  const loadSampleBtn = document.getElementById('btn-load-sample');
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', () => {
      loadSample(AppState.activeColumnId);
      showToast('Loaded sample records for active tool!', '✨');
    });
  }

  // Clear button
  const clearBtn = document.getElementById('btn-clear-all');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (AppState.activeColumnId === 'occupancy' || AppState.activeColumnId === 'construction') {
        if (occInputCodeEl) occInputCodeEl.value = '';
        if (occInputBldgEl) occInputBldgEl.value = '';
        if (occInputOccEl) occInputOccEl.value = '';
        updateOccLineNumbers();
      }
      rawInputEl.value = '';
      updateLineNumbers();
      processCleaning();
      showToast('Cleared input workspace', '🧹');
    });
  }

  // Paste from clipboard button
  const pasteBtn = document.getElementById('btn-paste-clipboard');
  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (AppState.activeColumnId === 'occupancy' || AppState.activeColumnId === 'construction') {
            distribute3ColumnText(text);
            showToast(`Pasted into 3-column ${AppState.activeColumnId} inputs!`, '📋');
          } else {
            rawInputEl.value = text;
            updateLineNumbers();
            processCleaning();
            showToast('Pasted column from clipboard!', '📋');
          }
        } else {
          showToast('Clipboard is empty', '⚠️');
        }
      } catch (err) {
        showToast('Please press Ctrl+V or Cmd+V to paste directly', 'ℹ️');
      }
    });
  }

  // Copy for Excel buttons (Both Top & Bottom)
  document.querySelectorAll('.btn-copy-excel, #btn-copy-excel, #btn-copy-excel-top').forEach(btn => {
    btn.addEventListener('click', () => {
      copyForExcel();
    });
  });

  // Download .XLSX buttons (Both Top & Bottom)
  document.querySelectorAll('.btn-download-xlsx, #btn-download-xlsx, #btn-download-xlsx-top').forEach(btn => {
    btn.addEventListener('click', () => {
      downloadExcelSpreadsheet();
    });
  });

  // Download .CSV buttons (Both Top & Bottom)
  document.querySelectorAll('.btn-download-csv, #btn-download-csv, #btn-download-csv-top').forEach(btn => {
    btn.addEventListener('click', () => {
      downloadCsvFile();
    });
  });

  // Theme switcher
  const themeBtn = document.getElementById('btn-toggle-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeBtn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
    });
  }

  // File upload
  const fileInputEl = document.getElementById('file-upload-input');
  if (fileInputEl) {
    fileInputEl.addEventListener('change', handleFileSelect);
  }

  // Output Search Input listener
  if (outputSearchInputEl) {
    outputSearchInputEl.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.trim();
      if (btnClearSearchEl) {
        btnClearSearchEl.style.display = AppState.searchQuery ? 'inline-block' : 'none';
      }
      refreshOutputView();
    });
  }

  // Clear Search button
  if (btnClearSearchEl) {
    btnClearSearchEl.addEventListener('click', () => {
      if (outputSearchInputEl) outputSearchInputEl.value = '';
      AppState.searchQuery = '';
      btnClearSearchEl.style.display = 'none';
      refreshOutputView();
      if (outputSearchInputEl) outputSearchInputEl.focus();
    });
  }

  // Output Status Filter
  if (outputStatusFilterEl) {
    outputStatusFilterEl.addEventListener('change', (e) => {
      AppState.statusFilter = e.target.value;
      refreshOutputView();
    });
  }

  // Output Code Filter
  if (outputCodeFilterEl) {
    outputCodeFilterEl.addEventListener('change', (e) => {
      AppState.codeFilter = e.target.value;
      refreshOutputView();
    });
  }

  // Gemini AI modal open / close
  const openGeminiModalBtn = document.getElementById('btn-gemini-modal');
  if (openGeminiModalBtn) {
    openGeminiModalBtn.addEventListener('click', () => {
      updateGeminiModalUI();
      if (geminiTestStatusEl) {
        geminiTestStatusEl.style.display = 'none';
      }
      if (geminiModalEl) geminiModalEl.style.display = 'flex';
    });
  }

  const closeGeminiModalBtn = document.getElementById('btn-close-modal');
  if (closeGeminiModalBtn && geminiModalEl) {
    closeGeminiModalBtn.addEventListener('click', () => {
      geminiModalEl.style.display = 'none';
    });
  }

  if (geminiModalEl) {
    geminiModalEl.addEventListener('click', (e) => {
      if (e.target === geminiModalEl) {
        geminiModalEl.style.display = 'none';
      }
    });
  }

  // Reset Custom Key button
  if (btnClearCustomKeyEl) {
    btnClearCustomKeyEl.addEventListener('click', () => {
      if (window.GeminiService) {
        window.GeminiService.setApiKey('');
        updateGeminiModalUI();
        showToast('Reset to default pre-configured key', '🔄');
      }
    });
  }

  // Save Gemini Key
  const saveKeyBtn = document.getElementById('btn-save-gemini-key');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      if (geminiApiKeyInputEl && window.GeminiService) {
        const val = geminiApiKeyInputEl.value.trim();
        if (val) {
          window.GeminiService.setApiKey(val);
          showToast('Custom Gemini API key saved & active!', '✨');
        } else {
          showToast('Active API key retained & protected', '🔒');
        }
        geminiApiKeyInputEl.value = '';
      }
      if (geminiModalEl) geminiModalEl.style.display = 'none';
    });
  }

  // Test Gemini Connection
  const testKeyBtn = document.getElementById('btn-test-gemini');
  if (testKeyBtn) {
    testKeyBtn.addEventListener('click', async () => {
      if (!window.GeminiService) return;
      testKeyBtn.disabled = true;
      testKeyBtn.textContent = 'Testing...';
      if (geminiTestStatusEl) {
        geminiTestStatusEl.style.display = 'block';
        geminiTestStatusEl.className = 'test-status-area';
        geminiTestStatusEl.textContent = 'Connecting to Google Gemini API...';
      }

      try {
        if (geminiApiKeyInputEl && geminiApiKeyInputEl.value.trim()) {
          window.GeminiService.setApiKey(geminiApiKeyInputEl.value.trim());
        }
        const res = await window.GeminiService.testConnection();
        updateGeminiModalUI();
        if (geminiTestStatusEl) {
          geminiTestStatusEl.className = 'test-status-area success';
          geminiTestStatusEl.textContent = `✓ Connected! Model: ${res.model} is active.`;
        }
      } catch (err) {
        if (geminiTestStatusEl) {
          geminiTestStatusEl.className = 'test-status-area error';
          geminiTestStatusEl.textContent = `✗ Connection failed: ${err.message}`;
        }
      } finally {
        testKeyBtn.disabled = false;
        testKeyBtn.textContent = '🧪 Test Connection';
      }
    });
  }

  // AI Process Buttons
  const runAiBtn = document.getElementById('btn-ai-process');
  if (runAiBtn) {
    runAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const splitAiBtn = document.getElementById('btn-split-ai');
  if (splitAiBtn) {
    splitAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const streetAiBtn = document.getElementById('btn-street-ai');
  if (streetAiBtn) {
    streetAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const occAiBtn = document.getElementById('btn-occupancy-ai');
  if (occAiBtn) {
    occAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const conAiBtn = document.getElementById('btn-construction-ai');
  if (conAiBtn) {
    conAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const wallAiBtn = document.getElementById('btn-wall-ai');
  if (wallAiBtn) {
    wallAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const yearAiBtn = document.getElementById('btn-year-ai');
  if (yearAiBtn) {
    yearAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  setupDragAndDrop();
}

/**
 * Setup drag-and-drop on input area
 */
function setupDragAndDrop() {
  const container = document.getElementById('input-editor-container');
  const overlay = document.getElementById('dropzone-overlay');
  if (!container || !overlay) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    container.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.classList.add('active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    container.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.classList.remove('active');
    }, false);
  });

  container.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleUploadedFile(files[0]);
    }
  });
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    handleUploadedFile(files[0]);
    e.target.value = '';
  }
}

function handleUploadedFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    if (typeof XLSX !== 'undefined') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (AppState.activeColumnId === 'occupancy' || AppState.activeColumnId === 'construction') {
            const section = AppState.activeColumnId;
            const autoHeaderEnabled = (section === 'construction') ? AppState.conAutoHeader : AppState.occAutoHeader;
            let dataRows = json.filter(r => r && r.length > 0);

            if (autoHeaderEnabled && dataRows.length > 0) {
              const firstRow = dataRows[0];
              if (isHeaderRow(firstRow, section)) {
                applyDetectedHeaders(firstRow, section);
                dataRows.shift();
              }
            }

            const codes = [];
            const bldgs = [];
            const occs = [];
            dataRows.forEach(row => {
              if (row.length >= 3) {
                codes.push(row[0] !== undefined ? String(row[0]) : '');
                bldgs.push(row[1] !== undefined ? String(row[1]) : '');
                occs.push(row[2] !== undefined ? String(row[2]) : '');
              } else if (row.length === 2) {
                if (/^\d{1,4}$/.test(String(row[0]).trim())) {
                  codes.push(String(row[0]));
                  bldgs.push(row[1] !== undefined ? String(row[1]) : '');
                  occs.push('');
                } else {
                  codes.push('');
                  bldgs.push(String(row[0]));
                  occs.push(row[1] !== undefined ? String(row[1]) : '');
                }
              } else {
                codes.push('');
                bldgs.push(String(row[0]));
                occs.push('');
              }
            });
            if (occInputCodeEl) occInputCodeEl.value = codes.join('\n');
            if (occInputBldgEl) occInputBldgEl.value = bldgs.join('\n');
            if (occInputOccEl) occInputOccEl.value = occs.join('\n');
            updateOccLineNumbers();
            processCleaning();
            showToast(`Imported ${Math.max(codes.length, bldgs.length, occs.length)} rows into 3 columns!`, '📊');
            return;
          }

          const columnData = [];
          json.forEach(row => {
            if (row && row.length > 0 && row[0] !== undefined) {
              columnData.push(String(row[0]));
            }
          });

          rawInputEl.value = columnData.join('\n');
          updateLineNumbers();
          processCleaning();
          showToast(`Imported ${columnData.length} rows from ${file.name}`, '📊');
        } catch (err) {
          showToast('Failed to parse Excel file', '❌');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      showToast('Please upload a CSV or plain text file', 'ℹ️');
    }
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (AppState.activeColumnId === 'occupancy' || AppState.activeColumnId === 'construction') {
        distribute3ColumnText(text);
        showToast(`Loaded ${file.name} into 3 columns!`, '📄');
      } else {
        rawInputEl.value = text;
        updateLineNumbers();
        processCleaning();
        showToast(`Loaded ${file.name}`, '📄');
      }
    };
    reader.readAsText(file);
  }
}

function updateLineNumbers() {
  const lines = rawInputEl.value.split('\n');
  const count = Math.max(lines.length, 1);
  const numArr = [];
  for (let i = 1; i <= count; i++) {
    numArr.push(i);
  }
  lineNumbersEl.textContent = numArr.join('\n');
  rawCountBadgeEl.textContent = `${lines[0] === '' && lines.length === 1 ? 0 : lines.length} rows`;
}

function updateOccLineNumbers() {
  const codeVal = occInputCodeEl ? occInputCodeEl.value : '';
  const bldgVal = occInputBldgEl ? occInputBldgEl.value : '';
  const occVal = occInputOccEl ? occInputOccEl.value : '';

  const codeLines = codeVal.split('\n');
  const bldgLines = bldgVal.split('\n');
  const occLines = occVal.split('\n');
  const maxLines = Math.max(codeLines.length, bldgLines.length, occLines.length, 1);

  const numArr = [];
  for (let i = 1; i <= maxLines; i++) {
    numArr.push(i);
  }
  const numbersText = numArr.join('\n');
  if (occLinesCodeEl) occLinesCodeEl.textContent = numbersText;
  if (occLinesBldgEl) occLinesBldgEl.textContent = numbersText;
  if (occLinesOccEl) occLinesOccEl.textContent = numbersText;

  const isAllBlank = !codeVal.trim() && !bldgVal.trim() && !occVal.trim();
  if (rawCountBadgeEl) {
    rawCountBadgeEl.textContent = `${isAllBlank ? 0 : maxLines} rows`;
  }
}

function distribute3ColumnText(text) {
  if (!text) return;
  const rows = text.split(/\r\n|\r|\n/);
  if (rows.length > 1 && rows[rows.length - 1].trim() === '') {
    rows.pop();
  }
  if (rows.length === 0) return;

  const section = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
  const autoHeaderEnabled = (section === 'construction') ? AppState.conAutoHeader : AppState.occAutoHeader;

  // Auto-detect custom column headers from row 1 if enabled
  if (autoHeaderEnabled && rows.length > 0) {
    const firstRowCells = rows[0].split('\t').map(c => c.trim());
    if (isHeaderRow(firstRowCells, section)) {
      applyDetectedHeaders(firstRowCells, section);
      rows.shift();
    }
  }

  const codes = [];
  const bldgs = [];
  const occs = [];

  rows.forEach(r => {
    const cols = r.split('\t');
    if (cols.length >= 3) {
      codes.push(cols[0].trim());
      bldgs.push(cols[1].trim());
      occs.push(cols.slice(2).join('\t').trim());
    } else if (cols.length === 2) {
      if (/^\d{1,4}$/.test(cols[0].trim())) {
        codes.push(cols[0].trim());
        bldgs.push(cols[1].trim());
        occs.push('');
      } else {
        codes.push('');
        bldgs.push(cols[0].trim());
        occs.push(cols[1].trim());
      }
    } else {
      codes.push('');
      bldgs.push(r.trim());
      occs.push('');
    }
  });

  if (occInputCodeEl) occInputCodeEl.value = codes.join('\n');
  if (occInputBldgEl) occInputBldgEl.value = bldgs.join('\n');
  if (occInputOccEl) occInputOccEl.value = occs.join('\n');

  updateOccLineNumbers();
  processCleaning();
}

function updateRoofYearLineNumbers() {
  const ybVal = roofYearInputYbEl ? roofYearInputYbEl.value : '';
  const ryVal = roofYearInputRyEl ? roofYearInputRyEl.value : '';

  const ybLines = ybVal.split('\n');
  const ryLines = ryVal.split('\n');
  const maxLines = Math.max(ybLines.length, ryLines.length, 1);

  const numArr = [];
  for (let i = 1; i <= maxLines; i++) {
    numArr.push(i);
  }
  const numbersText = numArr.join('\n');
  if (roofYearLinesYbEl) roofYearLinesYbEl.textContent = numbersText;
  if (roofYearLinesRyEl) roofYearLinesRyEl.textContent = numbersText;

  const isAllBlank = !ybVal.trim() && !ryVal.trim();
  if (rawCountBadgeEl) {
    rawCountBadgeEl.textContent = `${isAllBlank ? 0 : maxLines} rows`;
  }
}

function distribute2ColumnText(text) {
  if (!text) return;
  const rows = text.split(/\r\n|\r|\n/);
  if (rows.length > 1 && rows[rows.length - 1].trim() === '') {
    rows.pop();
  }
  if (rows.length === 0) return;

  // Auto-skip header row if user pastes e.g. "Year Built\tRoof Year"
  if (rows.length > 1) {
    const firstCells = rows[0].toLowerCase();
    if (firstCells.includes('year') && (firstCells.includes('roof') || firstCells.includes('built'))) {
      rows.shift();
    }
  }

  const ybs = [];
  const rys = [];

  rows.forEach(r => {
    const cols = r.split('\t');
    if (cols.length >= 2) {
      ybs.push(cols[0].trim());
      rys.push(cols.slice(1).join('\t').trim());
    } else {
      ybs.push(r.trim());
      rys.push('');
    }
  });

  if (roofYearInputYbEl) roofYearInputYbEl.value = ybs.join('\n');
  if (roofYearInputRyEl) roofYearInputRyEl.value = rys.join('\n');

  updateRoofYearLineNumbers();
  processCleaning();
}

function saveWordsToStorage() {
  try {
    localStorage.setItem('cleanexcel_words_to_remove', JSON.stringify(AppState.wordsToRemove));
  } catch (e) { /* storage not available */ }
}

function renderWordTags() {
  if (!wordsTagsContainerEl) return;
  wordsTagsContainerEl.innerHTML = '';

  AppState.wordsToRemove.forEach((word) => {
    const tag = document.createElement('span');
    tag.className = 'tag-badge';
    tag.innerHTML = `
      <span>${word}</span>
      <span class="remove-tag" title="Remove '${word}'">×</span>
    `;

    tag.querySelector('.remove-tag').addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.wordsToRemove = AppState.wordsToRemove.filter(w => w !== word);
      saveWordsToStorage();
      renderWordTags();
      processCleaning();
    });

    wordsTagsContainerEl.appendChild(tag);
  });
}

/**
 * Update Status Filter options based on active engine
 */
function updateStatusFilterOptions() {
  if (!outputStatusFilterEl) return;
  const colId = AppState.activeColumnId;
  let html = '<option value="all">All Statuses</option>';
  if (colId === 'occupancy' || colId === 'construction') {
    html += `
      <option value="match">✓ Confirmed</option>
      <option value="upgraded">✨ Resolved</option>
      <option value="assigned">✨ Assigned</option>
      <option value="mismatch">⚠️ Review Differs</option>
    `;
    outputStatusFilterEl.style.display = 'inline-block';
  } else if (colId === 'roof_year') {
    html += `
      <option value="assigned">✓ Valid</option>
      <option value="mismatch">⚠️ Precedes Year Built (&lt; Year Built)</option>
      <option value="missing_yb">⚠️ Missing Year Built</option>
      <option value="missing_roof">⚠️ Missing Roof Year</option>
      <option value="empty">Blank</option>
    `;
    outputStatusFilterEl.style.display = 'inline-block';
  } else if (colId === 'street') {
    html += `
      <option value="cleaned">🧹 Cleaned</option>
      <option value="unchanged">Unchanged</option>
      <option value="empty">Blank</option>
    `;
    outputStatusFilterEl.style.display = 'inline-block';
  } else if (colId === 'split') {
    outputStatusFilterEl.style.display = 'none';
  }
  outputStatusFilterEl.innerHTML = html;
  AppState.statusFilter = 'all';
  outputStatusFilterEl.value = 'all';
}

/**
 * Update search input placeholder dynamically
 */
function updateSearchPlaceholder() {
  if (!outputSearchInputEl) return;
  const colId = AppState.activeColumnId;
  if (colId === 'occupancy') {
    outputSearchInputEl.placeholder = 'Filter rows (code, building, description, keyword)...';
  } else if (colId === 'construction') {
    outputSearchInputEl.placeholder = 'Filter rows (code, building, material, keyword)...';
  } else if (colId === 'roof_year') {
    outputSearchInputEl.placeholder = 'Filter rows (year, status, keyword)...';
  } else if (colId === 'split') {
    outputSearchInputEl.placeholder = 'Filter rows (street, city, state, postal, country)...';
  } else {
    outputSearchInputEl.placeholder = 'Filter rows (address, keyword)...';
  }
}

/**
 * Update dynamic Touchstone Code dropdown options based on current dataset
 */
function updateCodeFilterDropdown(data) {
  if (!outputCodeFilterEl) return;
  const isCodeEngine = AppState.activeColumnId === 'occupancy' || AppState.activeColumnId === 'construction';
  if (!isCodeEngine || !data || data.length === 0) {
    outputCodeFilterEl.style.display = 'none';
    outputCodeFilterEl.innerHTML = '<option value="all">All Touchstone Codes</option>';
    AppState.codeFilter = 'all';
    return;
  }

  outputCodeFilterEl.style.display = 'inline-block';
  const codes = new Set();
  data.forEach(r => {
    if (r.conCode) codes.add(String(r.conCode).trim());
    if (r.occCode) codes.add(String(r.occCode).trim());
    if (r.existingCode) codes.add(String(r.existingCode).trim());
  });

  const sortedCodes = Array.from(codes).filter(Boolean).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const currentVal = AppState.codeFilter;
  let optionsHtml = '<option value="all">All Touchstone Codes</option>';
  sortedCodes.forEach(c => {
    optionsHtml += `<option value="${escapeHtml(c)}">Code ${escapeHtml(c)}</option>`;
  });
  outputCodeFilterEl.innerHTML = optionsHtml;

  if (codes.has(currentVal)) {
    outputCodeFilterEl.value = currentVal;
  } else {
    AppState.codeFilter = 'all';
    outputCodeFilterEl.value = 'all';
  }
}

/**
 * Filter data based on active search query, status filter, and code filter
 */
function getFilteredOutputData() {
  const allData = AppState.lastCleanedData || [];
  if (allData.length === 0) return [];

  const isSplit = AppState.activeColumnId === 'split';
  const isOccupancy = AppState.activeColumnId === 'occupancy';
  const isConstruction = AppState.activeColumnId === 'construction';
  const isRoofYear = AppState.activeColumnId === 'roof_year';
  const query = (AppState.searchQuery || '').trim().toLowerCase();
  const status = AppState.statusFilter || 'all';
  const code = AppState.codeFilter || 'all';

  // Fast path: no filter active
  if (!query && status === 'all' && code === 'all') {
    return allData;
  }

  return allData.filter(r => {
    // 1. Status Filter
    if (status !== 'all') {
      if (isOccupancy || isConstruction) {
        if (r.comparisonStatus !== status) return false;
      } else if (isRoofYear) {
        if (status === 'assigned' && r.status !== 'assigned' && r.status !== 'unchanged') return false;
        if (status === 'mismatch' && r.status !== 'mismatch') return false;
        if (status === 'missing_yb' && r.status !== 'missing_yb') return false;
        if (status === 'missing_roof' && r.status !== 'missing_roof') return false;
        if (status === 'empty' && r.status !== 'empty') return false;
      } else if (isSplit) {
        // split mode: all allowed
      } else {
        if (status === 'cleaned' && !r.changed) return false;
        if (status === 'unchanged' && (r.changed || !r.original.trim())) return false;
        if (status === 'empty' && r.original.trim()) return false;
      }
    }

    // 2. Code Filter
    if ((isOccupancy || isConstruction) && code !== 'all') {
      const targetCode = String(isConstruction ? (r.conCode || '') : (r.occCode || '')).trim();
      const existingCodeStr = String(r.existingCode || '').trim();
      if (targetCode !== code && existingCodeStr !== code) return false;
    }

    // 3. Keyword Search Query
    if (query) {
      if (isConstruction) {
        const lineStr = String(r.lineNum || '');
        const existStr = String(r.existingCode || '').toLowerCase();
        const bldgStr = String(r.bldgDesc || '').toLowerCase();
        const conStr = String(r.conDesc || '').toLowerCase();
        const codeStr = String(r.conCode || '').toLowerCase();
        const catStr = String(r.category || '').toLowerCase();
        const grpStr = String(r.group || '').toLowerCase();
        const msgStr = String(r.comparisonMessage || '').toLowerCase();
        const found = lineStr.includes(query) ||
          existStr.includes(query) ||
          bldgStr.includes(query) ||
          conStr.includes(query) ||
          codeStr.includes(query) ||
          catStr.includes(query) ||
          grpStr.includes(query) ||
          msgStr.includes(query);
        if (!found) return false;
      } else if (isOccupancy) {
        const lineStr = String(r.lineNum || '');
        const existStr = String(r.existingCode || '').toLowerCase();
        const bldgStr = String(r.bldgDesc || '').toLowerCase();
        const occStr = String(r.occDesc || '').toLowerCase();
        const codeStr = String(r.occCode || '').toLowerCase();
        const catStr = String(r.category || '').toLowerCase();
        const msgStr = String(r.comparisonMessage || '').toLowerCase();
        const found = lineStr.includes(query) ||
          existStr.includes(query) ||
          bldgStr.includes(query) ||
          occStr.includes(query) ||
          codeStr.includes(query) ||
          catStr.includes(query) ||
          msgStr.includes(query);
        if (!found) return false;
      } else if (isRoofYear) {
        const lineStr = String(r.lineNum || '');
        const ybStr = String(r.yearBuilt || r.rawYearBuilt || '').toLowerCase();
        const ryStr = String(r.roofYearBuilt || r.rawRoofYearBuilt || '').toLowerCase();
        const cleanStr = String(r.cleaned || '').toLowerCase();
        const statStr = String(r.statusText || '').toLowerCase();
        const found = lineStr.includes(query) ||
          ybStr.includes(query) ||
          ryStr.includes(query) ||
          cleanStr.includes(query) ||
          statStr.includes(query);
        if (!found) return false;
      } else if (isSplit) {
        const lineStr = String(r.lineNum || '');
        const streetStr = String(r.street || '').toLowerCase();
        const cityStr = String(r.city || '').toLowerCase();
        const stateStr = String(r.state || '').toLowerCase();
        const countyStr = String(r.county || '').toLowerCase();
        const postalStr = String(r.postal || '').toLowerCase();
        const countryStr = String(r.country || '').toLowerCase();
        const found = lineStr.includes(query) ||
          streetStr.includes(query) ||
          cityStr.includes(query) ||
          stateStr.includes(query) ||
          countyStr.includes(query) ||
          postalStr.includes(query) ||
          countryStr.includes(query);
        if (!found) return false;
      } else {
        const lineStr = String(r.lineNum || '');
        const origStr = String(r.original || '').toLowerCase();
        const cleanStr = String(r.cleaned || '').toLowerCase();
        const found = lineStr.includes(query) ||
          origStr.includes(query) ||
          cleanStr.includes(query);
        if (!found) return false;
      }
    }

    return true;
  });
}

/**
 * Refresh output view without re-running cleaning pipeline
 */
function refreshOutputView() {
  const filtered = getFilteredOutputData();
  let modifiedRows = 0;
  let totalCharsOriginal = 0;
  let totalCharsCleaned = 0;

  filtered.forEach(r => {
    totalCharsOriginal += (r.original || '').length;
    totalCharsCleaned += (r.cleaned || '').length;
    if (r.changed) modifiedRows++;
  });

  const charsRemoved = Math.max(0, totalCharsOriginal - totalCharsCleaned);
  renderOutput(filtered, modifiedRows, charsRemoved);
}

/**
 * Reset all active output filters
 */
function resetOutputFilters() {
  AppState.searchQuery = '';
  AppState.statusFilter = 'all';
  AppState.codeFilter = 'all';
  if (outputSearchInputEl) outputSearchInputEl.value = '';
  if (btnClearSearchEl) btnClearSearchEl.style.display = 'none';
  if (outputStatusFilterEl) outputStatusFilterEl.value = 'all';
  if (outputCodeFilterEl) outputCodeFilterEl.value = 'all';
  refreshOutputView();
}
window.resetOutputFilters = resetOutputFilters;

/**
 * Execute cleaning / splitting algorithm
 */
function processCleaning() {
  const isSplit = AppState.activeColumnId === 'split';
  const isOccupancy = AppState.activeColumnId === 'occupancy';
  const isConstruction = AppState.activeColumnId === 'construction';
  const isRoofYear = AppState.activeColumnId === 'roof_year';
  const rawText = rawInputEl ? rawInputEl.value : '';

  if (isRoofYear) {
    const ybVal = roofYearInputYbEl ? roofYearInputYbEl.value : '';
    const ryVal = roofYearInputRyEl ? roofYearInputRyEl.value : '';
    const rawVal = rawText;

    const hasData = ybVal.trim() || ryVal.trim() || rawVal.trim();
    if (!hasData) {
      AppState.lastCleanedData = [];
      updateCodeFilterDropdown([]);
      refreshOutputView();
      return;
    }

    let inputPayload;
    if (ybVal.trim() || ryVal.trim()) {
      inputPayload = {
        yearBuilt: ybVal.split(/\r\n|\r|\n/),
        roofYearBuilt: ryVal.split(/\r\n|\r|\n/)
      };
    } else {
      inputPayload = rawVal;
    }

    const cleanerObj = window.RoofYearCleaner || (window.CleanersRegistry && window.CleanersRegistry.roof_year && window.CleanersRegistry.roof_year.cleaner);
    const options = {
      minYear: AppState.yearMin || 1753,
      maxYear: AppState.yearMax || new Date().getFullYear(),
      ruleMode: AppState.roofYearRuleMode || 'roof_ge_yb',
      removeEmptyLines: AppState.roofYearRemoveEmpty
    };

    const results = cleanerObj.cleanColumn(inputPayload, options);
    AppState.lastCleanedData = results;
    updateCodeFilterDropdown(results);
    refreshOutputView();
    return;
  }

  if (isOccupancy || isConstruction) {
    const codeVal = occInputCodeEl ? occInputCodeEl.value : '';
    const bldgVal = occInputBldgEl ? occInputBldgEl.value : '';
    const conOrOccVal = occInputOccEl ? occInputOccEl.value : '';
    const rawVal = rawText;

    const hasData = codeVal.trim() || bldgVal.trim() || conOrOccVal.trim() || rawVal.trim();
    if (!hasData) {
      AppState.lastCleanedData = [];
      updateCodeFilterDropdown([]);
      refreshOutputView();
      return;
    }

    let inputPayload;
    if (codeVal.trim() || bldgVal.trim() || conOrOccVal.trim()) {
      if (isConstruction) {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          conDescs: conOrOccVal.split(/\r\n|\r|\n/)
        };
      } else {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          occDescs: conOrOccVal.split(/\r\n|\r|\n/)
        };
      }
    } else {
      inputPayload = rawVal;
    }

    let cleanerObj;
    let options = {};
    if (isConstruction) {
      cleanerObj = window.ConstructionClassifier || (window.CleanersRegistry && window.CleanersRegistry.construction && window.CleanersRegistry.construction.cleaner);
      options = { removeEmptyLines: AppState.conRemoveEmpty };
    } else {
      cleanerObj = window.OccupancyClassifier || (window.CleanersRegistry && window.CleanersRegistry.occupancy && window.CleanersRegistry.occupancy.cleaner);
      options = { removeEmptyLines: AppState.occRemoveEmpty };
    }

    const results = cleanerObj.cleanColumn(inputPayload, options);
    AppState.lastCleanedData = results;
    updateCodeFilterDropdown(results);
    refreshOutputView();
    return;
  }

  if (!rawText.trim()) {
    AppState.lastCleanedData = [];
    updateCodeFilterDropdown([]);
    refreshOutputView();
    return;
  }

  let cleanerObj;
  let options = {};

  if (isSplit) {
    cleanerObj = window.AddressSplitter;
    options = {
      defaultCountry: AppState.splitIncludeCountry ? AppState.splitDefaultCountry : '',
      countryFormat: AppState.splitCountryFormat,
      casing: AppState.splitCasing,
      removeEmptyLines: AppState.splitRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'year') {
    cleanerObj = window.YearBuiltCleaner || (window.CleanersRegistry && window.CleanersRegistry.year && window.CleanersRegistry.year.cleaner);
    options = {
      minYear: AppState.yearMin || 1753,
      maxYear: AppState.yearMax || new Date().getFullYear(),
      removeEmptyLines: AppState.yearRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'roof') {
    cleanerObj = window.RoofClassifier || (window.CleanersRegistry && window.CleanersRegistry.roof && window.CleanersRegistry.roof.cleaner);
    options = {
      format: AppState.roofFormat || 'code_only',
      removeEmptyLines: AppState.roofRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'wall') {
    cleanerObj = window.WallClassifier || (window.CleanersRegistry && window.CleanersRegistry.wall && window.CleanersRegistry.wall.cleaner);
    options = {
      format: AppState.wallFormat || 'code_only',
      removeEmptyLines: AppState.wallRemoveEmpty
    };
  } else {
    cleanerObj = (window.CleanersRegistry && window.CleanersRegistry[AppState.activeColumnId])
      ? window.CleanersRegistry[AppState.activeColumnId].cleaner
      : window.StreetCleaner;

    options = {
      preserveNumberHyphen: AppState.preserveNumberHyphen,
      extractPrimaryAddress: AppState.extractPrimaryAddress,
      stripBldgPrefix: AppState.stripBldgPrefix,
      wordsToRemove: AppState.wordsToRemove,
      symbolsToRemove: AppState.symbolsToRemove,
      casing: AppState.casing,
      removeEmptyLines: AppState.removeEmptyLines
    };
  }

  const results = cleanerObj.cleanColumn(rawText, options);
  AppState.lastCleanedData = results;
  updateCodeFilterDropdown(results);
  refreshOutputView();
}

/**
 * Render results to Table and Text view
 */
function renderOutput(results, modifiedRows, charsRemoved) {
  const totalRows = (AppState.lastCleanedData || []).length;
  const isFiltering = !!(AppState.searchQuery || AppState.statusFilter !== 'all' || AppState.codeFilter !== 'all');

  if (cleanCountBadgeEl) {
    if (totalRows === 0) {
      cleanCountBadgeEl.textContent = '0 rows';
    } else if (isFiltering) {
      cleanCountBadgeEl.textContent = `${results.length} of ${totalRows} rows`;
    } else {
      cleanCountBadgeEl.textContent = `${totalRows} rows`;
    }
  }

  if (filterCountBadgeEl) {
    if (isFiltering && totalRows > 0) {
      filterCountBadgeEl.style.display = 'inline-flex';
      filterCountBadgeEl.textContent = `Showing ${results.length} of ${totalRows}`;
    } else {
      filterCountBadgeEl.style.display = 'none';
    }
  }

  const formattedRows = (modifiedRows || 0).toLocaleString();
  const formattedChars = (charsRemoved || 0).toLocaleString();
  document.querySelectorAll('.stat-rows-cleaned, #stat-rows-cleaned, #stat-rows-cleaned-top').forEach(el => { el.textContent = formattedRows; });
  document.querySelectorAll('.stat-chars-removed, #stat-chars-removed, #stat-chars-removed-top').forEach(el => { el.textContent = formattedChars; });

  // Update React 18 High-Performance Output Engine
  if (window.CleanExcelReact) {
    window.CleanExcelReact.updateActiveColumn(AppState.activeColumnId);
    if (AppState.colNames) {
      window.CleanExcelReact.updateColNames(AppState.colNames);
    }
    window.CleanExcelReact.setSearchQuery(AppState.searchQuery || '');
    window.CleanExcelReact.setStatusFilter(AppState.statusFilter || 'all');
    window.CleanExcelReact.setCodeFilter(AppState.codeFilter || 'all');
    window.CleanExcelReact.setViewMode(AppState.viewMode || 'table');
    window.CleanExcelReact.updateData(AppState.lastCleanedData || []);
  }
}

function setViewMode(mode) {
  AppState.viewMode = mode;
  if (mode === 'table') {
    if (viewModeTableBtnEl) viewModeTableBtnEl.classList.add('active');
    if (viewModeTextBtnEl) viewModeTextBtnEl.classList.remove('active');
  } else {
    if (viewModeTextBtnEl) viewModeTextBtnEl.classList.add('active');
    if (viewModeTableBtnEl) viewModeTableBtnEl.classList.remove('active');
  }
  if (window.CleanExcelReact) {
    window.CleanExcelReact.setViewMode(mode);
  }
}

/**
 * Copy for Excel (multi-column TSV and HTML table ready to paste directly across Excel columns)
 */
async function copyForExcel() {
  const dataToCopy = getFilteredOutputData();
  if (dataToCopy.length === 0) {
    showToast('No matching data to copy', '⚠️');
    return;
  }

  const isSplit = AppState.activeColumnId === 'split';
  const isOccupancy = AppState.activeColumnId === 'occupancy';
  const isConstruction = AppState.activeColumnId === 'construction';
  const isRoof = AppState.activeColumnId === 'roof';
  const isWall = AppState.activeColumnId === 'wall';
  const isRoofYear = AppState.activeColumnId === 'roof_year';
  let excelText = '';
  let excelHtml = '';

  if (isSplit) {
    const headers = ['STREET', 'City', 'State'];
    if (AppState.splitIncludeCounty) headers.push('County');
    headers.push('Postal');
    if (AppState.splitIncludeCountry) headers.push('Country');

    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.street, r.city, r.state];
      if (AppState.splitIncludeCounty) row.push(r.county);
      row.push(r.postal);
      if (AppState.splitIncludeCountry) row.push(r.country);
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (isOccupancy) {
    const col1Title = `${getColumnHeaderName(1)} (AR)`;
    const col2Title = `${getColumnHeaderName(2)} (AS)`;
    const col3Title = `${getColumnHeaderName(3)} (AT)`;
    const headers = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.existingCode || '', r.bldgDesc || '', r.occDesc || '', r.occCode || '300', r.category || 'Unknown occupancy', r.comparisonMessage || ''];
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (isConstruction) {
    const col1Title = `${getColumnHeaderName(1)} (AR)`;
    const col2Title = `${getColumnHeaderName(2)} (AS)`;
    const col3Title = `${getColumnHeaderName(3)} (AT)`;
    const headers = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.existingCode || '', r.bldgDesc || '', r.conDesc || '', r.conCode || '100', r.category || 'Unknown', r.comparisonMessage || ''];
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (isRoof) {
    const headers = ['Raw Roof Input', '1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.original || '', r.geometryCode || '', r.pitchCode || '', r.coveringCode || '', r.deckCode || ''];
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (isWall) {
    const headers = ['Raw Wall Input', '1. WallType', '2. WallSiding'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.original || '', r.wallTypeCode || '', r.wallSidingCode || ''];
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (isRoofYear) {
    const headers = ['Year Built', 'Roof Year Built (Input)', 'Cleaned Roof Year Built', 'Validation Status'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [
        r.yearBuilt || r.rawYearBuilt || '',
        r.roofYearBuilt || r.rawRoofYearBuilt || '',
        r.cleaned || '',
        r.statusText || ''
      ];
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else {
    const plainLines = dataToCopy.map(r => r.cleaned);
    excelText = plainLines.join('\r\n');
    const tableRows = plainLines.map(line => `<tr><td>${escapeHtml(line)}</td></tr>`).join('');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${tableRows}</table></body></html>`;
  }

  const totalCount = (AppState.lastCleanedData || []).length;
  const isFiltered = dataToCopy.length < totalCount;

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobText = new Blob([excelText], { type: 'text/plain' });
      const blobHtml = new Blob([excelHtml], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': blobText,
          'text/html': blobHtml
        })
      ]);
    } else {
      await navigator.clipboard.writeText(excelText);
    }
    showToast(`Copied ${dataToCopy.length} ${isFiltered ? 'filtered ' : ''}rows formatted for Excel columns!`, '📋');
  } catch (err) {
    try {
      const tempArea = document.createElement('textarea');
      tempArea.value = excelText;
      document.body.appendChild(tempArea);
      tempArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempArea);
      showToast(`Copied ${dataToCopy.length} ${isFiltered ? 'filtered ' : ''}rows for Excel!`, '📋');
    } catch (e) {
      showToast('Could not access clipboard automatically', '❌');
    }
  }
}

/**
 * Download as native Excel spreadsheet (.xlsx / .xls)
 */
function downloadExcelSpreadsheet() {
  const dataToExport = getFilteredOutputData();
  if (dataToExport.length === 0) {
    showToast('No matching data to download', '⚠️');
    return;
  }

  const isSplit = AppState.activeColumnId === 'split';
  const isOccupancy = AppState.activeColumnId === 'occupancy';
  const isConstruction = AppState.activeColumnId === 'construction';
  const isRoof = AppState.activeColumnId === 'roof';
  const isWall = AppState.activeColumnId === 'wall';
  const isRoofYear = AppState.activeColumnId === 'roof_year';
  const totalCount = (AppState.lastCleanedData || []).length;
  const isFiltered = dataToExport.length < totalCount;

  if (isSplit) {
    const headers = ['STREET', 'City', 'State'];
    if (AppState.splitIncludeCounty) headers.push('County');
    headers.push('Postal');
    if (AppState.splitIncludeCountry) headers.push('Country');

    const sheetRows = [headers];
    dataToExport.forEach(r => {
      const row = [r.street, r.city, r.state];
      if (AppState.splitIncludeCounty) row.push(r.county);
      row.push(r.postal);
      if (AppState.splitIncludeCountry) row.push(r.country);
      sheetRows.push(row);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Separated Addresses");
      XLSX.writeFile(wb, `Separated_Addresses_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}addresses (.xlsx)!`, '📥');
      return;
    }

    // Fallback XML
    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Addresses"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Separated_Addresses_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}addresses (.xls)!`, '📥');
  } else if (isOccupancy) {
    const col1Title = `${getColumnHeaderName(1)} (AR)`;
    const col2Title = `${getColumnHeaderName(2)} (AS)`;
    const col3Title = `${getColumnHeaderName(3)} (AT)`;
    const headers = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach(r => {
      sheetRows.push([r.existingCode || '', r.bldgDesc || '', r.occDesc || '', r.occCode || '300', r.category || 'Unknown occupancy', r.comparisonMessage || '']);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Occupancy Codes");
      XLSX.writeFile(wb, `Occupancy_Codes_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}occupancy codes (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="OccupancyCodes"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Occupancy_Codes_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}occupancy codes (.xls)!`, '📥');
  } else if (isConstruction) {
    const col1Title = `${getColumnHeaderName(1)} (AR)`;
    const col2Title = `${getColumnHeaderName(2)} (AS)`;
    const col3Title = `${getColumnHeaderName(3)} (AT)`;
    const headers = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach(r => {
      sheetRows.push([r.existingCode || '', r.bldgDesc || '', r.conDesc || '', r.conCode || '100', r.category || 'Unknown', r.comparisonMessage || '']);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Construction Codes");
      XLSX.writeFile(wb, `Construction_Codes_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}construction codes (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="ConstructionCodes"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Construction_Codes_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}construction codes (.xls)!`, '📥');
  } else if (isRoof) {
    const headers = ['#', 'Raw Input', '1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.original || '',
        r.geometryCode || '',
        r.pitchCode || '',
        r.coveringCode || '',
        r.deckCode || '',
        r.statusText || ''
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Roof Details");
      XLSX.writeFile(wb, `Roof_Details_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}roof details (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="RoofDetails"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Roof_Details_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}roof details (.xls)!`, '📥');
  } else if (isRoofYear) {
    const headers = ['#', 'Year Built', 'Roof Year Built (Input)', 'Cleaned Roof Year Built', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.yearBuilt || r.rawYearBuilt || '',
        r.roofYearBuilt || r.rawRoofYearBuilt || '',
        r.cleaned || '',
        r.statusText || ''
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Roof Year Built");
      XLSX.writeFile(wb, `Roof_Year_Built_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}roof year records (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="RoofYearBuilt"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Roof_Year_Built_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}roof year records (.xls)!`, '📥');
    return;
  } else if (isWall) {
    const headers = ['#', 'Raw Input', '1. WallType', '2. WallSiding', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.original || '',
        r.wallTypeCode || '',
        r.wallSidingCode || '',
        r.statusText || ''
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Wall Details");
      XLSX.writeFile(wb, `Exterior_Wall_Details_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}wall details (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="WallDetails"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Exterior_Wall_Details_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}wall details (.xls)!`, '📥');
  } else {
    const colName = (window.CleanersRegistry && window.CleanersRegistry[AppState.activeColumnId])
      ? window.CleanersRegistry[AppState.activeColumnId].name
      : 'Cleaned_Street';

    if (typeof XLSX !== 'undefined') {
      const sheetData = [[colName], ...dataToExport.map(r => [r.cleaned])];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cleaned Data");
      XLSX.writeFile(wb, `Cleaned_${AppState.activeColumnId}_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}rows (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = dataToExport.map(r =>
      `<Row><Cell><Data ss:Type="String">${escapeXml(r.cleaned)}</Data></Cell></Row>`
    ).join('');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Cleaned"><Table><Row><Cell><Data ss:Type="String">${colName}</Data></Cell></Row>${rowsXml}</Table></Worksheet></Workbook>`;

    triggerDownload(xmlContent, `Cleaned_${AppState.activeColumnId}_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}rows (.xls)!`, '📥');
  }
}

/**
 * Download CSV file (with UTF-8 BOM)
 */
function downloadCsvFile() {
  const dataToExport = getFilteredOutputData();
  if (dataToExport.length === 0) {
    showToast('No matching data to download', '⚠️');
    return;
  }

  const isSplit = AppState.activeColumnId === 'split';
  const isOccupancy = AppState.activeColumnId === 'occupancy';
  const isConstruction = AppState.activeColumnId === 'construction';
  const isRoof = AppState.activeColumnId === 'roof';
  const isWall = AppState.activeColumnId === 'wall';
  const isRoofYear = AppState.activeColumnId === 'roof_year';
  const totalCount = (AppState.lastCleanedData || []).length;
  const isFiltered = dataToExport.length < totalCount;
  let csvLines = [];

  if (isSplit) {
    const headers = ['STREET', 'City', 'State'];
    if (AppState.splitIncludeCounty) headers.push('County');
    headers.push('Postal');
    if (AppState.splitIncludeCountry) headers.push('Country');
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    dataToExport.forEach(r => {
      const row = [r.street, r.city, r.state];
      if (AppState.splitIncludeCounty) row.push(r.county);
      row.push(r.postal);
      if (AppState.splitIncludeCountry) row.push(r.country);
      csvLines.push(row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','));
    });
  } else if (isOccupancy) {
    const col1Title = `${getColumnHeaderName(1)} (AR)`;
    const col2Title = `${getColumnHeaderName(2)} (AS)`;
    const col3Title = `${getColumnHeaderName(3)} (AT)`;
    const headers = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'];
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    dataToExport.forEach(r => {
      const row = [r.existingCode || '', r.bldgDesc || '', r.occDesc || '', r.occCode || '300', r.category || 'Unknown occupancy', r.comparisonMessage || ''];
      csvLines.push(row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','));
    });
  } else if (isConstruction) {
    const col1Title = `${getColumnHeaderName(1)} (AR)`;
    const col2Title = `${getColumnHeaderName(2)} (AS)`;
    const col3Title = `${getColumnHeaderName(3)} (AT)`;
    const headers = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'];
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    dataToExport.forEach(r => {
      const row = [r.existingCode || '', r.bldgDesc || '', r.conDesc || '', r.conCode || '100', r.category || 'Unknown', r.comparisonMessage || ''];
      csvLines.push(row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','));
    });
  } else if (isRoof) {
    const headers = ['Raw Roof Input', '1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck', 'Status'];
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.original || '',
        r.geometryCode || '',
        r.pitchCode || '',
        r.coveringCode || '',
        r.deckCode || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','));
    });
  } else if (isWall) {
    const headers = ['Raw Wall Input', '1. WallType', '2. WallSiding', 'Status'];
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.original || '',
        r.wallTypeCode || '',
        r.wallSidingCode || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','));
    });
  } else if (isRoofYear) {
    const headers = ['Year Built', 'Roof Year Built (Input)', 'Cleaned Roof Year Built', 'Status'];
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.yearBuilt || r.rawYearBuilt || '',
        r.roofYearBuilt || r.rawRoofYearBuilt || '',
        r.cleaned || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','));
    });
  } else {
    const colName = (window.CleanersRegistry && window.CleanersRegistry[AppState.activeColumnId])
      ? window.CleanersRegistry[AppState.activeColumnId].name
      : 'Cleaned_Street';

    csvLines.push(`"${colName}"`);
    dataToExport.forEach(r => {
      const escaped = r.cleaned.replace(/"/g, '""');
      csvLines.push(`"${escaped}"`);
    });
  }

  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const filenamePrefix = isSplit ? 'Separated_Addresses' : isOccupancy ? 'Occupancy_Codes' : isConstruction ? 'Construction_Codes' : isRoofYear ? 'Roof_Year_Built' : isRoof ? 'Roof_Details' : isWall ? 'Exterior_Wall_Details' : 'Cleaned_' + AppState.activeColumnId;
  triggerDownload(csvContent, `${filenamePrefix}_${getTimestamp()}.csv`, 'text/csv;charset=utf-8');
  showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}rows (.csv)!`, '📄');
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadSample(columnId) {
  if (columnId === 'roof_year') {
    const sample = SampleDatasets.roof_year;
    distribute2ColumnText(sample);
    showToast('Loaded 14 Roof Year Built underwriting sample records!', '🏚️');
    return;
  }
  if (columnId === 'occupancy') {
    const sample = SampleDatasets.occupancy;
    distribute3ColumnText(sample);
    showToast('Loaded 19 occupancy sample records from Excel!', '✨');
    return;
  }
  if (columnId === 'construction') {
    const sample = SampleDatasets.construction;
    distribute3ColumnText(sample);
    showToast('Loaded 14 construction sample records from Excel!', '✨');
    return;
  }
  if (columnId === 'year') {
    const sample = SampleDatasets.year;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 16 Year Built sample records (valid & out-of-range)!', '📅');
    return;
  }
  if (columnId === 'roof') {
    const sample = SampleDatasets.roof;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 18 Roof Description sample records!', '🏠');
    return;
  }
  if (columnId === 'wall') {
    const sample = SampleDatasets.wall;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 20 Exterior Wall Finish sample records!', '🧱');
    return;
  }
  const sample = SampleDatasets[columnId] || SampleDatasets.street;
  rawInputEl.value = sample;
  updateLineNumbers();
  processCleaning();
}

function showToast(message, icon = '✓') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.remove) {
        toast.remove();
      } else if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3200);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Execute Gemini 2.5 Flash AI Processing
 */
async function triggerGeminiAI() {
  const rawText = rawInputEl ? rawInputEl.value : '';
  if (!rawText.trim()) {
    showToast('Please paste or type addresses first', '⚠️');
    return;
  }

  if (!window.GeminiService) {
    showToast('Gemini service not initialized', '❌');
    return;
  }

  const lines = rawText.split(/\r\n|\r|\n/).filter(l => l.trim().length > 0);
  const isSplit = AppState.activeColumnId === 'split';
  const isOccupancy = AppState.activeColumnId === 'occupancy';
  const isConstruction = AppState.activeColumnId === 'construction';
  const isRoof = AppState.activeColumnId === 'roof';
  const isWall = AppState.activeColumnId === 'wall';
  const isYear = AppState.activeColumnId === 'year';

  if (aiLoadingOverlayEl) {
    if (aiLoadingTitleEl) {
      if (isSplit) {
        aiLoadingTitleEl.textContent = '✨ Gemini 2.5 is parsing addresses worldwide...';
      } else if (isOccupancy) {
        aiLoadingTitleEl.textContent = '✨ Gemini 2.5 is analyzing occupancy descriptions...';
      } else if (isConstruction) {
        aiLoadingTitleEl.textContent = '✨ Gemini 2.5 is analyzing construction descriptions...';
      } else if (isRoof) {
        aiLoadingTitleEl.textContent = '✨ Gemini 2.5 is analyzing roof descriptions...';
      } else if (isWall) {
        aiLoadingTitleEl.textContent = '✨ Gemini 2.5 is analyzing exterior wall materials...';
      } else if (isYear) {
        aiLoadingTitleEl.textContent = '✨ Gemini 2.5 is validating Year Built records...';
      } else {
        aiLoadingTitleEl.textContent = '✨ Gemini 2.5 is cleaning street addresses...';
      }
    }
    if (aiLoadingSubtitleEl) {
      if (isSplit) {
        aiLoadingSubtitleEl.textContent = 'Applying knowledge of UK postcodes, German PLZ, Canadian provinces & US Counties';
      } else if (isOccupancy) {
        aiLoadingSubtitleEl.textContent = 'Matching UNICEDE® Touchstone codes across commercial & residential categories';
      } else if (isConstruction) {
        aiLoadingSubtitleEl.textContent = 'Matching UNICEDE® Touchstone codes across 224 structural construction categories';
      } else if (isRoof) {
        aiLoadingSubtitleEl.textContent = 'Classifying Geometry, Pitch, Covering & Deck with Touchstone UNICEDE® underwriting rules';
      } else if (isWall) {
        aiLoadingSubtitleEl.textContent = 'Separating WallType & WallSiding with Touchstone UNICEDE® underwriting rules';
      } else if (isYear) {
        aiLoadingSubtitleEl.textContent = 'Enforcing 1753–2026 range & selecting lesser/older construction year for multi-year entries';
      } else {
        aiLoadingSubtitleEl.textContent = 'Applying strict cleaning rules & building prefix resolution';
      }
    }
    aiLoadingOverlayEl.style.display = 'flex';
  }

  try {
    let results = [];
    if (isSplit) {
      results = await window.GeminiService.parseAddressesWithAI(lines, {
        casing: AppState.splitCasing,
        countryFormat: AppState.splitCountryFormat,
        defaultCountry: AppState.splitIncludeCountry ? AppState.splitDefaultCountry : 'US'
      });
    } else if (isOccupancy) {
      let inputPayload;
      const codeVal = occInputCodeEl ? occInputCodeEl.value : '';
      const bldgVal = occInputBldgEl ? occInputBldgEl.value : '';
      const occVal = occInputOccEl ? occInputOccEl.value : '';

      if (codeVal.trim() || bldgVal.trim() || occVal.trim()) {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          occDescs: occVal.split(/\r\n|\r|\n/)
        };
      } else {
        inputPayload = lines;
      }
      results = await window.GeminiService.classifyOccupancyWithAI(inputPayload);
    } else if (isConstruction) {
      let inputPayload;
      const codeVal = occInputCodeEl ? occInputCodeEl.value : '';
      const bldgVal = occInputBldgEl ? occInputBldgEl.value : '';
      const conVal = occInputOccEl ? occInputOccEl.value : '';

      if (codeVal.trim() || bldgVal.trim() || conVal.trim()) {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          conDescs: conVal.split(/\r\n|\r|\n/)
        };
      } else {
        inputPayload = lines;
      }
      results = await window.GeminiService.classifyConstructionWithAI(inputPayload);
    } else if (isRoof) {
      results = await window.GeminiService.classifyRoofWithAI(lines, {
        format: AppState.roofFormat || 'code_only'
      });
    } else if (isWall) {
      results = await window.GeminiService.cleanWallsWithAI(lines, {
        format: AppState.wallFormat || 'code_only'
      });
    } else if (isYear) {
      results = await window.GeminiService.parseYearWithAI(lines, {
        minYear: AppState.yearMin || 1753,
        maxYear: AppState.yearMax || new Date().getFullYear(),
        removeEmptyLines: AppState.yearRemoveEmpty
      });
    } else {
      results = await window.GeminiService.cleanStreetsWithAI(lines, {
        casing: AppState.casing
      });
    }

    AppState.lastCleanedData = results;
    updateCodeFilterDropdown(results);
    refreshOutputView();

    showToast(`✨ Successfully processed ${results.length} rows with Gemini 2.5 Flash!`, '🤖');
  } catch (err) {
    console.error('Gemini error:', err);
    showToast(`Gemini error: ${err.message}`, '❌');
  } finally {
    if (aiLoadingOverlayEl) {
      aiLoadingOverlayEl.style.display = 'none';
    }
  }
}

/**
 * ==========================================================================
 * Universal Touchstone UNICEDE® Code & Description Finder Controller
 * ==========================================================================
 */
function initCodeFinderUI() {
  const SECTIONS = ['occupancy', 'construction', 'roof', 'wall'];

  // 1. Setup in-ribbon finder for each classification section
  SECTIONS.forEach(sec => {
    const inputEl = document.getElementById(`${sec}-finder-input`);
    const clearBtn = document.getElementById(`${sec}-finder-clear`);
    const resultsDrawer = document.getElementById(`${sec}-finder-results`);
    const quickTags = document.querySelectorAll(`.finder-quick-tag[data-target="${sec}"]`);

    if (!inputEl || !resultsDrawer) return;

    let debounceTimer = null;
    inputEl.addEventListener('input', () => {
      const q = inputEl.value.trim();
      if (clearBtn) clearBtn.style.display = q ? 'inline-block' : 'none';
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderSectionFinderResults(sec, q, resultsDrawer);
      }, 70);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        inputEl.value = '';
        clearBtn.style.display = 'none';
        resultsDrawer.style.display = 'none';
        resultsDrawer.innerHTML = '';
        inputEl.focus();
      });
    }

    quickTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const query = tag.getAttribute('data-query') || '';
        inputEl.value = query;
        if (clearBtn) clearBtn.style.display = 'inline-block';
        renderSectionFinderResults(sec, query, resultsDrawer);
        resultsDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  });

  // 2. Setup Universal Code Explorer Modal
  const explorerModal = document.getElementById('code-explorer-modal');
  const btnOpenHeader = document.getElementById('btn-open-code-finder');
  const btnOpenInput = document.getElementById('btn-input-code-finder');
  const btnCloseExplorer = document.getElementById('btn-close-code-explorer');
  const btnCloseExplorerFooter = document.getElementById('btn-close-code-explorer-footer');
  const explorerSearchInput = document.getElementById('explorer-search-input');
  const explorerClearBtn = document.getElementById('explorer-clear-btn');
  const explorerTabs = document.querySelectorAll('.explorer-tab');

  let currentExplorerTab = 'occupancy';
  let currentExplorerCategoryFilter = 'all';

  function openExplorer(targetTab = null) {
    if (!explorerModal) return;
    const activeSec = AppState.activeColumnId;
    if (targetTab && SECTIONS.includes(targetTab)) {
      currentExplorerTab = targetTab;
    } else if (SECTIONS.includes(activeSec)) {
      currentExplorerTab = activeSec;
    } else {
      currentExplorerTab = 'occupancy';
    }

    currentExplorerCategoryFilter = 'all';
    if (explorerSearchInput) explorerSearchInput.value = '';
    if (explorerClearBtn) explorerClearBtn.style.display = 'none';

    updateExplorerTabsUI();
    renderExplorerFilterPills();
    renderExplorerCallout();
    renderExplorerCards();

    explorerModal.style.display = 'flex';
    if (explorerSearchInput) {
      setTimeout(() => explorerSearchInput.focus(), 80);
    }
  }

  function closeExplorer() {
    if (explorerModal) explorerModal.style.display = 'none';
  }

  if (btnOpenHeader) btnOpenHeader.addEventListener('click', () => openExplorer());
  if (btnOpenInput) btnOpenInput.addEventListener('click', () => openExplorer());
  if (btnCloseExplorer) btnCloseExplorer.addEventListener('click', closeExplorer);
  if (btnCloseExplorerFooter) btnCloseExplorerFooter.addEventListener('click', closeExplorer);

  document.querySelectorAll('.btn-open-universal-finder').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tab = btn.getAttribute('data-tab');
      openExplorer(tab);
    });
  });

  if (explorerModal) {
    explorerModal.addEventListener('click', (e) => {
      if (e.target === explorerModal) closeExplorer();
    });
  }

  explorerTabs.forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      currentExplorerTab = tabBtn.getAttribute('data-tab') || 'occupancy';
      currentExplorerCategoryFilter = 'all';
      if (explorerSearchInput) explorerSearchInput.value = '';
      if (explorerClearBtn) explorerClearBtn.style.display = 'none';
      updateExplorerTabsUI();
      renderExplorerFilterPills();
      renderExplorerCallout();
      renderExplorerCards();
    });
  });

  if (explorerSearchInput) {
    let expDebounce = null;
    explorerSearchInput.addEventListener('input', () => {
      const q = explorerSearchInput.value.trim();
      if (explorerClearBtn) explorerClearBtn.style.display = q ? 'inline-block' : 'none';
      clearTimeout(expDebounce);
      expDebounce = setTimeout(() => {
        renderExplorerCards();
      }, 70);
    });
  }

  if (explorerClearBtn) {
    explorerClearBtn.addEventListener('click', () => {
      explorerSearchInput.value = '';
      explorerClearBtn.style.display = 'none';
      renderExplorerCards();
      explorerSearchInput.focus();
    });
  }

  // 3. Setup Single Code Detail Modal
  const detailModal = document.getElementById('code-detail-modal');
  const btnCloseDetail = document.getElementById('btn-close-code-detail');
  const btnDetailCopy = document.getElementById('btn-modal-detail-copy');
  const btnDetailInsert = document.getElementById('btn-modal-detail-insert');
  let currentDetailItem = null;

  function openDetailModal(item) {
    if (!detailModal || !item) return;
    currentDetailItem = item;

    const codeBadge = document.getElementById('modal-detail-code');
    const titleEl = document.getElementById('modal-detail-title');
    const groupEl = document.getElementById('modal-detail-group');
    const bodyEl = document.getElementById('modal-detail-body');

    if (codeBadge) codeBadge.textContent = item.code;
    if (titleEl) titleEl.textContent = item.category || item.name;
    if (groupEl) groupEl.textContent = item.group || item.subSection || 'Touchstone UNICEDE';

    if (bodyEl) {
      bodyEl.innerHTML = buildDetailModalBody(item);
    }

    detailModal.style.display = 'flex';
  }

  function closeDetailModal() {
    if (detailModal) detailModal.style.display = 'none';
  }

  if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeDetailModal);
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal();
    });
  }

  if (btnDetailCopy) {
    btnDetailCopy.addEventListener('click', () => {
      if (currentDetailItem) {
        copyCodeToClipboard(currentDetailItem.code);
      }
    });
  }

  if (btnDetailInsert) {
    btnDetailInsert.addEventListener('click', () => {
      if (currentDetailItem) {
        insertItemIntoEditor(currentDetailItem);
        closeDetailModal();
      }
    });
  }

  // Global helper for opening badge details from React comparison table
  window.openCodeDetailByBadge = function(code, section) {
    if (!window.CodeFinder || !code) return;
    const found = window.CodeFinder.getByCode(code, section);
    if (found) {
      openDetailModal(found);
    } else {
      showToast(`Touchstone UNICEDE® Code: ${code}`, 'ℹ️');
    }
  };

  // 4. Setup Live Code Match Inspector below editors
  const inspectorEl = document.getElementById('live-code-inspector');
  const btnInspectorDetails = document.getElementById('btn-inspector-view-details');
  const btnInspectorCopy = document.getElementById('btn-inspector-copy-code');
  let currentInspectedItem = null;

  if (btnInspectorDetails) {
    btnInspectorDetails.addEventListener('click', () => {
      if (currentInspectedItem) openDetailModal(currentInspectedItem);
    });
  }

  if (btnInspectorCopy) {
    btnInspectorCopy.addEventListener('click', () => {
      if (currentInspectedItem) copyCodeToClipboard(currentInspectedItem.code);
    });
  }

  // Bind live inspector triggers to all inputs
  const inputsToMonitor = [
    rawInputEl,
    occInputCodeEl,
    occInputBldgEl,
    occInputOccEl,
    roofYearInputYbEl,
    roofYearInputRyEl
  ].filter(Boolean);

  inputsToMonitor.forEach(input => {
    ['input', 'keyup', 'click', 'focus'].forEach(evt => {
      input.addEventListener(evt, () => {
        updateLiveInspector(input);
      });
    });
  });

  function updateLiveInspector(input) {
    if (!inspectorEl) return;
    const activeSec = AppState.activeColumnId;
    if (!SECTIONS.includes(activeSec)) {
      inspectorEl.style.display = 'none';
      currentInspectedItem = null;
      return;
    }

    let lineText = '';
    if (activeSec === 'occupancy' || activeSec === 'construction') {
      const codeVal = (occInputCodeEl && occInputCodeEl.value) || '';
      const bldgVal = (occInputBldgEl && occInputBldgEl.value) || '';
      const occVal = (occInputOccEl && occInputOccEl.value) || '';

      const activeEl = document.activeElement;
      let lineIdx = 0;
      if (activeEl === occInputCodeEl || activeEl === occInputBldgEl || activeEl === occInputOccEl) {
        const selStart = activeEl.selectionStart || 0;
        lineIdx = activeEl.value.substring(0, selStart).split('\n').length - 1;
      }
      const codeLines = codeVal.split('\n');
      const bldgLines = bldgVal.split('\n');
      const occLines = occVal.split('\n');
      const curCode = (codeLines[lineIdx] || '').trim();
      const curBldg = (bldgLines[lineIdx] || '').trim();
      const curOcc = (occLines[lineIdx] || '').trim();
      lineText = `${curCode} ${curBldg} ${curOcc}`.trim();
    } else {
      const val = (rawInputEl && rawInputEl.value) || '';
      const selStart = (rawInputEl && rawInputEl.selectionStart) || 0;
      const lineIdx = val.substring(0, selStart).split('\n').length - 1;
      const lines = val.split('\n');
      lineText = (lines[lineIdx] || '').trim();
    }

    if (!lineText) {
      inspectorEl.style.display = 'none';
      currentInspectedItem = null;
      return;
    }

    const matched = window.CodeFinder ? window.CodeFinder.detect(lineText, activeSec) : null;
    if (matched) {
      currentInspectedItem = matched;
      const codeBadge = document.getElementById('inspector-code-badge');
      const titleEl = document.getElementById('inspector-title');
      const groupEl = document.getElementById('inspector-group');
      const descEl = document.getElementById('inspector-desc');

      if (codeBadge) codeBadge.textContent = matched.code;
      if (titleEl) titleEl.textContent = matched.category || matched.name;
      if (groupEl) groupEl.textContent = matched.group || matched.subSection || '';
      if (descEl) descEl.textContent = matched.description ? matched.description.substring(0, 110) + '...' : '';

      inspectorEl.style.display = 'flex';
    } else {
      inspectorEl.style.display = 'none';
      currentInspectedItem = null;
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeExplorer();
      closeDetailModal();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openExplorer();
    }
  });

  // Helpers for rendering
  function updateExplorerTabsUI() {
    explorerTabs.forEach(t => {
      if (t.getAttribute('data-tab') === currentExplorerTab) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
  }

  function renderExplorerFilterPills() {
    const pillsContainer = document.getElementById('explorer-filter-pills');
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';

    let categories = ['all'];
    if (currentExplorerTab === 'occupancy') {
      categories = ['all', 'residential', 'commercial', 'industrial', 'healthcare', 'restaurant', 'public', 'education', 'transportation', 'utilities', 'solar'];
    } else if (currentExplorerTab === 'construction') {
      categories = ['all', 'wood', 'masonry', 'concrete', 'steel', 'japan composite', 'special', 'mobile home', 'bridge', 'tank', 'solar'];
    } else if (currentExplorerTab === 'roof') {
      categories = ['all', 'roof covering', 'roof deck', 'roof geometry', 'roof pitch'];
    } else if (currentExplorerTab === 'wall') {
      categories = ['all', 'wall siding (exterior weather envelope)', 'wall type (structural wall backing)'];
    }

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `explorer-filter-pill ${currentExplorerCategoryFilter === cat ? 'active' : ''}`;
      btn.textContent = cat === 'all' ? '✨ All Categories' : capitalizeWords(cat);
      btn.addEventListener('click', () => {
        currentExplorerCategoryFilter = cat;
        document.querySelectorAll('.explorer-filter-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        renderExplorerCards();
      });
      pillsContainer.appendChild(btn);
    });
  }

  function renderExplorerCallout() {
    const callout = document.getElementById('explorer-rule-callout');
    if (!callout) return;

    if (currentExplorerTab === 'construction') {
      callout.style.display = 'block';
      callout.innerHTML = `
        <strong>⭐ Mandatory Underwriting Memory Rules:</strong><br>
        &bull; <strong>STONE</strong> in descriptions ALWAYS maps to Touchstone Code <strong>113</strong> (<em>Rubble Stone Masonry</em>).<br>
        &bull; <strong>BRICK</strong> in descriptions ALWAYS maps to Touchstone Code <strong>111</strong> (<em>Masonry</em>).
      `;
    } else if (currentExplorerTab === 'roof') {
      callout.style.display = 'block';
      callout.innerHTML = `
        <strong>🛡️ Roof Underwriting Multi-Component Rules:</strong><br>
        &bull; <strong>Rule 1 (With %):</strong> Higher % wins (e.g. <code>Single-Ply 50%, Shingle 47%</code> ➔ Single-Ply <code>7</code>).<br>
        &bull; <strong>Rule 2 (No % / Tie):</strong> Weaker material wins (most vulnerable to wind/damage).
      `;
    } else if (currentExplorerTab === 'wall') {
      callout.style.display = 'block';
      callout.innerHTML = `
        <strong>🛡️ Exterior Wall Multi-Component Rules:</strong><br>
        &bull; <strong>Rule 1 (With %):</strong> Higher % wins (e.g. <code>70% Brick Veneer, 30% Vinyl</code> ➔ Brick <code>1</code>).<br>
        &bull; <strong>Rule 2 (No % / Tie):</strong> Weaker material wins (e.g. <code>Brick Veneer & Vinyl Siding</code> ➔ Vinyl Siding <code>4</code>).
      `;
    } else {
      callout.style.display = 'none';
      callout.innerHTML = '';
    }
  }

  function renderExplorerCards() {
    const grid = document.getElementById('explorer-grid-container');
    const stats = document.getElementById('explorer-stats');
    if (!grid) return;
    grid.innerHTML = '';

    const q = (explorerSearchInput && explorerSearchInput.value.trim()) || '';
    let items = window.CodeFinder ? window.CodeFinder.search(q, currentExplorerTab, { limit: 120 }) : [];

    // Apply category filter
    if (currentExplorerCategoryFilter !== 'all') {
      const filterLower = currentExplorerCategoryFilter.toLowerCase();
      items = items.filter(i => {
        const g = (i.group || '').toLowerCase();
        const sub = (i.subSection || '').toLowerCase();
        return g.includes(filterLower) || sub.includes(filterLower);
      });
    }

    if (stats) stats.textContent = `Showing ${items.length} classifications`;

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--text-muted);">
          🔍 No classification codes match "<strong>${escapeHtml(q)}</strong>". Try another keyword or code.
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = createFinderResultCard(item, currentExplorerTab, q, {
        onCopy: () => copyCodeToClipboard(item.code),
        onInsert: () => {
          insertItemIntoEditor(item);
          closeExplorer();
        },
        onDetails: () => openDetailModal(item)
      });
      grid.appendChild(card);
    });
  }

  function renderSectionFinderResults(sec, query, container) {
    container.innerHTML = '';
    if (!query) {
      container.style.display = 'none';
      return;
    }

    const items = window.CodeFinder ? window.CodeFinder.search(query, sec, { limit: 20 }) : [];
    if (items.length === 0) {
      container.style.display = 'block';
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 18px; text-align: center; color: var(--text-muted); font-size: 12px;">
          🔍 No ${sec} classification found matching "<strong>${escapeHtml(query)}</strong>".
        </div>
      `;
      return;
    }

    container.style.display = 'grid';
    items.forEach(item => {
      const card = createFinderResultCard(item, sec, query, {
        onCopy: () => copyCodeToClipboard(item.code),
        onInsert: () => insertItemIntoEditor(item),
        onDetails: () => openDetailModal(item)
      });
      container.appendChild(card);
    });
  }

  function createFinderResultCard(item, sec, query, handlers = {}) {
    const card = document.createElement('div');
    card.className = `finder-result-card card-${sec}`;

    const title = item.category || item.name || `Code ${item.code}`;
    const group = item.group || item.subSection || '';
    const desc = item.description || '';
    const highlightedTitle = highlightMatch(title, query);
    const highlightedDesc = highlightMatch(desc, query);

    let ruleAlertHtml = '';
    if (item.rules && item.rules.length > 0) {
      ruleAlertHtml = `<div class="finder-card-rule-alert">${item.rules[0]}</div>`;
    }

    let keywordsHtml = '';
    if (item.keywords && item.keywords.length > 0) {
      keywordsHtml = `
        <div class="finder-card-keywords">
          ${item.keywords.slice(0, 4).map(k => `<span class="finder-keyword-chip">${escapeHtml(k)}</span>`).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="finder-card-header">
        <span class="finder-code-badge">${escapeHtml(item.code)}</span>
        <span class="finder-group-tag">${escapeHtml(group)}</span>
      </div>
      <div class="finder-card-title">${highlightedTitle}</div>
      ${ruleAlertHtml}
      <div class="finder-card-desc">${highlightedDesc}</div>
      ${keywordsHtml}
      <div class="finder-card-actions">
        <button type="button" class="finder-btn-action finder-btn-details">📖 Details</button>
        <button type="button" class="finder-btn-action finder-btn-copy">📋 Copy Code</button>
        <button type="button" class="finder-btn-action finder-btn-insert">➕ Insert</button>
      </div>
    `;

    card.querySelector('.finder-btn-copy').addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onCopy && handlers.onCopy();
    });

    card.querySelector('.finder-btn-insert').addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onInsert && handlers.onInsert();
    });

    card.querySelector('.finder-btn-details').addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onDetails && handlers.onDetails();
    });

    card.addEventListener('click', () => {
      handlers.onDetails && handlers.onDetails();
    });

    return card;
  }

  function highlightMatch(text, query) {
    if (!text) return '';
    if (!query || query.length < 2) return escapeHtml(text);
    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQ})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark class="finder-highlight">$1</mark>');
  }

  function copyCodeToClipboard(code) {
    const codeStr = String(code).trim();
    if (!codeStr) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codeStr).then(() => {
        showToast(`Copied Code ${codeStr} to clipboard!`, '📋');
      }).catch(() => {
        fallbackCopy(codeStr);
      });
    } else {
      fallbackCopy(codeStr);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(`Copied Code ${text} to clipboard!`, '📋');
    } catch (e) {
      showToast(`Code: ${text}`, 'ℹ️');
    }
    document.body.removeChild(ta);
  }

  function insertItemIntoEditor(item) {
    const sec = AppState.activeColumnId;
    const code = String(item.code);
    const name = item.category || item.name || '';

    if (sec === 'occupancy' || sec === 'construction') {
      const activeEl = document.activeElement;
      if (activeEl === occInputCodeEl || activeEl === occInputBldgEl || activeEl === occInputOccEl) {
        insertAtCursor(activeEl, activeEl === occInputCodeEl ? code : name);
      } else {
        const curCode = occInputCodeEl ? occInputCodeEl.value.trim() : '';
        const curOcc = occInputOccEl ? occInputOccEl.value.trim() : '';
        if (occInputCodeEl) occInputCodeEl.value = curCode ? `${curCode}\n${code}` : code;
        if (occInputOccEl) occInputOccEl.value = curOcc ? `${curOcc}\n${name}` : name;
      }
      updateOccLineNumbers();
      processCleaning();
      showToast(`Inserted Code ${code} (${name}) into 3-column input!`, '➕');
    } else if (sec === 'roof' || sec === 'wall') {
      const curRaw = rawInputEl ? rawInputEl.value.trim() : '';
      if (rawInputEl) {
        rawInputEl.value = curRaw ? `${curRaw}\n${name || code}` : (name || code);
      }
      updateLineNumbers();
      processCleaning();
      showToast(`Inserted ${name || code} into input!`, '➕');
    } else {
      showToast(`Code ${code}: ${name}`, 'ℹ️');
    }
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const val = textarea.value;
    textarea.value = val.substring(0, start) + text + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
  }

  function buildDetailModalBody(item) {
    const rows = [
      `<tr><td class="prop-label">Code</td><td class="prop-value"><strong style="color: var(--accent-cyan-light); font-size: 14px; font-family: var(--font-mono);">${escapeHtml(item.code)}</strong></td></tr>`,
      `<tr><td class="prop-label">Official Name</td><td class="prop-value" style="font-weight: 700;">${escapeHtml(item.category || item.name)}</td></tr>`,
      `<tr><td class="prop-label">Group / System</td><td class="prop-value">${escapeHtml(item.group || item.subSection || 'Touchstone UNICEDE')}</td></tr>`,
      `<tr><td class="prop-label">Underwriting Description</td><td class="prop-value">${escapeHtml(item.description || 'Touchstone UNICEDE classification standard.')}</td></tr>`
    ];

    if (item.rules && item.rules.length > 0) {
      rows.push(`
        <tr>
          <td class="prop-label">Underwriting Rules</td>
          <td class="prop-value" style="color: #fbbf24; font-weight: 600;">
            ${item.rules.map(r => `<div>&bull; ${escapeHtml(r)}</div>`).join('')}
          </td>
        </tr>
      `);
    }

    if (item.weaknessScore !== undefined && item.weaknessScore > 0) {
      rows.push(`
        <tr>
          <td class="prop-label">Vulnerability Rank</td>
          <td class="prop-value">
            <span style="color: var(--accent-rose-light); font-weight: 700;">Score ${item.weaknessScore}</span>
            <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(Higher score = weaker material under wind/catastrophe forces)</span>
          </td>
        </tr>
      `);
    }

    if (item.keywords && item.keywords.length > 0) {
      rows.push(`
        <tr>
          <td class="prop-label">Recognized Aliases</td>
          <td class="prop-value">
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${item.keywords.map(k => `<span class="finder-keyword-chip">${escapeHtml(k)}</span>`).join('')}
            </div>
          </td>
        </tr>
      `);
    }

    return `<table class="detail-prop-table"><tbody>${rows.join('')}</tbody></table>`;
  }

  function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }
}

/**
 * ==========================================================================
 * Vengeance UI Navigation, Landing Page & Collapsible Ribbon Controller
 * ==========================================================================
 */
function initVengeanceNavigation() {
  const landingViewEl = document.getElementById('landing-page-view');
  const studioViewEl = document.getElementById('studio-view');
  const navBtnHome = document.getElementById('nav-btn-home');
  const navBtnStudio = document.getElementById('nav-btn-studio');
  const navBtnFinder = document.getElementById('nav-btn-finder');
  const btnLaunchHeader = document.getElementById('btn-launch-header');

  const heroBtnLaunch = document.getElementById('hero-btn-launch');
  const heroBtnFinder = document.getElementById('hero-btn-finder');
  const heroBtnSample = document.getElementById('hero-btn-sample');
  const bentoBtnLaunch = document.getElementById('bento-btn-launch');

  const footerLinkStudio = document.getElementById('footer-link-studio');
  const footerLinkFinder = document.getElementById('footer-link-finder');
  const footerLinkRules = document.getElementById('footer-link-rules');
  const footerLinkAi = document.getElementById('footer-link-ai');

  let currentView = 'home';

  function switchView(viewName) {
    currentView = viewName;
    if (viewName === 'home') {
      if (landingViewEl) landingViewEl.style.display = 'flex';
      if (studioViewEl) studioViewEl.style.display = 'none';
      if (navBtnHome) navBtnHome.classList.add('active');
      if (navBtnStudio) navBtnStudio.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (landingViewEl) landingViewEl.style.display = 'none';
      if (studioViewEl) studioViewEl.style.display = 'flex';
      if (navBtnHome) navBtnHome.classList.remove('active');
      if (navBtnStudio) navBtnStudio.classList.add('active');
      // Re-trigger layout alignment for multi-column inputs and output tables
      updateLineNumbers();
      updateOccLineNumbers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  window.switchAppView = switchView;

  const navBrandClick = document.getElementById('nav-brand-click');
  if (navBrandClick) navBrandClick.addEventListener('click', () => switchView('home'));
  if (navBtnHome) navBtnHome.addEventListener('click', () => switchView('home'));
  if (navBtnStudio) navBtnStudio.addEventListener('click', () => switchView('studio'));
  if (btnLaunchHeader) btnLaunchHeader.addEventListener('click', () => switchView('studio'));
  if (heroBtnLaunch) heroBtnLaunch.addEventListener('click', () => switchView('studio'));
  if (bentoBtnLaunch) bentoBtnLaunch.addEventListener('click', () => switchView('studio'));
  if (footerLinkStudio) footerLinkStudio.addEventListener('click', () => switchView('studio'));

  // Code Finder Modal Triggers
  const openFinder = () => {
    const explorerModal = document.getElementById('code-explorer-modal');
    if (explorerModal) {
      explorerModal.style.display = 'flex';
      const searchInput = document.getElementById('explorer-search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 50);
      }
    }
  };

  if (navBtnFinder) navBtnFinder.addEventListener('click', openFinder);
  if (heroBtnFinder) heroBtnFinder.addEventListener('click', openFinder);
  if (footerLinkFinder) footerLinkFinder.addEventListener('click', openFinder);

  // Live sample demo trigger from hero
  if (heroBtnSample) {
    heroBtnSample.addEventListener('click', () => {
      switchView('studio');
      const loadSampleBtn = document.getElementById('btn-load-sample');
      if (loadSampleBtn) {
        loadSampleBtn.click();
      }
    });
  }

  // Bento cards direct jump to specific engine
  document.querySelectorAll('.bento-card[data-target-section]').forEach(card => {
    card.addEventListener('click', () => {
      const targetSec = card.getAttribute('data-target-section');
      if (targetSec) {
        switchView('studio');
        if (typeof window.switchActiveSection === 'function') {
          window.switchActiveSection(targetSec);
        } else {
          const tabEl = document.querySelector(`.column-tab[data-column="${targetSec}"]`);
          if (tabEl) tabEl.click();
        }
      }
    });
  });

  // Footer rules link
  if (footerLinkRules) {
    footerLinkRules.addEventListener('click', () => {
      switchView('studio');
      // Expand rule ribbon if collapsed
      if (rulesWrapper && isRibbonCollapsed) {
        toggleRuleRibbon();
      }
    });
  }

  if (footerLinkAi) {
    footerLinkAi.addEventListener('click', () => {
      const geminiBtn = document.getElementById('btn-gemini-modal');
      if (geminiBtn) geminiBtn.click();
    });
  }

  // Collapsible Rule Ribbon Toggle
  const toggleBar = document.getElementById('ribbon-collapse-toggle-bar');
  const rulesWrapper = document.getElementById('rules-collapsible-wrapper');
  const toggleArrow = document.getElementById('ribbon-toggle-arrow');
  const toggleLabel = document.getElementById('ribbon-toggle-label');
  let isRibbonCollapsed = false;

  function toggleRuleRibbon() {
    isRibbonCollapsed = !isRibbonCollapsed;
    if (rulesWrapper) {
      rulesWrapper.style.display = isRibbonCollapsed ? 'none' : 'block';
    }
    if (toggleBar) {
      toggleBar.classList.toggle('ribbon-collapsed', isRibbonCollapsed);
    }
    if (toggleArrow) {
      toggleArrow.textContent = isRibbonCollapsed ? '▶' : '▼';
    }
    if (toggleLabel) {
      toggleLabel.textContent = isRibbonCollapsed ? 'Show Section Rules & UNICEDE® Finder' : 'Section Rules & UNICEDE® Finder';
    }
  }

  if (toggleBar) {
    toggleBar.addEventListener('click', () => {
      toggleRuleRibbon();
    });
  }
}



