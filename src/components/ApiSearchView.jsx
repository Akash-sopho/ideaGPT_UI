import { useState, useEffect, useCallback } from 'react';
import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';
import { fetchCatalog } from '../api/catalog';
import { searchApis } from '../api/search';

const cfg = () => appConfig.ideaScreen?.apiSearch || {};

function getFilterOptions(apis) {
  if (!apis || !apis.length) return {};
  const domains = new Set();
  const methods = new Set();
  const readiness = new Set();
  const teams = new Set();
  const apiEfficiency = new Set();
  const tags = new Set();
  apis.forEach((api) => {
    if (api.domain) domains.add(api.domain);
    if (api.method) methods.add(api.method);
    if (api.readiness) readiness.add(api.readiness);
    if (api.team) teams.add(api.team);
    if (api.api_efficiency) apiEfficiency.add(api.api_efficiency);
    (api.tags || []).forEach((t) => tags.add(t));
  });
  return {
    domains: [...domains].sort(),
    methods: [...methods].sort(),
    readiness: [...readiness].sort(),
    teams: [...teams].sort(),
    apiEfficiency: [...apiEfficiency].sort(),
    tags: [...tags].sort(),
  };
}

function filterCatalog(apis, filters) {
  if (!apis || !apis.length) return [];
  return apis.filter((api) => {
    if (filters.domains.length && !filters.domains.includes(api.domain)) return false;
    if (filters.methods.length && !filters.methods.includes(api.method)) return false;
    if (filters.readiness.length && !filters.readiness.includes(api.readiness)) return false;
    if (filters.teams.length && !filters.teams.includes(api.team)) return false;
    if (filters.apiEfficiency.length && !filters.apiEfficiency.includes(api.api_efficiency)) return false;
    if (filters.tags.length) {
      const apiTags = api.tags || [];
      if (!filters.tags.some((t) => apiTags.includes(t))) return false;
    }
    return true;
  });
}

