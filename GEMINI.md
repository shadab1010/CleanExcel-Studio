# CleanExcel Memory & Domain Rules

## Underwriting Rules for Exterior Wall Finish & Construction Classification

- **STONE** always maps to Touchstone UNICEDE Construction Code **113** (`Rubble Stone Masonry`).
  - Synonyms: `Stone`, `Stone facade`, `Stone wall`, `Stone finish`, `Stone masonry`, `Fieldstone`.
- **BRICK** always maps to Touchstone UNICEDE Construction Code **111** (`Masonry`).
  - Synonyms: `Brick`, `Exterior brick`, `Brick finish`, `Brick wall`, `Brick facade`, `General masonry`.

### ISO Commercial Fire Rating / Construction Classes (ISO 1–6):
- **ISO 1 Frame** &rarr; Touchstone UNICEDE Code **101** (`Wood Frame Modern`).
- **ISO 2 Joisted Masonry** &rarr; Touchstone UNICEDE Code **119** (`Joisted Masonry`).
- **ISO 3 Noncombustible** &rarr; Touchstone UNICEDE Code **152** (`Light Metal / Non-Combustible`).
- **ISO 4 Masonry Noncombustible** &rarr; Touchstone UNICEDE Code **111** (`Masonry`).
- **ISO 5 Modified Fire Resistive** &rarr; Touchstone UNICEDE Code **131** (`Reinforced Concrete`).
- **ISO 6 Fire Resistive** &rarr; Touchstone UNICEDE Code **131** (`Reinforced Concrete`).

## Roof Detail Classification Rules
- **Covering 7**: Single-ply membrane (EPDM, TPO, PVC)
- **Covering 9**: Built-up roof without gravel (Smooth BUR, Modified Bitumen, Mod-Bit)
- **Covering 6**: Built-up roof with gravel (BUR, Tar & Gravel)
- **Covering 5**: Slate
- **Covering 4**: Light metal panels (Steel, Copper, Aluminum, Corrugated)
- **Covering 3**: Clay/concrete tiles
- **Covering 1**: Asphalt shingles
- **Anchorage 0**: Unknown/default
- **Anchorage 1**: Hurricane Ties (straps/ties/seismic)
- **Anchorage 2**: Nails/Screws (toe-nailing)
- **Anchorage 3**: Anchor bolts (through/expansion bolts)
- **Anchorage 4**: Gravity/friction (unanchored, dead load only)
- **Anchorage 5**: Adhesive epoxy (structural epoxy/chemical adhesive)
- **Anchorage 6**: Structurally Connected (monolithic tie beam/welded)
- **Anchorage 7**: Clips (framing clips, metal clips)
- Rule 1 (Percentages): Higher % wins.
- Rule 2 (No % / Tie): Weaker material wins.

## Year Built Classification Rules
- **Multi-Year / Range Resolution**: When multiple years or ranges are given (e.g. `1995/2005`, `2005/1995`, `2005-1995`, `2005/95`), **ALWAYS pick the lesser / older year** (`1995`).
- **Valid Range**: 1753 to Current Year (`2026`). Out-of-range values become blank.

## Roof Year Built (2-Column) Classification Rules
- **Rule 1 (Greater Than or Equal To Year Built)**: Roof Year Built must be $\ge$ Year Built (`Roof Year Built ≥ Year Built`).
  - `YB = 2005` & `Roof = 2006` &rarr; Output **`2006`** (`2006 ≥ 2005`).
  - `YB = 2005` & `Roof = 2006/2007` &rarr; Output **`2007`** (higher year $\ge 2005$).
  - `YB = 2005` & `Roof = 2005` &rarr; Output **`2005`** (Original roof).
  - `Roof Year Built < Year Built`: **BLANK** (Invalid, not less than year built, e.g. YB: `2005`, RY: `2004` or `2004/2003` &rarr; Blank).
- **Rule 2 (Without Year Built)**: If Year Built is not provided, missing, or invalid, Cleaned Roof Year Built is **BLANK**.
- **Rule 3 (Missing Roof Year)**: If Year Built is provided but Roof Year Built is missing, Cleaned Roof Year Built is **BLANK**.
- **Rule 4 (Multi-Year Roof Resolution)**: If Roof Year Built contains multiple years or ranges (e.g. `2006/2007`, `2005/2006`, `2004/2003`):
  - Filter candidate roof years that are $\ge$ Year Built.
  - Pick the **higher year** among valid candidate years (`Math.max(...validGeYb)`).
  - If all candidate years are less than Year Built (e.g. `2004/2003` with `2005`), the output is **BLANK** ("not less than year build").
