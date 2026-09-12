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

