/**
 * CleanExcel Studio - Individual Category Data Models for Turso Database
 * 
 * Provides direct individual table models for each reference-code category:
 * - OccupancyModel
 * - ConstructionModel
 * - RoofCoveringModel
 * - RoofGeometryModel
 * - RoofPitchModel
 * - RoofDeckModel
 * - RoofCoveringAttachmentModel
 * - RoofDeckAttachmentModel
 * - RoofAnchorageModel
 * - WallTypeModel
 * - WallSidingModel
 * - FoundationTypeModel
 * - FoundationConnectionModel
 * ...and all other individual categories.
 */

(function (root) {
  'use strict';

  const TURSO_CONFIG = {
    url: 'https://cleanexcel-codes-shadab1010.aws-ap-south-1.turso.io',
    token: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MDY1NDMsImlkIjoiMDFhMGRjOGItNjYwMS03M2UxLWI5N2EtZmE4ZGE2NTJlYjBlIiwia2lkIjoiV0xuSmVfQnoyMGhGODVOVm5RblFFRklkUHk2bHgtOW8wUHNOVWN5TVA5OCIsInJpZCI6IjFkODZkNzlhLWJlMGUtNGFhZC05YzAwLWI3MDdmZDRlMjk2ZiJ9.OBt_UwCmXLWYEHWx1EjKW_wJtClhT09FpB8YgqxmBoiKH_EpB0OAtDrM934IlLwWakXG7Cq4zxLgqm3hcIYeCg'
  };

  async function queryTurso(sql, args = []) {
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
    return [];
  }

  // Base factory for Individual Category Models
  function createCategoryModel(tableName, codeField, descField) {
    return {
      tableName,
      codeField,
      descField,

      async getAll() {
        return await queryTurso(`SELECT * FROM ${tableName} ORDER BY id ASC;`);
      },

      async getByCode(code) {
        const rows = await queryTurso(`SELECT * FROM ${tableName} WHERE ${codeField} = ? LIMIT 1;`, [code]);
        return rows[0] || null;
      },

      async search(term) {
        const pattern = `%${term}%`;
        return await queryTurso(
          `SELECT * FROM ${tableName} WHERE ${codeField} LIKE ? OR ${descField} LIKE ? OR keywords LIKE ? LIMIT 50;`,
          [pattern, pattern, pattern]
        );
      },

      async insert(code, description, extra = {}) {
        const cols = [codeField, descField, ...Object.keys(extra)];
        const placeholders = cols.map(() => '?').join(', ');
        const values = [code, description, ...Object.values(extra)];
        return await queryTurso(
          `INSERT INTO ${tableName} (${cols.join(', ')}, updated_at) VALUES (${placeholders}, CURRENT_TIMESTAMP);`,
          values
        );
      }
    };
  }

  // -------------------------------------------------------------
  // SEPARATE DATA MODELS FOR EACH CATEGORY
  // -------------------------------------------------------------
  const ReferenceModels = {
    // 1. Occupancy Table Model
    Occupancy: createCategoryModel('occupancy', 'occupancy_code', 'occupancy_description'),

    // 2. Construction Table Model
    Construction: createCategoryModel('construction', 'construction_code', 'construction_description'),

    // 3. Roof Sub-Category Table Models
    RoofGeometry: createCategoryModel('roof_geometry', 'roof_geometry_code', 'roof_geometry_description'),
    RoofPitch: createCategoryModel('roof_pitch', 'roof_pitch_code', 'roof_pitch_description'),
    RoofCovering: createCategoryModel('roof_covering', 'roof_covering_code', 'roof_covering_description'),
    RoofDeck: createCategoryModel('roof_deck', 'roof_deck_code', 'roof_deck_description'),
    RoofCoveringAttachment: createCategoryModel('roof_covering_attachment', 'roof_covering_attachment_code', 'roof_covering_attachment_description'),
    RoofDeckAttachment: createCategoryModel('roof_deck_attachment', 'roof_deck_attachment_code', 'roof_deck_attachment_description'),
    RoofAnchorage: createCategoryModel('roof_anchorage', 'roof_anchorage_code', 'roof_anchorage_description'),
    RoofHail: createCategoryModel('roof_hail', 'roof_hail_code', 'roof_hail_description'),
    RoofChimney: createCategoryModel('roof_chimney', 'roof_chimney_code', 'roof_chimney_description'),
    RoofTank: createCategoryModel('roof_tank', 'roof_tank_code', 'roof_tank_description'),

    // 4. Wall Sub-Category Table Models
    WallType: createCategoryModel('wall_type', 'wall_type_code', 'wall_type_description'),
    WallSiding: createCategoryModel('wall_siding', 'wall_siding_code', 'wall_siding_description'),
    WallGlassType: createCategoryModel('wall_glass_type', 'wall_glass_type_code', 'wall_glass_type_description'),
    WallGlassPercentage: createCategoryModel('wall_glass_percentage', 'wall_glass_percentage_code', 'wall_glass_percentage_description'),
    WallWindowProtection: createCategoryModel('wall_window_protection', 'wall_window_protection_code', 'wall_window_protection_description'),
    WallExteriorDoors: createCategoryModel('wall_exterior_doors', 'wall_exterior_doors_code', 'wall_exterior_doors_description'),
    WallBrickVeneer: createCategoryModel('wall_brick_veneer', 'wall_brick_veneer_code', 'wall_brick_veneer_description'),
    WallFireRating: createCategoryModel('wall_fire_rating', 'wall_fire_rating_code', 'wall_fire_rating_description'),
    WallExteriorOpening: createCategoryModel('wall_exterior_opening', 'wall_exterior_opening_code', 'wall_exterior_opening_description'),

    // 5. Foundation Table Models
    FoundationType: createCategoryModel('foundation_type', 'foundation_type_code', 'foundation_type_description'),
    FoundationConnection: createCategoryModel('foundation_connection', 'foundation_connection_code', 'foundation_connection_description'),

    // 6. Seismic & Structural Table Models
    ShortColumn: createCategoryModel('short_column', 'short_column_code', 'short_column_description'),
    SoftStory: createCategoryModel('soft_story', 'soft_story_code', 'soft_story_description'),
    Ornamentation: createCategoryModel('ornamentation', 'ornamentation_code', 'ornamentation_description'),
    BuildingShape: createCategoryModel('building_shape', 'building_shape_code', 'building_shape_description'),
    BuildingCondition: createCategoryModel('building_condition', 'building_condition_code', 'building_condition_description'),

    // Helper to query any table directly
    query: queryTurso
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReferenceModels;
  }
  root.ReferenceModels = ReferenceModels;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
