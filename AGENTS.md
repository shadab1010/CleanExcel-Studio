# CleanExcel Underwriting Memory & Custom Rules

This document records persistent project memory, domain rules, and user underwriting instructions for CleanExcel Studio.

---

## 1. Exterior Wall Finish & Construction Class Rules

> **User Instruction**:
> - **STONE** in Exterior Wall Finish / Construction descriptions MUST ALWAYS map to Touchstone Construction Code **`113`** (`Rubble Stone Masonry`).
> - **BRICK** in Exterior Wall Finish / Construction descriptions MUST ALWAYS map to Touchstone Construction Code **`111`** (`Masonry`).

### Specific Details:
- **Code 113 (Rubble Stone Masonry)**:
  - Applies to: `Stone`, `Stone facade`, `Stone wall`, `Stone finish`, `Stone exterior`, `Stone masonry`, `Fieldstone`, `Coursed rubble`, `Uncoursed rubble`.
  - Description: Low-rise perimeter load-bearing walls composed of stone/rubble in mortar bed.
- **Code 111 (Masonry)**:
  - Applies to: `Brick`, `Exterior brick`, `Brick wall`, `Brick finish`, `Brick facade`, `General masonry`, `Concrete block/CMU`.
  - Description: Exterior load-bearing or infill walls constructed of brick/masonry materials.

---

## 2. Touchstone UNICEDE® Roof Detail Classifier Rules (7 Fields + Additional Fields)

### Multi-Component Rules:
1. **Rule 1 (With %)**: When explicit percentages are present, pick the material with the **higher %** (e.g. `SINGLE PLY MEMBRANE (50%); SHINGLES, ASPHALT (47%)` &rarr; Single-ply `7` wins).
2. **Rule 2 (No %)**: When no percentages are present, pick the **weaker material** (most vulnerable).
3. **Rule 3 (Tied %)**: If two materials tie at the same percentage, pick the **weaker material**.

### The 7 Primary Touchstone Roof Detail Sections & Codes:

#### 1. Roof Geometry (Codes 0–10):
- **`0`**: Unknown/default (0)
- **`1`**: Flat (1)
- **`2`**: Gable end without bracing (2)
- **`3`**: Hip (3)
- **`4`**: Complex (4)
- **`5`**: Stepped (5)
- **`6`**: Shed (6)
- **`7`**: Mansard (7)
- **`8`**: Gable end with bracing (8)
- **`9`**: Pyramid (9)
- **`10`**: Gambrel (10)

#### 2. Roof Pitch (Codes 0–3):
- **`0`**: Unknown/default (0)
- **`1`**: Low — less than 10° (1)
- **`2`**: Medium — 10° to 30° (2)
- **`3`**: High — more than 30° (3)

#### 3. Roof Covering (Codes 0–12):
- **`0`**: Unknown/default (0)
- **`1`**: Asphalt shingles (1) (composition, architectural, 3-tab)
- **`2`**: Wooden shingles (2) (wood shakes, cedar shingles)
- **`3`**: Clay/concrete tiles (3) (Spanish, barrel, terracotta, S-tile)
- **`4`**: Light metal panels (4) (corrugated metal/steel/tin, copper, R-panel, 5V crimp)
- **`5`**: Slate (5) (natural slate, Vermont slate)
- **`6`**: Built-up roof with gravel (6) (BUR w/ gravel, tar & gravel, pea gravel)
- **`7`**: Single-ply membrane (7) (EPDM, TPO, PVC, rubber membrane)
- **`8`**: Standing seam metal roofs (8) (SSMR, architectural standing seam)
- **`9`**: Built-up roof without gravel (9) (Smooth BUR, Modified Bitumen, Mod-Bit, SBS, APP, torch-down)
- **`10`**: Single-ply membrane ballasted (10)
- **`11`**: Hurricane Wind-Rated Roof Coverings (11) (Miami-Dade NOA, FM 1-90, FM 1-120)
- **`12`**: Photovoltaic (12) (solar roof, solar shingles, rooftop solar panels, BIPV)

#### 4. Roof Deck (Codes 0–8):
- **`0`**: Unknown/default (0)
- **`1`**: Plywood (1)
- **`2`**: Wood planks (2)
- **`3`**: Particle board/OSB (3)
- **`4`**: Metal deck with insulation board (4)
- **`5`**: Metal deck with concrete (5)
- **`6`**: Pre-cast concrete slabs (6)
- **`7`**: Reinforced concrete slabs (7)
- **`8`**: Light metal (8)

#### 5. Roof Covering Attachment (Codes 0–4):
- **`0`**: Unknown/default (0)
- **`1`**: Screws (1) (mechanical screws, self-tapping screws)
- **`2`**: Nails/staples (2) (roofing nails, staples)
- **`3`**: Adhesive/epoxy (3) (fully adhered, foam adhesive, tile adhesive, epoxy)
- **`4`**: Mortar (4) (mortar set, mud set tile, cement mortar bed)

#### 6. Roof Deck Attachment (Codes 0–7):
- **`0`**: Unknown/default (0)
- **`1`**: Screws/bolts (1) (deck screws, lag bolts)
- **`2`**: Nails (2) (generic deck nails, face nailed)
- **`3`**: Adhesive/epoxy (3) (decking adhesive, subfloor glue)
- **`4`**: Structurally connected (4) (welded metal deck, puddle welds, shear studs, monolithic tie)
- **`5`**: 6d nails @ 6 spacing, 12 on center (5)
- **`6`**: 8d nails @ 6 spacing, 12 on center (6)
- **`7`**: 8d nails @ 6 spacing, 6 on center (7)