export function ApiSearchView() {
  const [searchDescription, setSearchDescription] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [catalogApis, setCatalogApis] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [filters, setFilters] = useState({
    domains: [],
    methods: [],
    readiness: [],
    teams: [],
    apiEfficiency: [],
    tags: [],
  });
  const [filterOpen, setFilterOpen] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchCatalog()
      .then(({ apis }) => {
        if (!cancelled) {
          setCatalogApis(apis || []);
          setCatalogLoaded(true);
          setCatalogError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCatalogError(err.message || cfg().catalogUnavailable || 'Catalog unavailable');
          setCatalogLoaded(true);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const runSearch = useCallback(async () => {
    const q = searchDescription.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const { results } = await searchApis(q);
      setSearchResults(results || []);
    } catch (err) {
      setSearchError(err.message || cfg().searchFailed || 'Search failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchDescription]);

  const hasSearchQuery = searchDescription.trim().length > 0;
  const showSemanticResults = hasSearchQuery && searchResults !== null;
  const filterOptions = getFilterOptions(catalogApis);
  const filteredCatalog = filterCatalog(catalogApis, filters);
  const displayList = showSemanticResults ? searchResults : filteredCatalog;
  const isListAll = !showSemanticResults;

  return (
    <div style={{ maxWidth: 720, margin: '24px auto 0' }}>
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 20,
          boxShadow: '0 8px 40px rgba(26,39,68,0.07)',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <label htmlFor="api-search-input" style={{ display: 'block', fontSize: 12, color: theme.muted, marginBottom: 6, fontFamily: fonts.sans }}>
              {cfg().searchPlaceholder || 'Describe the API or capability you need…'}
            </label>
            <input
              id="api-search-input"
              type="text"
              value={searchDescription}
              onChange={(e) => setSearchDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder={cfg().searchPlaceholder || 'e.g. get customer orders, process payment…'}
              disabled={searchLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: fonts.sans,
                color: theme.ink,
                background: theme.surface,
              }}
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={searchLoading || !searchDescription.trim()}
            style={{
              padding: '12px 20px',
              background: theme.navy,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: fonts.sans,
              cursor: searchLoading || !searchDescription.trim() ? 'not-allowed' : 'pointer',
              opacity: searchLoading || !searchDescription.trim() ? 0.6 : 1,
            }}
          >
            {searchLoading ? '…' : (cfg().searchCta || 'Search')}
          </button>
        </div>
        {searchError && (
          <p style={{ margin: '12px 0 0', fontSize: 13, color: theme.red }}>{searchError}</p>
        )}
      </div>

      {isListAll && catalogLoaded && filterOptions.domains?.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: theme.muted, fontFamily: fonts.sans }}>Filters:</span>
          {['domains', 'methods', 'readiness', 'teams', 'apiEfficiency'].map((key) => {
            const options = filterOptions[key] || [];
            const selected = filters[key] || [];
            if (!options.length) return null;
            const label = key === 'apiEfficiency' ? 'Efficiency' : key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <div key={key} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setFilterOpen(filterOpen === key ? null : key)}
                  style={{
                    padding: '6px 12px',
                    background: selected.length ? theme.blueBg : theme.alt,
                    border: `1px solid ${selected.length ? theme.blueBorder : theme.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: fonts.sans,
                    color: theme.ink,
                    cursor: 'pointer',
                  }}
                >
                  {label} {selected.length ? `(${selected.length})` : ''} ▾
                </button>
                {filterOpen === key && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 4,
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: 8,
                      maxHeight: 200,
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      minWidth: 160,
                    }}
                  >
                    {options.map((opt) => {
                      const isSelected = selected.includes(opt);
                      return (
                        <label key={opt} style={{ display: 'block', fontSize: 12, cursor: 'pointer', marginBottom: 4 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setFilters((prev) => ({
                                ...prev,
                                [key]: isSelected ? prev[key].filter((x) => x !== opt) : [...prev[key], opt],
                              }));
                            }}
                            style={{ marginRight: 8 }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {catalogError && catalogLoaded && (
        <p style={{ color: theme.red, fontSize: 14, marginBottom: 16 }}>{catalogError}</p>
      )}

      {!catalogLoaded && !showSemanticResults && (
        <p style={{ color: theme.muted, fontSize: 14 }}>Loading catalog…</p>
      )}

      {catalogLoaded && !hasSearchQuery && !catalogError && (
        <p style={{ color: theme.faint, fontSize: 13, marginBottom: 16 }}>
          {cfg().emptyDescription || 'Describe what you need to find relevant APIs, or browse all below.'}
        </p>
      )}

      {displayList.length > 0 && (
        <p style={{ fontSize: 13, color: theme.muted, marginBottom: 12 }}>
          {displayList.length} {cfg().resultCount || 'result(s)'}
        </p>
      )}

      {showSemanticResults && !searchLoading && searchResults?.length === 0 && (
        <p style={{ color: theme.muted, fontSize: 14 }}>{cfg().noResults || 'No matching APIs.'}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayList.map((api, idx) => {
          const isSemantic = showSemanticResults;
          const name = api.name || api.api_id || 'Unknown';
          const description = api.description || '';
          const method = api.method;
          const endpoint = api.endpoint || api.path || '';
          const score = api.score;
          const matchType = api.match_type;
          const enhancementSuggestion = api.enhancement_suggestion;
          const tags = api.tags || [];
          const domain = api.domain;
          const team = api.team;
          const readiness = api.readiness;

          return (
            <div
              key={api.api_id || api.id || idx}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: '16px 20px',
                boxShadow: '0 2px 12px rgba(26,39,68,0.06)',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: fonts.serif, color: theme.ink }}>
                  {name}
                </span>
                {isSemantic && matchType && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontFamily: fonts.mono,
                      background: matchType === 'direct' ? theme.greenBg : matchType === 'closest' ? theme.amberBg : theme.alt,
                      border: `1px solid ${matchType === 'direct' ? theme.greenBorder : matchType === 'closest' ? theme.amberBorder : theme.border}`,
                      color: matchType === 'direct' ? theme.green : matchType === 'closest' ? theme.amber : theme.muted,
                    }}
                  >
                    {matchType === 'direct' && (cfg().matchTypeDirect || 'Direct match')}
                    {matchType === 'closest' && (cfg().matchTypeClosest || 'Closest match')}
                    {matchType === 'no_match' && (cfg().matchTypeNoMatch || 'No match')}
                  </span>
                )}
                {isSemantic && typeof score === 'number' && (
                  <span style={{ fontSize: 12, color: theme.muted, fontFamily: fonts.mono }}>
                    {Math.round(score * 100)}%
                  </span>
                )}
                {(method || endpoint) && (
                  <span style={{ fontSize: 12, fontFamily: fonts.mono, color: theme.blue }}>
                    {method} {endpoint}
                  </span>
                )}
              </div>
              {description && (
                <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, margin: '0 0 8px' }}>
                  {description.length > 200 ? description.slice(0, 200) + '…' : description}
                </p>
              )}
              {(domain || team || readiness) && (
                <div style={{ fontSize: 12, color: theme.faint, marginBottom: 8 }}>
                  {[domain, team, readiness].filter(Boolean).join(' · ')}
                </div>
              )}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.slice(0, 8).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: theme.alt,
                        color: theme.muted,
                        fontFamily: fonts.sans,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {enhancementSuggestion && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    background: theme.amberBg,
                    border: `1px solid ${theme.amberBorder}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: theme.ink,
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ fontSize: 12, color: theme.amber }}>Suggestion: </strong>
                  {enhancementSuggestion}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
