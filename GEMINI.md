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

## Roof Detail Classification Rules (7 Fields + Additional Fields)
- **1. Roof Geometry**: Flat (1), Gable end without bracing (2), Hip (3), Complex (4), Stepped (5), Shed (6), Mansard (7), Gable end with bracing (8), Pyramid (9), Gambrel (10). Unknown/default (0).
- **2. Roof Pitch**: Low <10° (1), Medium 10°–30° (2), High >30° (3). Unknown/default (0).
- **3. Roof Covering**: Asphalt shingles (1), Wood shingles (2), Clay/concrete tiles (3), Light metal panels (4), Slate (5), Built-up roof with gravel (6), Single-ply membrane (7), Standing seam metal (8), Built-up roof without gravel / Smooth BUR (9), Single-ply ballasted (10), Hurricane wind-rated (11), Photovoltaic (12). Unknown/default (0).
- **4. Roof Deck**: Plywood (1), Wood planks (2), Particle board/OSB (3), Metal deck with insulation board (4), Metal deck with concrete (5), Pre-cast concrete slabs (6), Reinforced concrete slabs (7), Light metal (8). Unknown/default (0).
- **5. Roof Covering Attachment**: Screws (1), Nails/staples (2), Adhesive/epoxy (3), Mortar (4). Unknown/default (0).
- **6. Roof Deck Attachment**: Screws/bolts (1), Nails (2), Adhesive/epoxy (3), Structurally connected (4), 6d nails @ 6/12 (5), 8d nails @ 6/12 (6), 8d nails @ 6/6 (7). Unknown/default (0).
- **7. Roof Anchorage**: Hurricane Ties (1), Nails/Screws (2), Anchor bolts (3), Gravity/friction (4), Adhesive epoxy (5), Structurally Connected (6), Clips (7). Unknown/default (0).
- **Additional Fields**: Roof Hail Impact Resistance (0–4), Tank (0–2), Chimney (0–4), Roof Year Built (0 / 1000–2100).
- **Multi-Component Resolution**: Rule 1 (Percentages): Higher % wins. Rule 2 (No % / Tie): Weaker material wins. All fields optional and default to `0`.

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

## Sports Courts & Recreation Occupancy Classification Rules (Code 317)
- **SPORTS COURTS Rule**: `Basketball Court`, `Volleyball Court`, `Tennis Court`, `Pickleball Court`, `Badminton Court`, `Squash Court`, `Racquetball Court`, `Sports Court`, `Athletic Court` MUST ALWAYS map to Touchstone UNICEDE Occupancy Code **`317`** (`Entertainment & Recreation (Theaters/Gyms)`).
  - Example: `Col 1 = "Basketball Court"` &rarr; **`317`** (`Entertainment & Recreation`)
  - Example: `Col 1 = "Volleyball Court"` &rarr; **`317`** (`Entertainment & Recreation`)
  - Example: `Col 1 = "Tennis Court"` &rarr; **`317`** (`Entertainment & Recreation`)
  - Example: `Col 1 = "Pickleball Court"` &rarr; **`317`** (`Entertainment & Recreation`)

## Touchstone UNICEDE® Foundation Connection Classification Rules (Codes 0–6)
- **Codes & Descriptions**:
  - **`0`**: Unknown/default (0)
  - **`1`**: Hurricane ties (1) (hurricane straps, seismic ties, uplift straps, hold-downs, hurricane clips)
  - **`2`**: Nails/Screws (2) (toe-nailing, screws, nails, wood screws)
  - **`3`**: Anchor Bolts (3) (sill plate bolts, foundation bolts, anchor bolts, expansion bolts, J-bolts)
  - **`4`**: Gravity/Friction (4) (unanchored, dead load only, gravity, friction, resting on foundation)
  - **`5`**: Adhesive/Epoxy (5) (chemical adhesive anchor, structural epoxy, resin anchor)
  - **`6`**: Structurally Connected (6) (monolithic concrete tie, welded connection, embed plates, continuous reinforcement)