#### 7. Roof Anchorage (Codes 0–7):
- **`0`**: Unknown/default (0)
- **`1`**: Hurricane Ties (1) — hurricane straps, seismic ties, uplift straps
- **`2`**: Nails/Screws (2) — toe-nailing, screws, nails
- **`3`**: Anchor bolts (3) — through bolts, expansion bolts
- **`4`**: Gravity/friction (4) — unanchored, dead load only
- **`5`**: Adhesive epoxy (5) — chemical adhesive anchor, structural epoxy
- **`6`**: Structurally Connected (6) — monolithic concrete tie beam, welded connection, bond beam
- **`7`**: Clips (7) — framing clips, metal clips, roof clips

### Additional Roof Fields:
- **Roof Hail Impact Resistance**: `0` = Unknown/Non-impact-resistant, `1` = Impact-resistant A, `2` = Impact-resistant B, `3` = Impact-resistant C, `4` = Impact-resistant D.
- **Tank**: `0` = Unknown/default, `1` = No, `2` = Yes.
- **Chimney**: `0` = Unknown/default, `1` = No, `2` = Yes, height < 2 feet, `3` = Yes, height 2–5 feet, `4` = Yes, height > 5 feet.
- **Roof Year Built**: `0` = Unknown/default, Numeric year `1000`–`2100`.
- All fields are optional and default to `0` (Unknown/default).

---

## 3. Year Built Underwriting & Classifier Rules

> **User Instruction**:
> - If a year is given in a multi-year format or range like `1995/2005`, `2005/1995`, or `2005-1995`, **ALWAYS pick the lesser / older year** (e.g. `1995`).
> - Principle: Underwriters select the older year (original construction year) because building code compliance and catastrophe vulnerability curves are determined by the original structural foundation.

### Specific Rules:
1. **Multi-Year / Range Resolution**:
   - `1995/2005` &rarr; `1995` (picks lesser/older year)
   - `2005/1995` &rarr; `1995` (picks lesser/older year)
   - `2005-1995` &rarr; `1995` (picks lesser/older year)
   - `1995-2005` &rarr; `1995` (picks lesser/older year)
   - `2005/95` or `2005-95` &rarr; `1995` (resolves 2-digit 95 to 1995 and picks older year)
   - Multiple valid years: `Math.min(...validYears)` within valid range.
2. **Valid Range**:
   - Minimum: `1753` (years `< 1753` are cleared to blank).
   - Maximum: Current Year (`2026`) (years `> 2026` are cleared to blank).

---

## 4. Roof Year Built Underwriting Rules (2-Column Validation)

> **User Instruction**:
> - In the **Roof Year Built** section, data is provided in 2 columns: Column 1 is **Year Built** and Column 2 is **Roof Year Built**.
> - **Roof Year Built Must Be Greater Than Or Equal To Year Built** (`Roof Year Built ≥ Year Built`):
>   - Valid when Roof Year is greater than or equal to Year Built (`Roof Year ≥ Year Built`).
>   - **Rule 1**: `YB = 2005` and `Roof Year = 2006` &rarr; Output **`2006`** (`2006 ≥ 2005`).
>   - **Rule 2**: `YB = 2005` and `Roof Year = 2006/2007` &rarr; pick higher year in roof input: Output **`2007`** (`2007 ≥ 2005`).
>   - **Rule 3**: `YB = 2005` and `Roof Year = 2005` &rarr; Output **`2005`** (Original Roof, `2005 ≥ 2005`).
>   - **Not Less Than Year Built**: If Roof Year Built is less than Year Built (e.g. `YB: 2005`, `Roof: 2004` or `2004/2003`), Cleaned Roof Year Built is left **BLANK** (`⚠️ Roof Year < Year Built → Blank`).
> - **Multi-Year Roof Resolution**:
>   - When Roof Year Built contains multiple years or ranges (e.g. `2006/2007`, `2005/2006`, `2004/2003`):
>     - Filter out candidate years that are less than Year Built.
>     - Pick the **higher year** among candidate years that are $\ge$ Year Built (`Math.max(...validGeYb)`).
>     - If all candidate years are less than Year Built (e.g. `2004/2003` with `2005`), output is left **BLANK**.
> - **Year Built Carry-Forward**: If the user provides Year Built once on row 1 (e.g. `2005`) and leaves subsequent lines blank while entering roof years, `2005` automatically carries forward.
> - **Without Year Built, Roof Year cannot be accurate**: If Year Built is missing, blank, or invalid (<1753 or >2026), Cleaned Roof Year Built is left **BLANK**.
> - **If Year Built is given but Roof Year Built is not given**, Cleaned Roof Year Built is left **BLANK**.
> - **Valid Range**: `1753` to current year (`2026`). Values outside this range are invalidated and left blank.

---

## 5. ISO Construction Class Classification Rules (ISO 1–6)

