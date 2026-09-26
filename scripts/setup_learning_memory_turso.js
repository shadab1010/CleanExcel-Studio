/**
 * CleanExcel Studio - Learning Memory System Turso Database Initializer
 * 
 * Sets up dedicated category tables with full learning memory metadata:
 * - code, description, source, client, learned_at, status, confidence, name, group_name, keywords, is_global, is_trusted
 * - learning_conflicts (for review of conflicting descriptions)
 * - learning_audit_log (for full provenance tracking)
 */

const path = require('path');
const TURSO_DB_URL = process.env.TURSO_DB_URL || 'https://cleanexcel-codes-shadab1010.aws-ap-south-1.turso.io';
const TURSO_AUTH_TOKEN = process.argv[2] || process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MDY1NDMsImlkIjoiMDFhMGRjOGItNjYwMS03M2UxLWI5N2EtZmE4ZGE2NTJlYjBlIiwia2lkIjoiV0xuSmVfQnoyMGhGODVOVm5RblFFRklkUHk2bHgtOW8wUHNOVWN5TVA5OCIsInJpZCI6IjFkODZkNzlhLWJlMGUtNGFhZC05YzAwLWI3MDdmZDRlMjk2ZiJ9.OBt_UwCmXLWYEHWx1EjKW_wJtClhT09FpB8YgqxmBoiKH_EpB0OAtDrM934IlLwWakXG7Cq4zxLgqm3hcIYeCg';

const TD = require(path.join(__dirname, '../data/touchstone_data.js'));