- **For Industrial Facilities (Anchorage of Equipment)**:
  - **`0`**: Unknown/default (0)
  - **`4`**: Unanchored (4)
  - **`6`**: Anchored (6)
- **Perils**: CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST (straight-line winds, tornadoes).
- **Verisk Retrofit Rule**: For Verisk Earthquake Model for the United States, you must specify `Gravity/Friction (4)` if you want to use the Retrofit Measures option `Foundation anchorage (bolting) (4)`.
- **General Underwriting**: Loss of anchorage between building and foundation is a critical failure mode in earthquakes and windstorms. Field is optional and defaults to `0`.

## Touchstone UNICEDE® Foundation Type Classification Rules (Codes 0–12)
- **Codes & Descriptions**:
  - **`0`**: Unknown/default (0)
  - **`1`**: Masonry basement (1) (brick/masonry basement walls, sub-grade masonry)
  - **`2`**: Concrete basement (2) (poured concrete, reinforced concrete basement)
  - **`3`**: Masonry wall (3) *(Touchstone maps to Crawlspace cripple wall (4) upon import)*
  - **`4`**: Crawlspace cripple wall (wood) (4) (cripple wall, pony wall, wood stud crawlspace)
  - **`5`**: Crawlspace masonry (wood) (5) (masonry stem wall, perimeter block crawlspace)
  - **`6`**: Post & pier (6) (timber posts, concrete piers, stilts, raised pilings)
  - **`7`**: Footing (7) (spread footing, strip footing, shallow continuous concrete footing)
  - **`8`**: Mat / slab (8) (slab-on-grade, raft foundation, floating slab, structural mat — typical for mid-rise buildings)
  - **`9`**: Pile (9) (driven piles, drilled caissons, deep foundation, friction/end-bearing piles — typical for high-rise buildings & earthquake performance)
  - **`10`**: No basement (10) (slab-on-grade without basement, crawlspace without basement)
  - **`11`**: Engineering foundation (11) (special engineered foundation, seismic base isolation, micropiles)
  - **`12`**: Crawlspace - raised (wood) (12) (elevated wood floor over open foundation, raised crawlspace)
- **Applicable Peril Models**: CA EQ, CE IF, EU ETC, HI EQ, IT IF (v11.5), JP IF, JP EQ, JP TY, NZ EQ, SK TY (v13), UK/ROI IF (v13.0), US EQ, US HU, US IF.
- **UK & Central Europe Inland Flood Models**: Only `0` (Unknown), `1` (Masonry basement), `2` (Concrete basement), `10` (No basement) are applicable.
- **US Earthquake Model**: `No basement (10)` is not applicable. Must select `Crawlspace cripple wall (4) (wood)` to use Retrofit Measures option `Bracing of cripple walls (1)`.
- **Floor of Interest = Basement (-1)**: Must select `1` (Masonry basement) or `2` (Concrete basement). `No basement (10)` is invalid/not applicable.
- **Building Height / Structural Typologies**:
  - Most **mid-rise buildings** are built on **mat / slab foundation (`8`)**.
  - **High-rise buildings** tend to be supported on **pile foundation (`9`)** (superior seismic performance).
- **Ignored Classes**: IFM (400 series), Mobile homes (191-194), 200 series (automobiles/pleasure boats), Industrial occupancies (321-330).