> **User Instruction**:
> Store and map standard Insurance Services Office (ISO) Commercial Fire Rating / Construction Classes into the **Construction Class Classifier**:
> - **ISO 1 Frame** &rarr; Touchstone UNICEDE Construction Code **`101`** (`Wood Frame Modern`).
> - **ISO 2 Joisted Masonry** &rarr; Touchstone UNICEDE Construction Code **`119`** (`Joisted Masonry`).
> - **ISO 3 Noncombustible** &rarr; Touchstone UNICEDE Construction Code **`152`** (`Light Metal / Non-Combustible`).
> - **ISO 4 Masonry Noncombustible** &rarr; Touchstone UNICEDE Construction Code **`111`** (`Masonry`).
> - **ISO 5 Modified Fire Resistive** &rarr; Touchstone UNICEDE Construction Code **`131`** (`Reinforced Concrete`).
> - **ISO 6 Fire Resistive** &rarr; Touchstone UNICEDE Construction Code **`131`** (`Reinforced Concrete`).

### Specific Details & Definitions:
- **ISO 1 (Frame)**: Exterior walls, floors, and roofs constructed of combustible materials (wood framing, stud walls).
- **ISO 2 (Joisted Masonry)**: Exterior bearing walls of masonry (brick, block, stone) with floors and roofs of combustible materials (wood joists/decks).
- **ISO 3 (Noncombustible)**: Exterior walls, floors, and roof constructed of noncombustible or slow-burning materials, such as light gauge metal / unprotected steel frame.
- **ISO 4 (Masonry Noncombustible)**: Exterior walls of masonry not less than 4 inches thick, with floors and roof of noncombustible materials (metal/steel decking).
- **ISO 5 (Modified Fire Resistive)**: Exterior walls, floors, and roof of masonry or reinforced concrete with a fire resistance rating of at least 1 hour but less than 2 hours.
- **ISO 6 (Fire Resistive)**: Exterior walls, floors, and roof of reinforced concrete or protected structural steel with a fire resistance rating of 2 hours or greater.

---

## 6. No of Stores (Stories & Floors) Underwriting Engine Rules

> **User Instruction**:
> Add new section name: **`No of Stores`**
> Rules of this section:
> - **Negative Values Leave Blank**: If there are negative values, leave blank (e.g. `-5 ➔ blank`, `-2 ➔ blank`). Stories cannot be negative in underwriting. Zero (`0`) or non-positive values also resolve to blank.
> - **Always Whole Number (`hole no`)**: Decimals always round UP (`Math.ceil`):
>   - `3.5 = 4`
>   - `4.2 = 5`
>   - `1.1 = 2`
>   - `0.5 = 1`
> - **Multi-Value / Ranges Pick Maximum**:
>   - `2 & 3 = 3`
>   - `1,2 = 2`
>   - `2/3 = 3`
>   - `2-4 = 4`
>   - `2 and 3 = 3`
>   - `1 to 3 = 3`
>   - `1.5 & 2.2 = 3` (`Math.ceil(1.5)=2`, `Math.ceil(2.2)=3`, max = `3`)
> - **If Blank Then Leave Blank**: Empty rows or whitespace-only inputs leave blank (`""`).
> - **"non" = Blank**: Values like `non`, `none`, `no`, `n/a`, `na`, `null`, `nil`, `-`, `—`, `unknown`, `unk`, `tbd`, `0` leave blank (`""`).

---

## 7. Address Column Splitter Multi-Country & UK Rules

> **User Instruction**:
> In **Address Column Splitter**, addresses from multiple countries (UK, US, Australia, Canada, Germany, etc.) must be cleanly split into their proper component columns:
> - `22 High Street WITNEY Oxfordshire OX28 6RB UNITED KINGDOM`:
>   - **Street**: `22 High Street`
>   - **City (Post Town)**: `WITNEY`
>   - **County**: `Oxfordshire`
>   - **Postal Code**: `OX28 6RB`
>   - **Country**: `UNITED KINGDOM` (or formatted according to country option: `GB`, `UK`, `United Kingdom`)

### Specific Rules:
1. **UK Address Parsing**:
   - **Country Extraction**: Matches UK country names/codes at the end (`UNITED KINGDOM`, `UK`, `GREAT BRITAIN`, `ENGLAND`, `SCOTLAND`, `WALES`, `NORTHERN IRELAND`, `GB`).
   - **Postcode Extraction**: Alphanumeric Royal Mail postcodes (e.g. `OX28 6RB`, `SW1A 2AA`) extracted into `postal`.
   - **County Detection**: Over 80 ceremonial and historic UK counties (e.g. `Oxfordshire`, `Surrey`, `Greater London`, `Berkshire`, `Wiltshire`, `Yorkshire`, `Lanarkshire`, etc.) matched before postcode and extracted into `county`.
   - **Street & City (Post Town) Boundary**: Uses street suffixes (`Street`, `Road`, `Avenue`, `Lane`, `Drive`, `Way`, `Close`, `Court`, `Crescent`, `Place`, `Terrace`, `Gardens`, etc.) to cleanly separate the building/street from the post town (e.g. `22 High Street` & `WITNEY`).
   - **Royal Mail Post Town Casing**: In accordance with UK Royal Mail standards, post towns are capitalized (`WITNEY`).
