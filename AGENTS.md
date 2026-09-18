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

## 2. Touchstone UNICEDE® Roof Detail Classifier Rules

### Multi-Component Rules:
1. **Rule 1 (With %)**: When explicit percentages are present, pick the material with the **higher %** (e.g. `SINGLE PLY MEMBRANE (50%); SHINGLES, ASPHALT (47%)` &rarr; Single-ply `7` wins).
2. **Rule 2 (No %)**: When no percentages are present, pick the **weaker material** (most vulnerable).
3. **Rule 3 (Tied %)**: If two materials tie at the same percentage, pick the **weaker material**.

### Standard Covering Codes:
- **`1`**: Asphalt shingles (composition, architectural, 3-tab)
- **`2`**: Wood shingles / Wood shakes
- **`3`**: Clay / concrete tiles (Spanish, barrel, terracotta, S-tile)
- **`4`**: Light metal panels (corrugated metal/steel/tin, copper, R-panel, 5V crimp)
- **`5`**: Slate (natural slate, Vermont slate)
- **`6`**: Built-up roof with gravel (BUR w/ gravel, tar & gravel, pea gravel)
- **`7`**: Single-ply membrane (EPDM, TPO, PVC, rubber membrane)
- **`8`**: Standing seam metal roofs (SSMR, architectural standing seam)
- **`9`**: Built-up roof without gravel (Smooth BUR, Modified Bitumen, Mod-Bit, SBS, APP, torch-down)
- **`10`**: Single-ply membrane ballasted
- **`11`**: Hurricane wind-rated roof coverings (Miami-Dade NOA, FM 1-90, FM 1-120)
- **`12`**: Photovoltaic (solar roof, solar shingles, rooftop solar panels, BIPV)

### Standard Roof Anchorage Codes:
- **`0`**: Unknown/default (0)
- **`1`**: Hurricane Ties (1) — hurricane straps, seismic ties, uplift straps
- **`2`**: Nails/Screws (2) — toe-nailing, screws, nails
- **`3`**: Anchor bolts (3) — through bolts, expansion bolts
- **`4`**: Gravity/friction (4) — unanchored, dead load only
- **`5`**: Adhesive epoxy (5) — chemical adhesive anchor, structural epoxy
- **`6`**: Structurally Connected (6) — monolithic concrete tie beam, welded connection, bond beam
- **`7`**: Clips (7) — framing clips, metal clips, roof clips

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




