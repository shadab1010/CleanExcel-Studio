/**
 * CleanExcel Studio - Learning Memory System for Reference Data
 * 
 * CORE PRINCIPLES:
 * 1. Strictly isolated reference tables: Every category has its own independent dataset.
 * 2. Never merges different reference categories into one table.
 * 3. Client-Specific Learning: Keeps Global and Client-Specific codes separate.
 * 4. Conflict Safety: Never silently overwrites existing trusted codes; flags conflicts for review.
 * 5. Instant Lookup: Category-isolated lookups with client priority and fallback.
 * 6. Dual Persistence: Live Turso cloud sync + LocalStorage offline caching.
 * 7. Complete Audit Trail: Tracks learned, edited, approved, rejected, and conflict events.
 */

(function (root) {
  'use strict';

  const STORAGE_KEY = 'cleanexcel_learning_memory_v2';
  const AUDIT_STORAGE_KEY = 'cleanexcel_learning_audit_log_v2';
  const CONFLICT_STORAGE_KEY = 'cleanexcel_learning_conflicts_v2';

  const TURSO_CONFIG = {
    url: 'https://cleanexcel-codes-shadab1010.aws-ap-south-1.turso.io',
    token: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MDY1NDMsImlkIjoiMDFhMGRjOGItNjYwMS03M2UxLWI5N2EtZmE4ZGE2NTJlYjBlIiwia2lkIjoiV0xuSmVfQnoyMGhGODVOVm5RblFFRklkUHk2bHgtOW8wUHNOVWN5TVA5OCIsInJpZCI6IjFkODZkNzlhLWJlMGUtNGFhZC05YzAwLWI3MDdmZDRlMjk2ZiJ9.OBt_UwCmXLWYEHWx1EjKW_wJtClhT09FpB8YgqxmBoiKH_EpB0OAtDrM934IlLwWakXG7Cq4zxLgqm3hcIYeCg'
  };

  // Known Category Schema Map
  const CATEGORY_SCHEMAS = {
    occupancy: { table: 'occupancy', codeCol: 'occupancy_code', descCol: 'occupancy_description', label: 'Occupancy' },
    construction: { table: 'construction', codeCol: 'construction_code', descCol: 'construction_description', label: 'Construction' },
    roof: { table: 'roof_covering', codeCol: 'roof_covering_code', descCol: 'roof_covering_description', label: 'Roof Covering' },
    roof_geometry: { table: 'roof_geometry', codeCol: 'roof_geometry_code', descCol: 'roof_geometry_description', label: 'Roof Geometry' },
    roof_pitch: { table: 'roof_pitch', codeCol: 'roof_pitch_code', descCol: 'roof_pitch_description', label: 'Roof Pitch' },
    roof_covering: { table: 'roof_covering', codeCol: 'roof_covering_code', descCol: 'roof_covering_description', label: 'Roof Covering' },
    roof_deck: { table: 'roof_deck', codeCol: 'roof_deck_code', descCol: 'roof_deck_description', label: 'Roof Deck' },
    roof_covering_attachment: { table: 'roof_covering_attachment', codeCol: 'roof_covering_attachment_code', descCol: 'roof_covering_attachment_description', label: 'Roof Covering Attachment' },
    roof_deck_attachment: { table: 'roof_deck_attachment', codeCol: 'roof_deck_attachment_code', descCol: 'roof_deck_attachment_description', label: 'Roof Deck Attachment' },
    roof_anchorage: { table: 'roof_anchorage', codeCol: 'roof_anchorage_code', descCol: 'roof_anchorage_description', label: 'Roof Anchorage' },
    roof_hail: { table: 'roof_hail', codeCol: 'roof_hail_code', descCol: 'roof_hail_description', label: 'Roof Hail Impact' },
    roof_chimney: { table: 'roof_chimney', codeCol: 'roof_chimney_code', descCol: 'roof_chimney_description', label: 'Roof Chimney' },
    roof_tank: { table: 'roof_tank', codeCol: 'roof_tank_code', descCol: 'roof_tank_description', label: 'Roof Tank' },
    wall: { table: 'wall_type', codeCol: 'wall_type_code', descCol: 'wall_type_description', label: 'Wall Type' },
    wall_type: { table: 'wall_type', codeCol: 'wall_type_code', descCol: 'wall_type_description', label: 'Wall Type' },
    wall_siding: { table: 'wall_siding', codeCol: 'wall_siding_code', descCol: 'wall_siding_description', label: 'Wall Siding' },
    wall_glass_type: { table: 'wall_glass_type', codeCol: 'wall_glass_type_code', descCol: 'wall_glass_type_description', label: 'Wall Glass Type' },
    wall_glass_percentage: { table: 'wall_glass_percentage', codeCol: 'wall_glass_percentage_code', descCol: 'wall_glass_percentage_description', label: 'Wall Glass %' },
    wall_window_protection: { table: 'wall_window_protection', codeCol: 'wall_window_protection_code', descCol: 'wall_window_protection_description', label: 'Window Protection' },
    wall_exterior_doors: { table: 'wall_exterior_doors', codeCol: 'wall_exterior_doors_code', descCol: 'wall_exterior_doors_description', label: 'Exterior Doors' },
    wall_brick_veneer: { table: 'wall_brick_veneer', codeCol: 'wall_brick_veneer_code', descCol: 'wall_brick_veneer_description', label: 'Brick Veneer %' },
    wall_fire_rating: { table: 'wall_fire_rating', codeCol: 'wall_fire_rating_code', descCol: 'wall_fire_rating_description', label: 'Fire Rating for Siding' },
    wall_exterior_opening: { table: 'wall_exterior_opening', codeCol: 'wall_exterior_opening_code', descCol: 'wall_exterior_opening_description', label: 'Exterior Openings' },
    foundation: { table: 'foundation_type', codeCol: 'foundation_type_code', descCol: 'foundation_type_description', label: 'Foundation Type' },
    foundation_type: { table: 'foundation_type', codeCol: 'foundation_type_code', descCol: 'foundation_type_description', label: 'Foundation Type' },
    foundation_connection: { table: 'foundation_connection', codeCol: 'foundation_connection_code', descCol: 'foundation_connection_description', label: 'Foundation Connection' },
    short_column: { table: 'short_column', codeCol: 'short_column_code', descCol: 'short_column_description', label: 'Short Column' },
    soft_story: { table: 'soft_story', codeCol: 'soft_story_code', descCol: 'soft_story_description', label: 'Soft Story' },
    ornamentation: { table: 'ornamentation', codeCol: 'ornamentation_code', descCol: 'ornamentation_description', label: 'Ornamentation' },
    building_shape: { table: 'building_shape', codeCol: 'building_shape_code', descCol: 'building_shape_description', label: 'Building Shape' },
    building_condition: { table: 'building_condition', codeCol: 'building_condition_code', descCol: 'building_condition_description', label: 'Building Condition' },
    other_reference_data: { table: 'other_reference_data', codeCol: 'reference_code', descCol: 'reference_description', label: 'Other Reference Data' }
  };

  // Helper to query Turso HTTP API
  async function queryTurso(sql, args = []) {
    try {
      const endpoint = `${TURSO_CONFIG.url}/v2/pipeline`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TURSO_CONFIG.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              type: 'execute',
              stmt: {
                sql,
                args: args.map(a => ({
                  type: typeof a === 'number' ? 'integer' : 'text',
                  value: String(a)
                }))
              }
            },
            { type: 'close' }
          ]
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      if (data.results && data.results[0] && data.results[0].response) {
        const res = data.results[0].response.result;
        const cols = res.cols.map(c => c.name);
        return res.rows.map(row => {
          const obj = {};
          row.forEach((val, idx) => {
            obj[cols[idx]] = val.value;
          });
          return obj;
        });
      }
    } catch (e) {
      console.warn('[LearningMemory] Turso query failed, falling back to local store:', e);
    }
    return null;
  }

  // In-Memory & LocalStorage Data Store
  class LearningMemoryStore {
    constructor() {
      this.tables = {};
      this.conflicts = [];
      this.auditLog = [];
      this.listeners = [];
      this.loadLocal();
      this.initBaseline();
    }

    loadLocal() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) this.tables = JSON.parse(raw);

          const rawAudit = localStorage.getItem(AUDIT_STORAGE_KEY);
          if (rawAudit) this.auditLog = JSON.parse(rawAudit);

          const rawConflicts = localStorage.getItem(CONFLICT_STORAGE_KEY);
          if (rawConflicts) this.conflicts = JSON.parse(rawConflicts);
        }
      } catch (err) {
        console.warn('[LearningMemory] Error loading localStorage:', err);
      }
    }

    saveLocal() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tables));
          localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.auditLog));
          localStorage.setItem(CONFLICT_STORAGE_KEY, JSON.stringify(this.conflicts));
        }
      } catch (err) {
        console.warn('[LearningMemory] Error saving localStorage:', err);
      }
      this.notifyListeners();
    }

    notifyListeners() {
      this.listeners.forEach(cb => {
        try { cb(); } catch (e) {}
      });
    }

    subscribe(cb) {
      this.listeners.push(cb);
      return () => {
        this.listeners = this.listeners.filter(l => l !== cb);
      };
    }

    initBaseline() {
      // Ensure separate dictionary arrays exist for each category
      Object.keys(CATEGORY_SCHEMAS).forEach(cat => {
        if (!this.tables[cat]) this.tables[cat] = [];
      });

      // Seed from Touchstone baseline if empty
      if (typeof root.TouchstoneData !== 'undefined' || typeof globalThis.TouchstoneData !== 'undefined') {
        const TD = root.TouchstoneData || globalThis.TouchstoneData;
        if (TD && this.tables.occupancy.length === 0 && TD.OCCUPANCY) {
          for (const [code, item] of Object.entries(TD.OCCUPANCY)) {
            this.tables.occupancy.push({
              id: 'occ_' + code,
              occupancy_code: code,
              occupancy_description: item.description || '',
              name: item.category || '',
              group_name: item.group || 'Residential',
              keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : '',
              source: 'Touchstone Baseline',
              client: 'Global',
              learned_at: new Date().toISOString(),
              status: 'Approved',
              confidence: 'High',
              is_global: 1,
              is_trusted: 1
            });
          }
        }
        if (TD && this.tables.construction.length === 0 && TD.CONSTRUCTION) {
          for (const [code, item] of Object.entries(TD.CONSTRUCTION)) {
            this.tables.construction.push({
              id: 'con_' + code,
              construction_code: code,
              construction_description: item.description || '',
              name: item.category || '',
              iso_class: item.iso || '',
              group_name: item.group || 'Construction',
              keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : '',
              source: 'Touchstone Baseline',
              client: 'Global',
              learned_at: new Date().toISOString(),
              status: 'Approved',
              confidence: 'High',
              is_global: 1,
              is_trusted: 1
            });
          }
        }
      }
    }

    // Detect Category from name / hint
    detectCategory(rawCategory) {
      if (!rawCategory) return 'other_reference_data';
      const c = String(rawCategory).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');

      if (c.includes('occup') || c.includes('occ') || c.includes('usage') || c.includes('use')) return 'occupancy';
      if (c.includes('const') || c.includes('struct') || c.includes('iso')) return 'construction';
      if (c.includes('roof_geom') || c.includes('geometry')) return 'roof_geometry';
      if (c.includes('roof_pitch') || c.includes('pitch')) return 'roof_pitch';
      if (c.includes('roof_cov') || c.includes('covering')) return 'roof_covering';
      if (c.includes('roof_deck_att') || c.includes('deck_attachment')) return 'roof_deck_attachment';
      if (c.includes('roof_cov_att') || c.includes('covering_attachment')) return 'roof_covering_attachment';
      if (c.includes('roof_deck') || c.includes('deck')) return 'roof_deck';
      if (c.includes('roof_anch') || c.includes('anchorage')) return 'roof_anchorage';
      if (c.includes('roof_hail') || c.includes('hail')) return 'roof_hail';
      if (c.includes('roof_chim') || c.includes('chimney')) return 'roof_chimney';
      if (c.includes('roof_tank') || c.includes('tank')) return 'roof_tank';
      if (c.includes('roof')) return 'roof_covering';
      if (c.includes('wall_sid') || c.includes('siding')) return 'wall_siding';
      if (c.includes('wall_glass_pct') || c.includes('glass_percent')) return 'wall_glass_percentage';
      if (c.includes('wall_glass') || c.includes('glass')) return 'wall_glass_type';
      if (c.includes('wall_prot') || c.includes('shutter') || c.includes('window_prot')) return 'wall_window_protection';
      if (c.includes('wall_door') || c.includes('exterior_door')) return 'wall_exterior_doors';
      if (c.includes('wall_brick') || c.includes('brick_veneer')) return 'wall_brick_veneer';
      if (c.includes('wall_fire') || c.includes('fire_rating')) return 'wall_fire_rating';
      if (c.includes('wall_open') || c.includes('exterior_open')) return 'wall_exterior_opening';
      if (c.includes('wall_type') || c.includes('wall')) return 'wall_type';
      if (c.includes('foundation_conn') || c.includes('connection')) return 'foundation_connection';
      if (c.includes('foundation_type') || c.includes('basement') || c.includes('foundation')) return 'foundation_type';
      if (c.includes('short_col')) return 'short_column';
      if (c.includes('soft_story')) return 'soft_story';
      if (c.includes('ornament')) return 'ornamentation';
      if (c.includes('building_shape') || c.includes('shape')) return 'building_shape';
      if (c.includes('building_cond') || c.includes('condition')) return 'building_condition';

      return CATEGORY_SCHEMAS[c] ? c : 'other_reference_data';
    }

    // -------------------------------------------------------------
    // CORE LEARNING WORKFLOW
    // -------------------------------------------------------------
    async learn({
      category,
      code,
      description,
      name = '',
      client = 'Global',
      source = 'Manual Entry',
      confidence = 'High',
      autoApprove = false,
      keywords = ''
    }) {
      const detectedCat = this.detectCategory(category);
      const schema = CATEGORY_SCHEMAS[detectedCat] || CATEGORY_SCHEMAS.other_reference_data;
      const codeStr = String(code).trim();
      const descStr = String(description).trim();
      const clientStr = client ? String(client).trim() : 'Global';

      if (!codeStr || !descStr) {
        throw new Error('Code and Description are required for Learning Memory.');
      }

      const tableData = this.tables[detectedCat] || [];
      const codeField = schema.codeCol;
      const descField = schema.descCol;

      // 1. Check if code already exists for this category (and matching client scope)
      const existing = tableData.find(r => 
        String(r[codeField]).toLowerCase() === codeStr.toLowerCase() && 
        (r.client || 'Global').toLowerCase() === clientStr.toLowerCase()
      );

      // Also check if there's a global record when client is specific
      const globalExisting = clientStr !== 'Global' 
        ? tableData.find(r => String(r[codeField]).toLowerCase() === codeStr.toLowerCase() && (r.client || 'Global') === 'Global')
        : null;

      // 2. CONFLICT CHECK (Safety Rule: Never silently overwrite trusted code)
      if (existing) {
        const existingDesc = existing[descField] || '';
        const isIdentical = existingDesc.toLowerCase().trim() === descStr.toLowerCase().trim();

        if (!isIdentical) {
          // Flag Conflict
          const conflictRecord = {
            id: 'conf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            category: detectedCat,
            categoryLabel: schema.label,
            code: codeStr,
            existingDescription: existingDesc,
            newDescription: descStr,
            client: clientStr,
            source: source,
            confidence: confidence,
            status: 'Requires Review',
            createdAt: new Date().toISOString()
          };

          this.conflicts.unshift(conflictRecord);
          this.logAudit({
            category: detectedCat,
            code: codeStr,
            action: 'CONFLICT_DETECTED',
            oldValue: existingDesc,
            newValue: descStr,
            client: clientStr,
            source: source,
            details: `Conflict detected for ${schema.label} code ${codeStr}. Existing: "${existingDesc}" vs New: "${descStr}".`
          });

          this.saveLocal();

          // Sync conflict to Turso
          queryTurso(
            `INSERT INTO learning_conflicts (category, code, existing_description, new_description, client, source, status, confidence, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'Requires Review', ?, CURRENT_TIMESTAMP);`,
            [detectedCat, codeStr, existingDesc, descStr, clientStr, source, confidence]
          );

          return {
            status: 'CONFLICT_DETECTED',
            message: `Conflict detected for ${schema.label} code ${codeStr}. Existing description differs. Flagged for review.`,
            conflict: conflictRecord
          };
        } else {
          // Exactly matches existing record -> Increment usage or update keywords
          this.logAudit({
            category: detectedCat,
            code: codeStr,
            action: 'REINFORCED',
            oldValue: existingDesc,
            newValue: descStr,
            client: clientStr,
            source: source,
            details: `Reinforced existing ${schema.label} reference code ${codeStr}.`
          });
          return {
            status: 'ALREADY_EXISTS',
            message: `${schema.label} code ${codeStr} already exists with identical definition.`,
            record: existing
          };
        }
      }

      // 3. CODE DOES NOT EXIST -> Insert into separate dedicated table
      const newRecord = {
        id: `${detectedCat}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        [codeField]: codeStr,
        [descField]: descStr,
        name: name || descStr.slice(0, 40),
        group_name: schema.label,
        keywords: keywords || '',
        source: source,
        client: clientStr,
        learned_at: new Date().toISOString(),
        status: autoApprove ? 'Approved' : 'Pending Review',
        confidence: confidence,
        is_global: clientStr === 'Global' ? 1 : 0,
        is_trusted: autoApprove ? 1 : 0
      };

      if (detectedCat === 'other_reference_data') {
        newRecord.custom_category = category;
      }

      tableData.unshift(newRecord);
      this.tables[detectedCat] = tableData;

      this.logAudit({
        category: detectedCat,
        code: codeStr,
        action: 'LEARNED',
        oldValue: null,
        newValue: descStr,
        client: clientStr,
        source: source,
        details: `Learned new ${schema.label} code ${codeStr}: "${descStr}" (Client: ${clientStr}, Status: ${newRecord.status}).`
      });

      this.saveLocal();

      // Async write to Turso cloud
      const sqlCols = [codeField, descField, 'source', 'client', 'status', 'confidence', 'name', 'group_name', 'keywords', 'is_global', 'is_trusted', 'updated_at'];
      const placeholders = sqlCols.map(() => '?').join(', ');
      queryTurso(
        `INSERT INTO ${schema.table} (${sqlCols.join(', ')}) VALUES (${placeholders});`,
        [
          codeStr, descStr, source, clientStr, newRecord.status, confidence,
          newRecord.name, newRecord.group_name, newRecord.keywords,
          newRecord.is_global, newRecord.is_trusted, new Date().toISOString()
        ]
      );

      return {
        status: 'SUCCESS',
        message: `Successfully learned ${schema.label} code ${codeStr} into dedicated table "${schema.table}".`,
        record: newRecord
      };
    }

    // -------------------------------------------------------------
    // SEARCH & LOOKUP ENGINE (Category Isolated)
    // -------------------------------------------------------------
    lookup(category, code, client = 'Global') {
      const detectedCat = this.detectCategory(category);
      const schema = CATEGORY_SCHEMAS[detectedCat];
      if (!schema) return null;

      const tableData = this.tables[detectedCat] || [];
      const codeStr = String(code).trim().toLowerCase();
      const clientStr = client ? String(client).trim().toLowerCase() : 'global';

      // 1. Client-specific approved lookup first
      if (clientStr !== 'global') {
        const clientMatch = tableData.find(r => 
          String(r[schema.codeCol]).toLowerCase() === codeStr &&
          (r.client || '').toLowerCase() === clientStr &&
          (r.status === 'Approved' || r.is_trusted === 1)
        );
        if (clientMatch) return clientMatch;
      }

      // 2. Global approved lookup fallback
      const globalMatch = tableData.find(r => 
        String(r[schema.codeCol]).toLowerCase() === codeStr &&
        (r.client || 'Global') === 'Global' &&
        (r.status === 'Approved' || r.is_trusted === 1)
      );

      return globalMatch || null;
    }

    matchPhrase(category, phrase, client = 'Global') {
      const detectedCat = this.detectCategory(category);
      const schema = CATEGORY_SCHEMAS[detectedCat];
      if (!schema) return null;

      const tableData = this.tables[detectedCat] || [];
      const cleanPhrase = String(phrase || '').trim().toLowerCase();
      if (!cleanPhrase) return null;

      // 1. Client specific match
      if (client && client.toLowerCase() !== 'global') {
        const clientMatch = tableData.find(r => {
          if ((r.client || '').toLowerCase() !== client.toLowerCase()) return false;
          if (r.status !== 'Approved' && r.is_trusted !== 1) return false;
          const desc = String(r[schema.descCol] || '').toLowerCase();
          const name = String(r.name || '').toLowerCase();
          const kws = Array.isArray(r.keywords) ? r.keywords : (r.keywords ? String(r.keywords).toLowerCase().split(',') : []);
          return desc === cleanPhrase || name === cleanPhrase || kws.some(k => String(k).trim().toLowerCase() === cleanPhrase);
        });
        if (clientMatch) return clientMatch[schema.codeCol];
      }

      // 2. Global match
      const globalMatch = tableData.find(r => {
        if (r.client && r.client.toLowerCase() !== 'global') return false;
        if (r.status !== 'Approved' && r.is_trusted !== 1) return false;
        const desc = String(r[schema.descCol] || '').toLowerCase();
        const name = String(r.name || '').toLowerCase();
        const kws = Array.isArray(r.keywords) ? r.keywords : (r.keywords ? String(r.keywords).toLowerCase().split(',') : []);
        return desc === cleanPhrase || name === cleanPhrase || kws.some(k => String(k).trim().toLowerCase() === cleanPhrase);
      });

      return globalMatch ? globalMatch[schema.codeCol] : null;
    }

    // Search across records in a category
    searchCategory(category, query, client = 'All') {
      const detectedCat = this.detectCategory(category);
      const schema = CATEGORY_SCHEMAS[detectedCat];
      if (!schema) return [];

      const tableData = this.tables[detectedCat] || [];
      const q = String(query || '').trim().toLowerCase();

      return tableData.filter(r => {
        if (client !== 'All') {
          const matchClient = (r.client || 'Global').toLowerCase() === client.toLowerCase();
          if (!matchClient) return false;
        }
        if (!q) return true;

        const codeVal = String(r[schema.codeCol] || '').toLowerCase();
        const descVal = String(r[schema.descCol] || '').toLowerCase();
        const nameVal = String(r.name || '').toLowerCase();
        const kwVal = String(r.keywords || '').toLowerCase();

        return codeVal.includes(q) || descVal.includes(q) || nameVal.includes(q) || kwVal.includes(q);
      });
    }

    // -------------------------------------------------------------
    // APPROVAL ACTIONS
    // -------------------------------------------------------------
    approve(category, id) {
      const detectedCat = this.detectCategory(category);
      const tableData = this.tables[detectedCat] || [];
      const rec = tableData.find(r => r.id === id);

      if (!rec) return false;

      rec.status = 'Approved';
      rec.is_trusted = 1;
      rec.updated_at = new Date().toISOString();

      const schema = CATEGORY_SCHEMAS[detectedCat];
      const codeStr = rec[schema.codeCol];

      this.logAudit({
        category: detectedCat,
        code: codeStr,
        action: 'APPROVED',
        oldValue: 'Pending Review',
        newValue: 'Approved',
        client: rec.client,
        source: rec.source,
        details: `Approved ${schema.label} code ${codeStr}. Now trusted for reference lookup.`
      });

      this.saveLocal();

      // Sync to Turso
      queryTurso(
        `UPDATE ${schema.table} SET status = 'Approved', is_trusted = 1, updated_at = CURRENT_TIMESTAMP WHERE ${schema.codeCol} = ? AND client = ?;`,
        [codeStr, rec.client || 'Global']
      );

      return true;
    }

    reject(category, id) {
      const detectedCat = this.detectCategory(category);
      const tableData = this.tables[detectedCat] || [];
      const rec = tableData.find(r => r.id === id);

      if (!rec) return false;

      rec.status = 'Rejected';
      rec.is_trusted = 0;
      rec.updated_at = new Date().toISOString();

      const schema = CATEGORY_SCHEMAS[detectedCat];
      const codeStr = rec[schema.codeCol];

      this.logAudit({
        category: detectedCat,
        code: codeStr,
        action: 'REJECTED',
        oldValue: rec[schema.descCol],
        newValue: 'Rejected',
        client: rec.client,
        source: rec.source,
        details: `Rejected ${schema.label} code ${codeStr}. Excluded from trusted lookup.`
      });

      this.saveLocal();

      // Sync to Turso
      queryTurso(
        `UPDATE ${schema.table} SET status = 'Rejected', is_trusted = 0, updated_at = CURRENT_TIMESTAMP WHERE ${schema.codeCol} = ? AND client = ?;`,
        [codeStr, rec.client || 'Global']
      );

      return true;
    }

    edit(category, id, { description, keywords, name, client, status }) {
      const detectedCat = this.detectCategory(category);
      const tableData = this.tables[detectedCat] || [];
      const rec = tableData.find(r => r.id === id);

      if (!rec) return false;

      const schema = CATEGORY_SCHEMAS[detectedCat];
      const oldDesc = rec[schema.descCol];

      if (description !== undefined) rec[schema.descCol] = description;
      if (keywords !== undefined) rec.keywords = keywords;
      if (name !== undefined) rec.name = name;
      if (client !== undefined) rec.client = client;
      if (status !== undefined) rec.status = status;
      rec.updated_at = new Date().toISOString();

      this.logAudit({
        category: detectedCat,
        code: rec[schema.codeCol],
        action: 'EDITED',
        oldValue: oldDesc,
        newValue: rec[schema.descCol],
        client: rec.client,
        source: rec.source,
        details: `Edited ${schema.label} code ${rec[schema.codeCol]}.`
      });

      this.saveLocal();

      // Sync to Turso
      queryTurso(
        `UPDATE ${schema.table} SET ${schema.descCol} = ?, keywords = ?, name = ?, client = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE ${schema.codeCol} = ?;`,
        [rec[schema.descCol], rec.keywords || '', rec.name || '', rec.client || 'Global', rec.status, rec[schema.codeCol]]
      );

      return true;
    }

    // Resolve Conflict Action
    resolveConflict(conflictId, resolution, resolutionNotes = '') {
      const idx = this.conflicts.findIndex(c => c.id === conflictId);
      if (idx === -1) return false;

      const conf = this.conflicts[idx];
      const schema = CATEGORY_SCHEMAS[conf.category] || CATEGORY_SCHEMAS.other_reference_data;

      if (resolution === 'OVERWRITE_GLOBAL') {
        // Update existing record
        const tableData = this.tables[conf.category] || [];
        const existing = tableData.find(r => r[schema.codeCol] === conf.code);
        if (existing) {
          existing[schema.descCol] = conf.newDescription;
          existing.status = 'Approved';
          existing.is_trusted = 1;
          existing.source = conf.source;
          existing.updated_at = new Date().toISOString();
        }
      } else if (resolution === 'SAVE_AS_CLIENT_SPECIFIC') {
        // Create new client-scoped record
        this.learn({
          category: conf.category,
          code: conf.code,
          description: conf.newDescription,
          client: conf.client || 'Custom Client',
          source: conf.source,
          autoApprove: true
        });
      }

      // Remove from active conflicts
      this.conflicts.splice(idx, 1);

      this.logAudit({
        category: conf.category,
        code: conf.code,
        action: 'CONFLICT_RESOLVED',
        oldValue: conf.existingDescription,
        newValue: conf.newDescription,
        client: conf.client,
        source: conf.source,
        details: `Conflict resolved with action "${resolution}". Notes: ${resolutionNotes}`
      });

      this.saveLocal();

      // Sync to Turso
      queryTurso(
        `UPDATE learning_conflicts SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP, resolution_notes = ? WHERE id = ? OR (category = ? AND code = ?);`,
        [resolutionNotes || resolution, conf.id, conf.category, conf.code]
      );

      return true;
    }

    logAudit({ category, code, action, oldValue, newValue, client, source, details }) {
      const entry = {
        id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        category,
        code,
        action,
        oldValue: oldValue ? String(oldValue).slice(0, 200) : null,
        newValue: newValue ? String(newValue).slice(0, 200) : null,
        client: client || 'Global',
        source: source || 'User Action',
        details: details || '',
        timestamp: new Date().toISOString()
      };

      this.auditLog.unshift(entry);
      if (this.auditLog.length > 500) this.auditLog.pop();

      // Async write audit to Turso
      queryTurso(
        `INSERT INTO learning_audit_log (category, code, action, old_value, new_value, client, source, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        [category, code, action, entry.oldValue, entry.newValue, entry.client, entry.source, details]
      );
    }

    // Aggregate statistics across all separate tables
    getStats() {
      let totalLearned = 0;
      let totalApproved = 0;
      let totalPending = 0;
      let activeCategories = 0;

      Object.entries(this.tables).forEach(([cat, rows]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          activeCategories++;
          rows.forEach(r => {
            totalLearned++;
            if (r.status === 'Approved' || r.is_trusted === 1) totalApproved++;
            else if (r.status === 'Pending Review') totalPending++;
          });
        }
      });

      return {
        totalLearned,
        totalApproved,
        totalPending,
        totalConflicts: this.conflicts.length,
        activeCategories,
        totalAuditEntries: this.auditLog.length
      };
    }

    // Pull latest updates from Turso Cloud Database into local store
    async syncFromTurso() {
      for (const [catKey, schema] of Object.entries(CATEGORY_SCHEMAS)) {
        const rows = await queryTurso(`SELECT * FROM ${schema.table} ORDER BY id ASC;`);
        if (rows && rows.length > 0) {
          this.tables[catKey] = rows;
        }
      }

      // Fetch conflicts
      const confRows = await queryTurso(`SELECT * FROM learning_conflicts WHERE status = 'Requires Review' ORDER BY id DESC;`);
      if (confRows) {
        this.conflicts = confRows.map(r => ({
          id: r.id,
          category: r.category,
          categoryLabel: (CATEGORY_SCHEMAS[r.category] && CATEGORY_SCHEMAS[r.category].label) || r.category,
          code: r.code,
          existingDescription: r.existing_description,
          newDescription: r.new_description,
          client: r.client || 'Global',
          source: r.source,
          confidence: r.confidence || 'Medium',
          status: r.status,
          createdAt: r.created_at
        }));
      }

      // Fetch audit log
      const auditRows = await queryTurso(`SELECT * FROM learning_audit_log ORDER BY id DESC LIMIT 200;`);
      if (auditRows) {
        this.auditLog = auditRows.map(r => ({
          id: r.id,
          category: r.category,
          code: r.code,
          action: r.action,
          oldValue: r.old_value,
          newValue: r.new_value,
          client: r.client,
          source: r.source,
          details: r.details,
          timestamp: r.created_at
        }));
      }

      this.saveLocal();
      return true;
    }
  }

  const LearningMemory = new LearningMemoryStore();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LearningMemory, CATEGORY_SCHEMAS };
  }
  root.LearningMemory = LearningMemory;
  root.CATEGORY_SCHEMAS = CATEGORY_SCHEMAS;

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
