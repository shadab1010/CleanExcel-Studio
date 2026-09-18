/**
 * CleanExcel Studio - Universal Touchstone UNICEDE® Master Data & Taxonomy
 * Single Source of Truth (SSOT) for Occupancy, Construction, Roof, and Wall dictionaries.
 */
(function (root) {
  'use strict';

  const OCCUPANCY = {
  "300": {
    "code": "300",
    "category": "Unknown occupancy",
    "group": "Unknown",
    "description": "Unknown or unclassified building occupancy. If both construction and occupancy are unknown, Touchstone models apply default commercial damage functions based on regional state weights.",
    "keywords": [
      "unknown",
      "unspecified",
      "generic",
      "not reported",
      "other"
    ]
  },
  "301": {
    "code": "301",
    "category": "Permanent Dwelling: General Residential",
    "group": "Residential",
    "description": "General permanent residential dwelling when specific single-family or multi-family breakdown is unavailable. Low-to-mid rise residential living units.",
    "keywords": [
      "residential",
      "dwelling",
      "living unit",
      "home",
      "housing",
      "private residence"
    ]
  },
  "302": {
    "code": "302",
    "category": "Permanent Dwelling: Single Family",
    "group": "Residential",
    "description": "Detached single-family residential homes, cottages, detached villas, single-family dwellings (SFD). Exclusively single-household occupancies.",
    "keywords": [
      "single family",
      "single-family",
      "sfd",
      "detached house",
      "cottage",
      "villa",
      "bungalow",
      "residence",
      "family home"
    ]
  },
  "303": {
    "code": "303",
    "category": "Permanent Dwelling: Multi Family",
    "group": "Residential",
    "description": "Low-density multi-family structures containing 2 to 4 separate living units (duplexes, triplexes, fourplexes, quadplexes).",
    "keywords": [
      "multi-family",
      "multi family",
      "duplex",
      "triplex",
      "fourplex",
      "quadplex",
      "2-4 family",
      "two-family",
      "three-family"
    ]
  },
  "304": {
    "code": "304",
    "category": "Temporary Lodging (Hotels/Motels/Resorts)",
    "group": "Commercial Lodging",
    "description": "Transient hospitality facilities including luxury hotels, commercial motels, resort hotels, bed & breakfasts, inns, hostels, and tourist lodging.",
    "keywords": [
      "hotel",
      "motel",
      "inn",
      "resort",
      "lodging",
      "bed and breakfast",
      "b&b",
      "hostel",
      "hospitality",
      "suites hotel",
      "extended stay hotel"
    ]
  },
  "305": {
    "code": "305",
    "category": "Group Institutional Housing (Dorms/Nursing Homes)",
    "group": "Institutional Housing",
    "description": "Supervised group living quarters, nursing care facilities, assisted living, skilled nursing homes, convalescent centers, senior living, retirement homes, college dormitories, fraternity/sorority houses, motherhouses, convents, rectories, monasteries, and hospices.",
    "keywords": [
      "nursing home",
      "assisted living",
      "skilled nursing",
      "convalescent",
      "extended care",
      "dormitory",
      "dorm",
      "senior living",
      "retirement home",
      "group home",
      "residence hall",
      "motherhouse",
      "mother house",
      "convent",
      "monastery",
      "elderly care",
      "rest home",
      "hospice"
    ]
  },
  "306": {
    "code": "306",
    "category": "Apartments / Condominiums",
    "group": "Residential Multi-Family",
    "description": "Multi-family residential apartment complexes and residential condominium buildings with 5 or more units. Mid-rise and high-rise multi-unit residential living.",
    "keywords": [
      "apartment",
      "apartments",
      "condo",
      "condominium",
      "condos",
      "multi-unit residential",
      "apt building",
      "rental community",
      "residential high-rise"
    ]
  },
  "307": {
    "code": "307",
    "category": "Terraced Housing / Townhomes",
    "group": "Residential",
    "description": "Single-family attached dwellings sharing one or two common party walls, including townhouses, townhomes, row houses, and brownstones.",
    "keywords": [
      "townhouse",
      "townhome",
      "terraced",
      "row house",
      "brownstone",
      "attached home",
      "party wall"
    ]
  },
  "311": {
    "code": "311",
    "category": "General Commercial",
    "group": "Commercial",
    "description": "Standard commercial mercantile and customer service properties when more specific retail, wholesale, or office classification is unstated.",
    "keywords": [
      "commercial",
      "business",
      "mercantile",
      "general commercial",
      "storefront"
    ]
  },
  "312": {
    "code": "312",
    "category": "Retail Trade (Stores/Malls/Supermarkets)",
    "group": "Commercial Retail",
    "description": "Establishments engaged in selling merchandise directly to the public: shopping malls, strip centers, department stores, supermarkets, grocery stores, pharmacies, big-box retailers, boutiques, retail plazas.",
    "keywords": [
      "retail",
      "store",
      "shop",
      "shopping center",
      "strip mall",
      "supermarket",
      "mall",
      "grocery",
      "department store",
      "boutique",
      "plaza",
      "outlet center",
      "convenience store"
    ]
  },
  "313": {
    "code": "313",
    "category": "Wholesale Trade (Warehouses/Storage)",
    "group": "Commercial Storage",
    "description": "Facilities for bulk merchandise storage, wholesale operations, logistics centers, freight handling, self-storage facilities, mini-warehouses, cold storage, and distribution warehouses.",
    "keywords": [
      "warehouse",
      "wholesale",
      "distribution center",
      "storage facility",
      "self storage",
      "self-storage",
      "mini storage",
      "mini-storage",
      "logistics center",
      "freight storage",
      "depot",
      "cold storage"
    ]
  },
  "314": {
    "code": "314",
    "category": "Personal & Repair Services (Salons/Laundromats)",
    "group": "Commercial Services",
    "description": "Service businesses catering directly to personal needs: laundromats, dry cleaners, hair salons, barbershops, beauty spas, shoe repair, tailor shops, funeral homes.",
    "keywords": [
      "salon",
      "laundromat",
      "dry cleaner",
      "barber",
      "spa",
      "funeral home",
      "repair service",
      "tailor",
      "mortuary"
    ]
  },
  "315": {
    "code": "315",
    "category": "Professional, Technical, Business (Offices/Banks)",
    "group": "Commercial Offices",
    "description": "Offices providing professional, administrative, financial, or technical services: commercial office buildings, bank branches, corporate headquarters, law firms, accounting practices, engineering consultancies, insurance agencies, real estate offices.",
    "keywords": [
      "office",
      "bank",
      "financial",
      "corporate",
      "law firm",
      "accounting",
      "insurance agency",
      "consulting",
      "admin office",
      "headquarters",
      "professional suites"
    ]
  },
  "316": {
    "code": "316",
    "category": "Health Care Services (Hospitals/Clinics)",
    "group": "Healthcare",
    "description": "Inpatient and outpatient medical care facilities: acute care general hospitals, specialty surgical centers, outpatient medical clinics, dental practices, urgent care centers, diagnostic imaging, dialysis centers, doctors' offices.",
    "keywords": [
      "hospital",
      "clinic",
      "medical",
      "healthcare",
      "health care",
      "doctor",
      "dental",
      "dentist",
      "urgent care",
      "dialysis",
      "physician",
      "surgery center",
      "outpatient",
      "emergency room"
    ]
  },
  "317": {
    "code": "317",
    "category": "Entertainment & Recreation (Theaters/Gyms)",
    "group": "Entertainment",
    "description": "Recreational and public entertainment venues: movie theaters, performance playhouses, auditoriums, bowling alleys, fitness centers, gymnasiums, basketball courts, volleyball courts, tennis courts, athletic stadiums, arenas, sports complexes, amusement arcades, skating rinks.",
    "keywords": [
      "theater",
      "theatre",
      "cinema",
      "gymnasium",
      "gym",
      "fitness",
      "bowling",
      "arena",
      "stadium",
      "amusement",
      "arcade",
      "skating rink",
      "sports complex",
      "concert hall",
      "basketball court",
      "volleyball court",
      "tennis court",
      "pickleball court",
      "badminton court",
      "squash court",
      "racquetball court",
      "sports court",
      "court"
    ]
  },
  "318": {
    "code": "318",
    "category": "Parking Structures / Garages",
    "group": "Commercial",
    "description": "Dedicated structures for vehicle parking: multi-level above-ground parking garages, underground parking structures, commercial parking ramps, elevated parking decks.",
    "keywords": [
      "garage",
      "garages",
      "parking",
      "parking garage",
      "parking structure",
      "parking deck",
      "parking ramp",
      "multilevel parking",
      "car park"
    ]
  },
  "319": {
    "code": "319",
    "category": "Golf Courses",
    "group": "Entertainment",
    "description": "Golf course grounds, pro shops, clubhouses, country club dining facilities, driving ranges, maintenance sheds.",
    "keywords": [
      "golf course",
      "clubhouse",
      "country club",
      "pro shop",
      "driving range",
      "golf club"
    ]
  },
  "321": {
    "code": "321",
    "category": "General Industrial",
    "group": "Industrial",
    "description": "Standard industrial facilities engaged in general mechanical manufacturing, component fabrication, equipment assembly, or maintenance.",
    "keywords": [
      "industrial",
      "manufacturing",
      "plant",
      "factory",
      "industrial park",
      "fabrication"
    ]
  },
  "322": {
    "code": "322",
    "category": "Heavy Fabrication and Assembly",
    "group": "Industrial Heavy",
    "description": "Heavy manufacturing and industrial processing: steel fabrication mills, iron foundries, heavy machinery plants, boiler works, railcar assembly, shipbuilding yards.",
    "keywords": [
      "heavy fabrication",
      "heavy industrial",
      "foundry",
      "steel mill",
      "heavy manufacturing",
      "shipyard",
      "metal rolling",
      "smelter"
    ]
  },
  "323": {
    "code": "323",
    "category": "Light Fabrication and Assembly",
    "group": "Industrial Light",
    "description": "Light industrial production: consumer goods assembly, electronic device packaging, textile garment manufacturing, precision machine shops, instrument fabrication.",
    "keywords": [
      "light fabrication",
      "light manufacturing",
      "assembly plant",
      "machine shop",
      "light industrial",
      "electronics assembly",
      "packaging plant"
    ]
  },
  "324": {
    "code": "324",
    "category": "Food and Drug Processing",
    "group": "Industrial Specialized",
    "description": "Sanitary processing and packaging of consumables: pharmaceutical manufacturing, food processing plants, commercial bakeries, dairies, bottling plants, breweries, wineries, distilleries, meatpacking.",
    "keywords": [
      "food processing",
      "drug processing",
      "pharmaceutical manufacturing",
      "bottling plant",
      "brewery",
      "winery",
      "distillery",
      "meat packing",
      "dairy plant",
      "commercial bakery"
    ]
  },
  "325": {
    "code": "325",
    "category": "Chemical Processing",
    "group": "Industrial Specialized",
    "description": "Chemical manufacturing and synthesis plants: synthetic resins, plastics manufacturing, fertilizers, industrial acids, coatings, specialty chemicals.",
    "keywords": [
      "chemical processing",
      "chemical plant",
      "refinery",
      "plastics manufacturing",
      "resin plant",
      "polymer",
      "fertilizer plant"
    ]
  },
  "326": {
    "code": "326",
    "category": "Metal Processing",
    "group": "Industrial Specialized",
    "description": "Smelting, refining, alloy casting, heat treating, stamping, forging, and extrusion of ferrous and non-ferrous metals.",
    "keywords": [
      "metal processing",
      "metal stamping",
      "extrusion",
      "forging",
      "heat treating",
      "casting",
      "alloy"
    ]
  },
  "327": {
    "code": "327",
    "category": "High Technology (Data Centers/Cleanrooms)",
    "group": "High Tech",
    "description": "High-tech mission-critical infrastructure: enterprise data centers, telecom colocation facilities, semiconductor fabrication cleanrooms, advanced nanotechnology laboratories.",
    "keywords": [
      "data center",
      "datacenter",
      "server farm",
      "semiconductor",
      "cleanroom",
      "high tech",
      "colocation",
      "server hosting"
    ]
  },
  "328": {
    "code": "328",
    "category": "Mining and Mineral Processing",
    "group": "Industrial Extractive",
    "description": "Facilities associated with surface and subsurface mineral extraction, stone quarries, crushing plants, gravel operations, cement kilns.",
    "keywords": [
      "mining",
      "mineral processing",
      "quarry",
      "crusher",
      "gravel pit",
      "cement plant",
      "aggregate"
    ]
  },
  "329": {
    "code": "329",
    "category": "Oil & Gas Refining / Petrochemical",
    "group": "Industrial Energy",
    "description": "Crude petroleum refineries, natural gas processing facilities, liquified natural gas (LNG) export terminals, petrochemical cracking complexes.",
    "keywords": [
      "oil refining",
      "petrochemical",
      "gas processing",
      "lng terminal",
      "cracking plant",
      "petroleum refinery"
    ]
  },
  "330": {
    "code": "330",
    "category": "Paper and Wood Products",
    "group": "Industrial",
    "description": "Lumber mills, plywood manufacturing, pulp and paper mills, cardboard manufacturing, furniture assembly, timber processing.",
    "keywords": [
      "paper mill",
      "wood products",
      "sawmill",
      "lumber mill",
      "pulp mill",
      "plywood plant",
      "furniture factory"
    ]
  },
  "331": {
    "code": "331",
    "category": "Restaurant occupancy (Diners/Fast Food/Bars)",
    "group": "Commercial Food Service",
    "description": "Full-service restaurants, casual dining, fast food restaurants with drive-thrus, diners, bistros, bars & grills, pizzerias, cafes, bakeries, coffee shops, pubs, taverns, buffets, food courts.",
    "keywords": [
      "restaurant",
      "diner",
      "cafe",
      "fast food",
      "bistro",
      "bar and grill",
      "pizzeria",
      "drive-thru",
      "bakery",
      "coffee shop",
      "pub",
      "tavern",
      "buffet",
      "food court",
      "eatery",
      "steakhouse"
    ]
  },
  "335": {
    "code": "335",
    "category": "Mercantile - Wholesale & Retail Wholesale",
    "group": "Commercial Retail",
    "description": "Wholesale retail clubs, bulk merchandisers, cash & carry wholesale showrooms, building material supply showrooms.",
    "keywords": [
      "mercantile",
      "wholesale club",
      "warehouse club",
      "bulk store",
      "wholesale showroom",
      "cash and carry"
    ]
  },
  "336": {
    "code": "336",
    "category": "Automotive Repair Shops and Car Washes",
    "group": "Commercial Automotive",
    "description": "Automobile repair and maintenance shops, mechanic service bays, automotive paint/collision repair, automated car washes, oil change facilities, tire stores with repair bays.",
    "keywords": [
      "auto repair",
      "automotive repair",
      "car wash",
      "oil change",
      "tire shop",
      "body shop",
      "mechanic",
      "service bay",
      "auto body",
      "collision repair",
      "dealership service",
      "brake shop"
    ]
  },
  "341": {
    "code": "341",
    "category": "Public Administration",
    "group": "Government & Public",
    "description": "Civil administration offices, public sector office buildings, regional administrative authorities, government agency headquarters.",
    "keywords": [
      "public administration",
      "civil service",
      "agency office",
      "government office",
      "state office"
    ]
  },
  "342": {
    "code": "342",
    "category": "Church / Religious Places of Worship",
    "group": "Religious & Worship",
    "description": "Churches, sanctuaries, chapels, synagogues, mosques, temples, cathedrals, houses of worship, parishes, religious ministries, rectories, diocesan administration, monasteries, convents, seminaries, basilicas.",
    "keywords": [
      "church",
      "sanctuary",
      "chapel",
      "synagogue",
      "mosque",
      "temple",
      "religious",
      "cathedral",
      "house of worship",
      "parish",
      "ministry",
      "rectory",
      "diocese",
      "monastery",
      "seminary",
      "basilica",
      "pastoral",
      "crossings",
      "worship center"
    ]
  },
  "343": {
    "code": "343",
    "category": "Government - General Services (Courthouses/Offices)",
    "group": "Government & Public",
    "description": "Municipal city halls, county courthouses, postal distribution branches, town offices, civic centers, judicial government facilities.",
    "keywords": [
      "government",
      "city hall",
      "courthouse",
      "municipal",
      "post office",
      "civic center",
      "town hall",
      "county building",
      "court"
    ]
  },
  "344": {
    "code": "344",
    "category": "Government - Emergency Services (Police/Fire)",
    "group": "Public Safety",
    "description": "Emergency response infrastructure: municipal fire stations, police headquarters/precincts, 911 dispatch communication centers, emergency medical services (EMS) bases, paramedic stations.",
    "keywords": [
      "fire station",
      "police station",
      "emergency services",
      "ambulance",
      "paramedic",
      "police precinct",
      "fire department",
      "911 dispatch",
      "public safety"
    ]
  },
  "345": {
    "code": "345",
    "category": "General Education",
    "group": "Education",
    "description": "Adult education centers, vocational technical schools, tutoring centers, specialized professional training institutes.",
    "keywords": [
      "general education",
      "vocational school",
      "training center",
      "trade school",
      "technical institute",
      "tutoring center"
    ]
  },
  "346": {
    "code": "346",
    "category": "Primary and Secondary Schools / Universities",
    "group": "Education",
    "description": "K-12 educational institutions (elementary schools, middle schools, junior highs, high schools), preparatory academies, community colleges, state/private universities, academic campus halls, licensed daycares, preschools, kindergartens.",
    "keywords": [
      "school",
      "elementary",
      "middle school",
      "high school",
      "college",
      "university",
      "academy",
      "daycare",
      "pre-school",
      "kindergarten",
      "campus",
      "preschool",
      "secondary school",
      "academic building"
    ]
  },
  "351": {
    "code": "351",
    "category": "General Transportation",
    "group": "Transportation",
    "description": "Multi-modal passenger transport hubs, transit authority facilities, passenger waiting terminals.",
    "keywords": [
      "transportation",
      "transit",
      "passenger terminal",
      "transit hub"
    ]
  },
  "352": {
    "code": "352",
    "category": "Rail Transportation",
    "group": "Transportation",
    "description": "Passenger rail terminals, train depots, commuter rail stations, railway switching yards, roundhouses.",
    "keywords": [
      "rail transportation",
      "railroad",
      "railway",
      "train station",
      "rail depot",
      "train terminal",
      "subway station"
    ]
  },
  "353": {
    "code": "353",
    "category": "Airport Transportation / Terminals",
    "group": "Transportation",
    "description": "Commercial airport passenger terminals, air traffic control towers, concourses, boarding gates, international arrival halls.",
    "keywords": [
      "airport",
      "air terminal",
      "aviation",
      "concourse",
      "airport passenger terminal",
      "airport hub"
    ]
  },
  "354": {
    "code": "354",
    "category": "Marine / Port Cargo Facilities",
    "group": "Transportation",
    "description": "Commercial seaports, container shipping docks, deepwater berths, bulk cargo piers, dry docks, maritime freight wharves.",
    "keywords": [
      "port",
      "marine terminal",
      "dock",
      "harbor",
      "wharf",
      "pier",
      "shipping port",
      "container terminal",
      "seaport"
    ]
  },
  "355": {
    "code": "355",
    "category": "Aircraft Hangars",
    "group": "Transportation",
    "description": "Airport hangars designed for aircraft storage, commercial aircraft maintenance, corporate jet parking.",
    "keywords": [
      "hangar",
      "aircraft hangar",
      "airplane hangar",
      "jet hangar",
      "aviation hangar"
    ]
  },
  "356": {
    "code": "356",
    "category": "Bus Terminals",
    "group": "Transportation",
    "description": "Intercity bus stations (e.g. Greyhound), municipal bus fleet maintenance barns, public transit bus depots.",
    "keywords": [
      "bus terminal",
      "bus station",
      "bus depot",
      "transit center",
      "intercity bus terminal"
    ]
  },
  "361": {
    "code": "361",
    "category": "General Utilities",
    "group": "Utilities",
    "description": "Public and private utility service operating headquarters, utility dispatch, maintenance yards.",
    "keywords": [
      "utility",
      "utilities",
      "public utility",
      "utility service"
    ]
  },
  "362": {
    "code": "362",
    "category": "Water Supply / Treatment",
    "group": "Utilities",
    "description": "Municipal potable water purification plants, water pumping stations, booster stations, municipal reservoirs, elevated water storage tanks.",
    "keywords": [
      "water treatment",
      "water plant",
      "water reservoir",
      "potable water",
      "water pump station",
      "water filtration"
    ]
  },
  "363": {
    "code": "363",
    "category": "Wastewater / Sewer Treatment",
    "group": "Utilities",
    "description": "Municipal wastewater reclamation facilities, sewage treatment plants, effluent lift stations, sludge drying beds.",
    "keywords": [
      "wastewater",
      "sewer treatment",
      "sewage plant",
      "water reclamation",
      "wastewater treatment",
      "sewage lift station"
    ]
  },
  "364": {
    "code": "364",
    "category": "Electric Power Generation / Substation",
    "group": "Utilities Energy",
    "description": "Thermal/fossil power generating stations, nuclear plants, hydroelectric dams, high-voltage transformer substations, switchyards.",
    "keywords": [
      "power plant",
      "generating station",
      "substation",
      "electric utility",
      "power generation",
      "switchyard",
      "transformer station"
    ]
  },
  "365": {
    "code": "365",
    "category": "Telecommunications / Cell Towers",
    "group": "Utilities Communications",
    "description": "Cellular mobile communication towers, wireless telecom antenna sites, microwave repeaters, satellite ground stations, television/radio transmitter towers.",
    "keywords": [
      "telecom",
      "cell tower",
      "broadcast",
      "antenna site",
      "cellular tower",
      "transmission tower",
      "communications tower"
    ]
  },
  "366": {
    "code": "366",
    "category": "Commercial Condominiums",
    "group": "Commercial",
    "description": "Individually-owned commercial or professional office condominium units situated in a shared multi-tenant building.",
    "keywords": [
      "commercial condo",
      "commercial condominium",
      "office condo"
    ]
  },
  "367": {
    "code": "367",
    "category": "Mobile Homes / Manufactured Housing",
    "group": "Residential",
    "description": "Manufactured residential units, prefabricated mobile homes, trailer park residences.",
    "keywords": [
      "mobile home",
      "manufactured home",
      "trailer",
      "manufactured housing",
      "trailer home"
    ]
  },
  "371": {
    "code": "371",
    "category": "Miscellaneous / Vacant / Agricultural",
    "group": "Miscellaneous",
    "description": "Vacant/abandoned buildings, agricultural barns, sheds, livestock shelters, greenhouses, silo structures, unclassified auxiliary outbuildings.",
    "keywords": [
      "vacant",
      "agricultural",
      "barn",
      "shed",
      "greenhouse",
      "silo",
      "outbuilding",
      "unoccupied",
      "miscellaneous"
    ]
  },
  "382": {
    "code": "382",
    "category": "Builder's Risk - Residential",
    "group": "Builder's Risk",
    "description": "Residential buildings under active construction, framing, or major structural remodeling.",
    "keywords": [
      "builder's risk residential",
      "under construction residential",
      "residential course of construction"
    ]
  },
  "383": {
    "code": "383",
    "category": "Builder's Risk - Commercial",
    "group": "Builder's Risk",
    "description": "Commercial buildings under active construction or major structural remodeling.",
    "keywords": [
      "builder's risk commercial",
      "under construction commercial",
      "commercial course of construction"
    ]
  },
  "384": {
    "code": "384",
    "category": "Builder's Risk - Industrial",
    "group": "Builder's Risk",
    "description": "Industrial plants, power installations, or infrastructure under active construction.",
    "keywords": [
      "builder's risk industrial",
      "under construction industrial",
      "industrial course of construction"
    ]
  },
  "400": {
    "code": "400",
    "category": "Industrial Facility Occupancies",
    "group": "Industrial Heavy",
    "description": "Complex multi-structure heavy manufacturing complexes and integrated processing facilities.",
    "keywords": [
      "industrial facility",
      "industrial complex",
      "heavy manufacturing facility"
    ]
  },
  "3001": {
    "code": "3001",
    "category": "Solar Occupancy / Solar Farms",
    "group": "Renewable Energy",
    "description": "Utility-scale ground-mount photovoltaic solar farms, commercial rooftop solar arrays, solar energy generation installations.",
    "keywords": [
      "solar farm",
      "solar array",
      "photovoltaic",
      "solar park",
      "solar field",
      "solar generation",
      "pv system"
    ]
  }
};

  const CONSTRUCTION = {
  "100": {
    "code": "100",
    "category": "Unknown",
    "group": "Unknown construction",
    "description": "The construction class is not known. If the construction and occupancy codes for a location are both \"Unknown\", Touchstone assigns the occupancy code \"General Commercial.\" The damage functions for unknown construction are the weighted average of the known construction damage functions. Touchstone uses an exposure-weighted average at the state level to capture the variability in building stocks at this geography. The unknown damage function varies by occupancy class code. For an exposure of known occupancy but unknown construction and height, Touchstone uses a damage function that is a weighted average of the damage functions for the same occupancy class corresponding to all combinations of construction and height classes.",
    "keywords": []
  },
  "101": {
    "code": "101",
    "category": "Wood Frame (Modern)",
    "group": "Wood construction",
    "description": "Wood frame (modern) structures tend to be mostly low rise (one to three stories, occasionally four). Stud walls are typically constructed of 2x4 or 2x6 inch wood members vertically set 16 or 24 inches apart. These walls are braced by plywood or by diagonals made of wood or steel. Many detached single and low-rise multiple family residences in the United States are of stud wall wood frame construction. Corresponds to ISO Class 1 (Frame).",
    "keywords": ["iso 1", "iso 1 frame", "iso frame", "frame", "wood frame", "stud wall", "stick built"]
  },
  "102": {
    "code": "102",
    "category": "Light Wood Frame",
    "group": "Wood construction",
    "description": "Light wood frame structures are typically not built in the United States but would be found in other countries, such as Japan. In Hawaii, this classification would include single wall (studless) construction framed with light timber trusses.",
    "keywords": []
  },
  "103": {
    "code": "103",
    "category": "Masonry Veneer",
    "group": "Wood construction",
    "description": "A wood-framed structure faced with a single width of non-load-bearing concrete, stone, or clay brick attached to the stud wall.",
    "keywords": []
  },
  "104": {
    "code": "104",
    "category": "Heavy Timber",
    "group": "Wood construction",
    "description": "Heavy Timber structures typically have masonry walls with heavy wood column supports, and floor and roof decks are 2-3 inch tongue-and-groove planks.",
    "keywords": []
  },
  "107": {
    "code": "107",
    "category": "Lightweight Cladding",
    "group": "Wood construction",
    "description": "Non-structural cladding and linings (e.g., fiber cement, plywood) used in lightweight construction that uses timber or light gauge steel framing as the structural support system. Currently supported only for locations in Australia and New Zealand.",
    "keywords": []
  },
  "108": {
    "code": "108",
    "category": "Hale Construction",
    "group": "Wood construction",
    "description": "Indigenous Hawaiian construction. Supported only for the Verisk Earthquake Model for Hawaii and the Verisk Tropical Cyclone Model for Hawaii.",
    "keywords": []
  },
  "111": {
    "code": "111",
    "category": "Masonry",
    "group": "Masonry construction",
    "description": "Use this option when the exterior walls are constructed of masonry materials, but detailed construction information is unavailable or unknown. Corresponds to ISO Class 4 (Masonry Noncombustible). Underwriting Rule: BRICK in Exterior Wall Finish always maps to Code 111.",
    "keywords": ["iso 4", "iso 4 masonry noncombustible", "masonry noncombustible", "mnc", "masonry nc", "brick", "masonry", "cmu", "concrete block"]
  },
  "112": {
    "code": "112",
    "category": "Adobe",
    "group": "Masonry construction",
    "description": "Adobe construction uses adobe (clay) blocks with cement or cement-clay mixture as mortar. The roof consists of a timber frame with clay tiles or, in some cases, metal roofing.",
    "keywords": []
  },
  "113": {
    "code": "113",
    "category": "Rubble Stone Masonry",
    "group": "Masonry construction",
    "description": "Rubble stone masonry consists of low-rise perimeter load-bearing walls composed of irregular stones laid as coursed or uncoursed rubble in a cement mortar bed, with floor and roof joists constructed with wood framing.",
    "keywords": []
  },
  "114": {
    "code": "114",
    "category": "Unreinforced Masonry - Bearing Wall",
    "group": "Masonry construction",
    "description": "Unreinforced masonry buildings consist of structures in which there is no steel reinforcing within a load-bearing masonry wall. Floors, roofs, and internal partitions in these bearing wall buildings are usually of wood.",
    "keywords": []
  },
  "115": {
    "code": "115",
    "category": "Unreinforced Masonry - Bearing Frame",
    "group": "Masonry construction",
    "description": "Unreinforced masonry is used for infill walls of buildings with a bearing frame. In this structure type, the masonry is intended to be used not to support gravity loads, but to assist with lateral loads.",
    "keywords": []
  },
  "116": {
    "code": "116",
    "category": "Reinforced Masonry",
    "group": "Masonry construction",
    "description": "Reinforced masonry construction consists of load bearing walls of reinforced brick or concrete-block masonry. Floor and roof joists constructed with wood framing are common.",
    "keywords": []
  },
  "117": {
    "code": "117",
    "category": "Reinforced Masonry Shear Wall (with MRF)",
    "group": "Masonry construction",
    "description": "Reinforced masonry construction consists of load-bearing walls of reinforced brick or concrete-block masonry. Reinforced masonry buildings with \"Moment Resisting Frames\" carry lateral loads by bending. \"Shear Walls\" are continuous reinforced brick or reinforced hollow concrete block walls extending from the foundation to the roof and can be exterior walls or interior walls.",
    "keywords": []
  },
  "118": {
    "code": "118",
    "category": "Reinforced Masonry Shear Wall (without MRF)",
    "group": "Masonry construction",
    "description": "Reinforced masonry construction consists of load-bearing walls of reinforced brick or concrete-block masonry. \"Shear Walls\" are continuous reinforced brick or reinforced hollow concrete block walls extending from the foundation to the roof and can be exterior walls or interior walls.",
    "keywords": []
  },
  "119": {
    "code": "119",
    "category": "Joisted Masonry",
    "group": "Masonry construction",
    "description": "Masonry exterior walls with roof of combustible materials on non-combustible supports. Corresponds to ISO Class 2 (Joisted Masonry).",
    "keywords": ["iso 2", "iso 2 joisted masonry", "joisted masonry", "jm", "masonry joist", "brick joisted"]
  },
  "120": {
    "code": "120",
    "category": "Confined Masonry",
    "group": "Masonry construction",
    "description": "Confined masonry is a construction system in which plain masonry walls are confined on all four sides by reinforced concrete or reinforced masonry members. The walls themselves, however, carry all the gravity and lateral loads. Currently supported for locations in Australia, the Caribbean, Central America, China, Mexico, New Zealand, South America, South Korea, and Taiwan, for some locations in Europe, including Central Europe.",
    "keywords": []
  },
  "121": {
    "code": "121",
    "category": "Cavity Double Brick",
    "group": "Masonry construction",
    "description": "An unreinforced masonry construction type composed of two layers of bricks, common in many cities in Australia. Currently supported only for some locations in Australia and New Zealand.",
    "keywords": []
  },
  "131": {
    "code": "131",
    "category": "Reinforced Concrete",
    "group": "Concrete construction",
    "description": "Reinforced concrete buildings consist of reinforced concrete columns and beams. Use this if the other technical characteristics of the building are unknown. Includes ISO Class 5 (Modified Fire Resistive, 1-2 hr rating) and ISO Class 6 (Fire Resistive, ≥2 hr rating).",
    "keywords": ["iso 5", "iso 5 modified fire resistive", "modified fire resistive", "mfr", "iso 6", "iso 6 fire resistive", "fire resistive", "fr", "reinforced concrete", "rc"]
  },
  "132": {
    "code": "132",
    "category": "Reinforced Concrete Shear Wall (with MRF)",
    "group": "Concrete construction",
    "description": "Building constructed with reinforced concrete columns and beams, as well as reinforced concrete floor and roof. \"Moment Resisting Frames\" carry lateral loads by bending. \"Shear Walls\" are continuous reinforced concrete extending from the foundation to the roof and can be exterior walls or interior walls.",
    "keywords": []
  },
  "133": {
    "code": "133",
    "category": "Reinforced Concrete Shear Wall (without MRF)",
    "group": "Concrete construction",
    "description": "Building constructed with reinforced concrete columns and beams, as well as reinforced concrete floor and roof. Reinforced concrete Shear Walls are continuous reinforced concrete, extending from the foundation to the roof and can be exterior walls or interior walls. This category typically consists of buildings with a concrete box structural system with shear walls. The entire structure, along with the usual concrete diaphragm, is typically cast in place.",
    "keywords": []
  },
  "134": {
    "code": "134",
    "category": "Reinforced Concrete MRF - Ductile",
    "group": "Concrete construction",
    "description": "Buildings constructed with reinforced concrete columns, beams, and slabs. Moment Resisting Frames carry lateral loads due to earthquakes by bending. This kind of structural system can sustain large deformations and absorb energy without brittle failure.",
    "keywords": []
  },
  "135": {
    "code": "135",
    "category": "Reinforced Concrete MRF - Non-Ductile",
    "group": "Concrete construction",
    "description": "Buildings constructed with reinforced concrete columns, beams, and slabs. Moment Resisting Frames carry lateral loads due to earthquakes by bending. These structures have insufficient reinforcing steel embedded in the concrete and thus display low ductility.",
    "keywords": []
  },
  "136": {
    "code": "136",
    "category": "Tilt-Up",
    "group": "Concrete construction",
    "description": "Tilt-up buildings are constructed with reinforced concrete wall panels that are cast on the ground and then tilted upward into their final positions. These wall units are then anchored to the foundation and attached to each other. The roof and floor decks are typically wood. More recently, the wall panels are fabricated off-site and trucked in. These buildings tend to be one or two stories in height.",
    "keywords": []
  },
  "137": {
    "code": "137",
    "category": "Pre-cast Concrete",
    "group": "Concrete construction",
    "description": "The pre-cast frame is essentially a post and beam system in concrete in which columns, beams, and slabs are prefabricated and assembled on site.",
    "keywords": []
  },
  "138": {
    "code": "138",
    "category": "Pre-cast Concrete with Shear Wall",
    "group": "Concrete construction",
    "description": "The pre-cast frame is essentially a post and beam system in concrete in which columns, beams, and slabs are prefabricated and assembled on site. Lateral loads due to earthquakes are carried by cast-in-place concrete \"shear\" walls.",
    "keywords": []
  },
  "139": {
    "code": "139",
    "category": "Reinforced Concrete MRF",
    "group": "Concrete construction",
    "description": "A building constructed with reinforced concrete columns, beams, and slabs. \"Moment-resisting frames\" carry lateral loads due to earthquakes by bending. Information on the reinforcing steels is not sufficient to determine the building's level of ductility.",
    "keywords": []
  },
  "140": {
    "code": "140",
    "category": "Reinforced Concrete MRF with URM",
    "group": "Concrete construction",
    "description": "Reinforced concrete columns and beams form \"moment-resisting frames\" to carry lateral loads due to earthquakes. Unreinforced masonry walls are used as infills between the columns to add lateral load resistance, but are not intended to serve as gravity load-bearing elements.",
    "keywords": []
  },
  "141": {
    "code": "141",
    "category": "Reinforced Concrete Frame with 2nd Story Wood Frame or URM Addition",
    "group": "Concrete construction",
    "description": "First floor consists of Caribbean \"bunker\" style home with reinforced concrete foundation, columns, and roof forming moment-resisting frame to carry gravity and lateral loads. First floor typically uses unreinforced masonry infill between the columns for additional lateral resistance. Second story consists of wood frame or unreinforced masonry dwelling, typically built as an addition with exterior staircase access. Second story roof is typically metal cladding over wood or light metal frame. This code is valid only for all countries within the Caribbean region.",
    "keywords": []
  },
  "151": {
    "code": "151",
    "category": "Steel",
    "group": "Steel construction",
    "description": "Steel frame buildings consist of steel columns and beams. Use this if the other technical characteristics of the building are unknown.",
    "keywords": []
  },
  "152": {
    "code": "152",
    "category": "Light Metal",
    "group": "Steel construction",
    "description": "Light metal buildings are made of light gauge steel frame and are usually clad with lightweight metal or asbestos siding and roof, often corrugated. They typically are low-rise structures. Corresponds to ISO Class 3 (Noncombustible).",
    "keywords": ["iso 3", "iso 3 noncombustible", "noncombustible", "light metal", "pemb", "pre-engineered metal", "steel siding"]
  },
  "153": {
    "code": "153",
    "category": "Braced Steel Frame",
    "group": "Steel construction",
    "description": "Buildings constructed with steel columns and beams that are braced with diagonal steel members to resist lateral forces.",
    "keywords": []
  },
  "154": {
    "code": "154",
    "category": "Steel MRF - Perimeter",
    "group": "Steel construction",
    "description": "Buildings constructed with steel columns and beams that use only the frame members on the periphery of the structure to carry lateral loads. The internal beams and columns only carry the gravity load to the foundation.",
    "keywords": []
  },
  "155": {
    "code": "155",
    "category": "Steel MRF - Distributed",
    "group": "Steel construction",
    "description": "Buildings constructed with steel columns and beams to carry lateral loads distributed throughout the building. The diaphragms are usually concrete, sometimes over steel decking. This structural type is seldom used for low-rise buildings.",
    "keywords": []
  },
  "156": {
    "code": "156",
    "category": "Steel MRF",
    "group": "Steel construction",
    "description": "Steel MRF buildings consist of structural steel columns and beams. Lateral loads due to earthquakes are carried by the \"moment-resisting frames,\" but the locations of the moment-resisting frames in the building are unknown.",
    "keywords": []
  },
  "157": {
    "code": "157",
    "category": "Steel Frame with URM",
    "group": "Steel construction",
    "description": "Structural steel columns and beams form \"moment-resisting frames\" to carry lateral loads due to earthquakes. Unreinforced masonry walls are used as infills between the columns to add lateral load resistance, but are not intended to serve as vertical load-bearing elements. Sometimes the steel frames are completely hidden in the masonry walls.",
    "keywords": []
  },
  "158": {
    "code": "158",
    "category": "Steel Frame with Concrete Shear Wall",
    "group": "Steel construction",
    "description": "Structural steel columns and beams form exterior frames, but the joints are not designed for moment resistance. Lateral loads due to earthquakes are carried by reinforced concrete \"shear\" walls. The concrete walls are continuous from the foundation to the roof.",
    "keywords": []
  },
  "159": {
    "code": "159",
    "category": "Steel Reinforced Concrete",
    "group": "Steel construction",
    "description": "Structural steel sections (beams and columns) are encased in reinforced concrete. The encased structural steel columns are sometimes discontinued in the upper portions of the buildings, making the columns in the upper floor regular reinforced concrete columns.",
    "keywords": []
  },
  "160": {
    "code": "160",
    "category": "Steel Long Span",
    "group": "Steel construction",
    "description": "Steel long-span buildings create unobstructed, column-free spaces greater than 100 feet for a variety of activities or functions. These include activities where visibility is important for large audiences (e.g., auditoriums and covered stadiums), where flexibility is important (e.g., exhibition halls and certain types of manufacturing facilities), and where large movable objects are housed. Two-hinge (made of a single member hinged at each end) and three-hinge (made of two members hinged at each end and at the meeting point at the crown) trussed arches are widely used.",
    "keywords": []
  },
  "161": {
    "code": "161",
    "category": "M: Fire-resistant reinforced concrete apartments and masonry dwellings",
    "group": "Japan composite construction",
    "description": "New residential fire code; concrete, concrete block, masonry, stone, fire-resistant dwellings. Currently supported only for locations in Japan.",
    "keywords": []
  },
  "162": {
    "code": "162",
    "category": "T: Fire-resistant non-apartment dwellings including reinforced concrete, masonry, and steel",
    "group": "Japan composite construction",
    "description": "New residential fire code; steel, semi-fire-resistant. Currently supported only for locations in Japan.",
    "keywords": []
  },
  "163": {
    "code": "163",
    "category": "H: Other Residential Dwellings (buildings other than M, T)",
    "group": "Japan composite construction",
    "description": "New residential fire code; other dwellings. Currently supported only for locations in Japan.",
    "keywords": []
  },
  "164": {
    "code": "164",
    "category": "1: Fire-resistant reinforced concrete and masonry buildings",
    "group": "Japan composite construction",
    "description": "New commercial fire code; concrete, concrete block, masonry, stone, fire-resistant dwellings. Currently supported only for locations in Japan.",
    "keywords": []
  },
  "165": {
    "code": "165",
    "category": "2: Semi-fire-resistant and steel buildings",
    "group": "Japan composite construction",
    "description": "New commercial fire code; steel, semi-fire-resistant. Currently supported only for locations in Japan.",
    "keywords": []
  },
  "166": {
    "code": "166",
    "category": "3: Other Commercial Dwellings (buildings other than 1, 2)",
    "group": "Japan composite construction",
    "description": "New commercial fire code; other dwellings. Currently supported only for locations in Japan.",
    "keywords": []
  },
  "171": {
    "code": "171",
    "category": "A: Reinforced Concrete, Steel with Fire Insulation Dwellings",
    "group": "Japan composite construction",
    "description": "Main structure (column, beam, and floor) is constructed of concrete or steel covered with noncombustible material. Roof and external walls are built using nonflammable material.",
    "keywords": []
  },
  "172": {
    "code": "172",
    "category": "B: General Steel Dwellings",
    "group": "Japan composite construction",
    "description": "(1) External walls consist of any one of the following: concrete, concrete material, brick or stone masonry. (2) Steel structure with external walls of nonflammable material or covered with noncombustible material.",
    "keywords": []
  },
  "173": {
    "code": "173",
    "category": "C: Wood Frame with Fire Insulation Dwellings",
    "group": "Japan composite construction",
    "description": "(1) Wood frame with external walls of any of the following: cement or mortar plating, stone pitching or tile hinging. (2) Steel structure that does not come under Class B. Excluding building with external walls of boarding and/or synthetic resin hanging and/or cloth hanging.",
    "keywords": []
  },
  "174": {
    "code": "174",
    "category": "D: Other than A, B, C; or General Wood Dwellings",
    "group": "Japan composite construction",
    "description": "Building other than Class A, B, and C.",
    "keywords": []
  },
  "175": {
    "code": "175",
    "category": "SP: Reinforced Concrete Buildings",
    "group": "Japan composite construction",
    "description": "Main structure (column, beam, and floor) is constructed of concrete and all external walls are of any one of the following: concrete, concrete material, brick, or stone masonry.",
    "keywords": []
  },
  "176": {
    "code": "176",
    "category": "1: Steel with Fire Insulation Buildings",
    "group": "Japan composite construction",
    "description": "(1) Main structure (column, beam, and floor) is constructed of concrete or steel covered with noncombustible material. Roof and external walls are built using nonflammable material. (2) Main structure (column, beam, and floor) is constructed of wood and/or steel covered with noncombustible material. Roof and external walls are built of or covered by nonflammable and/or semi-nonflammable material. Column, beam, floor, and external walls are to be resistant against the heat under normal fire conditions for at least 1 hour.",
    "keywords": []
  },
  "177": {
    "code": "177",
    "category": "2: General Steel Buildings",
    "group": "Japan composite construction",
    "description": "(1) External walls consist of any one of the following: concrete / concrete block / brick / stone masonry. (2) Steel structure with external walls of nonflammable and/or semi-nonflammable material or covered with noncombustible material. (3) Main structure (column, beam, and floor) is constructed of wood and/or steel covered with noncombustible material. Roof and external walls consist of or are covered by nonflammable and/or semi-nonflammable materials. Column, beam, floor, and external walls to be resistant against the heat under normal fire conditions for at least 45 minutes.",
    "keywords": []
  },
  "178": {
    "code": "178",
    "category": "3: Wood Frame with Fire Insulation Buildings",
    "group": "Japan composite construction",
    "description": "(1) Wood frame (and not applicable to Class 1 or 2) with external walls of nonflammable and/or semi-nonflammable material or covered with noncombustible material. (2) Steel structure that does not come under Class 1 or 2. Excluding building with external walls of boarding and/or synthetic resin hanging and/or cloth hanging.",
    "keywords": []
  },
  "179": {
    "code": "179",
    "category": "4: Other than SP, 1, 2, 3; or General Wood Frame",
    "group": "Japan composite construction",
    "description": "Buildings other than Class SP, 1, 2, and 3.",
    "keywords": []
  },
  "181": {
    "code": "181",
    "category": "Long Span",
    "group": "Special construction",
    "description": "Building constructed with steel frame and metal siding and roof of wood or other combustible material. Typically gymnasiums or auditoriums.",
    "keywords": []
  },
  "182": {
    "code": "182",
    "category": "Semi-Wind Resistive",
    "group": "Special construction",
    "description": "A building for which a licensed engineer does not design the structure, but an attempt is made to build in accordance with an accepted wind building code; code compliance is not assured. Some engineering input may have occurred. Most of the details in a wind resistive structure are found in a semi-wind resistive structure, but not all components are wind resistive.",
    "keywords": []
  },
  "183": {
    "code": "183",
    "category": "Wind Resistive",
    "group": "Special construction",
    "description": "A structure that was designed by a licensed engineer to comply with the wind code. Characterized by the presence of properly sized wind-resistant connectors, adequate bracing, and a continuous load path from the roof to the foundation (that s, the roof is tied to the walls, the floors are attached to each other, and the walls are tied to the foundation).",
    "keywords": []
  },
  "185": {
    "code": "185",
    "category": "Unknown Glass",
    "group": "Special construction",
    "description": "Use this construction code for the Verisk Hurricane Model for the United States Plate Glass Module when the type of glass is unknown. This construction type is valid only for the Plate Glass Module of theVerisk Hurricane Model for the United States. Use only in conjunction with occupancy code 306 or 311.",
    "keywords": []
  },
  "186": {
    "code": "186",
    "category": "Safety Glass",
    "group": "Special construction",
    "description": "Safety glass includes fully tempered and laminated glass. Fully tempered glass is created by heating common annealed glass uniformly to make a high-strengthened glass. Laminated glass is made by sandwiching a plastic sheet between two glass panels, which prevents shattering and helps maintains the integrity of the building envelop even after its breakage. This construction type is valid only for the Plate Glass Module of the Verisk Hurricane Model for the United States. Use only in conjunction with residential occupancy code 306 or commercial occupancy code 311.",
    "keywords": []
  },
  "187": {
    "code": "187",
    "category": "Impact Resistance Glass",
    "group": "Special construction",
    "description": "Impact-resistant glass similar to laminated glass (as described above), which has been tested to resist breakage from flying debris during hurricanes. Impact-resistant glass is typically thicker than safety glass and is packaged as a unit that includes a special frame. This construction type is valid only for the Plate Glass Module of the Verisk Hurricane Model for the United States. Use only in conjunction with residential occupancy code 306 or commercial 311.",
    "keywords": []
  },
  "191": {
    "code": "191",
    "category": "Mobile Homes",
    "group": "Mobile home construction",
    "description": "Represents a weighted average of tie-down types, including no tie-downs. Use this code for a mobile home (manufactured home) when the tie-down information is unknown.",
    "keywords": []
  },
  "192": {
    "code": "192",
    "category": "Mobile Home with No Tie-Downs",
    "group": "Mobile home construction",
    "description": "Use this code for a mobile home (manufactured home) with no anchoring systems present.",
    "keywords": []
  },
  "193": {
    "code": "193",
    "category": "Mobile Home with Partial Tie-Downs",
    "group": "Mobile home construction",
    "description": "Use this code for a mobile home (manufactured home) when the tie-downs are either over-the-top ties or frame ties, but not both, or with fewer ties than recommended by the manufacturer.",
    "keywords": []
  },
  "194": {
    "code": "194",
    "category": "Mobile Home with Full Tie-Downs",
    "group": "Mobile home construction",
    "description": "Use this code for a mobile home (manufactured home) when the anchoring system uses both over-the-top ties and frame ties. Typically, ten frame ties and seven over-the-top ties are required for full tie-down in single-wide mobile homes.",
    "keywords": []
  },
  "201": {
    "code": "201",
    "category": "Conventional - Multiple Span Bridges",
    "group": "Bridge construction",
    "description": "Bridges having multiple simple spans with each span being less than 500 feet. These bridges may be constructed of concrete, steel, or timber. Valid only for the U.S. and Canada, but not when the peril is Severe Thunderstorm (PWX). Use in conjunction with occupancy class 300.",
    "keywords": []
  },
  "202": {
    "code": "202",
    "category": "Conventional - Continuous Bridges",
    "group": "Bridge construction",
    "description": "Bridges having continuous spans of less than 500 feet. These bridges may be constructed of concrete, steel, or timber. Valid only for the U.S. and Canada, but not when the peril is Severe Thunderstorm (PWX). Use in conjunction with occupancy class 300.",
    "keywords": []
  },
  "203": {
    "code": "203",
    "category": "Major Bridges",
    "group": "Bridge construction",
    "description": "Bridges having individual spans of 500 feet or more. These bridges may be constructed of concrete or steel. Valid only for the U.S. and Canada, but not when the peril is Severe Thunderstorm (PWX). Use in conjunction with occupancy class 300.",
    "keywords": []
  },
  "204": {
    "code": "204",
    "category": "Railroads",
    "group": "Pavement construction",
    "description": "Railroads of any kind used to carry trains",
    "keywords": []
  },
  "205": {
    "code": "205",
    "category": "Highways",
    "group": "Pavement construction",
    "description": "Concrete, asphalt, or gravel highways",
    "keywords": []
  },
  "206": {
    "code": "206",
    "category": "Runways",
    "group": "Pavement construction",
    "description": "Concrete or asphalt airport runways",
    "keywords": []
  },
  "211": {
    "code": "211",
    "category": "Concrete Dams",
    "group": "Dam construction",
    "description": "Poured-in-place reinforced concrete dams",
    "keywords": []
  },
  "212": {
    "code": "212",
    "category": "Earthfill Dams",
    "group": "Dam construction",
    "description": "Dams constructed from earth",
    "keywords": []
  },
  "213": {
    "code": "213",
    "category": "Alluvium Tunnels",
    "group": "Tunnel construction",
    "description": "Tunnels that were drilled through unconsolidated sedimentary deposits and then typically lined with concrete For exposures in South America, use code 2131.",
    "keywords": []
  },
  "214": {
    "code": "214",
    "category": "Rock Tunnels",
    "group": "Tunnel construction",
    "description": "Rock tunnels are lined or unlined tunnels that were drilled through rock. For exposures in South America, use 2141.",
    "keywords": []
  },
  "215": {
    "code": "215",
    "category": "Cut and Cover Tunnels",
    "group": "Tunnel construction",
    "description": "Tunnels that were constructed by cutting a trench, installing a liner, and then covering the liner with earth.",
    "keywords": []
  },
  "221": {
    "code": "221",
    "category": "Underground Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Underground tanks that are designed to hold liquids. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit construction storage tank construction code 2211.",
    "keywords": []
  },
  "222": {
    "code": "222",
    "category": "Underground Solid Tanks",
    "group": "Storage tank construction",
    "description": "Underground storage tanks that are designed to hold solid material. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2221.",
    "keywords": []
  },
  "223": {
    "code": "223",
    "category": "On Ground Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Above ground storage tanks located on the ground surface that are designed to hold liquids. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2231.",
    "keywords": []
  },
  "224": {
    "code": "224",
    "category": "On Ground Solid Tanks",
    "group": "Storage tank construction",
    "description": "Above ground storage tanks located on the ground surface that are designed to hold solid material. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2241.",
    "keywords": []
  },
  "225": {
    "code": "225",
    "category": "Elevated Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Above ground storage tanks located above the ground surface that are designed to hold liquids. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2251.",
    "keywords": []
  },
  "226": {
    "code": "226",
    "category": "Elevated Solid Tanks",
    "group": "Storage tank construction",
    "description": "Above ground storage tanks located above the ground surface that are designed to hold solid material. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2261.",
    "keywords": []
  },
  "227": {
    "code": "227",
    "category": "Underground Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located under the surface of the ground. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit pipeline construction code 2271.",
    "keywords": []
  },
  "228": {
    "code": "228",
    "category": "At Grade Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located at the surface of the ground. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit pipeline construction code 2281.",
    "keywords": []
  },
  "231": {
    "code": "231",
    "category": "Masonry Chimneys",
    "group": "Chimney construction",
    "description": "Masonry chimneys over 30 feet high",
    "keywords": []
  },
  "232": {
    "code": "232",
    "category": "Concrete Chimneys",
    "group": "Chimney construction",
    "description": "Reinforced concrete chimneys over 30 feet high",
    "keywords": []
  },
  "233": {
    "code": "233",
    "category": "Steel Chimneys",
    "group": "Chimney construction",
    "description": "Steel chimneys over 30 feet high",
    "keywords": []
  },
  "234": {
    "code": "234",
    "category": "Electrical Transmission - Conventional",
    "group": "Tower construction",
    "description": "Steel towers under 100 feet high designed to hold up electrical transmission lines",
    "keywords": []
  },
  "235": {
    "code": "235",
    "category": "Electrical Transmission - Major",
    "group": "Tower construction",
    "description": "Steel towers over 100 feet high designed to hold up electrical transmission lines",
    "keywords": []
  },
  "236": {
    "code": "236",
    "category": "Broadcast Towers",
    "group": "Tower construction",
    "description": "Steel towers designed to carry radio, TV, or cell phone transmission equipment",
    "keywords": []
  },
  "237": {
    "code": "237",
    "category": "Observation Towers",
    "group": "Tower construction",
    "description": "Elevated towers designed for people to look out of, such as airport control or fire observation towers",
    "keywords": []
  },
  "238": {
    "code": "238",
    "category": "Offshore Towers",
    "group": "Tower construction",
    "description": "Offshore towers are towers with a platform that are anchored to the ground under the ocean",
    "keywords": []
  },
  "239": {
    "code": "239",
    "category": "Onshore Wind Turbines",
    "group": "Onshore asset",
    "description": "Onshore wind turbines are installed individually, and in groups called \"wind farms.\". Wind turbine systems comprise a tower, hub and blades (the rotor), and nacelle (houses the generator). They are typically attached to a reinforced concrete foundation. Based on the wind characteristics of the site, these structures are generally designed to conform to the International Electrotechnical Commission (IEC) 61400-1 wind turbine design class.",
    "keywords": []
  },
  "240": {
    "code": "240",
    "category": "Offshore Wind Turbines",
    "group": "Offshore asset",
    "description": "Offshore wind turbines are installed individually and in groups called \"wind farms\". Wind turbine systems comprise a tower, hub and blades (the rotor), and nacelle (houses the generator). They are typically attached to a reinforced concrete foundation. Based on the wind characteristics of the site, these structures are generally designed to conform to the International Electrotechnical Commission (IEC) 61400-1 wind turbine design class.",
    "keywords": []
  },
  "241": {
    "code": "241",
    "category": "Residential Equipment",
    "group": "Equipment construction",
    "description": "Residential furnishings including furniture and appliances",
    "keywords": []
  },
  "242": {
    "code": "242",
    "category": "Office Equipment",
    "group": "Equipment construction",
    "description": "Office furniture, file cabinets, PCs, etc.",
    "keywords": []
  },
  "243": {
    "code": "243",
    "category": "Electrical Equipment",
    "group": "Equipment construction",
    "description": "Non-high tech electrical equipment other than electrical equipment included as part of the function of the building",
    "keywords": []
  },
  "244": {
    "code": "244",
    "category": "Mechanical Equipment",
    "group": "Equipment construction",
    "description": "All equipment not otherwise classified in a building",
    "keywords": []
  },
  "245": {
    "code": "245",
    "category": "High Technology Equipment",
    "group": "Equipment construction",
    "description": "Sensitive equipment easily damaged by shaking",
    "keywords": []
  },
  "246": {
    "code": "246",
    "category": "Trains, Trucks, Airplanes",
    "group": "Equipment construction",
    "description": "Any type of train, truck, or airplane",
    "keywords": []
  },
  "247": {
    "code": "247",
    "category": "Thermal Power Plant",
    "group": "Equipment construction",
    "description": "Thermal power plants are energy centers that convert heat energy into electrical energy. In Japan, heat is usually generated by fuel, coal, or nuclear. Plants typically include components, such as boilers (or reactors), gas turbines, pumps, generators, cooling towers, power transmission lines, substations, transformers, bushings, circuit breakers/switches, waste management facilities, and building structures supporting operation of the plant or for administrative purposes. Valid for Japan only. Use in conjunction with occupancy class 384 (Construction/Erection Risks) only for the earthquake peril.",
    "keywords": []
  },
  "250": {
    "code": "250",
    "category": "Railway Property",
    "group": "Miscellaneous construction",
    "description": "Warning: This code is not valid for any peril in the United States, for the Verisk Typhoon Model for South Korea, Verisk Inland Flood Model for Malaysia and Indonesia , or for the Verisk Bushfire Model for Australia.Railway properties are composed of major components of railway systems, which include railway stations, railway tunnels, railway bridges, railway tracks, and cables along the tracks but excluding trains.",
    "keywords": []
  },
  "251": {
    "code": "251",
    "category": "Pumping Stations",
    "group": "Miscellaneous construction",
    "description": "Structures with mechanical devices that are typically used when a fluid material must be raised from a low point to a point of higher elevation, or where the topography prevents downhill gravity flow",
    "keywords": []
  },
  "252": {
    "code": "252",
    "category": "Compressor Stations",
    "group": "Miscellaneous construction",
    "description": "Structures with mechanical devices that are used for increasing the pressure of a gas by mechanically decreasing its volume",
    "keywords": []
  },
  "253": {
    "code": "253",
    "category": "Cranes",
    "group": "Miscellaneous construction",
    "description": "Machines used for raising, shifting, and lowering heavy weights by means of a projecting swinging arm or by means of a hoisting apparatus supported on an overhead track",
    "keywords": []
  },
  "254": {
    "code": "254",
    "category": "Conveyor Systems",
    "group": "Miscellaneous construction",
    "description": "Devices used for moving loose material (typically on a belt, on rollers, or in an auger)",
    "keywords": []
  },
  "255": {
    "code": "255",
    "category": "Canals",
    "group": "Miscellaneous construction",
    "description": "An artificial waterway of any depth used for draining or irrigating land or for navigation",
    "keywords": []
  },
  "256": {
    "code": "256",
    "category": "Earth Retaining Structures",
    "group": "Miscellaneous construction",
    "description": "Earth retaining structures taller than 20 feet high",
    "keywords": []
  },
  "257": {
    "code": "257",
    "category": "Waterfront Structures",
    "group": "Miscellaneous construction",
    "description": "Wharves or docks built next to the shore of navigable waters so that ships can receive and discharge cargo and passengers, or walls of artificially enclosed basins into which vessels are brought for inspection and repair",
    "keywords": []
  },
  "258": {
    "code": "258",
    "category": "Offshore Structures",
    "group": "Miscellaneous construction",
    "description": "A structure that is anchored to the ground under the ocean",
    "keywords": []
  },
  "259": {
    "code": "259",
    "category": "Transit Warehouse",
    "group": "Miscellaneous construction",
    "description": "Often refers to distribution centers that temporarily store various commodities for further distribution, including wholesale stores. The commodities can be light (e.g., food, drug, light fabrication of clothing, high-technology electrical items) or heavy (e.g., heavy construction machineries). Warehouses are typically one-story steel frame or SRC (steel-reinforced concrete) construction with high ceilings. Most of the commodities are well packed and can be stacked during storage.",
    "keywords": []
  },
  "260": {
    "code": "260",
    "category": "Marine Hull",
    "group": "Miscellaneous construction",
    "description": "Marine hull insurance covers the hull and machinery of a vessel. Specific ports or docks include loading or unloading (port risk), under construction (builders' risk), and repair (repairing risk). When paired with a particular occupancy code, reflects the vulnerability of the hull: 300—reflects the vulnerability of the hull in unknown conditions. 314—reflects the vulnerability of the hull under repair. 354—reflects the vulnerability of the hull at port. 381—reflects the vulnerability of the hull under construction.",
    "keywords": []
  },
  "261": {
    "code": "261",
    "category": "Automobiles",
    "group": "Automobile construction",
    "description": "Typically a four-wheeled automotive vehicle designed for passenger transportation. For all regions outside the United States, use occupancy class code 300 with construction class 261. To model automobile dealerships in the United States using the Verisk Severe Thunderstorm Model for the United States, Verisk Severe Thunderstorm Model for Canada, or the Verisk Hurricane Model for the United States, use construction class code 261 with occupancy class codes 312 or 313. The Verisk Severe Thunderstorm Model for the United States, Verisk Severe Thunderstorm Model for Canada, and the Verisk Hurricane Model for the United States provide separate damage functions for standard automobiles and for automotive dealerships. The automotive dealer damage function (construction class code 261 with occupancy class code 312 or 313) assumes that the majority of the vehicles are parked outside in the open. Accordingly, for a dealership with the majority of the cars outside and few inside, we recommend coding all this exposure with construction class code 261 and occupancy class code 312 or 313. However, if the majority of the cars are inside the dealership, for example, a dealership in a city in which there are a few cars in a showroom, we recommend coding the automobile exposure as Content Coverage C, and supplying the appropriate construction and occupancy class codes for the dealership itself. If you are also modeling the physical structure of the dealership, include the replacement value in the Coverage A field.",
    "keywords": []
  },
  "262": {
    "code": "262",
    "category": "Automobiles",
    "group": "Automobile construction",
    "description": "Typically a four-wheeled automotive vehicle designed for passenger transportation.",
    "keywords": []
  },
  "263": {
    "code": "263",
    "category": "Automobiles",
    "group": "Automobile construction",
    "description": "Typically a two-wheeled automotive vehicle designed for passenger transportation; may include a side car with a third wheel.",
    "keywords": []
  },
  "265": {
    "code": "265",
    "category": "Pleasure Boats and Yachts",
    "group": "Marine craft construction",
    "description": "Typically, privately-owned boats that can be used for recreation, fishing, or cruising. This description is meant to exclude commercial vessels, such as cargo ships or tugboats. Use this construction code if the boat's power/sail classification is unknown.",
    "keywords": []
  },
  "266": {
    "code": "266",
    "category": "Pleasure Boats and Yachts, Power Boats",
    "group": "Marine craft construction",
    "description": "A pleasure boat that is powered only by a motor (no sails)",
    "keywords": []
  },
  "267": {
    "code": "267",
    "category": "Pleasure Boats and Yachts, Sail Boats",
    "group": "Marine craft construction",
    "description": "A pleasure boat that is capable of being powered by wind through the use of sails. Use this construction code to model boats that have both sails and a motor .",
    "keywords": []
  },
  "270": {
    "code": "270",
    "category": "Carpool",
    "group": "Marine cargo construction",
    "description": "Open areas close to harbors where thousands of cars are gridded before being shipped on Personal Car Carriers (PCCs).1",
    "keywords": []
  },
  "271": {
    "code": "271",
    "category": "General and Containerized Cargo",
    "group": "Marine cargo construction",
    "description": "Cubicles 8 feet in width, 8.5 feet in height, and 20 or 40 feet in length in which commodities are packed. Cubicles are usually stacked on ships, trains, or airplanes for long-distance transportation.1",
    "keywords": []
  },
  "272": {
    "code": "272",
    "category": "Heavy Cargo",
    "group": "Marine cargo construction",
    "description": "Heavy cargoes are usually heavy machinery that cannot fit into a standard container, such as jack-up and semi-submersible rigs, dredging equipment, luxury yachts, offshore production modules and sub-sea structures, construction machinery, container cranes and harbor equipment, and complete factories. Vessels used for this type of cargo are usually semi-submersible heavy lift ships, conventional heavy lift ships, tow barges and dock ships. Heavy cargo is sometimes containerized. 1",
    "keywords": []
  },
  "273": {
    "code": "273",
    "category": "Refrigerated Cargo",
    "group": "Marine cargo construction",
    "description": "Refrigerated cargo is similar to general containerized cargo, but with additional cooling equipment to keep commodities fresh. Commodities are commonly fruits and frozen goods. This type of containerized cargo requires an external source of power to maintain a temperature-controlled environment.1",
    "keywords": []
  },
  "274": {
    "code": "274",
    "category": "Dry Bulk Cargo",
    "group": "Marine cargo construction",
    "description": "Bare solid materials, such as coal, metal ore, lumber, and grains.1",
    "keywords": []
  },
  "275": {
    "code": "275",
    "category": "Liquid Bulk Cargo",
    "group": "Marine cargo construction",
    "description": "Bare liquid material, such as oil, liquefied natural gas, and liquid chemicals. Liquid bulk cargo is generally stored in tank farms on shore.1",
    "keywords": []
  },
  "276": {
    "code": "276",
    "category": "General/Unknown",
    "group": "Marine cargo construction",
    "description": "Supported for both the Verisk Earthquake Model for Japan and the Verisk Typhoon Model for Japan, and for some locations in Europe, including Central Europe. It is also supported in the Verisk Earthquake Model for New Zealand and theVerisk Hurricane Model for the United States.1",
    "keywords": []
  },
  "280": {
    "code": "280",
    "category": "Combustible: Carpool",
    "group": "Marine cargo construction",
    "description": "Open areas close to harbors where thousands of cars are gridded before being shipped on Personal Car Carriers (PCCs).",
    "keywords": []
  },
  "281": {
    "code": "281",
    "category": "Combustible: General and Containerized Cargo",
    "group": "Marine cargo construction",
    "description": "Cubicles 8 feet in width, 8.5 feet in height, and 20 or 40 feet in length in which commodities are packed. Cubicles are usually stacked on ships, trains, or airplanes for long-distance transportation.",
    "keywords": []
  },
  "282": {
    "code": "282",
    "category": "Combustible: Heavy Cargo",
    "group": "Marine cargo construction",
    "description": "Heavy cargoes are usually heavy machinery that cannot fit into a standard container, such as jack-up and semi-submersible rigs, dredging equipment, luxury yachts, offshore production modules and sub-sea structures, construction machinery, container cranes and harbor equipment, and complete factories. Vessels used for this type of cargo are usually semi-submersible heavy lift ships, conventional heavy lift ships, tow barges, and dock ships. Heavy cargo is sometimes containerized.",
    "keywords": []
  },
  "283": {
    "code": "283",
    "category": "Combustible: Refrigerated Cargo",
    "group": "Marine cargo construction",
    "description": "Refrigerated cargo is similar to general containerized cargo, but with additional cooling equipment to keep commodities fresh. Commodities are commonly fruits and frozen goods. This type of containerized cargo requires an external source of power to maintain a temperature-controlled environment.",
    "keywords": []
  },
  "284": {
    "code": "284",
    "category": "Combustible: Dry Bulk Cargo",
    "group": "Marine cargo construction",
    "description": "Bare solid materials, such as coal, metal ore, lumber, and grains.",
    "keywords": []
  },
  "285": {
    "code": "285",
    "category": "Combustible: Liquid Bulk Cargo",
    "group": "Marine cargo construction",
    "description": "Bare liquid material, such as oil, liquefied natural gas, and liquid chemicals. Liquid bulk cargo is generally stored in tank farms on shore.",
    "keywords": []
  },
  "286": {
    "code": "286",
    "category": "Unknown Marine Cargo, Combustible",
    "group": "Marine cargo construction",
    "description": "Supported for the Verisk Earthquake Model for Japan.",
    "keywords": []
  },
  "290": {
    "code": "290",
    "category": "Non-Combustible: Carpool",
    "group": "Marine cargo construction",
    "description": "Open areas close to harbors where thousands of cars are gridded before being shipped on Personal Car Carriers (PCCs).",
    "keywords": []
  },
  "291": {
    "code": "291",
    "category": "Non-Combustible: General and Containerized Cargo",
    "group": "Marine cargo construction",
    "description": "Cubicles 8 feet in width, 8.5 feet in height, and 20 or 40 feet in length in which commodities are packed. Cubicles are usually stacked on ships, trains, or airplanes for long-distance transportation.",
    "keywords": []
  },
  "292": {
    "code": "292",
    "category": "Non-Combustible: Heavy Cargo",
    "group": "Marine cargo construction",
    "description": "Heavy cargoes are usually heavy machinery that cannot fit into a standard container, such as jack-up and semi-submersible rigs, dredging equipment, luxury yachts, offshore production modules and sub-sea structures, construction machinery, container cranes and harbor equipment, and complete factories. Vessels used for this type of cargo are usually semi-submersible heavy lift ships, conventional heavy lift ships, tow barges, and dock ships. Heavy cargo is sometimes containerized.",
    "keywords": []
  },
  "293": {
    "code": "293",
    "category": "Non-Combustible: Refrigerated Cargo",
    "group": "Marine cargo construction",
    "description": "Refrigerated cargo is similar to general containerized cargo, but with additional cooling equipment to keep commodities fresh. Commodities are commonly fruits and frozen goods. This type of containerized cargo requires an external source of power to maintain a temperature-controlled environment.",
    "keywords": []
  },
  "294": {
    "code": "294",
    "category": "Non-Combustible: Dry Bulk Cargo",
    "group": "Marine cargo construction",
    "description": "Bare solid materials, such as coal, metal ore, lumber, and grains.",
    "keywords": []
  },
  "295": {
    "code": "295",
    "category": "Non-Combustible: Liquid Bulk Cargo",
    "group": "Marine cargo construction",
    "description": "Bare liquid material, such as oil, liquefied natural gas, and liquid chemicals. Liquid bulk cargo is generally stored in tank farms on shore.",
    "keywords": []
  },
  "296": {
    "code": "296",
    "category": "Unknown Marine Cargo, Non-Combustible",
    "group": "Marine cargo construction",
    "description": "Use this code when no information on cargo type is available. It is mapped to general cargo. Supported only for the Verisk Earthquake Model for Japan and the Verisk Typhoon Model for Japan.",
    "keywords": []
  },
  "500": {
    "code": "500",
    "category": "Solar, rooftop (unknown anchorage)",
    "group": "Solar construction",
    "description": "Panels on flat or pitched roof, unknown mount.",
    "keywords": []
  },
  "501": {
    "code": "501",
    "category": "Solar, rooftop, anchored",
    "group": "Solar construction",
    "description": "Panels attached to the roof using anchors. Typically these are mounted on a pitched roof at the same angle as the pitch of the roof.",
    "keywords": []
  },
  "502": {
    "code": "502",
    "category": "Solar, rooftop, ballasted",
    "group": "Solar construction",
    "description": "Panels mounted on flat roof using ballasts. Typically these are mounted at a fixed angle.",
    "keywords": []
  },
  "510": {
    "code": "510",
    "category": "Solar ground mounted (on tracker or fixed)",
    "group": "Solar construction",
    "description": "Panels on unknown mount type.",
    "keywords": []
  },
  "511": {
    "code": "511",
    "category": "Solar ground mounted, single axis",
    "group": "Solar construction",
    "description": "Panels move on one axis, typically to track sun east to west.",
    "keywords": []
  },
  "512": {
    "code": "512",
    "category": "Solar ground mounted, dual axis",
    "group": "Solar construction",
    "description": "Panels move on two axes, typically to track sun east to west at a range of altitudes.",
    "keywords": []
  },
  "513": {
    "code": "513",
    "category": "Solar ground mounted, fixed tilt",
    "group": "Solar construction",
    "description": "Panels on a ground-level racking system at a fixed angle.",
    "keywords": []
  },
  "514": {
    "code": "514",
    "category": "BESS (battery energy storage system)",
    "group": "Solar construction",
    "description": "Battery system for ground-mounted solar installations, any occupancy.",
    "keywords": []
  },
  "800": {
    "code": "800",
    "category": "Unknown",
    "group": "Offshore asset",
    "description": "Use this code when the platform construction class is not known.",
    "keywords": []
  },
  "801": {
    "code": "801",
    "category": "Caisson",
    "group": "Offshore asset",
    "description": "Caisson platforms use large diameter caissons to support a single well completion with a minimal deck. The deck is capable of supporting limited production, control equipment, and navigational aids. Caisson platform completions are limited to water depths of 100 feet or less.",
    "keywords": []
  },
  "802": {
    "code": "802",
    "category": "Compliant Tower",
    "group": "Offshore asset",
    "description": "Narrow, flexible towers and piled foundations that can support a conventional deck for drilling and production operations. Unlike fixed platforms, compliant towers withstand large lateral forces by sustaining significant lateral deflections and are usually used in water depths between 1,000 and 2,000 feet.",
    "keywords": []
  },
  "803": {
    "code": "803",
    "category": "Fixed Jacket Platform",
    "group": "Offshore asset",
    "description": "Jackets (a tall vertical section made of tubular steel members supported by piles driven into the seabed) with a deck placed on top, providing space for crew quarters, a drilling rig, and production facilities. Fixed jacket platforms are economically feasible for installation in water depths up to 1,500 feet.",
    "keywords": []
  },
  "804": {
    "code": "804",
    "category": "Jackup",
    "group": "Offshore asset",
    "description": "Platforms that can be jacked up above the sea using legs that can be lowered like jacks. These platforms, used in relatively low depths, are designed to move from place to place and then anchor themselves by deploying the jack-like legs.",
    "keywords": []
  },
  "805": {
    "code": "805",
    "category": "Mini Tension Leg Platform (MTLP)",
    "group": "Offshore asset",
    "description": "Floating platforms of relatively low cost developed for production of smaller deepwater reserves that would be uneconomic to produce using more conventional deepwater production systems. They can also be used as a utility, satellite, or early production platform for larger deepwater discoveries.",
    "keywords": []
  },
  "806": {
    "code": "806",
    "category": "Drill Rig",
    "group": "Offshore asset",
    "description": "Drill rig.",
    "keywords": []
  },
  "807": {
    "code": "807",
    "category": "Semi-Submersible Floating Production System",
    "group": "Offshore asset",
    "description": "These platforms have legs of sufficient buoyancy to cause the structure to float, but weight sufficient to keep the structure upright. These rigs can be moved from place to place and ballasted up or down by altering the amount of flooding in buoyancy tanks. They are generally anchored by cable anchors during drilling operations, though they can also be kept in place by the use of dynamic positioning. Semi-submersibles can be used in depths from 200 to 6,000 feet.",
    "keywords": []
  },
  "808": {
    "code": "808",
    "category": "Drill Ship",
    "group": "Offshore asset",
    "description": "Maritime vessels that have been fitted with drilling apparatuses. They are most often used for exploratory drilling of new oil or gas wells in deep water, but can also be used for scientific drilling. They are often built on modified tanker hulls and outfitted with dynamic positioning systems to maintain their position over a well. Drill ships are able to drill in water depths of over 6,500 feet.",
    "keywords": []
  },
  "809": {
    "code": "809",
    "category": "SPAR Floating Production System",
    "group": "Offshore asset",
    "description": "Large diameter single vertical cylinder supporting a deck. They have typical fixed platform topsides (surface decks with drilling and production equipment), three types of risers (production, drilling, and export), and hulls moored with taut caternary systems of 6 to 20 lines anchored into the seafloor. SPARs are generally used in water depths up to 3,000 feet.",
    "keywords": []
  },
  "810": {
    "code": "810",
    "category": "Submersible Production System",
    "group": "Offshore asset",
    "description": "Floating vessels, usually used as mobile offshore drilling units (MODUs), that are supported primarily on large pontoon-like structures submerged below the sea surface. The operating decks are elevated 100 or more feet above the pontoons on large steel columns. Once on the desired location, this type of structure is slowly flooded until it rests on the sea floor. After the well is completed, the water is pumped out of the buoyancy tanks, and the vessel is refloated and towed to the next location. Submersibles operate in relatively shallow water because they must rest on the seafloor.",
    "keywords": []
  },
  "811": {
    "code": "811",
    "category": "Underwater Production Units, Completion Units, and Templates",
    "group": "Offshore asset",
    "description": "Subsea Systems range from single subsea wells producing to a nearby platform, FPS, or TLP to multiple wells producing through a manifold and pipeline system to a distant production facility. These systems are presently used in water depths greater than 5,000 feet.",
    "keywords": []
  },
  "812": {
    "code": "812",
    "category": "Tension Leg Platform",
    "group": "Offshore asset",
    "description": "A floating structure held in place by vertical, tensioned tendons connected to the sea floor by pile-secured templates. Tensioned tendons provide for the use of a TLP in a broad water depth range with limited vertical motion. Larger TLPs have been successfully deployed in water depths approaching 4,000 feet.",
    "keywords": []
  },
  "813": {
    "code": "813",
    "category": "Well Protector",
    "group": "Offshore asset",
    "description": "Well head protection structures.",
    "keywords": []
  },
  "2010": {
    "code": "2010",
    "category": "Unknown Bridge (Non-Seismic or Seismic)",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges with individual span length less than 500 feet with unknown material of construction, unknown number of spans, and unknown support conditions, or other unknown bridges that cannot be mapped to any of the other bridge construction class codes. Touchstone determines whether a bridge is seismically or non-seismically designed via the bridge's year built information; the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2011": {
    "code": "2011",
    "category": "Multi-Span Simply Supported (Non-Seismic or Seismic) Concrete Bridge",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges constructed of concrete and consisting of multiple simply supported spans, with individual span length less than 500 feet, spanning between consecutive piers and between abutments and piers. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information, and the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2012": {
    "code": "2012",
    "category": "Multi-Span Simply Supported (Non-Seismic or Seismic) Steel Bridge",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges constructed of steel and consisting of multiple simply supported spans, with individual span length less than 500 feet, spanning between consecutive piers and between abutments and piers. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information; the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2013": {
    "code": "2013",
    "category": "Single Span (Non-Seismic or Seismic) Bridge",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges constructed of steel or concrete and with a single span less than 500 feet spanning between abutments without intermediate piers. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information; the determination varies by country depending on each country's respective effective bridge design code. For single-span bridges, the construction material does not matter.",
    "keywords": []
  },
  "2015": {
    "code": "2015",
    "category": "General Concrete (Non-Seismic or Seismic) Bridge",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges constructed of concrete with individual span length less than 500 feet, unknown number of spans, and unknown support conditions. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information; the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2016": {
    "code": "2016",
    "category": "General Steel (Non-Seismic or Seismic) Bridge",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges constructed of steel with individual span length less than 500 feet, unknown number of spans, and unknown support conditions. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information; the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2021": {
    "code": "2021",
    "category": "Multi-Span Continuous (Non-Seismic or Seismic) Concrete Bridge",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges constructed of concrete and consisting of multiple continuously supported spans, with individual span length less than 500 feet, spanning between consecutive piers and between abutments and piers. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information; the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2022": {
    "code": "2022",
    "category": "Multi-Span Continuous (Non-Seismic or Seismic) Steel Bridge",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed highway bridges constructed of steel and consisting of multiple continuously supported spans, with individual span length less than 500 feet, spanning between consecutive piers and between abutments and piers. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information; the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2031": {
    "code": "2031",
    "category": "Major Bridge (Non-Seismic or Seismic)",
    "group": "Bridge construction",
    "description": "Seismically or non-seismically designed multiple simply supported or continuously supported bridges of steel or concrete with individual span lengths more than 500 feet. Iconic bridges are also included in this category. Touchstone determines whether a bridge is seismically or non-seismically designed through the bridge's year built information, and the determination varies by country depending on each country's respective effective bridge design code.",
    "keywords": []
  },
  "2131": {
    "code": "2131",
    "category": "Alluvium Tunnels",
    "group": "Tunnel construction",
    "description": "Lined or unlined alluvium tunnels with unknown method of construction.",
    "keywords": []
  },
  "2132": {
    "code": "2132",
    "category": "Alluvial Bored Tunnels",
    "group": "Tunnel construction",
    "description": "Lined or unlined tunnels constructed through alluvium soil using a boring machine.",
    "keywords": []
  },
  "2141": {
    "code": "2141",
    "category": "Rock Tunnels",
    "group": "Tunnel construction",
    "description": "Lined or unlined rock tunnels with unknown method of construction",
    "keywords": []
  },
  "2142": {
    "code": "2142",
    "category": "Rock Bored Tunnels",
    "group": "Tunnel construction",
    "description": "Lined or unlined tunnels drilled through rock using a boring machine.",
    "keywords": []
  },
  "2150": {
    "code": "2150",
    "category": "Unknown Tunnel",
    "group": "Tunnel construction",
    "description": "Lined or unlined tunnels with unknown material and unknown method of construction, or other tunnels that cannot be mapped to any of the other tunnel construction class codes.",
    "keywords": []
  },
  "2151": {
    "code": "2151",
    "category": "Rock Cut and Cover Tunnels",
    "group": "Tunnel construction",
    "description": "Lined or unlined rock tunnels constructed after excavating a trench and roofing over with an overhead support system.",
    "keywords": []
  },
  "2152": {
    "code": "2152",
    "category": "Alluvial Cut and Cover Tunnels",
    "group": "Tunnel construction",
    "description": "Lined or unlined alluvium tunnels constructed after excavating a trench and roofing over with an overhead support system.",
    "keywords": []
  },
  "2210": {
    "code": "2210",
    "category": "Unknown Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks with an unknown material, unknown location, and unknown contents, or other unknowns that cannot be mapped to any of the other storage tank construction class codes.",
    "keywords": []
  },
  "2211": {
    "code": "2211",
    "category": "Underground Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of steel or concrete for holding liquids. Located under the ground.",
    "keywords": []
  },
  "2221": {
    "code": "2221",
    "category": "Underground Solid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of steel or concrete for holding solid material. Located under the ground.",
    "keywords": []
  },
  "2231": {
    "code": "2231",
    "category": "On Ground Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks for holding liquids with an unknown material of construction. Located on the ground surface.",
    "keywords": []
  },
  "2232": {
    "code": "2232",
    "category": "On Ground Steel Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of steel for holding liquids. Located on the ground surface.",
    "keywords": []
  },
  "2233": {
    "code": "2233",
    "category": "On Ground Concrete Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of concrete for holding liquids. Located on the ground surface.",
    "keywords": []
  },
  "2241": {
    "code": "2241",
    "category": "On Ground Solid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks for holding solid material with an unknown material of construction. Located on the ground surface.",
    "keywords": []
  },
  "2242": {
    "code": "2242",
    "category": "On Ground Steel Solid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of steel for holding solid material. Located on the ground surface.",
    "keywords": []
  },
  "2243": {
    "code": "2243",
    "category": "On Ground Concrete Solid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of concrete for holding solid material. Located on the ground surface.",
    "keywords": []
  },
  "2251": {
    "code": "2251",
    "category": "Elevated Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks located above the ground surface for holding liquids with an unknown material of construction",
    "keywords": []
  },
  "2252": {
    "code": "2252",
    "category": "Elevated Steel Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of steel for holding liquids. Located above the ground surface.",
    "keywords": []
  },
  "2253": {
    "code": "2253",
    "category": "Elevated Concrete Liquid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of concrete for holding liquids. Located above the ground surface.",
    "keywords": []
  },
  "2261": {
    "code": "2261",
    "category": "Elevated Solid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks for holding solid material with an unknown material of construction. Located above the ground surface.",
    "keywords": []
  },
  "2262": {
    "code": "2262",
    "category": "Elevated Steel Solid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of steel for holding solid material. Located above the ground surface.",
    "keywords": []
  },
  "2263": {
    "code": "2263",
    "category": "Elevated Concrete Solid Tanks",
    "group": "Storage tank construction",
    "description": "Storage tanks made of concrete for holding solid material. Located above the ground surface.",
    "keywords": []
  },
  "2270": {
    "code": "2270",
    "category": "Unknown Pipeline",
    "group": "Pipeline construction",
    "description": "Pipelines with an unknown location and material, or other unknown pipelines that cannot be mapped to any of the other pipeline construction class codes.",
    "keywords": []
  },
  "2271": {
    "code": "2271",
    "category": "General Underground Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located under the surface of the ground with an unknown material of construction.",
    "keywords": []
  },
  "2272": {
    "code": "2272",
    "category": "Underground Cast Iron Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located under the surface of the ground and made of cast iron material.",
    "keywords": []
  },
  "2273": {
    "code": "2273",
    "category": "Underground Asbestos Cement Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located under the surface of the ground and made of asbestos-cement material.",
    "keywords": []
  },
  "2274": {
    "code": "2274",
    "category": "Underground Concrete Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located under the surface of the ground and made of concrete material.",
    "keywords": []
  },
  "2275": {
    "code": "2275",
    "category": "Underground PVC Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located under the surface of the ground and made of PVC material.",
    "keywords": []
  },
  "2276": {
    "code": "2276",
    "category": "Underground Ductile Iron Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located under the surface of the ground and made of ductile iron material.",
    "keywords": []
  },
  "2281": {
    "code": "2281",
    "category": "General At Grade Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located at the surface of the ground with an unknown material of construction.",
    "keywords": []
  },
  "2282": {
    "code": "2282",
    "category": "At Grade Cast Iron Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located at the surface of the ground and made of cast iron material.",
    "keywords": []
  },
  "2283": {
    "code": "2283",
    "category": "At Grade Asbestos Cement Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located at the surface of the ground and made of asbestos-cement material.",
    "keywords": []
  },
  "2284": {
    "code": "2284",
    "category": "At Grade Concrete Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located at the surface of the ground and made of concrete material.",
    "keywords": []
  },
  "2285": {
    "code": "2285",
    "category": "At Grade PVC Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located at the surface of the ground and made of PVC material.",
    "keywords": []
  },
  "2286": {
    "code": "2286",
    "category": "At Grade Ductile Iron Pipelines",
    "group": "Pipeline construction",
    "description": "Pipelines located at the surface of the ground and made of ductile iron material.",
    "keywords": []
  },
  "2701": {
    "code": "2701",
    "category": "Automobiles",
    "group": "Marine cargo construction",
    "description": "Motor vehicles being transported. Automobile cargoes can be in different storage conditions.",
    "keywords": []
  },
  "2702": {
    "code": "2702",
    "category": "Break Bulk",
    "group": "Marine cargo construction",
    "description": "Loose, non-containerized cargo that is loaded directly on a ship in bags, boxes, crates, etc. Examples of break bulk are paper rolls, barrels, plywood, and pipes.",
    "keywords": []
  },
  "2703": {
    "code": "2703",
    "category": "Dry Bulk",
    "group": "Marine cargo construction",
    "description": "Bare solid materials, such as coal, metal ore, wood pulp, and grains",
    "keywords": []
  },
  "2704": {
    "code": "2704",
    "category": "Liquid Bulk",
    "group": "Marine cargo construction",
    "description": "Bare liquid material, such as oil, liquefied natural gas, and liquid chemicals. Liquid bulk cargo is generally stored in tank farms on shore.",
    "keywords": []
  },
  "2705": {
    "code": "2705",
    "category": "Consumables",
    "group": "Marine cargo construction",
    "description": "Food and beverage cargo. Can be in different storage conditions.",
    "keywords": []
  },
  "2706": {
    "code": "2706",
    "category": "Temperature-controlled",
    "group": "Marine cargo construction",
    "description": "Cargo that needs to be transported under specific temperature conditions, often refrigerated.",
    "keywords": []
  },
  "2707": {
    "code": "2707",
    "category": "Electronics",
    "group": "Marine cargo construction",
    "description": "Cargo that includes electronic devices such as computers, TVs, cell phones, circuits, etc. Can be in different storage conditions.",
    "keywords": []
  },
  "2708": {
    "code": "2708",
    "category": "Chemical Products",
    "group": "Marine cargo construction",
    "description": "Cargo that includes products of basic chemical manufacturing such as acids, alkalis, salts, and organic chemicals, as well as chemical products that are to be used in further manufacturing, including synthetic fibers, plastic materials, dry colors, and pigments. Can be stored in special conditions.",
    "keywords": []
  },
  "2709": {
    "code": "2709",
    "category": "Explosives",
    "group": "Marine cargo construction",
    "description": "Cargo that includes explosive material such as chemicals, fireworks, arms, etc. Can be stored in special conditions.",
    "keywords": []
  },
  "2710": {
    "code": "2710",
    "category": "General Cargo",
    "group": "Marine cargo construction",
    "description": "Cargoes that are not categorized under any other specific type, for example, clothing, staples, sport goods, etc.",
    "keywords": []
  },
  "2711": {
    "code": "2711",
    "category": "Heavy Industry",
    "group": "Marine cargo construction",
    "description": "Heavy machinery that cannot fit into a standard container, such as jack-up and semi-submersible rigs, dredging equipment, luxury yachts, offshore production modules and sub-sea structures, construction machinery, container cranes and harbor equipment, etc.",
    "keywords": []
  },
  "2712": {
    "code": "2712",
    "category": "Light Industry",
    "group": "Marine cargo construction",
    "description": "Cargo that includes the product of light fabrication industry. This can include household and office manufactured products such as fabrics, carpets, rugs, furniture, etc.",
    "keywords": []
  },
  "2713": {
    "code": "2713",
    "category": "Petroleum Products",
    "group": "Marine cargo construction",
    "description": "Cargo that contains petrochemical products such as oil, gas, and LNG. Can be stored in special conditions.",
    "keywords": []
  },
  "2714": {
    "code": "2714",
    "category": "Pharmaceuticals",
    "group": "Marine cargo construction",
    "description": "Cargo that contains pharmaceutical products. Can be in different storage conditions.",
    "keywords": []
  },
  "2715": {
    "code": "2715",
    "category": "Project Cargo",
    "group": "Marine cargo construction",
    "description": "Heavy cargo that includes components of special projects such as turbines for wind farms, railway cars, etc.",
    "keywords": []
  },
  "2716": {
    "code": "2716",
    "category": "Livestock",
    "group": "Marine cargo construction",
    "description": "Livestock being shipped.",
    "keywords": []
  },
  "2717": {
    "code": "2717",
    "category": "General Specie",
    "group": "Marine cargo construction",
    "description": "Statuettes, ornamental articles, fibers, arts and crafts, etc. that can be stored in different places such as in museums, in a house, or in warehouses. In each storage condition they can be stored under various degrees of protection.",
    "keywords": []
  },
  "2718": {
    "code": "2718",
    "category": "Fine Art & Collectibles",
    "group": "Marine cargo construction",
    "description": "Fine arts in the form of paintings, frames, sculpture, etc. that can be stored in different places such as in museums, in a house, or in warehouses. In each storage condition they can be stored under various degrees of protection.",
    "keywords": []
  },
  "2719": {
    "code": "2719",
    "category": "Cash In Transit",
    "group": "Marine cargo construction",
    "description": "Cash being transferred in various storage conditions.",
    "keywords": []
  },
  "2720": {
    "code": "2720",
    "category": "Jewelers Blocks",
    "group": "Marine cargo construction",
    "description": "Jewels, engravings, and valuable metals and stones stored in various conditions.",
    "keywords": []
  }
};

  const ROOF = {
  "GEOMETRY": {
    "0": {
      "code": "0",
      "name": "Unknown/default",
      "shortName": "Unknown",
      "description": "Unknown or unclassified roof geometry.",
      "keywords": []
    },
    "1": {
      "code": "1",
      "name": "Flat",
      "shortName": "Flat",
      "description": "Flat roof (low-slope commercial or residential roof, slope ≤ 2:12 or < 10°).",
      "keywords": [
        "flat",
        "flat roof",
        "low slope",
        "level roof"
      ]
    },
    "2": {
      "code": "2",
      "name": "Gable end without bracing",
      "shortName": "Gable unbraced",
      "description": "Gable roof without bracing (two pitched planes meeting at a central ridge with unbraced vertical end walls).",
      "keywords": [
        "gable",
        "gable roof",
        "unbraced gable",
        "peaked roof",
        "pitched roof"
      ]
    },
    "3": {
      "code": "3",
      "name": "Hip",
      "shortName": "Hip",
      "description": "Hip roof (roof slopes downward toward all exterior walls, superior aerodynamic wind resistance).",
      "keywords": [
        "hip",
        "hip roof",
        "hipped",
        "four-slope"
      ]
    },
    "4": {
      "code": "4",
      "name": "Complex",
      "shortName": "Complex",
      "description": "Complex roof (multiple intersecting valleys, hips, dormers, and gables).",
      "keywords": [
        "complex",
        "complex roof",
        "cut-up roof",
        "multi-gable"
      ]
    },
    "5": {
      "code": "5",
      "name": "Stepped",
      "shortName": "Stepped",
      "description": "Stepped or multi-level roof (varying roof elevations with vertical clerestory steps).",
      "keywords": [
        "stepped",
        "multi-level",
        "stepped roof",
        "clerestory"
      ]
    },
    "6": {
      "code": "6",
      "name": "Shed",
      "shortName": "Shed",
      "description": "Shed or monopitch roof (single pitched roof plane sloping in one direction).",
      "keywords": [
        "shed",
        "shed roof",
        "monopitch",
        "single slope"
      ]
    },
    "7": {
      "code": "7",
      "name": "Mansard",
      "shortName": "Mansard",
      "description": "Mansard roof (two slopes on each of four sides, with lower slope significantly steeper than upper slope).",
      "keywords": [
        "mansard",
        "french mansard",
        "curb roof"
      ]
    },
    "8": {
      "code": "8",
      "name": "Gable end with bracing",
      "shortName": "Gable braced",
      "description": "Gable roof with engineered gable-end structural bracing for hurricane wind resistance.",
      "keywords": [
        "braced gable",
        "gable braced",
        "reinforced gable"
      ]
    },
    "9": {
      "code": "9",
      "name": "Pyramid",
      "shortName": "Pyramid",
      "description": "Pyramid hip roof (four equal triangular slopes meeting at a single central apex peak).",
      "keywords": [
        "pyramid",
        "pyramidal",
        "pavilion roof"
      ]
    },
    "10": {
      "code": "10",
      "name": "Gambrel",
      "shortName": "Gambrel",
      "description": "Gambrel roof (barn-style roof with two symmetrical slopes on each side, lower pitch steeper).",
      "keywords": [
        "gambrel",
        "barn roof",
        "dutch gambrel"
      ]
    }
  },
  "PITCH": {
    "0": {
      "code": "0",
      "name": "Unknown/default",
      "shortName": "Unknown",
      "description": "Unknown roof pitch.",
      "keywords": []
    },
    "1": {
      "code": "1",
      "name": "Low (less than 10°)",
      "shortName": "Low (<10°)",
      "description": "Low slope pitch: Less than 10 degrees (slope ≤ 2:12). Typical for flat, shed, and commercial membrane roofs.",
      "keywords": [
        "low pitch",
        "low slope",
        "<10",
        "flat slope",
        "2:12",
        "1:12"
      ]
    },
    "2": {
      "code": "2",
      "name": "Medium (10° to 30°)",
      "shortName": "Medium (10°-30°)",
      "description": "Medium slope pitch: 10 to 30 degrees (slope 3:12 to 7:12). Standard residential gable and hip roof pitch.",
      "keywords": [
        "medium pitch",
        "10-30",
        "4:12",
        "5:12",
        "6:12",
        "standard pitch"
      ]
    },
    "3": {
      "code": "3",
      "name": "High (more than 30°)",
      "shortName": "High (>30°)",
      "description": "High steep pitch: More than 30 degrees (slope ≥ 8:12). Steep residential roofs, Gothic architecture, church steeples.",
      "keywords": [
        "high pitch",
        "steep pitch",
        ">30",
        "8:12",
        "10:12",
        "12:12",
        "steep slope"
      ]
    }
  },
  "COVERING": {
    "0": {
      "code": "0",
      "name": "Unknown/default",
      "shortName": "Unknown",
      "description": "Unknown roof covering material.",
      "keywords": []
    },
    "1": {
      "code": "1",
      "name": "Asphalt shingles",
      "shortName": "Asphalt shingles",
      "description": "Asphalt shingles (composition shingles, architectural fiberglass shingles, 3-tab shingles). Standard steep-slope residential roofing.",
      "keywords": [
        "asphalt shingle",
        "composition shingle",
        "architectural shingle",
        "3-tab",
        "fiberglass shingle"
      ]
    },
    "2": {
      "code": "2",
      "name": "Wooden shingles",
      "shortName": "Wood shingles",
      "description": "Wood shingles or wood shakes (cedar shake, pine shingles). Combustible steep-slope roof covering.",
      "keywords": [
        "wood shingle",
        "wood shake",
        "cedar shake",
        "shake roof"
      ]
    },
    "3": {
      "code": "3",
      "name": "Clay/concrete tiles",
      "shortName": "Clay/concrete tiles",
      "description": "Clay or concrete tiles (Spanish barrel tile, terracotta tiles, mission tile, concrete S-tiles). Heavy steep-slope roofing.",
      "keywords": [
        "tile",
        "clay tile",
        "concrete tile",
        "spanish tile",
        "terracotta",
        "barrel tile",
        "s-tile"
      ]
    },
    "4": {
      "code": "4",
      "name": "Light metal panels",
      "shortName": "Light metal panels",
      "description": "Light metal panels (corrugated steel, corrugated iron/tin, aluminum panels, copper sheets, 5V crimp, R-panel).",
      "keywords": [
        "metal panel",
        "corrugated metal",
        "tin roof",
        "steel panel",
        "5v crimp",
        "r-panel",
        "copper"
      ]
    },
    "5": {
      "code": "5",
      "name": "Slate",
      "shortName": "Slate",
      "description": "Slate roofing (natural quarry slate tiles, Vermont slate, Buckingham slate). Heavy brittle natural stone steep-slope roofing.",
      "keywords": [
        "slate",
        "natural slate",
        "slate tile",
        "stone slate"
      ]
    },
    "6": {
      "code": "6",
      "name": "Built-up roof with gravel",
      "shortName": "BUR with gravel",
      "description": "Built-up roof with gravel surfacing (BUR with gravel, tar and gravel, flood coat and aggregate gravel). Low-slope roofing.",
      "keywords": [
        "bur with gravel",
        "tar and gravel",
        "pea gravel",
        "built up gravel",
        "gravel bur"
      ]
    },
    "7": {
      "code": "7",
      "name": "Single-ply membrane",
      "shortName": "Single-ply (EPDM/TPO/PVC)",
      "description": "Single-ply membrane (EPDM rubber, TPO thermoplastic polyolefin, PVC polyvinyl chloride, mechanically attached or fully adhered).",
      "keywords": [
        "single ply",
        "single-ply",
        "epdm",
        "tpo",
        "pvc",
        "rubber membrane",
        "membrane roof",
        "hypalon"
      ]
    },
    "8": {
      "code": "8",
      "name": "Standing seam metal roofs",
      "shortName": "Standing seam metal",
      "description": "Architectural standing seam metal roofs (SSMR, concealed fastener metal panels, double-lock standing seam). High wind resistance.",
      "keywords": [
        "standing seam",
        "ssmr",
        "architectural standing seam",
        "concealed fastener metal"
      ]
    },
    "9": {
      "code": "9",
      "name": "Built-up roof without gravel",
      "shortName": "Smooth BUR / Mod Bit",
      "description": "Built-up roof without gravel (Smooth BUR, Modified Bitumen, Mod-Bit, SBS, APP, torch-down, asphalt cap sheet).",
      "keywords": [
        "mod bit",
        "modified bitumen",
        "smooth bur",
        "torch down",
        "sbs",
        "app",
        "cap sheet"
      ]
    },
    "10": {
      "code": "10",
      "name": "Single-ply membrane ballasted",
      "shortName": "Single-ply ballasted",
      "description": "Single-ply membrane ballasted (EPDM or TPO loose-laid membrane held down by river rock gravel or concrete pavers).",
      "keywords": [
        "ballasted",
        "ballasted membrane",
        "river rock epdm",
        "ballast pavers"
      ]
    },
    "11": {
      "code": "11",
      "name": "Hurricane Wind-Rated Roof Coverings",
      "shortName": "Hurricane wind-rated",
      "description": "Hurricane wind-rated roof coverings (Miami-Dade Notice of Acceptance NOA, Factory Mutual FM 1-90, FM 1-120 certified assemblies).",
      "keywords": [
        "hurricane rated",
        "miami-dade noa",
        "wind rated covering",
        "fm 1-90",
        "fm 1-120"
      ]
    },
    "12": {
      "code": "12",
      "name": "Photovoltaic",
      "shortName": "Photovoltaic (solar)",
      "description": "Photovoltaic roof system (building-integrated photovoltaics BIPV, solar shingles, rooftop commercial solar panels).",
      "keywords": [
        "solar",
        "photovoltaic",
        "solar shingles",
        "bipv",
        "rooftop solar"
      ]
    }
  },
  "DECK": {
    "0": {
      "code": "0",
      "name": "Unknown/default",
      "shortName": "Unknown",
      "description": "Unknown roof deck material.",
      "keywords": []
    },
    "1": {
      "code": "1",
      "name": "Plywood",
      "shortName": "Plywood",
      "description": "Plywood structural roof sheathing. Standard combustible wood panel decking.",
      "keywords": [
        "plywood",
        "plywood deck",
        "plywood sheathing"
      ]
    },
    "2": {
      "code": "2",
      "name": "Wood planks",
      "shortName": "Wood planks",
      "description": "Solid wood planks (tongue-and-groove boards, heavy timber decking).",
      "keywords": [
        "wood planks",
        "tongue and groove",
        "t&g",
        "timber deck",
        "heavy timber"
      ]
    },
    "3": {
      "code": "3",
      "name": "Particle board/OSB",
      "shortName": "Particle board/OSB",
      "description": "Particle board or Oriented Strand Board (OSB) structural roof sheathing.",
      "keywords": [
        "osb",
        "particle board",
        "oriented strand board",
        "waferboard"
      ]
    },
    "4": {
      "code": "4",
      "name": "Metal deck with insulation board",
      "shortName": "Metal deck w/ insulation",
      "description": "Steel metal deck with rigid insulation board (polyiso, EPS, perlite). Standard commercial low-slope roof deck.",
      "keywords": [
        "metal deck insulation",
        "steel deck polyiso",
        "insulated metal deck",
        "steel deck"
      ]
    },
    "5": {
      "code": "5",
      "name": "Metal deck with concrete",
      "shortName": "Metal deck w/ concrete",
      "description": "Steel metal deck with cast concrete topping or lightweight insulating concrete.",
      "keywords": [
        "metal deck concrete",
        "composite steel deck",
        "lwic",
        "lightweight concrete deck"
      ]
    },
    "6": {
      "code": "6",
      "name": "Pre-cast concrete slabs",
      "shortName": "Pre-cast concrete slabs",
      "description": "Pre-cast reinforced concrete roof slabs or hollow-core concrete planks.",
      "keywords": [
        "pre-cast concrete",
        "precast slab",
        "hollow core slab"
      ]
    },
    "7": {
      "code": "7",
      "name": "Reinforced concrete slabs",
      "shortName": "Reinforced concrete slabs",
      "description": "Cast-in-place monolithic reinforced concrete roof slab.",
      "keywords": [
        "reinforced concrete slab",
        "cast in place concrete",
        "poured concrete roof"
      ]
    },
    "8": {
      "code": "8",
      "name": "Light metal",
      "shortName": "Light metal",
      "description": "Light gauge metal decking without concrete topping.",
      "keywords": [
        "light metal deck",
        "uninsulated metal deck",
        "ribbed steel deck"
      ]
    }
  },
  "ANCHORAGE": {
    "0": {
      "code": "0",
      "name": "Unknown/default",
      "shortName": "Unknown",
      "description": "Unknown/default roof anchorage.",
      "keywords": []
    },
    "1": {
      "code": "1",
      "name": "Hurricane Ties",
      "shortName": "Hurricane Ties",
      "description": "Hurricane Ties: Engineered metal ties, straps, or clips connecting roof rafters/trusses directly to wall framing to resist severe wind uplift.",
      "keywords": [
        "hurricane ties",
        "hurricane straps",
        "hurricane clips",
        "seismic ties",
        "uplift straps",
        "truss ties",
        "rafter ties"
      ]
    },
    "2": {
      "code": "2",
      "name": "Nails/Screws",
      "shortName": "Nails/Screws",
      "description": "Nails/Screws: Standard nailed or screwed connections (including toe-nailing) securing roof rafters/trusses to top wall plates.",
      "keywords": [
        "nails",
        "screws",
        "toe-nailing",
        "toe nailed",
        "nailed",
        "screwed",
        "toenail"
      ]
    },
    "3": {
      "code": "3",
      "name": "Anchor bolts",
      "shortName": "Anchor bolts",
      "description": "Anchor bolts: Through-bolts, threaded rods, or expansion anchor bolts securing roof structure to bearing walls.",
      "keywords": [
        "anchor bolts",
        "bolted",
        "through bolts",
        "expansion bolts",
        "anchor bolted"
      ]
    },
    "4": {
      "code": "4",
      "name": "Gravity/friction",
      "shortName": "Gravity/friction",
      "description": "Gravity/friction: Roof resting on walls by dead weight alone without mechanical uplift fasteners or ties.",
      "keywords": [
        "gravity",
        "friction",
        "gravity/friction",
        "unanchored",
        "no ties",
        "dead load only"
      ]
    },
    "5": {
      "code": "5",
      "name": "Adhesive epoxy",
      "shortName": "Adhesive epoxy",
      "description": "Adhesive epoxy: Chemical epoxy or structural adhesive anchoring connecting roof members to substrate.",
      "keywords": [
        "adhesive epoxy",
        "epoxy",
        "chemical anchor",
        "structural adhesive",
        "glued"
      ]
    },
    "6": {
      "code": "6",
      "name": "Structurally Connected",
      "shortName": "Structurally Connected",
      "description": "Structurally Connected: Monolithic cast-in-place reinforced concrete tie beam, welded structural steel connection, or fully integrated bond beam.",
      "keywords": [
        "structurally connected",
        "monolithic",
        "concrete tie beam",
        "welded connection",
        "tie beam",
        "bond beam"
      ]
    },
    "7": {
      "code": "7",
      "name": "Clips",
      "shortName": "Clips",
      "description": "Clips: Standard metal framing clips or shear clips providing light-to-moderate uplift restraint.",
      "keywords": [
        "clips",
        "framing clips",
        "metal clips",
        "roof clips",
        "simpson clips"
      ]
    }
  },
  "WEAKNESS": {
    "GEOMETRY": {
      "0": 0,
      "1": 70,
      "2": 100,
      "3": 10,
      "4": 60,
      "5": 50,
      "6": 80,
      "7": 40,
      "8": 30,
      "9": 20,
      "10": 90
    },
    "PITCH": {
      "0": 0,
      "1": 30,
      "2": 20,
      "3": 10
    },
    "COVERING": {
      "0": 0,
      "1": 110,
      "2": 120,
      "3": 100,
      "4": 40,
      "5": 90,
      "6": 50,
      "7": 60,
      "8": 20,
      "9": 80,
      "10": 70,
      "11": 10,
      "12": 30
    },
    "DECK": {
      "0": 0,
      "1": 50,
      "2": 60,
      "3": 70,
      "4": 40,
      "5": 30,
      "6": 20,
      "7": 10,
      "8": 80
    }
  }
};

  const WALL = {
  "WALL_TYPE": {
    "0": {
      "code": "0",
      "name": "Unknown/default",
      "shortName": "Unknown",
      "description": "Unknown structural wall backing.",
      "keywords": []
    },
    "1": {
      "code": "1",
      "name": "Brick/unreinforced masonry",
      "shortName": "Brick / URM",
      "description": "Brick / Unreinforced Masonry (URM) structural wall. Load-bearing masonry walls without reinforcing steel rebar.",
      "keywords": [
        "brick",
        "unreinforced masonry",
        "urm",
        "brick bearing wall"
      ]
    },
    "2": {
      "code": "2",
      "name": "Reinforced masonry",
      "shortName": "Reinforced masonry",
      "description": "Reinforced Masonry (grouted concrete masonry units CMU with internal steel rebar). High lateral load resistance.",
      "keywords": [
        "reinforced masonry",
        "cmu",
        "concrete block",
        "grouted cmu",
        "rebar masonry"
      ]
    },
    "3": {
      "code": "3",
      "name": "Plywood",
      "shortName": "Plywood",
      "description": "Plywood structural wall sheathing over wood or light steel studs.",
      "keywords": [
        "plywood",
        "plywood sheathing",
        "wood stud plywood"
      ]
    },
    "4": {
      "code": "4",
      "name": "Wood planks",
      "shortName": "Wood planks",
      "description": "Solid wood planks (horizontal or diagonal timber wall sheathing).",
      "keywords": [
        "wood planks",
        "diagonal planks",
        "board sheathing"
      ]
    },
    "5": {
      "code": "5",
      "name": "Particle board/OSB",
      "shortName": "OSB / Particle board",
      "description": "Particle board or Oriented Strand Board (OSB) structural wall sheathing.",
      "keywords": [
        "particle board",
        "osb",
        "oriented strand board",
        "waferboard wall"
      ]
    },
    "6": {
      "code": "6",
      "name": "Metal panels",
      "shortName": "Metal panels",
      "description": "Light gauge metal panels or structural steel wall framing.",
      "keywords": [
        "metal panels",
        "light metal",
        "steel stud",
        "metal frame"
      ]
    },
    "7": {
      "code": "7",
      "name": "Pre-cast concrete elements",
      "shortName": "Pre-cast concrete",
      "description": "Pre-cast concrete wall elements and tilt-up panels assembled on site.",
      "keywords": [
        "precast concrete",
        "pre-cast concrete",
        "tilt-up concrete",
        "precast panel"
      ]
    },
    "8": {
      "code": "8",
      "name": "Cast-in-place concrete",
      "shortName": "Cast-in-place concrete",
      "description": "Cast-in-place monolithic reinforced concrete structural bearing walls. Highest structural strength.",
      "keywords": [
        "cast-in-place concrete",
        "poured concrete wall",
        "monolithic concrete"
      ]
    },
    "9": {
      "code": "9",
      "name": "Gypsum board",
      "shortName": "Gypsum board",
      "description": "Gypsum board or exterior drywall sheathing. Highly vulnerable to water and windborne missiles.",
      "keywords": [
        "gypsum board",
        "exterior drywall",
        "densglass",
        "gypsum sheathing"
      ]
    }
  },
  "WALL_SIDING": {
    "0": {
      "code": "0",
      "name": "Unknown/default",
      "shortName": "Unknown",
      "description": "Unknown exterior wall siding/finish.",
      "keywords": []
    },
    "1": {
      "code": "1",
      "name": "Veneer brick/masonry",
      "shortName": "Brick / Masonry veneer",
      "description": "Veneer brick or masonry facing. Single width of exterior brick or stone anchored to structural backing wall.",
      "keywords": [
        "brick veneer",
        "brick siding",
        "masonry veneer",
        "brick exterior",
        "face brick"
      ]
    },
    "2": {
      "code": "2",
      "name": "Wood shingles",
      "shortName": "Wood shingles",
      "description": "Wood shingles or cedar shakes used as exterior siding finish.",
      "keywords": [
        "wood shingles",
        "cedar shingles",
        "shake siding",
        "wood shakes"
      ]
    },
    "3": {
      "code": "3",
      "name": "Clapboards",
      "shortName": "Clapboards",
      "description": "Clapboards (horizontal wood lap siding, beveled timber siding).",
      "keywords": [
        "clapboard",
        "clapboards",
        "wood lap siding",
        "horizontal wood siding",
        "bevel siding"
      ]
    },
    "4": {
      "code": "4",
      "name": "Aluminum/vinyl siding",
      "shortName": "Aluminum / Vinyl siding",
      "description": "Aluminum or vinyl siding panels (lightweight extruded vinyl or aluminum lap siding). Most vulnerable to wind peel-off & hail.",
      "keywords": [
        "vinyl siding",
        "aluminum siding",
        "vinyl",
        "aluminum",
        "pvc siding",
        "metal siding"
      ]
    },
    "5": {
      "code": "5",
      "name": "Stone panels",
      "shortName": "Stone panels",
      "description": "Natural or cut stone panels (granite, limestone, fieldstone veneer cladding).",
      "keywords": [
        "stone panels",
        "stone siding",
        "stone veneer",
        "fieldstone siding",
        "granite panels",
        "limestone veneer"
      ]
    },
    "6": {
      "code": "6",
      "name": "Exterior insulation finishing system",
      "shortName": "EIFS / Synthetic stucco",
      "description": "Exterior Insulation and Finish System (EIFS / synthetic stucco over rigid insulation board). Vulnerable to hail impact and water moisture.",
      "keywords": [
        "eifs",
        "synthetic stucco",
        "dryvit",
        "exterior insulation finishing system"
      ]
    },
    "7": {
      "code": "7",
      "name": "Stucco",
      "shortName": "Stucco",
      "description": "Traditional cementitious stucco (Portland cement plaster over wire mesh lath). Non-combustible, brittle under shear.",
      "keywords": [
        "stucco",
        "traditional stucco",
        "cement plaster",
        "hardcoat stucco"
      ]
    },
    "8": {
      "code": "8",
      "name": "Fiber cement board",
      "shortName": "Fiber cement board",
      "description": "Fiber cement board siding (HardiePlank, engineered cementitious composite lap siding). Class A fire rated.",
      "keywords": [
        "fiber cement",
        "hardieplank",
        "hardie board",
        "cementitious siding",
        "james hardie"
      ]
    }
  }
};

  const TouchstoneData = {
    OCCUPANCY,
    CONSTRUCTION,
    ROOF,
    WALL,

    // Helper utilities
    getOccupancyList() {
      return Object.values(this.OCCUPANCY);
    },
    getConstructionList() {
      return Object.values(this.CONSTRUCTION);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchstoneData;
  }
  root.TouchstoneData = TouchstoneData;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
