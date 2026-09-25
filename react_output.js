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
    const [savedRowsMap, setSavedRowsMap] = useState({});

    // Handler to save row keyword-to-code mapping to Custom Database
    const handleSaveRowToDB = useCallback((section, rowData, rowKey) => {
      if (window.saveRowToCustomDB) {
        window.saveRowToCustomDB(section, rowData, (success) => {
          if (success) {
            setSavedRowsMap(prev => ({ ...prev, [rowKey]: true }));
            setTimeout(() => {
              setSavedRowsMap(prev => ({ ...prev, [rowKey]: false }));
            }, 3000);
          }
        });
      }
    }, []);

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

    const getExcelLetter = (idx) => {
      let n = 43 + idx;
      let letter = '';
      while (n > 0) {
        let rem = (n - 1) % 26;
        letter = String.fromCharCode(65 + rem) + letter;
        n = Math.floor((n - 1) / 26);
      }
      return letter;
    };

    const getColHeader = useCallback((colNum) => {
      const section = activeColumnId === 'construction' ? 'construction' : 'occupancy';
      const map = colNames[section] || {};
      const key = 'col' + colNum;
      if (map[key] && map[key].trim()) return map[key].trim();
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
      const isFoundation = activeColumnId === 'foundation' || activeColumnId === 'foundation_type' || activeColumnId === 'foundationType' || activeColumnId === 'foundation_connection' || (results[0] && (results[0].foundationType !== undefined || results[0].foundationTypeCode !== undefined));
      const isRoofYear = activeColumnId === 'roof_year' || (results[0] && (results[0].roofYearBuilt !== undefined || results[0].rawRoofYearBuilt !== undefined || results[0].yearBuilt !== undefined));
      const isCoordinates = activeColumnId === 'coordinates' || activeColumnId === 'coordinate' || activeColumnId === 'lat_long' || activeColumnId === 'latlong' || activeColumnId === 'coords' || activeColumnId === 'dms' || (results[0] && (results[0].latitude !== undefined || results[0].rawLat !== undefined));
      const isShortColumn = activeColumnId === 'short_column' || activeColumnId === 'shortColumn' || (results[0] && (results[0].shortColumnCode !== undefined || results[0].shortColumn !== undefined));
      const isSoftStory = activeColumnId === 'soft_story' || activeColumnId === 'softStory' || (results[0] && (results[0].softStoryCode !== undefined || results[0].softStory !== undefined));
      const isOrnamentation = activeColumnId === 'ornamentation' || activeColumnId === 'ornament' || (results[0] && (results[0].ornamentationCode !== undefined || results[0].ornamentation !== undefined));
      const isBuildingShape = activeColumnId === 'building_shape' || activeColumnId === 'buildingShape' || activeColumnId === 'shape' || (results[0] && (results[0].buildingShapeCode !== undefined || results[0].buildingShape !== undefined));
      const isBuildingCondition = activeColumnId === 'building_condition' || activeColumnId === 'buildingCondition' || activeColumnId === 'condition' || (results[0] && (results[0].buildingConditionCode !== undefined || results[0].buildingCondition !== undefined));

      return results.filter(r => {
        // Status filter
        if (statusFilter !== 'all') {
          if (isRoof) {
            if (r.status !== statusFilter) return false;
          } else if (isWall) {
            if (r.status !== statusFilter) return false;
          } else if (isFoundation) {
            if (r.status !== statusFilter) return false;
          } else if (isShortColumn || isSoftStory || isOrnamentation || isBuildingShape || isBuildingCondition) {
            if (r.status !== statusFilter) return false;
          } else if (isRoofYear) {
            if (r.status !== statusFilter && r.statusText !== statusFilter) return false;
          } else if (isCoordinates) {
            if (statusFilter === 'dms' && r.status !== 'assigned' && r.status !== 'dms') return false;
            if (statusFilter === 'decimal' && r.status !== 'match' && r.status !== 'decimal') return false;
            if (statusFilter === 'missing' && !r.isLatMissing && !r.isLongMissing && r.status !== 'empty' && r.status !== 'mismatch') return false;
            if (statusFilter !== 'dms' && statusFilter !== 'decimal' && statusFilter !== 'missing' && r.status !== statusFilter && r.statusText !== statusFilter) return false;
          } else if (isCodeEngine) {
            if (r.comparisonStatus !== statusFilter) return false;
          } else {
            if (statusFilter === 'modified' && !r.changed) return false;
            if (statusFilter === 'unmodified' && r.changed) return false;
          }
        }

        // Code filter (category code dropdown)
        if (codeFilter !== 'all') {
          if (activeColumnId === 'construction' && r.conCode !== codeFilter) return false;
          if (activeColumnId === 'occupancy' && r.occCode !== codeFilter) return false;
          if (isRoof && r.coveringCode !== codeFilter && r.geometryCode !== codeFilter) return false;
          if (isWall && r.wallTypeCode !== codeFilter && r.wallSidingCode !== codeFilter) return false;
          if (isFoundation && r.foundationTypeCode !== codeFilter && r.foundationConnectionCode !== codeFilter) return false;
          if ((isShortColumn || isSoftStory || isOrnamentation || isBuildingShape || isBuildingCondition) && r.shortColumnCode !== codeFilter && r.softStoryCode !== codeFilter && r.ornamentationCode !== codeFilter && r.buildingShapeCode !== codeFilter && r.buildingConditionCode !== codeFilter && r.code !== codeFilter) return false;
        }

        // Search text filter
        if (query) {
          const lineStr = String(r.lineNum);
          if (activeColumnId === 'construction') {
            const extraMatch = (r.extraCols || []).some(c => c && c.toLowerCase().includes(query));
            return lineStr === query ||
              extraMatch ||
              (r.existingCode && r.existingCode.toLowerCase().includes(query)) ||
              (r.bldgDesc && r.bldgDesc.toLowerCase().includes(query)) ||
              (r.conDesc && r.conDesc.toLowerCase().includes(query)) ||
              (r.conCode && r.conCode.toLowerCase().includes(query)) ||
              (r.category && r.category.toLowerCase().includes(query)) ||
              (r.group && r.group.toLowerCase().includes(query));
          } else if (activeColumnId === 'occupancy') {
            const extraMatch = (r.extraCols || []).some(c => c && c.toLowerCase().includes(query));
            return lineStr === query ||
              extraMatch ||
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
              (r.covAttach && r.covAttach.toLowerCase().includes(query)) ||
              (r.deckAttach && r.deckAttach.toLowerCase().includes(query)) ||
              (r.anchorage && r.anchorage.toLowerCase().includes(query)) ||
              (r.geometryCode && r.geometryCode.toLowerCase().includes(query)) ||
              (r.pitchCode && r.pitchCode.toLowerCase().includes(query)) ||
              (r.coveringCode && r.coveringCode.toLowerCase().includes(query)) ||
              (r.deckCode && r.deckCode.toLowerCase().includes(query)) ||
              (r.covAttachCode && r.covAttachCode.toLowerCase().includes(query)) ||
              (r.deckAttachCode && r.deckAttachCode.toLowerCase().includes(query)) ||
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
          } else if (isFoundation) {
            return lineStr === query ||
              (r.original && r.original.toLowerCase().includes(query)) ||
              (r.foundationType && r.foundationType.toLowerCase().includes(query)) ||
              (r.foundationTypeCode && r.foundationTypeCode.toLowerCase().includes(query)) ||
              (r.foundationTypeName && r.foundationTypeName.toLowerCase().includes(query)) ||
              (r.foundationConnection && r.foundationConnection.toLowerCase().includes(query)) ||
              (r.foundationConnectionCode && r.foundationConnectionCode.toLowerCase().includes(query)) ||
              (r.statusText && r.statusText.toLowerCase().includes(query));
          } else if (isShortColumn) {
            return lineStr === query ||
              (r.original && r.original.toLowerCase().includes(query)) ||
              (r.shortColumn && r.shortColumn.toLowerCase().includes(query)) ||
              (r.shortColumnName && r.shortColumnName.toLowerCase().includes(query)) ||
              (r.shortColumnCode && r.shortColumnCode.toLowerCase().includes(query)) ||
              (r.code && r.code.toLowerCase().includes(query)) ||
              (r.statusText && r.statusText.toLowerCase().includes(query));
          } else if (isSoftStory) {
            return lineStr === query ||
              (r.original && r.original.toLowerCase().includes(query)) ||
              (r.softStory && r.softStory.toLowerCase().includes(query)) ||
              (r.softStoryName && r.softStoryName.toLowerCase().includes(query)) ||
              (r.softStoryCode && r.softStoryCode.toLowerCase().includes(query)) ||
              (r.code && r.code.toLowerCase().includes(query)) ||
              (r.statusText && r.statusText.toLowerCase().includes(query));
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
          } else if (isCoordinates) {
            return lineStr === query ||
              (r.rawLat && String(r.rawLat).toLowerCase().includes(query)) ||
              (r.rawLong && String(r.rawLong).toLowerCase().includes(query)) ||
              (r.lat && String(r.lat).toLowerCase().includes(query)) ||
              (r.long && String(r.long).toLowerCase().includes(query)) ||
              (r.statusText && String(r.statusText).toLowerCase().includes(query));
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

    const firstRow = results && results.length > 0 ? results[0] : null;
    const isConstruction = activeColumnId === 'construction' || (firstRow && firstRow.conCode !== undefined);
    const isOccupancy = activeColumnId === 'occupancy' || (firstRow && firstRow.occCode !== undefined);
    const isSplit = activeColumnId === 'split' || (firstRow && firstRow.street !== undefined);
    const isRoof = activeColumnId === 'roof' || (firstRow && firstRow.geometry !== undefined);
    const isWall = activeColumnId === 'wall' || (firstRow && firstRow.wallType !== undefined);
    const isFoundationConn = activeColumnId === 'foundation_connection';
    const isFoundationType = activeColumnId === 'foundation_type' || activeColumnId === 'foundationType';
    const isFoundationDual = activeColumnId === 'foundation' || (firstRow && (firstRow.foundationType !== undefined || firstRow.foundationTypeCode !== undefined) && !isFoundationConn && !isFoundationType);
    const isFoundation = isFoundationConn || isFoundationType || isFoundationDual;
    const isRoofYear = activeColumnId === 'roof_year' || (firstRow && (firstRow.roofYearBuilt !== undefined || firstRow.rawRoofYearBuilt !== undefined || firstRow.yearBuilt !== undefined));
    const isCoordinates = activeColumnId === 'coordinates' || activeColumnId === 'coordinate' || activeColumnId === 'lat_long' || activeColumnId === 'latlong' || activeColumnId === 'coords' || activeColumnId === 'dms' || (firstRow && (firstRow.latitude !== undefined || firstRow.rawLat !== undefined));
    const isShortColumn = activeColumnId === 'short_column' || activeColumnId === 'shortColumn' || (firstRow && (firstRow.shortColumnCode !== undefined || firstRow.shortColumn !== undefined));
    const isSoftStory = activeColumnId === 'soft_story' || activeColumnId === 'softStory' || (firstRow && (firstRow.softStoryCode !== undefined || firstRow.softStory !== undefined));
    const isOrnamentation = activeColumnId === 'ornamentation' || activeColumnId === 'ornament' || (firstRow && (firstRow.ornamentationCode !== undefined || firstRow.ornamentation !== undefined));
    const isBuildingShape = activeColumnId === 'building_shape' || activeColumnId === 'buildingShape' || activeColumnId === 'shape' || (firstRow && (firstRow.buildingShapeCode !== undefined || firstRow.buildingShape !== undefined));
    const isBuildingCondition = activeColumnId === 'building_condition' || activeColumnId === 'buildingCondition' || activeColumnId === 'condition' || (firstRow && (firstRow.buildingConditionCode !== undefined || firstRow.buildingCondition !== undefined));

    // Address Splitter column visibility (Raw Address, County and Country)
    const hasAnyCounty = results && results.some(r => Boolean(r.county));
    const hasAnyCountry = results && results.some(r => Boolean(r.country));
    const showRaw = (window.AppState && window.AppState.splitIncludeRaw !== undefined)
      ? window.AppState.splitIncludeRaw
      : true;
    const showCounty = (window.AppState && window.AppState.splitIncludeCounty !== undefined)
      ? window.AppState.splitIncludeCounty
      : (hasAnyCounty || true);
    const showCountry = (window.AppState && window.AppState.splitIncludeCountry !== undefined)
      ? window.AppState.splitIncludeCountry
      : (hasAnyCountry || true);

    // Dynamic Multi-Column Headers for Occupancy & Construction (3, 4, 5+ columns)
    const extraColsCount = (firstRow && Array.isArray(firstRow.extraCols)) ? firstRow.extraCols.length : 0;
    const totalInputCols = Math.max(3, 3 + extraColsCount);
    const dynamicColHeaders = [];
    for (let i = 1; i <= totalInputCols; i++) {
      dynamicColHeaders.push({
        num: i,
        title: `${getColHeader(i)} (${getExcelLetter(i)})`
      });
    }

    return e('div', { className: 'react-results-wrapper' },
      // Top Pagination Bar
      e(PaginationBar, {
        currentPage: safeCurrentPage,
        totalPages: totalPages,
        totalRows: totalRows,
        startIndex: startIndex,
        endIndex: endIndex,
        pageSize: pageSize,
        onPageChange: (p) => {
          setCurrentPage(p);
        },
        onPageSizeChange: (s) => { setPageSize(s); setCurrentPage(1); }
      }),

      // Output Table or Text View
      viewMode === 'table' ? (
        e('div', { className: 'table-responsive' },
        e('table', { className: 'output-table' },
          e('thead', null,
            e('tr', null,
              e('th', { key: 'num', style: { width: '48px', textAlign: 'center' } }, '#'),
              isConstruction && [
                dynamicColHeaders.map(col =>
                  e('th', { key: `con-in-${col.num}`, style: { width: `${Math.round(48 / totalInputCols)}%` } }, col.title)
                ),
                e('th', { key: 'con-code', style: { width: '90px', textAlign: 'center' } }, 'Touchstone Code'),
                e('th', { key: 'con-desc' }, 'Construction Class Description'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '190px', textAlign: 'right' } },
                  e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' } },
                    e('span', null, 'Actions'),
                    filteredRows.length > 0 && e('button', {
                      type: 'button',
                      className: 'btn-header-save-all-db',
                      title: 'Save all valid construction rules in this table to Custom Database',
                      onClick: (evt) => {
                        evt.stopPropagation();
                        if (window.saveAllRowsToCustomDB) {
                          window.saveAllRowsToCustomDB('construction', filteredRows);
                        }
                      }
                    }, '💾 Save All')
                  )
                )
              ],
              isOccupancy && [
                dynamicColHeaders.map(col =>
                  e('th', { key: `occ-in-${col.num}`, style: { width: `${Math.round(48 / totalInputCols)}%` } }, col.title)
                ),
                e('th', { key: 'occ-code', style: { width: '90px', textAlign: 'center' } }, 'Touchstone Code'),
                e('th', { key: 'occ-desc' }, 'Occupancy Description'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '190px', textAlign: 'right' } },
                  e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' } },
                    e('span', null, 'Actions'),
                    filteredRows.length > 0 && e('button', {
                      type: 'button',
                      className: 'btn-header-save-all-db',
                      title: 'Save all valid occupancy rules in this table to Custom Database',
                      onClick: (evt) => {
                        evt.stopPropagation();
                        if (window.saveAllRowsToCustomDB) {
                          window.saveAllRowsToCustomDB('occupancy', filteredRows);
                        }
                      }
                    }, '💾 Save All')
                  )
                )
              ],
              isRoof && [
                e('th', { key: 'raw-roof-desc', style: { width: '22%' } }, 'Raw Roof Description'),
                e('th', { key: 'rf-geo-code', style: { width: '68px', textAlign: 'center' } }, '1. Geom'),
                e('th', { key: 'rf-pitch-code', style: { width: '68px', textAlign: 'center' } }, '2. Pitch'),
                e('th', { key: 'rf-cov-code', style: { width: '68px', textAlign: 'center' } }, '3. Cov'),
                e('th', { key: 'rf-deck-code', style: { width: '68px', textAlign: 'center' } }, '4. Deck'),
                e('th', { key: 'rf-covatt-code', style: { width: '78px', textAlign: 'center' } }, '5. Cov Att'),
                e('th', { key: 'rf-dckatt-code', style: { width: '78px', textAlign: 'center' } }, '6. Dck Att'),
                e('th', { key: 'rf-anc-code', style: { width: '72px', textAlign: 'center' } }, '7. Anchor'),
                e('th', { key: 'status', style: { width: '125px', textAlign: 'center' } }, 'Status'),
                e('th', { key: 'actions', style: { width: '115px', textAlign: 'right' } }, 'Actions')
              ],
              isWall && [
                e('th', { key: 'raw-wall-desc', style: { width: '24%' } }, 'Raw Exterior Wall Description'),
                e('th', { key: 'wl-type-code', style: { width: '64px', textAlign: 'center' } }, '1. Type'),
                e('th', { key: 'wl-siding-code', style: { width: '64px', textAlign: 'center' } }, '2. Siding'),
                e('th', { key: 'wl-glass-code', style: { width: '60px', textAlign: 'center' } }, '3. Glass'),
                e('th', { key: 'wl-glasspct-code', style: { width: '60px', textAlign: 'center' } }, '4. Gl %'),
                e('th', { key: 'wl-winprot-code', style: { width: '60px', textAlign: 'center' } }, '5. W-Prot'),
                e('th', { key: 'wl-doors-code', style: { width: '60px', textAlign: 'center' } }, '6. Doors'),
                e('th', { key: 'wl-open-code', style: { width: '58px', textAlign: 'center' } }, '7. Open'),
                e('th', { key: 'wl-brickven-code', style: { width: '60px', textAlign: 'center' } }, '8. Brk %'),
                e('th', { key: 'wl-firerate-code', style: { width: '60px', textAlign: 'center' } }, '9. Fire'),
                e('th', { key: 'status', style: { width: '125px', textAlign: 'center' } }, 'Status'),
                e('th', { key: 'actions', style: { width: '115px', textAlign: 'right' } }, 'Actions')
              ],
              isFoundationConn && [
                e('th', { key: 'raw-fnd-conn-desc', style: { width: '38%' } }, 'Raw Foundation Connection Input'),
                e('th', { key: 'fnd-conn-code', style: { width: '120px', textAlign: 'center' } }, 'Connection Code'),
                e('th', { key: 'fnd-conn-name', style: { width: '200px' } }, 'Connection Description'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
              ],
              isFoundationType && [
                e('th', { key: 'raw-fnd-type-desc', style: { width: '38%' } }, 'Raw Foundation Type Input'),
                e('th', { key: 'fnd-type-code', style: { width: '120px', textAlign: 'center' } }, 'Foundation Type Code'),
                e('th', { key: 'fnd-type-name', style: { width: '200px' } }, 'Foundation Type Description'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
              ],
              (isFoundationDual && !isFoundationConn && !isFoundationType) && [
                e('th', { key: 'raw-fnd-desc', style: { width: '34%' } }, 'Raw Foundation Input'),
                e('th', { key: 'fnd-type-code', style: { width: '85px', textAlign: 'center' } }, 'Type Code'),
                e('th', { key: 'fnd-type-name', style: { width: '180px' } }, 'Foundation Type'),
                e('th', { key: 'fnd-conn-code', style: { width: '95px', textAlign: 'center' } }, 'Connection'),
                e('th', { key: 'status', style: { width: '135px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '125px', textAlign: 'right' } }, 'Actions')
              ],
              isShortColumn && [
                e('th', { key: 'raw-sc-desc', style: { width: '40%' } }, 'Raw Short Column Input'),
                e('th', { key: 'sc-code', style: { width: '120px', textAlign: 'center' } }, 'Short Column Code'),
                e('th', { key: 'sc-name', style: { width: '180px' } }, 'Short Column Status'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '140px', textAlign: 'right' } }, 'Actions')
              ],
              isSoftStory && [
                e('th', { key: 'raw-ss-desc', style: { width: '40%' } }, 'Raw Soft Story Input'),
                e('th', { key: 'ss-code', style: { width: '120px', textAlign: 'center' } }, 'Soft Story Code'),
                e('th', { key: 'ss-name', style: { width: '180px' } }, 'Soft Story Status'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '140px', textAlign: 'right' } }, 'Actions')
              ],
              isOrnamentation && [
                e('th', { key: 'raw-orn-desc', style: { width: '40%' } }, 'Raw Ornamentation Input'),
                e('th', { key: 'orn-code', style: { width: '120px', textAlign: 'center' } }, 'Ornamentation Code'),
                e('th', { key: 'orn-name', style: { width: '180px' } }, 'Ornamentation Level'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '140px', textAlign: 'right' } }, 'Actions')
              ],
              isBuildingShape && [
                e('th', { key: 'raw-bs-desc', style: { width: '40%' } }, 'Raw Building Shape Input'),
                e('th', { key: 'bs-code', style: { width: '120px', textAlign: 'center' } }, 'Shape Code'),
                e('th', { key: 'bs-name', style: { width: '180px' } }, 'Building Shape Geometry'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '140px', textAlign: 'right' } }, 'Actions')
              ],
              isBuildingCondition && [
                e('th', { key: 'raw-bc-desc', style: { width: '40%' } }, 'Raw Building Condition Input'),
                e('th', { key: 'bc-code', style: { width: '120px', textAlign: 'center' } }, 'Condition Code'),
                e('th', { key: 'bc-name', style: { width: '180px' } }, 'Building Condition Status'),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Validation Status'),
                e('th', { key: 'actions', style: { width: '140px', textAlign: 'right' } }, 'Actions')
              ],
              isRoofYear && [
                e('th', { key: 'raw-yb', style: { width: '22%' } }, 'Year Built (Col 1)'),
                e('th', { key: 'raw-ry', style: { width: '22%' } }, 'Roof Year Built (Col 2)'),
                e('th', { key: 'clean-ry', style: { width: '26%' } },
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' } },
                    e('span', null, 'Cleaned Roof Year (≥ YB)'),
                    e('button', {
                      type: 'button',
                      className: 'btn-col-header-copy',
                      title: 'Copy Cleaned Roof Years for Excel',
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
              isCoordinates && [
                e('th', { key: 'raw-lat', style: { width: '20%' } }, 'Latitude (Input)'),
                e('th', { key: 'raw-long', style: { width: '20%' } }, 'Longitude (Input)'),
                e('th', { key: 'clean-lat', style: { width: '22%' } },
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' } },
                    e('span', null, 'Latitude (DD 6 Dec)'),
                    e('button', {
                      type: 'button',
                      className: 'btn-col-header-copy',
                      title: 'Copy Converted Latitude Column for Excel',
                      onClick: (evt) => {
                        evt.stopPropagation();
                        if (window.copyLatitudeColumn) window.copyLatitudeColumn();
                      }
                    }, '📋 Copy Lat')
                  )
                ),
                e('th', { key: 'clean-long', style: { width: '22%' } },
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' } },
                    e('span', null, 'Longitude (DD 6 Dec)'),
                    e('button', {
                      type: 'button',
                      className: 'btn-col-header-copy',
                      title: 'Copy Converted Longitude Column for Excel',
                      onClick: (evt) => {
                        evt.stopPropagation();
                        if (window.copyLongitudeColumn) window.copyLongitudeColumn();
                      }
                    }, '📋 Copy Long')
                  )
                ),
                e('th', { key: 'status', style: { width: '145px', textAlign: 'center' } }, 'Conversion Status'),
                e('th', { key: 'actions', style: { width: '140px', textAlign: 'right' } }, 'Actions')
              ],
              isSplit && [
                showRaw && e('th', { key: 'raw-addr', style: { width: '22%' } }, 'Raw Address Input'),
                e('th', { key: 'st', style: { width: showRaw ? '18%' : '26%' } }, 'STREET'),
                e('th', { key: 'city', style: { width: '13%' } }, 'City'),
                e('th', { key: 'state', style: { width: '55px', textAlign: 'center' } }, 'State'),
                showCounty && e('th', { key: 'county', style: { width: '12%' } }, 'County'),
                e('th', { key: 'postal', style: { width: '85px' } }, 'Postal'),
                showCountry && e('th', { key: 'country', style: { width: '80px', textAlign: 'center' } }, 'Country'),
                e('th', { key: 'actions', style: { width: '125px', textAlign: 'right' } }, 'Actions')
              ].filter(Boolean),
              (!isConstruction && !isOccupancy && !isSplit && !isRoof && !isWall && !isFoundation && !isRoofYear && !isCoordinates && !isShortColumn && !isSoftStory && !isOrnamentation && !isBuildingShape && !isBuildingCondition) && [
                e('th', { key: 'raw', style: { width: '38%' } },
                  activeColumnId === 'year'
                    ? 'Raw Input Year'
                    : (activeColumnId === 'stores' || activeColumnId === 'stories'
                        ? 'Raw Input (No of Stores)'
                        : 'Raw Input')
                ),
                e('th', { key: 'clean' },
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' } },
                    e('span', null,
                      activeColumnId === 'year'
                        ? 'Cleaned Year (1753–2026)'
                        : (activeColumnId === 'stores' || activeColumnId === 'stories'
                            ? 'Cleaned Stories (Positive Whole No)'
                            : 'Cleaned Result (Excel Column)')
                    ),
                    e('button', {
                      type: 'button',
                      className: 'btn-col-header-copy',
                      title: activeColumnId === 'year'
                        ? 'Copy all Cleaned Years for Excel'
                        : (activeColumnId === 'stores' || activeColumnId === 'stories'
                            ? 'Copy Cleaned Stories for Excel'
                            : 'Copy cleaned column for Excel'),
                      onClick: (evt) => {
                        evt.stopPropagation();
                        if (window.copyForExcel) window.copyForExcel();
                      }
                    }, '📋 Copy Column')
                  )
                ),
                e('th', { key: 'st', style: { width: '145px', textAlign: 'center' } }, 'Status'),
                e('th', { key: 'actions', style: { width: '135px', textAlign: 'right' } }, 'Actions')
              ]
            )
          ),
          e('tbody', null,
            visibleRows.length === 0 ? (
              e('tr', null,
                e('td', {
                  colSpan: (isConstruction || isOccupancy) ? (5 + totalInputCols) : (isRoof ? 9 : ((isRoofYear || isCoordinates) ? 7 : ((isWall || isFoundation || isShortColumn || isSoftStory || isOrnamentation || isBuildingShape || isBuildingCondition) ? 6 : (isSplit ? (6 + (showRaw ? 1 : 0) + (showCounty ? 1 : 0) + (showCountry ? 1 : 0)) : 5)))),
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
                    const extraParts = Array.isArray(r.extraCols) ? r.extraCols.join(' ') : '';
                    const fullSearch = `${r.bldgDesc || ''} ${r.conDesc || ''} ${extraParts}`.trim();
                    const searchUrl = fullSearch ? `https://www.google.com/search?q=${encodeURIComponent(fullSearch + ' Touchstone UNICEDE construction code')}` : '#';
                    
                    const conRawList = [r.col1, r.col2, r.col3, r.existingCode, r.bldgDesc, r.conDesc, ...(Array.isArray(r.extraCols) ? r.extraCols : []), ...(Array.isArray(r.allCols) ? r.allCols : [])];
                    const conKeywords = conRawList.map(k => String(k || '').trim()).filter(k => k && k !== '—' && k !== '-' && k.toLowerCase() !== 'n/a' && !/^\d{3,4}$/.test(k));
                    if (conKeywords.length === 0 && r.original && !/^\d{3,4}$/.test(String(r.original).trim())) conKeywords.push(String(r.original).trim());

                    const isConSaved = Boolean(savedRowsMap[`con-${rowNum}`]) || (
                      Boolean(r.conCode && r.conCode !== '100' && r.conCode !== '—') &&
                      typeof window !== 'undefined' &&
                      window.CustomCodesDB &&
                      typeof window.CustomCodesDB.hasKeyword === 'function' &&
                      window.CustomCodesDB.hasKeyword('construction', r.conCode, conKeywords)
                    );

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { style: { textAlign: 'center' } },
                        r.existingCode ? e('span', { className: 'existing-code-tag' }, r.existingCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-bldg-desc' }, r.bldgDesc || '—'),
                      e('td', { className: 'td-occ-desc' }, r.conDesc || '—'),
                      ...(Array.isArray(r.extraCols) ? r.extraCols.map((extraVal, eIdx) =>
                        e('td', { key: 'extra-' + eIdx, className: 'td-extra-desc' }, extraVal || '—')
                      ) : []),
                      e('td', { className: 'td-occ-code' },
                        r.status === 'empty' ? e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—') :
                        e('span', {
                          className: 'occ-code-badge',
                          title: `Code ${r.conCode} (Click to inspect Touchstone details)`,
                          style: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.conCode, 'construction')
                        }, r.conCode || '100')
                      ),
                      e('td', { className: 'td-occ-cat' },
                        r.status === 'empty' ? e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—') : (r.category || 'Unknown'),
                        r.group && e('br'),
                        r.group && e('small', { style: { color: 'var(--text-muted)', fontSize: '10px' } }, r.group)
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(r.comparisonStatus, r.comparisonMessage, 'Assigned')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.conCode && (isConSaved ? (
                            e('button', {
                              type: 'button',
                              className: 'btn-row-db in-db',
                              title: `✓ Saved in Database for Code ${r.conCode}. Click to view notice & open Database Explorer (or Shift+Click to open definition in new tab)!`,
                              onClick: (evt) => {
                                if (evt.shiftKey || evt.metaKey || evt.ctrlKey) {
                                  window.open(searchUrl, '_blank');
                                } else {
                                  handleSaveRowToDB('construction', r, `con-${rowNum}`);
                                }
                              }
                            }, '✓ In DB ↗')
                          ) : (
                            e('button', {
                              type: 'button',
                              className: 'btn-row-db',
                              title: `Save rule "${conKeywords[0] || ''}" → Code ${r.conCode} to Custom Database`,
                              onClick: () => handleSaveRowToDB('construction', r, `con-${rowNum}`)
                            }, '💾 + DB')
                          )),
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
                            title: 'Lookup Construction Definition (Opens in new tab)'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isOccupancy) {
                    const extraParts = Array.isArray(r.extraCols) ? r.extraCols.join(' ') : '';
                    const fullSearch = `${r.bldgDesc || ''} ${r.occDesc || ''} ${extraParts}`.trim();
                    const searchUrl = fullSearch ? `https://www.google.com/search?q=${encodeURIComponent(fullSearch + ' Touchstone UNICEDE occupancy code')}` : '#';
                    
                    const occRawList = [r.col1, r.col2, r.col3, r.existingCode, r.bldgDesc, r.occDesc, ...(Array.isArray(r.extraCols) ? r.extraCols : []), ...(Array.isArray(r.allCols) ? r.allCols : [])];
                    const occKeywords = occRawList.map(k => String(k || '').trim()).filter(k => k && k !== '—' && k !== '-' && k.toLowerCase() !== 'n/a' && !/^\d{3,4}$/.test(k));
                    if (occKeywords.length === 0 && r.original && !/^\d{3,4}$/.test(String(r.original).trim())) occKeywords.push(String(r.original).trim());

                    const isOccSaved = Boolean(savedRowsMap[`occ-${rowNum}`]) || (
                      Boolean(r.occCode && r.occCode !== '300' && r.occCode !== '—') &&
                      typeof window !== 'undefined' &&
                      window.CustomCodesDB &&
                      typeof window.CustomCodesDB.hasKeyword === 'function' &&
                      window.CustomCodesDB.hasKeyword('occupancy', r.occCode, occKeywords)
                    );

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { style: { textAlign: 'center' } },
                        r.existingCode ? e('span', { className: 'existing-code-tag' }, r.existingCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-bldg-desc' }, r.bldgDesc || '—'),
                      e('td', { className: 'td-occ-desc' }, r.occDesc || '—'),
                      ...(Array.isArray(r.extraCols) ? r.extraCols.map((extraVal, eIdx) =>
                        e('td', { key: 'extra-' + eIdx, className: 'td-extra-desc' }, extraVal || '—')
                      ) : []),
                      e('td', { className: 'td-occ-code' },
                        r.status === 'empty' ? e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—') :
                        e('span', {
                          className: 'occ-code-badge',
                          title: `Code ${r.occCode} (Click to inspect Touchstone details)`,
                          style: { cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.occCode, 'occupancy')
                        }, r.occCode || '300')
                      ),
                      e('td', { className: 'td-occ-cat' },
                        r.status === 'empty' ? e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—') : (r.category || 'Unknown'),
                        r.group && e('br'),
                        r.group && e('small', { style: { color: 'var(--text-muted)', fontSize: '10px' } }, r.group)
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(r.comparisonStatus, r.comparisonMessage, 'Assigned')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.occCode && (isOccSaved ? (
                            e('button', {
                              type: 'button',
                              className: 'btn-row-db in-db',
                              title: `✓ Saved in Database for Code ${r.occCode}. Click to view notice & open Database Explorer (or Shift+Click to open definition in new tab)!`,
                              onClick: (evt) => {
                                if (evt.shiftKey || evt.metaKey || evt.ctrlKey) {
                                  window.open(searchUrl, '_blank');
                                } else {
                                  handleSaveRowToDB('occupancy', r, `occ-${rowNum}`);
                                }
                              }
                            }, '✓ In DB ↗')
                          ) : (
                            e('button', {
                              type: 'button',
                              className: 'btn-row-db',
                              title: `Save rule "${occKeywords[0] || ''}" → Code ${r.occCode} to Custom Database`,
                              onClick: () => handleSaveRowToDB('occupancy', r, `occ-${rowNum}`)
                            }, '💾 + DB')
                          )),
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
                            title: 'Lookup Occupancy Definition (Opens in new tab)'
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
                          style: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)', minWidth: '28px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.geometryCode, 'roof', 'geometry')
                        }, r.geometryCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-pitch', style: { textAlign: 'center' } },
                        r.pitchCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.pitchName ? `${r.pitchName} (Code ${r.pitchCode})` : `Code ${r.pitchCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald-light)', borderColor: 'rgba(16, 185, 129, 0.35)', minWidth: '28px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.pitchCode, 'roof', 'pitch')
                        }, r.pitchCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-cov', style: { textAlign: 'center' } },
                        r.coveringCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.coveringName ? `${r.coveringName} (Code ${r.coveringCode})` : `Code ${r.coveringCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)', minWidth: '28px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.coveringCode, 'roof', 'covering')
                        }, r.coveringCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-deck', style: { textAlign: 'center' } },
                        r.deckCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.deckName ? `${r.deckName} (Code ${r.deckCode})` : `Code ${r.deckCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)', minWidth: '28px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.deckCode, 'roof', 'deck')
                        }, r.deckCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-covatt', style: { textAlign: 'center' } },
                        r.covAttachCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.covAttachName ? `${r.covAttachName} (Code ${r.covAttachCode})` : `Code ${r.covAttachCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.35)', minWidth: '28px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.covAttachCode, 'roof', 'cov_attach')
                        }, r.covAttachCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-dckatt', style: { textAlign: 'center' } },
                        r.deckAttachCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.deckAttachName ? `${r.deckAttachName} (Code ${r.deckAttachCode})` : `Code ${r.deckAttachCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.35)', minWidth: '28px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.deckAttachCode, 'roof', 'deck_attach')
                        }, r.deckAttachCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-roof-anchor', style: { textAlign: 'center' } },
                        r.anchorageCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.anchorageName ? `${r.anchorageName} (Code ${r.anchorageCode})` : `Code ${r.anchorageCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', borderColor: 'rgba(236, 72, 153, 0.35)', minWidth: '28px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.anchorageCode, 'roof', 'anchorage')
                        }, r.anchorageCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(r.status, r.statusText, r.statusText || 'Separated')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          (r.geometryCode || r.pitchCode || r.coveringCode || r.deckCode || r.covAttachCode || r.deckAttachCode || r.anchorageCode) && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `rf-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy 7 Roof Codes to clipboard',
                            onClick: () => handleCopyValue([r.geometryCode || '0', r.pitchCode || '0', r.coveringCode || '0', r.deckCode || '0', r.covAttachCode || '0', r.deckAttachCode || '0', r.anchorageCode || '0'].join('\t'), `rf-${rowNum}`, 'Roof Codes')
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
                    const allWallCodes = [
                      r.wallTypeCode || '0',
                      r.wallSidingCode || '0',
                      r.glassTypeCode || '0',
                      r.glassPercentageCode || '0',
                      r.windowProtectionCode || '0',
                      r.exteriorDoorsCode || '0',
                      r.buildingOpeningCode || '0',
                      r.brickVeneerCode || '0',
                      r.fireRatingCode || '0'
                    ].join('\t');

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', { className: 'td-wall-type', style: { textAlign: 'center' } },
                        r.wallTypeCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.wallTypeName ? `${r.wallTypeName} (Code ${r.wallTypeCode})` : `Code ${r.wallTypeCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(234, 88, 12, 0.15)', color: '#fb923c', borderColor: 'rgba(234, 88, 12, 0.35)', minWidth: '26px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.wallTypeCode, 'wall', 'type')
                        }, r.wallTypeCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-wall-siding', style: { textAlign: 'center' } },
                        r.wallSidingCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.wallSidingName ? `${r.wallSidingName} (Code ${r.wallSidingCode})` : `Code ${r.wallSidingCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.35)', minWidth: '26px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.wallSidingCode, 'wall', 'siding')
                        }, r.wallSidingCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-wall-glass', style: { textAlign: 'center' } },
                        r.glassTypeCode && r.glassTypeCode !== '0' ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.glassTypeName ? `${r.glassTypeName} (Code ${r.glassTypeCode})` : `Code ${r.glassTypeCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)', minWidth: '24px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.glassTypeCode, 'wall', 'glass_type')
                        }, r.glassTypeCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '0')
                      ),
                      e('td', { className: 'td-wall-glasspct', style: { textAlign: 'center' } },
                        r.glassPercentageCode && r.glassPercentageCode !== '0' ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.glassPercentageName ? `${r.glassPercentageName} (Code ${r.glassPercentageCode})` : `Code ${r.glassPercentageCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', borderColor: 'rgba(139, 92, 246, 0.35)', minWidth: '24px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.glassPercentageCode, 'wall', 'glass_pct')
                        }, r.glassPercentageCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '0')
                      ),
                      e('td', { className: 'td-wall-winprot', style: { textAlign: 'center' } },
                        r.windowProtectionCode && r.windowProtectionCode !== '0' ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.windowProtectionName ? `${r.windowProtectionName} (Code ${r.windowProtectionCode})` : `Code ${r.windowProtectionCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.35)', minWidth: '24px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.windowProtectionCode, 'wall', 'window_protection')
                        }, r.windowProtectionCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '0')
                      ),
                      e('td', { className: 'td-wall-doors', style: { textAlign: 'center' } },
                        r.exteriorDoorsCode && r.exteriorDoorsCode !== '0' ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.exteriorDoorsName ? `${r.exteriorDoorsName} (Code ${r.exteriorDoorsCode})` : `Code ${r.exteriorDoorsCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)', minWidth: '24px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.exteriorDoorsCode, 'wall', 'exterior_doors')
                        }, r.exteriorDoorsCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '0')
                      ),
                      e('td', { className: 'td-wall-open', style: { textAlign: 'center' } },
                        r.buildingOpeningCode && r.buildingOpeningCode !== '0' ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.buildingOpeningName ? `${r.buildingOpeningName} (Code ${r.buildingOpeningCode})` : `Code ${r.buildingOpeningCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.35)', minWidth: '24px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.buildingOpeningCode, 'wall', 'opening')
                        }, r.buildingOpeningCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '0')
                      ),
                      e('td', { className: 'td-wall-brickven', style: { textAlign: 'center' } },
                        r.brickVeneerCode && r.brickVeneerCode !== '0' ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.brickVeneerName ? `${r.brickVeneerName} (Code ${r.brickVeneerCode})` : `Code ${r.brickVeneerCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)', minWidth: '24px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.brickVeneerCode, 'wall', 'brick_veneer')
                        }, r.brickVeneerCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '0')
                      ),
                      e('td', { className: 'td-wall-fire', style: { textAlign: 'center' } },
                        r.fireRatingCode && r.fireRatingCode !== '0' ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.fireRatingName ? `${r.fireRatingName} (Code ${r.fireRatingCode})` : `Code ${r.fireRatingCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.35)', minWidth: '24px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.fireRatingCode, 'wall', 'fire_rating')
                        }, r.fireRatingCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '0')
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(r.status, r.statusText, r.statusText || 'Separated')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          (r.wallTypeCode || r.wallSidingCode) && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `wl-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy All 9 Wall Codes (Tab-Delimited)',
                            onClick: () => handleCopyValue(allWallCodes, `wl-${rowNum}`, 'Wall Codes')
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
                  } else if (isFoundationConn) {
                    const searchUrl = 'https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-foundation-detail-fields.html?hl=foundation';
                    const code = r.foundationConnectionCode || r.code || '';
                    const name = r.foundationConnectionName || r.name || r.foundationConnection || 'Unknown';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', { className: 'td-fnd-conn', style: { textAlign: 'center' } },
                        code ? e('span', {
                          className: 'occ-code-badge',
                          title: `Code ${code}: ${name} - Click to inspect`,
                          style: { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(code, 'foundation_connection')
                        }, code) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-fnd-name' },
                        r.status === 'empty' ? e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—') : name
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(r.status, r.statusText, r.statusText || 'Assigned')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          code && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `fndc-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy Connection Code to clipboard',
                            onClick: () => handleCopyValue(r.cleaned || code, `fndc-${rowNum}`, 'Foundation Connection Code')
                          }, copiedRowId === `fndc-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Foundation Connection Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isFoundationType) {
                    const searchUrl = 'https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-foundation-detail-fields.html?hl=foundation';
                    const code = r.foundationTypeCode || r.code || '';
                    const name = r.foundationTypeName || r.name || r.foundationType || 'Unknown';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', { className: 'td-fnd-type', style: { textAlign: 'center' } },
                        code ? e('span', {
                          className: 'occ-code-badge',
                          title: `Code ${code}: ${name} - Click to inspect`,
                          style: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(code, 'foundation_type')
                        }, code) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-fnd-name' },
                        r.status === 'empty' ? e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—') : name
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(r.status, r.statusText, r.statusText || 'Assigned')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          code && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `fndt-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy Foundation Type Code to clipboard',
                            onClick: () => handleCopyValue(r.cleaned || code, `fndt-${rowNum}`, 'Foundation Type Code')
                          }, copiedRowId === `fndt-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Foundation Type Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isFoundationDual) {
                    const searchUrl = 'https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-foundation-detail-fields.html?hl=foundation';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', { className: 'td-fnd-type', style: { textAlign: 'center' } },
                        r.foundationTypeCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.foundationTypeName ? `${r.foundationTypeName} (Code ${r.foundationTypeCode})` : `Code ${r.foundationTypeCode}`) + ' - Click to inspect',
                          style: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center', cursor: 'pointer' },
                          onClick: () => window.openCodeDetailByBadge && window.openCodeDetailByBadge(r.foundationTypeCode, 'foundation')
                        }, r.foundationTypeCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-fnd-desc' },
                        r.status === 'empty' ? e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—') : (r.foundationTypeName || r.foundationType || 'Unknown')
                      ),
                      e('td', { className: 'td-fnd-conn', style: { textAlign: 'center' } },
                        r.foundationConnectionCode ? e('span', {
                          className: 'occ-code-badge',
                          title: (r.foundationConnectionName ? `${r.foundationConnectionName} (Code ${r.foundationConnectionCode})` : `Code ${r.foundationConnectionCode}`),
                          style: { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.35)', minWidth: '32px', display: 'inline-block', textAlign: 'center' }
                        }, r.foundationConnectionCode) : e('span', { style: { color: 'var(--text-muted)', fontSize: '11px' } }, '—')
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(r.status, r.statusText, r.statusText || 'Assigned')
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          (r.foundationTypeCode || r.foundationConnectionCode) && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `fnd-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy Foundation Code to clipboard',
                            onClick: () => handleCopyValue(r.cleaned || r.foundationTypeCode, `fnd-${rowNum}`, 'Foundation Code')
                          }, copiedRowId === `fnd-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Foundation Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isShortColumn) {
                    let badgeCls = 'assigned';
                    let badgeText = r.code === '2' ? '✓ Yes (Code 2)' : (r.code === '1' ? '✓ No (Code 1)' : (r.code === '0' ? '✓ Unknown (Code 0)' : '⚠️ Unrecognized'));
                    if (r.status === 'empty') {
                      badgeCls = 'empty';
                      badgeText = 'Blank';
                    } else if (r.status === 'mismatch' || !r.code) {
                      badgeCls = 'mismatch';
                      badgeText = '⚠️ Unrecognized';
                    } else if (r.status === 'unchanged') {
                      badgeCls = 'match';
                      badgeText = `✓ Valid Code (${r.code})`;
                    }

                    const searchUrl = `https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-user-defined-fields.html?hl=short+column`;

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw-desc', title: r.original }, r.original || '—'),
                      e('td', { className: 'td-sc-code', style: { textAlign: 'center' } },
                        r.code ? e('span', {
                          className: `badge-code-primary ${r.code === '2' ? 'badge-code-accent' : ''}`,
                          style: {
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: r.code === '2' ? 'rgba(239, 68, 68, 0.2)' : (r.code === '1' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'),
                            color: r.code === '2' ? '#f87171' : (r.code === '1' ? 'var(--accent-emerald-light)' : '#94a3b8')
                          }
                        }, `Code ${r.code}`) : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic' } }, '—')
                      ),
                      e('td', { className: 'td-sc-name', style: { fontWeight: '600', color: r.code === '2' ? '#fca5a5' : (r.code === '1' ? 'var(--text-primary)' : 'var(--text-secondary)') } },
                        r.shortColumnName || r.shortColumnShort || '—'
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(badgeCls, r.statusText, badgeText)
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.code && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `sc-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy code "${r.code}" to clipboard`,
                            onClick: () => handleCopyValue(r.code, `sc-${rowNum}`, 'Short Column Code')
                          }, copiedRowId === `sc-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Short Column Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isSoftStory) {
                    let badgeCls = 'assigned';
                    let badgeText = r.code === '2' ? '✓ Yes (Code 2)' : (r.code === '1' ? '✓ No (Code 1)' : (r.code === '0' ? '✓ Unknown (Code 0)' : '⚠️ Unrecognized'));
                    if (r.status === 'empty') {
                      badgeCls = 'empty';
                      badgeText = 'Blank';
                    } else if (r.status === 'mismatch' || !r.code) {
                      badgeCls = 'mismatch';
                      badgeText = '⚠️ Unrecognized';
                    } else if (r.status === 'unchanged') {
                      badgeCls = 'match';
                      badgeText = `✓ Valid Code (${r.code})`;
                    }

                    const searchUrl = `https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-user-defined-fields.html?hl=soft+story`;

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw-desc', title: r.original }, r.original || '—'),
                      e('td', { className: 'td-ss-code', style: { textAlign: 'center' } },
                        r.code ? e('span', {
                          className: `badge-code-primary ${r.code === '2' ? 'badge-code-accent' : ''}`,
                          style: {
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: r.code === '2' ? 'rgba(239, 68, 68, 0.2)' : (r.code === '1' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'),
                            color: r.code === '2' ? '#f87171' : (r.code === '1' ? 'var(--accent-emerald-light)' : '#94a3b8')
                          }
                        }, `Code ${r.code}`) : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic' } }, '—')
                      ),
                      e('td', { className: 'td-ss-name', style: { fontWeight: '600', color: r.code === '2' ? '#fca5a5' : (r.code === '1' ? 'var(--text-primary)' : 'var(--text-secondary)') } },
                        r.softStoryName || r.softStoryShort || '—'
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(badgeCls, r.statusText, badgeText)
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.code && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `ss-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy code "${r.code}" to clipboard`,
                            onClick: () => handleCopyValue(r.code, `ss-${rowNum}`, 'Soft Story Code')
                          }, copiedRowId === `ss-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Soft Story Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isOrnamentation) {
                    let badgeCls = 'assigned';
                    let badgeText = r.code ? `✓ Code ${r.code}` : '⚠️ Unrecognized';
                    if (r.status === 'empty') {
                      badgeCls = 'empty';
                      badgeText = 'Blank';
                    } else if (r.status === 'mismatch' || !r.code) {
                      badgeCls = 'mismatch';
                      badgeText = '⚠️ Unrecognized';
                    } else if (r.status === 'unchanged') {
                      badgeCls = 'match';
                      badgeText = `✓ Valid Code (${r.code})`;
                    }

                    const searchUrl = `https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-user-defined-fields.html?hl=ornamentation`;

                    // Color palette for ornamentation codes
                    const codeColors = {
                      '0': { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
                      '1': { bg: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' },
                      '2': { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' },
                      '3': { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }
                    };
                    const colorStyle = codeColors[r.code] || { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' };

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw-desc', title: r.original }, r.original || '—'),
                      e('td', { className: 'td-orn-code', style: { textAlign: 'center' } },
                        r.code ? e('span', {
                          className: 'badge-code-primary',
                          style: {
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: colorStyle.bg,
                            color: colorStyle.color
                          }
                        }, `Code ${r.code}`) : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic' } }, '—')
                      ),
                      e('td', { className: 'td-orn-name', style: { fontWeight: '600', color: colorStyle.color } },
                        r.ornamentationName || r.ornamentationShort || '—'
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(badgeCls, r.statusText, badgeText)
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.code && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `orn-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy code "${r.code}" to clipboard`,
                            onClick: () => handleCopyValue(r.code, `orn-${rowNum}`, 'Ornamentation Code')
                          }, copiedRowId === `orn-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Ornamentation Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isBuildingShape) {
                    let badgeCls = 'assigned';
                    let badgeText = r.code ? `✓ Code ${r.code}` : '⚠️ Unrecognized';
                    if (r.status === 'empty') {
                      badgeCls = 'empty';
                      badgeText = 'Blank';
                    } else if (r.status === 'mismatch' || !r.code) {
                      badgeCls = 'mismatch';
                      badgeText = '⚠️ Unrecognized';
                    } else if (r.status === 'unchanged') {
                      badgeCls = 'match';
                      badgeText = `✓ Valid Code (${r.code})`;
                    }

                    const searchUrl = `https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-user-defined-fields.html?hl=building+shape`;

                    // Color palette for shape codes
                    const codeColors = {
                      '0': { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
                      '1': { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' },
                      '2': { bg: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' },
                      '3': { bg: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' },
                      '4': { bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' },
                      '5': { bg: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' },
                      '6': { bg: 'rgba(14, 165, 233, 0.2)', color: '#7dd3fc' },
                      '7': { bg: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' },
                      '8': { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }
                    };
                    const colorStyle = codeColors[r.code] || { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' };

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw-desc', title: r.original }, r.original || '—'),
                      e('td', { className: 'td-bs-code', style: { textAlign: 'center' } },
                        r.code ? e('span', {
                          className: 'badge-code-primary',
                          style: {
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: colorStyle.bg,
                            color: colorStyle.color
                          }
                        }, `Code ${r.code}`) : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic' } }, '—')
                      ),
                      e('td', { className: 'td-bs-name', style: { fontWeight: '600', color: colorStyle.color } },
                        r.buildingShapeName || r.buildingShapeShort || '—'
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(badgeCls, r.statusText, badgeText)
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.code && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `bs-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy code "${r.code}" to clipboard`,
                            onClick: () => handleCopyValue(r.code, `bs-${rowNum}`, 'Building Shape Code')
                          }, copiedRowId === `bs-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Building Shape Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isBuildingCondition) {
                    let badgeCls = 'assigned';
                    let badgeText = r.code ? `✓ Code ${r.code}` : '⚠️ Unrecognized';
                    if (r.status === 'empty') {
                      badgeCls = 'empty';
                      badgeText = 'Blank';
                    } else if (r.status === 'mismatch' || !r.code) {
                      badgeCls = 'mismatch';
                      badgeText = '⚠️ Unrecognized';
                    } else if (r.status === 'unchanged') {
                      badgeCls = 'match';
                      badgeText = `✓ Valid Code (${r.code})`;
                    }

                    const searchUrl = `https://unicede.air-worldwide.com/ts-tsre_all/help_ts_exposure-data_loc-user-defined-fields.html?hl=building+condition`;

                    // Color palette for building condition codes
                    const codeColors = {
                      '0': { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
                      '1': { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' },
                      '2': { bg: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' },
                      '3': { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }
                    };
                    const colorStyle = codeColors[r.code] || { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' };

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw-desc', title: r.original }, r.original || '—'),
                      e('td', { className: 'td-bc-code', style: { textAlign: 'center' } },
                        r.code ? e('span', {
                          className: 'badge-code-primary',
                          style: {
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: colorStyle.bg,
                            color: colorStyle.color
                          }
                        }, `Code ${r.code}`) : e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic' } }, '—')
                      ),
                      e('td', { className: 'td-bc-name', style: { fontWeight: '600', color: colorStyle.color } },
                        r.buildingConditionName || r.buildingConditionShort || '—'
                      ),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(badgeCls, r.statusText, badgeText)
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.code && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `bc-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy code "${r.code}" to clipboard`,
                            onClick: () => handleCopyValue(r.code, `bc-${rowNum}`, 'Building Condition Code')
                          }, copiedRowId === `bc-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', {
                            href: searchUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: 'View Touchstone UNICEDE® Building Condition Specifications'
                          }, '🔍 Info')
                        )
                      )
                    );
                  } else if (isCoordinates) {
                    let badgeCls = 'assigned';
                    let badgeText = r.statusText || '✓ Converted (DMS➔DD)';
                    if (r.isLatMissing && r.isLongMissing) {
                      badgeCls = 'empty';
                      badgeText = 'Missing Coordinates';
                    } else if (r.isLatMissing || r.isLongMissing) {
                      badgeCls = 'mismatch';
                      badgeText = r.isLatMissing ? '⚠️ Missing Lat' : '⚠️ Missing Long';
                    } else if (r.status === 'match' || r.statusText === '✓ Already Decimal') {
                      badgeCls = 'match';
                      badgeText = '✓ Already Decimal';
                    } else {
                      badgeCls = 'assigned';
                      badgeText = '✓ Converted (DMS➔DD)';
                    }

                    const hasValidCoords = !r.isLatMissing && !r.isLongMissing && !isNaN(Number(r.lat)) && !isNaN(Number(r.long));
                    const mapUrl = hasValidCoords ? `https://www.google.com/maps?q=${r.lat},${r.long}` : '#';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', {
                        className: 'td-raw-lat',
                        style: {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '500',
                          color: r.rawLat ? 'var(--text-primary)' : 'var(--text-muted)'
                        }
                      }, r.rawLat || e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' } }, '— (Blank)')),
                      e('td', {
                        className: 'td-raw-long',
                        style: {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '500',
                          color: r.rawLong ? 'var(--text-primary)' : 'var(--text-muted)'
                        }
                      }, r.rawLong || e('span', { style: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' } }, '— (Blank)')),
                      e('td', {
                        className: 'td-clean-lat',
                        style: {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          color: r.isLatMissing ? 'var(--text-muted)' : 'var(--accent-emerald-light)'
                        }
                      }, r.isLatMissing ? e('span', { style: { color: '#f87171', fontStyle: 'italic', fontWeight: 'bold' } }, 'Missing') : e('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                        e('span', null, r.lat),
                        e('button', {
                          type: 'button',
                          className: `btn-inline-copy ${copiedRowId === `lat-cell-${rowNum}` ? 'copied' : ''}`,
                          title: `Copy latitude "${r.lat}"`,
                          onClick: () => handleCopyValue(r.lat, `lat-cell-${rowNum}`, 'Latitude')
                        }, copiedRowId === `lat-cell-${rowNum}` ? '✓' : '📋')
                      )),
                      e('td', {
                        className: 'td-clean-long',
                        style: {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          color: r.isLongMissing ? 'var(--text-muted)' : 'var(--accent-cyan)'
                        }
                      }, r.isLongMissing ? e('span', { style: { color: '#f87171', fontStyle: 'italic', fontWeight: 'bold' } }, 'Missing') : e('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                        e('span', null, r.long),
                        e('button', {
                          type: 'button',
                          className: `btn-inline-copy ${copiedRowId === `long-cell-${rowNum}` ? 'copied' : ''}`,
                          title: `Copy longitude "${r.long}"`,
                          onClick: () => handleCopyValue(r.long, `long-cell-${rowNum}`, 'Longitude')
                        }, copiedRowId === `long-cell-${rowNum}` ? '✓' : '📋')
                      )),
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
                        getStatusBadge(badgeCls, r.statusText, badgeText)
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `coord-row-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy converted coordinates "${r.lat}\t${r.long}" to clipboard`,
                            onClick: () => handleCopyValue(`${r.lat}\t${r.long}`, `coord-row-${rowNum}`, 'Coordinates (Lat & Long)')
                          }, copiedRowId === `coord-row-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          hasValidCoords && e('a', {
                            href: mapUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'btn-maps',
                            title: `View coordinates (${r.lat}, ${r.long}) on Google Maps`
                          }, '📍 Map')
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
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } },
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
                    const fullAddr = [r.street, r.city, r.state, r.county, r.postal, r.country].filter(Boolean).join(', ');
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;

                    const copyParts = [];
                    if (showRaw) copyParts.push(r.original || '');
                    copyParts.push(r.street || '', r.city || '', r.state || '');
                    if (showCounty) copyParts.push(r.county || '');
                    copyParts.push(r.postal || '');
                    if (showCountry) copyParts.push(r.country || '');

                    // Country pill styling
                    let countryClass = 'country-badge';
                    const cUpper = String(r.country || '').toUpperCase();
                    if (['GB', 'UK', 'UNITED KINGDOM'].includes(cUpper)) countryClass += ' country-uk';
                    else if (['US', 'USA', 'UNITED STATES'].includes(cUpper)) countryClass += ' country-us';
                    else if (['CA', 'CANADA'].includes(cUpper)) countryClass += ' country-ca';
                    else if (['AU', 'AUSTRALIA'].includes(cUpper)) countryClass += ' country-au';
                    else if (['DE', 'GERMANY'].includes(cUpper)) countryClass += ' country-de';

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      showRaw && e('td', { className: 'td-raw-addr', title: r.original }, r.original || '—'),
                      e('td', { className: 'td-street' }, r.street || '—'),
                      e('td', { className: 'td-city' }, r.city || '—'),
                      e('td', { className: 'td-state' }, r.state ? e('span', { className: 'state-pill' }, r.state) : '—'),
                      showCounty && e('td', { className: 'td-county' }, r.county || '—'),
                      e('td', { className: 'td-postal' }, r.postal || '—'),
                      showCountry && e('td', { className: 'td-country', style: { textAlign: 'center' } },
                        r.country ? e('span', { className: countryClass }, r.country) : '—'
                      ),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          fullAddr && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === `sp-${rowNum}` ? 'copied' : ''}`,
                            title: 'Copy split address row to clipboard',
                            onClick: () => handleCopyValue(copyParts.join('\t'), `sp-${rowNum}`, 'Address')
                          }, copiedRowId === `sp-${rowNum}` ? '✓ Copied' : '📋 Copy'),
                          e('a', { href: mapsUrl, target: '_blank', rel: 'noopener noreferrer', className: 'btn-maps', title: 'View on Maps' }, '🗺️ Maps')
                        )
                      )
                    );
                  } else {
                    const isYear = activeColumnId === 'year';
                    const isStores = activeColumnId === 'stores' || activeColumnId === 'stories';
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
                    } else if (isStores) {
                      if (!r.original?.trim() || !r.cleaned) {
                        statusKey = 'empty';
                        defaultText = 'Blank';
                      } else if (r.original.trim() === r.cleaned) {
                        statusKey = 'match';
                        defaultText = '✓ Valid Stories';
                      } else {
                        statusKey = 'assigned';
                        defaultText = r.statusText || `✨ Max (${r.cleaned})`;
                      }
                    }

                    const searchUrl = r.cleaned ? `https://www.google.com/search?q=${encodeURIComponent(isStores ? ('Number of Stories ' + r.cleaned) : ('Year Built ' + r.cleaned))}` : '#';
                    const mapsUrl = r.cleaned ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.cleaned)}` : '#';
                    const isMonoSpecial = isYear || isStores;

                    return e('tr', { key: String(rowNum) },
                      e('td', { className: 'td-num' }, rowNum),
                      e('td', { className: 'td-raw' }, r.original || '—'),
                      e('td', {
                        className: 'td-cleaned',
                        style: isMonoSpecial ? {
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          color: r.cleaned ? 'var(--accent-emerald-light)' : 'var(--text-muted)'
                        } : {}
                      }, isMonoSpecial ? (
                        r.cleaned ? e('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                          e('span', null, r.cleaned),
                          e('button', {
                            type: 'button',
                            className: `btn-inline-copy ${copiedRowId === `cell-${rowNum}` ? 'copied' : ''}`,
                            title: `Copy ${isStores ? 'stories' : 'year'} "${r.cleaned}"`,
                            onClick: () => handleCopyValue(r.cleaned, `cell-${rowNum}`, isStores ? 'Stories' : 'Year')
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
                      e('td', { className: 'td-status', style: { textAlign: 'center', whiteSpace: 'nowrap' } }, getStatusBadge(statusKey, r.statusText || '', defaultText)),
                      e('td', { className: 'td-actions', style: { textAlign: 'right', whiteSpace: 'nowrap' } },
                        e('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' } },
                          r.cleaned && e('button', {
                            type: 'button',
                            className: `btn-row-copy ${copiedRowId === rowNum ? 'copied' : ''}`,
                            title: `Copy "${r.cleaned}" to clipboard`,
                            onClick: () => handleCopyValue(r.cleaned, rowNum, isStores ? 'Stories' : (isYear ? 'Year' : ''))
                          }, copiedRowId === rowNum ? '✓ Copied' : '📋 Copy'),
                          r.cleaned && (isMonoSpecial
                            ? e('a', { href: searchUrl, target: '_blank', rel: 'noopener noreferrer', className: 'btn-maps', title: isStores ? 'Search Stories' : 'Search Year' }, '🔍 Info')
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
              if (isConstruction || isOccupancy) {
                const header = dynamicColHeaders.map(h => h.title).concat(['Touchstone Code', 'Touchstone Category', 'Status']).join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  const row = [r.existingCode || '', r.bldgDesc || '', (isConstruction ? r.conDesc : r.occDesc) || ''];
                  if (Array.isArray(r.extraCols)) {
                    row.push(...r.extraCols);
                  }
                  row.push(
                    isConstruction ? (r.conCode || '100') : (r.occCode || '300'),
                    r.category || '',
                    r.comparisonMessage || ''
                  );
                  lines.push(row.join('\t'));
                });
                return lines.join('\n');
              } else if (isRoof) {
                const header = ['1. Roof Geometry', '2. Roof Pitch', '3. Roof Covering', '4. Roof Deck', '5. Roof Covering Attachment', '6. Roof Deck Attachment', '7. Roof Anchorage'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.geometryCode || '', r.pitchCode || '', r.coveringCode || '', r.deckCode || '', r.covAttachCode || '', r.deckAttachCode || '', r.anchorageCode || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isWall) {
                const header = ['1. WallType', '2. WallSiding', '3. Glass Type', '4. Glass %', '5. Window Protection', '6. Exterior Doors', '7. Openings %', '8. Brick Veneer %', '9. Fire Rating'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([
                    r.wallTypeCode || '0',
                    r.wallSidingCode || '0',
                    r.glassTypeCode || '0',
                    r.glassPercentageCode || '0',
                    r.windowProtectionCode || '0',
                    r.exteriorDoorsCode || '0',
                    r.buildingOpeningCode || '0',
                    r.brickVeneerCode || '0',
                    r.fireRatingCode || '0'
                  ].join('\t'));
                });
                return lines.join('\n');
              } else if (isShortColumn) {
                const header = ['Short Column Code', 'Short Column Name', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.code || '', r.shortColumnName || '', r.statusText || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isSoftStory) {
                const header = ['Soft Story Code', 'Soft Story Name', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.code || '', r.softStoryName || '', r.statusText || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isOrnamentation) {
                const header = ['Ornamentation Code', 'Ornamentation Level', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.code || '', r.ornamentationName || '', r.statusText || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isBuildingShape) {
                const header = ['Building Shape Code', 'Building Shape Name', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.code || '', r.buildingShapeName || '', r.statusText || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isBuildingCondition) {
                const header = ['Building Condition Code', 'Building Condition Name', 'Status'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.code || '', r.buildingConditionName || '', r.statusText || ''].join('\t'));
                });
                return lines.join('\n');
              } else if (isCoordinates) {
                const header = ['Latitude', 'Longitude'].join('\t');
                const lines = [header];
                filteredRows.forEach(r => {
                  lines.push([r.lat || 'Missing', r.long || 'Missing'].join('\t'));
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
                const headerParts = [];
                if (showRaw) headerParts.push('Raw Address Input');
                headerParts.push('STREET', 'City', 'State');
                if (showCounty) headerParts.push('County');
                headerParts.push('Postal');
                if (showCountry) headerParts.push('Country');
                const lines = [headerParts.join('\t')];
                filteredRows.forEach(r => {
                  const rowParts = [];
                  if (showRaw) rowParts.push(r.original || '');
                  rowParts.push(r.street || '', r.city || '', r.state || '');
                  if (showCounty) rowParts.push(r.county || '');
                  rowParts.push(r.postal || '');
                  if (showCountry) rowParts.push(r.country || '');
                  lines.push(rowParts.join('\t'));
                });
                return lines.join('\n');
              } else {
                return filteredRows.map(r => r.cleaned || '').join('\n');
              }
            }, [filteredRows, isConstruction, isOccupancy, isSplit, isRoof, isWall, isRoofYear, isCoordinates, col1Title, col2Title, col3Title, showRaw, showCounty, showCountry])
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