async function executeTursoBatch(statements) {
  const endpoint = `${TURSO_DB_URL.replace('libsql://', 'https://')}/v2/pipeline`;
  
  const requests = statements.map(st => ({
    type: 'execute',
    stmt: {
      sql: st.sql,
      args: (st.args || []).map(a => {
        if (typeof a === 'number') {
          return { type: Number.isInteger(a) ? 'integer' : 'float', value: String(a) };
        }
        if (a === null || a === undefined) {
          return { type: 'null' };
        }
        return { type: 'text', value: String(a) };
      })
    }
  }));

  requests.push({ type: 'close' });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Turso HTTP Error ${res.status}: ${txt}`);
  }

  return await res.json();
}

const CATEGORIES = [
  { table: 'occupancy', codeCol: 'occupancy_code', descCol: 'occupancy_description', source: TD.OCCUPANCY },
  { table: 'construction', codeCol: 'construction_code', descCol: 'construction_description', source: TD.CONSTRUCTION },
  { table: 'roof_geometry', codeCol: 'roof_geometry_code', descCol: 'roof_geometry_description', source: TD.ROOF.GEOMETRY },
  { table: 'roof_pitch', codeCol: 'roof_pitch_code', descCol: 'roof_pitch_description', source: TD.ROOF.PITCH },
  { table: 'roof_covering', codeCol: 'roof_covering_code', descCol: 'roof_covering_description', source: TD.ROOF.COVERING },
  { table: 'roof_deck', codeCol: 'roof_deck_code', descCol: 'roof_deck_description', source: TD.ROOF.DECK },
  { table: 'roof_covering_attachment', codeCol: 'roof_covering_attachment_code', descCol: 'roof_covering_attachment_description', source: TD.ROOF.COVERING_ATTACHMENT },
  { table: 'roof_deck_attachment', codeCol: 'roof_deck_attachment_code', descCol: 'roof_deck_attachment_description', source: TD.ROOF.DECK_ATTACHMENT },
  { table: 'roof_anchorage', codeCol: 'roof_anchorage_code', descCol: 'roof_anchorage_description', source: TD.ROOF.ANCHORAGE },
  { table: 'roof_hail', codeCol: 'roof_hail_code', descCol: 'roof_hail_description', source: TD.ROOF.HAIL },
  { table: 'roof_chimney', codeCol: 'roof_chimney_code', descCol: 'roof_chimney_description', source: TD.ROOF.CHIMNEY },
  { table: 'roof_tank', codeCol: 'roof_tank_code', descCol: 'roof_tank_description', source: TD.ROOF.TANK },
  { table: 'wall_type', codeCol: 'wall_type_code', descCol: 'wall_type_description', source: TD.WALL.WALL_TYPE },
  { table: 'wall_siding', codeCol: 'wall_siding_code', descCol: 'wall_siding_description', source: TD.WALL.WALL_SIDING },
  { table: 'wall_glass_type', codeCol: 'wall_glass_type_code', descCol: 'wall_glass_type_description', source: TD.WALL.GLASS_TYPE },
  { table: 'wall_glass_percentage', codeCol: 'wall_glass_percentage_code', descCol: 'wall_glass_percentage_description', source: TD.WALL.GLASS_PERCENTAGE },
  { table: 'wall_window_protection', codeCol: 'wall_window_protection_code', descCol: 'wall_window_protection_description', source: TD.WALL.WINDOW_PROTECTION },
  { table: 'wall_exterior_doors', codeCol: 'wall_exterior_doors_code', descCol: 'wall_exterior_doors_description', source: TD.WALL.EXTERIOR_DOORS },
  { table: 'wall_brick_veneer', codeCol: 'wall_brick_veneer_code', descCol: 'wall_brick_veneer_description', source: TD.WALL.BRICK_VENEER },
  { table: 'wall_fire_rating', codeCol: 'wall_fire_rating_code', descCol: 'wall_fire_rating_description', source: TD.WALL.FIRE_RATING_WALL_SIDING },
  { table: 'wall_exterior_opening', codeCol: 'wall_exterior_opening_code', descCol: 'wall_exterior_opening_description', source: TD.WALL.BUILDING_EXTERIOR_OPENING },
  { table: 'foundation_type', codeCol: 'foundation_type_code', descCol: 'foundation_type_description', source: TD.FOUNDATION.FOUNDATION_TYPE },
  { table: 'foundation_connection', codeCol: 'foundation_connection_code', descCol: 'foundation_connection_description', source: TD.FOUNDATION.FOUNDATION_CONNECTION },
  { table: 'short_column', codeCol: 'short_column_code', descCol: 'short_column_description', source: TD.SHORT_COLUMN },
  { table: 'soft_story', codeCol: 'soft_story_code', descCol: 'soft_story_description', source: TD.SOFT_STORY },
  { table: 'ornamentation', codeCol: 'ornamentation_code', descCol: 'ornamentation_description', source: TD.ORNAMENTATION },
  { table: 'building_shape', codeCol: 'building_shape_code', descCol: 'building_shape_description', source: TD.BUILDING_SHAPE },
  { table: 'building_condition', codeCol: 'building_condition_code', descCol: 'building_condition_description', source: TD.BUILDING_CONDITION }
];

async function setupLearningMemoryTurso() {
  console.log('🚀 Initializing Learning Memory System Schema in Turso...');

  // 1. Create Conflicts & Audit tables
  await executeTursoBatch([
    {
      sql: `CREATE TABLE IF NOT EXISTS learning_conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        code TEXT NOT NULL,
        existing_description TEXT NOT NULL,
        new_description TEXT NOT NULL,
        client TEXT DEFAULT 'Global',
        source TEXT,
        status TEXT DEFAULT 'Requires Review',
        confidence TEXT DEFAULT 'Medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolution_notes TEXT
      );`
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS learning_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        code TEXT NOT NULL,
        action TEXT NOT NULL, -- 'LEARNED', 'APPROVED', 'REJECTED', 'EDITED', 'CONFLICT_DETECTED', 'CONFLICT_RESOLVED'
        old_value TEXT,
        new_value TEXT,
        client TEXT DEFAULT 'Global',
        source TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS other_reference_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        custom_category TEXT NOT NULL,
        reference_code TEXT NOT NULL,
        reference_description TEXT NOT NULL,
        source TEXT,
        client TEXT DEFAULT 'Global',
        learned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Pending Review',
        confidence TEXT DEFAULT 'High',
        extra_metadata TEXT,
        UNIQUE(custom_category, reference_code, client)
      );`
    }
  ]);

  console.log('✅ Created learning_conflicts, learning_audit_log, other_reference_data');

  // 2. Setup every category table with full learning columns
  for (const cat of CATEGORIES) {
    const ddl = `
      CREATE TABLE IF NOT EXISTS ${cat.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ${cat.codeCol} TEXT NOT NULL,
        ${cat.descCol} TEXT NOT NULL,
        source TEXT DEFAULT 'Touchstone Official',
        client TEXT DEFAULT 'Global',
        learned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Approved',
        confidence TEXT DEFAULT 'High',
        name TEXT,
        group_name TEXT,
        keywords TEXT,
        is_global INTEGER DEFAULT 1,
        is_trusted INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(${cat.codeCol}, client)
      );
    `;
    await executeTursoBatch([{ sql: ddl }]);

    // Seed official baseline records if table is empty
    const checkCount = await executeTursoBatch([{ sql: `SELECT count(*) as cnt FROM ${cat.table};` }]);
    const count = parseInt(checkCount.results[0].response.result.rows[0][0].value || '0', 10);

    if (count === 0 && cat.source) {
      const inserts = [];
      for (const [code, item] of Object.entries(cat.source)) {
        if (!item || typeof item !== 'object') continue;
        inserts.push({
          sql: `INSERT OR IGNORE INTO ${cat.table} (${cat.codeCol}, ${cat.descCol}, source, client, status, confidence, name, group_name, keywords, is_global, is_trusted, updated_at)
                VALUES (?, ?, 'Touchstone Baseline', 'Global', 'Approved', 'High', ?, ?, ?, 1, 1, CURRENT_TIMESTAMP);`,
          args: [
            code,
            item.description || item.desc || '',
            item.category || item.name || item.shortName || '',
            item.group || cat.table,
            Array.isArray(item.keywords) ? item.keywords.join(', ') : (item.keywords || '')
          ]
        });
      }
      if (inserts.length > 0) {
        await executeTursoBatch(inserts);
      }
      console.log(`   └─ Initialized ${cat.table} with ${inserts.length} baseline approved records.`);
    } else {
      console.log(`   └─ ${cat.table} already active (${count} records).`);
    }
  }

  console.log('\n🎉 Learning Memory System Database Tables Ready in Turso!');
}

setupLearningMemoryTurso().catch(console.error);
