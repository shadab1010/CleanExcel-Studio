/**
 * CleanExcel Studio - High-Performance React 18 Output Engine
 * Provides instant responsiveness, smart pagination, and memoized filtering
 * for datasets of any size (1,000 to 10,000+ rows) without browser freezing.
 */

(function () {
  'use strict';

  const e = React.createElement;
  const { useState, useMemo, useEffect, useCallback } = React;

  /**
   * Status badge styling resolver
   */
  function getStatusBadge(statusKey, message, defaultText) {
    let cls = 'assigned';
    let label = defaultText || 'Assigned';

    if (statusKey === 'match') {
      cls = 'match';
      label = defaultText || '✓ Confirmed';
    } else if (statusKey === 'upgraded') {
      cls = 'upgraded';
      label = defaultText || '✨ Resolved';
    } else if (statusKey === 'mismatch') {
      cls = 'mismatch';
      label = defaultText || '⚠️ Differs';
    } else if (statusKey === 'assigned') {
      cls = 'assigned';
      label = defaultText || '✨ Assigned';
    } else if (statusKey === 'cleaned') {
      cls = 'cleaned';
      label = defaultText || 'Cleaned';
    } else if (statusKey === 'unchanged') {
      cls = 'unchanged';
      label = defaultText || 'No Change';
    } else if (statusKey === 'empty') {
      cls = 'empty';
      label = defaultText || 'Blank';
    } else if (statusKey === 'missing_yb') {
      cls = 'mismatch';
      label = defaultText || '⚠️ Missing Year Built';
    } else if (statusKey === 'missing_roof') {
      cls = 'unchanged';
      label = defaultText || '⚠️ Missing Roof Year';
    }

    return e('span', {
      className: `status-badge ${cls}`,
      title: message || label
    }, label);
  }

  /**
   * Pagination Control Bar
   */
  function PaginationBar({ currentPage, totalPages, totalRows, startIndex, endIndex, pageSize, onPageChange, onPageSizeChange }) {
    const pageSizes = [50, 100, 250, 500, Infinity];

    return e('div', { className: 'react-pagination-bar' },
      // Left: Row Range Indicator
      e('div', { className: 'pagination-range-info' },
        e('span', { className: 'pagination-text' },
          totalRows === 0
            ? '0 rows'
            : `Showing ${(startIndex + 1).toLocaleString()}–${Math.min(endIndex, totalRows).toLocaleString()} of ${totalRows.toLocaleString()} rows`
        )
      ),

      // Middle: Page Navigation
      totalPages > 1 && e('div', { className: 'pagination-controls' },
        e('button', {
          className: 'pagination-btn',
          disabled: currentPage <= 1,
          onClick: () => onPageChange(1),
          title: 'First Page'
        }, '⏮'),
        e('button', {
          className: 'pagination-btn',
          disabled: currentPage <= 1,
          onClick: () => onPageChange(currentPage - 1),
          title: 'Previous Page'
        }, '◀ Prev'),

        e('span', { className: 'pagination-page-indicator' },
          'Page ',
          e('input', {
            type: 'number',
            min: 1,
            max: totalPages,
            value: currentPage,
            className: 'pagination-page-input',
            onChange: (evt) => {
              const val = parseInt(evt.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= totalPages) {
                onPageChange(val);
              }
            }
          }),
          ` of ${totalPages.toLocaleString()}`
        ),

        e('button', {
          className: 'pagination-btn',
          disabled: currentPage >= totalPages,
          onClick: () => onPageChange(currentPage + 1),
          title: 'Next Page'
        }, 'Next ▶'),
        e('button', {
          className: 'pagination-btn',
          disabled: currentPage >= totalPages,
          onClick: () => onPageChange(totalPages),
          title: 'Last Page'
        }, '⏭')
      ),

      // Right: Rows per page selector
      e('div', { className: 'pagination-size-selector' },
        e('span', { className: 'pagination-size-label' }, 'Show:'),
        pageSizes.map(size => {
          const isSelected = (size === Infinity && pageSize === Infinity) || (pageSize === size);
          return e('button', {
            key: String(size),
            className: `pagination-size-btn ${isSelected ? 'active' : ''}`,
            onClick: () => onPageSizeChange(size)
          }, size === Infinity ? 'All' : size);
        })
      )
    );
  }

  // Initialize safe global proxy immediately on file load
  window.CleanExcelReact = window.CleanExcelReact || {
    _pendingData: null,
    updateData: (data) => { window.CleanExcelReact._pendingData = data; },
    updateActiveColumn: (colId) => { window.CleanExcelReact._pendingColId = colId; },
    updateColNames: (names) => { window.CleanExcelReact._pendingColNames = names; },
    setSearchQuery: (q) => { window.CleanExcelReact._pendingQuery = q; },
    setStatusFilter: (f) => { window.CleanExcelReact._pendingStatus = f; },
    setCodeFilter: (c) => { window.CleanExcelReact._pendingCode = c; },
    setViewMode: (v) => { window.CleanExcelReact._pendingView = v; },
    getFilteredData: () => [],
    getAllData: () => []
  };

  /**
   * Main CleanExcel React Application Component
   */
  function CleanExcelOutputApp() {
    const [results, setResults] = useState(window.CleanExcelReact._pendingData || []);
    const [searchQuery, setSearchQuery] = useState(window.CleanExcelReact._pendingQuery || '');
    const [statusFilter, setStatusFilter] = useState(window.CleanExcelReact._pendingStatus || 'all');
    const [codeFilter, setCodeFilter] = useState(window.CleanExcelReact._pendingCode || 'all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [viewMode, setViewMode] = useState(window.CleanExcelReact._pendingView || 'table');
    const [activeColumnId, setActiveColumnId] = useState(window.CleanExcelReact._pendingColId || 'street');
    const [colNames, setColNames] = useState(window.CleanExcelReact._pendingColNames || {
      occupancy: { col1: 'Existing Code', col2: 'Building Description', col3: 'Occupancy Description' },
      construction: { col1: 'Existing Code', col2: 'Building Type', col3: 'Construction Description' }
    });
    const [copiedRowId, setCopiedRowId] = useState(null);

    // Individual copy helper with toast notification & button feedback
    const handleCopyValue = useCallback((val, rowId, label = '') => {
      if (val === undefined || val === null) return;
      const str = String(val).trim();
      if (!str) return;

      const onSuccess = () => {
        if (window.showToast) {
          window.showToast(`Copied ${label ? label + ' ' : ''}"${str}" to clipboard!`, '📋');
        }
        setCopiedRowId(rowId);
        setTimeout(() => {
          setCopiedRowId(prev => prev === rowId ? null : prev);
        }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(onSuccess).catch(() => {
          fallbackCopy(str, onSuccess);
        });
      } else {
        fallbackCopy(str, onSuccess);
      }
    }, []);

    const fallbackCopy = (str, cb) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = str;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (cb) cb();
      } catch (e) {
        if (window.showToast) window.showToast(`${str}`, 'ℹ️');
      }
    };

    // Expose React update triggers globally
    useEffect(() => {
      window.CleanExcelReact = {
        updateData: (newResults) => {
          setResults(Array.isArray(newResults) ? newResults : []);
          setCurrentPage(1);
        },
        updateActiveColumn: (colId) => {
          setActiveColumnId(colId);
          setCurrentPage(1);
        },
        updateColNames: (newNames) => {
          setColNames({ ...newNames });
        },
        setSearchQuery: (q) => {
          setSearchQuery(q || '');
          setCurrentPage(1);
        },
        setStatusFilter: (sf) => {
          setStatusFilter(sf || 'all');
          setCurrentPage(1);
        },
        setCodeFilter: (cf) => {
          setCodeFilter(cf || 'all');
          setCurrentPage(1);
        },
        setViewMode: (vm) => {
          setViewMode(vm || 'table');
        },
        getFilteredData: () => filteredRows,
        getAllData: () => results
      };
    }, [results, activeColumnId, colNames, searchQuery, statusFilter, codeFilter]);

    // Compute user column headers
    const getColHeader = useCallback((colNum) => {
      const section = activeColumnId === 'construction' ? 'construction' : 'occupancy';
      const map = colNames[section] || {};
      if (colNum === 1) return map.col1 || 'Existing Code';
      if (colNum === 2) return map.col2 || (section === 'construction' ? 'Building Type' : 'Building Description');
      if (colNum === 3) return map.col3 || (section === 'construction' ? 'Construction Description' : 'Occupancy Description');
      return `Column ${colNum}`;
    }, [activeColumnId, colNames]);

    // High-performance memoized filtering across thousands of rows (< 5ms)
    const filteredRows = useMemo(() => {
      if (!results || results.length === 0) return [];

      const query = searchQuery.trim().toLowerCase();
      const isCodeEngine = activeColumnId === 'occupancy' || activeColumnId === 'construction';
      const isConstruction = activeColumnId === 'construction' || (results[0] && results[0].conCode !== undefined);
      const isRoof = activeColumnId === 'roof' || (results[0] && results[0].geometry !== undefined);
      const isWall = activeColumnId === 'wall' || (results[0] && results[0].wallType !== undefined);
      const isRoofYear = activeColumnId === 'roof_year' || (results[0] && (results[0].roofYearBuilt !== undefined || results[0].rawRoofYearBuilt !== undefined || results[0].yearBuilt !== undefined));

      return results.filter(r => {
        // Status filter
        if (statusFilter !== 'all') {
          if (isRoofYear) {
            if (statusFilter === 'assigned' && !(r.status === 'assigned' || r.status === 'unchanged' || r.status === 'match' || (r.cleaned && r.status !== 'mismatch'))) return false;
            if (statusFilter === 'mismatch' && r.status !== 'mismatch') return false;
            if (statusFilter === 'missing_yb' && r.status !== 'missing_yb') return false;
            if (statusFilter === 'missing_roof' && r.status !== 'missing_roof') return false;
            if (statusFilter === 'empty' && r.status !== 'empty') return false;
          } else if (isRoof || isWall) {
            if (statusFilter === 'confirmed' && r.status !== 'match') return false;
            if (statusFilter === 'assigned' && r.status !== 'assigned') return false;
            if (statusFilter === 'differs' && r.status !== 'mismatch') return false;
            if (statusFilter === 'empty' && r.status !== 'empty') return false;
          } else if (isCodeEngine) {
            if (statusFilter === 'confirmed' && r.comparisonStatus !== 'match') return false;
            if (statusFilter === 'resolved' && r.comparisonStatus !== 'upgraded') return false;
            if (statusFilter === 'assigned' && r.comparisonStatus !== 'assigned') return false;
            if (statusFilter === 'differs' && r.comparisonStatus !== 'mismatch') return false;
          } else {
            if (statusFilter === 'cleaned' && !r.changed) return false;
            if (statusFilter === 'unchanged' && (r.changed || !r.original?.trim())) return false;
            if (statusFilter === 'empty' && r.original?.trim()) return false;
          }
        }

        // Code filter
        if (isCodeEngine && codeFilter !== 'all') {
          const targetCode = String(isConstruction ? (r.conCode || '') : (r.occCode || '')).trim();
          if (targetCode !== codeFilter) return false;
        }

        // Search Query filter
        if (query) {
          const lineStr = String(r.lineNum || '');
          if (isConstruction) {
            return lineStr === query ||
              (r.existingCode && r.existingCode.toLowerCase().includes(query)) ||
              (r.bldgDesc && r.bldgDesc.toLowerCase().includes(query)) ||
              (r.conDesc && r.conDesc.toLowerCase().includes(query)) ||
              (r.conCode && r.conCode.toLowerCase().includes(query)) ||
              (r.category && r.category.toLowerCase().includes(query)) ||
              (r.group && r.group.toLowerCase().includes(query));
          } else if (activeColumnId === 'occupancy') {
            return lineStr === query ||
              (r.existingCode && r.existingCode.toLowerCase().includes(query)) ||
              (r.bldgDesc && r.bldgDesc.toLowerCase().includes(query)) ||
              (r.occDesc && r.occDesc.toLowerCase().includes(query)) ||
              (r.occCode && r.occCode.toLowerCase().includes(query)) ||
              (r.category && r.category.toLowerCase().includes(query));
          } else if (isRoof) {
            return lineStr === query ||
              (r.original && r.original.toLowerCase().includes(query)) ||
              (r.geometry && r.geometry.toLowerCase().includes(query)) ||
              (r.pitch && r.pitch.toLowerCase().includes(query)) ||
              (r.covering && r.covering.toLowerCase().includes(query)) ||
              (r.deck && r.deck.toLowerCase().includes(query)) ||
              (r.anchorage && r.anchorage.toLowerCase().includes(query)) ||
              (r.geometryCode && r.geometryCode.toLowerCase().includes(query)) ||
              (r.pitchCode && r.pitchCode.toLowerCase().includes(query)) ||
              (r.coveringCode && r.coveringCode.toLowerCase().includes(query)) ||
              (r.deckCode && r.deckCode.toLowerCase().includes(query)) ||
              (r.anchorageCode && r.anchorageCode.toLowerCase().includes(query));
          } else if (isWall) {
            return lineStr === query ||
              (r.original && r.original.toLowerCase().includes(query)) ||
              (r.wallType && r.wallType.toLowerCase().includes(query)) ||
              (r.wallSiding && r.wallSiding.toLowerCase().includes(query)) ||
              (r.wallTypeCode && r.wallTypeCode.toLowerCase().includes(query)) ||
              (r.wallSidingCode && r.wallSidingCode.toLowerCase().includes(query)) ||
              (r.wallTypeName && r.wallTypeName.toLowerCase().includes(query)) ||
              (r.wallSidingName && r.wallSidingName.toLowerCase().includes(query));
          } else if (activeColumnId === 'split') {
            return lineStr === query ||
              (r.street && r.street.toLowerCase().includes(query)) ||
              (r.city && r.city.toLowerCase().includes(query)) ||
              (r.state && r.state.toLowerCase().includes(query)) ||
              (r.postal && r.postal.toLowerCase().includes(query)) ||
              (r.country && r.country.toLowerCase().includes(query));
          } else if (isRoofYear) {
            return lineStr === query ||
              (r.yearBuilt && String(r.yearBuilt).toLowerCase().includes(query)) ||
              (r.rawYearBuilt && String(r.rawYearBuilt).toLowerCase().includes(query)) ||
              (r.roofYearBuilt && String(r.roofYearBuilt).toLowerCase().includes(query)) ||
              (r.rawRoofYearBuilt && String(r.rawRoofYearBuilt).toLowerCase().includes(query)) ||
              (r.cleaned && String(r.cleaned).toLowerCase().includes(query)) ||
              (r.statusText && r.statusText.toLowerCase().includes(query));
          } else {
            return lineStr === query ||
              (r.original && r.original.toLowerCase().includes(query)) ||
              (r.cleaned && r.cleaned.toLowerCase().includes(query));
          }
        }

        return true;
      });
    }, [results, searchQuery, statusFilter, codeFilter, activeColumnId]);

    // Pagination calculations
    const totalRows = filteredRows.length;
    const effectivePageSize = pageSize === Infinity ? (totalRows || 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(totalRows / effectivePageSize));

    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * effectivePageSize;
    const endIndex = startIndex + effectivePageSize;

    // Slice only the visible page for instantaneous rendering (e.g. 50 or 100 rows)
    const visibleRows = useMemo(() => {
      if (pageSize === Infinity) return filteredRows;
      return filteredRows.slice(startIndex, endIndex);
    }, [filteredRows, startIndex, endIndex, pageSize]);

    // Handle empty state
    if (results.length === 0) {
      return e('div', { className: 'empty-state-card', id: 'empty-placeholder' },
        e('div', { className: 'empty-state-visual' },
          e('div', { className: 'empty-state-halo' }),
          e('svg', {
            className: 'empty-state-svg',
            viewBox: '0 0 64 64',
            width: 64,
            height: 64,
            fill: 'none',
            stroke: 'currentColor'
          },
            e('rect', { x: 10, y: 8, width: 44, height: 48, rx: 8, stroke: 'rgba(255, 255, 255, 0.4)', strokeWidth: '1.5', fill: 'rgba(255, 255, 255, 0.03)' }),
            e('line', { x1: 18, y1: 20, x2: 46, y2: 20, stroke: 'rgba(255, 255, 255, 0.9)', strokeWidth: '2', strokeLinecap: 'round' }),
            e('line', { x1: 18, y1: 28, x2: 38, y2: 28, stroke: 'rgba(255, 255, 255, 0.55)', strokeWidth: '1.5', strokeLinecap: 'round' }),
            e('line', { x1: 18, y1: 36, x2: 42, y2: 36, stroke: 'rgba(255, 255, 255, 0.55)', strokeWidth: '1.5', strokeLinecap: 'round' }),
            e('line', { x1: 18, y1: 44, x2: 32, y2: 44, stroke: 'rgba(255, 255, 255, 0.35)', strokeWidth: '1.5', strokeLinecap: 'round' }),
            e('line', { className: 'empty-svg-scanner', x1: 14, y1: 16, x2: 50, y2: 16, stroke: '#ffffff', strokeWidth: '2', strokeLinecap: 'round' }),
            e('circle', { cx: 46, cy: 46, r: 4, fill: '#ffffff', stroke: 'rgba(255, 255, 255, 0.5)', strokeWidth: '2' })
          )
        ),
        e('h3', { className: 'empty-state-title' }, 'Awaiting Schedule Data'),
        e('p', { className: 'empty-state-desc' }, 'Paste raw Excel column data on the left or click "Load Sample" above to run the active cleaning engine.'),
        e('div', { className: 'empty-chips' },
          e('span', { className: 'empty-state-chip' }, '⚡ 0ms In-Memory Processing'),
          e('span', { className: 'empty-state-chip' }, '🎯 Touchstone UNICEDE® Codes'),
          e('span', { className: 'empty-state-chip' }, '📋 1-Click Excel Paste')
        )
      );
    }

    const col1Title = `${getColHeader(1)} (AR)`;
    const col2Title = `${getColHeader(2)} (AS)`;
    const col3Title = `${getColHeader(3)} (AT)`;

    const firstRow = results && results.length > 0 ? results[0] : null;
    const isConstruction = activeColumnId === 'construction' || (firstRow && firstRow.conCode !== undefined);
    const isOccupancy = activeColumnId === 'occupancy' || (firstRow && firstRow.occCode !== undefined);
    const isSplit = activeColumnId === 'split' || (firstRow && firstRow.street !== undefined);
    const isRoof = activeColumnId === 'roof' || (firstRow && firstRow.geometry !== undefined);
    const isWall = activeColumnId === 'wall' || (firstRow && firstRow.wallType !== undefined);
    const isRoofYear = activeColumnId === 'roof_year' || (firstRow && (firstRow.roofYearBuilt !== undefined || firstRow.rawRoofYearBuilt !== undefined || firstRow.yearBuilt !== undefined));

    return e('div', { className: 'react-results-wrapper' },
      // Top Pagination Bar
      e(PaginationBar, {
        currentPage: safeCurrentPage,
        totalPages: totalPages,
        totalRows: totalRows,
        startIndex: startIndex,
        endIndex: endIndex,
        pageSize: pageSize,
        onPageChange: (p) => setCurrentPage(p),
        onPageSizeChange: (s) => { setPageSize(s); setCurrentPage(1); }
      }),

      // Output Table or Text View
      viewMode === 'table' ? (
        e('div', { className: 'table-responsive' },
          e('table', { className: 'output-table' },
            e('thead', null,
              e('tr', null,
                e('th', { style: { width: '44px', textAlign: 'right', paddingRight: '10px' } }, '#'),
                (isConstruction || isOccupancy) && [
                  e('th', { key: 'c1', style: { width: '120px', textAlign: 'center' } }, col1Title),
                  e('th', { key: 'c2', style: { width: '25%' } }, col2Title),
                  e('th', { key: 'c3', style: { width: '26%' } }, col3Title),
                  e('th', { key: 'code', style: { width: '115px', textAlign: 'center' } }, 'Touchstone Code'),
                  e('th', { key: 'cat' }, 'Touchstone Category'),
                  e('th', { key: 'status', style: { width: '110px', textAlign: 'center' } }, 'Status'),
                  e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
                ],
                isRoof && [
                  e('th', { key: 'raw', style: { width: '25%' } }, 'Raw Roof Input'),
                  e('th', { key: 'geom', style: { width: '11%', textAlign: 'center' } }, '1. Roof Geometry'),
                  e('th', { key: 'pitch', style: { width: '11%', textAlign: 'center' } }, '2. Roof Pitch'),
                  e('th', { key: 'cov', style: { width: '11%', textAlign: 'center' } }, '3. Roof Covering'),
                  e('th', { key: 'deck', style: { width: '11%', textAlign: 'center' } }, '4. Roof Deck'),
                  e('th', { key: 'anchor', style: { width: '11%', textAlign: 'center' } }, '5. Roof Anchor'),
                  e('th', { key: 'status', style: { width: '110px', textAlign: 'center' } }, 'Status'),
                  e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
                ],
                isWall && [
                  e('th', { key: 'raw', style: { width: '38%' } }, 'Raw Exterior Wall Input'),
                  e('th', { key: 'wallType', style: { width: '22%', textAlign: 'center' } }, '1. WallType (Backing / Structure)'),
                  e('th', { key: 'wallSiding', style: { width: '22%', textAlign: 'center' } }, '2. WallSiding (Weather Finish)'),
                  e('th', { key: 'status', style: { width: '110px', textAlign: 'center' } }, 'Status'),
                  e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
                ],
                isRoofYear && [
                  e('th', { key: 'yb', style: { width: '20%' } }, '1. Year Built (Input)'),
                  e('th', { key: 'ry', style: { width: '20%' } }, '2. Roof Year Built (Input)'),
                  e('th', { key: 'clean', style: { width: '26%' } },
                    e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' } },
                      e('span', null, 'Cleaned Roof Year'),
                      e('button', {
                        type: 'button',
                        className: 'btn-col-header-copy',
                        title: 'Copy Cleaned Roof Year column for Excel',
                        onClick: (evt) => {
                          evt.stopPropagation();
                          if (window.copyForExcel) window.copyForExcel();
                        }
                      }, '📋 Copy Column')
                    )
                  ),
                  e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                  e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
                ],
                isSplit && [
                  e('th', { key: 'st', style: { width: '32%' } }, 'STREET'),
                  e('th', { key: 'city' }, 'City'),
                  e('th', { key: 'state', style: { width: '55px', textAlign: 'center' } }, 'State'),
                  e('th', { key: 'postal', style: { width: '75px' } }, 'Postal'),
                  e('th', { key: 'actions', style: { width: '125px', textAlign: 'right' } }, 'Actions')
                ],
                (!isConstruction && !isOccupancy && !isSplit && !isRoof && !isWall && !isRoofYear) && [
                  e('th', { key: 'raw', style: { width: '38%' } }, activeColumnId === 'year' ? 'Raw Input Year' : 'Raw Input'),
                  e('th', { key: 'clean' },
                    e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' } },
                      e('span', null, activeColumnId === 'year' ? 'Cleaned Year (1753–2026)' : 'Cleaned Result (Excel Column)'),
                      e('button', {
                        type: 'button',
                        className: 'btn-col-header-copy',
                        title: activeColumnId === 'year' ? 'Copy all Cleaned Years for Excel' : 'Copy cleaned column for Excel',
                        onClick: (evt) => {
                          evt.stopPropagation();
                          if (window.copyForExcel) window.copyForExcel();
                        }
                      }, '📋 Copy Column')
                    )
                  ),
                  e('th', { key: 'st', style: { width: '115px', textAlign: 'center' } }, 'Status'),
                  e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
                ]
              )
            ),
            e('tbody', null,
              visibleRows.length === 0 ? (
                e('tr', null,
                  e('td', {
                    colSpan: isConstruction || isOccupancy ? 8 : (isRoof ? 9 : (isRoofYear ? 6 : (isWall ? 6 : (isSplit ? 6 : 5)))),
                    style: { textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }
                  },
                    e('div', { style: { fontSize: '26px', marginBottom: '8px' } }, '🔍'),
                    'No rows match the search query or active filter.'
                  )
                )
              ) : (
                visibleRows.map((r, idx) => {
                  const rowNum = r.lineNum || (startIndex + idx + 1);

                  if (isConstruction) {
                    const fullSearch = `${r.bldgDesc || ''} ${r.conDesc || ''}`.trim();
                    const searchUrl = fullSearch ? `https://www.google.com/search?q=${encodeURIComponent(fullSearch + ' Touchstone UNICEDE construction code')}` : '#';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { style: { textAlign: 'center' } },
                        r.existingCode ? e('span', { className: 'existing-code-tag' }, r.existingCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-bldg-desc' }, r.bldgDesc || '—'),
                      e('td', { className: 'td-occ-desc' }, r.conDesc || '—'),
                      e('td', { className: 'td-occ-code' },
                        e('span', {
                          className: 'occ-code-badge',
                          title: `Code ${r.conCode} (Click to inspect Touchstone details)`,
                          style: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.conCode, 'construction')
                        }, r.conCode || '100')
                      ),
                      e('td', { className: 'td-occ-cat' },
                        r.category || 'Unknown',
                        r.group && e('br'),
                        r.group && e('small', { style: { color: 'var(--text-muted)', fontSize: '10px' } }, r.group)
                      ),
                      e('td', { style: { textAlign: 'center' } },
                        getStatusBadge(r.comparisonStatus, r.comparisonMessage, 'Assigned')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.conCode && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `con-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy Construction Code "${r.conCode}" to clipboard`,
                            onClick: () => handleCopyValue(r.conCode, `con-${rowNum}`, 'Code')
                          }, copiedRowId === `con-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          fullSearch && e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'Lookup Construction Definition'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isOccupancy) {
                    const fullSearch = `${r.bldgDesc || ''} ${r.occDesc || ''}`.trim();
                    const searchUrl = fullSearch ? `https://www.google.com/search?q=${encodeURIComponent(fullSearch + ' Touchstone UNICEDE occupancy code')}` : '#';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { style: { textAlign: 'center' } },
                        r.existingCode ? e('span', { className: 'existing-code-tag' }, r.existingCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-bldg-desc' }, r.bldgDesc || '—'),
                      e('td', { className: 'td-occ-desc' }, r.occDesc || '—'),
                      e('td', { className: 'td-occ-code' },
                        e('span', {
                          className: 'occ-code-badge',
                          title: `Code ${r.occCode} (Click to inspect Touchstone details)`,
                          style: { cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.occCode, 'occupancy')
                        }, r.occCode || '300')
                      ),
                      e('td', { className: 'td-occ-cat' },
                        r.category || 'Unknown',
                        r.group && e('br'),
                        r.group && e('small', { style: { color: 'var(--text-muted)', fontSize: '10px' } }, r.group)
                      ),
                      e('td', { style: { textAlign: 'center' } },
                        getStatusBadge(r.comparisonStatus, r.comparisonMessage, 'Assigned')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.occCode && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `occ-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy Occupancy Code "${r.occCode}" to clipboard`,
                            onClick: () => handleCopyValue(r.occCode, `occ-${rowNum}`, 'Code')
                          }, copiedRowId === `occ-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          fullSearch && e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'Lookup Occupancy Definition'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isRoof) {
                    const searchUrl = 'https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-roof-detail-fields.html?hl=roof';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', { className: 'td-roof-geom', style: { textAlign: 'center' } },
                        r.geometryCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.geometryName ? `${r.geometryName} (Code ${r.geometryCode})` : `Code ${r.geometryCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.geometryCode, 'roof', 'geometry')
                        }, r.geometryCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-pitch', style: { textAlign: 'center' } },
                        r.pitchCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.pitchName ? `${r.pitchName} (Code ${r.pitchCode})` : `Code ${r.pitchCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald-light)', borderColor: 'rgba(16, 185, 129, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.pitchCode, 'roof', 'pitch')
                        }, r.pitchCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-cov', style: { textAlign: 'center' } },
                        r.coveringCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.coveringName ? `${r.coveringName} (Code ${r.coveringCode})` : `Code ${r.coveringCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.coveringCode, 'roof', 'covering')
                        }, r.coveringCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-deck', style: { textAlign: 'center' } },
                        r.deckCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.deckName ? `${r.deckName} (Code ${r.deckCode})` : `Code ${r.deckCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.deckCode, 'roof', 'deck')
                        }, r.deckCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-anchor', style: { textAlign: 'center' } },
                        r.anchorageCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.anchorageName ? `${r.anchorageName} (Code ${r.anchorageCode})` : `Code ${r.anchorageCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', borderColor: 'rgba(236, 72, 153, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.anchorageCode, 'roof', 'anchorage')
                        }, r.anchorageCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { style: { textAlign: 'center' } },
                        getStatusBadge(r.status, r.statusText, r.statusText || 'Separated')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          (r.geometryCode || r.pitchCode || r.coveringCode || r.deckCode || r.anchorageCode) && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `rf-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy 5 Roof Codes to clipboard',
                            onClick: () => handleCopyValue([r.geometryCode || '0', r.pitchCode || '0', r.coveringCode || '0', r.deckCode || '0', r.anchorageCode || '0'].join('\t'), `rf-${rowNum}`, 'Roof Codes')
                          }, copiedRowId === `rf-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Roof Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isWall) {
                    const searchUrl = 'https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-wall-detail-fields.html?hl=wall';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', { className: 'td-wall-type', style: { textAlign: 'center' } },
                        r.wallTypeCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.wallTypeName ? `${r.wallTypeName} (Code ${r.wallTypeCode})` : `Code ${r.wallTypeCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(234, 88, 12, 0.15)', color: '#fb923c', borderColor: 'rgba(234, 88, 12, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.wallTypeCode, 'wall')
                        }, r.wallTypeCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-wall-siding', style: { textAlign: 'center' } },
                        r.wallSidingCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.wallSidingName ? `${r.wallSidingName} (Code ${r.wallSidingCode})` : `Code ${r.wallSidingCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.wallSidingCode, 'wall')
                        }, r.wallSidingCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { style: { textAlign: 'center' } },
                        getStatusBadge(r.status, r.statusText, r.statusText || 'Separated')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          (r.wallTypeCode || r.wallSidingCode) && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `wl-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy Wall Codes (Type & Siding)',
                            onClick: () => handleCopyValue([r.wallTypeCode || '0', r.wallSidingCode || '0'].join('\t'), `wl-${rowNum}`, 'Wall Codes')
                          }, copiedRowId === `wl-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Wall Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isRoofYear) {
                    let badgeCls = 'assigned';
                    let badgeText = '✓ Valid';
                    if (r.status === 'mismatch') {
                      badgeCls = 'mismatch';
                      badgeText = '⚠️ > Year Built';
                    } else if (r.status === 'missing_yb') {
                      badgeCls = 'mismatch';
                      badgeText = '⚠️ Missing YB';
                    } else if (r.status === 'missing_roof') {
                      badgeCls = 'unchanged';
                      badgeText = '⚠️ Missing Roof';
                    } else if (r.status === 'empty') {
                      badgeCls = 'empty';
                      badgeText = 'Blank';
                    } else if (r.cleaned) {
                      badgeCls = 'match';
                      badgeText = `✓ Valid (${r.cleaned})`;
                    }

                    const searchUrl = r.yearBuilt ? `https://www.google.com/search?q=${encodeURIComponent('Year Built ' + r.yearBuilt + ' Roof Year ' + (r.roofYearBuilt || ''))}` : '#';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', {
                        className: 'td-yb',
                        style: {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '600',
                          color: r.yearBuilt ? 'var(--text-primary)' : 'var(--text-muted)'
                        }
                      }, r.yearBuilt || (r.rawYearBuilt ? `${r.rawYearBuilt} (Invalid)` : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' } }, '— (Blank)'))),
                      e('td', {
                        className: 'td-ry',
                        style: {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '600',
                          color: r.roofYearBuilt ? 'var(--text-primary)' : 'var(--text-muted)'
                        }
                      }, r.roofYearBuilt || (r.rawRoofYearBuilt ? `${r.rawRoofYearBuilt} (Invalid)` : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' } }, '— (Blank)'))),
                      e('td', {
                        className: 'td-cleaned',
                        style: {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          color: r.cleaned ? 'var(--accent-emerald-light)' : 'var(--text-muted)'
                        }
                      }, r.cleaned ? e('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                        e('span', null, r.cleaned),
                        e('button', {
                          type: 'button',
                          className: `btn-inline-copy ${copiedRowId === `ry-cell-${rowNum}` ? 'copied' : ''}`,
                          title: `Copy roof year "${r.cleaned}"`,
                          onClick: () => handleCopyValue(r.cleaned, `ry-cell-${rowNum}`, 'Roof Year')
                        }, copiedRowId === `ry-cell-${rowNum}` ? '✓' : '📋')
                      ) : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' } }, '— (Blank)')),
                      e('td', { style: { textAlign: 'center' } },
                        getStatusBadge(badgeCls, r.statusText, badgeText)
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.cleaned && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `ry-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy Cleaned Roof Year "${r.cleaned}" to clipboard`,
                            onClick: () => handleCopyValue(r.cleaned, `ry-${rowNum}`, 'Roof Year')
                          }, copiedRowId === `ry-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          (r.yearBuilt || r.roofYearBuilt) && e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'Search Property Year Info'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isSplit) {
                    const fullAddr = `${r.street || ''}, ${r.city || ''}, ${r.state || ''} ${r.postal || ''}`.trim();
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-street' }, r.street || '—'),
                      e('td', { className: 'td-city' }, r.city || '—'),
                      e('td', { className: 'td-state' }, r.state || '—'),
                      e('td', { className: 'td-postal' }, r.postal || '—'),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          fullAddr && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `sp-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy split address row to clipboard',
                            onClick: () => handleCopyValue([r.street || '', r.city || '', r.state || '', r.postal || ''].join('\t'), `sp-${rowNum}`, 'Address')
                          }, copiedRowId === `sp-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', { href: mapsUrl, target: '_blank', rel: 'noopener noreferrer', className: 'btn-maps', title: 'View on Maps' }, '🗺️ Maps')
                        )
                      )
                    );
                  } else {
                    const isYear = activeColumnId === 'year';
                    let statusKey = !r.original?.trim() ? 'empty' : (r.changed ? 'cleaned' : 'unchanged');
                    let defaultText = r.changed ? 'Cleaned' : 'No Change';

                    if (isYear) {
                      if (!r.original?.trim()) {
                        statusKey = 'empty';
                        defaultText = 'Blank';
                      } else if (!r.cleaned) {
                        statusKey = 'mismatch';
                        defaultText = '⚠️ Out of Range';
                      } else if (r.original.trim() === r.cleaned) {
                        statusKey = 'match';
                        defaultText = '✓ Valid Year';
                      } else {
                        statusKey = 'assigned';
                        defaultText = `✨ Cleaned (${r.cleaned})`;
                      }
                    }

                    const searchUrl = r.cleaned ? `https://www.google.com/search?q=${encodeURIComponent('Year Built ' + r.cleaned)}` : '#';
                    const mapsUrl = r.cleaned ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.cleaned)}` : '#';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', {
                        className: 'td-cleaned',
                        style: isYear ? {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          color: r.cleaned ? 'var(--accent-emerald-light)' : 'var(--text-muted)'
                        } : {}
                      }, isYear ? (
                        r.cleaned ? e('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                          e('span', null, r.cleaned),
                          e('button', {
                            type: 'button',
                            className: `btn-inline-copy ${copiedRowId === `cell-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy year "${r.cleaned}"`,
                            onClick: () => handleCopyValue(r.cleaned, `cell-${rowNum}`, 'Year')
                          }, copiedRowId === `cell-${rowNum}` ? '✓' : '📋')
                        ) : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' } }, '— (Blank)')
                      ) : (
                        r.cleaned ? e('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                          e('span', null, r.cleaned),
                          e('button', {
                            type: 'button',
                            className: `btn-inline-copy ${copiedRowId === `cell-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy "${r.cleaned}"`,
                            onClick: () => handleCopyValue(r.cleaned, `cell-${rowNum}`)
                          }, copiedRowId === `cell-${rowNum}` ? '✓' : '📋')
                        ) : (r.cleaned || '—')
                      )),
                      e('td', { style: { textAlign: 'center' } }, getStatusBadge(statusKey, r.statusText || '', defaultText)),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.cleaned && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === rowNum ? 'copied' : ''}`,
                            title: `Copy "${r.cleaned}" to clipboard`,
                            onClick: () => handleCopyValue(r.cleaned, rowNum, isYear ? 'Year' : '')
                          }, copiedRowId === rowNum ? '✓ Copied' : '📋 Copy'),
                          r.cleaned && (isYear
                            ? e('a', { href: searchUrl, target: '_blank', rel: 'noopener noreferrer', className: 'btn-maps', title: 'Search Year' }, '🔍 Info')
                            : e('a', { href: mapsUrl, target: '_blank', rel: 'noopener noreferrer', className: 'btn-maps', title: 'View on Maps' }, '🗺️ Maps')
                          )
                        )
                      )
                    );
                  }
                })
              )
            )
          )
        )
      ) : (
        // Plain Text Tabular TSV View
        e('div', { className: 'text-view-container' },
          e('textarea', {
            className: 'code-textarea output-text-area',
            readOnly: true,
            value: useMemo(() => {
              if (isConstruction) {
                const header = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.existingCode || '', r.bldgDesc || '', r.conDesc || '', r.conCode || '100', r.category || '', r.comparisonMessage || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isOccupancy) {
                const header = [col1Title, col2Title, col3Title, 'Touchstone Code', 'Touchstone Category', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.existingCode || '', r.bldgDesc || '', r.occDesc || '', r.occCode || '300', r.category || '', r.comparisonMessage || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isRoof) {
                const header = ['1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck', '5. Roof Anchorage'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.geometryCode || '', r.pitchCode || '', r.coveringCode || '', r.deckCode || '', r.anchorageCode || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isWall) {
                const header = ['1. WallType', '2. WallSiding'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.wallTypeCode || '', r.wallSidingCode || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isRoofYear) {
                const header = ['Year Built', 'Roof Year Built', 'Cleaned Roof Year Built', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.yearBuilt || r.rawYearBuilt || '', r.roofYearBuilt || r.rawRoofYearBuilt || '', r.cleaned || '', r.statusText || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isSplit) {
                const lines = [['STREET', 'City', 'State', 'Postal'].join('\t')];
                filteredRows.forEach(r => lines.push([r.street || '', r.city || '', r.state || '', r.postal || ''].join('\t')));
                return lines.join('\n');
              } else {
                return filteredRows.map(r => r.cleaned || '').join('\n');
              }
            }, [filteredRows, isConstruction, isOccupancy, isSplit, isRoof, isWall, isRoofYear, col1Title, col2Title, col3Title])
          })
        )
      ),

      // Bottom Pagination Bar (if multiple pages)
      totalPages > 1 && e(PaginationBar, {
        currentPage: safeCurrentPage,
        totalPages: totalPages,
        totalRows: totalRows,
        startIndex: startIndex,
        endIndex: endIndex,
        pageSize: pageSize,
        onPageChange: (p) => {
          setCurrentPage(p);
          const topBar = document.querySelector('.react-pagination-bar');
          if (topBar) topBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        },
        onPageSizeChange: (s) => { setPageSize(s); setCurrentPage(1); }
      })
    );
  }

  // Initialize React Root on Window Load
  function initReactOutputApp() {
    const rootEl = document.getElementById('output-react-root');
    if (!rootEl) return;
    if (window.ReactDOM && window.ReactDOM.createRoot) {
      const root = ReactDOM.createRoot(rootEl);
      root.render(e(CleanExcelOutputApp));
      window.__cleanExcelReactRoot = root;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReactOutputApp);
  } else {
    initReactOutputApp();
  }
})();
