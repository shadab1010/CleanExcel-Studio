/**
 * CleanExcel - Application UI Controller
 */

// Initial configuration state
const AppState = {
  activeColumnId: 'street',
  // Street cleaner options
  wordsToRemove: JSON.parse(localStorage.getItem('cleanexcel_words_to_remove') || 'null') || ['street', 'builfin', 'building', 'unit', 'st', 'bldg'],
  symbolsToRemove: JSON.parse(localStorage.getItem('cleanexcel_symbols_to_remove') || 'null') || (window.StreetCleaner ? window.StreetCleaner.defaultSymbols.slice() : [',', '.', '/', '<', '>', '?', ';', "'", '\\', ':', '"', '|', '[', ']', '{', '}', '=', '+', '-', '_', '(', ')', '#', '$', '%', '^', '&', '*', '@', '!']),
  preserveNumberHyphen: true,
  extractPrimaryAddress: true,
  stripBldgPrefix: true,
  casing: 'uppercase', // 'uppercase' | 'titlecase' | 'original'
  removeEmptyLines: false,
  // Address Splitter options
  splitCasing: 'titlecase', // 'titlecase' | 'uppercase' | 'original'
  splitIncludeRaw: true,
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
  // Foundation Type options
  foundationTypeFormat: 'code_only',
  foundationTypeRemoveEmpty: false,
  // Foundation Connection options
  foundationFormat: 'code_only',
  foundationRemoveEmpty: false,
  // Custom User Column Counts & Names per multi-column engine
  colCounts: {
    occupancy: 3,
    construction: 3
  },
  colNames: {
    occupancy: {
      col1: '',
      col2: '',
      col3: ''
    },
    construction: {
      col1: '',
      col2: '',
      col3: ''
    }
  },
  // View & Filtering options
  viewMode: 'table', // 'table' | 'text'
  searchQuery: '',
  statusFilter: 'all',
  codeFilter: 'all',
  lastCleanedData: []
};
window.AppState = AppState;

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

  stores: [
    "3.5",          // -> 4 (Round UP / Ceil)
    "4.2",          // -> 5 (Round UP / Ceil)
    "2 & 3",        // -> 3 (Max candidate selected)
    "1,2",          // -> 2 (Max candidate selected)
    "2/3",          // -> 3 (Max candidate selected)
    "non",          // -> blank
    "none",         // -> blank
    "",             // -> blank
    "1",            // -> 1
    "5",            // -> 5
    "2-4 stories",  // -> 4 (Max candidate selected)
    "3 stories",    // -> 3
    "1.25 floors",  // -> 2 (Round UP / Ceil)
    "N/A",          // -> blank
    "-5",           // -> blank (Negative values -> Blank)
    "-2",           // -> blank (Negative values -> Blank)
    "0",            // -> blank
    "2 and 4",      // -> 4
    "3/4/5",        // -> 5
    "4.1",          // -> 5
    "Level 6",      // -> 6
    "two",          // -> 2
    "three stories" // -> 3
  ].join('\n'),

  foundation_type: [
    "Mat / slab foundation",
    "Concrete basement (poured reinforced)",
    "Pile foundation for high-rise tower",
    "Crawlspace cripple wall (wood)",
    "Post & pier timber foundation",
    "Masonry basement (brick walls)",
    "Spread footing continuous concrete",
    "Engineering foundation with micropiles",
    "No basement (slab-on-grade)",
    "Crawlspace - raised (wood)",
    "Masonry wall foundation",
    "Crawlspace masonry (wood)",
    "Code 8 Mat slab",
    "Code 9 Pile",
    "Code 2 Concrete basement",
    "Code 10 No basement",
    "0"
  ].join('\n'),

  foundation: [
    "Mat / slab foundation with anchor bolts",
    "Concrete basement (poured reinforced)",
    "Pile foundation for high-rise tower",
    "Crawlspace cripple wall (wood) with bracing",
    "Post & pier timber foundation",
    "Masonry basement (brick walls)",
    "Spread footing continuous concrete",
    "Engineering foundation with micropiles",
    "No basement (slab-on-grade)",
    "Crawlspace - raised (wood)",
    "8\t1",
    "9\t2",
    "2\t1",
    "10\t0",
    "Masonry wall foundation",
    "Crawlspace masonry (wood)",
    "Pile foundation, seismic straps",
    "Mat / slab, unanchored gravity",
    "Unknown foundation"
  ].join('\n'),

  short_column: [
    "Yes",                                                      // -> 2
    "No short columns",                                         // -> 1
    "Spandrel beams restricting column height",                 // -> 2
    "Infill walls causing short column effect",                 // -> 2
    "Without short columns",                                    // -> 1
    "Short columns present along perimeter",                    // -> 2
    "None",                                                     // -> 1
    "Unknown",                                                  // -> 0
    "Code 2",                                                   // -> 2
    "Code 1",                                                   // -> 1
    "0",                                                        // -> 0
    "Fill height restricted by spandrel beam",                  // -> 2
    "Old concrete structure with shorter perimeter columns",     // -> 2
    "No",                                                       // -> 1
    "2"                                                         // -> 2
  ].join('\n'),

  building_exterior_opening: [
    "Less than 50% of wall open / default",                     // -> 1
    "More than 50% of wall open",                               // -> 2
    ">50% windows and doors",                                   // -> 2
    "< 50% exterior opening",                                   // -> 1
    "Shear wall with many window openings (>50%)",              // -> 2
    "Standard residential windows (<50%)",                      // -> 1
    "Storefront commercial glass facade (> 50%)",               // -> 2
    "Solid masonry exterior with minimal openings (<50%)",      // -> 1
    "Curtain wall extensive glazing (>50% open)",               // -> 2
    "Punched window openings with heavy shear walls (<50%)",    // -> 1
    "Code 2",                                                   // -> 2
    "Code 1",                                                   // -> 1
    "Unknown",                                                  // -> 0
    "75% glass and door openings",                              // -> 2
    "25% window openings",                                      // -> 1
    "0"                                                         // -> 0
  ].join('\n'),

  foundation_connection: [
    "Anchor bolts",
    "Hurricane ties (seismic straps)",
    "Nails / Screws (toe-nailing)",
    "Gravity / Friction (unanchored)",
    "Adhesive / Epoxy chemical anchors",
    "Structurally Connected (monolithic concrete tie)",
    "Unanchored equipment",
    "Anchored equipment",
    "Simpson strong-tie straps",
    "Sill plate anchor bolting",
    "Epoxy dowels glued to foundation",
    "Toe nailed framing clips",
    "Dead load only / resting on foundation",
    "Code 3",
    "4",
    "6"
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
  ].join('\n'),

  soft_story: [
    "Yes",
    "No soft story",
    "First-floor garage with open front",
    "Tuck-under parking on ground level",
    "Without soft story weakness",
    "Soft story at first floor",
    "Open front ground floor",
    "Unknown",
    "Code 2",
    "Code 1",
    "0",
    "Tall first floor with large openings",
    "Adequate lateral stiffness throughout",
    "No",
    "2"
  ].join('\n'),

  building_exterior_opening: [
    "Less than 50% of wall open / default",
    "More than 50% of wall open",
    ">50% windows and doors",
    "< 50% exterior opening",
    "Shear wall with many window openings (>50%)",
    "Standard residential windows (<50%)",
    "Storefront commercial glass facade (> 50%)",
    "Solid masonry exterior with minimal openings (<50%)",
    "Curtain wall extensive glazing (>50% open)",
    "Punched window openings with heavy shear walls (<50%)",
    "Code 2",
    "Code 1",
    "Unknown",
    "75% glass and door openings",
    "25% window openings",
    "0"
  ].join('\n'),

  ornamentation: [
    "No ornamentation",
    "Plain facade without decorative elements",
    "None (1)",
    "Average ornamentation",
    "Standard decorative trim and moderate molding",
    "Average (2)",
    "Extensive ornamentation",
    "Unreinforced parapet walls on roof perimeter",
    "Unbraced parapet wall",
    "Entryway roofs and heavy decorative cornices",
    "Elaborate terra cotta facade ornaments and gargoyles",
    "Extensive (3)",
    "Unknown",
    "Code 0",
    "0",
    "1",
    "2",
    "3"
  ].join('\n'),

  building_shape: [
    "Square footprint",
    "Rectangular warehouse box",
    "Circular rotunda building",
    "L-shaped office wing with re-entrant corner",
    "T-shaped school layout",
    "U-shaped hotel courtyard",
    "H-shaped medical center",
    "Complex cruciform multi-wing geometry",
    "Square (1)",
    "Rectangle (2)",
    "Circular",
    "L-shape",
    "T-shape",
    "U-shape",
    "H-shape",
    "Complex irregular layout",
    "Unknown footprint",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8"
  ].join('\n'),

  building_condition: [
    "Well-maintained, recent renovation and sound cladding",
    "Standard maintenance, typical minor wear, normal aging",
    "Signs of distress with cracking due to aging and ground settlement",
    "Overloaded structure with severe cracking from previous earthquake",
    "Loose roof tiles and chimney damage from previous tropical cyclone",
    "Excellent pristine condition with high grade cladding upkeep",
    "Deteriorated siding with deferred maintenance and severe distress",
    "Average condition with typical normal wear",
    "Good (2)",
    "Poor (3)",
    "Average (1)",
    "Unknown cladding and maintenance condition",
    "Code 1: Average",
    "Code 2: Good",
    "Code 3: Poor",
    "Code 0: Unknown",
    "0",
    "1",
    "2",
    "3"
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
let symbolsChipsContainerEl;
let newSymbolInputEl;
let symbolsCountBadgeEl;
let btnResetSymbolsEl;
let preserveHyphenCheckboxEl;
let extractPrimaryCheckboxEl;
let stripBldgCheckboxEl;
let removeEmptyCheckboxEl;
let splitIncludeRawCheckboxEl;
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
let btnPaste3ColEl;
let btnAddColEl;
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
  symbolsChipsContainerEl = document.getElementById('symbols-chips-container');
  newSymbolInputEl = document.getElementById('new-symbol-input');
  symbolsCountBadgeEl = document.getElementById('symbols-count-badge');
  btnResetSymbolsEl = document.getElementById('btn-reset-symbols');
  preserveHyphenCheckboxEl = document.getElementById('preserve-hyphen-checkbox');
  extractPrimaryCheckboxEl = document.getElementById('extract-primary-checkbox');
  stripBldgCheckboxEl = document.getElementById('strip-bldg-checkbox');
  removeEmptyCheckboxEl = document.getElementById('remove-empty-checkbox');
  splitIncludeRawCheckboxEl = document.getElementById('split-include-raw-checkbox');
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
  btnAddColEl = document.getElementById('btn-add-column');
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
  initModelSelector();

  // Initialize UI
  renderWordTags();
  renderSymbolChips();
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
 * Helper to update Universal AI modal security and provider display
 */
function updateGeminiModalUI() {
  if (!window.GeminiService) return;
  const currentKey = window.GeminiService.getApiKey() || '';
  if (geminiApiKeyInputEl) {
    geminiApiKeyInputEl.value = currentKey;
  }
  const isConfigured = window.GeminiService.isConfigured();
  const hasCustom = window.GeminiService.hasCustomKey();
  const provider = window.GeminiService.getProvider();
  const pInfo = window.GeminiService.getProviderInfo(provider);

  const statusPill = document.querySelector('.api-status-pill');
  const statusDot = statusPill ? statusPill.querySelector('.status-dot-pulse') : null;
  const navPill = document.getElementById('btn-gemini-modal');
  const navText = navPill ? navPill.querySelector('.ai-pill-text') : null;

  if (navPill) {
    if (isConfigured) {
      navPill.title = `Universal AI Engine: ${pInfo.name} (${window.GeminiService.getModel()}) Active & Saved in Browser`;
      if (navText) navText.textContent = `${pInfo.name}`;
      const iconEl = navPill.querySelector('.ai-sparkle');
      if (iconEl) iconEl.textContent = pInfo.icon || '✨';
      const dot = navPill.querySelector('.ai-badge-dot');
      if (dot) {
        dot.style.background = '#10b981';
        dot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.6)';
      }
    } else {
      navPill.title = 'Universal AI Engine: No Key Configured (Click to set API Key)';
      if (navText) navText.textContent = 'AI Settings';
      const iconEl = navPill.querySelector('.ai-sparkle');
      if (iconEl) iconEl.textContent = '🌐';
      const dot = navPill.querySelector('.ai-badge-dot');
      if (dot) {
        dot.style.background = '#f59e0b';
        dot.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.6)';
      }
    }
  }

  if (geminiKeyStatusTextEl) {
    if (hasCustom || isConfigured) {
      geminiKeyStatusTextEl.textContent = `🔒 ${pInfo.name} Active (Saved in Browser)`;
      if (statusPill) statusPill.className = 'api-status-pill';
      if (statusDot) statusDot.className = 'status-dot-pulse';
    } else {
      geminiKeyStatusTextEl.textContent = '⚠️ No AI Key Configured';
      if (statusPill) statusPill.className = 'api-status-pill unconfigured';
      if (statusDot) statusDot.className = 'status-dot-pulse warning';
    }
  }

  if (geminiKeyMaskedPreviewEl) {
    geminiKeyMaskedPreviewEl.textContent = window.GeminiService.getMaskedKeyDisplay();
  }

  if (geminiApiKeyInputEl) {
    geminiApiKeyInputEl.placeholder = isConfigured
      ? `Enter new key to switch (active: ${pInfo.name} • ${window.GeminiService.getModel()})...`
      : 'Paste any AI key (Gemini AIza/AQ, OpenAI sk-..., Claude sk-ant-..., Groq gsk_..., DeepSeek)...';
  }

  if (btnClearCustomKeyEl) {
    btnClearCustomKeyEl.style.display = hasCustom ? 'inline-flex' : 'none';
  }

  // Re-populate and sync model selector
  initModelSelector();

  const modelInfo = window.GeminiService.getModelInfo();
  if (modelInfo) {
    const labelEl = document.getElementById('gemini-model-label');
    const badgeEl = document.getElementById('gemini-model-badge');
    const descEl  = document.getElementById('gemini-model-desc');
    if (labelEl) labelEl.textContent = modelInfo.label;
    if (badgeEl) badgeEl.textContent = modelInfo.badge;
    if (descEl)  descEl.textContent  = modelInfo.desc;
    // Update selected state in open dropdown
    document.querySelectorAll('.model-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.modelId === modelInfo.id);
    });
  }

  // ── Active Configuration Card ────────────────────────────
  const configCard = document.getElementById('active-config-card');
  if (configCard) {
    if (isConfigured && modelInfo) {
      const provEl    = document.getElementById('active-config-provider-name');
      const nameEl    = document.getElementById('active-config-model-name');
      const descEl2   = document.getElementById('active-config-model-desc');
      const keyDispEl = document.getElementById('active-config-key-display');
      if (provEl)    provEl.textContent    = `${pInfo.icon} ${pInfo.name}`;
      if (nameEl)    nameEl.textContent    = `${modelInfo.label}  ${modelInfo.badge}`;
      if (descEl2)   descEl2.textContent   = modelInfo.desc;
      if (keyDispEl) keyDispEl.textContent = window.GeminiService.getMaskedKeyDisplay();
      configCard.style.display = 'block';
    } else {
      configCard.style.display = 'none';
    }
  }

  if (navPill) {
    const shortName = modelInfo ? modelInfo.label.replace(/^(Gemini|Claude|GPT-|Llama\s*)/i, '').trim() : 'AI Active';
    if (isConfigured) {
      navPill.className = 'veng-ai-pill active-key';
      navPill.title = `${pInfo.name} (${modelInfo ? modelInfo.label : ''}) Active. Click to manage.`;
      if (navText) navText.textContent = `${pInfo.icon} ${shortName}`;
    } else {
      navPill.className = 'veng-ai-pill needs-key';
      navPill.title = 'AI API key required. Click to connect any AI key.';
      if (navText) navText.textContent = 'Setup AI Engine';
    }
  }

  // ── Dynamic Run AI Action Button Labels across UI ───────
  const runAiBtn = document.getElementById('btn-ai-process');
  const runAiLabel = document.getElementById('btn-ai-process-label');
  const runAiSparkle = runAiBtn ? runAiBtn.querySelector('.ai-sparkle') : null;
  if (runAiBtn) {
    const provDisplay = isConfigured ? (pInfo.name || 'AI') : 'Universal AI';
    if (runAiLabel) runAiLabel.textContent = `Run ${provDisplay}`;
    if (runAiSparkle) runAiSparkle.textContent = pInfo.icon || '✨';
    runAiBtn.title = isConfigured
      ? `Process current data with ${pInfo.name} (${modelInfo ? modelInfo.label : ''})`
      : 'Process current data with Universal AI (Enter API key)';
  }

  // Section-specific AI action buttons
  const splitAiBtn = document.getElementById('btn-split-ai');
  if (splitAiBtn) {
    const s = splitAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Universal Split (${pInfo.name})` : 'AI Universal Split';
  }
  const occAiBtn = document.getElementById('btn-occupancy-ai');
  if (occAiBtn) {
    const s = occAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Classify Occupancy (${pInfo.name})` : 'AI Classify Occupancy';
  }
  const conAiBtn = document.getElementById('btn-construction-ai');
  if (conAiBtn) {
    const s = conAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Classify Construction (${pInfo.name})` : 'AI Classify Construction';
  }
  const yearAiBtn = document.getElementById('btn-year-ai');
  if (yearAiBtn) {
    const s = yearAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Parse Year (${pInfo.name})` : 'AI Parse Year';
  }
  const roofAiBtn = document.getElementById('btn-roof-ai');
  if (roofAiBtn) {
    const s = roofAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Classify Roof (${pInfo.name})` : 'AI Classify Roof';
  }
  const wallAiBtn = document.getElementById('btn-wall-ai');
  if (wallAiBtn) {
    const s = wallAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Clean Walls (${pInfo.name})` : 'AI Clean Walls';
  }
  const roofYearAiBtn = document.getElementById('btn-roof-year-ai');
  if (roofYearAiBtn) {
    const s = roofYearAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Validate Roof Year (${pInfo.name})` : 'AI Validate Roof Year';
  }
  const storesAiBtn = document.getElementById('btn-stores-ai');
  if (storesAiBtn) {
    const s = storesAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Normalize Stories (${pInfo.name})` : 'AI Normalize Stories';
  }
  const foundationTypeAiBtn = document.getElementById('btn-foundation-type-ai');
  if (foundationTypeAiBtn) {
    const s = foundationTypeAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Classify Foundation Type (${pInfo.name})` : 'AI Classify Foundation Type';
  }
  const foundationAiBtn = document.getElementById('btn-foundation-ai');
  if (foundationAiBtn) {
    const s = foundationAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Classify Foundation (${pInfo.name})` : 'AI Classify Foundation';
  }
  const shortColAiBtn = document.getElementById('btn-short-column-ai');
  if (shortColAiBtn) {
    const s = shortColAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Short Column (${pInfo.name})` : 'AI Short Column';
  }
  const softStoryAiBtn = document.getElementById('btn-soft-story-ai');
  if (softStoryAiBtn) {
    const s = softStoryAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Soft Story (${pInfo.name})` : 'AI Soft Story';
  }
  const ornamentationAiBtn = document.getElementById('btn-ornamentation-ai');
  if (ornamentationAiBtn) {
    const s = ornamentationAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Ornamentation (${pInfo.name})` : 'AI Ornamentation';
  }
  const buildingShapeAiBtn = document.getElementById('btn-building-shape-ai');
  if (buildingShapeAiBtn) {
    const s = buildingShapeAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Building Shape (${pInfo.name})` : 'AI Building Shape';
  }
  const buildingConditionAiBtn = document.getElementById('btn-building-condition-ai');
  if (buildingConditionAiBtn) {
    const s = buildingConditionAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Building Condition (${pInfo.name})` : 'AI Building Condition';
  }
  const streetAiBtn = document.getElementById('btn-street-ai');
  if (streetAiBtn) {
    const s = streetAiBtn.querySelector('span:not(.ai-sparkle)');
    if (s) s.textContent = isConfigured ? `AI Extract Streets (${pInfo.name})` : 'AI Extract Streets';
  }
}

/**
 * Initialize the model selector dropdown behaviour
 */
function initModelSelector() {
  if (!window.GeminiService || !window.GeminiService.AVAILABLE_MODELS) return;

  const trigger  = document.getElementById('gemini-model-trigger');
  const dropdown = document.getElementById('gemini-model-dropdown');
  if (!trigger || !dropdown) return;

  // Populate dropdown options
  dropdown.innerHTML = '';
  window.GeminiService.AVAILABLE_MODELS.forEach(model => {
    const opt = document.createElement('div');
    opt.className = 'model-option' + (model.id === window.GeminiService.getModel() ? ' selected' : '');
    opt.dataset.modelId = model.id;
    opt.setAttribute('role', 'option');
    opt.setAttribute('aria-selected', model.id === window.GeminiService.getModel() ? 'true' : 'false');
    opt.innerHTML = `
      <span class="model-opt-dot"></span>
      <span class="model-opt-info">
        <span class="model-opt-name">${model.label}</span>
        <span class="model-opt-desc">${model.desc}</span>
      </span>
      <span class="model-opt-badge">${model.badge}</span>`;
    opt.addEventListener('click', () => {
      window.GeminiService.setModel(model.id);
      // Update aria-selected on all options
      dropdown.querySelectorAll('.model-option').forEach(o => {
        o.setAttribute('aria-selected', o.dataset.modelId === model.id ? 'true' : 'false');
      });
      closeModelDropdown();
      updateGeminiModalUI();
    });
    dropdown.appendChild(opt);
  });

  function openModelDropdown() {
    dropdown.style.display = 'block';
    trigger.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }
  function closeModelDropdown() {
    dropdown.style.display = 'none';
    trigger.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.style.display === 'none') openModelDropdown();
    else closeModelDropdown();
  });
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
    if (e.key === 'Escape') closeModelDropdown();
  });
  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) closeModelDropdown();
  });
}

/**
 * Get active section's column names
 */
function getActiveSectionColNames() {
  const section = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
  if (!AppState.colNames) AppState.colNames = {};
  if (!AppState.colNames[section]) {
    AppState.colNames[section] = { col1: '', col2: '', col3: '' };
  }
  return AppState.colNames[section];
}

/**
 * Calculate Excel column letter starting from index 1 -> AR (44)
 * 1: AR, 2: AS, 3: AT, 4: AU, 5: AV, 6: AW, 7: AX, 8: AY, 9: AZ, 10: BA...
 */
function getExcelColLetterFromIndex(colIndex) {
  let n = 43 + colIndex;
  let letter = '';
  while (n > 0) {
    let rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/**
 * Get user column name for column 1, 2, 3, 4, 5...
 */
function getColumnHeaderName(colIndex) {
  const names = getActiveSectionColNames();
  const key = `col${colIndex}`;
  if (names && names[key] && names[key].trim()) return names[key].trim();
  return `Column ${colIndex}`;
}

/**
 * Retrieve all textarea elements inside the multi-column container
 */
function getAllColumnTextareas() {
  if (!occupancy3ColContainerEl) return [];
  return Array.from(occupancy3ColContainerEl.querySelectorAll('textarea.occ-sub-textarea'));
}

/**
 * Retrieve all text values from the multi-column textareas
 */
function getAllColumnValues() {
  return getAllColumnTextareas().map(ta => ta.value);
}

/**
 * Render and synchronize multi-column inputs in the DOM
 */
function renderMultiColumnInputs() {
  const section = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
  if (!AppState.colCounts) AppState.colCounts = { occupancy: 3, construction: 3 };
  const count = AppState.colCounts[section] || 3;

  if (occupancy3ColContainerEl) {
    occupancy3ColContainerEl.style.setProperty('--occ-col-count', count);
  }

  // Update Pane Title
  if (rawPaneTitleEl) {
    const titleName = section === 'construction' ? 'Construction' : 'Occupancy';
    rawPaneTitleEl.innerHTML = `📥 ${count}-Column ${titleName} Input`;
  }

  // Update Paste button text & title
  if (btnPaste3ColEl) {
    const pasteLabel = document.getElementById('btn-paste-3col-text');
    if (pasteLabel) {
      pasteLabel.textContent = `Paste ${count} Columns`;
    }
    btnPaste3ColEl.title = `Paste ${count} Excel columns directly from clipboard`;
  }

  if (!occupancy3ColContainerEl) return;

  // Manage dynamic cards in container
  const existingCards = Array.from(occupancy3ColContainerEl.querySelectorAll('.occ-col-input-card'));
  const currentDomCount = existingCards.length;

  if (count > currentDomCount) {
    for (let i = currentDomCount + 1; i <= count; i++) {
      const card = createDynamicColumnCard(i, section);
      occupancy3ColContainerEl.appendChild(card);
    }
  } else if (count < currentDomCount) {
    for (let i = currentDomCount; i > count; i--) {
      const cardToRemove = occupancy3ColContainerEl.querySelector(`.occ-col-input-card[data-col-index="${i}"]`);
      if (cardToRemove) cardToRemove.remove();
    }
  }

  // Sync labels & values for all cards
  for (let i = 1; i <= count; i++) {
    const card = occupancy3ColContainerEl.querySelector(`.occ-col-input-card[data-col-index="${i}"]`);
    if (card) {
      const badge = card.querySelector('.occ-col-badge');
      if (badge) badge.textContent = `Col ${i}`;
      const nameInput = card.querySelector('.occ-col-name-input');
      const savedVal = AppState.colNames?.[section]?.[`col${i}`] || '';
      if (nameInput && !nameInput.matches(':focus')) {
        nameInput.value = savedVal;
      }
    }
  }

  updateOccLineNumbers();
}

/**
 * Create a new dynamic column card element (for Column 4+)
 */
function createDynamicColumnCard(index, section) {
  const card = document.createElement('div');
  card.className = 'occ-col-input-card occ-col-dynamic';
  card.setAttribute('data-col-index', String(index));

  const savedVal = AppState.colNames?.[section]?.[`col${index}`] || '';

  card.innerHTML = `
    <div class="occ-col-header">
      <span class="occ-col-badge">Col ${index}</span>
      <div class="occ-col-title-wrapper" title="Click to manually name Column ${index}">
        <input type="text" id="occ-col-${index}-input" class="occ-col-name-input" value="${savedVal.replace(/"/g, '&quot;')}" placeholder="Col ${index} Name..." spellcheck="false" title="Click to rename Column ${index}" />
        <span class="occ-col-edit-icon" title="Click to rename">✏️</span>
      </div>
      <button class="occ-col-remove-btn" title="Remove Column ${index}" type="button">✕</button>
    </div>
    <div class="occ-editor-box">
      <div class="line-numbers occ-line-numbers" id="occ-lines-${index}">1</div>
      <textarea 
        id="occ-input-col-${index}" 
        class="code-textarea occ-sub-textarea" 
        spellcheck="false" 
        placeholder=""></textarea>
    </div>
  `;

  // Bind remove button
  const removeBtn = card.querySelector('.occ-col-remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeColumn(index);
    });
  }

  // Bind column rename input
  const nameInput = card.querySelector('.occ-col-name-input');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const activeSec = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
      if (!AppState.colNames) AppState.colNames = {};
      if (!AppState.colNames[activeSec]) AppState.colNames[activeSec] = {};
      AppState.colNames[activeSec]['col' + index] = nameInput.value;
      if (window.CleanExcelReact?.updateColNames) {
        window.CleanExcelReact.updateColNames(AppState.colNames);
      }
      refreshOutputView();
    });
  }

  const wrapper = card.querySelector('.occ-col-title-wrapper');
  if (wrapper && nameInput) {
    wrapper.addEventListener('click', (e) => {
      if (e.target !== nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    });
  }

  // Bind textarea
  const textarea = card.querySelector('.occ-sub-textarea');
  const lineNumbers = card.querySelector('.occ-line-numbers');

  if (textarea) {
    textarea.addEventListener('input', () => {
      updateOccLineNumbers();
      debouncedProcessCleaning(80);
    });

    textarea.addEventListener('paste', (e) => {
      const pasteText = (e.clipboardData || window.clipboardData)?.getData('text');
      if (pasteText && pasteText.includes('\t')) {
        e.preventDefault();
        distributeMultiColumnText(pasteText);
        showToast('Pasted into columns!', '📋');
      }
    });

    textarea.addEventListener('scroll', () => {
      if (lineNumbers) lineNumbers.scrollTop = textarea.scrollTop;
    });
  }

  return card;
}

/**
 * Add a new column to the active engine (Occupancy or Construction)
 */
function addColumn() {
  if (AppState.activeColumnId !== 'occupancy' && AppState.activeColumnId !== 'construction') {
    showToast('Add Column is available for Occupancy & Construction modes', 'ℹ️');
    return;
  }
  const section = AppState.activeColumnId;
  if (!AppState.colCounts) AppState.colCounts = { occupancy: 3, construction: 3 };
  const currentCount = AppState.colCounts[section] || 3;
  const newCount = currentCount + 1;
  AppState.colCounts[section] = newCount;

  const defName = getColumnHeaderName(newCount);
  if (!AppState.colNames) AppState.colNames = {};
  if (!AppState.colNames[section]) AppState.colNames[section] = {};
  AppState.colNames[section]['col' + newCount] = defName;

  renderMultiColumnInputs();
  processCleaning();

  const letter = getExcelColLetterFromIndex(newCount);
  const sectionName = section === 'construction' ? 'Construction' : 'Occupancy';
  showToast(`Added Column ${newCount} (${letter}) to ${sectionName}!`, '➕');

  setTimeout(() => {
    if (occupancy3ColContainerEl) {
      const newCard = occupancy3ColContainerEl.querySelector(`.occ-col-input-card[data-col-index="${newCount}"]`);
      if (newCard) {
        const ta = newCard.querySelector('textarea');
        if (ta) ta.focus();
      }
    }
  }, 60);
}
window.addColumn = addColumn;

/**
 * Remove an added column from the active engine
 */
function removeColumn(index) {
  const section = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
  if (!AppState.colCounts) AppState.colCounts = { occupancy: 3, construction: 3 };
  const currentCount = AppState.colCounts[section] || 3;

  if (index <= 3) {
    showToast('Columns 1 to 3 are primary columns and cannot be removed', '⚠️');
    return;
  }

  const textareas = getAllColumnTextareas();
  const values = textareas.map(ta => ta.value);

  // Remove the value at index-1
  values.splice(index - 1, 1);

  // Shift column names
  if (AppState.colNames && AppState.colNames[section]) {
    for (let i = index; i < currentCount; i++) {
      AppState.colNames[section]['col' + i] = AppState.colNames[section]['col' + (i + 1)];
    }
    delete AppState.colNames[section]['col' + currentCount];
  }

  AppState.colCounts[section] = currentCount - 1;

  renderMultiColumnInputs();

  // Restore values to textareas
  const newTextareas = getAllColumnTextareas();
  newTextareas.forEach((ta, idx) => {
    if (values[idx] !== undefined) {
      ta.value = values[idx];
    }
  });

  updateOccLineNumbers();
  processCleaning();
  showToast(`Removed Column ${index}`, '🗑️');
}
window.removeColumn = removeColumn;

/**
 * Sync column name input fields from AppState
 */
function updateColumnNameInputsFromState() {
  renderMultiColumnInputs();
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

  const headerRegex = /^(code|existing\s*code|bldg|building|type|occupancy|construction|desc|description|class|use|details|col\s*\d|ar|as|at|au|av|property|category|name|header)/i;

  const isFirstCellHeader = headerRegex.test(col0) || (col0.length > 0 && isNaN(Number(col0)) && /code|ar/i.test(col0));
  const isSecondCellHeader = headerRegex.test(col1);
  const isThirdCellHeader = headerRegex.test(col2);

  if ((isFirstCellHeader && isSecondCellHeader) || (isSecondCellHeader && isThirdCellHeader) || (isFirstCellHeader && isThirdCellHeader)) {
    return true;
  }

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
  if (!AppState.colNames) AppState.colNames = {};
  if (!AppState.colNames[section]) AppState.colNames[section] = {};

  const count = Math.max(rowCells.length, AppState.colCounts[section] || 3);
  for (let i = 1; i <= count; i++) {
    const detected = rowCells[i - 1] !== undefined ? String(rowCells[i - 1]).trim() : '';
    if (detected) {
      AppState.colNames[section]['col' + i] = detected;
    }
  }

  renderMultiColumnInputs();
  showToast(`Auto-detected column names from header row!`, '🏷️');
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

  // Paste interception for Roof / Wall raw input:
  // Excel always puts BOTH text/plain AND text/html in the clipboard.
  // For a cell that contains Alt+Enter (embedded newline), text/plain shows two lines
  // but the HTML table still has ONE <tr> with ONE <td> containing a <br>.
  // Strategy:
  //   1. Try text/html → parse the table → one <tr> = one row, <br> inside a <td> → space.
  //   2. Fall back to parseExcelRows on text/plain (handles quoted TSV).
  //   3. If neither applies, let the browser handle normally.
  rawInputEl.addEventListener('paste', (e) => {
    const cd = e.clipboardData || window.clipboardData;
    if (!cd) return;

    const htmlData = cd.getData('text/html');
    const textData = cd.getData('text');

    // --- Strategy 1: HTML table parsing (most reliable for Excel) ---
    if (htmlData && htmlData.includes('<td')) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlData, 'text/html');
        const trs = doc.querySelectorAll('tr');
        if (trs.length > 0) {
          const rowTexts = [];
          trs.forEach(tr => {
            const cells = tr.querySelectorAll('td, th');
            if (cells.length === 0) {
              rowTexts.push('');
              return;
            }
            const cellValues = [];
            cells.forEach(cell => {
              cell.querySelectorAll('br').forEach(br => br.replaceWith(' '));
              cellValues.push((cell.textContent || '').replace(/\s+/g, ' ').trim());
            });
            // Preserve blank rows as empty strings so row numbering exactly matches Excel
            if (cellValues.every(c => !c)) {
              rowTexts.push('');
            } else {
              rowTexts.push(cellValues.join('\t'));
            }
          });
          if (rowTexts.length > 0) {
            e.preventDefault();
            const joined = rowTexts.join('\n');
            const start = rawInputEl.selectionStart || 0;
            const end = rawInputEl.selectionEnd || 0;
            rawInputEl.value = rawInputEl.value.substring(0, start) + joined + rawInputEl.value.substring(end);
            rawInputEl.selectionStart = rawInputEl.selectionEnd = start + joined.length;
            updateLineNumbers();
            debouncedProcessCleaning(80);
            return;
          }
        }
      } catch (_) { /* fall through to strategy 2 */ }
    }

    // --- Strategy 2: parseExcelRows on text/plain (handles quoted TSV) ---
    if (textData) {
      const hasQuotedCell = /^"/.test(textData.trim()) || /"[^"]*[\r\n][^"]*"/.test(textData);
      if (hasQuotedCell) {
        const parser = window.parseExcelRows || (typeof parseExcelRows === 'function' ? parseExcelRows : null);
        if (parser) {
          e.preventDefault();
          const rows = parser(textData);
          const joined = rows.join('\n');
          const start = rawInputEl.selectionStart || 0;
          const end = rawInputEl.selectionEnd || 0;
          rawInputEl.value = rawInputEl.value.substring(0, start) + joined + rawInputEl.value.substring(end);
          rawInputEl.selectionStart = rawInputEl.selectionEnd = start + joined.length;
          updateLineNumbers();
          debouncedProcessCleaning(80);
          return;
        }
      }
    }
    // Strategy 3: browser default paste (plain text with no embedded newline issue)
  });


  rawInputEl.addEventListener('scroll', () => {
    lineNumbersEl.scrollTop = rawInputEl.scrollTop;
  });

  // Column tabs switching
  const SECTION_CONFIG = {
    street: { 
      name: 'Street Address', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>', 
      category: 'address' 
    },
    split: { 
      name: 'Address Splitter', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 9v12"></path><path d="M18 15V9a9 9 0 0 0-9-9"></path></svg>', 
      category: 'address' 
    },
    occupancy: { 
      name: 'Occupancy Code', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="8" y1="6" x2="8.01" y2="6"></line><line x1="12" y1="6" x2="12.01" y2="6"></line><line x1="16" y1="6" x2="16.01" y2="6"></line><line x1="8" y1="11" x2="8.01" y2="11"></line><line x1="12" y1="11" x2="12.01" y2="11"></line><line x1="16" y1="11" x2="16.01" y2="11"></line></svg>', 
      category: 'underwriting' 
    },
    construction: { 
      name: 'ConstructionCode', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>', 
      category: 'underwriting' 
    },
    year: { 
      name: 'Year Built', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>', 
      category: 'underwriting' 
    },
    roof_year: { 
      name: 'Roof Year Built', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><circle cx="12" cy="13" r="3"></circle></svg>', 
      category: 'underwriting' 
    },
    roof: { 
      name: 'Roof Description', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"></path><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path></svg>', 
      category: 'underwriting' 
    },
    wall: { 
      name: 'Exterior Wall Finish', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="9" x2="9" y2="15"></line><line x1="15" y1="3" x2="15" y2="9"></line><line x1="15" y1="15" x2="15" y2="21"></line></svg>', 
      category: 'underwriting' 
    },
    stores: { 
      name: 'No of Stores', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M9 7h1"></path><path d="M9 11h1"></path><path d="M9 15h1"></path><path d="M14 7h1"></path><path d="M14 11h1"></path><path d="M14 15h1"></path></svg>', 
      category: 'underwriting' 
    },
    stories: { 
      name: 'No of Stores', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M9 7h1"></path><path d="M9 11h1"></path><path d="M9 15h1"></path><path d="M14 7h1"></path><path d="M14 11h1"></path><path d="M14 15h1"></path></svg>', 
      category: 'underwriting' 
    },
    foundation_type: { 
      name: 'Foundation Type', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16"></path><path d="M2 18h20"></path><path d="M6 18V6"></path><path d="M10 18V6"></path><path d="M14 18V6"></path><path d="M18 18V6"></path><path d="M3 6h18l-9-4z"></path></svg>', 
      category: 'underwriting' 
    },
    foundationType: { 
      name: 'Foundation Type', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16"></path><path d="M2 18h20"></path><path d="M6 18V6"></path><path d="M10 18V6"></path><path d="M14 18V6"></path><path d="M18 18V6"></path><path d="M3 6h18l-9-4z"></path></svg>', 
      category: 'underwriting' 
    },
    foundation: { 
      name: 'Foundation Type', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16"></path><path d="M2 18h20"></path><path d="M6 18V6"></path><path d="M10 18V6"></path><path d="M14 18V6"></path><path d="M18 18V6"></path><path d="M3 6h18l-9-4z"></path></svg>', 
      category: 'underwriting' 
    },
    foundation_connection: { 
      name: 'Foundation Connection', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>', 
      category: 'underwriting' 
    },
    short_column: { 
      name: 'Short Column', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16"></path><path d="M4 2h16"></path><path d="M6 2v20"></path><path d="M18 2v20"></path><path d="M10 2v20"></path><path d="M14 2v20"></path></svg>', 
      category: 'underwriting' 
    },
    shortColumn: { 
      name: 'Short Column', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16"></path><path d="M4 2h16"></path><path d="M6 2v20"></path><path d="M18 2v20"></path><path d="M10 2v20"></path><path d="M14 2v20"></path></svg>', 
      category: 'underwriting' 
    },
    building_exterior_opening: {
      name: 'Building Exterior Opening',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>',
      category: 'underwriting'
    },
    soft_story: {
      name: 'Soft Story',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M4 21V10l8-6 8 6v11"></path><path d="M9 21v-4a3 3 0 0 1 6 0v4"></path></svg>',
      category: 'underwriting'
    },
    softStory: {
      name: 'Soft Story',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M4 21V10l8-6 8 6v11"></path><path d="M9 21v-4a3 3 0 0 1 6 0v4"></path></svg>',
      category: 'underwriting'
    },
    ornamentation: {
      name: 'Ornamentation',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
      category: 'underwriting'
    },
    building_shape: {
      name: 'Building Shape',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon></svg>',
      category: 'underwriting'
    },
    buildingShape: {
      name: 'Building Shape',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon></svg>',
      category: 'underwriting'
    },
    shape: {
      name: 'Building Shape',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon></svg>',
      category: 'underwriting'
    },
    building_condition: {
      name: 'Building Condition',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"></path><path d="M5 20V8l7-5 7 5v12"></path><path d="M9 13h6"></path><path d="M9 17h6"></path></svg>',
      category: 'underwriting'
    },
    buildingCondition: {
      name: 'Building Condition',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"></path><path d="M5 20V8l7-5 7 5v12"></path><path d="M9 13h6"></path><path d="M9 17h6"></path></svg>',
      category: 'underwriting'
    },
    condition: {
      name: 'Building Condition',
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"></path><path d="M5 20V8l7-5 7 5v12"></path><path d="M9 13h6"></path><path d="M9 17h6"></path></svg>',
      category: 'underwriting'
    },
    name: { 
      name: 'Full Name', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>', 
      category: 'contact' 
    },
    phone: { 
      name: 'Phone Number', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>', 
      category: 'contact' 
    },
    email: { 
      name: 'Email Address', 
      icon: '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>', 
      category: 'contact' 
    }
  };

  function switchActiveSection(colId, opts = {}) {
    if (!colId) return;
    const defaultIcon = '<svg class="studio-svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>';
    const cfg = SECTION_CONFIG[colId] || { name: colId, icon: defaultIcon, category: 'all' };

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
      sectionCurrentLabelEl.innerHTML = `${cfg.icon} <span>${cfg.name}</span>`;
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
    const storesRulesEl = document.getElementById('stores-rules-panel');
    const foundationTypeRulesEl = document.getElementById('foundation-type-rules-panel');
    const foundationRulesEl = document.getElementById('foundation-rules-panel');
    const shortColumnRulesEl = document.getElementById('short-column-rules-panel');
    const buildingExteriorOpeningRulesEl = document.getElementById('building-exterior-opening-rules-panel');
    const softStoryRulesEl = document.getElementById('soft-story-rules-panel');
    const ornamentationRulesEl = document.getElementById('ornamentation-rules-panel');
    const buildingShapeRulesEl = document.getElementById('building-shape-rules-panel');
    const buildingConditionRulesEl = document.getElementById('building-condition-rules-panel');
    if (streetRulesEl) streetRulesEl.style.display = colId === 'street' ? 'flex' : 'none';
    if (splitRulesEl) splitRulesEl.style.display = colId === 'split' ? 'flex' : 'none';
    if (occRulesEl) occRulesEl.style.display = colId === 'occupancy' ? 'flex' : 'none';
    if (conRulesEl) conRulesEl.style.display = colId === 'construction' ? 'flex' : 'none';
    if (yearRulesEl) yearRulesEl.style.display = colId === 'year' ? 'flex' : 'none';
    if (roofYearRulesEl) roofYearRulesEl.style.display = colId === 'roof_year' ? 'flex' : 'none';
    if (roofRulesEl) roofRulesEl.style.display = colId === 'roof' ? 'flex' : 'none';
    if (wallRulesEl) wallRulesEl.style.display = colId === 'wall' ? 'flex' : 'none';
    if (storesRulesEl) storesRulesEl.style.display = (colId === 'stores' || colId === 'stories') ? 'flex' : 'none';
    if (foundationTypeRulesEl) foundationTypeRulesEl.style.display = (colId === 'foundation_type' || colId === 'foundationType' || colId === 'foundation') ? 'flex' : 'none';
    if (foundationRulesEl) foundationRulesEl.style.display = (colId === 'foundation_connection' || colId === 'foundationConnection') ? 'flex' : 'none';
    if (shortColumnRulesEl) shortColumnRulesEl.style.display = (colId === 'short_column' || colId === 'shortColumn') ? 'flex' : 'none';
    if (buildingExteriorOpeningRulesEl) buildingExteriorOpeningRulesEl.style.display = (colId === 'building_exterior_opening' || colId === 'buildingExteriorOpening' || colId === 'exterior_opening') ? 'flex' : 'none';
    if (softStoryRulesEl) softStoryRulesEl.style.display = (colId === 'soft_story' || colId === 'softStory') ? 'flex' : 'none';
    if (ornamentationRulesEl) ornamentationRulesEl.style.display = (colId === 'ornamentation' || colId === 'ornament') ? 'flex' : 'none';
    if (buildingShapeRulesEl) buildingShapeRulesEl.style.display = (colId === 'building_shape' || colId === 'buildingShape' || colId === 'shape') ? 'flex' : 'none';
    if (buildingConditionRulesEl) buildingConditionRulesEl.style.display = (colId === 'building_condition' || colId === 'buildingCondition' || colId === 'condition') ? 'flex' : 'none';

    // Update live inspector on section switch
    const liveInspectorEl = document.getElementById('live-code-inspector');
    if (liveInspectorEl && !['occupancy', 'construction', 'roof', 'wall', 'foundation_type', 'foundation', 'foundation_connection', 'short_column', 'building_exterior_opening', 'soft_story', 'ornamentation', 'ornament', 'building_shape', 'buildingShape', 'shape', 'building_condition', 'buildingCondition', 'condition'].includes(colId)) {
      liveInspectorEl.style.display = 'none';
    }

    // Switch editor pane layout (Occupancy/Construction use 3-col, Roof Year uses 2-col)
    if (colId === 'roof_year') {
      if (roofYear2ColContainerEl) roofYear2ColContainerEl.style.display = 'grid';
      if (occupancy3ColContainerEl) occupancy3ColContainerEl.style.display = 'none';
      if (inputEditorContainerEl) inputEditorContainerEl.style.display = 'none';
      if (btnPaste2ColEl) btnPaste2ColEl.style.display = 'inline-flex';
      if (btnPaste3ColEl) btnPaste3ColEl.style.display = 'none';
      if (btnAddColEl) btnAddColEl.style.display = 'none';
      if (rawPaneTitleEl) rawPaneTitleEl.innerHTML = '📥 2-Column Roof Year Built Input <span style="font-size:11px;font-weight:normal;opacity:0.75;">(Year Built &amp; Roof Year)</span>';
      updateRoofYearLineNumbers();
    } else if (colId === 'occupancy' || colId === 'construction') {
      if (roofYear2ColContainerEl) roofYear2ColContainerEl.style.display = 'none';
      if (occupancy3ColContainerEl) occupancy3ColContainerEl.style.display = 'grid';
      if (inputEditorContainerEl) inputEditorContainerEl.style.display = 'none';
      if (btnPaste2ColEl) btnPaste2ColEl.style.display = 'none';
      if (btnPaste3ColEl) btnPaste3ColEl.style.display = 'inline-flex';
      if (btnAddColEl) btnAddColEl.style.display = 'inline-flex';

      renderMultiColumnInputs();
      updateOccLineNumbers();
    } else {
      if (roofYear2ColContainerEl) roofYear2ColContainerEl.style.display = 'none';
      if (occupancy3ColContainerEl) occupancy3ColContainerEl.style.display = 'none';
      if (inputEditorContainerEl) inputEditorContainerEl.style.display = 'flex';
      if (btnPaste2ColEl) btnPaste2ColEl.style.display = 'none';
      if (btnPaste3ColEl) btnPaste3ColEl.style.display = 'none';
      if (btnAddColEl) btnAddColEl.style.display = 'none';
      if (rawPaneTitleEl) {
        if (colId === 'year') {
          rawPaneTitleEl.textContent = '📥 Raw Year Built Input (1753 – 2026)';
        } else if (colId === 'roof') {
          rawPaneTitleEl.textContent = '📥 Raw Roof Description Input';
        } else if (colId === 'wall') {
          rawPaneTitleEl.textContent = '📥 Raw Exterior Wall Finish Input';
        } else if (colId === 'foundation_type' || colId === 'foundationType') {
          rawPaneTitleEl.textContent = '📥 Raw Foundation Type Input (Codes 0–12)';
        } else if (colId === 'foundation_connection') {
          rawPaneTitleEl.textContent = '📥 Raw Foundation Connection Input (Codes 0–6)';
        } else if (colId === 'foundation') {
          rawPaneTitleEl.textContent = '📥 Raw Foundation Type & Connection Input';
        } else if (colId === 'short_column' || colId === 'shortColumn') {
          rawPaneTitleEl.textContent = '📥 Raw Short Column Input (0: Unknown, 1: No, 2: Yes)';
        } else if (colId === 'building_exterior_opening' || colId === 'buildingExteriorOpening' || colId === 'exterior_opening') {
          rawPaneTitleEl.textContent = '📥 Raw Building Exterior Opening Input (0: Unknown, 1: <50%, 2: >50%)';
        } else if (colId === 'soft_story' || colId === 'softStory') {
          rawPaneTitleEl.textContent = '📥 Raw Soft Story Input (0: Unknown, 1: No, 2: Yes)';
        } else if (colId === 'ornamentation' || colId === 'ornament') {
          rawPaneTitleEl.textContent = '📥 Raw Ornamentation Input (0: Unknown, 1: None, 2: Average, 3: Extensive)';
        } else if (colId === 'building_shape' || colId === 'buildingShape' || colId === 'shape') {
          rawPaneTitleEl.textContent = '📥 Raw Building Shape Input (0: Unknown, 1: Square, 2: Rect, 3: Circle, 4-7: L/T/U/H, 8: Complex)';
        } else if (colId === 'building_condition' || colId === 'buildingCondition' || colId === 'condition') {
          rawPaneTitleEl.textContent = '📥 Raw Building Condition Input (0: Unknown, 1: Average, 2: Good, 3: Poor)';
        } else {
          rawPaneTitleEl.textContent = '📥 Raw Excel Column Input';
        }
      }
      if (rawInputEl) {
        if (colId === 'roof') {
          rawInputEl.placeholder = 'Paste roof description data here (e.g. "Gable, 4:12 pitch, asphalt shingles, plywood deck")...\nCleanExcel Studio will automatically separate into:\n1. Roof Geometry\n2. Roof Pitch\n3. Roof Covering\n4. Roof Deck';
        } else if (colId === 'wall') {
          rawInputEl.placeholder = 'Paste exterior wall finish data here (e.g. "50% Brick / 50% Vinyl Siding", "Stucco on Concrete Block")...\nCleanExcel Studio will automatically separate into:\n1. WallType (Backing / Structure)\n2. WallSiding (Weather Finish)\nApplying Underwriting Rules: Higher % • Weaker Material Tie-Breaker';
        } else if (colId === 'foundation_type' || colId === 'foundationType') {
          rawInputEl.placeholder = 'Paste Foundation Type data here (e.g. "Mat / slab foundation", "Concrete basement", "Crawlspace cripple wall (wood)", "Pile foundation for high-rise tower", "Post & pier", "No basement")...\nCleanExcel Studio classifies into Touchstone UNICEDE® Foundation Type Codes (0–12):\n• Code 0: Unknown / Default\n• Code 1: Masonry basement • Code 2: Concrete basement\n• Code 4: Crawlspace cripple wall • Code 8: Mat / slab\n• Code 9: Pile • Code 10: No basement';
        } else if (colId === 'foundation_connection') {
          rawInputEl.placeholder = 'Paste Foundation Connection data here (e.g. "Anchor bolts", "Hurricane ties", "Gravity / Friction", "Adhesive / Epoxy", "Structurally Connected", "Unanchored", "Anchored")...\nCleanExcel Studio classifies into Touchstone UNICEDE® Foundation Connection Codes (0–6)\n• Industrial Facilities: 4 = Unanchored • 6 = Anchored\n• Verisk EQ Bolting Retrofit: Code 4';
        } else if (colId === 'foundation') {
          rawInputEl.placeholder = 'Paste Foundation descriptions here (e.g. "Mat / slab with anchor bolts", "Concrete basement", "Pile foundation for high-rise tower", "Crawlspace cripple wall (wood)")...\nCleanExcel Studio will automatically separate into:\n1. Foundation Type (Codes 0–12)\n2. Foundation Connection (Codes 0–6)\nEnforcing Touchstone UNICEDE® underwriting & hazard model rules.';
        } else if (colId === 'short_column' || colId === 'shortColumn') {
          rawInputEl.placeholder = 'Paste Short Column data here (e.g. "Yes", "No", "Spandrel beams restricting column height", "Infill walls", "0", "1", "2")...\nCleanExcel Studio classifies Touchstone UNICEDE® Short Column codes:\n• Code 0: Unknown / Default\n• Code 1: No (No Short Columns)\n• Code 2: Yes (Short Columns Present)\nModels: CA EQ, HI EQ, JP EQ, US EQ (Optional)';
        } else if (colId === 'building_exterior_opening' || colId === 'buildingExteriorOpening' || colId === 'exterior_opening') {
          rawInputEl.placeholder = 'Paste Building Exterior Opening data here (e.g. "Less than 50% open", "More than 50%", "<50%", ">50%", "0", "1", "2")...\nCleanExcel Studio classifies Touchstone UNICEDE® Building Exterior Opening codes:\n• Code 0: Unknown\n• Code 1: Less than 50% of wall open / default\n• Code 2: More than 50% of wall open\nModels: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional)';
        } else if (colId === 'soft_story' || colId === 'softStory') {
          rawInputEl.placeholder = 'Paste Soft Story data here (e.g. "Yes", "No", "First-floor garage", "Tuck-under parking", "Open front", "0", "1", "2")...\nCleanExcel Studio classifies Touchstone UNICEDE® Soft Story codes:\n• Code 0: Unknown / default\n• Code 1: No (No soft story weakness)\n• Code 2: Yes (Structural weakness at any floor, stories >= 2)\nModels: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional)';
        } else if (colId === 'ornamentation' || colId === 'ornament') {
          rawInputEl.placeholder = 'Paste Ornamentation data here (e.g. "None", "Average", "Extensive", "Unreinforced parapet walls", "Entryway roofs", "Cornices", "0", "1", "2", "3")...\nCleanExcel Studio classifies Touchstone UNICEDE® Ornamentation codes:\n• Code 0: Unknown / default\n• Code 1: None (no decorative elements)\n• Code 2: Average (moderate decorative trim)\n• Code 3: Extensive (unreinforced/unbraced parapets, entryway roofs, elaborate facade)\nModels: CA EQ, HI EQ, JP EQ, US EQ (Optional)';
        } else if (colId === 'building_shape' || colId === 'buildingShape' || colId === 'shape') {
          rawInputEl.placeholder = 'Paste Building Shape data here (e.g. "Square", "Rectangle", "Circular", "L-shaped", "T-shaped", "U-shaped", "H-shaped", "Complex", "0"–"8")...\nCleanExcel Studio classifies Touchstone UNICEDE® Building Shape codes:\n• Code 0: Unknown / default\n• Code 1: Square • Code 2: Rectangle • Code 3: Circular\n• Code 4: L-shaped • Code 5: T-shaped • Code 6: U-shaped • Code 7: H-shaped\n• Code 8: Complex (irregular, multi-wing, cruciform)\nModels: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ (Optional)';
        } else if (colId === 'building_condition' || colId === 'buildingCondition' || colId === 'condition') {
          rawInputEl.placeholder = 'Paste Building Condition data here (e.g. "Good", "Average", "Poor", "Well-maintained", "Cracking due to settlement", "Loose roof tiles", "0", "1", "2", "3")...\nCleanExcel Studio classifies Touchstone UNICEDE® Building Condition codes:\n• Code 0: Unknown / default\n• Code 1: Average (standard maintenance, normal aging - EQ default)\n• Code 2: Good (well-maintained, recent renovation, sound cladding)\n• Code 3: Poor (distressed, settlement cracks, loose tiles, chimney damage)\nModels: CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST (Optional)';
        } else if (colId === 'year') {
          rawInputEl.placeholder = 'Paste Year Built column here (e.g. "1994", "Built in 1985", "1680", "2030")...\nCleanExcel Studio will validate between 1753 and 2026, blanking out-of-range rows.';
        } else if (colId === 'stores' || colId === 'stories') {
          rawInputEl.placeholder = 'Paste No of Stores / Stories data here (e.g. "3.5", "4.2", "2 & 3", "1,2", "2/3", "-5", "non", "none", "5")...\nCleanExcel Studio enforces Underwriting Rules:\n• Decimals round UP (3.5 ➔ 4, 4.2 ➔ 5)\n• Multi-values/ranges pick MAX (2 & 3 ➔ 3, 1,2 ➔ 2, 2/3 ➔ 3)\n• Negative values leave blank (-5 ➔ Blank)\n• Non / none / blank ➔ Blank';
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
  const studioCommandBar = document.querySelector('.studio-command-bar');

  if (btnSectionDropdown && sectionDropdownMenu) {
    btnSectionDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sectionDropdownMenu.style.display !== 'none';
      sectionDropdownMenu.style.display = isOpen ? 'none' : 'block';
      if (sectionDropdownWrapper) {
        sectionDropdownWrapper.classList.toggle('open', !isOpen);
      }
      if (studioCommandBar) {
        studioCommandBar.classList.toggle('dropdown-active', !isOpen);
      }
    });

    document.addEventListener('click', (e) => {
      if (sectionDropdownWrapper && !sectionDropdownWrapper.contains(e.target)) {
        sectionDropdownMenu.style.display = 'none';
        sectionDropdownWrapper.classList.remove('open');
        if (studioCommandBar) {
          studioCommandBar.classList.remove('dropdown-active');
        }
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
          if (studioCommandBar) {
            studioCommandBar.classList.remove('dropdown-active');
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
      if (window.CleanExcelReact?.updateColNames) {
        window.CleanExcelReact.updateColNames(AppState.colNames);
      }
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

  // Paste Multi-Column button
  if (btnPaste3ColEl) {
    btnPaste3ColEl.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          distributeMultiColumnText(text);
          const sec = (AppState.activeColumnId === 'construction') ? 'construction' : 'occupancy';
          const cnt = (AppState.colCounts && AppState.colCounts[sec]) || 3;
          showToast(`Pasted ${cnt} Excel columns from clipboard!`, '📋');
        } else {
          showToast('Clipboard is empty', '⚠️');
        }
      } catch (err) {
        showToast('Please press Ctrl+V / Cmd+V into any column box to paste', 'ℹ️');
      }
    });
  }

  // Add Column button (+ Add Column)
  if (btnAddColEl) {
    btnAddColEl.addEventListener('click', () => {
      addColumn();
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

  // Foundation Type format options
  const foundationTypeFormatRadios = document.querySelectorAll('input[name="foundation-type-format-radio"]');
  foundationTypeFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.foundationTypeFormat = e.target.value;
      processCleaning();
    });
  });

  // Foundation format options
  const foundationFormatRadios = document.querySelectorAll('input[name="foundation-format-radio"]');
  foundationFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.foundationFormat = e.target.value;
      processCleaning();
    });
  });

  // Short Column format options
  const shortColFormatRadios = document.querySelectorAll('input[name="short-column-format-radio"]');
  shortColFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.shortColumnFormat = e.target.value;
      processCleaning();
    });
  });

  // Soft Story format options
  const softStoryFormatRadios = document.querySelectorAll('input[name="soft-story-format-radio"]');
  softStoryFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.softStoryFormat = e.target.value;
      processCleaning();
    });
  });

  // Ornamentation format options
  const ornamentationFormatRadios = document.querySelectorAll('input[name="ornamentation-format-radio"]');
  ornamentationFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.ornamentationFormat = e.target.value;
      processCleaning();
    });
  });

  // Building Shape format options
  const buildingShapeFormatRadios = document.querySelectorAll('input[name="building-shape-format-radio"]');
  buildingShapeFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.buildingShapeFormat = e.target.value;
      processCleaning();
    });
  });

  // Building Condition format options
  const buildingConditionFormatRadios = document.querySelectorAll('input[name="building-condition-format-radio"]');
  buildingConditionFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.buildingConditionFormat = e.target.value;
      processCleaning();
    });
  });

  // No of Stores options
  const storesRoundUpEl = document.getElementById('stores-round-up-checkbox');
  if (storesRoundUpEl) {
    storesRoundUpEl.addEventListener('change', (e) => {
      AppState.storesRoundUp = e.target.checked;
      processCleaning();
    });
  }
  const storesPickMaxEl = document.getElementById('stores-pick-max-checkbox');
  if (storesPickMaxEl) {
    storesPickMaxEl.addEventListener('change', (e) => {
      AppState.storesPickMax = e.target.checked;
      processCleaning();
    });
  }
  const storesPositiveEl = document.getElementById('stores-positive-checkbox');
  if (storesPositiveEl) {
    storesPositiveEl.addEventListener('change', (e) => {
      AppState.storesPositive = e.target.checked;
      processCleaning();
    });
  }
  const storesRemoveEmptyEl = document.getElementById('stores-remove-empty-checkbox');
  if (storesRemoveEmptyEl) {
    storesRemoveEmptyEl.addEventListener('change', (e) => {
      AppState.storesRemoveEmpty = e.target.checked;
      processCleaning();
    });
  }

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
  if (splitIncludeRawCheckboxEl) {
    splitIncludeRawCheckboxEl.addEventListener('change', (e) => {
      AppState.splitIncludeRaw = e.target.checked;
      processCleaning();
    });
  }

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

  // Add new symbol(s) to remove on Enter or blur
  if (newSymbolInputEl) {
    newSymbolInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSymbolsFromInput();
      }
    });
  }

  // Reset symbols to default characters
  if (btnResetSymbolsEl) {
    btnResetSymbolsEl.addEventListener('click', () => {
      AppState.symbolsToRemove = (window.StreetCleaner ? window.StreetCleaner.defaultSymbols.slice() : [',', '.', '/', '<', '>', '?', ';', "'", '\\', ':', '"', '|', '[', ']', '{', '}', '=', '+', '-', '_', '(', ')', '#', '$', '%', '^', '&', '*', '@', '!']);
      saveSymbolsToStorage();
      renderSymbolChips();
      processCleaning();
      showToast('Reset to default symbols', '↺');
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
        getAllColumnTextareas().forEach(ta => { ta.value = ''; });
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
    const applyTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('cleanexcel_theme', theme);
      themeBtn.innerHTML = `<span class="veng-theme-icon">${theme === 'light' ? '☀️' : '🌙'}</span>`;
      themeBtn.setAttribute('title', theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode');
      themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode');
    };

    // Load saved theme
    const savedTheme = localStorage.getItem('cleanexcel_theme');
    if (savedTheme) {
      applyTheme(savedTheme);
    }

    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
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

  const cancelGeminiModalBtn = document.getElementById('btn-cancel-gemini-modal');
  if (cancelGeminiModalBtn && geminiModalEl) {
    cancelGeminiModalBtn.addEventListener('click', () => {
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

  // Toggle Key Visibility (Eye icon)
  const toggleVisibilityBtn = document.getElementById('btn-toggle-key-visibility');
  if (toggleVisibilityBtn && geminiApiKeyInputEl) {
    toggleVisibilityBtn.addEventListener('click', () => {
      if (geminiApiKeyInputEl.type === 'password') {
        geminiApiKeyInputEl.type = 'text';
        toggleVisibilityBtn.textContent = '🔒';
        toggleVisibilityBtn.title = 'Hide API Key';
      } else {
        geminiApiKeyInputEl.type = 'password';
        toggleVisibilityBtn.textContent = '👁️';
        toggleVisibilityBtn.title = 'Show API Key';
      }
    });
  }

  // Live input detection on typing or pasting key
  if (geminiApiKeyInputEl) {
    geminiApiKeyInputEl.addEventListener('input', () => {
      const val = geminiApiKeyInputEl.value.trim();
      if (val && window.GeminiService) {
        const detected = window.GeminiService.detectProvider(val);
        const pInfo = window.GeminiService.getProviderInfo(detected);
        if (geminiKeyStatusTextEl) {
          geminiKeyStatusTextEl.textContent = `✨ ${pInfo.name} Detected`;
        }
        if (geminiKeyMaskedPreviewEl) {
          geminiKeyMaskedPreviewEl.textContent = val.length <= 8 ? '••••••••••••••••' : `${val.slice(0, 4)}••••••••••••••••${val.slice(-4)}`;
        }
      } else if (window.GeminiService) {
        const isConfigured = window.GeminiService.isConfigured();
        const provider = window.GeminiService.getProvider();
        const pInfo = window.GeminiService.getProviderInfo(provider);
        if (geminiKeyStatusTextEl) {
          geminiKeyStatusTextEl.textContent = isConfigured ? `🔒 ${pInfo.name} Active (Saved in Browser)` : '⚠️ No AI Key Configured';
        }
        if (geminiKeyMaskedPreviewEl) {
          geminiKeyMaskedPreviewEl.textContent = window.GeminiService.getMaskedKeyDisplay();
        }
      }
    });
  }

  // Reset Custom Key button
  if (btnClearCustomKeyEl) {
    btnClearCustomKeyEl.addEventListener('click', () => {
      if (window.GeminiService) {
        window.GeminiService.setApiKey('');
        if (geminiApiKeyInputEl) geminiApiKeyInputEl.value = '';
        updateGeminiModalUI();
        showToast('API key removed from browser storage', '🗑️');
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
          updateGeminiModalUI();
          const pInfo = window.GeminiService.getProviderInfo();
          showToast(`✓ ${pInfo.name} API key saved permanently in browser!`, '💾');
        } else if (window.GeminiService.isConfigured()) {
          showToast('Active API key retained & protected in browser', '🔒');
        } else {
          showToast('No API key entered', '⚠️');
        }
      }
      if (geminiModalEl) geminiModalEl.style.display = 'none';
    });
  }

  // Auto-Detect & Test All Models
  const testKeyBtn = document.getElementById('btn-test-gemini');
  if (testKeyBtn) {
    testKeyBtn.addEventListener('click', async () => {
      if (!window.GeminiService) return;

      // If a key is typed in input, save it first
      if (geminiApiKeyInputEl && geminiApiKeyInputEl.value.trim()) {
        window.GeminiService.setApiKey(geminiApiKeyInputEl.value.trim());
      }

      const key = window.GeminiService.getApiKey();
      if (!key) {
        if (geminiTestStatusEl) {
          geminiTestStatusEl.style.display = 'block';
          geminiTestStatusEl.className = 'test-status-area error';
          geminiTestStatusEl.textContent = '✗ Please paste your API key first.';
        }
        return;
      }

      const detectedProv = window.GeminiService.detectProvider(key);
      const provInfo = window.GeminiService.getProviderInfo(detectedProv);

      testKeyBtn.disabled = true;
      testKeyBtn.innerHTML = '<span class="btn-spinner"></span> Detecting...';

      // Build live result panel
      if (geminiTestStatusEl) {
        geminiTestStatusEl.style.display = 'block';
        geminiTestStatusEl.className = 'test-status-area autodetect-panel';
        const models = window.GeminiService.AVAILABLE_MODELS;
        geminiTestStatusEl.innerHTML = `
          <div class="autodetect-header">
            <span class="autodetect-icon">${provInfo.icon}</span>
            <span>Probing <strong>${provInfo.name}</strong> models (${models.length} candidate${models.length > 1 ? 's' : ''})...</span>
          </div>
          <div class="autodetect-list" id="autodetect-list">
            ${models.map(m => `
              <div class="autodetect-row" id="adr-${m.id.replace(/[^a-z0-9]/gi,'-')}">
                <span class="adr-spinner"></span>
                <span class="adr-name">${m.label}</span>
                <span class="adr-badge">${m.badge}</span>
                <span class="adr-status">Testing...</span>
              </div>`).join('')}
          </div>`;
      }

      function updateRow(modelId, status, latency) {
        const rowId = 'adr-' + modelId.replace(/[^a-z0-9]/gi, '-');
        const row = document.getElementById(rowId);
        if (!row) return;
        if (status === 'ok') {
          row.classList.add('adr-ok');
          row.querySelector('.adr-spinner').outerHTML = '<span class="adr-tick">✓</span>';
          row.querySelector('.adr-status').textContent = `${latency}ms`;
        } else {
          row.classList.add('adr-fail');
          row.querySelector('.adr-spinner').outerHTML = '<span class="adr-cross">✗</span>';
          row.querySelector('.adr-status').textContent = 'Not available';
        }
      }

      try {
        const { provider: finalProv, working } = await window.GeminiService.autoDetectModels(key, (modelId, status, latency) => {
          // Update row live as each probe resolves
          updateRow(modelId, status, latency);
        });

        const finalPInfo = window.GeminiService.getProviderInfo(finalProv);

        if (working.length > 0) {
          const best = working[0];
          // Auto-select and save the fastest working model
          window.GeminiService.setModel(best.id);
          updateGeminiModalUI();
          // Highlight the auto-selected row
          const bestRowId = 'adr-' + best.id.replace(/[^a-z0-9]/gi, '-');
          const bestRow = document.getElementById(bestRowId);
          if (bestRow) {
            bestRow.classList.add('adr-selected');
            const nameEl = bestRow.querySelector('.adr-name');
            if (nameEl) nameEl.innerHTML += ' <span class="adr-auto-badge">Auto-Selected ★</span>';
          }
          // Show summary with 1-click OK button
          const summaryEl = document.createElement('div');
          summaryEl.className = 'autodetect-summary success';
          summaryEl.innerHTML = `
            <div class="autodetect-summary-content">
              <span>✓ <strong>${working.length} ${finalPInfo.name} model${working.length > 1 ? 's' : ''} ready</strong> — Auto-selected <strong>${best.label}</strong> (${best.latency}ms)</span>
              <button class="autodetect-ok-btn" id="btn-autodetect-ok" type="button">✓ OK / Connect</button>
            </div>`;
          geminiTestStatusEl.appendChild(summaryEl);

          const autoOkBtn = document.getElementById('btn-autodetect-ok');
          if (autoOkBtn) {
            autoOkBtn.addEventListener('click', () => {
              if (geminiModalEl) geminiModalEl.style.display = 'none';
              showToast(`Connected to ${finalPInfo.name} (${best.label})!`, '✨');
            });
          }
          showToast(`✓ Auto-selected ${best.label} (${finalPInfo.name})`, '🚀');
        } else {
          const summaryEl = document.createElement('div');
          summaryEl.className = 'autodetect-summary error';
          summaryEl.innerHTML = `✗ <strong>No compatible ${finalPInfo.name} models found.</strong> Please verify your API key and billing status.`;
          geminiTestStatusEl.appendChild(summaryEl);
        }
      } catch (err) {
        if (geminiTestStatusEl) {
          geminiTestStatusEl.className = 'test-status-area error';
          geminiTestStatusEl.textContent = `✗ ${err.message}`;
        }
      } finally {
        testKeyBtn.disabled = false;
        testKeyBtn.innerHTML = '🔍 Auto-Detect Models';
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

  const roofAiBtn = document.getElementById('btn-roof-ai');
  if (roofAiBtn) {
    roofAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const wallAiBtn = document.getElementById('btn-wall-ai');
  if (wallAiBtn) {
    wallAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const roofYearAiBtn = document.getElementById('btn-roof-year-ai');
  if (roofYearAiBtn) {
    roofYearAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const storesAiBtn = document.getElementById('btn-stores-ai');
  if (storesAiBtn) {
    storesAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const foundationTypeAiBtn = document.getElementById('btn-foundation-type-ai');
  if (foundationTypeAiBtn) {
    foundationTypeAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const foundationAiBtn = document.getElementById('btn-foundation-ai');
  if (foundationAiBtn) {
    foundationAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const shortColAiBtn = document.getElementById('btn-short-column-ai');
  if (shortColAiBtn) {
    shortColAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const softStoryAiBtn = document.getElementById('btn-soft-story-ai');
  if (softStoryAiBtn) {
    softStoryAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const ornamentationAiBtn = document.getElementById('btn-ornamentation-ai');
  if (ornamentationAiBtn) {
    ornamentationAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const buildingShapeAiBtn = document.getElementById('btn-building-shape-ai');
  if (buildingShapeAiBtn) {
    buildingShapeAiBtn.addEventListener('click', () => triggerGeminiAI());
  }

  const buildingConditionAiBtn = document.getElementById('btn-building-condition-ai');
  if (buildingConditionAiBtn) {
    buildingConditionAiBtn.addEventListener('click', () => triggerGeminiAI());
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

            let maxColsInFile = 1;
            dataRows.forEach(r => {
              if (r.length > maxColsInFile) maxColsInFile = r.length;
            });
            if (!AppState.colCounts) AppState.colCounts = { occupancy: 3, construction: 3 };
            if (maxColsInFile > (AppState.colCounts[section] || 3)) {
              AppState.colCounts[section] = maxColsInFile;
              renderMultiColumnInputs();
            }
            const activeCount = AppState.colCounts[section] || 3;
            const colArrays = Array.from({ length: activeCount }, () => []);

            dataRows.forEach(row => {
              if (row.length >= 3) {
                for (let k = 0; k < activeCount; k++) {
                  colArrays[k].push(row[k] !== undefined ? String(row[k]) : '');
                }
              } else if (row.length === 2) {
                if (/^\d{1,4}$/.test(String(row[0]).trim())) {
                  colArrays[0].push(String(row[0]));
                  colArrays[1].push(row[1] !== undefined ? String(row[1]) : '');
                  for (let k = 2; k < activeCount; k++) colArrays[k].push('');
                } else {
                  colArrays[0].push('');
                  colArrays[1].push(String(row[0]));
                  colArrays[2].push(row[1] !== undefined ? String(row[1]) : '');
                  for (let k = 3; k < activeCount; k++) colArrays[k].push('');
                }
              } else {
                colArrays[0].push('');
                colArrays[1].push(row[0] !== undefined ? String(row[0]) : '');
                for (let k = 2; k < activeCount; k++) colArrays[k].push('');
              }
            });

            const textareas = getAllColumnTextareas();
            textareas.forEach((ta, idx) => {
              if (colArrays[idx]) ta.value = colArrays[idx].join('\n');
            });
            updateOccLineNumbers();
            processCleaning();
            showToast(`Imported ${dataRows.length} rows into ${activeCount} columns!`, '📊');
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
        distributeMultiColumnText(text);
        const activeCnt = (AppState.colCounts && AppState.colCounts[AppState.activeColumnId]) || 3;
        showToast(`Loaded ${file.name} into ${activeCnt} columns!`, '📄');
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
  const textareas = getAllColumnTextareas();
  let maxLines = 1;
  let isAllBlank = true;

  if (textareas.length === 0) {
    const codeVal = occInputCodeEl ? occInputCodeEl.value : '';
    const bldgVal = occInputBldgEl ? occInputBldgEl.value : '';
    const occVal = occInputOccEl ? occInputOccEl.value : '';
    if (codeVal.trim() || bldgVal.trim() || occVal.trim()) isAllBlank = false;
    maxLines = Math.max(codeVal.split('\n').length, bldgVal.split('\n').length, occVal.split('\n').length, 1);
  } else {
    textareas.forEach(ta => {
      if (ta.value.trim()) isAllBlank = false;
      const lines = ta.value.split('\n');
      if (lines.length > maxLines) maxLines = lines.length;
    });
  }

  const numArr = [];
  for (let i = 1; i <= maxLines; i++) {
    numArr.push(i);
  }
  const numbersText = numArr.join('\n');

  if (occupancy3ColContainerEl) {
    occupancy3ColContainerEl.querySelectorAll('.occ-line-numbers').forEach(ln => {
      ln.textContent = numbersText;
    });
  }
  if (occLinesCodeEl) occLinesCodeEl.textContent = numbersText;
  if (occLinesBldgEl) occLinesBldgEl.textContent = numbersText;
  if (occLinesOccEl) occLinesOccEl.textContent = numbersText;

  if (rawCountBadgeEl) {
    rawCountBadgeEl.textContent = `${isAllBlank ? 0 : maxLines} rows`;
  }
}

function distributeMultiColumnText(text) {
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

  // Detect max column count across all pasted rows
  let maxColsInPaste = 1;
  rows.forEach(r => {
    const count = r.split('\t').length;
    if (count > maxColsInPaste) maxColsInPaste = count;
  });

  // Auto-expand column count if user pasted more than current columns
  if (!AppState.colCounts) AppState.colCounts = { occupancy: 3, construction: 3 };
  const curCount = AppState.colCounts[section] || 3;
  if (maxColsInPaste > curCount) {
    AppState.colCounts[section] = maxColsInPaste;
    renderMultiColumnInputs();
  }

  const activeCount = AppState.colCounts[section] || 3;
  const colArrays = Array.from({ length: activeCount }, () => []);

  rows.forEach(r => {
    const cols = r.split('\t');
    if (cols.length >= 3) {
      for (let k = 0; k < activeCount; k++) {
        if (k === activeCount - 1 && cols.length > activeCount) {
          colArrays[k].push(cols.slice(k).join('\t').trim());
        } else {
          colArrays[k].push((cols[k] !== undefined ? cols[k] : '').trim());
        }
      }
    } else if (cols.length === 2) {
      if (/^\d{1,4}$/.test(cols[0].trim())) {
        colArrays[0].push(cols[0].trim());
        colArrays[1].push(cols[1].trim());
        for (let k = 2; k < activeCount; k++) colArrays[k].push('');
      } else {
        colArrays[0].push('');
        colArrays[1].push(cols[0].trim());
        colArrays[2].push(cols[1].trim());
        for (let k = 3; k < activeCount; k++) colArrays[k].push('');
      }
    } else {
      colArrays[0].push('');
      colArrays[1].push(r.trim());
      for (let k = 2; k < activeCount; k++) colArrays[k].push('');
    }
  });

  const textareas = getAllColumnTextareas();
  textareas.forEach((ta, idx) => {
    if (colArrays[idx]) {
      ta.value = colArrays[idx].join('\n');
    }
  });

  updateOccLineNumbers();
  processCleaning();
}
const distribute3ColumnText = distributeMultiColumnText;

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

function saveSymbolsToStorage() {
  try {
    localStorage.setItem('cleanexcel_symbols_to_remove', JSON.stringify(AppState.symbolsToRemove));
  } catch (e) { /* storage not available */ }
}

function renderSymbolChips() {
  if (!symbolsChipsContainerEl) return;
  symbolsChipsContainerEl.innerHTML = '';

  const symbols = AppState.symbolsToRemove || [];
  if (symbolsCountBadgeEl) {
    symbolsCountBadgeEl.textContent = `${symbols.length} Special Character${symbols.length === 1 ? '' : 's'}`;
  }

  if (symbols.length === 0) {
    const emptySpan = document.createElement('span');
    emptySpan.style.cssText = 'color: var(--text-muted); font-size: 11px; font-style: italic; padding: 4px;';
    emptySpan.textContent = 'No symbols configured. Punctuation will not be stripped.';
    symbolsChipsContainerEl.appendChild(emptySpan);
    return;
  }

  symbols.forEach((sym) => {
    const chip = document.createElement('span');
    chip.className = 'symbol-chip';
    chip.title = `Symbol: '${sym}' (Click × to remove)`;

    const charSpan = document.createElement('span');
    charSpan.className = 'symbol-char';
    charSpan.textContent = sym;

    const removeSpan = document.createElement('span');
    removeSpan.className = 'remove-symbol';
    removeSpan.title = `Remove '${sym}' from stripping list`;
    removeSpan.textContent = '×';

    removeSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.symbolsToRemove = AppState.symbolsToRemove.filter(s => s !== sym);
      saveSymbolsToStorage();
      renderSymbolChips();
      processCleaning();
      showToast(`Removed symbol '${sym}'`, '🗑️');
    });

    chip.appendChild(charSpan);
    chip.appendChild(removeSpan);
    symbolsChipsContainerEl.appendChild(chip);
  });
}

function addSymbolsFromInput() {
  if (!newSymbolInputEl) return;
  const raw = newSymbolInputEl.value;
  if (!raw) return;

  // Split into unique non-whitespace characters
  const chars = raw.split('').filter(c => !/\s/.test(c));
  if (chars.length === 0) return;

  let addedCount = 0;
  const current = new Set(AppState.symbolsToRemove || []);
  chars.forEach(c => {
    if (!current.has(c)) {
      current.add(c);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    AppState.symbolsToRemove = Array.from(current);
    saveSymbolsToStorage();
    renderSymbolChips();
    processCleaning();
    showToast(`Added ${addedCount} symbol${addedCount === 1 ? '' : 's'} to removal list`, '✨');
  } else {
    showToast('Symbol(s) already in the removal list', 'ℹ️');
  }
  newSymbolInputEl.value = '';
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
    const allValues = getAllColumnValues();
    const codeVal = allValues[0] !== undefined ? allValues[0] : (occInputCodeEl ? occInputCodeEl.value : '');
    const bldgVal = allValues[1] !== undefined ? allValues[1] : (occInputBldgEl ? occInputBldgEl.value : '');
    const conOrOccVal = allValues[2] !== undefined ? allValues[2] : (occInputOccEl ? occInputOccEl.value : '');
    const extraValArrays = allValues.slice(3).map(v => (v || '').split(/\r\n|\r|\n/));
    const rawVal = rawText;

    const hasData = allValues.some(v => v && v.trim()) || rawVal.trim();
    if (!hasData) {
      AppState.lastCleanedData = [];
      updateCodeFilterDropdown([]);
      refreshOutputView();
      return;
    }

    let inputPayload;
    if (allValues.some(v => v && v.trim())) {
      if (isConstruction) {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          conDescs: conOrOccVal.split(/\r\n|\r|\n/),
          extraCols: extraValArrays,
          extraDescs: extraValArrays,
          allCols: allValues.map(v => (v || '').split(/\r\n|\r|\n/))
        };
      } else {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          occDescs: conOrOccVal.split(/\r\n|\r|\n/),
          extraCols: extraValArrays,
          extraDescs: extraValArrays,
          allCols: allValues.map(v => (v || '').split(/\r\n|\r|\n/))
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
  } else if (AppState.activeColumnId === 'stores' || AppState.activeColumnId === 'stories') {
    cleanerObj = window.NoOfStoresCleaner || (window.CleanersRegistry && window.CleanersRegistry.stores && window.CleanersRegistry.stores.cleaner);
    options = {
      roundUpDecimals: AppState.storesRoundUp !== false,
      pickMax: AppState.storesPickMax !== false,
      alwaysPositive: AppState.storesPositive !== false,
      removeEmptyLines: AppState.storesRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'foundation_type' || AppState.activeColumnId === 'foundationType') {
    cleanerObj = window.FoundationTypeClassifier || (window.CleanersRegistry && window.CleanersRegistry.foundation_type && window.CleanersRegistry.foundation_type.cleaner);
    options = {
      format: AppState.foundationTypeFormat || 'code_only',
      removeEmptyLines: AppState.foundationTypeRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'foundation_connection') {
    cleanerObj = window.FoundationConnectionClassifier || (window.CleanersRegistry && window.CleanersRegistry.foundation_connection && window.CleanersRegistry.foundation_connection.cleaner);
    options = {
      format: AppState.foundationFormat || 'code_only',
      removeEmptyLines: AppState.foundationRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'foundation') {
    cleanerObj = window.FoundationClassifier || (window.CleanersRegistry && window.CleanersRegistry.foundation && window.CleanersRegistry.foundation.cleaner);
    options = {
      format: AppState.foundationFormat || 'code_only',
      removeEmptyLines: AppState.foundationRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'short_column' || AppState.activeColumnId === 'shortColumn') {
    cleanerObj = window.ShortColumnClassifier || (window.CleanersRegistry && window.CleanersRegistry.short_column && window.CleanersRegistry.short_column.cleaner);
    options = {
      format: AppState.shortColumnFormat || 'code_only',
      removeEmptyLines: AppState.shortColumnRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'building_exterior_opening' || AppState.activeColumnId === 'buildingExteriorOpening' || AppState.activeColumnId === 'exterior_opening') {
    cleanerObj = window.BuildingExteriorOpeningClassifier || (window.CleanersRegistry && window.CleanersRegistry.building_exterior_opening && window.CleanersRegistry.building_exterior_opening.cleaner);
    options = {
      format: AppState.buildingExteriorOpeningFormat || 'code_only',
      removeEmptyLines: AppState.buildingExteriorOpeningRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'soft_story' || AppState.activeColumnId === 'softStory') {
    cleanerObj = window.SoftStoryClassifier || (window.CleanersRegistry && window.CleanersRegistry.soft_story && window.CleanersRegistry.soft_story.cleaner);
    options = {
      format: AppState.softStoryFormat || 'code_only',
      removeEmptyLines: AppState.softStoryRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'ornamentation' || AppState.activeColumnId === 'ornament') {
    cleanerObj = window.OrnamentationClassifier || (window.CleanersRegistry && window.CleanersRegistry.ornamentation && window.CleanersRegistry.ornamentation.cleaner);
    options = {
      format: AppState.ornamentationFormat || 'code_only',
      removeEmptyLines: AppState.ornamentationRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'building_shape' || AppState.activeColumnId === 'buildingShape' || AppState.activeColumnId === 'shape') {
    cleanerObj = window.BuildingShapeClassifier || (window.CleanersRegistry && window.CleanersRegistry.building_shape && window.CleanersRegistry.building_shape.cleaner);
    options = {
      format: AppState.buildingShapeFormat || 'code_only',
      removeEmptyLines: AppState.buildingShapeRemoveEmpty
    };
  } else if (AppState.activeColumnId === 'building_condition' || AppState.activeColumnId === 'buildingCondition' || AppState.activeColumnId === 'condition') {
    cleanerObj = window.BuildingConditionClassifier || (window.CleanersRegistry && window.CleanersRegistry.building_condition && window.CleanersRegistry.building_condition.cleaner);
    options = {
      format: AppState.buildingConditionFormat || 'code_only',
      removeEmptyLines: AppState.buildingConditionRemoveEmpty
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
    const headers = [];
    if (AppState.splitIncludeRaw) headers.push('Raw Address');
    headers.push('STREET', 'City', 'State');
    if (AppState.splitIncludeCounty) headers.push('County');
    headers.push('Postal');
    if (AppState.splitIncludeCountry) headers.push('Country');

    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [];
      if (AppState.splitIncludeRaw) row.push(r.original || '');
      row.push(r.street, r.city, r.state);
      if (AppState.splitIncludeCounty) row.push(r.county);
      row.push(r.postal);
      if (AppState.splitIncludeCountry) row.push(r.country);
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (isOccupancy || isConstruction) {
    const section = isConstruction ? 'construction' : 'occupancy';
    let maxCols = AppState.colCounts && AppState.colCounts[section] ? AppState.colCounts[section] : 3;
    dataToCopy.forEach(r => {
      if (r.allCols && r.allCols.length > maxCols) maxCols = r.allCols.length;
      if (r.extraCols && (r.extraCols.length + 3) > maxCols) maxCols = r.extraCols.length + 3;
    });

    const headers = [];
    for (let i = 1; i <= maxCols; i++) {
      const letter = getExcelColLetterFromIndex(i);
      headers.push(`${getColumnHeaderName(i)} (${letter})`);
    }
    headers.push('Touchstone Code', 'Touchstone Category', 'Status');

    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const rowInputs = [];
      if (r.allCols && r.allCols.length >= maxCols) {
        for (let i = 0; i < maxCols; i++) rowInputs.push(r.allCols[i] || '');
      } else {
        rowInputs.push(r.existingCode || '', r.bldgDesc || '', (isConstruction ? r.conDesc : r.occDesc) || '');
        const extras = r.extraCols || [];
        for (let i = 3; i < maxCols; i++) {
          rowInputs.push(extras[i - 3] || '');
        }
      }
      const isEmptyRow = r.status === 'empty';
      const code = isEmptyRow ? '' : (isConstruction ? (r.conCode || '100') : (r.occCode || '300'));
      const category = isEmptyRow ? '' : (r.category || (isConstruction ? 'Unknown' : 'Unknown occupancy'));
      const statusMsg = isEmptyRow ? '' : (r.comparisonMessage || '');
      const row = [...rowInputs, code, category, statusMsg];

      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (isRoof) {
    const headers = ['Raw Roof Input', '1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck', '5. Roof Covering Attachment', '6. Roof Deck Attachment', '7. Roof Anchorage'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.original || '', r.geometryCode || '', r.pitchCode || '', r.coveringCode || '', r.deckCode || '', r.covAttachCode || '', r.deckAttachCode || '', r.anchorageCode || ''];
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
  } else if (AppState.activeColumnId === 'foundation_connection') {
    const headers = ['Raw Foundation Connection', 'Connection Code', 'Connection Name'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.original || '', r.code || r.connectionCode || '', r.shortName || r.name || ''];
      tsvRows.push(row.join('\t'));
      htmlRows.push(`<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    });

    excelText = tsvRows.join('\r\n');
    excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${htmlRows.join('')}</table></body></html>`;
  } else if (AppState.activeColumnId === 'foundation') {
    const headers = ['Raw Foundation Input', '1. Foundation Type', '2. Foundation Connection'];
    const tsvRows = [headers.join('\t')];
    const htmlRows = [`<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`];

    dataToCopy.forEach(r => {
      const row = [r.original || '', r.foundationTypeCode || '', r.connectionCode || ''];
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
window.copyForExcel = copyForExcel;
window.showToast = showToast;

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
    const headers = [];
    if (AppState.splitIncludeRaw) headers.push('Raw Address');
    headers.push('STREET', 'City', 'State');
    if (AppState.splitIncludeCounty) headers.push('County');
    headers.push('Postal');
    if (AppState.splitIncludeCountry) headers.push('Country');

    const sheetRows = [headers];
    dataToExport.forEach(r => {
      const row = [];
      if (AppState.splitIncludeRaw) row.push(r.original || '');
      row.push(r.street, r.city, r.state);
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
  } else if (isOccupancy || isConstruction) {
    const section = isConstruction ? 'construction' : 'occupancy';
    let maxCols = AppState.colCounts && AppState.colCounts[section] ? AppState.colCounts[section] : 3;
    dataToExport.forEach(r => {
      if (r.allCols && r.allCols.length > maxCols) maxCols = r.allCols.length;
      if (r.extraCols && (r.extraCols.length + 3) > maxCols) maxCols = r.extraCols.length + 3;
    });

    const headers = [];
    for (let i = 1; i <= maxCols; i++) {
      const letter = getExcelColLetterFromIndex(i);
      headers.push(`${getColumnHeaderName(i)} (${letter})`);
    }
    headers.push('Touchstone Code', 'Touchstone Category', 'Status');
    const sheetRows = [headers];

    dataToExport.forEach(r => {
      const rowInputs = [];
      if (r.allCols && r.allCols.length >= maxCols) {
        for (let i = 0; i < maxCols; i++) rowInputs.push(r.allCols[i] || '');
      } else {
        rowInputs.push(r.existingCode || '', r.bldgDesc || '', (isConstruction ? r.conDesc : r.occDesc) || '');
        const extras = r.extraCols || [];
        for (let i = 3; i < maxCols; i++) {
          rowInputs.push(extras[i - 3] || '');
        }
      }
      const code = isConstruction ? (r.conCode || '100') : (r.occCode || '300');
      const category = r.category || (isConstruction ? 'Unknown' : 'Unknown occupancy');
      const statusMsg = r.comparisonMessage || '';
      sheetRows.push([...rowInputs, code, category, statusMsg]);
    });

    const sheetName = isConstruction ? "Construction Codes" : "Occupancy Codes";
    const filePrefix = isConstruction ? "Construction_Codes" : "Occupancy_Codes";

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filePrefix}_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}${isConstruction ? 'construction' : 'occupancy'} codes (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${isConstruction ? 'ConstructionCodes' : 'OccupancyCodes'}"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `${filePrefix}_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}${isConstruction ? 'construction' : 'occupancy'} codes (.xls)!`, '📥');
  } else if (isRoof) {
    const headers = ['#', 'Raw Input', '1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck', '5. Roof Covering Attachment', '6. Roof Deck Attachment', '7. Roof Anchorage', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.original || '',
        r.geometryCode || '',
        r.pitchCode || '',
        r.coveringCode || '',
        r.deckCode || '',
        r.covAttachCode || '',
        r.deckAttachCode || '',
        r.anchorageCode || '',
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
  } else if (AppState.activeColumnId === 'foundation_connection') {
    const headers = ['#', 'Raw Foundation Connection', 'Connection Code', 'Connection Name', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.original || '',
        r.code || r.connectionCode || '',
        r.shortName || r.name || '',
        r.statusText || ''
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Foundation Connection");
      XLSX.writeFile(wb, `Foundation_Connection_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}foundation connection records (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="FoundationConnection"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Foundation_Connection_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}foundation connection records (.xls)!`, '📥');
  } else if (AppState.activeColumnId === 'foundation') {
    const headers = ['#', 'Raw Input', '1. Foundation Type', '2. Foundation Connection', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.original || '',
        r.foundationTypeCode || '',
        r.connectionCode || '',
        r.statusText || ''
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Foundation Details");
      XLSX.writeFile(wb, `Foundation_Details_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}foundation details (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="FoundationDetails"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Foundation_Details_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}foundation details (.xls)!`, '📥');
  } else if (AppState.activeColumnId === 'short_column' || AppState.activeColumnId === 'shortColumn') {
    const headers = ['#', 'Raw Input', 'Short Column Code', 'Short Column Status', 'Status'];
    const sheetRows = [headers];
    dataToExport.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.original || '',
        r.code || '',
        r.shortColumnName || '',
        r.statusText || ''
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Short Column");
      XLSX.writeFile(wb, `Short_Column_${getTimestamp()}.xlsx`);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}short column records (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = sheetRows.map(row =>
      `<Row>${row.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="ShortColumn"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
    triggerDownload(xml, `Short_Column_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
    showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}short column records (.xls)!`, '📥');
  } else {
    const isStores = AppState.activeColumnId === 'stores' || AppState.activeColumnId === 'stories';
    const colName = isStores
      ? 'No of Stores'
      : ((window.CleanersRegistry && window.CleanersRegistry[AppState.activeColumnId])
          ? window.CleanersRegistry[AppState.activeColumnId].name
          : 'Cleaned_Street');
    const sheetName = isStores ? 'No of Stores' : 'Cleaned Data';
    const fileName = isStores ? `No_of_Stores_${getTimestamp()}.xlsx` : `Cleaned_${AppState.activeColumnId}_${getTimestamp()}.xlsx`;

    if (typeof XLSX !== 'undefined') {
      const sheetData = [[colName], ...dataToExport.map(r => [r.cleaned])];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, fileName);
      showToast(`Downloaded ${dataToExport.length} ${isFiltered ? 'filtered ' : ''}rows (.xlsx)!`, '📥');
      return;
    }

    const rowsXml = dataToExport.map(r =>
      `<Row><Cell><Data ss:Type="String">${escapeXml(r.cleaned)}</Data></Cell></Row>`
    ).join('');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${isStores ? 'NoOfStores' : 'Cleaned'}"><Table><Row><Cell><Data ss:Type="String">${colName}</Data></Cell></Row>${rowsXml}</Table></Worksheet></Workbook>`;

    triggerDownload(xmlContent, isStores ? `No_of_Stores_${getTimestamp()}.xls` : `Cleaned_${AppState.activeColumnId}_${getTimestamp()}.xls`, 'application/vnd.ms-excel');
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

  // Defense against CSV / Formula Injection (CWE-1236)
  const formatCsvCell = (val) => {
    const s = String(val ?? '');
    const firstChar = s.charAt(0);
    // Neutralize dangerous formula prefixes (=, +, -, @, \t, \r)
    const isFormula = firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r';
    const safeStr = isFormula ? `'${s}` : s;
    return `"${safeStr.replace(/"/g, '""')}"`;
  };

  if (isSplit) {
    const headers = [];
    if (AppState.splitIncludeRaw) headers.push('Raw Address');
    headers.push('STREET', 'City', 'State');
    if (AppState.splitIncludeCounty) headers.push('County');
    headers.push('Postal');
    if (AppState.splitIncludeCountry) headers.push('Country');
    csvLines.push(headers.map(h => formatCsvCell(h)).join(','));

    dataToExport.forEach(r => {
      const row = [];
      if (AppState.splitIncludeRaw) row.push(r.original || '');
      row.push(r.street, r.city, r.state);
      if (AppState.splitIncludeCounty) row.push(r.county);
      row.push(r.postal);
      if (AppState.splitIncludeCountry) row.push(r.country);
      csvLines.push(row.map(c => formatCsvCell(c)).join(','));
    });
  } else if (isOccupancy || isConstruction) {
    const section = isConstruction ? 'construction' : 'occupancy';
    let maxCols = AppState.colCounts && AppState.colCounts[section] ? AppState.colCounts[section] : 3;
    dataToExport.forEach(r => {
      if (r.allCols && r.allCols.length > maxCols) maxCols = r.allCols.length;
      if (r.extraCols && (r.extraCols.length + 3) > maxCols) maxCols = r.extraCols.length + 3;
    });

    const headers = [];
    for (let i = 1; i <= maxCols; i++) {
      const letter = getExcelColLetterFromIndex(i);
      headers.push(`${getColumnHeaderName(i)} (${letter})`);
    }
    headers.push('Touchstone Code', 'Touchstone Category', 'Status');
    csvLines.push(headers.map(h => formatCsvCell(h)).join(','));

    dataToExport.forEach(r => {
      const rowInputs = [];
      if (r.allCols && r.allCols.length >= maxCols) {
        for (let i = 0; i < maxCols; i++) rowInputs.push(r.allCols[i] || '');
      } else {
        rowInputs.push(r.existingCode || '', r.bldgDesc || '', (isConstruction ? r.conDesc : r.occDesc) || '');
        const extras = r.extraCols || [];
        for (let i = 3; i < maxCols; i++) {
          rowInputs.push(extras[i - 3] || '');
        }
      }
      const code = isConstruction ? (r.conCode || '100') : (r.occCode || '300');
      const category = r.category || (isConstruction ? 'Unknown' : 'Unknown occupancy');
      const statusMsg = r.comparisonMessage || '';
      const row = [...rowInputs, code, category, statusMsg];
      csvLines.push(row.map(c => formatCsvCell(c)).join(','));
    });
  } else if (isRoof) {
    const headers = ['Raw Roof Input', '1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck', '5. Roof Covering Attachment', '6. Roof Deck Attachment', '7. Roof Anchorage', 'Status'];
    csvLines.push(headers.map(h => formatCsvCell(h)).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.original || '',
        r.geometryCode || '',
        r.pitchCode || '',
        r.coveringCode || '',
        r.deckCode || '',
        r.covAttachCode || '',
        r.deckAttachCode || '',
        r.anchorageCode || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => formatCsvCell(c)).join(','));
    });
  } else if (isWall) {
    const headers = ['Raw Wall Input', '1. WallType', '2. WallSiding', 'Status'];
    csvLines.push(headers.map(h => formatCsvCell(h)).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.original || '',
        r.wallTypeCode || '',
        r.wallSidingCode || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => formatCsvCell(c)).join(','));
    });
  } else if (AppState.activeColumnId === 'foundation') {
    const headers = ['Raw Foundation Input', '1. Foundation Type', '2. Foundation Connection', 'Status'];
    csvLines.push(headers.map(h => formatCsvCell(h)).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.original || '',
        r.foundationTypeCode || '',
        r.connectionCode || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => formatCsvCell(c)).join(','));
    });
  } else if (AppState.activeColumnId === 'short_column' || AppState.activeColumnId === 'shortColumn') {
    const headers = ['Raw Short Column Input', 'Short Column Code', 'Short Column Status', 'Status'];
    csvLines.push(headers.map(h => formatCsvCell(h)).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.original || '',
        r.code || '',
        r.shortColumnName || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => formatCsvCell(c)).join(','));
    });
  } else if (isRoofYear) {
    const headers = ['Year Built', 'Roof Year Built (Input)', 'Cleaned Roof Year Built', 'Status'];
    csvLines.push(headers.map(h => formatCsvCell(h)).join(','));

    dataToExport.forEach(r => {
      const row = [
        r.yearBuilt || r.rawYearBuilt || '',
        r.roofYearBuilt || r.rawRoofYearBuilt || '',
        r.cleaned || '',
        r.statusText || ''
      ];
      csvLines.push(row.map(c => formatCsvCell(c)).join(','));
    });
  } else {
    const isStores = AppState.activeColumnId === 'stores' || AppState.activeColumnId === 'stories';
    const colName = isStores
      ? 'No of Stores'
      : ((window.CleanersRegistry && window.CleanersRegistry[AppState.activeColumnId])
          ? window.CleanersRegistry[AppState.activeColumnId].name
          : 'Cleaned_Street');

    csvLines.push(formatCsvCell(colName));
    dataToExport.forEach(r => {
      csvLines.push(formatCsvCell(r.cleaned));
    });
  }

  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const isStores = AppState.activeColumnId === 'stores' || AppState.activeColumnId === 'stories';
  const isFoundation = AppState.activeColumnId === 'foundation';
  const filenamePrefix = isSplit ? 'Separated_Addresses' : isOccupancy ? 'Occupancy_Codes' : isConstruction ? 'Construction_Codes' : isRoofYear ? 'Roof_Year_Built' : isRoof ? 'Roof_Details' : isWall ? 'Exterior_Wall_Details' : isFoundation ? 'Foundation_Details' : isStores ? 'No_of_Stores' : 'Cleaned_' + AppState.activeColumnId;
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
  if (columnId === 'stores' || columnId === 'stories') {
    const sample = SampleDatasets.stores;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 22 No of Stores underwriting sample records!', '🏢');
    return;
  }
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
  if (columnId === 'foundation') {
    const sample = SampleDatasets.foundation;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 19 Foundation Type & Connection sample records!', '🏛️');
    return;
  }
  if (columnId === 'short_column' || columnId === 'shortColumn') {
    const sample = SampleDatasets.short_column;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 15 Short Column sample records!', '🏛️');
    return;
  }
  if (columnId === 'building_exterior_opening' || columnId === 'buildingExteriorOpening' || columnId === 'exterior_opening') {
    const sample = SampleDatasets.building_exterior_opening;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 16 Building Exterior Opening sample records!', '🪟');
    return;
  }
  if (columnId === 'soft_story' || columnId === 'softStory') {
    const sample = SampleDatasets.soft_story;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 15 Soft Story sample records!', '🏠');
    return;
  }
  if (columnId === 'foundation_type' || columnId === 'foundationType') {
    const sample = SampleDatasets.foundation_type;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 17 Foundation Type sample records!', '🏛️');
    return;
  }
  if (columnId === 'foundation_connection') {
    const sample = SampleDatasets.foundation_connection;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 16 Foundation Connection sample records!', '🔗');
    return;
  }
  if (columnId === 'ornamentation' || columnId === 'ornament') {
    const sample = SampleDatasets.ornamentation;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 11 Ornamentation sample records!', '🏛️');
    return;
  }
  if (columnId === 'building_shape' || columnId === 'buildingShape' || columnId === 'shape') {
    const sample = SampleDatasets.building_shape;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 26 Building Shape sample records!', '📐');
    return;
  }
  if (columnId === 'building_condition' || columnId === 'buildingCondition' || columnId === 'condition') {
    const sample = SampleDatasets.building_condition;
    rawInputEl.value = sample;
    updateLineNumbers();
    processCleaning();
    showToast('Loaded 20 Building Condition sample records!', '🏗️');
    return;
  }
  const sample = SampleDatasets[columnId] || SampleDatasets.street;
  rawInputEl.value = sample;
  updateLineNumbers();
  processCleaning();
}