## Touchstone UNICEDE® Location Wall Detail Classification Rules (9 Fields)
- **1. Wall Type (0–9)**: Unknown/default (0), Brick/unreinforced masonry (1), Reinforced masonry (2), Plywood (3), Wood planks (4), Particle board/OSB (5), Metal panels (6), Pre-cast concrete elements (7), Cast-in-place concrete (8), Gypsum board (9). Perils: CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST.
- **2. Wall Siding (0–8)**: Unknown/default (0), Veneer brick/masonry (1), Wood shingles (2), Clapboards (3), Aluminum/vinyl siding (4), Stone panels (5), Exterior insulation finishing system / EIFS (6), Stucco (7), Fiber cement board (8) (added June 2024 for US WF). Perils: AU WF (added 2025), CA EQ, HI EQ, HI TC, JP EQ, NZ EQ, US EQ, US HU, US ST, US WF.
- **3. Glass Type (0–5)**: Unknown/default (0), Annealed (1), Tempered (2), Heat strengthened (3), Laminated (4), Insulating glass units / IGU (5). Perils: HI TC, US HU, US ST, US WF.
- **4. Glass Percentage (0–4)**: Unknown/default (0), Less than 5% (1), Between 5% and 20% (2), Between 20% and 60% (3), Greater than 60% (4). Perils: HI TC, US HU, US ST.
- **5. Window Protection (0–3)**: Unknown/default (0), No protection (1), Non-engineered shutters (2), Engineered shutters (3). Perils: HI TC, US HU, US ST.
- **6. Exterior Doors (0–6)**: Unknown/default (0), Single width doors (1), Double width doors (2), Reinforced single width doors (3), Reinforced double width doors (4), Sliding doors (5), Reinforced sliding doors (6). Perils: HI TC, US HU, US ST.
- **7. Building Exterior Opening (0–2)**: Unknown (0), Less than 50% of wall open / default (1), More than 50% of wall open (2). Perils: CA EQ, HI EQ, JP EQ, NZ EQ, US EQ.
- **8. Brick Veneer (0–3)**: Unknown/default (0) (represents 50–90%), More than 90% (1), 25–50% (2), 0–25% (3). Perils: CA EQ, HI EQ, JP EQ, US EQ. (Used in conjunction with 103 - masonry veneer).
- **9. Fire Rating for Wall Siding (0–3)**: Unknown/No Rating (0), Fire Rated Class A (1), Fire Rated Class B (2), Fire Rated Class C (3). Perils: AU WF, US WF. (Added June 2024).
- **Multi-Component Resolution**: Rule 1 (Percentages): Higher % wins. Rule 2 (No % / Tie): Weaker material wins. All fields optional and default to `0`.

## Touchstone UNICEDE® Short Column Classification Rules (Codes 0–2)
- **Codes & Values**:
  - **`0`**: Unknown/default (0)
  - **`1`**: No (1) - No short columns in the building at this location.
  - **`2`**: Yes (2) - Short columns present in the building at this location.
- **Perils Supported**: `CA EQ`, `HI EQ`, `JP EQ`, `US EQ`.
- **Status**: `Optional`. Defaults to `0` (Unknown/default).
- **Underwriting Technical Specification**:
  - Applies to old concrete structures in which the fill height of some column has been restricted by spandrel beams or infill walls.
  - If some of the columns along the perimeter are shorter than the adjacent columns, there is high chance that the shorter columns can no longer bear the loads for which they were originally designed.

## Touchstone UNICEDE® Soft Story Classification Rules (Codes 0–2)
- **Codes & Values**:
  - **`0`**: Unknown/default (0) - Unknown or default soft story condition.
  - **`1`**: No (1) - No soft story structural weakness in the building at this location.
  - **`2`**: Yes (2) - Structural weakness at any floor in the building at this location.
- **Perils Supported**: `CA EQ`, `HI EQ`, `JP EQ`, `NZ EQ`, `US EQ`.
- **Status**: `Optional`. Defaults to `0` (Unknown/default).
- **Applicability Rule**:
  - This field is applicable only if the number of **stories is 2 or greater** (`Stories ≥ 2`).
- **Underwriting Technical Specification**:
  - First-floor garages and taller first floors are likely to exhibit soft-story behavior (e.g. tuck-under parking, open parking on ground floor).
  - The weakness is usually in the lateral load-resisting capacity of the floor and can often result in total (pancaking) collapse of the floor.
  - In residential buildings, it is most often found in the first floor due to large openings or garages.
  - In multi-story buildings, it can be present at any floor, although a large number of case histories exist with collapse of the first floor.

## Touchstone UNICEDE® Ornamentation Classification Rules (Codes 0–3)
- **Codes & Values**:
  - **`0`**: Unknown/default (0)
  - **`1`**: None (1) - No decorative elements attached to exterior.
  - **`2`**: Average (2) - Moderate decorative trim and facade elements.
  - **`3`**: Extensive (3) - Complex/extensive decorative elements, unreinforced parapets, entryway roofs.
