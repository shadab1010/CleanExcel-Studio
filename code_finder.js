/**
 * CleanExcel Studio - Universal Touchstone UNICEDE® Code & Description Finder Engine
 * 
 * Provides instantaneous, multi-attribute indexing and search across all classification sections:
 * 1. Occupancy Class Classifier (occupancy) - Codes 300 to 3023
 * 2. Construction Class Classifier (construction) - Codes 100 to 2720
 * 3. Roof Detail Classifier (roof) - Geometry, Pitch, Covering, Deck
 * 4. Exterior Wall Finish Classifier (wall) - WallType, WallSiding
 */

(function(root) {
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
    } catch (e) {}
  }

  // Comprehensive Occupancy Underwriting Taxonomy
  const OCCUPANCY_DATA = [
    {
      code: "300",
      category: "Unknown occupancy",
      group: "Unknown",
      description: "Unknown or unclassified building occupancy. If both construction and occupancy are unknown, Touchstone models apply default commercial damage functions based on regional state weights.",
      keywords: ["unknown", "unspecified", "generic", "not reported", "other"]
    },
    {
      code: "301",
      category: "Permanent Dwelling: General Residential",
      group: "Residential",
      description: "General permanent residential dwelling when specific single-family or multi-family breakdown is unavailable. Low-to-mid rise residential living units.",
      keywords: ["residential", "dwelling", "living unit", "home", "housing", "private residence"]
    },
    {
      code: "302",
      category: "Permanent Dwelling: Single Family",
      group: "Residential",
      description: "Detached single-family residential homes, cottages, detached villas, single-family dwellings (SFD). Exclusively single-household occupancies.",
      keywords: ["single family", "single-family", "sfd", "detached house", "cottage", "villa", "bungalow", "residence", "family home"]
    },
    {
      code: "303",
      category: "Permanent Dwelling: Multi Family",
      group: "Residential",
      description: "Low-density multi-family structures containing 2 to 4 separate living units (duplexes, triplexes, fourplexes, quadplexes).",
      keywords: ["multi-family", "multi family", "duplex", "triplex", "fourplex", "quadplex", "2-4 family", "two-family", "three-family"]
    },
    {
      code: "304",
      category: "Temporary Lodging (Hotels/Motels/Resorts)",
      group: "Commercial Lodging",
      description: "Transient hospitality facilities including luxury hotels, commercial motels, resort hotels, bed & breakfasts, inns, hostels, and tourist lodging.",
      keywords: ["hotel", "motel", "inn", "resort", "lodging", "bed and breakfast", "b&b", "hostel", "hospitality", "suites hotel", "extended stay hotel"]
    },
    {
      code: "305",
      category: "Group Institutional Housing (Dorms/Nursing Homes)",
      group: "Institutional Housing",
      description: "Supervised group living quarters, nursing care facilities, assisted living, skilled nursing homes, convalescent centers, senior living, retirement homes, college dormitories, fraternity/sorority houses, motherhouses, convents, rectories, monasteries, and hospices.",
      keywords: ["nursing home", "assisted living", "skilled nursing", "convalescent", "extended care", "dormitory", "dorm", "senior living", "retirement home", "group home", "residence hall", "motherhouse", "mother house", "convent", "monastery", "elderly care", "rest home", "hospice"]
    },
    {
      code: "306",
      category: "Apartments / Condominiums",
      group: "Residential Multi-Family",
      description: "Multi-family residential apartment complexes and residential condominium buildings with 5 or more units. Mid-rise and high-rise multi-unit residential living.",
      keywords: ["apartment", "apartments", "condo", "condominium", "condos", "multi-unit residential", "apt building", "rental community", "residential high-rise"]
    },
    {
      code: "307",
      category: "Terraced Housing / Townhomes",
      group: "Residential",
      description: "Single-family attached dwellings sharing one or two common party walls, including townhouses, townhomes, row houses, and brownstones.",
      keywords: ["townhouse", "townhome", "terraced", "row house", "brownstone", "attached home", "party wall"]
    },
    {
      code: "311",
      category: "General Commercial",
      group: "Commercial",
      description: "Standard commercial mercantile and customer service properties when more specific retail, wholesale, or office classification is unstated.",
      keywords: ["commercial", "business", "mercantile", "general commercial", "storefront"]
    },
    {
      code: "312",
      category: "Retail Trade (Stores/Malls/Supermarkets)",
      group: "Commercial Retail",
      description: "Establishments engaged in selling merchandise directly to the public: shopping malls, strip centers, department stores, supermarkets, grocery stores, pharmacies, big-box retailers, boutiques, retail plazas.",
      keywords: ["retail", "store", "shop", "shopping center", "strip mall", "supermarket", "mall", "grocery", "department store", "boutique", "plaza", "outlet center", "convenience store"]
    },
    {
      code: "313",
      category: "Wholesale Trade (Warehouses/Storage)",
      group: "Commercial Storage",
      description: "Facilities for bulk merchandise storage, wholesale operations, logistics centers, freight handling, self-storage facilities, mini-warehouses, cold storage, and distribution warehouses.",
      keywords: ["warehouse", "wholesale", "distribution center", "storage facility", "self storage", "self-storage", "mini storage", "mini-storage", "logistics center", "freight storage", "depot", "cold storage"]
    },
    {
      code: "314",
      category: "Personal & Repair Services (Salons/Laundromats)",
      group: "Commercial Services",
      description: "Service businesses catering directly to personal needs: laundromats, dry cleaners, hair salons, barbershops, beauty spas, shoe repair, tailor shops, funeral homes.",
      keywords: ["salon", "laundromat", "dry cleaner", "barber", "spa", "funeral home", "repair service", "tailor", "mortuary"]
    },
    {
      code: "315",
      category: "Professional, Technical, Business (Offices/Banks)",
      group: "Commercial Offices",
      description: "Offices providing professional, administrative, financial, or technical services: commercial office buildings, bank branches, corporate headquarters, law firms, accounting practices, engineering consultancies, insurance agencies, real estate offices.",
      keywords: ["office", "bank", "financial", "corporate", "law firm", "accounting", "insurance agency", "consulting", "admin office", "headquarters", "professional suites"]
    },
    {
      code: "316",
      category: "Health Care Services (Hospitals/Clinics)",
      group: "Healthcare",
      description: "Inpatient and outpatient medical care facilities: acute care general hospitals, specialty surgical centers, outpatient medical clinics, dental practices, urgent care centers, diagnostic imaging, dialysis centers, doctors' offices.",
      keywords: ["hospital", "clinic", "medical", "healthcare", "health care", "doctor", "dental", "dentist", "urgent care", "dialysis", "physician", "surgery center", "outpatient", "emergency room"]
    },
    {
      code: "317",
      category: "Entertainment & Recreation (Theaters/Gyms)",
      group: "Entertainment",
      description: "Recreational and public entertainment venues: movie theaters, performance playhouses, auditoriums, bowling alleys, fitness centers, gymnasiums, athletic stadiums, arenas, sports complexes, amusement arcades, skating rinks.",
      keywords: ["theater", "theatre", "cinema", "gymnasium", "gym", "fitness", "bowling", "arena", "stadium", "amusement", "arcade", "skating rink", "sports complex", "concert hall"]
    },
    {
      code: "318",
      category: "Parking Structures / Garages",
      group: "Commercial",
      description: "Dedicated structures for vehicle parking: multi-level above-ground parking garages, underground parking structures, commercial parking ramps, elevated parking decks.",
      keywords: ["parking garage", "parking structure", "parking deck", "parking ramp", "multilevel parking", "car park"]
    },
    {
      code: "319",
      category: "Golf Courses",
      group: "Entertainment",
      description: "Golf course grounds, pro shops, clubhouses, country club dining facilities, driving ranges, maintenance sheds.",
      keywords: ["golf course", "clubhouse", "country club", "pro shop", "driving range", "golf club"]
    },
    {
      code: "321",
      category: "General Industrial",
      group: "Industrial",
      description: "Standard industrial facilities engaged in general mechanical manufacturing, component fabrication, equipment assembly, or maintenance.",
      keywords: ["industrial", "manufacturing", "plant", "factory", "industrial park", "fabrication"]
    },
    {
      code: "322",
      category: "Heavy Fabrication and Assembly",
      group: "Industrial Heavy",
      description: "Heavy manufacturing and industrial processing: steel fabrication mills, iron foundries, heavy machinery plants, boiler works, railcar assembly, shipbuilding yards.",
      keywords: ["heavy fabrication", "heavy industrial", "foundry", "steel mill", "heavy manufacturing", "shipyard", "metal rolling", "smelter"]
    },
    {
      code: "323",
      category: "Light Fabrication and Assembly",
      group: "Industrial Light",
      description: "Light industrial production: consumer goods assembly, electronic device packaging, textile garment manufacturing, precision machine shops, instrument fabrication.",
      keywords: ["light fabrication", "light manufacturing", "assembly plant", "machine shop", "light industrial", "electronics assembly", "packaging plant"]
    },
    {
      code: "324",
      category: "Food and Drug Processing",
      group: "Industrial Specialized",
      description: "Sanitary processing and packaging of consumables: pharmaceutical manufacturing, food processing plants, commercial bakeries, dairies, bottling plants, breweries, wineries, distilleries, meatpacking.",
      keywords: ["food processing", "drug processing", "pharmaceutical manufacturing", "bottling plant", "brewery", "winery", "distillery", "meat packing", "dairy plant", "commercial bakery"]
    },
    {
      code: "325",
      category: "Chemical Processing",
      group: "Industrial Specialized",
      description: "Chemical manufacturing and synthesis plants: synthetic resins, plastics manufacturing, fertilizers, industrial acids, coatings, specialty chemicals.",
      keywords: ["chemical processing", "chemical plant", "refinery", "plastics manufacturing", "resin plant", "polymer", "fertilizer plant"]
    },
    {
      code: "326",
      category: "Metal Processing",
      group: "Industrial Specialized",
      description: "Smelting, refining, alloy casting, heat treating, stamping, forging, and extrusion of ferrous and non-ferrous metals.",
      keywords: ["metal processing", "metal stamping", "extrusion", "forging", "heat treating", "casting", "alloy"]
    },
    {
      code: "327",
      category: "High Technology (Data Centers/Cleanrooms)",
      group: "High Tech",
      description: "High-tech mission-critical infrastructure: enterprise data centers, telecom colocation facilities, semiconductor fabrication cleanrooms, advanced nanotechnology laboratories.",
      keywords: ["data center", "datacenter", "server farm", "semiconductor", "cleanroom", "high tech", "colocation", "server hosting"]
    },
    {
      code: "328",
      category: "Mining and Mineral Processing",
      group: "Industrial Extractive",
      description: "Facilities associated with surface and subsurface mineral extraction, stone quarries, crushing plants, gravel operations, cement kilns.",
      keywords: ["mining", "mineral processing", "quarry", "crusher", "gravel pit", "cement plant", "aggregate"]
    },
    {
      code: "329",
      category: "Oil & Gas Refining / Petrochemical",
      group: "Industrial Energy",
      description: "Crude petroleum refineries, natural gas processing facilities, liquified natural gas (LNG) export terminals, petrochemical cracking complexes.",
      keywords: ["oil refining", "petrochemical", "gas processing", "lng terminal", "cracking plant", "petroleum refinery"]
    },
    {
      code: "330",
      category: "Paper and Wood Products",
      group: "Industrial",
      description: "Lumber mills, plywood manufacturing, pulp and paper mills, cardboard manufacturing, furniture assembly, timber processing.",
      keywords: ["paper mill", "wood products", "sawmill", "lumber mill", "pulp mill", "plywood plant", "furniture factory"]
    },
    {
      code: "331",
      category: "Restaurant occupancy (Diners/Fast Food/Bars)",
      group: "Commercial Food Service",
      description: "Full-service restaurants, casual dining, fast food restaurants with drive-thrus, diners, bistros, bars & grills, pizzerias, cafes, bakeries, coffee shops, pubs, taverns, buffets, food courts.",
      keywords: ["restaurant", "diner", "cafe", "fast food", "bistro", "bar and grill", "pizzeria", "drive-thru", "bakery", "coffee shop", "pub", "tavern", "buffet", "food court", "eatery", "steakhouse"]
    },
    {
      code: "335",
      category: "Mercantile - Wholesale & Retail Wholesale",
      group: "Commercial Retail",
      description: "Wholesale retail clubs, bulk merchandisers, cash & carry wholesale showrooms, building material supply showrooms.",
      keywords: ["mercantile", "wholesale club", "warehouse club", "bulk store", "wholesale showroom", "cash and carry"]
    },
    {
      code: "336",
      category: "Automotive Repair Shops and Car Washes",
      group: "Commercial Automotive",
      description: "Automobile repair and maintenance shops, mechanic service bays, automotive paint/collision repair, automated car washes, oil change facilities, tire stores with repair bays.",
      keywords: ["auto repair", "automotive repair", "car wash", "oil change", "tire shop", "body shop", "mechanic", "service bay", "auto body", "collision repair", "dealership service", "brake shop"]
    },
    {
      code: "341",
      category: "Public Administration",
      group: "Government & Public",
      description: "Civil administration offices, public sector office buildings, regional administrative authorities, government agency headquarters.",
      keywords: ["public administration", "civil service", "agency office", "government office", "state office"]
    },
    {
      code: "342",
      category: "Church / Religious Places of Worship",
      group: "Religious & Worship",
      description: "Churches, sanctuaries, chapels, synagogues, mosques, temples, cathedrals, houses of worship, parishes, religious ministries, rectories, diocesan administration, monasteries, convents, seminaries, basilicas.",
      keywords: ["church", "sanctuary", "chapel", "synagogue", "mosque", "temple", "religious", "cathedral", "house of worship", "parish", "ministry", "rectory", "diocese", "monastery", "seminary", "basilica", "pastoral", "crossings", "worship center"]
    },
    {
      code: "343",
      category: "Government - General Services (Courthouses/Offices)",
      group: "Government & Public",
      description: "Municipal city halls, county courthouses, postal distribution branches, town offices, civic centers, judicial government facilities.",
      keywords: ["government", "city hall", "courthouse", "municipal", "post office", "civic center", "town hall", "county building", "court"]
    },
    {
      code: "344",
      category: "Government - Emergency Services (Police/Fire)",
      group: "Public Safety",
      description: "Emergency response infrastructure: municipal fire stations, police headquarters/precincts, 911 dispatch communication centers, emergency medical services (EMS) bases, paramedic stations.",
      keywords: ["fire station", "police station", "emergency services", "ambulance", "paramedic", "police precinct", "fire department", "911 dispatch", "public safety"]
    },
    {
      code: "345",
      category: "General Education",
      group: "Education",
      description: "Adult education centers, vocational technical schools, tutoring centers, specialized professional training institutes.",
      keywords: ["general education", "vocational school", "training center", "trade school", "technical institute", "tutoring center"]
    },
    {
      code: "346",
      category: "Primary and Secondary Schools / Universities",
      group: "Education",
      description: "K-12 educational institutions (elementary schools, middle schools, junior highs, high schools), preparatory academies, community colleges, state/private universities, academic campus halls, licensed daycares, preschools, kindergartens.",
      keywords: ["school", "elementary", "middle school", "high school", "college", "university", "academy", "daycare", "pre-school", "kindergarten", "campus", "preschool", "secondary school", "academic building"]
    },
    {
      code: "351",
      category: "General Transportation",
      group: "Transportation",
      description: "Multi-modal passenger transport hubs, transit authority facilities, passenger waiting terminals.",
      keywords: ["transportation", "transit", "passenger terminal", "transit hub"]
    },
    {
      code: "352",
      category: "Rail Transportation",
      group: "Transportation",
      description: "Passenger rail terminals, train depots, commuter rail stations, railway switching yards, roundhouses.",
      keywords: ["rail transportation", "railroad", "railway", "train station", "rail depot", "train terminal", "subway station"]
    },
    {
      code: "353",
      category: "Airport Transportation / Terminals",
      group: "Transportation",
      description: "Commercial airport passenger terminals, air traffic control towers, concourses, boarding gates, international arrival halls.",
      keywords: ["airport", "air terminal", "aviation", "concourse", "airport passenger terminal", "airport hub"]
    },
    {
      code: "354",
      category: "Marine / Port Cargo Facilities",
      group: "Transportation",
      description: "Commercial seaports, container shipping docks, deepwater berths, bulk cargo piers, dry docks, maritime freight wharves.",
      keywords: ["port", "marine terminal", "dock", "harbor", "wharf", "pier", "shipping port", "container terminal", "seaport"]
    },
    {
      code: "355",
      category: "Aircraft Hangars",
      group: "Transportation",
      description: "Airport hangars designed for aircraft storage, commercial aircraft maintenance, corporate jet parking.",
      keywords: ["hangar", "aircraft hangar", "airplane hangar", "jet hangar", "aviation hangar"]
    },
    {
      code: "356",
      category: "Bus Terminals",
      group: "Transportation",
      description: "Intercity bus stations (e.g. Greyhound), municipal bus fleet maintenance barns, public transit bus depots.",
      keywords: ["bus terminal", "bus station", "bus depot", "transit center", "intercity bus terminal"]
    },
    {
      code: "361",
      category: "General Utilities",
      group: "Utilities",
      description: "Public and private utility service operating headquarters, utility dispatch, maintenance yards.",
      keywords: ["utility", "utilities", "public utility", "utility service"]
    },
    {
      code: "362",
      category: "Water Supply / Treatment",
      group: "Utilities",
      description: "Municipal potable water purification plants, water pumping stations, booster stations, municipal reservoirs, elevated water storage tanks.",
      keywords: ["water treatment", "water plant", "water reservoir", "potable water", "water pump station", "water filtration"]
    },
    {
      code: "363",
      category: "Wastewater / Sewer Treatment",
      group: "Utilities",
      description: "Municipal wastewater reclamation facilities, sewage treatment plants, effluent lift stations, sludge drying beds.",
      keywords: ["wastewater", "sewer treatment", "sewage plant", "water reclamation", "wastewater treatment", "sewage lift station"]
    },
    {
      code: "364",
      category: "Electric Power Generation / Substation",
      group: "Utilities Energy",
      description: "Thermal/fossil power generating stations, nuclear plants, hydroelectric dams, high-voltage transformer substations, switchyards.",
      keywords: ["power plant", "generating station", "substation", "electric utility", "power generation", "switchyard", "transformer station"]
    },
    {
      code: "365",
      category: "Telecommunications / Cell Towers",
      group: "Utilities Communications",
      description: "Cellular mobile communication towers, wireless telecom antenna sites, microwave repeaters, satellite ground stations, television/radio transmitter towers.",
      keywords: ["telecom", "cell tower", "broadcast", "antenna site", "cellular tower", "transmission tower", "communications tower"]
    },
    {
      code: "366",
      category: "Commercial Condominiums",
      group: "Commercial",
      description: "Individually-owned commercial or professional office condominium units situated in a shared multi-tenant building.",
      keywords: ["commercial condo", "commercial condominium", "office condo"]
    },
    {
      code: "367",
      category: "Mobile Homes / Manufactured Housing",
      group: "Residential",
      description: "Manufactured residential units, prefabricated mobile homes, trailer park residences.",
      keywords: ["mobile home", "manufactured home", "trailer", "manufactured housing", "trailer home"]
    },
    {
      code: "371",
      category: "Miscellaneous / Vacant / Agricultural",
      group: "Miscellaneous",
      description: "Vacant/abandoned buildings, agricultural barns, sheds, livestock shelters, greenhouses, silo structures, unclassified auxiliary outbuildings.",
      keywords: ["vacant", "agricultural", "barn", "shed", "greenhouse", "silo", "outbuilding", "unoccupied", "miscellaneous"]
    },
    {
      code: "382",
      category: "Builder's Risk - Residential",
      group: "Builder's Risk",
      description: "Residential buildings under active construction, framing, or major structural remodeling.",
      keywords: ["builder's risk residential", "under construction residential", "residential course of construction"]
    },
    {
      code: "383",
      category: "Builder's Risk - Commercial",
      group: "Builder's Risk",
      description: "Commercial buildings under active construction or major structural remodeling.",
      keywords: ["builder's risk commercial", "under construction commercial", "commercial course of construction"]
    },
    {
      code: "384",
      category: "Builder's Risk - Industrial",
      group: "Builder's Risk",
      description: "Industrial plants, power installations, or infrastructure under active construction.",
      keywords: ["builder's risk industrial", "under construction industrial", "industrial course of construction"]
    },
    {
      code: "400",
      category: "Industrial Facility Occupancies",
      group: "Industrial Heavy",
      description: "Complex multi-structure heavy manufacturing complexes and integrated processing facilities.",
      keywords: ["industrial facility", "industrial complex", "heavy manufacturing facility"]
    },
    {
      code: "3001",
      category: "Solar Occupancy / Solar Farms",
      group: "Renewable Energy",
      description: "Utility-scale ground-mount photovoltaic solar farms, commercial rooftop solar arrays, solar energy generation installations.",
      keywords: ["solar farm", "solar array", "photovoltaic", "solar park", "solar field", "solar generation", "pv system"]
    }
  ];

  // CodeFinder singleton engine
  const CodeFinder = {
    // Section data stores
    occupancyData: OCCUPANCY_DATA,

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

        // Enrich with mandatory underwriting memory rules
        if (code === '113') {
          item.rules.push('⭐ MANDATORY UNDERWRITING RULE: STONE in Exterior Wall Finish / Construction MUST ALWAYS map to Code 113 (Rubble Stone Masonry).');
          item.keywords.push('stone', 'stone facade', 'stone wall', 'stone finish', 'stone masonry', 'fieldstone', 'rubble');
        } else if (code === '111') {
          item.rules.push('⭐ MANDATORY UNDERWRITING RULE: BRICK in Exterior Wall Finish / Construction MUST ALWAYS map to Code 111 (Masonry).');
          item.keywords.push('brick', 'brick facade', 'brick wall', 'brick finish', 'exterior brick', 'general masonry');
        } else if (code === '101') {
          item.keywords.push('wood frame', 'stud wall', 'timber frame', '2x4', 'plywood sheathing');
        } else if (code === '136') {
          item.keywords.push('tilt-up', 'tilt up', 'precast panel', 'concrete wall panel');
        } else if (code === '152') {
          item.keywords.push('light metal', 'corrugated metal', 'pre-engineered metal', 'butler building', 'steel siding');
        } else if (code === '114') {
          item.keywords.push('unreinforced masonry', 'urm', 'bearing wall', 'unreinforced brick');
        } else if (code === '116') {
          item.keywords.push('reinforced masonry', 'rm', 'concrete block', 'cmu', 'grouted masonry');
        } else if (code === '119') {
          item.keywords.push('joisted masonry', 'jm', 'wood floor masonry', 'combustible roof');
        } else if (code === '131') {
          item.keywords.push('reinforced concrete', 'rc frame', 'concrete column', 'concrete beam');
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

    // Roof helper descriptions and keywords
    getRoofCoveringDescription(code) {
      const map = {
        '0': 'Unknown roof covering material.',
        '1': 'Asphalt shingles (composition shingles, architectural fiberglass shingles, 3-tab shingles). Standard steep-slope residential roofing.',
        '2': 'Wood shingles or wood shakes (cedar shake, pine shingles). Combustible steep-slope roof covering.',
        '3': 'Clay or concrete tiles (Spanish barrel tile, terracotta tiles, mission tile, concrete S-tiles). Heavy steep-slope roofing.',
        '4': 'Light metal panels (corrugated steel, corrugated iron/tin, aluminum panels, copper sheets, 5V crimp, R-panel).',
        '5': 'Slate roofing (natural quarry slate tiles, Vermont slate, Buckingham slate). Heavy brittle natural stone steep-slope roofing.',
        '6': 'Built-up roof with gravel surfacing (BUR with gravel, tar and gravel, flood coat and aggregate gravel). Low-slope roofing.',
        '7': 'Single-ply membrane (EPDM rubber, TPO thermoplastic polyolefin, PVC polyvinyl chloride, mechanically attached or fully adhered).',
        '8': 'Architectural standing seam metal roofs (SSMR, concealed fastener metal panels, double-lock standing seam). High wind resistance.',
        '9': 'Built-up roof without gravel (Smooth BUR, Modified Bitumen, Mod-Bit, SBS, APP, torch-down, asphalt cap sheet).',
        '10': 'Single-ply membrane ballasted (EPDM or TPO loose-laid membrane held down by river rock gravel or concrete pavers).',
        '11': 'Hurricane wind-rated roof coverings (Miami-Dade Notice of Acceptance NOA, Factory Mutual FM 1-90, FM 1-120 certified assemblies).',
        '12': 'Photovoltaic roof system (building-integrated photovoltaics BIPV, solar shingles, rooftop commercial solar panels).'
      };
      return map[code] || 'Touchstone UNICEDE roof covering.';
    },

    getRoofCoveringKeywords(code) {
      const map = {
        '1': ['asphalt shingle', 'composition shingle', 'architectural shingle', '3-tab', 'fiberglass shingle'],
        '2': ['wood shingle', 'wood shake', 'cedar shake', 'shake roof'],
        '3': ['tile', 'clay tile', 'concrete tile', 'spanish tile', 'terracotta', 'barrel tile', 's-tile'],
        '4': ['metal panel', 'corrugated metal', 'tin roof', 'steel panel', '5v crimp', 'r-panel', 'copper'],
        '5': ['slate', 'natural slate', 'slate tile', 'stone slate'],
        '6': ['bur with gravel', 'tar and gravel', 'pea gravel', 'built up gravel', 'gravel bur'],
        '7': ['single ply', 'single-ply', 'epdm', 'tpo', 'pvc', 'rubber membrane', 'membrane roof', 'hypalon'],
        '8': ['standing seam', 'ssmr', 'architectural standing seam', 'concealed fastener metal'],
        '9': ['mod bit', 'modified bitumen', 'smooth bur', 'torch down', 'sbs', 'app', 'cap sheet'],
        '10': ['ballasted', 'ballasted membrane', 'river rock epdm', 'ballast pavers'],
        '11': ['hurricane rated', 'miami-dade noa', 'wind rated covering', 'fm 1-90', 'fm 1-120'],
        '12': ['solar', 'photovoltaic', 'solar shingles', 'bipv', 'rooftop solar']
      };
      return map[code] || [];
    },

    getRoofDeckDescription(code) {
      const map = {
        '0': 'Unknown roof deck material.',
        '1': 'Plywood structural roof sheathing. Standard combustible wood panel decking.',
        '2': 'Solid wood planks (tongue-and-groove boards, heavy timber decking).',
        '3': 'Particle board or Oriented Strand Board (OSB) structural roof sheathing.',
        '4': 'Steel metal deck with rigid insulation board (polyiso, EPS, perlite). Standard commercial low-slope roof deck.',
        '5': 'Steel metal deck with cast concrete topping or lightweight insulating concrete.',
        '6': 'Pre-cast reinforced concrete roof slabs or hollow-core concrete planks.',
        '7': 'Cast-in-place monolithic reinforced concrete roof slab.',
        '8': 'Light gauge metal decking without concrete topping.'
      };
      return map[code] || 'Touchstone UNICEDE roof deck.';
    },

    getRoofDeckKeywords(code) {
      const map = {
        '1': ['plywood', 'plywood deck', 'plywood sheathing'],
        '2': ['wood planks', 'tongue and groove', 't&g', 'timber deck', 'heavy timber'],
        '3': ['osb', 'particle board', 'oriented strand board', 'waferboard'],
        '4': ['metal deck insulation', 'steel deck polyiso', 'insulated metal deck', 'steel deck'],
        '5': ['metal deck concrete', 'composite steel deck', 'lwic', 'lightweight concrete deck'],
        '6': ['pre-cast concrete', 'precast slab', 'hollow core slab'],
        '7': ['reinforced concrete slab', 'cast in place concrete', 'poured concrete roof'],
        '8': ['light metal deck', 'uninsulated metal deck', 'ribbed steel deck']
      };
      return map[code] || [];
    },

    getRoofGeometryDescription(code) {
      const map = {
        '0': 'Unknown or unclassified roof geometry.',
        '1': 'Flat roof (low-slope commercial or residential roof, slope ≤ 2:12 or < 10°).',
        '2': 'Gable roof without bracing (two pitched planes meeting at a central ridge with unbraced vertical end walls).',
        '3': 'Hip roof (roof slopes downward toward all exterior walls, superior aerodynamic wind resistance).',
        '4': 'Complex roof (multiple intersecting valleys, hips, dormers, and gables).',
        '5': 'Stepped or multi-level roof (varying roof elevations with vertical clerestory steps).',
        '6': 'Shed or monopitch roof (single pitched roof plane sloping in one direction).',
        '7': 'Mansard roof (two slopes on each of four sides, with lower slope significantly steeper than upper slope).',
        '8': 'Gable roof with engineered gable-end structural bracing for hurricane wind resistance.',
        '9': 'Pyramid hip roof (four equal triangular slopes meeting at a single central apex peak).',
        '10': 'Gambrel roof (barn-style roof with two symmetrical slopes on each side, lower pitch steeper).'
      };
      return map[code] || 'Touchstone UNICEDE roof geometry.';
    },

    getRoofGeometryKeywords(code) {
      const map = {
        '1': ['flat', 'flat roof', 'low slope', 'level roof'],
        '2': ['gable', 'gable roof', 'unbraced gable', 'peaked roof', 'pitched roof'],
        '3': ['hip', 'hip roof', 'hipped', 'four-slope'],
        '4': ['complex', 'complex roof', 'cut-up roof', 'multi-gable'],
        '5': ['stepped', 'multi-level', 'stepped roof', 'clerestory'],
        '6': ['shed', 'shed roof', 'monopitch', 'single slope'],
        '7': ['mansard', 'french mansard', 'curb roof'],
        '8': ['braced gable', 'gable braced', 'reinforced gable'],
        '9': ['pyramid', 'pyramidal', 'pavilion roof'],
        '10': ['gambrel', 'barn roof', 'dutch gambrel']
      };
      return map[code] || [];
    },

    getRoofPitchDescription(code) {
      const map = {
        '0': 'Unknown roof pitch.',
        '1': 'Low slope pitch: Less than 10 degrees (slope ≤ 2:12). Typical for flat, shed, and commercial membrane roofs.',
        '2': 'Medium slope pitch: 10 to 30 degrees (slope 3:12 to 7:12). Standard residential gable and hip roof pitch.',
        '3': 'High steep pitch: More than 30 degrees (slope ≥ 8:12). Steep residential roofs, Gothic architecture, church steeples.'
      };
      return map[code] || 'Touchstone UNICEDE roof pitch.';
    },

    getRoofPitchKeywords(code) {
      const map = {
        '1': ['low pitch', 'low slope', '<10', 'flat slope', '2:12', '1:12'],
        '2': ['medium pitch', '10-30', '4:12', '5:12', '6:12', 'standard pitch'],
        '3': ['high pitch', 'steep pitch', '>30', '8:12', '10:12', '12:12', 'steep slope']
      };
      return map[code] || [];
    },

    // Wall helper descriptions and keywords
    getWallSidingDescription(code) {
      const map = {
        '0': 'Unknown exterior wall siding/finish.',
        '1': 'Veneer brick or masonry facing. Single width of exterior brick or stone anchored to structural backing wall.',
        '2': 'Wood shingles or cedar shakes used as exterior siding finish.',
        '3': 'Clapboards (horizontal wood lap siding, beveled timber siding).',
        '4': 'Aluminum or vinyl siding panels (lightweight extruded vinyl or aluminum lap siding). Most vulnerable to wind peel-off & hail.',
        '5': 'Natural or cut stone panels (granite, limestone, fieldstone veneer cladding).',
        '6': 'Exterior Insulation and Finish System (EIFS / synthetic stucco over rigid insulation board). Vulnerable to hail impact and water moisture.',
        '7': 'Traditional cementitious stucco (Portland cement plaster over wire mesh lath). Non-combustible, brittle under shear.',
        '8': 'Fiber cement board siding (HardiePlank, engineered cementitious composite lap siding). Class A fire rated.'
      };
      return map[code] || 'Touchstone UNICEDE wall siding.';
    },

    getWallSidingKeywords(code) {
      const map = {
        '1': ['brick veneer', 'brick siding', 'masonry veneer', 'brick exterior', 'face brick'],
        '2': ['wood shingles', 'cedar shingles', 'shake siding', 'wood shakes'],
        '3': ['clapboard', 'clapboards', 'wood lap siding', 'horizontal wood siding', 'bevel siding'],
        '4': ['vinyl siding', 'aluminum siding', 'vinyl', 'aluminum', 'pvc siding', 'metal siding'],
        '5': ['stone panels', 'stone siding', 'stone veneer', 'fieldstone siding', 'granite panels', 'limestone veneer'],
        '6': ['eifs', 'synthetic stucco', 'dryvit', 'exterior insulation finishing system'],
        '7': ['stucco', 'traditional stucco', 'cement plaster', 'hardcoat stucco'],
        '8': ['fiber cement', 'hardieplank', 'hardie board', 'cementitious siding', 'james hardie']
      };
      return map[code] || [];
    },

    getWallTypeDescription(code) {
      const map = {
        '0': 'Unknown structural wall backing.',
        '1': 'Brick / Unreinforced Masonry (URM) structural wall. Load-bearing masonry walls without reinforcing steel rebar.',
        '2': 'Reinforced Masonry (grouted concrete masonry units CMU with internal steel rebar). High lateral load resistance.',
        '3': 'Plywood structural wall sheathing over wood or light steel studs.',
        '4': 'Solid wood planks (horizontal or diagonal timber wall sheathing).',
        '5': 'Particle board or Oriented Strand Board (OSB) structural wall sheathing.',
        '6': 'Light gauge metal panels or structural steel wall framing.',
        '7': 'Pre-cast concrete wall elements and tilt-up panels assembled on site.',
        '8': 'Cast-in-place monolithic reinforced concrete structural bearing walls. Highest structural strength.',
        '9': 'Gypsum board or exterior drywall sheathing. Highly vulnerable to water and windborne missiles.'
      };
      return map[code] || 'Touchstone UNICEDE structural wall type.';
    },

    getWallTypeKeywords(code) {
      const map = {
        '1': ['brick', 'unreinforced masonry', 'urm', 'brick bearing wall'],
        '2': ['reinforced masonry', 'cmu', 'concrete block', 'grouted cmu', 'rebar masonry'],
        '3': ['plywood', 'plywood sheathing', 'wood stud plywood'],
        '4': ['wood planks', 'diagonal planks', 'board sheathing'],
        '5': ['particle board', 'osb', 'oriented strand board', 'waferboard wall'],
        '6': ['metal panels', 'light metal', 'steel stud', 'metal frame'],
        '7': ['precast concrete', 'pre-cast concrete', 'tilt-up concrete', 'precast panel'],
        '8': ['cast-in-place concrete', 'poured concrete wall', 'monolithic concrete'],
        '9': ['gypsum board', 'exterior drywall', 'densglass', 'gypsum sheathing']
      };
      return map[code] || [];
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

        // Special rule boosts for user underwriting memory
        if (section === 'construction' || section === 'all') {
          if (code === '113' && (qLower.includes('stone') || qLower.includes('fieldstone') || qLower.includes('rubble'))) {
            score += 800; // Mandatory Stone -> 113 rule
          } else if (code === '111' && (qLower.includes('brick') || qLower.includes('masonry'))) {
            score += 800; // Mandatory Brick -> 111 rule
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