2. **Multi-Country Support**:
   - **Australia (AU)**: Recognizes AU states (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`) and 4-digit postcodes.
   - **Canada (CA)**: Recognizes Canadian provinces (`ON`, `BC`, `QC`, etc.) and alphanumeric postal codes (`A1A 1A1`).
   - **Germany (DE)**: Recognizes 5-digit PLZ codes and street/city boundaries.
   - **United States (US)**: Extracts Street, City, State, County (e.g. `Davidson`), and 5-digit/ZIP+4 postal codes.
3. **Table & Export Column Synchronization**:
   - The results table in `react_output.js` dynamically displays `County` and `Country` columns alongside `STREET`, `City`, `State`, `Postal`, and `Actions`.
   - Supports `Original` country format alongside `ISO-2 (US, GB)`, `ISO-2 (UK)`, and `Full Name`.

---

## 8. Street vs. City Semantic Classification & Missing Value Rules

> **User Instruction**:
> When an address is missing the street (e.g. `Springfield IL 62704` or `WITNEY Oxfordshire OX28 6RB`), the city MUST NEVER be placed into the `STREET` column.
> The engine must accurately classify tokens based on linguistic markers and structural syntax regardless of order:
> - **Street Identification**:
>   - Has building/house numbers (e.g. `742`, `22`, `10A`, `1-3`, `45/2`) or unit prefixes (`Apt`, `Suite`, `Unit`, `PO Box`).
>   - Has street suffixes (`Street`, `St`, `Road`, `Rd`, `Avenue`, `Ave`, `Terrace`, `Ter`, `Court`, `Ct`, `Lane`, `Ln`, `Way`, `Place`, `Pl`, `Boulevard`, `Blvd`, etc.).
> - **City Identification**:
>   - Cities (`Springfield`, `Los Angeles`, `WITNEY`, `Dallas`, `Miami`) do NOT start with building numbers and do NOT have street suffixes.
>   - **Missing Street Rule**: If the text contains neither a building number nor a street suffix, `street` is left BLANK (`""` / `—`) and `city` is populated with the city name.
>   - **Missing City Rule**: If the text has a building number and ends with a street suffix (e.g. `742 Evergreen Terrace IL 62704`), `street` is populated and `city` is left BLANK (`""` / `—`).
> - **Order-Independent Parsing**:
>   - Postal codes (`62704`, `OX28 6RB`), States (`IL`, `CA`, `TX`), and Countries (`US`, `UK`, `CA`) have distinct regex/dictionary signatures and are recognized and stripped out whether they appear at the start, middle, or end.

---

## 9. Custom Underwriting Database & Code Manager Rules

> **User Instruction**:
> Underwriters can customize, add, edit, and export/import Occupancy Codes and Construction Codes directly on the website:
> - **Custom Overrides & New Codes**: Custom definitions take priority over built-in Touchstone defaults in `OccupancyClassifier` and `ConstructionClassifier`.
> - **In-Browser Persistence**: Changes are stored in `localStorage` (`cleanexcel_underwriting_custom_db_v1`) and survive page reloads.
> - **JSON Export & Import**: Underwriters can export their customized database as a `.json` backup file or import JSON definitions.
> - **Restore to Factory**: Individual codes or the entire database can be reset back to official Touchstone UNICEDE® baseline at any time.

---

## 10. Apartment & Multi-Unit Residential Occupancy Rules (Codes 301, 303, 306)

> **User Instruction**:
> When an Occupancy description specifies `Apartment`, `Apartments`, `Condo`, `Condominium`, or `Residential`, and another column or inline text specifies the number of units / buildings:
> - **1 Unit / 1 Building** &rarr; Maps to Touchstone Code **`301`** (`Permanent Dwelling: General Residential / 1 Unit`).
> - **2, 3, or 4 Units (2–4 Units / Duplex / Triplex / Fourplex)** &rarr; Maps to Touchstone Code **`303`** (`Permanent Dwelling: Multi Family 2-4 Units`).
> - **5 or More Units ($\ge 5$ Units / Apartment Complex)** &rarr; Maps to Touchstone Code **`306`** (`Apartments / Condominiums 5+ Units`).
> - **Apartment without Unit Count** &rarr; Defaults to Touchstone Code **`306`** (`Apartments / Condominiums`).

### Multi-Column & Inline Resolution:
1. **Col 1 & Col 2 Cross-Evaluation**:
   - `Col 1 = "Apartment"`, `Col 2 = "1"` or `"1 unit"` &rarr; **`301`**
   - `Col 1 = "1"`, `Col 2 = "Apartment"` &rarr; **`301`**
   - `Col 1 = "Apartment"`, `Col 2 = "3"` or `"3 units"` &rarr; **`303`**
   - `Col 1 = "Apartment"`, `Col 2 = "4"` or `"4 units"` &rarr; **`303`**
   - `Col 1 = "Apartment"`, `Col 2 = "5"` or `"6 units"` &rarr; **`306`**
   - `Col 1 = "Apartment"`, `Col 2 = "24"` &rarr; **`306`**
2. **Inline Descriptions**:
   - `"1 unit apartment"` &rarr; **`301`**
   - `"3 units apartment"` &rarr; **`303`**
   - `"12 unit apartment complex"` &rarr; **`306`**

---

## 11. Garage Occupancy Underwriting Rules (Code 318)

> **User Instruction**:
> If an occupancy description or column is `Garage` (or `only Garage`, `Garages`, `Parking Garage`, `Detached Garage`, `Residential Garage`, `Commercial Garage`), it MUST ALWAYS map to Touchstone UNICEDE Occupancy Code **`318`** (`Parking Structures / Garages`).
>
> **Specific Mappings**:
> - `Garage` &rarr; **`318`**
> - `Only Garage` &rarr; **`318`**
> - `Garages` &rarr; **`318`**
> - `Parking` / `Parking Deck` / `Parking Ramp` / `Car Park` &rarr; **`318`**
> - `Detached Garage` / `Storage Garage` &rarr; **`318`**

---

## 12. Wood Construction with Number of Stories & Year Built Rules

> **User Instruction**:
> In **Construction Classification**, when construction is **Wood** (or `Wood Frame`, `Timber`, `Wood Stud`, `Stick Built`):
> 1. **Stories $\le 4$ (or less than 4 or 4)**:
>    - Maps directly to Touchstone UNICEDE Code **`101`** (`Wood Frame (Modern)`).
> 2. **Stories $> 4$ and $\le 7$ (between 5 and 7 stories)**:
>    - **Year Built $> 2005$** &rarr; Maps to Touchstone UNICEDE Code **`101`** (`Wood Frame (Modern)`).
>    - **Year Built $\le 2005$** (or missing) &rarr; MUST be left **BLANK** (`""` / `⚠️ Wood Frame 5-7 Stories Built ≤ 2005 → Blank`).
> 3. **Stories $\ge 8$ (8 or greater)**:
>    - MUST be left **BLANK** (`""` / `⚠️ Wood Frame ≥ 8 Stories → Blank`).

### Specific Examples:
- `Col 1 = "Wood", Col 2 = "4 stories", Col 3 = "1995"` &rarr; **`101`** (`Stories ≤ 4`)
- `Col 1 = "Wood", Col 2 = "2 stories", Col 3 = "2004"` &rarr; **`101`** (`Stories ≤ 4`)
- `Col 1 = "Wood", Col 2 = "1 story"` &rarr; **`101`** (`Stories ≤ 4`)
- `Col 1 = "Wood", Col 2 = "5 stories", Col 3 = "2010"` &rarr; **`101`** (`Stories 5-7 & YB > 2005`)
- `Col 1 = "Wood", Col 2 = "6 stories", Col 3 = "2006"` &rarr; **`101`** (`Stories 5-7 & YB > 2005`)
- `Col 1 = "Wood", Col 2 = "7 stories", Col 3 = "2020"` &rarr; **`101`** (`Stories 5-7 & YB > 2005`)
- `Col 1 = "Wood", Col 2 = "5 stories", Col 3 = "2005"` &rarr; **BLANK** (`Stories 5-7 & YB ≤ 2005`)
- `Col 1 = "Wood", Col 2 = "6 stories", Col 3 = "1998"` &rarr; **BLANK** (`Stories 5-7 & YB ≤ 2005`)
- `Col 1 = "Wood", Col 2 = "7 stories", Col 3 = "2004"` &rarr; **BLANK** (`Stories 5-7 & YB ≤ 2005`)
- `Col 1 = "Wood", Col 2 = "5 stories"` (no YB) &rarr; **BLANK** (`Missing YB > 2005`)
- `Col 1 = "Wood", Col 2 = "8 stories", Col 3 = "2015"` &rarr; **BLANK** (`Stories ≥ 8`)
- `Col 1 = "Wood", Col 2 = "8 stories", Col 3 = "1995"` &rarr; **BLANK** (`Stories ≥ 8`)
- `Col 1 = "Wood", Col 2 = "9 stories", Col 3 = "2018"` &rarr; **BLANK** (`Stories ≥ 8`)
- `Col 1 = "Wood", Col 2 = "12 stories"` &rarr; **BLANK** (`Stories ≥ 8`)
- Non-Wood constructions (e.g. `Brick / Masonry` &rarr; `111`, `Steel` &rarr; `151`) are unaffected by the wood stories/year rule.

---

## 13. Sports Courts & Recreation Occupancy Underwriting Rules (Code 317)

> **User Instruction**:
> If an occupancy description or column is `Basketball Court`, `Volleyball Court`, `Tennis Court`, `Pickleball Court`, `Badminton Court`, `Squash Court`, `Racquetball Court`, or `Sports Court`, it MUST ALWAYS map to Touchstone UNICEDE Occupancy Code **`317`** (`Entertainment & Recreation (Theaters/Gyms)`).
>
> **Specific Mappings**:
> - `Basketball Court` &rarr; **`317`** (`Entertainment & Recreation`)
> - `Volleyball Court` &rarr; **`317`** (`Entertainment & Recreation`)
> - `Tennis Court` &rarr; **`317`** (`Entertainment & Recreation`)
> - `Pickleball Court` &rarr; **`317`** (`Entertainment & Recreation`)
> - `Badminton Court` &rarr; **`317`** (`Entertainment & Recreation`)
> - `Squash Court` / `Racquetball Court` &rarr; **`317`** (`Entertainment & Recreation`)
> - `Sports Court` / `Athletic Court` &rarr; **`317`** (`Entertainment & Recreation`)

---

---

## 15. Touchstone UNICEDE® Foundation Type Classifier Rules (Codes 0–12)

> **User Instruction**:
> Store and classify **Foundation Type** in Touchstone / UNICEDE®:
> One of the following values to describe the type of construction used for the foundation of the building at this location:
> - **`0`**: Unknown/default (0)
> - **`1`**: Masonry basement (1) (brick/masonry basement walls, sub-grade masonry)
> - **`2`**: Concrete basement (2) (poured concrete, reinforced concrete basement)
> - **`3`**: Masonry wall (3) *(Note: Touchstone maps this to Crawlspace cripple wall (4) (wood) upon import)*
> - **`4`**: Crawlspace cripple wall (4) (wood) (cripple wall, pony wall, wood stud crawlspace)
> - **`5`**: Crawlspace masonry (5) (wood) (masonry stem wall, perimeter block crawlspace)
> - **`6`**: Post & pier (6) (timber posts, concrete piers, stilts, raised pilings)
> - **`7`**: Footing (7) (spread footing, strip footing, shallow continuous concrete footing)
> - **`8`**: Mat / slab (8) (slab-on-grade, raft foundation, floating slab, structural mat — typical for mid-rise buildings)
> - **`9`**: Pile (9) (driven piles, drilled caissons, deep foundation, friction/end-bearing piles — typical for high-rise buildings & earthquake performance)
> - **`10`**: No basement (10) (slab-on-grade without basement, crawlspace without basement)
> - **`11`**: Engineering foundation (11) (special engineered foundation, seismic base isolation, micropiles)
> - **`12`**: Crawlspace - raised (wood) (12) (elevated wood floor over open foundation, raised crawlspace)

### Peril & Regional Model Applicability:
- `CA EQ` (California Earthquake)
- `CE IF` (Central Europe Inland Flood)
- `EU ETC` (European Extratropical Cyclone)
- `HI EQ` (Hawaii Earthquake)
- `IT IF` (Italy Inland Flood, added support in v11.5)
- `JP IF` (Japan Inland Flood)
- `JP EQ` (Japan Earthquake)
- `JP TY` (Japan Typhoon)
- `NZ EQ` (New Zealand Earthquake)
- `SK TY` (South Korea Typhoon, added support in v13)
- `UK/ROI IF` (UK & Republic of Ireland Inland Flood, added support in v13.0)
- `US EQ` (United States Earthquake)
- `US HU` (United States Hurricane)
- `US IF` (United States Inland Flood)

### Special Cases & Underwriting Rules:
1. **UK and Central Europe Inland Flood Models**:
   - Only the following values are applicable:
     - `0`: Unknown/default (0)
     - `1`: Masonry basement (1)
     - `2`: Concrete basement (2)
     - `10`: No basement (10)
2. **Verisk Earthquake Model for the United States**:
   - The **No basement (10)** value is **not applicable**.
   - You must select **Crawlspace cripple wall (4) (wood)** if you want to use the Retrofit Measures option **Bracing of cripple walls (1)**.
3. **UK, Germany, Austria, Switzerland, Czech Republic, Serbia, Macedonia, and Albania**:
   - The combination of **Floor of Interest = Basement (-1)** and **Foundation Type = No basement (10)** is **not applicable**.
4. **Floor of Interest = Basement (-1)**:
   - Must select **Masonry basement (1)** or **Concrete basement (2)** as the Foundation Type.
5. **Structural & Height Guidelines**:
   - Single-family dwellings are often built on basements or shallow foundation.
   - Most **mid-rise buildings** are built on **mat / slab foundation (8)**.
   - **High-rise buildings** tend to be supported on **pile foundation (9)** (piles are generally better performers in earthquakes).
6. **Ignored Construction / Occupancy Codes in Touchstone**:
   - Touchstone ignores foundation type for:
     - IFM (`400` series occupancy class codes)
     - Mobile homes (`191`–`194` construction class codes)
     - `200` series construction class codes (including automobiles and pleasure boats)
     - Industrial occupancies (`321`–`330` occupancy class codes)

---

## 16. Touchstone UNICEDE® Location Wall Detail Classifier Rules (9 Secondary Risk Characteristics)

> **User Instruction**:
> Store, analyze, and classify all **9 Location Wall Detail Fields** in Touchstone / UNICEDE® when any type of wall details or descriptions are pasted:
> 1. **Wall Type (Codes 0–9)**
> 2. **Wall Siding (Codes 0–8)**
> 3. **Glass Type (Codes 0–5)**
> 4. **Glass Percentage (Codes 0–4)**
> 5. **Window Protection (Codes 0–3)**
> 6. **Exterior Doors (Codes 0–6)**
> 7. **Building Exterior Opening (Codes 0–2)**
> 8. **Brick Veneer (Codes 0–3)**
> 9. **Fire Rating for Wall Siding (Codes 0–3)**

### Multi-Component Rules:
1. **Rule 1 (With %)**: When explicit percentages are present, pick the material with the **higher %** (e.g. `VINYL SIDING (60%); STUCCO (40%)` &rarr; Vinyl Siding `4` wins).
2. **Rule 2 (No %)**: When no percentages are present, pick the **weaker material** (most vulnerable to wind/seismic damage).
3. **Rule 3 (Tied %)**: If two materials tie at the same percentage, pick the **weaker material**.

---

### The 9 Touchstone Wall Detail Fields & Codes:

#### 1. Wall Type (Codes 0–9):
- **`0`**: Unknown/default (0)
- **`1`**: Brick/unreinforced masonry (1)
- **`2`**: Reinforced masonry (2)
- **`3`**: Plywood (3)
- **`4`**: Wood planks (4)
- **`5`**: Particle board/OSB (oriented strand board) (5)
- **`6`**: Metal panels (6)
- **`7`**: Pre-cast concrete elements (7)
- **`8`**: Cast-in-place concrete (8)
- **`9`**: Gypsum board (9)
- *Perils Supported*: `CA EQ`, `HI EQ`, `HI TC`, `JP EQ`, `NZ EQ`, `US EQ`, `US HU`, `US ST` (Straight-Line Winds, Tornadoes).
- *Validation*: Optional, defaults to `0`.

#### 2. Wall Siding (Codes 0–8):
- **`0`**: Unknown/default (0)
- **`1`**: Veneer brick/masonry (1)
- **`2`**: Wood shingles (2)
- **`3`**: Clapboards (3)
- **`4`**: Aluminum/vinyl siding (4)
- **`5`**: Stone panels (5)
- **`6`**: Exterior insulation finishing system (EIFS) (6)
- **`7`**: Stucco (7)
- **`8`**: Fiber cement board (8) *(added in June 2024 for US WF)*
- *Perils Supported*: `AU WF` (added in Touchstone 2025), `CA EQ`, `HI EQ`, `HI TC`, `JP EQ`, `NZ EQ`, `US EQ`, `US HU`, `US ST` (Winds, Tornadoes, Hail), `US WF`.
- *Validation*: Optional, defaults to `0`.

#### 3. Glass Type (Codes 0–5):
- **`0`**: Unknown/default (0)
- **`1`**: Annealed (1)
- **`2`**: Tempered (2)
- **`3`**: Heat strengthened (3)
- **`4`**: Laminated (4)
- **`5`**: Insulating glass units (5) (IGU, double glazed, insulated glazing)
- *Perils Supported*: `HI TC`, `US HU`, `US ST` (Winds, Tornadoes, Hail), `US WF`.
- *Validation*: Optional, defaults to `0`.

#### 4. Glass Percentage (Codes 0–4):
- **`0`**: Unknown/default (0)
- **`1`**: Less than 5% (1)
- **`2`**: Between 5% and 20% (2)
- **`3`**: Between 20% and 60% (3)
- **`4`**: Greater than 60% (4) (curtain wall, all-glass facade)
- *Perils Supported*: `HI TC`, `US HU`, `US ST` (Winds, Tornadoes, Hail).
- *Validation*: Optional, defaults to `0`. The greater the percent of glass in a wall, the greater the vulnerability to damage.

#### 5. Window Protection (Codes 0–3):
- **`0`**: Unknown/default (0)
- **`1`**: No protection (1)
- **`2`**: Non-engineered shutters (2) (plywood covers, storm panels)
- **`3`**: Engineered shutters (3) (tested storm shutters, roll-down, accordion, impact shutters)
- *Perils Supported*: `HI TC`, `US HU`, `US ST` (Winds, Tornadoes, Hail).
- *Validation*: Optional, defaults to `0`.

#### 6. Exterior Doors (Codes 0–6):
- **`0`**: Unknown/default (0)
- **`1`**: Single width doors (1)
- **`2`**: Double width doors (2)
- **`3`**: Reinforced single width doors (3)
- **`4`**: Reinforced double width doors (4)
- **`5`**: Sliding doors (5)
- **`6`**: Reinforced sliding doors (6)
- *Perils Supported*: `HI TC`, `US HU`, `US ST` (Winds, Tornadoes).
- *Validation*: Optional, defaults to `0`. Exterior doors and frames deflect considerably under high wind loads and are a primary failure mode.

#### 7. Building Exterior Opening (Codes 0–2):
- **`0`**: Unknown (0)
- **`1`**: Less than 50% of wall open / default (1)
- **`2`**: More than 50% of wall open (2)
- *Perils Supported*: `CA EQ`, `HI EQ`, `JP EQ`, `NZ EQ`, `US EQ`.
- *Validation*: Optional. A shear wall with many openings for windows and doors has less resistance to earthquake loads.

#### 8. Brick Veneer (Codes 0–3):
- **`0`**: Unknown/default (0) (represents 50–90%)
- **`1`**: More than 90% (1)
- **`2`**: 25–50% (2)
- **`3`**: 0–25% (3)
- *Perils Supported*: `CA EQ`, `HI EQ`, `JP EQ`, `US EQ`.
- *Validation*: Optional. Used in conjunction with Touchstone construction code `103` (Masonry Veneer). Brick veneer is typically unreinforced and vulnerable to ground shaking.

#### 9. Fire Rating for Wall Siding (Codes 0–3):
- **`0`**: Unknown/No Rating (0)
- **`1`**: Fire Rated Class A (1) (highest fire resistance)
- **`2`**: Fire Rated Class B (2)
- **`3`**: Fire Rated Class C (3)
- *Perils Supported*: `AU WF` (added support), `US WF`. *(Added in June 2024)*.
- *Validation*: Optional, defaults to `0`.

---

## 17. Touchstone UNICEDE® Short Column Classifier Rules (Codes 0–2)

> **User Instruction**:
> Store and classify **Short Column** in Touchstone / UNICEDE®:
> One of the following values to indicate whether there are short columns in the building at this location:
> - **`0`**: Unknown/default (0)
> - **`1`**: No (1)
> - **`2`**: Yes (2)
> - **Status**: `Optional`
> - **Applicable Perils / Models**:
>   - `CA EQ` (California Earthquake)
>   - `HI EQ` (Hawaii Earthquake)
>   - `JP EQ` (Japan Earthquake)
>   - `US EQ` (United States Earthquake)
> ### Technical Underwriting Details:
> This field applies to old concrete structures in which the fill height of some column has been restricted by spandrel beams or infill walls. If some of the columns along the perimeter are shorter than the adjacent columns, there is high chance that the shorter columns can no longer bear the loads for which they were originally designed.

---

## 18. Touchstone UNICEDE® Soft Story Classifier Rules (Codes 0–2)

> **User Instruction**:
> Store and classify **Soft Story** in Touchstone / UNICEDE®:
> One of the following values to indicate whether there is structural weakness at any floor in the building at this location:
> - **`0`**: Unknown/default (0)
> - **`1`**: No (1)
> - **`2`**: Yes (2)
> - **Status**: `Optional`. Defaults to a value in the Touchstone user interface (`0`).
> - **Applicable Perils / Models**:
>   - `CA EQ` (California Earthquake)
>   - `HI EQ` (Hawaii Earthquake)
>   - `JP EQ` (Japan Earthquake)
>   - `NZ EQ` (New Zealand Earthquake)
>   - `US EQ` (United States Earthquake)
>
> ### Underwriting & Technical Rules:
> - **Applicability**: This field is applicable only if the number of **stories is 2 or greater** (`Stories ≥ 2`).
> - **Soft-Story Behavior**: First-floor garages and taller first floors are likely to exhibit soft-story behavior (e.g. ground-floor parking, tuck-under garages).
> - **Vulnerability & Failure Mode**: The weakness is usually in the lateral load-resisting capacity of the floor and can often result in total (pancaking) collapse of the floor. In residential buildings, it is most often found in the first floor due to large openings or garages. In multi-story buildings, it can be present at any floor, although a large number of case histories exist with collapse of the first floor.

---

## 19. Touchstone UNICEDE® Building Shape Classifier Rules (Codes 0–8)

> **User Instruction**:
> Add section **Building Shape** and use this image as logic:
> One of the following values to describe the overall shape of the footprint of the building at this location:
> - **`0`**: Unknown/default (0)
> - **`1`**: Square (1)
> - **`2`**: Rectangle (2)
> - **`3`**: Circular (3)
> - **`4`**: L-shaped (4)
> - **`5`**: T-shaped (5)
> - **`6`**: U-shaped (6)
> - **`7`**: H-shaped (7)
> - **`8`**: Complex (8)
> - **Status**: `Optional`
> - **Defaults**: Defaults to a value in the Touchstone user interface (`0` - Unknown/default).
> - **Applicable Perils / Models**:
>   - `CA EQ` (California Earthquake)
>   - `HI EQ` (Hawaii Earthquake)
>   - `JP EQ` (Japan Earthquake)
>   - `NZ EQ` (New Zealand Earthquake)
>   - `US EQ` (United States Earthquake)
>
---

## 20. Touchstone UNICEDE® Ornamentation Classifier Rules (Codes 0–3)

> **User Instruction**:
> Add section **Ornamentation** and use this image as logic:
> One of the following values to describe the amount of decorative elements attached to exterior of the building at this location:
> - **`0`**: Unknown/default (0)
> - **`1`**: None (1)
> - **`2`**: Average (2)
> - **`3`**: Extensive (3)
> - **Status**: `Optional`
> - **Defaults**: Defaults to a value in the Touchstone user interface (`0` - Unknown/default).
> - **Applicable Perils / Models**:
>   - `CA EQ` (California Earthquake)
>   - `HI EQ` (Hawaii Earthquake)
>   - `JP EQ` (Japan Earthquake)
>   - `US EQ` (United States Earthquake)
>
> ### Underwriting & Seismic Hazard Notes:
> - **Seismic Hazard**: Decorative elements may fall during an earthquake.
> - **Examples of Decorative Elements / Falling Hazards**:
>   - Unreinforced or unbraced parapet walls
>   - Entryway roofs and canopies
>   - Heavy ornamental cornices, gargoyles, terra cotta facade features
>   - These elements can break off during excessive ground shaking, creating significant life-safety hazards and facade damage.

---

## 21. Touchstone UNICEDE® Building Condition Classifier Rules (Codes 0–3)

> **User Instruction**:
> Add section **Building Condition** and use this image as logic:
> One of the following general qualitative descriptions of the condition of the building at this location, based on visual inspection of the building cladding and maintenance:
> - **`0`**: Unknown (0)
> - **`1`**: Average (1)
> - **`2`**: Good (2)
> - **`3`**: Poor (3)
> - **Status**: `Optional`
> - **Defaults**: Defaults to a value in the Touchstone user interface (generally `0: Unknown`, but default is `1: Average` for earthquake models).
> - **Applicable Perils / Models**:
>   - `CA EQ` (California Earthquake)
>   - `HI EQ` (Hawaii Earthquake)
>   - `HI TC` (Hawaii Tropical Cyclone)
>   - `JP EQ` (Japan Earthquake)
>   - `NZ EQ` (New Zealand Earthquake)
>   - `US EQ` (United States Earthquake)
>   - `US HU` (United States Hurricane)
>   - `US ST` (Straight-Line Winds, Tornadoes)
>
> ### Underwriting & Physical Performance Engineering Notes:
> - **Cladding & Maintenance Significance**: The external appearance of cladding and maintenance gives a qualitative estimate of expected structural and envelope performance.
> - **For Earthquakes**:
>   - Buildings with signs of distress or duress, such as cracking due to aging and ground settlement or overloading, or cracking due to damage from previous earthquakes, are likely to experience additional damage during an earthquake.
>   - For earthquakes, the default is **Average (1)**.
> - **For Hurricanes & Tropical Cyclones**:
>   - Buildings with signs of distress or duress are likely to experience additional damage during a tropical cyclone.
>   - Examples of distress signs include:
>     - Aging roof, exterior walls, or cladding
>     - Loose roof tiles or chimney damage
>     - Unrepaired damage from previous tropical cyclones or windstorms.
