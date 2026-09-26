/**
 * CleanExcel Studio - Learning Memory System UI Dashboard Component
 * 
 * Interactive manager for:
 * - Category-isolated reference tables
 * - Multi-client learning & conflict reviews
 * - Approval/Rejection workflow
 * - Full audit provenance
 */

(function (root) {
  'use strict';

  const LearningMemoryUI = {
    state: {
      categoryFilter: 'all',
      statusFilter: 'all',
      clientFilter: 'All',
      searchQuery: '',
      activeTab: 'records', // 'records' | 'conflicts' | 'audit'
      isOpen: false
    },

    init() {
      this.bindTriggers();
      this.subscribeToStore();
      this.updateBadge();
    },

    bindTriggers() {
      const btnOpen = document.getElementById('btn-open-learning-memory');
      if (btnOpen) {
        btnOpen.addEventListener('click', () => this.open());
      }
    },

    subscribeToStore() {
      if (root.LearningMemory) {
        root.LearningMemory.subscribe(() => {
          this.updateBadge();
          if (this.state.isOpen) this.render();
        });
      }
    },

    updateBadge() {
      const badge = document.getElementById('learning-badge-count');
      if (!badge || !root.LearningMemory) return;

      const stats = root.LearningMemory.getStats();
      const attentionCount = stats.totalConflicts + stats.totalPending;

      if (attentionCount > 0) {
        badge.textContent = attentionCount;
        badge.style.display = 'inline-flex';
        badge.className = stats.totalConflicts > 0 ? 'learning-badge-alert' : 'learning-badge-pending';
      } else {
        badge.textContent = stats.totalLearned;
        badge.style.display = 'inline-flex';
        badge.className = 'learning-badge-neutral';
      }
    },

    open() {
      this.state.isOpen = true;
      let modal = document.getElementById('modal-learning-memory');
      if (!modal) {
        this.createModalDOM();
        modal = document.getElementById('modal-learning-memory');
      }
      modal.classList.add('active');
      modal.style.display = 'flex';
      this.render();
    },

    close() {
      this.state.isOpen = false;
      const modal = document.getElementById('modal-learning-memory');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    },

    createModalDOM() {
      const existing = document.getElementById('modal-learning-memory');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'modal-learning-memory';
      modal.className = 'studio-modal-overlay learning-memory-modal';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="learning-memory-dialog" role="dialog" aria-labelledby="learning-modal-title">
          <!-- Modal Header -->
          <div class="learning-modal-header">
            <div class="learning-header-title-area">
              <div class="learning-header-icon-wrap">🧠</div>
              <div>
                <h3 id="learning-modal-title" class="learning-header-title">Persistent Learning Memory System</h3>
                <p class="learning-header-sub">Strict Category-Isolated Reference Tables &bull; Multi-Client Learning &bull; Conflict Protection &bull; Turso Cloud Sync</p>
              </div>
            </div>
            <div class="learning-header-actions">
              <button type="button" id="btn-learning-sync-turso" class="btn btn-sm btn-outline-cyan" title="Sync all tables with Turso Cloud Database">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>Sync with Turso</span>
              </button>
              <button type="button" id="btn-learning-add-code" class="btn btn-sm btn-primary-gradient" title="Manually learn and store a new reference code">
                <span>➕ Learn Reference Code</span>
              </button>
              <button type="button" id="btn-learning-modal-close" class="learning-btn-close" title="Close modal">&times;</button>
            </div>
          </div>

          <!-- KPI Cards Strip -->
          <div class="learning-kpi-strip" id="learning-kpi-strip">
            <!-- Rendered dynamically -->
          </div>

          <!-- Conflict Alert Banner (Visible when conflicts exist) -->
          <div id="learning-conflict-banner" class="learning-conflict-banner" style="display: none;">
            <!-- Rendered dynamically -->
          </div>

          <!-- Navigation Tabs -->
          <div class="learning-nav-tabs">
            <button type="button" class="learning-nav-tab active" data-tab="records" id="tab-learn-records">
              <span>📚 Reference Records</span>
              <span class="learning-tab-count" id="count-tab-records">0</span>
            </button>
            <button type="button" class="learning-nav-tab" data-tab="conflicts" id="tab-learn-conflicts">
              <span>⚠️ Conflicts &amp; Reviews</span>
              <span class="learning-tab-count learning-count-alert" id="count-tab-conflicts">0</span>
            </button>
            <button type="button" class="learning-nav-tab" data-tab="audit" id="tab-learn-audit">
              <span>📋 Audit &amp; Provenance Log</span>
              <span class="learning-tab-count" id="count-tab-audit">0</span>
            </button>
          </div>

          <!-- Filters Toolbar -->
          <div class="learning-toolbar" id="learning-toolbar">
            <div class="learning-filter-group">
              <label for="learning-filter-cat">Category:</label>
              <select id="learning-filter-cat" class="learning-select">
                <option value="all">All Categories</option>
                <option value="occupancy">Occupancy (55)</option>
                <option value="construction">Construction (224)</option>
                <option value="roof_geometry">Roof Geometry (11)</option>
                <option value="roof_pitch">Roof Pitch (4)</option>
                <option value="roof_covering">Roof Covering (13)</option>
                <option value="roof_deck">Roof Deck (9)</option>
                <option value="roof_covering_attachment">Roof Covering Attachment (5)</option>
                <option value="roof_deck_attachment">Roof Deck Attachment (8)</option>
                <option value="roof_anchorage">Roof Anchorage (8)</option>
                <option value="wall_type">Wall Type (10)</option>
                <option value="wall_siding">Wall Siding (9)</option>
                <option value="wall_glass_type">Wall Glass Type (6)</option>
                <option value="wall_window_protection">Window Protection (4)</option>
                <option value="foundation_type">Foundation Type (13)</option>
                <option value="foundation_connection">Foundation Connection (7)</option>
                <option value="short_column">Short Column (3)</option>
                <option value="soft_story">Soft Story (3)</option>
                <option value="building_shape">Building Shape (9)</option>
                <option value="building_condition">Building Condition (4)</option>
                <option value="other_reference_data">Other Reference Data</option>
              </select>
            </div>

            <div class="learning-filter-group">
              <label for="learning-filter-status">Status:</label>
              <select id="learning-filter-status" class="learning-select">
                <option value="all">All Statuses</option>
                <option value="Approved">Approved (Trusted)</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div class="learning-filter-group">
              <label for="learning-filter-client">Client Scope:</label>
              <select id="learning-filter-client" class="learning-select">
                <option value="All">All Clients (Global &amp; Specific)</option>
                <option value="Global">Global Reference Only</option>
              </select>
            </div>

            <div class="learning-search-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="learning-search-input" placeholder="Search code, description, or keyword..." />
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="learning-content-scroll" id="learning-content-scroll">
            <!-- Dynamic Content (Table, Conflicts, or Audit) -->
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
    },

    bindModalEvents() {
      const modal = document.getElementById('modal-learning-memory');
      const btnClose = document.getElementById('btn-learning-modal-close');
      const btnAdd = document.getElementById('btn-learning-add-code');
      const btnSync = document.getElementById('btn-learning-sync-turso');

      if (btnClose) btnClose.addEventListener('click', () => this.close());

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });

      if (btnAdd) {
        btnAdd.addEventListener('click', () => this.openLearnNewModal());
      }

      if (btnSync) {
        btnSync.addEventListener('click', async () => {
          btnSync.disabled = true;
          btnSync.innerHTML = '<span>⏳ Syncing...</span>';
          if (root.LearningMemory) {
            await root.LearningMemory.syncFromTurso();
          }
          btnSync.disabled = false;
          btnSync.innerHTML = '<span>✓ Synced with Turso</span>';
          setTimeout(() => {
            btnSync.innerHTML = `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>Sync with Turso</span>
            `;
          }, 2500);
          this.render();
        });
      }

      // Filter events
      const catSelect = document.getElementById('learning-filter-cat');
      const statusSelect = document.getElementById('learning-filter-status');
      const clientSelect = document.getElementById('learning-filter-client');
      const searchInput = document.getElementById('learning-search-input');

      if (catSelect) catSelect.addEventListener('change', (e) => {
        this.state.categoryFilter = e.target.value;
        this.renderContent();
      });

      if (statusSelect) statusSelect.addEventListener('change', (e) => {
        this.state.statusFilter = e.target.value;
        this.renderContent();
      });

      if (clientSelect) clientSelect.addEventListener('change', (e) => {
        this.state.clientFilter = e.target.value;
        this.renderContent();
      });

      if (searchInput) searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.renderContent();
      });

      // Tabs switching
      document.querySelectorAll('.learning-nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          document.querySelectorAll('.learning-nav-tab').forEach(t => t.classList.remove('active'));
          const btn = e.currentTarget;
          btn.classList.add('active');
          this.state.activeTab = btn.dataset.tab;
          this.renderContent();
        });
      });
    },

    render() {
      this.renderKPIs();
      this.renderConflictsBanner();
      this.updateClientFilterOptions();
      this.renderContent();
    },

    renderKPIs() {
      const container = document.getElementById('learning-kpi-strip');
      if (!container || !root.LearningMemory) return;

      const stats = root.LearningMemory.getStats();

      document.getElementById('count-tab-records').textContent = stats.totalLearned;
      document.getElementById('count-tab-conflicts').textContent = stats.totalConflicts;
      document.getElementById('count-tab-audit').textContent = stats.totalAuditEntries;

      container.innerHTML = `
        <div class="learning-kpi-card">
          <div class="learning-kpi-val">${stats.totalLearned}</div>
          <div class="learning-kpi-lbl">Total Reference Codes</div>
        </div>
        <div class="learning-kpi-card">
          <div class="learning-kpi-val learning-kpi-success">${stats.totalApproved}</div>
          <div class="learning-kpi-lbl">Approved &amp; Trusted</div>
        </div>
        <div class="learning-kpi-card">
          <div class="learning-kpi-val learning-kpi-pending">${stats.totalPending}</div>
          <div class="learning-kpi-lbl">Pending Review</div>
        </div>
        <div class="learning-kpi-card ${stats.totalConflicts > 0 ? 'learning-kpi-card-alert' : ''}">
          <div class="learning-kpi-val ${stats.totalConflicts > 0 ? 'learning-kpi-alert' : ''}">${stats.totalConflicts}</div>
          <div class="learning-kpi-lbl">Conflicts Requiring Action</div>
        </div>
        <div class="learning-kpi-card">
          <div class="learning-kpi-val learning-kpi-info">${stats.activeCategories}</div>
          <div class="learning-kpi-lbl">Isolated Category Tables</div>
        </div>
      `;
    },

    renderConflictsBanner() {
      const banner = document.getElementById('learning-conflict-banner');
      if (!banner || !root.LearningMemory) return;

      const conflicts = root.LearningMemory.conflicts;
      if (conflicts.length === 0) {
        banner.style.display = 'none';
        return;
      }

      banner.style.display = 'block';
      banner.innerHTML = `
        <div class="learning-banner-title">
          <span>⚠️ <strong>${conflicts.length} Conflict(s) Detected</strong>: Incoming data differs from existing trusted codes without silent overwrites.</span>
          <button type="button" class="btn btn-xs btn-outline-amber" id="btn-view-all-conflicts">Review All Conflicts</button>
        </div>
      `;

      const btnReview = banner.querySelector('#btn-view-all-conflicts');
      if (btnReview) {
        btnReview.addEventListener('click', () => {
          document.querySelectorAll('.learning-nav-tab').forEach(t => t.classList.remove('active'));
          const confTab = document.getElementById('tab-learn-conflicts');
          if (confTab) confTab.classList.add('active');
          this.state.activeTab = 'conflicts';
          this.renderContent();
        });
      }
    },

    updateClientFilterOptions() {
      const select = document.getElementById('learning-filter-client');
      if (!select || !root.LearningMemory) return;

      const clients = new Set(['Global']);
      Object.values(root.LearningMemory.tables).forEach(rows => {
        if (Array.isArray(rows)) {
          rows.forEach(r => {
            if (r.client && r.client.trim()) clients.add(r.client.trim());
          });
        }
      });

      const currentVal = this.state.clientFilter;
      select.innerHTML = `
        <option value="All" ${currentVal === 'All' ? 'selected' : ''}>All Clients (Global &amp; Specific)</option>
        ${Array.from(clients).map(c => `<option value="${c}" ${currentVal === c ? 'selected' : ''}>${c === 'Global' ? '🌐 Global Reference' : '🏢 ' + c}</option>`).join('')}
      `;
    },

    renderContent() {
      const container = document.getElementById('learning-content-scroll');
      if (!container || !root.LearningMemory) return;

      const tab = this.state.activeTab;

      if (tab === 'conflicts') {
        this.renderConflictsTab(container);
      } else if (tab === 'audit') {
        this.renderAuditTab(container);
      } else {
        this.renderRecordsTab(container);
      }
    },

    renderRecordsTab(container) {
      const catFilter = this.state.categoryFilter;
      const statusFilter = this.state.statusFilter;
      const clientFilter = this.state.clientFilter;
      const q = this.state.searchQuery.toLowerCase().trim();

      let records = [];

      // Gather records from selected categories
      const targetCats = catFilter === 'all' 
        ? Object.keys(root.CATEGORY_SCHEMAS) 
        : [catFilter];

      targetCats.forEach(catKey => {
        const schema = root.CATEGORY_SCHEMAS[catKey];
        if (!schema) return;
        const rows = root.LearningMemory.tables[catKey] || [];
        rows.forEach(r => {
          records.push({
            ...r,
            _catKey: catKey,
            _catLabel: schema.label,
            _code: r[schema.codeCol] || '',
            _desc: r[schema.descCol] || ''
          });
        });
      });

      // Apply Filters
      records = records.filter(r => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (clientFilter !== 'All' && (r.client || 'Global').toLowerCase() !== clientFilter.toLowerCase()) return false;
        if (q) {
          const match = r._code.toLowerCase().includes(q) || 
                        r._desc.toLowerCase().includes(q) || 
                        (r.name || '').toLowerCase().includes(q) || 
                        (r.keywords || '').toLowerCase().includes(q) ||
                        (r.client || '').toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

      if (records.length === 0) {
        container.innerHTML = `
          <div class="learning-empty-state">
            <span class="learning-empty-icon">🔍</span>
            <h4>No Reference Codes Found</h4>
            <p>Try clearing your search query or changing category/status filters.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <table class="learning-data-table">
          <thead>
            <tr>
              <th style="width: 140px;">Category</th>
              <th style="width: 90px;">Code</th>
              <th>Description</th>
              <th style="width: 110px;">Client Scope</th>
              <th style="width: 120px;">Source</th>
              <th style="width: 100px;">Learned Date</th>
              <th style="width: 90px;">Confidence</th>
              <th style="width: 100px;">Status</th>
              <th style="width: 140px; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => {
              const statusPill = r.status === 'Approved' || r.is_trusted === 1
                ? `<span class="learning-pill learning-pill-approved">✓ Approved</span>`
                : r.status === 'Rejected'
                ? `<span class="learning-pill learning-pill-rejected">✕ Rejected</span>`
                : `<span class="learning-pill learning-pill-pending">⏳ Review</span>`;

              const clientPill = (r.client === 'Global' || !r.client)
                ? `<span class="learning-client-global">🌐 Global</span>`
                : `<span class="learning-client-tag">🏢 ${r.client}</span>`;

              return `
                <tr data-cat="${r._catKey}" data-id="${r.id}">
                  <td><span class="learning-cat-badge">${r._catLabel}</span></td>
                  <td><span class="learning-code-chip">${r._code}</span></td>
                  <td>
                    <div class="learning-desc-main">${r._desc}</div>
                    ${r.keywords ? `<div class="learning-kw-sub">Synonyms: ${r.keywords}</div>` : ''}
                  </td>
                  <td>${clientPill}</td>
                  <td style="font-size: 11px; color: var(--text-muted);">${r.source || 'Touchstone Baseline'}</td>
                  <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${(r.learned_at || '').slice(0, 10)}</td>
                  <td><span class="learning-confidence-badge">${r.confidence || 'High'}</span></td>
                  <td>${statusPill}</td>
                  <td style="text-align: right;">
                    <div class="learning-action-group">
                      ${r.status !== 'Approved' ? `<button type="button" class="btn-learn-act btn-learn-approve" title="Approve reference code" data-cat="${r._catKey}" data-id="${r.id}">✓</button>` : ''}
                      ${r.status !== 'Rejected' ? `<button type="button" class="btn-learn-act btn-learn-reject" title="Reject reference code" data-cat="${r._catKey}" data-id="${r.id}">✕</button>` : ''}
                      <button type="button" class="btn-learn-act btn-learn-edit" title="Edit description/keywords" data-cat="${r._catKey}" data-id="${r.id}">✏️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      // Bind Row Actions
      container.querySelectorAll('.btn-learn-approve').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const { cat, id } = e.currentTarget.dataset;
          root.LearningMemory.approve(cat, id);
        });
      });

      container.querySelectorAll('.btn-learn-reject').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const { cat, id } = e.currentTarget.dataset;
          root.LearningMemory.reject(cat, id);
        });
      });

      container.querySelectorAll('.btn-learn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const { cat, id } = e.currentTarget.dataset;
          this.openEditModal(cat, id);
        });
      });
    },

    renderConflictsTab(container) {
      const conflicts = root.LearningMemory.conflicts;

      if (conflicts.length === 0) {
        container.innerHTML = `
          <div class="learning-empty-state">
            <span class="learning-empty-icon">🛡️</span>
            <h4>No Active Conflicts</h4>
            <p>All reference codes match trusted definitions with zero detected conflicts.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="learning-conflicts-list">
          ${conflicts.map(conf => `
            <div class="learning-conflict-card" data-cid="${conf.id}">
              <div class="learning-conflict-header">
                <span class="learning-cat-badge">${conf.categoryLabel || conf.category}</span>
                <span class="learning-conflict-code">Code: ${conf.code}</span>
                <span class="learning-conflict-badge">⚠️ Action Required</span>
                <span style="font-size: 11px; color: var(--text-muted); margin-left: auto;">Detected: ${conf.createdAt ? conf.createdAt.slice(0, 16).replace('T', ' ') : ''}</span>
              </div>
              
              <div class="learning-conflict-body">
                <div class="learning-conflict-side existing-side">
                  <div class="learning-side-title">🔒 Current Trusted Definition:</div>
                  <div class="learning-side-desc">${conf.existingDescription}</div>
                  <div class="learning-side-meta">Scope: <strong>Global Reference</strong></div>
                </div>

                <div class="learning-conflict-divider">VS</div>

                <div class="learning-conflict-side new-side">
                  <div class="learning-side-title">⚡ Newly Learned Input:</div>
                  <div class="learning-side-desc">${conf.newDescription}</div>
                  <div class="learning-side-meta">Source: <strong>${conf.source || 'Client Import'}</strong> &bull; Client: <strong>${conf.client || 'Global'}</strong></div>
                </div>
              </div>

              <div class="learning-conflict-actions">
                <button type="button" class="btn btn-sm btn-outline-cyan btn-conf-keep" data-cid="${conf.id}">
                  🛡️ Keep Existing (Reject New)
                </button>
                <button type="button" class="btn btn-sm btn-outline-purple btn-conf-client" data-cid="${conf.id}">
                  🏢 Save as Client-Specific for "${conf.client || 'Client'}"
                </button>
                <button type="button" class="btn btn-sm btn-primary-gradient btn-conf-override" data-cid="${conf.id}">
                  ⚠️ Overwrite Global Definition
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.querySelectorAll('.btn-conf-keep').forEach(b => {
        b.addEventListener('click', (e) => {
          const cid = e.currentTarget.dataset.cid;
          root.LearningMemory.resolveConflict(cid, 'KEEP_EXISTING', 'User elected to keep existing trusted definition.');
        });
      });

      container.querySelectorAll('.btn-conf-client').forEach(b => {
        b.addEventListener('click', (e) => {
          const cid = e.currentTarget.dataset.cid;
          root.LearningMemory.resolveConflict(cid, 'SAVE_AS_CLIENT_SPECIFIC', 'Saved as client-specific reference rule.');
        });
      });

      container.querySelectorAll('.btn-conf-override').forEach(b => {
        b.addEventListener('click', (e) => {
          const cid = e.currentTarget.dataset.cid;
          if (confirm('Are you sure you want to overwrite the global trusted definition with this new description?')) {
            root.LearningMemory.resolveConflict(cid, 'OVERWRITE_GLOBAL', 'Authorized user approved global override.');
          }
        });
      });
    },

    renderAuditTab(container) {
      const logs = root.LearningMemory.auditLog;

      if (logs.length === 0) {
        container.innerHTML = `
          <div class="learning-empty-state">
            <span class="learning-empty-icon">📋</span>
            <h4>No Audit Log Entries</h4>
            <p>Learning operations, edits, and approvals will be tracked here.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <table class="learning-data-table">
          <thead>
            <tr>
              <th style="width: 140px;">Timestamp</th>
              <th style="width: 130px;">Action</th>
              <th style="width: 110px;">Category</th>
              <th style="width: 80px;">Code</th>
              <th>Details &amp; Values</th>
              <th style="width: 100px;">Client</th>
              <th style="width: 110px;">Source</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => {
              const actionBadge = l.action === 'APPROVED' ? `<span class="learning-pill learning-pill-approved">Approved</span>`
                : l.action === 'REJECTED' ? `<span class="learning-pill learning-pill-rejected">Rejected</span>`
                : l.action === 'CONFLICT_DETECTED' ? `<span class="learning-pill learning-pill-alert">Conflict</span>`
                : l.action === 'CONFLICT_RESOLVED' ? `<span class="learning-pill learning-pill-success">Resolved</span>`
                : `<span class="learning-pill learning-pill-pending">${l.action}</span>`;

              return `
                <tr>
                  <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${(l.timestamp || '').replace('T', ' ').slice(0, 19)}</td>
                  <td>${actionBadge}</td>
                  <td><span class="learning-cat-badge">${l.category}</span></td>
                  <td><span class="learning-code-chip">${l.code}</span></td>
                  <td style="font-size: 11.5px;">${l.details || ''}</td>
                  <td><span class="learning-client-tag">${l.client || 'Global'}</span></td>
                  <td style="font-size: 11px; color: var(--text-muted);">${l.source || 'User Action'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    },

    openLearnNewModal() {
      const modalHtml = `
        <div id="submodal-learn-code" class="studio-modal-overlay active" style="display: flex; z-index: 100010;">
          <div class="learning-form-dialog">
            <div class="learning-modal-header">
              <h4 class="learning-header-title">➕ Learn New Reference Code</h4>
              <button type="button" id="btn-close-learn-form" class="learning-btn-close">&times;</button>
            </div>
            <form id="form-learn-new-code" class="learning-form-body">
              <div class="learning-form-row">
                <label for="learn-cat-select">Target Dedicated Category *</label>
                <select id="learn-cat-select" class="learning-select" required>
                  <option value="occupancy">Occupancy</option>
                  <option value="construction">Construction</option>
                  <option value="roof_geometry">Roof Geometry</option>
                  <option value="roof_pitch">Roof Pitch</option>
                  <option value="roof_covering">Roof Covering</option>
                  <option value="roof_deck">Roof Deck</option>
                  <option value="roof_anchorage">Roof Anchorage</option>
                  <option value="wall_type">Wall Type</option>
                  <option value="wall_siding">Wall Siding</option>
                  <option value="foundation_type">Foundation Type</option>
                  <option value="foundation_connection">Foundation Connection</option>
                  <option value="short_column">Short Column</option>
                  <option value="soft_story">Soft Story</option>
                  <option value="building_shape">Building Shape</option>
                  <option value="other_reference_data">Other / Custom Reference Data</option>
                </select>
              </div>
              <div class="learning-form-grid-2">
                <div class="learning-form-row">
                  <label for="learn-code-input">Reference Code *</label>
                  <input type="text" id="learn-code-input" class="learning-input" placeholder="e.g. 110, 2, 4" required />
                </div>
                <div class="learning-form-row">
                  <label for="learn-client-input">Client Scope</label>
                  <input type="text" id="learn-client-input" class="learning-input" placeholder="Global or Client Name (e.g. Client A)" value="Global" />
                </div>
              </div>
              <div class="learning-form-row">
                <label for="learn-desc-input">Description *</label>
                <textarea id="learn-desc-input" class="learning-textarea" rows="3" placeholder="Full reference classification description..." required></textarea>
              </div>
              <div class="learning-form-row">
                <label for="learn-source-input">Source / Provenance</label>
                <input type="text" id="learn-source-input" class="learning-input" placeholder="e.g. Client SOV.xlsx, Broker Binder, Manual" value="Manual Correction" />
              </div>
              <div class="learning-form-actions">
                <button type="button" id="btn-cancel-learn" class="btn btn-sm btn-subtle">Cancel</button>
                <button type="submit" class="btn btn-sm btn-primary-gradient">🚀 Store in Dedicated Table</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.id = 'wrap-submodal';
      div.innerHTML = modalHtml;
      document.body.appendChild(div);

      const closeSubmodal = () => div.remove();
      div.querySelector('#btn-close-learn-form').addEventListener('click', closeSubmodal);
      div.querySelector('#btn-cancel-learn').addEventListener('click', closeSubmodal);

      div.querySelector('#form-learn-new-code').addEventListener('submit', async (e) => {
        e.preventDefault();
        const cat = div.querySelector('#learn-cat-select').value;
        const code = div.querySelector('#learn-code-input').value;
        const desc = div.querySelector('#learn-desc-input').value;
        const client = div.querySelector('#learn-client-input').value;
        const source = div.querySelector('#learn-source-input').value;

        const res = await root.LearningMemory.learn({
          category: cat,
          code,
          description: desc,
          client: client || 'Global',
          source: source || 'Manual Entry',
          autoApprove: true
        });

        alert(res.message);
        closeSubmodal();
      });
    },

    openEditModal(category, id) {
      const schema = root.CATEGORY_SCHEMAS[category];
      const rows = root.LearningMemory.tables[category] || [];
      const rec = rows.find(r => r.id === id);
      if (!rec || !schema) return;

      const codeVal = rec[schema.codeCol];
      const descVal = rec[schema.descCol];

      const modalHtml = `
        <div id="submodal-edit-code" class="studio-modal-overlay active" style="display: flex; z-index: 100010;">
          <div class="learning-form-dialog">
            <div class="learning-modal-header">
              <h4 class="learning-header-title">✏️ Edit ${schema.label} Code: ${codeVal}</h4>
              <button type="button" id="btn-close-edit-form" class="learning-btn-close">&times;</button>
            </div>
            <form id="form-edit-code" class="learning-form-body">
              <div class="learning-form-row">
                <label>Category</label>
                <input type="text" class="learning-input" value="${schema.label}" disabled />
              </div>
              <div class="learning-form-row">
                <label>Code</label>
                <input type="text" class="learning-input" value="${codeVal}" disabled />
              </div>
              <div class="learning-form-row">
                <label for="edit-desc-input">Description *</label>
                <textarea id="edit-desc-input" class="learning-textarea" rows="3" required>${descVal}</textarea>
              </div>
              <div class="learning-form-row">
                <label for="edit-kw-input">Search Synonyms &amp; Keywords</label>
                <input type="text" id="edit-kw-input" class="learning-input" value="${rec.keywords || ''}" placeholder="Comma separated keywords" />
              </div>
              <div class="learning-form-row">
                <label for="edit-client-input">Client Scope</label>
                <input type="text" id="edit-client-input" class="learning-input" value="${rec.client || 'Global'}" />
              </div>
              <div class="learning-form-actions">
                <button type="button" id="btn-cancel-edit" class="btn btn-sm btn-subtle">Cancel</button>
                <button type="submit" class="btn btn-sm btn-primary-gradient">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.id = 'wrap-edit-submodal';
      div.innerHTML = modalHtml;
      document.body.appendChild(div);

      const closeSubmodal = () => div.remove();
      div.querySelector('#btn-close-edit-form').addEventListener('click', closeSubmodal);
      div.querySelector('#btn-cancel-edit').addEventListener('click', closeSubmodal);

      div.querySelector('#form-edit-code').addEventListener('submit', (e) => {
        e.preventDefault();
        const newDesc = div.querySelector('#edit-desc-input').value;
        const newKw = div.querySelector('#edit-kw-input').value;
        const newClient = div.querySelector('#edit-client-input').value;

        root.LearningMemory.edit(category, id, {
          description: newDesc,
          keywords: newKw,
          client: newClient
        });

        closeSubmodal();
      });
    }
  };

  root.LearningMemoryUI = LearningMemoryUI;

  // Initialize on DOM load
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      LearningMemoryUI.init();
    });
  }

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