- **Rule 5 (Year Built Carry-Forward)**: When Year Built is entered on Row 1 (e.g. `2005`) and subsequent lines are blank while Roof Years continue, `2005` carries forward to validate subsequent rows.
- **Valid Range**: Output cleaned roof year within valid range `1753`–`2026`.

## No of Stores (Stories & Floors) Classification Rules
- **Negative Values Leave Blank**: If there are negative values, leave blank (e.g. `-5 ➔ blank`, `-2 ➔ blank`). Stories cannot be negative in underwriting. Zero (`0`) or non-positive values also resolve to blank.
- **Always Whole Number (`hole no`)**: Decimals round UP (`Math.ceil`):
  - `3.5 = 4`
  - `4.2 = 5`
  - `1.1 = 2`
  - `0.5 = 1`
- **Multi-Value / Ranges Pick Maximum**:
  - `2 & 3 = 3`
  - `1,2 = 2`
  - `2/3 = 3`
  - `2-4 = 4`
  - `2 and 3 = 3`
  - `1 to 3 = 3`
  - `1.5 & 2.2 = 3` (`Math.ceil(1.5)=2`, `Math.ceil(2.2)=3`, max = `3`)
- **If Blank Then Leave Blank**: Empty rows or whitespace-only inputs leave blank (`""`).
- **"non" = Blank**: Values like `non`, `none`, `no`, `n/a`, `na`, `null`, `nil`, `-`, `—`, `unknown`, `unk`, `tbd`, `0` leave blank (`""`).

## Address Column Splitter Multi-Country & UK Rules
- **UK Address Decomposition**:
  - `22 High Street WITNEY Oxfordshire OX28 6RB UNITED KINGDOM`:
    - **Street**: `22 High Street`
    - **City (Post Town)**: `WITNEY`
    - **County**: `Oxfordshire`
    - **Postal Code**: `OX28 6RB`
    - **Country**: `UNITED KINGDOM` (or `GB`, `UK`, `United Kingdom`)
- **UK Counties**: Recognizes 80+ UK ceremonial and historic counties (e.g. `Oxfordshire`, `Surrey`, `Greater London`, `Berkshire`, etc.) before postcodes.
- **UK Post Town**: Uses street suffix boundaries (`Street`, `Road`, `Avenue`, `Lane`, `Drive`, `Way`, `Close`, etc.) to split building/street from post town. Post town retains official Royal Mail capitalization (`WITNEY`).
- **Multi-Country Support**: Full parsing support for US (Street, City, State, County, Postal), Australia (AU States, 4-digit postcode), Canada (Provinces, A1A 1A1 postcodes), and Germany (PLZ 5-digit).
- **Table & Export Display**: Table and exports synchronize to include `County` and `Country` columns alongside `STREET`, `City`, `State`, and `Postal`.

## Street vs City Semantic Classification & Missing Value Rules
- **Missing Street Resolution**: When an address contains no street (e.g. `Springfield IL 62704` or `WITNEY Oxfordshire OX28 6RB`), the city MUST NEVER be placed into `STREET`.
  - **Street Indicators**: Contains leading building/house numbers (`123`, `742`, `22`, `10A`, `PO Box`, `Suite`, `Unit`) and/or street suffixes (`Street`, `St`, `Road`, `Rd`, `Avenue`, `Ave`, `Terrace`, `Ter`, `Lane`, `Ln`, `Court`, `Ct`, `Drive`, `Dr`, `Way`, etc.).
  - **City Indicators**: Has no building numbers and no street suffixes (e.g. `Springfield`, `Los Angeles`, `WITNEY`, `Chicago`).
  - **Rule (No Street)**: If the text contains neither a building number nor a street suffix, `street` is left BLANK (`—`) and `city` is populated with the city name.
  - **Rule (No City)**: If the text contains a building number and ends with a street suffix (e.g. `742 Evergreen Terrace IL 62704`), `street` is populated and `city` is left BLANK (`—`).
- **Order-Independent Resilience**: Extracts Country, Postal Code, and State anywhere in the input (start, middle, or end) using distinct regex/dictionary signatures before classifying remaining text into street and city.