- **Perils Supported**: `CA EQ`, `HI EQ`, `JP EQ`, `US EQ`.
- **Status**: `Optional`. Defaults to `0` (Unknown/default).
- **Underwriting Technical Specification**:
  - One of the values to describe the amount of decorative elements attached to exterior of the building at this location.
  - Decorative elements may fall during an earthquake.
  - Examples include unreinforced or unbraced parapet walls or entryway roofs, which can break off during excessive shaking.

## Touchstone UNICEDE® Building Shape Classification Rules (Codes 0–8)
- **Codes & Values**:
  - **`0`**: Unknown/default (0)
  - **`1`**: Square (1)
  - **`2`**: Rectangle (2)
  - **`3`**: Circular (3)
  - **`4`**: L-shaped (4)
  - **`5`**: T-shaped (5)
  - **`6`**: U-shaped (6)
  - **`7`**: H-shaped (7)
  - **`8`**: Complex (8)
- **Perils Supported**: `CA EQ`, `HI EQ`, `JP EQ`, `NZ EQ`, `US EQ`.
- **Status**: `Optional`. Defaults to `0` (Unknown/default).
- **Underwriting Technical Specification**:
  - One of the values to describe the overall shape of the footprint of the building at this location.
  - Shape is critical for the performance of a structure, especially for large commercial buildings.
  - In general, simple regular forms, like squares (`1`) and rectangles (`2`), perform better than combinations of those, such as L- (`4`) and T-shaped (`5`) buildings.
  - The sharp re-entrant corners in these complex shapes are vulnerable to damage.

## Touchstone UNICEDE® Building Condition Classification Rules (Codes 0–3)
- **Codes & Values**:
  - **`0`**: Unknown (0)
  - **`1`**: Average (1)
  - **`2`**: Good (2)
  - **`3`**: Poor (3)
- **Perils Supported**: `CA EQ`, `HI EQ`, `HI TC`, `JP EQ`, `NZ EQ`, `US EQ`, `US HU`, `US ST`.
- **Status**: `Optional`. Defaults to a value in the Touchstone user interface (generally `0: Unknown`, but default is `1: Average` for earthquake models).
- **Underwriting Technical Specification**:
  - One of the qualitative descriptions of the condition of the building at this location, based on visual inspection of the building cladding and maintenance.
  - External appearance of cladding and maintenance gives a qualitative estimate of expected structural and envelope performance.
  - For earthquakes: Buildings with signs of distress or duress (cracking from aging/settlement/overloading or damage from previous earthquakes) suffer additional damage. Default for EQ is "Average".
  - For hurricanes/tropical cyclones: Buildings with distress (aging roof/cladding, loose tiles, chimney damage, previous storm damage) experience heightened vulnerability.

## Latitude & Longitude Coordinates DMS to Decimal Degrees Rules
- **Exact Formula**: $\text{Decimal Degrees} = \text{Degrees} + (\text{Minutes} \div 60) + (\text{Seconds} \div 3600)$
- **Direction Rules**:
  - `N` (North) = positive (`+`)
  - `E` (East) = positive (`+`)
  - `S` (South) = negative (`-`)
  - `W` (West) = negative (`-`)
- **Examples**:
  - `29°39'03.6"N` &rarr; `29.651000`
  - `82°19'26.4"W` &rarr; `-82.324000`
  - `30°23'06.0"N` &rarr; `30.385000`
  - `86°27'36.0"W` &rarr; `-86.460000`
- **Underwriting Rules**:
  - Preserve exact row alignment and coordinate order (Latitude and Longitude never swapped).
  - Automatically detect DMS vs Decimal format.
  - Return decimal coordinates formatted to **6 decimal places**.
  - If coordinate is already in decimal format (e.g. `25.765`, `-80.191`), preserve as decimal without re-converting.
  - If a coordinate is missing or blank, return **`"Missing"`**.
  - Negative sign (`-`) mandatory for `W` and `S`.
  - Output table format: `Latitude` | `Longitude`.

