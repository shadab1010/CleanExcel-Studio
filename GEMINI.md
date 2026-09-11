# CleanExcel Memory & Domain Rules

## Underwriting Rules for Exterior Wall Finish & Construction Classification

- **STONE** always maps to Touchstone UNICEDE Construction Code **113** (`Rubble Stone Masonry`).
  - Synonyms: `Stone`, `Stone facade`, `Stone wall`, `Stone finish`, `Stone masonry`, `Fieldstone`.
- **BRICK** always maps to Touchstone UNICEDE Construction Code **111** (`Masonry`).
  - Synonyms: `Brick`, `Exterior brick`, `Brick finish`, `Brick wall`, `Brick facade`, `General masonry`.

## Roof Detail Classification Rules
- **Covering 7**: Single-ply membrane (EPDM, TPO, PVC)
- **Covering 9**: Built-up roof without gravel (Smooth BUR, Modified Bitumen, Mod-Bit)
- **Covering 6**: Built-up roof with gravel (BUR, Tar & Gravel)
- **Covering 5**: Slate
- **Covering 4**: Light metal panels (Steel, Copper, Aluminum, Corrugated)
- **Covering 3**: Clay/concrete tiles
- **Covering 1**: Asphalt shingles
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