## Custom Underwriting Codes Database & Taxonomy Manager
- **Custom Codes Database Layer (`data/custom_codes_db.js`)**:
  - Allows underwriters to add new custom codes, edit descriptions/categories, and define custom broker matching keywords.
  - Custom rules take top priority in `OccupancyClassifier` and `ConstructionClassifier` in `cleaner.js`.
  - Persists automatically to browser `localStorage` (`cleanexcel_underwriting_custom_db_v1`).
  - Provides 1-click JSON database Export (backup) and Import (restore/sharing) from the Code Explorer modal.
  - Allows reverting single modified codes or resetting all codes back to factory Touchstone UNICEDE® defaults.

## Apartment & Multi-Unit Residential Occupancy Rules (Codes 301, 303, 306)
- **1 Unit / 1 Building**: Maps to Touchstone UNICEDE Code **`301`** (`Permanent Dwelling: General Residential / 1 Unit`).
  - Example: `Col 1 = "Apartment"`, `Col 2 = "1"` or `"1 unit"` &rarr; **`301`**
  - Example: `Col 1 = "1"`, `Col 2 = "Apartment"` &rarr; **`301`**
  - Example: `"1 unit apartment"` &rarr; **`301`**
- **2 to 4 Units (Duplex / Triplex / Fourplex / 2-4 Family)**: Maps to Touchstone UNICEDE Code **`303`** (`Permanent Dwelling: Multi Family 2-4 Units`).
  - Example: `Col 1 = "Apartment"`, `Col 2 = "2"` / `"3 units"` / `"4"` &rarr; **`303`**
  - Example: `"3 units apartment"` &rarr; **`303`**
- **5 or More Units (5+ Units / Apartment Complex)**: Maps to Touchstone UNICEDE Code **`306`** (`Apartments / Condominiums 5+ Units`).
  - Example: `Col 1 = "Apartment"`, `Col 2 = "5"` / `"6 units"` / `"24"` &rarr; **`306`**
  - Example: `"12 unit apartment complex"` &rarr; **`306`**
- **Apartment without Unit Count**: Defaults to Touchstone UNICEDE Code **`306`** (`Apartments / Condominiums`).

## Garage Occupancy Classification Rules (Code 318)
- **GARAGE Rule**: `Garage`, `Garages`, `Parking`, `Parking garage`, `Parking structure`, `Detached garage`, `Only Garage`, `Storage garage` MUST ALWAYS map to Touchstone UNICEDE Occupancy Code **`318`** (`Parking Structures / Garages`).
  - Example: `Col 1 = "Garage"` &rarr; **`318`** (`Parking Structures / Garages`)
  - Example: `Col 1 = "only Garage"` &rarr; **`318`** (`Parking Structures / Garages`)
  - Example: `Col 1 = "GARAGE"` &rarr; **`318`** (`Parking Structures / Garages`)
  - Example: `Col 1 = "Garage", Col 2 = "—"` &rarr; **`318`** (`Parking Structures / Garages`)

## Wood Construction with Number of Stories & Year Built Rules
- **Rule 1 (Stories $\le$ 4 &rarr; Code 101)**: If construction is Wood (`Wood Frame`, `Timber`, `Wood Stud`, `Stick Built`) and number of stories is $\le 4$ (less than 4 or 4), output is **`101`** (`Wood Frame (Modern)`).
- **Rule 2 (Stories 5 to 7 & Year Built > 2005 &rarr; Code 101)**: If construction is Wood, stories between 5 and 7 ($> 4$ and $\le 7$), and Year Built is greater than 2005 (`Year Built > 2005`), output is **`101`** (`Wood Frame (Modern)`).
- **Rule 3 (Stories 5 to 7 & Year Built $\le$ 2005 &rarr; Blank)**: If construction is Wood, stories between 5 and 7, and Year Built is $\le 2005$ (or missing), output is **BLANK** (`""` / `⚠️ Wood Frame 5-7 Stories Built ≤ 2005 → Blank`).
- **Rule 4 (Stories $\ge$ 8 &rarr; Blank)**: If construction is Wood and number of stories is $\ge 8$ (8 or greater, e.g. 8, 9, 10, 12 stories), output is **BLANK** (`""` / `⚠️ Wood Frame ≥ 8 Stories → Blank`).
- **Non-Wood Constructions**: Masonry (`111`), Reinforced Concrete (`131`), Structural Steel (`151`), etc. are unaffected by Wood story/year limits.





