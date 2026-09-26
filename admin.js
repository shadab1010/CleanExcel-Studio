/**
 * CleanExcel Studio - Cloud Database & Underwriting Memory Admin Console Controller
 * 
 * Provides full management, table explorer, audit logs, conflict resolution,
 * and SQL execution across all 35 dedicated Turso Cloud tables.
 */

(function (root) {
  'use strict';

  let currentCategory = 'occupancy';
  let currentPage = 1;
  const PAGE_SIZE = 25;
  let selectedGroupFilter = 'all';

  // Structured Categorization for all 35 tables
  const CATEGORY_GROUPS = [
    {
      id: 'occupancy',
      name: 'Occupancy & Facility Use',
      icon: '🏢',
      color: '#38bdf8',
      keys: ['occupancy']
    },
    {
      id: 'construction',
      name: 'Structural Construction',
      icon: '🏗️',
      color: '#a855f7',
      keys: ['construction']
    },
    {
      id: 'roof',
      name: 'Roof Dimensions & Materials',
      icon: '🏠',
      color: '#f59e0b',
      keys: [
        'roof_geometry',
        'roof_pitch',
        'roof_covering',
        'roof_deck',
        'roof_covering_attachment',
        'roof_deck_attachment',
        'roof_anchorage',
        'roof_hail',
        'roof_chimney',
        'roof_tank'
      ]
    },
    {
      id: 'wall',
      name: 'Exterior Wall & Envelope',
      icon: '🧱',
      color: '#10b981',
      keys: [
        'wall_type',
        'wall_siding',
        'wall_glass_type',
        'wall_glass_percentage',
        'wall_window_protection',
        'wall_exterior_doors',
        'wall_exterior_opening',
        'wall_brick_veneer',
        'wall_fire_rating'
      ]
    },
    {
      id: 'foundation',
      name: 'Foundation & Geotechnical',
      icon: '🏛️',
      color: '#ec4899',
      keys: ['foundation_type', 'foundation_connection']
    },
    {
      id: 'seismic',
      name: 'Seismic & Secondary Vulnerability',
      icon: '📉',
      color: '#6366f1',
      keys: ['short_column', 'soft_story', 'ornamentation', 'building_shape', 'building_condition']
    },
    {
      id: 'master',
      name: 'Master Taxonomy & Underwriting Rules',
      icon: '📋',
      color: '#14b8a6',
      keys: ['underwriting_codes', 'underwriting_categories', 'underwriting_rules', 'other_reference_data']
    },
    {
      id: 'system',
      name: 'Learning Memory & System Logs',
      icon: '🛡️',
      color: '#ef4444',
      keys: ['learning_conflicts', 'audit_log']
    }
  ];

  // Dom Elements
  let el = {};

  function initElements() {
    el = {
      dbStatusPill: document.getElementById('db-status-pill'),
      dbStatusLabel: document.getElementById('db-status-label'),
      btnSync: document.getElementById('btn-admin-sync'),
      btnExport: document.getElementById('btn-admin-export'),
      btnAddCode: document.getElementById('btn-admin-add-code'),
      
      // KPIs
      kpiTotalCodes: document.getElementById('kpi-total-codes'),
      kpiTotalTables: document.getElementById('kpi-total-tables'),
      kpiActiveConflicts: document.getElementById('kpi-active-conflicts'),
      kpiTotalAudits: document.getElementById('kpi-total-audits'),
      
      // Badges
      tabBadgeTables: document.getElementById('tab-badge-tables'),
      tabBadgeAudits: document.getElementById('tab-badge-audits'),
      tabBadgeConflicts: document.getElementById('tab-badge-conflicts'),

      // Navigation
      tabButtons: document.querySelectorAll('.admin-tab-btn'),
      tabPanes: document.querySelectorAll('.admin-tab-pane'),

      // Tables Explorer
      categoryFilterInput: document.getElementById('category-filter-input'),
      sidebarCategories: document.getElementById('sidebar-categories'),
      activeCategoryTitle: document.getElementById('active-category-title'),
      activeCategoryMeta: document.getElementById('active-category-meta'),
      recordsSearchInput: document.getElementById('records-search-input'),
      clientFilterSelect: document.getElementById('client-filter-select'),
      btnAddRowToTable: document.getElementById('btn-add-row-to-table'),
      adminTableHead: document.getElementById('admin-table-head'),
      adminTableBody: document.getElementById('admin-table-body'),
      tableRecordCountLabel: document.getElementById('table-record-count-label'),
      tablePaginationControls: document.getElementById('table-pagination-controls'),

      // Audit Log
      auditActionFilter: document.getElementById('audit-action-filter'),
      auditSearchInput: document.getElementById('audit-search-input'),
      auditTimelineContainer: document.getElementById('audit-timeline-container'),
      btnClearAuditLogs: document.getElementById('btn-clear-audit-logs'),

      // Conflicts
      conflictsListContainer: document.getElementById('conflicts-list-container'),

      // Clients
      clientsGridContainer: document.getElementById('clients-grid-container'),

      // SQL Console
      sqlConsoleInput: document.getElementById('sql-console-input'),
      btnRunSql: document.getElementById('btn-run-sql'),
      sqlExecTime: document.getElementById('sql-exec-time'),
      consoleResultsBox: document.getElementById('console-results-box'),
      presetSqlButtons: document.querySelectorAll('.preset-sql-btn'),

      // Modal
      editModal: document.getElementById('admin-edit-modal'),
      editModalTitle: document.getElementById('admin-modal-title'),
      btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
      btnCancelEditModal: document.getElementById('btn-cancel-edit-modal'),
      recordForm: document.getElementById('admin-record-form'),
      modalCategorySelect: document.getElementById('modal-category-select'),
      modalCodeInput: document.getElementById('modal-code-input'),
      modalDescInput: document.getElementById('modal-desc-input'),
      modalNameInput: document.getElementById('modal-name-input'),
      modalClientInput: document.getElementById('modal-client-input'),
      modalKeywordsInput: document.getElementById('modal-keywords-input'),
      modalRecordId: document.getElementById('modal-record-id'),
      modalIsEdit: document.getElementById('modal-is-edit'),

      // Toasts
      toastContainer: document.getElementById('admin-toast-container')
    };
  }

  // Toast notifications
  function showToast(message, icon = 'ℹ️') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Get Engine Schema Helper
  function getSchemas() {
    return (root.LearningMemory && root.LearningMemory.schemas) || {};
  }

  // Refresh KPI Cards
  function refreshKPIs() {
    if (!root.LearningMemory) return;
    const stats = root.LearningMemory.getStats();

    if (el.kpiTotalCodes) el.kpiTotalCodes.textContent = stats.totalRows || '937';
    if (el.kpiTotalTables) el.kpiTotalTables.textContent = stats.totalCategories || '35';
    if (el.kpiActiveConflicts) el.kpiActiveConflicts.textContent = stats.pendingConflicts || '0';
    if (el.kpiTotalAudits) el.kpiTotalAudits.textContent = stats.auditLogCount || '0';

    if (el.tabBadgeTables) el.tabBadgeTables.textContent = stats.totalCategories || '35';
    if (el.tabBadgeAudits) el.tabBadgeAudits.textContent = stats.auditLogCount || '0';
    if (el.tabBadgeConflicts) {
      el.tabBadgeConflicts.textContent = stats.pendingConflicts || '0';
      el.tabBadgeConflicts.style.display = stats.pendingConflicts > 0 ? 'inline-block' : 'none';
    }

    if (el.dbStatusLabel) {
      el.dbStatusLabel.textContent = `Turso Cloud DB: Connected (${stats.totalRows} Codes)`;
    }
  }

  // Populate Sidebar Categories with Structured Groups
  function renderSidebarCategories() {
    if (!el.sidebarCategories || !root.LearningMemory) return;
    const schemas = getSchemas();
    const filterText = (el.categoryFilterInput ? el.categoryFilterInput.value : '').toLowerCase().trim();
    el.sidebarCategories.innerHTML = '';

    // Calculate group counts and render sections
    CATEGORY_GROUPS.forEach(group => {
      // Check if group matches selected group pill
      if (selectedGroupFilter !== 'all' && group.id !== selectedGroupFilter) {
        return;
      }

      // Filter matching table keys in this group
      const matchingKeys = group.keys.filter(key => {
        const schema = schemas[key];
        if (!schema) return false;
        if (!filterText) return true;
        return (
          schema.label.toLowerCase().includes(filterText) ||
          schema.table.toLowerCase().includes(filterText) ||
          group.name.toLowerCase().includes(filterText)
        );
      });

      if (matchingKeys.length === 0) return;

      // Calculate total rows in this group
      let groupTotalRows = 0;
      matchingKeys.forEach(key => {
        groupTotalRows += (root.LearningMemory.tables[key] || []).length;
      });

      // Section container
      const section = document.createElement('div');
      section.className = 'category-group-section';

      // Group Header
      const header = document.createElement('div');
      header.className = 'category-group-header';
      header.innerHTML = `
        <div class="category-group-title">
          <span>${group.icon}</span>
          <span style="color:${group.color || '#94a3b8'}">${group.name}</span>
        </div>
        <span class="category-group-total">${groupTotalRows} codes</span>
      `;
      section.appendChild(header);

      // Buttons for each table in this group
      matchingKeys.forEach(key => {
        const schema = schemas[key];
        const rowCount = (root.LearningMemory.tables[key] || []).length;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `category-nav-btn ${key === currentCategory ? 'active' : ''}`;
        btn.innerHTML = `
          <span>${schema.label}</span>
          <span class="cat-btn-badge">${rowCount}</span>
        `;
        btn.addEventListener('click', () => {
          currentCategory = key;
          currentPage = 1;
          renderSidebarCategories();
          renderActiveTable();
        });
        section.appendChild(btn);
      });

      el.sidebarCategories.appendChild(section);
    });

    // Populate Modal category select (with optgroups)
    if (el.modalCategorySelect && el.modalCategorySelect.children.length === 0) {
      CATEGORY_GROUPS.forEach(group => {
        const optGroup = document.createElement('optgroup');
        optGroup.label = `${group.icon} ${group.name}`;
        group.keys.forEach(key => {
          const schema = schemas[key];
          if (schema) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${schema.label} (${schema.table})`;
            optGroup.appendChild(opt);
          }
        });
        el.modalCategorySelect.appendChild(optGroup);
      });
    }
  }

  // Render Table Records View
  function renderActiveTable() {
    if (!root.LearningMemory) return;
    const schemas = getSchemas();
    const schema = schemas[currentCategory] || schemas.occupancy;
    if (!schema) return;

    if (el.activeCategoryTitle) el.activeCategoryTitle.textContent = `${schema.label} Reference Table`;
    const allRows = root.LearningMemory.tables[currentCategory] || [];
    if (el.activeCategoryMeta) {
      el.activeCategoryMeta.innerHTML = `SQL Table: <code>${schema.table}</code> • ${allRows.length} Total Records`;
    }

    // Filter by search & client
    let filtered = allRows.filter(r => {
      if (selectedClient !== 'All') {
        const c = (r.client || 'Global').toLowerCase();
        if (c !== selectedClient.toLowerCase()) return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const codeVal = String(r[schema.codeCol] || '').toLowerCase();
      const descVal = String(r[schema.descCol] || '').toLowerCase();
      const nameVal = String(r.name || '').toLowerCase();
      const kwVal = String(r.keywords || '').toLowerCase();
      return codeVal.includes(q) || descVal.includes(q) || nameVal.includes(q) || kwVal.includes(q);
    });

    // Render Table Header
    if (el.adminTableHead) {
      el.adminTableHead.innerHTML = `
        <tr>
          <th style="width: 110px;">${schema.codeCol.toUpperCase()}</th>
          <th>${schema.descCol.toUpperCase()}</th>
          <th>TITLE / NAME</th>
          <th style="width: 110px;">SCOPE</th>
          <th style="width: 110px;">STATUS</th>
          <th style="width: 140px; text-align: right;">ACTIONS</th>
        </tr>
      `;
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const pagedRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

    // Render Table Body
    if (el.adminTableBody) {
      el.adminTableBody.innerHTML = '';
      if (pagedRows.length === 0) {
        el.adminTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: #94a3b8; padding: 48px 20px;">
              <div style="font-size: 1.6rem; margin-bottom: 8px;">🔍</div>
              <div style="font-size: 0.95rem; font-weight: 600; color: #e2e8f0; margin-bottom: 6px;">No records found</div>
              <div style="font-size: 0.8rem; color: #64748b;">
                ${searchQuery ? `No matching codes or descriptions for "<strong>${searchQuery}</strong>" in <code>${schema.table}</code> table.` : `No records found in <code>${schema.table}</code> table.`}
              </div>
            </td>
          </tr>
        `;
      } else {
        pagedRows.forEach(row => {
          const tr = document.createElement('tr');
          const codeVal = row[schema.codeCol] || row.code || '—';
          const descVal = row[schema.descCol] || row.description || '—';
          const nameVal = row.name || '—';
          const clientVal = row.client || 'Global';
          const statusVal = row.status || (row.is_trusted ? 'Approved' : 'Active');

          const statusClass = statusVal === 'Approved' || statusVal === 'Active' ? 'td-badge-approved' :
                              statusVal === 'Requires Review' || statusVal === 'Conflict' ? 'td-badge-conflict' : 'td-badge-pending';

          tr.innerHTML = `
            <td class="td-code">${codeVal}</td>
            <td><strong>${descVal}</strong></td>
            <td>${nameVal}</td>
            <td><span class="td-badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc;">${clientVal}</span></td>
            <td><span class="td-badge ${statusClass}">${statusVal}</span></td>
            <td style="text-align: right;">
              <div class="td-actions" style="justify-content: flex-end;">
                <button type="button" class="btn-table-action btn-table-edit" data-id="${row.id || codeVal}">Edit</button>
                <button type="button" class="btn-table-action btn-table-delete" data-id="${row.id || codeVal}">Delete</button>
              </div>
            </td>
          `;

          // Edit Handler
          tr.querySelector('.btn-table-edit').addEventListener('click', () => {
            openEditModal(currentCategory, row);
          });

          // Delete Handler
          tr.querySelector('.btn-table-delete').addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${schema.label} code "${codeVal}" from Turso Cloud DB?`)) {
              await root.LearningMemory.reject(currentCategory, row.id || codeVal);
              showToast(`Deleted code ${codeVal} from ${schema.label}`, '🗑️');
              refreshAll();
            }
          });

          el.adminTableBody.appendChild(tr);
        });
      }
    }

    // Update count label
    if (el.tableRecordCountLabel) {
      el.tableRecordCountLabel.textContent = `Showing ${filtered.length > 0 ? startIdx + 1 : 0}–${Math.min(startIdx + PAGE_SIZE, filtered.length)} of ${filtered.length} records (Page ${currentPage} of ${totalPages})`;
    }

    // Render Pagination Controls
    if (el.tablePaginationControls) {
      el.tablePaginationControls.innerHTML = '';
      if (totalPages > 1) {
        for (let p = 1; p <= totalPages; p++) {
          if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
            btn.textContent = p;
            btn.addEventListener('click', () => {
              currentPage = p;
              renderActiveTable();
            });
            el.tablePaginationControls.appendChild(btn);
          }
        }
      }
    }
  }

  // Render Audit Log Stream
  function renderAuditLog() {
    if (!el.auditTimelineContainer || !root.LearningMemory) return;
    const audits = root.LearningMemory.auditLog || [];
    const actionFilter = el.auditActionFilter ? el.auditActionFilter.value : 'All';
    const searchText = (el.auditSearchInput ? el.auditSearchInput.value : '').toLowerCase().trim();

    const filtered = audits.filter(a => {
      if (actionFilter !== 'All' && a.action !== actionFilter) return false;
      if (!searchText) return true;
      return (a.details || '').toLowerCase().includes(searchText) ||
             (a.category || '').toLowerCase().includes(searchText) ||
             (a.code || '').toLowerCase().includes(searchText) ||
             (a.client || '').toLowerCase().includes(searchText);
    });

    el.auditTimelineContainer.innerHTML = '';
    if (filtered.length === 0) {
      el.auditTimelineContainer.innerHTML = `
        <div class="console-placeholder">
          No audit log events recorded yet. Every database change, rule addition, and conflict resolution will appear here automatically.
        </div>
      `;
      return;
    }

    filtered.forEach(log => {
      const card = document.createElement('div');
      card.className = `audit-card action-${(log.action || '').toLowerCase()}`;
      card.innerHTML = `
        <div class="audit-top-row">
          <span class="audit-action-badge">${log.action || 'EVENT'}</span>
          <span class="audit-time">${log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}</span>
        </div>
        <div class="audit-desc">${log.details || `Modified ${log.category} code ${log.code}`}</div>
        <div class="audit-meta-row">
          <span>Category: <strong>${log.category || 'Global'}</strong></span>
          <span>Code: <strong>${log.code || '—'}</strong></span>
          <span>Client: <strong>${log.client || 'Global'}</strong></span>
          <span>Source: <strong>${log.source || 'SYSTEM'}</strong></span>
        </div>
      `;
      el.auditTimelineContainer.appendChild(card);
    });
  }

  // Render Conflict Review Center
  function renderConflicts() {
    if (!el.conflictsListContainer || !root.LearningMemory) return;
    const conflicts = root.LearningMemory.conflicts || [];
    el.conflictsListContainer.innerHTML = '';

    if (conflicts.length === 0) {
      el.conflictsListContainer.innerHTML = `
        <div class="console-placeholder" style="color: #34d399;">
          🛡️ No active conflicts! All broker descriptions align cleanly with your Touchstone UNICEDE baseline.
        </div>
      `;
      return;
    }

    conflicts.forEach(c => {
      const card = document.createElement('div');
      card.className = 'conflict-review-card';
      card.innerHTML = `
        <div class="conflict-card-header">
          <div class="conflict-card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
            <span>${c.category.toUpperCase()} Code Conflict: ${c.code}</span>
          </div>
          <span class="td-badge td-badge-conflict">${c.status || 'Requires Review'}</span>
        </div>

        <div class="conflict-diff-grid">
          <div>
            <div class="diff-box-title">🛡️ Existing Baseline Description</div>
            <div class="diff-box-content">${c.existing_description}</div>
          </div>
          <div>
            <div class="diff-box-title">⚡ Proposed New Description (From: ${c.source})</div>
            <div class="diff-box-content new-proposal">${c.new_description}</div>
          </div>
        </div>

        <div class="conflict-card-actions">
          <button type="button" class="admin-btn admin-btn-outline btn-keep-existing">🛡️ Keep Existing Baseline</button>
          <button type="button" class="admin-btn admin-btn-accent btn-save-client">🏢 Save as Client Rule (${c.client || 'Client'})</button>
          <button type="button" class="admin-btn admin-btn-danger btn-overwrite-global">⚡ Authorize Global Override</button>
        </div>
      `;

      card.querySelector('.btn-keep-existing').addEventListener('click', () => {
        root.LearningMemory.resolveConflict(c.id, 'KEEP_EXISTING', 'User selected to preserve existing trusted baseline.');
        showToast(`Preserved baseline for code ${c.code}`, '🛡️');
        refreshAll();
      });

      card.querySelector('.btn-save-client').addEventListener('click', () => {
        const clientName = prompt('Enter Client Name to isolate this rule to:', c.client || 'Client Corp');
        if (clientName) {
          c.client = clientName;
          root.LearningMemory.resolveConflict(c.id, 'SAVE_AS_CLIENT_SPECIFIC', `Isolated to ${clientName}`);
          showToast(`Saved as client-specific rule for ${clientName}`, '🏢');
          refreshAll();
        }
      });

      card.querySelector('.btn-overwrite-global').addEventListener('click', () => {
        if (confirm(`Authorize global override for code ${c.code}? This updates the baseline for all users.`)) {
          root.LearningMemory.resolveConflict(c.id, 'OVERWRITE_GLOBAL', 'Authorized global override.');
          showToast(`Global override applied to code ${c.code}`, '⚡');
          refreshAll();
        }
      });

      el.conflictsListContainer.appendChild(card);
    });
  }

  // Render Client Taxonomy Rules
  function renderClients() {
    if (!el.clientsGridContainer || !root.LearningMemory) return;
    const clients = new Set(['Global']);
    Object.values(root.LearningMemory.tables).forEach(rows => {
      rows.forEach(r => {
        if (r.client) clients.add(r.client);
      });
    });

    el.clientsGridContainer.innerHTML = '';
    clients.forEach(clientName => {
      let clientCodeCount = 0;
      Object.values(root.LearningMemory.tables).forEach(rows => {
        rows.forEach(r => {
          if ((r.client || 'Global').toLowerCase() === clientName.toLowerCase()) {
            clientCodeCount++;
          }
        });
      });

      const card = document.createElement('div');
      card.className = 'admin-kpi-card';
      card.innerHTML = `
        <div class="kpi-icon-wrap ${clientName === 'Global' ? 'kpi-blue' : 'kpi-purple'}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        </div>
        <div class="kpi-data">
          <span class="kpi-num">${clientCodeCount}</span>
          <span class="kpi-lbl">${clientName} Scope</span>
        </div>
        <div class="kpi-sub">${clientName === 'Global' ? 'Standard Catastrophe Baseline' : 'Isolated Client Custom Taxonomies'}</div>
      `;
      el.clientsGridContainer.appendChild(card);
    });
  }

  // Modal Dialog Open/Close
  function openEditModal(category, row = null) {
    if (!el.editModal) return;
    const schemas = getSchemas();
    const schema = schemas[category] || schemas.occupancy;

    el.modalIsEdit.value = row ? 'true' : 'false';
    el.modalRecordId.value = row ? (row.id || '') : '';
    el.modalCategorySelect.value = category;
    el.editModalTitle.textContent = row ? `Edit ${schema.label} Code ${row[schema.codeCol] || row.code}` : `Add New ${schema.label} Code`;

    el.modalCodeInput.value = row ? (row[schema.codeCol] || row.code || '') : '';
    el.modalDescInput.value = row ? (row[schema.descCol] || row.description || '') : '';
    el.modalNameInput.value = row ? (row.name || '') : '';
    el.modalClientInput.value = row ? (row.client || 'Global') : 'Global';
    el.modalKeywordsInput.value = row ? (Array.isArray(row.keywords) ? row.keywords.join(', ') : (row.keywords || '')) : '';

    el.editModal.style.display = 'flex';
  }

  function closeEditModal() {
    if (el.editModal) el.editModal.style.display = 'none';
  }

  // Refresh All Tabs & Views
  function refreshAll() {
    refreshKPIs();
    renderSidebarCategories();
    renderActiveTable();
    renderAuditLog();
    renderConflicts();
    renderClients();
  }

  // Bind Event Listeners
  function bindEvents() {
    // Tabs Navigation
    el.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.tabButtons.forEach(b => b.classList.remove('active'));
        el.tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(`pane-${targetTab}`);
        if (targetPane) targetPane.classList.add('active');

        if (targetTab === 'audit') renderAuditLog();
        if (targetTab === 'conflicts') renderConflicts();
        if (targetTab === 'clients') renderClients();
      });
    });

    // Sidebar Category Filter
    if (el.categoryFilterInput) {
      el.categoryFilterInput.addEventListener('input', renderSidebarCategories);
    }

    // Sidebar Category Group Pills Filter
    const groupPills = document.querySelectorAll('.group-pill');
    groupPills.forEach(pill => {
      pill.addEventListener('click', () => {
        groupPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedGroupFilter = pill.getAttribute('data-group') || 'all';
        renderSidebarCategories();
      });
    });

    // Records Search
    if (el.recordsSearchInput) {
      el.recordsSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        renderActiveTable();
      });
    }

    // Client Filter
    if (el.clientFilterSelect) {
      el.clientFilterSelect.addEventListener('change', (e) => {
        selectedClient = e.target.value;
        currentPage = 1;
        renderActiveTable();
      });
    }

    // Live Sync Button
    if (el.btnSync) {
      el.btnSync.addEventListener('click', async () => {
        el.btnSync.disabled = true;
        el.btnSync.innerHTML = `<span>⏳ Syncing...</span>`;
        try {
          const res = await root.LearningMemory.syncFromTurso();
          showToast(`Live Sync complete! Loaded ${res.totalRows} records.`, '☁️');
        } catch (e) {
          showToast(`Sync failed: ${e.message}`, '❌');
        } finally {
          el.btnSync.disabled = false;
          el.btnSync.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-6.73"/></svg> <span>Live Sync</span>`;
          refreshAll();
        }
      });
    }

    // Export DB Button
    if (el.btnExport) {
      el.btnExport.addEventListener('click', () => {
        const data = root.LearningMemory.exportDatabase();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CleanExcel_Turso_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Database backup exported as JSON file.', '💾');
      });
    }

    // Add Code Modal Openers
    if (el.btnAddCode) {
      el.btnAddCode.addEventListener('click', () => openEditModal(currentCategory));
    }
    if (el.btnAddRowToTable) {
      el.btnAddRowToTable.addEventListener('click', () => openEditModal(currentCategory));
    }

    // Modal Close
    if (el.btnCloseEditModal) el.btnCloseEditModal.addEventListener('click', closeEditModal);
    if (el.btnCancelEditModal) el.btnCancelEditModal.addEventListener('click', closeEditModal);

    // Modal Form Submit (Add / Edit)
    if (el.recordForm) {
      el.recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cat = el.modalCategorySelect.value;
        const code = el.modalCodeInput.value.trim();
        const desc = el.modalDescInput.value.trim();
        const name = el.modalNameInput.value.trim();
        const client = el.modalClientInput.value.trim() || 'Global';
        const keywords = el.modalKeywordsInput.value.trim();
        const isEdit = el.modalIsEdit.value === 'true';
        const recordId = el.modalRecordId.value;

        if (isEdit) {
          root.LearningMemory.edit(cat, recordId, {
            description: desc,
            name: name,
            client: client,
            keywords: keywords
          });
          showToast(`Updated code ${code} in ${cat} table`, '✏️');
        } else {
          const res = await root.LearningMemory.learn({
            category: cat,
            code: code,
            description: desc,
            name: name,
            client: client,
            keywords: keywords,
            source: 'ADMIN_CONSOLE',
            autoApprove: true
          });

          if (res.status === 'CONFLICT_DETECTED') {
            showToast(`Conflict detected! Flagged for review in Conflicts tab.`, '⚠️');
          } else {
            showToast(`Successfully added code ${code} to ${cat} table!`, '✨');
          }
        }

        closeEditModal();
        refreshAll();
      });
    }

    // Direct SQL Console Runner
    if (el.btnRunSql && el.sqlConsoleInput) {
      const executeSql = async () => {
        const sql = el.sqlConsoleInput.value.trim();
        if (!sql) return;

        const startTime = performance.now();
        el.sqlExecTime.textContent = 'Executing...';
        el.consoleResultsBox.innerHTML = '<div class="console-placeholder">Executing query against Turso Cloud...</div>';

        try {
          const res = await fetch('https://cleanexcel-codes-shadab1010.aws-ap-south-1.turso.io/v2/pipeline', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MDY1NDMsImlkIjoiMDFhMGRjOGItNjYwMS03M2UxLWI5N2EtZmE4ZGE2NTJlYjBlIiwia2lkIjoiV0xuSmVfQnoyMGhGODVOVm5RblFFRklkUHk2bHgtOW8wUHNOVWN5TVA5OCIsInJpZCI6IjFkODZkNzlhLWJlMGUtNGFhZC05YzAwLWI3MDdmZDRlMjk2ZiJ9.OBt_UwCmXLWYEHWx1EjKW_wJtClhT09FpB8YgqxmBoiKH_EpB0OAtDrM934IlLwWakXG7Cq4zxLgqm3hcIYeCg`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requests: [
                { type: 'execute', stmt: { sql } },
                { type: 'close' }
              ]
            })
          });

          const data = await res.json();
          const elapsed = (performance.now() - startTime).toFixed(1);
          el.sqlExecTime.textContent = `Completed in ${elapsed} ms`;

          if (data.results && data.results[0] && data.results[0].response) {
            const result = data.results[0].response.result;
            const cols = result.cols.map(c => c.name);
            const rows = result.rows.map(r => r.map(cell => cell.value));

            if (rows.length === 0) {
              el.consoleResultsBox.innerHTML = `<div style="color: #34d399;">✓ Query executed successfully. (0 rows returned)</div>`;
            } else {
              let html = `<table class="admin-data-table"><thead><tr>`;
              cols.forEach(c => html += `<th>${c}</th>`);
              html += `</tr></thead><tbody>`;
              rows.forEach(r => {
                html += `<tr>`;
                r.forEach(v => html += `<td>${v !== null && v !== undefined ? v : '<span style="color:#64748b;">NULL</span>'}</td>`);
                html += `</tr>`;
              });
              html += `</tbody></table>`;
              el.consoleResultsBox.innerHTML = html;
            }
          } else if (data.results && data.results[0] && data.results[0].error) {
            el.consoleResultsBox.innerHTML = `<div style="color: #f87171;">❌ SQL Error: ${data.results[0].error.message}</div>`;
          }
        } catch (err) {
          el.consoleResultsBox.innerHTML = `<div style="color: #f87171;">❌ Network/Query Error: ${err.message}</div>`;
        }
      };

      el.btnRunSql.addEventListener('click', executeSql);

      // Keyboard shortcut ⌘+Enter / Ctrl+Enter
      el.sqlConsoleInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          executeSql();
        }
      });
    }

    // Preset SQL Buttons
    if (el.presetSqlButtons) {
      el.presetSqlButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const sql = btn.getAttribute('data-sql');
          if (el.sqlConsoleInput && sql) {
            el.sqlConsoleInput.value = sql;
            if (el.btnRunSql) el.btnRunSql.click();
          }
        });
      });
    }

    // Audit Log Filters
    if (el.auditActionFilter) el.auditActionFilter.addEventListener('change', renderAuditLog);
    if (el.auditSearchInput) el.auditSearchInput.addEventListener('input', renderAuditLog);
    if (el.btnClearAuditLogs) {
      el.btnClearAuditLogs.addEventListener('click', () => {
        if (root.LearningMemory) {
          root.LearningMemory.auditLog = [];
          root.LearningMemory.saveLocal();
          renderAuditLog();
          refreshKPIs();
          showToast('Local audit log cache cleared.', '🧹');
        }
      });
    }
  }

  // Initialize Admin App
  async function init() {
    initElements();
    bindEvents();

    if (root.LearningMemory) {
      refreshAll();
      try {
        await root.LearningMemory.syncFromTurso();
      } catch (err) {
        console.warn('[Admin] Sync warning:', err);
      }
      refreshAll();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(typeof window !== 'undefined' ? window : global);