function showToast(message, icon = '✓', action = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  let actionHtml = '';
  if (action && action.text) {
    actionHtml = `<button type="button" class="toast-action-btn">${escapeHtml(action.text)}</button>`;
  }

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg-text">${message}</span>
    ${actionHtml}
  `;

  if (action && typeof action.onClick === 'function') {
    const btn = toast.querySelector('.toast-action-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
        toast.classList.remove('show');
        setTimeout(() => { if (toast.remove) toast.remove(); }, 200);
      });
    }
  }

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  const duration = action ? 6000 : 3200;
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.remove) {
        toast.remove();
      } else if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
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
 * Execute AI Processing across all CleanExcel sections
 */
async function triggerGeminiAI() {
  if (!window.GeminiService) {
    showToast('AI service not initialized', '❌');
    return;
  }

  const provider = window.GeminiService.getProvider();
  const pInfo = window.GeminiService.getProviderInfo(provider);
  const modelInfo = window.GeminiService.getModelInfo();

  if (!window.GeminiService.isConfigured()) {
    showToast(`Please enter your ${pInfo.name} API key in AI Settings to use AI features`, '🔑');
    updateGeminiModalUI();
    if (geminiModalEl) geminiModalEl.style.display = 'flex';
    if (geminiApiKeyInputEl) geminiApiKeyInputEl.focus();
    return;
  }

  const isSplit = AppState.activeColumnId === 'split';
  const isOccupancy = AppState.activeColumnId === 'occupancy';
  const isConstruction = AppState.activeColumnId === 'construction';
  const isRoofYear = AppState.activeColumnId === 'roof_year';
  const isRoof = AppState.activeColumnId === 'roof';
  const isWall = AppState.activeColumnId === 'wall';
  const isFoundation = AppState.activeColumnId === 'foundation';
  const isShortColumn = AppState.activeColumnId === 'short_column' || AppState.activeColumnId === 'shortColumn';
  const isSoftStory = AppState.activeColumnId === 'soft_story' || AppState.activeColumnId === 'softStory';
  const isOrnamentation = AppState.activeColumnId === 'ornamentation' || AppState.activeColumnId === 'ornament';
  const isBuildingShape = AppState.activeColumnId === 'building_shape' || AppState.activeColumnId === 'buildingShape' || AppState.activeColumnId === 'shape';
  const isBuildingCondition = AppState.activeColumnId === 'building_condition' || AppState.activeColumnId === 'buildingCondition' || AppState.activeColumnId === 'condition';
  const isYear = AppState.activeColumnId === 'year';
  const isStores = AppState.activeColumnId === 'stores' || AppState.activeColumnId === 'stories';
  const isName = AppState.activeColumnId === 'name';
  const isPhone = AppState.activeColumnId === 'phone';
  const isEmail = AppState.activeColumnId === 'email';

  const rawText = rawInputEl ? rawInputEl.value : '';

  // Validate input presence based on active section
  let hasInputData = false;
  if (isOccupancy || isConstruction) {
    const allValues = getAllColumnValues();
    hasInputData = allValues.some(v => v && v.trim()) || Boolean(rawText.trim());
  } else if (isRoofYear) {
    const ybVal = roofYearInputYbEl ? roofYearInputYbEl.value : '';
    const ryVal = roofYearInputRyEl ? roofYearInputRyEl.value : '';
    hasInputData = Boolean(ybVal.trim()) || Boolean(ryVal.trim()) || Boolean(rawText.trim());
  } else {
    hasInputData = Boolean(rawText.trim());
  }

  if (!hasInputData) {
    if (isOccupancy || isConstruction) {
      showToast('Please paste or enter descriptions into the columns first', '⚠️');
    } else if (isRoofYear) {
      showToast('Please paste Year Built and Roof Year columns first', '⚠️');
    } else {
      showToast('Please paste or type data first', '⚠️');
    }
    return;
  }

  const lines = rawText.split(/\r\n|\r|\n/);

  if (aiLoadingOverlayEl) {
    if (aiLoadingTitleEl) {
      const headerPrefix = `${pInfo.icon} ${pInfo.name} (${modelInfo.label})`;
      if (isSplit) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is parsing addresses worldwide...`;
      } else if (isOccupancy) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing occupancy descriptions...`;
      } else if (isConstruction) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing construction descriptions...`;
      } else if (isRoofYear) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is validating Roof Year Built against Year Built...`;
      } else if (isRoof) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing roof descriptions...`;
      } else if (isWall) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing exterior wall materials...`;
      } else if (isFoundation) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing foundation types & connections...`;
      } else if (isShortColumn) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing Short Column conditions...`;
      } else if (isSoftStory) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing Soft Story conditions...`;
      } else if (isOrnamentation) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing facade ornamentation & parapets...`;
      } else if (isBuildingShape) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is analyzing building footprint geometries...`;
      } else if (isYear) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is validating Year Built records...`;
      } else if (isStores) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is normalizing Number of Stories / Floors...`;
      } else if (isName) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is standardizing Full Names...`;
      } else if (isPhone) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is standardizing Phone Numbers...`;
      } else if (isEmail) {
        aiLoadingTitleEl.textContent = `${headerPrefix} is validating and cleaning Email Addresses...`;
      } else {
        aiLoadingTitleEl.textContent = `${headerPrefix} is cleaning street addresses...`;
      }
    }
    if (aiLoadingSubtitleEl) {
      if (isSplit) {
        aiLoadingSubtitleEl.textContent = 'Applying knowledge of UK postcodes, German PLZ, Canadian provinces & US Counties';
      } else if (isOccupancy) {
        aiLoadingSubtitleEl.textContent = 'Matching UNICEDE® Touchstone codes across commercial & residential categories';
      } else if (isConstruction) {
        aiLoadingSubtitleEl.textContent = 'Matching UNICEDE® Touchstone codes across 224 structural construction categories';
      } else if (isRoofYear) {
        aiLoadingSubtitleEl.textContent = 'Enforcing Roof Year ≥ Year Built (never less) & selecting higher candidate year';
      } else if (isRoof) {
        aiLoadingSubtitleEl.textContent = 'Classifying all 7 Touchstone UNICEDE® fields (Geometry, Pitch, Covering, Deck, Covering & Deck Attachments, Anchorage)';
      } else if (isWall) {
        aiLoadingSubtitleEl.textContent = 'Separating WallType & WallSiding with Touchstone UNICEDE® underwriting rules';
      } else if (isFoundation) {
        aiLoadingSubtitleEl.textContent = 'Classifying Foundation Type (Codes 0–12) & Foundation Connection (Codes 0–3)';
      } else if (isShortColumn) {
        aiLoadingSubtitleEl.textContent = 'Classifying Touchstone UNICEDE® Short Column (0: Unknown, 1: No, 2: Yes) for CA/HI/JP/US EQ';
      } else if (isSoftStory) {
        aiLoadingSubtitleEl.textContent = 'Classifying Touchstone UNICEDE® Soft Story (0: Unknown, 1: No, 2: Yes) for CA/HI/JP/NZ/US EQ';
      } else if (isOrnamentation) {
        aiLoadingSubtitleEl.textContent = 'Classifying Touchstone UNICEDE® Ornamentation (0: Unknown, 1: None, 2: Average, 3: Extensive) for CA/HI/JP/US EQ';
      } else if (isBuildingShape) {
        aiLoadingSubtitleEl.textContent = 'Classifying Touchstone UNICEDE® Building Shape (Codes 0–8: Square, Rect, Circular, L/T/U/H, Complex)';
      } else if (isYear) {
        aiLoadingSubtitleEl.textContent = 'Enforcing 1753–2026 range & selecting lesser/older construction year for multi-year entries';
      } else if (isStores) {
        aiLoadingSubtitleEl.textContent = 'Enforcing positive whole numbers (round up) & picking maximum on ranges';
      } else if (isName) {
        aiLoadingSubtitleEl.textContent = 'Removing honorifics, titles, and cleaning noise characters into Title Case';
      } else if (isPhone) {
        aiLoadingSubtitleEl.textContent = 'Formatting 10-digit standard numbers and cleaning noise symbols';
      } else if (isEmail) {
        aiLoadingSubtitleEl.textContent = 'Trimming whitespace, syntax checking and standardizing lowercase emails';
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
        defaultCountry: AppState.splitIncludeCountry ? AppState.splitDefaultCountry : 'US',
        removeEmptyLines: AppState.splitRemoveEmpty
      });
    } else if (isOccupancy) {
      let inputPayload;
      const allValues = getAllColumnValues();
      const codeVal = allValues[0] !== undefined ? allValues[0] : (occInputCodeEl ? occInputCodeEl.value : '');
      const bldgVal = allValues[1] !== undefined ? allValues[1] : (occInputBldgEl ? occInputBldgEl.value : '');
      const occVal = allValues[2] !== undefined ? allValues[2] : (occInputOccEl ? occInputOccEl.value : '');
      const extraCols = allValues.slice(3).map(v => (v || '').split(/\r\n|\r|\n/));

      if (allValues.some(v => v && v.trim())) {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          occDescs: occVal.split(/\r\n|\r|\n/),
          extraCols: extraCols,
          allCols: allValues.map(v => (v || '').split(/\r\n|\r|\n/))
        };
      } else {
        inputPayload = lines;
      }
      results = await window.GeminiService.classifyOccupancyWithAI(inputPayload, {
        removeEmptyLines: AppState.occRemoveEmpty
      });
    } else if (isConstruction) {
      let inputPayload;
      const allValues = getAllColumnValues();
      const codeVal = allValues[0] !== undefined ? allValues[0] : (occInputCodeEl ? occInputCodeEl.value : '');
      const bldgVal = allValues[1] !== undefined ? allValues[1] : (occInputBldgEl ? occInputBldgEl.value : '');
      const conVal = allValues[2] !== undefined ? allValues[2] : (occInputOccEl ? occInputOccEl.value : '');
      const extraCols = allValues.slice(3).map(v => (v || '').split(/\r\n|\r|\n/));

      if (allValues.some(v => v && v.trim())) {
        inputPayload = {
          existingCodes: codeVal.split(/\r\n|\r|\n/),
          bldgDescs: bldgVal.split(/\r\n|\r|\n/),
          conDescs: conVal.split(/\r\n|\r|\n/),
          extraCols: extraCols,
          allCols: allValues.map(v => (v || '').split(/\r\n|\r|\n/))
        };
      } else {
        inputPayload = lines;
      }
      results = await window.GeminiService.classifyConstructionWithAI(inputPayload, {
        removeEmptyLines: AppState.conRemoveEmpty
      });
    } else if (isRoofYear) {
      let inputPayload;
      const ybVal = roofYearInputYbEl ? roofYearInputYbEl.value : '';
      const ryVal = roofYearInputRyEl ? roofYearInputRyEl.value : '';
      if (ybVal.trim() || ryVal.trim()) {
        inputPayload = {
          yearBuilt: ybVal.split(/\r\n|\r|\n/),
          roofYearBuilt: ryVal.split(/\r\n|\r|\n/)
        };
      } else {
        inputPayload = rawText;
      }
      results = await window.GeminiService.classifyRoofYearWithAI(inputPayload, {
        minYear: AppState.yearMin || 1753,
        maxYear: AppState.yearMax || new Date().getFullYear(),
        ruleMode: AppState.roofYearRuleMode || 'roof_ge_yb',
        removeEmptyLines: AppState.roofYearRemoveEmpty
      });
    } else if (isRoof) {
      results = await window.GeminiService.classifyRoofWithAI(lines, {
        format: AppState.roofFormat || 'code_only',
        removeEmptyLines: AppState.roofRemoveEmpty
      });
    } else if (isWall) {
      results = await window.GeminiService.cleanWallsWithAI(lines, {
        format: AppState.wallFormat || 'code_only',
        removeEmptyLines: AppState.wallRemoveEmpty
      });
    } else if (AppState.activeColumnId === 'foundation_type' || AppState.activeColumnId === 'foundationType') {
      results = await (window.GeminiService.classifyFoundationTypeWithAI || window.GeminiService.classifyFoundationWithAI).call(window.GeminiService, lines, {
        format: AppState.foundationTypeFormat || 'code_only',
        removeEmptyLines: AppState.foundationTypeRemoveEmpty
      });
    } else if (isFoundation) {
      results = await window.GeminiService.classifyFoundationWithAI(lines, {
        format: AppState.foundationFormat || 'code_only',
        removeEmptyLines: AppState.foundationRemoveEmpty
      });
    } else if (isShortColumn) {
      results = await window.GeminiService.classifyShortColumnWithAI(lines, {
        format: AppState.shortColumnFormat || 'code_only',
        removeEmptyLines: AppState.shortColumnRemoveEmpty
      });
    } else if (isSoftStory) {
      results = await (window.GeminiService.cleanSoftStoryWithAI || window.GeminiService.classifySoftStoryWithAI).call(window.GeminiService, lines, {
        format: AppState.softStoryFormat || 'code_only',
        removeEmptyLines: AppState.softStoryRemoveEmpty
      });
    } else if (isOrnamentation) {
      results = await (window.GeminiService.cleanOrnamentationWithAI || window.GeminiService.classifyOrnamentationWithAI).call(window.GeminiService, lines, {
        format: AppState.ornamentationFormat || 'code_only',
        removeEmptyLines: AppState.ornamentationRemoveEmpty
      });
    } else if (isBuildingShape) {
      results = await (window.GeminiService.cleanBuildingShapeWithAI || window.GeminiService.classifyBuildingShapeWithAI).call(window.GeminiService, lines, {
        format: AppState.buildingShapeFormat || 'code_only',
        removeEmptyLines: AppState.buildingShapeRemoveEmpty
      });
    } else if (isBuildingCondition) {
      results = await (window.GeminiService.cleanBuildingConditionWithAI || window.GeminiService.classifyBuildingConditionWithAI).call(window.GeminiService, lines, {
        format: AppState.buildingConditionFormat || 'code_only',
        removeEmptyLines: AppState.buildingConditionRemoveEmpty
      });
    } else if (isYear) {
      results = await window.GeminiService.parseYearWithAI(lines, {
        minYear: AppState.yearMin || 1753,
        maxYear: AppState.yearMax || new Date().getFullYear(),
        removeEmptyLines: AppState.yearRemoveEmpty
      });
    } else if (isStores) {
      results = await window.GeminiService.cleanStoresWithAI(lines, {
        roundUpDecimals: AppState.storesRoundUp !== false,
        pickMax: AppState.storesPickMax !== false,
        alwaysPositive: AppState.storesPositive !== false,
        removeEmptyLines: AppState.storesRemoveEmpty
      });
    } else if (isName) {
      results = await window.GeminiService.cleanNamesWithAI(lines, {
        removeEmptyLines: AppState.removeEmptyLines
      });
    } else if (isPhone) {
      results = await window.GeminiService.cleanPhonesWithAI(lines, {
        removeEmptyLines: AppState.removeEmptyLines
      });
    } else if (isEmail) {
      results = await window.GeminiService.cleanEmailsWithAI(lines, {
        removeEmptyLines: AppState.removeEmptyLines
      });
    } else {
      results = await window.GeminiService.cleanStreetsWithAI(lines, {
        casing: AppState.casing,
        removeEmptyLines: AppState.removeEmptyLines
      });
    }

    AppState.lastCleanedData = results;
    updateCodeFilterDropdown(results);
    refreshOutputView();

    showToast(`✨ Successfully processed ${results.length} rows with ${pInfo.name} (${modelInfo.label})!`, '🤖');
  } catch (err) {
    console.error('AI Processing error:', err);
    showToast(`AI error: ${err.message}`, '❌');
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
  const SECTIONS = ['occupancy', 'construction', 'roof', 'wall', 'foundation-type', 'foundation', 'short-column', 'soft-story', 'ornamentation', 'building-shape', 'building-condition'];

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

  // Expose global openCodeExplorer helper
  window.openCodeExplorer = function(targetTab = null, searchQuery = '') {
    openExplorer(targetTab);
    if (searchQuery && explorerSearchInput) {
      explorerSearchInput.value = searchQuery;
      if (explorerClearBtn) explorerClearBtn.style.display = 'inline-block';
      renderExplorerCards();
    }
  };

  const btnMemoryModal = document.getElementById('btn-memory-modal');

  function syncMemoryBadge() {
    if (window.CustomCodesDB) {
      const stats = window.CustomCodesDB.getStats();
      const count = stats.totalLearned || 0;
      const headerText = document.getElementById('header-memory-text');
      if (headerText) {
        headerText.textContent = count > 0 ? `Memory (${count})` : 'Memory';
      }
      const tabBadge = document.getElementById('badge-learned-count');
      if (tabBadge) {
        tabBadge.textContent = String(count);
      }
    }
  }

  // Sync on startup and on database update events
  syncMemoryBadge();
  window.addEventListener('cleanexcel:custom_db_updated', syncMemoryBadge);

  if (btnMemoryModal) {
    btnMemoryModal.addEventListener('click', () => openExplorer('learned'));
  }

  if (btnOpenHeader) btnOpenHeader.addEventListener('click', () => openExplorer());
  if (btnOpenInput) btnOpenInput.addEventListener('click', () => openExplorer());
  if (btnCloseExplorer) btnCloseExplorer.addEventListener('click', closeExplorer);
  if (btnCloseExplorerFooter) btnCloseExplorerFooter.addEventListener('click', closeExplorer);

  document.querySelectorAll('.btn-open-universal-finder, .footer-btn-trigger-finder').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tab = btn.getAttribute('data-tab');
      openExplorer(tab);
    });
  });

  document.querySelectorAll('.footer-btn-trigger-ai').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const openGeminiModalBtn = document.getElementById('btn-gemini-modal');
      if (openGeminiModalBtn) openGeminiModalBtn.click();
    });
  });

  document.querySelectorAll('.footer-btn-trigger-memory').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openExplorer('learned');
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

  const btnModalDetailEdit = document.getElementById('btn-modal-detail-edit');
  if (btnModalDetailEdit) {
    btnModalDetailEdit.addEventListener('click', () => {
      if (currentDetailItem) {
        const item = currentDetailItem;
        closeDetailModal();
        openCodeEditor(currentExplorerTab, item, false);
      }
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

  // 3b. Setup Custom Code Database Editor Modal
  const editorModal = document.getElementById('code-editor-modal');
  const formCodeEditor = document.getElementById('form-code-editor');
  const btnCloseCodeEditor = document.getElementById('btn-close-code-editor');
  const btnCloseCodeEditorFooter = document.getElementById('btn-close-code-editor-footer');
  const btnSaveCodeEditor = document.getElementById('btn-save-code-editor');
  const btnEditorResetCode = document.getElementById('btn-editor-reset-code');
  const btnEditorDeleteCode = document.getElementById('btn-editor-delete-code');

  const editorSectionInput = document.getElementById('editor-section');
  const editorIsNewInput = document.getElementById('editor-is-new');
  const editorCodeInput = document.getElementById('editor-code-input');
  const editorCategoryInput = document.getElementById('editor-category-input');
  const editorGroupInput = document.getElementById('editor-group-input');
  const editorDescInput = document.getElementById('editor-desc-input');
  const editorKeywordsInput = document.getElementById('editor-keywords-input');
  const editorModalTitle = document.getElementById('code-editor-modal-title');
  const editorAlertBox = document.getElementById('editor-alert-box');

  function openCodeEditor(section = 'occupancy', item = null, isNew = false) {
    if (!editorModal) return;
    const sec = (section === 'construction') ? 'construction' : 'occupancy';
    if (editorSectionInput) editorSectionInput.value = sec;
    if (editorIsNewInput) editorIsNewInput.value = isNew ? 'true' : 'false';

    if (editorAlertBox) {
      editorAlertBox.style.display = 'none';
      editorAlertBox.textContent = '';
    }

    if (isNew || !item) {
      if (editorModalTitle) editorModalTitle.textContent = `➕ Add New ${sec === 'construction' ? 'Construction' : 'Occupancy'} Code`;
      if (editorCodeInput) {
        editorCodeInput.value = '';
        editorCodeInput.removeAttribute('readonly');
      }
      if (editorCategoryInput) editorCategoryInput.value = '';
      if (editorGroupInput) editorGroupInput.value = '';
      if (editorDescInput) editorDescInput.value = '';
      if (editorKeywordsInput) editorKeywordsInput.value = '';
      if (btnEditorResetCode) btnEditorResetCode.style.display = 'none';
      if (btnEditorDeleteCode) btnEditorDeleteCode.style.display = 'none';
    } else {
      if (editorModalTitle) editorModalTitle.textContent = `✏️ Edit ${sec === 'construction' ? 'Construction' : 'Occupancy'} Code ${item.code}`;
      if (editorCodeInput) {
        editorCodeInput.value = item.code || '';
        editorCodeInput.setAttribute('readonly', 'true');
      }
      if (editorCategoryInput) editorCategoryInput.value = item.category || item.name || '';
      if (editorGroupInput) editorGroupInput.value = item.group || item.subSection || '';
      if (editorDescInput) editorDescInput.value = item.description || '';
      if (editorKeywordsInput) {
        editorKeywordsInput.value = Array.isArray(item.keywords) ? item.keywords.join(', ') : (item.keywords || '');
      }

      if (item.isCustom) {
        if (btnEditorResetCode) btnEditorResetCode.style.display = 'none';
        if (btnEditorDeleteCode) btnEditorDeleteCode.style.display = 'inline-block';
      } else if (item.isModified) {
        if (btnEditorResetCode) btnEditorResetCode.style.display = 'inline-block';
        if (btnEditorDeleteCode) btnEditorDeleteCode.style.display = 'none';
      } else {
        if (btnEditorResetCode) btnEditorResetCode.style.display = 'none';
        if (btnEditorDeleteCode) btnEditorDeleteCode.style.display = 'none';
      }
    }

    editorModal.style.display = 'flex';
    setTimeout(() => {
      if (isNew && editorCodeInput) {
        editorCodeInput.focus();
      } else if (editorCategoryInput) {
        editorCategoryInput.focus();
      }
    }, 80);
  }

  function closeCodeEditor() {
    if (editorModal) editorModal.style.display = 'none';
  }

  function handleSaveCodeEditor() {
    const sec = editorSectionInput ? editorSectionInput.value : 'occupancy';
    const code = (editorCodeInput ? editorCodeInput.value : '').trim();
    const category = (editorCategoryInput ? editorCategoryInput.value : '').trim();
    const group = (editorGroupInput ? editorGroupInput.value : '').trim();
    const description = (editorDescInput ? editorDescInput.value : '').trim();
    const keywords = (editorKeywordsInput ? editorKeywordsInput.value : '').trim();

    if (!code) {
      alert('Please enter a valid code identifier (e.g. 399, 113).');
      if (editorCodeInput) editorCodeInput.focus();
      return;
    }
    if (!category) {
      alert('Please enter a category / classification name.');
      if (editorCategoryInput) editorCategoryInput.focus();
      return;
    }

    if (window.CustomCodesDB) {
      window.CustomCodesDB.saveCode(sec, code, {
        category,
        group,
        description,
        keywords
      });
    }

    if (window.CodeFinder) {
      window.CodeFinder.clearCache();
    }

    closeCodeEditor();
    renderExplorerCards();
    showToast(`Saved Code ${code} (${category}) to Database!`, '💾');

    // Trigger re-clean if active tab matches
    if (typeof processCleaning === 'function') {
      processCleaning();
    }
  }

  if (btnSaveCodeEditor) {
    btnSaveCodeEditor.addEventListener('click', (e) => {
      e.preventDefault();
      handleSaveCodeEditor();
    });
  }

  if (formCodeEditor) {
    formCodeEditor.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveCodeEditor();
    });
  }

  if (btnCloseCodeEditor) btnCloseCodeEditor.addEventListener('click', closeCodeEditor);
  if (btnCloseCodeEditorFooter) btnCloseCodeEditorFooter.addEventListener('click', closeCodeEditor);

  if (editorModal) {
    editorModal.addEventListener('click', (e) => {
      if (e.target === editorModal) closeCodeEditor();
    });
  }

  if (btnEditorResetCode) {
    btnEditorResetCode.addEventListener('click', () => {
      const sec = editorSectionInput ? editorSectionInput.value : 'occupancy';
      const code = (editorCodeInput ? editorCodeInput.value : '').trim();
      if (!code) return;
      if (confirm(`Revert Code ${code} back to standard Touchstone UNICEDE® defaults?`)) {
        if (window.CustomCodesDB) window.CustomCodesDB.resetCode(sec, code);
        if (window.CodeFinder) window.CodeFinder.clearCache();
        closeCodeEditor();
        renderExplorerCards();
        showToast(`Reverted Code ${code} to factory default.`, '🔄');
        if (typeof processCleaning === 'function') processCleaning();
      }
    });
  }

  if (btnEditorDeleteCode) {
    btnEditorDeleteCode.addEventListener('click', () => {
      const sec = editorSectionInput ? editorSectionInput.value : 'occupancy';
      const code = (editorCodeInput ? editorCodeInput.value : '').trim();
      if (!code) return;
      if (confirm(`Delete custom Code ${code} from your database?`)) {
        if (window.CustomCodesDB) window.CustomCodesDB.deleteCode(sec, code);
        if (window.CodeFinder) window.CodeFinder.clearCache();
        closeCodeEditor();
        renderExplorerCards();
        showToast(`Deleted custom Code ${code}.`, '🗑️');
        if (typeof processCleaning === 'function') processCleaning();
      }
    });
  }

  // 3c. Setup Database Toolbar Actions (Add, Export, Import, Reset All)
  const btnDbAddCode = document.getElementById('btn-db-add-code');
  const btnDbExport = document.getElementById('btn-db-export-json');
  const inputDbImport = document.getElementById('input-db-import-file');
  const btnDbResetAll = document.getElementById('btn-db-reset-all');

  if (btnDbAddCode) {
    btnDbAddCode.addEventListener('click', () => {
      openCodeEditor(currentExplorerTab, null, true);
    });
  }

  document.querySelectorAll('.btn-open-add-code').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tab = btn.getAttribute('data-tab') || 'occupancy';
      openExplorer(tab);
      openCodeEditor(tab, null, true);
    });
  });

  if (btnDbExport) {
    btnDbExport.addEventListener('click', () => {
      if (!window.CustomCodesDB) return;
      const jsonStr = window.CustomCodesDB.exportCompleteMasterJSON(true);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CleanExcel_Underwriting_Taxonomy_DB_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Database exported successfully as JSON file!', '📥');
    });
  }

  if (inputDbImport) {
    inputDbImport.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target.result;
          if (window.CustomCodesDB) {
            const res = window.CustomCodesDB.importDatabaseJSON(content);
            if (window.CodeFinder) window.CodeFinder.clearCache();
            renderExplorerCards();
            showToast(`Imported ${res.count} custom classifications successfully!`, '📂');
            if (typeof processCleaning === 'function') processCleaning();
          }
        } catch (err) {
          alert('Failed to import database JSON: ' + err.message);
        }
        inputDbImport.value = '';
      };
      reader.readAsText(file);
    });
  }

  if (btnDbResetAll) {
    btnDbResetAll.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all custom codes and edits back to factory Touchstone UNICEDE defaults?')) {
        if (window.CustomCodesDB) window.CustomCodesDB.resetAll();
        if (window.CodeFinder) window.CodeFinder.clearCache();
        renderExplorerCards();
        showToast('Reset database to standard Touchstone UNICEDE defaults.', '🔄');
        if (typeof processCleaning === 'function') processCleaning();
      }
    });
  }

  // Global helper for opening badge details from React comparison table
  window.openCodeDetailByBadge = function(code, section, subSection) {
    if (!window.CodeFinder || !code) return;
    const found = window.CodeFinder.getByCode(code, section, subSection);
    if (found) {
      openDetailModal(found);
    } else {
      showToast(`Touchstone UNICEDE® Code: ${code}`, 'ℹ️');
    }
  };

  // Global helper to save row keyword-to-code mapping to Custom Database
  window.saveRowToCustomDB = function(section, rowData, callback) {
    if (!rowData) return;
    const isConstruction = section === 'construction';
    const code = isConstruction ? rowData.conCode : rowData.occCode;

    // Extract all candidate keywords from row
    const candidateKeywords = [];
    const rawCols = [
      rowData.col1,
      rowData.col2,
      rowData.col3,
      rowData.existingCode,
      rowData.bldgDesc,
      rowData.occDesc,
      rowData.conDesc,
      ...(Array.isArray(rowData.extraCols) ? rowData.extraCols : []),
      ...(Array.isArray(rowData.allCols) ? rowData.allCols : [])
    ];
    rawCols.forEach(col => {
      const val = String(col || '').trim();
      if (val && val !== '—' && val !== '-' && val.toLowerCase() !== 'n/a' && !/^\d{3,4}$/.test(val)) {
        if (!candidateKeywords.includes(val)) candidateKeywords.push(val);
      }
    });

    if (candidateKeywords.length === 0 && rowData.original) {
      const orig = String(rowData.original).trim();
      if (orig && !/^\d{3,4}$/.test(orig)) candidateKeywords.push(orig);
    }

    const mainKeyword = candidateKeywords[0] || (rowData.original ? rowData.original.trim() : '');

    if (!code || code === '100' || code === '300' || code === '—' || code === '-') {
      // If code is unknown / missing, open the custom code editor with keywords prefilled so user can assign it
      if (typeof openCodeEditor === 'function') {
        openCodeEditor(section, null, true);
        const editorKwEl = document.getElementById('editor-code-keywords');
        if (editorKwEl) editorKwEl.value = candidateKeywords.join(', ');
        showToast(`Select or create a code for "${mainKeyword || 'this keyword'}"`, 'ℹ️', {
          text: '📂 View Database',
          onClick: () => window.openCodeExplorer(section)
        });
      }
      if (callback) callback(false, false);
      return;
    }

    // Check if keyword mapping is ALREADY saved in Database
    const alreadySaved = window.CustomCodesDB && window.CustomCodesDB.hasKeyword(section, code, candidateKeywords);
    if (alreadySaved) {
      // DO NOT save duplicate again. Show popup notice with action button to view all database data!
      showToast(`✨ "${mainKeyword || 'This rule'}" is ALREADY SAVED in Database under Code ${code} (${rowData.category || 'Class'})!`, '💾', {
        text: '📂 View Database Data',
        onClick: () => window.openCodeExplorer(section, mainKeyword || code)
      });
      if (callback) callback(true, true);
      return;
    }

    if (window.CustomCodesDB) {
      window.CustomCodesDB.addKeyword(section, code, candidateKeywords, {
        category: rowData.category,
        group: rowData.group
      });

      // Self-train into persistent memory
      if (window.CustomCodesDB.learn && mainKeyword) {
        if (section === 'occupancy') {
          window.CustomCodesDB.learn('occupancy', mainKeyword, { code, category: rowData.category || '' }, 'user_fix');
        } else if (section === 'construction') {
          window.CustomCodesDB.learn('construction', mainKeyword, { code, category: rowData.category || '', group: rowData.group || '' }, 'user_fix');
        } else if (section === 'roof') {
          window.CustomCodesDB.learn('roof', mainKeyword, {
            geometryCode: rowData.geometryCode || '0',
            pitchCode: rowData.pitchCode || '0',
            coveringCode: rowData.coveringCode || '0',
            deckCode: rowData.deckCode || '0',
            covAttachCode: rowData.covAttachCode || '0',
            deckAttachCode: rowData.deckAttachCode || '0',
            anchorageCode: rowData.anchorageCode || '0'
          }, 'user_fix');
        } else if (section === 'wall') {
          window.CustomCodesDB.learn('wall', mainKeyword, {
            wallTypeCode: rowData.wallTypeCode || '',
            wallSidingCode: rowData.wallSidingCode || ''
          }, 'user_fix');
        } else if (section === 'stores') {
          window.CustomCodesDB.learn('stores', mainKeyword, rowData.stores || rowData.cleaned || '', 'user_fix');
        } else if (section === 'year') {
          window.CustomCodesDB.learn('year', mainKeyword, rowData.year || rowData.cleaned || '', 'user_fix');
        } else if (section === 'address') {
          window.CustomCodesDB.learn('address', mainKeyword, {
            street: rowData.street || '',
            city: rowData.city || '',
            state: rowData.state || '',
            county: rowData.county || '',
            postal: rowData.postal || '',
            country: rowData.country || ''
          }, 'user_fix');
        }
      }

      if (window.CodeFinder) {
        window.CodeFinder.clearCache();
      }

      const kwDisplay = mainKeyword ? `"${mainKeyword}"` : `Keywords`;
      showToast(`🧠 Trained: Saved ${kwDisplay} ➔ Code ${code} (${rowData.category || 'Class'}) to Memory!`, '🧠', {
        text: '📂 View Database Data',
        onClick: () => window.openCodeExplorer(section, mainKeyword || code)
      });

      if (callback) callback(true, false);

      // Live re-process if not in AI mode
      if (typeof processCleaning === 'function' && !AppState.isAiCleanActive) {
        processCleaning();
      }
    }
  };

  // Global helper to save all visible rows with valid codes to Custom Database
  window.saveAllRowsToCustomDB = function(section, rows) {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      showToast('No rows to save to Database.', 'ℹ️', {
        text: '📂 View Database',
        onClick: () => window.openCodeExplorer(section)
      });
      return;
    }
    if (!window.CustomCodesDB) return;

    const isConstruction = section === 'construction';
    const mappings = [];
    let alreadySavedCount = 0;

    rows.forEach(r => {
      const code = isConstruction ? r.conCode : r.occCode;
      if (!code || code === '100' || code === '300' || code === '—' || code === '-') return;

      const kws = [];
      const rawCols = [
        r.col1, r.col2, r.col3, r.existingCode, r.bldgDesc,
        isConstruction ? r.conDesc : r.occDesc,
        ...(Array.isArray(r.extraCols) ? r.extraCols : []),
        ...(Array.isArray(r.allCols) ? r.allCols : [])
      ];
      rawCols.forEach(col => {
        const val = String(col || '').trim();
        if (val && val !== '—' && val !== '-' && val.toLowerCase() !== 'n/a' && !/^\d{3,4}$/.test(val)) {
          if (!kws.includes(val)) kws.push(val);
        }
      });
      if (kws.length === 0 && r.original) {
        const orig = String(r.original).trim();
        if (orig && !/^\d{3,4}$/.test(orig)) kws.push(orig);
      }

      if (kws.length > 0) {
        if (window.CustomCodesDB.hasKeyword(section, code, kws)) {
          alreadySavedCount++;
        } else {
          mappings.push({
            code,
            keywords: kws,
            category: r.category,
            group: r.group
          });
        }
      }
    });

    if (mappings.length === 0) {
      showToast(`All ${alreadySavedCount} rule(s) in this table are ALREADY SAVED in the Database!`, '💾', {
        text: '📂 View Database Data',
        onClick: () => window.openCodeExplorer(section)
      });
      return;
    }

    const result = window.CustomCodesDB.saveMultipleMappings(section, mappings);
    if (window.CodeFinder) window.CodeFinder.clearCache();

    showToast(`💾 Saved ${mappings.length} new mapping(s) (${result.count} rules) to Database! (${alreadySavedCount} were already saved)`, '💾', {
      text: '📂 View Database Data',
      onClick: () => window.openCodeExplorer(section)
    });

    if (typeof processCleaning === 'function' && !AppState.isAiCleanActive) {
      processCleaning();
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
      const allTextareas = getAllColumnTextareas();
      const activeEl = document.activeElement;
      let lineIdx = 0;
      if (allTextareas.includes(activeEl)) {
        const selStart = activeEl.selectionStart || 0;
        lineIdx = activeEl.value.substring(0, selStart).split('\n').length - 1;
      }
      const lineParts = allTextareas.map(ta => {
        const lines = (ta.value || '').split('\n');
        return (lines[lineIdx] || '').trim();
      }).filter(Boolean);
      lineText = lineParts.join(' ');
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
        try {
          t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch (_) {}
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
    } else if (currentExplorerTab === 'learned') {
      categories = ['all', 'occupancy', 'construction', 'roof', 'wall', 'stores', 'year', 'address'];
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
        try {
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch (_) {}
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
    } else if (currentExplorerTab === 'learned') {
      callout.style.display = 'block';
      callout.innerHTML = `
        <strong>🧠 CleanExcel Continuous Self-Training & Memory System:</strong><br>
        &bull; <strong>Self-Learning:</strong> Every time you run AI or make a manual fix/assignment, CleanExcel automatically trains itself and stores the rule.<br>
        &bull; <strong>Instant 0 ms Recall:</strong> The deterministic engines recall learned items with top priority before generic rules.<br>
        &bull; <strong>Persistent:</strong> Stored in your local database and retained across sessions. Export/import backups at any time.
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
    grid.scrollTop = 0;

    const q = (explorerSearchInput && explorerSearchInput.value.trim()) || '';

    // Handle Learned Memory tab
    if (currentExplorerTab === 'learned') {
      const allLearned = window.CustomCodesDB ? window.CustomCodesDB.getAllLearned() : [];
      let learnedItems = allLearned;

      if (currentExplorerCategoryFilter !== 'all') {
        learnedItems = learnedItems.filter(i => i.section === currentExplorerCategoryFilter);
      }

      if (q) {
        const qLower = q.toLowerCase();
        learnedItems = learnedItems.filter(i => {
          const phraseMatch = (i.phrase || '').toLowerCase().includes(qLower);
          const rawMatch = (i.rawPhrase || '').toLowerCase().includes(qLower);
          const resStr = JSON.stringify(i.result || '').toLowerCase();
          return phraseMatch || rawMatch || resStr.includes(qLower);
        });
      }

      if (stats) stats.textContent = `Showing ${learnedItems.length} learned underwriting patterns`;

      if (learnedItems.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
            <div style="font-size: 36px; margin-bottom: 12px;">🧠</div>
            <h4 style="color: var(--text-primary); margin-bottom: 6px;">${q ? 'No Learned Patterns Found' : 'CleanExcel Self-Training Memory is Ready!'}</h4>
            <p style="max-width: 500px; margin: 0 auto; font-size: 13px; line-height: 1.5;">
              ${q ? `No learned rules match "<strong>${escapeHtml(q)}</strong>".` : 'Whenever you run AI or make a manual fix/assignment on any row in Studio, CleanExcel automatically trains itself and stores the pattern into persistent memory with 0 ms instant recall!'}
            </p>
          </div>
        `;
        return;
      }

      learnedItems.forEach(item => {
        const card = createLearnedPatternCard(item, q, {
          onDelete: () => {
            if (confirm(`Remove learned memory pattern "${item.rawPhrase || item.phrase}"?`)) {
              if (window.CustomCodesDB) {
                window.CustomCodesDB.deleteLearned(item.section, item.phrase);
                showToast(`Removed learned rule "${item.phrase}"`, '🗑️');
                renderExplorerCards();
                syncMemoryBadge();
              }
            }
          },
          onCopy: () => {
            const copyVal = typeof item.result === 'object' ? JSON.stringify(item.result) : String(item.result);
            if (navigator.clipboard) navigator.clipboard.writeText(copyVal);
            showToast(`Copied result "${copyVal}"!`, '📋');
          }
        });
        grid.appendChild(card);
      });
      return;
    }

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
        onDetails: () => openDetailModal(item),
        onEdit: () => openCodeEditor(currentExplorerTab, item, false)
      });
      grid.appendChild(card);
    });
  }

  function createLearnedPatternCard(item, query, handlers = {}) {
    const card = document.createElement('div');
    card.className = `finder-result-card card-learned`;
    card.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    card.style.background = 'rgba(15, 23, 42, 0.65)';

    const secLabel = (item.section || 'General').toUpperCase();
    const sourceBadge = item.source === 'ai'
      ? `<span style="background: rgba(139, 92, 246, 0.2); color: #c084fc; font-size: 10px; padding: 2px 6px; border-radius: 6px; font-weight: 600;">✨ AI Learned</span>`
      : `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 10px; padding: 2px 6px; border-radius: 6px; font-weight: 600;">👤 User Fix</span>`;

    let resultHtml = '';
    if (typeof item.result === 'object' && item.result !== null) {
      if (item.section === 'roof') {
        resultHtml = `
          <div style="font-size: 11px; color: var(--text-secondary); margin: 6px 0; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            Geom: <strong>${item.result.geometryCode || 0}</strong> &bull; Pitch: <strong>${item.result.pitchCode || 0}</strong> &bull; Cov: <strong>${item.result.coveringCode || 0}</strong> &bull; Deck: <strong>${item.result.deckCode || 0}</strong> &bull; CovAttach: <strong>${item.result.covAttachCode || 0}</strong> &bull; DeckAttach: <strong>${item.result.deckAttachCode || 0}</strong> &bull; Anchor: <strong>${item.result.anchorageCode || 0}</strong>
          </div>`;
      } else if (item.section === 'wall') {
        resultHtml = `
          <div style="font-size: 11px; color: var(--text-secondary); margin: 6px 0; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            WallType: <strong>${item.result.wallTypeCode || '—'}</strong> &bull; WallSiding: <strong>${item.result.wallSidingCode || '—'}</strong>
          </div>`;
      } else if (item.section === 'address') {
        resultHtml = `
          <div style="font-size: 11px; color: var(--text-secondary); margin: 6px 0; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            Street: <strong>${item.result.street || '—'}</strong> | City: <strong>${item.result.city || '—'}</strong> | State: <strong>${item.result.state || '—'}</strong> | Zip: <strong>${item.result.postal || '—'}</strong>
          </div>`;
      } else {
        resultHtml = `
          <div style="font-size: 12px; color: #60a5fa; margin: 4px 0; font-weight: 600;">
            Code: ${item.result.code || '—'} ${item.result.category ? '— ' + item.result.category : ''}
          </div>`;
      }
    } else {
      resultHtml = `<div style="font-size: 13px; color: #60a5fa; font-weight: 600; margin: 4px 0;">➔ Output: "${escapeHtml(String(item.result))}"</div>`;
    }

    const hitBadge = item.hits > 0 ? `<span style="color: #fbbf24; font-size: 10px;">⚡ Used ${item.hits} time${item.hits > 1 ? 's' : ''}</span>` : `<span style="color: var(--text-muted); font-size: 10px;">⚡ Newly trained</span>`;

    card.innerHTML = `
      <div class="finder-card-header" style="margin-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: #93c5fd; background: rgba(59, 130, 246, 0.2); padding: 2px 6px; border-radius: 4px;">${secLabel}</span>
          ${sourceBadge}
        </div>
        ${hitBadge}
      </div>
      <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
        "${highlightMatch(item.rawPhrase || item.phrase, query)}"
      </div>
      ${resultHtml}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
        <span style="font-size: 10px; color: var(--text-muted);">Learned ${item.learnedAt ? new Date(item.learnedAt).toLocaleDateString() : 'recently'}</span>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-copy-learned" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; font-size: 11px; padding: 3px 8px; border-radius: 4px; cursor: pointer;">📋 Copy</button>
          <button type="button" class="btn-del-learned" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 11px; padding: 3px 8px; border-radius: 4px; cursor: pointer;">🗑️ Delete</button>
        </div>
      </div>
    `;

    const copyBtn = card.querySelector('.btn-copy-learned');
    if (copyBtn && handlers.onCopy) copyBtn.addEventListener('click', handlers.onCopy);
    const delBtn = card.querySelector('.btn-del-learned');
    if (delBtn && handlers.onDelete) delBtn.addEventListener('click', handlers.onDelete);

    return card;
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
        onDetails: () => openDetailModal(item),
        onEdit: () => openCodeEditor(sec, item, false)
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

    let badgeHtml = '';
    if (item.isCustom) {
      badgeHtml = `<span class="finder-badge-custom">Custom</span>`;
    } else if (item.isModified) {
      badgeHtml = `<span class="finder-badge-modified">Edited</span>`;
    }

    let editBtnHtml = '';
    if (sec === 'occupancy' || sec === 'construction') {
      editBtnHtml = `<button type="button" class="finder-btn-action finder-btn-edit" title="Edit this code description or keywords">✏️ Edit</button>`;
    }

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
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="finder-code-badge">${escapeHtml(item.code)}</span>
          ${badgeHtml}
        </div>
        <span class="finder-group-tag">${escapeHtml(group)}</span>
      </div>
      <div class="finder-card-title">${highlightedTitle}</div>
      ${ruleAlertHtml}
      <div class="finder-card-desc">${highlightedDesc}</div>
      ${keywordsHtml}
      <div class="finder-card-actions">
        ${editBtnHtml}
        <button type="button" class="finder-btn-action finder-btn-details">📖 Details</button>
        <button type="button" class="finder-btn-action finder-btn-copy">📋 Copy Code</button>
        <button type="button" class="finder-btn-action finder-btn-insert">➕ Insert</button>
      </div>
    `;

    const editBtn = card.querySelector('.finder-btn-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlers.onEdit && handlers.onEdit();
      });
    }

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
 * Universal View Switcher (Landing Page vs. Studio Workspace)
 */
function switchAppView(viewName) {
  try {
    const landingViewEl = document.getElementById('landing-page-view');
    const studioViewEl = document.getElementById('studio-view');
    const navBtnHome = document.getElementById('nav-btn-home');
    const navBtnStudio = document.getElementById('nav-btn-studio');
    const btnLaunchHeader = document.getElementById('btn-launch-header');

    if (viewName === 'home') {
      if (landingViewEl) landingViewEl.style.display = 'flex';
      if (studioViewEl) studioViewEl.style.display = 'none';
      if (navBtnHome) navBtnHome.classList.add('active');
      if (navBtnStudio) navBtnStudio.classList.remove('active');
      if (btnLaunchHeader) btnLaunchHeader.style.display = 'inline-flex';
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    } else {
      if (landingViewEl) landingViewEl.style.display = 'none';
      if (studioViewEl) studioViewEl.style.display = 'flex';
      if (navBtnHome) navBtnHome.classList.remove('active');
      if (navBtnStudio) navBtnStudio.classList.add('active');
      if (btnLaunchHeader) btnLaunchHeader.style.display = 'none';

      // Load studio ambient video on demand when entering workspace
      try {
        const studioVideo = document.querySelector('.studio-ambient-video');
        if (studioVideo && studioVideo.dataset.src && !studioVideo.src) {
          studioVideo.src = studioVideo.dataset.src;
          studioVideo.load();
          studioVideo.play().catch(() => {});
        }
      } catch (e) {}

      // Re-trigger layout alignment for multi-column inputs and output tables safely
      try { if (typeof updateLineNumbers === 'function') updateLineNumbers(); } catch (e) {}
      try { if (typeof updateOccLineNumbers === 'function') updateOccLineNumbers(); } catch (e) {}
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    }
  } catch (err) {
    console.error('switchAppView error:', err);
    // Absolute fallback
    const lv = document.getElementById('landing-page-view');
    const sv = document.getElementById('studio-view');
    if (lv) lv.style.display = viewName === 'home' ? 'flex' : 'none';
    if (sv) sv.style.display = viewName === 'home' ? 'none' : 'flex';
  }
}

// Expose globally immediately
window.switchAppView = switchAppView;

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

  const navBrandClick = document.getElementById('nav-brand-click');
  if (navBrandClick) navBrandClick.addEventListener('click', () => switchAppView('home'));
  if (navBtnHome) navBtnHome.addEventListener('click', () => switchAppView('home'));
  if (navBtnStudio) navBtnStudio.addEventListener('click', () => switchAppView('studio'));
  if (btnLaunchHeader) btnLaunchHeader.addEventListener('click', () => switchAppView('studio'));
  if (heroBtnLaunch) heroBtnLaunch.addEventListener('click', () => switchAppView('studio'));
  if (bentoBtnLaunch) bentoBtnLaunch.addEventListener('click', () => switchAppView('studio'));
  if (footerLinkStudio) footerLinkStudio.addEventListener('click', () => switchAppView('studio'));

  // Global Document-Level Event Delegation for All Launch / Navigation Triggers
  document.addEventListener('click', (e) => {
    // 1. Launch Studio triggers
    const launchTrigger = e.target.closest('#btn-launch-header, #hero-btn-launch, #bento-btn-launch, #nav-btn-studio, #footer-link-studio, .veng-btn-launch, [data-action="launch-studio"]');
    if (launchTrigger) {
      e.preventDefault();
      switchAppView('studio');
      return;
    }

    // 2. Bento Card or Bento CTA button
    const bentoCard = e.target.closest('.bento-card[data-target-section]');
    if (bentoCard) {
      e.preventDefault();
      const targetSec = bentoCard.getAttribute('data-target-section');
      switchAppView('studio');
      if (targetSec) {
        if (typeof window.switchActiveSection === 'function') {
          window.switchActiveSection(targetSec);
        } else {
          const tabEl = document.querySelector(`.column-tab[data-column="${targetSec}"]`);
          if (tabEl) tabEl.click();
        }
      }
      return;
    }

    // 3. Home Nav triggers
    const homeTrigger = e.target.closest('#nav-btn-home, #nav-brand-click');
    if (homeTrigger) {
      e.preventDefault();
      switchAppView('home');
      return;
    }
  }, true);

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
      switchAppView('studio');
      const loadSampleBtn = document.getElementById('btn-load-sample');
      if (loadSampleBtn) {
        loadSampleBtn.click();
      }
    });
  }

  // Footer rules link
  if (footerLinkRules) {
    footerLinkRules.addEventListener('click', () => {
      switchAppView('studio');
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

  // Initialize SynapseX Hero mouse-scrubbed video and text scrambler
  initSynapseHero();
  initLazyVideos();
}

/**
 * SynapseX Hero Mouse Scrubbing Video & Scramble Text Controller
 */
function initSynapseHero() {
  const heroVideo = document.getElementById('synapse-hero-video');
  if (heroVideo) {
    heroVideo.pause();
    heroVideo.currentTime = 0;

    let isSeeking = false;
    let targetTime = 0;
    let lastMouseX = null;

    heroVideo.addEventListener('seeked', () => {
      isSeeking = false;
      if (Math.abs(heroVideo.currentTime - targetTime) > 0.05) {
        isSeeking = true;
        heroVideo.currentTime = targetTime;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!heroVideo.duration || isNaN(heroVideo.duration)) return;
      if (lastMouseX === null) {
        lastMouseX = e.clientX;
        return;
      }
      const deltaX = e.clientX - lastMouseX;
      lastMouseX = e.clientX;

      const scrubDelta = (deltaX / window.innerWidth) * heroVideo.duration * 0.8;
      let newTime = targetTime + scrubDelta;
      newTime = Math.max(0, Math.min(heroVideo.duration, newTime));
      targetTime = newTime;

      if (!isSeeking) {
        isSeeking = true;
        heroVideo.currentTime = newTime;
      }
    });
  }

  // Scramble In Animation for title words
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><';
  const scrambleEls = document.querySelectorAll('.synapse-scramble');
  scrambleEls.forEach((el, idx) => {
    const text = el.getAttribute('data-text') || el.textContent;
    setTimeout(() => {
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        const revealed = Math.floor(frame * 0.5);
        if (revealed >= text.length) {
          el.textContent = text;
          clearInterval(interval);
          return;
        }
        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < revealed) {
            result += text[i];
          } else if (text[i] === ' ') {
            result += ' ';
          } else if (i < revealed + 3) {
            result += CHARS[Math.floor(Math.random() * CHARS.length)];
          } else {
            result += '';
          }
        }
        el.textContent = result;
      }, 40);
    }, 200 + idx * 300);
  });
}

/**
 * SynapseX Lazy Video Loader & Mobile Bandwidth Optimization
 * Avoids downloading 45+ MB of video payloads on initial page render.
 */
function initLazyVideos() {
  // 1. Ambient Background Video (Desktop only, skipped on mobile to save 17MB)
  const ambientVideo = document.querySelector('.synapse-ambient-video');
  if (ambientVideo && window.innerWidth > 768) {
    if (ambientVideo.dataset.src && !ambientVideo.src) {
      ambientVideo.src = ambientVideo.dataset.src;
      ambientVideo.load();
      ambientVideo.play().catch(() => {});
    }
  }

  // 2. Below-the-fold showcase videos (Cinematic, Metrics, Footer)
  const lazyVideos = document.querySelectorAll('.synapse-lazy-video');
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          if (video.dataset.src && !video.src) {
            video.src = video.dataset.src;
            video.load();
            video.play().catch(() => {});
          }
          observer.unobserve(video);
        }
      });
    }, { rootMargin: '300px 0px' });

    lazyVideos.forEach(v => videoObserver.observe(v));
  } else {
    // Fallback for older browsers
    lazyVideos.forEach(v => {
      if (v.dataset.src && !v.src) {
        v.src = v.dataset.src;
        v.load();
        v.play().catch(() => {});
      }
    });
  }
}
