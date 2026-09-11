# ⚡ CleanExcel Studio v3.0

> **Enterprise Data Sanitization & Catastrophe Risk Underwriting Modeling Studio**  
> Clean unstructured Excel broker columns, resolve Touchstone UNICEDE® codes, enforce catastrophe vulnerability constraints, and export model-ready schedules in milliseconds.

---

## ✨ Features

- **🌐 10 Dedicated Cleaning Engines**:
  - **🏠 Street Address**: Cleans 29 illegal symbols while safeguarding numeric address ranges (e.g. `145-146 MIRAMAR BOULEVARD`).
  - **🔀 Universal Address Splitter**: Parses multi-country address records across US, UK, Germany, and Canada.
  - **🏢 Occupancy Class Classifier**: 3-column comparative mapping (`Existing Code (AR)`, `Building Description (AS)`, `Occupancy Description (AT)`) to Touchstone UNICEDE® codes 300–384.
  - **🏗️ Construction Class Classifier**: 3-column comparative mapping to Touchstone UNICEDE® codes 100–514 with strict memory rules.
  - **📅 Year Built Validator**: Range validation (1753–2026) with automatic multi-year/range resolution to the original construction year.
  - **🏚️ 2-Column Roof Year Built Engine**: Strict underwriting validation ensuring `Roof Year Built ≥ Year Built`, multi-year resolution, and automatic base Year Built carry-forward.
  - **🏠 UNICEDE® Roof Detail Classifier**: 4-field extraction (Geometry, Pitch, Covering, Deck) with higher-% and weaker-material vulnerability arbitration.
  - **🧱 Exterior Wall Finish**: Resolves structural WallType (0–9) and WallSiding weather protection (0–8).
  - **👤 Full Name**: Intelligent First, Middle, Last parsing with Title Case formatting.
  - **📞 Phone & ✉️ Email**: E.164 / RFC 5322 syntax validation.

- **🎨 Vengeance UI Cybernetic Design**:
  - Obsidian frosted-glass cards with `backdrop-filter` and hairline top illumination.
  - Cybernetic command console with active engine selector and category filters.
  - High-performance **Space Grotesk** and **Orbitron** typography.
  - 1-Click Excel Copy with luminous gradient shimmer animation.

- **🔒 100% In-Memory Privacy**:
  - Zero cloud transmission. All schedule parsing, regex sanitization, and classification execute locally in your browser.

- **🤖 Optional Google Gemini AI Integration**:
  - Seamless AI enrichment powered by `gemini-2.5-flash` with custom user API key support stored securely in `localStorage`.

---

## 🏛️ Underwriting Domain Rules & Memory

1. **Stone Wall Finish & Construction**:
   - `STONE` (and synonyms like *Stone facade*, *Stone wall*, *Stone finish*, *Fieldstone*) **MUST ALWAYS** map to Touchstone Construction Code **`113`** (`Rubble Stone Masonry`).
2. **Brick Wall Finish & Construction**:
   - `BRICK` (and synonyms like *Exterior brick*, *Brick finish*, *Brick facade*) **MUST ALWAYS** map to Touchstone Construction Code **`111`** (`Masonry`).
3. **Year Built Multi-Year Resolution**:
   - Multi-year formats or ranges (e.g. `1995/2005`, `2005/1995`, `2005-1995`, `2005/95`) **always pick the lesser / older year** (original construction year).
4. **Roof Year Built (2-Column Validation)**:
   - **`Roof Year Built ≥ Year Built`**: Must be greater than or equal to Year Built.
   - If Roof Year is less than Year Built (e.g. `YB: 2005`, `Roof: 2004`), cleaned output is left **BLANK** (`⚠️ Roof Year < Year Built → Blank`).
   - If multiple roof years are present (e.g. `2006/2007`), picks the **higher year** $\ge$ Year Built.
   - If Year Built is omitted or missing, output is left **BLANK**.
   - Year Built on Row 1 automatically carries forward to subsequent rows.
5. **Roof Covering Multi-Component Arbitration**:
   - Explicit percentages: higher % material wins.
   - No percentages or tied percentages: weaker material wins (higher catastrophe vulnerability score).

---

## 🚀 Quick Start

CleanExcel Studio is a zero-dependency, client-side web application. You can launch it using any local web server:

### Using Python
```bash
python3 -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Using Node.js (npx)
```bash
npx serve .
# or
npx http-server -p 8000
```

---

## 📁 Project Architecture

```text
├── index.html          # Main application structure (Homepage + Clean Studio workspace)
├── styles.css          # Vengeance UI design system & responsive cyber styling
├── app.js              # Controller, event bindings, and DOM orchestration
├── cleaner.js          # 10 modular underwriting and cleaning engines
├── code_finder.js      # Touchstone UNICEDE® 300+ taxonomy search & modal
├── react_output.js     # High-performance React data grid & diff comparison table
├── gemini.js           # Google Gemini 2.5 Flash AI integration service
├── AGENTS.md           # Persistent underwriting memory & classification rules
├── GEMINI.md           # Model rules & memory
└── vendor/             # Local offline React & ReactDOM production bundles
```

---

## 📜 License

MIT License. Built for catastrophe risk modeling and insurance underwriting analysis.
