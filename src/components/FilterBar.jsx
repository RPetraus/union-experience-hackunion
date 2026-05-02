import { useMemo, useState } from "react";
import { categories } from "../data/campusItems";
import { getSearchSuggestions } from "../utils/search";

function getCategory(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

function formatMatchReasons(reasons) {
  if (!reasons || reasons.length === 0) return null;
  return reasons.slice(0, 3).join(", ");
}

export default function FilterBar({
  activeCategories,
  onToggleCategory,
  onShowAll,
  onClear,
  searchTerm,
  onSearchChange,
  searchResults,
  allItems,
  onSelectItem,
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const hasSearch = searchTerm.trim().length > 0;

  const topMatches = useMemo(() => {
    return searchResults.slice(0, 7);
  }, [searchResults]);

  const suggestions = useMemo(() => {
    return getSearchSuggestions(allItems, activeCategories, 10);
  }, [allItems, activeCategories]);

  function handleSelectSearchResult(item) {
    onSelectItem(item, { clearSearch: true });
    setSearchFocused(false);
  }

  return (
    <section className="filter-card">
      <div className="control-grid">
        <div className="category-control">
          <div className="filter-header">
            <h2>What do you need?</h2>

            <div className="filter-actions">
              <button type="button" onClick={onShowAll}>
                Show all
              </button>
              <button type="button" onClick={onClear}>
                Clear
              </button>
            </div>
          </div>

          <div className="filter-grid">
            {categories.map((category) => {
              const isActive = activeCategories.includes(category.id);

              return (
                <button
                  key={category.id}
                  className={`filter-pill ${isActive ? "active" : ""}`}
                  style={{ "--category-color": category.color }}
                  onClick={() => onToggleCategory(category.id)}
                  type="button"
                >
                  <span>{category.emoji}</span>
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="search-control">
          <div className="search-top-row">
            <div>
              <label htmlFor="search">Search Union</label>
              <p>Type to find places, food, services, or events.</p>
            </div>

            {hasSearch && (
              <button
                type="button"
                className="clear-search-btn"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSearchChange("")}
              >
                Clear
              </button>
            )}
          </div>

          <div className="search-box-area">
            <div className="search-input-wrap">
              <span aria-hidden="true">🔎</span>
              <input
                id="search"
                value={searchTerm}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => setSearchFocused(false), 120);
                }}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Pizza, vegan, counseling, clubs..."
                autoComplete="off"
              />
            </div>

            {searchFocused && hasSearch && (
              <div className="search-dropdown">
                <div className="dropdown-heading">
                  <span>Live matches</span>
                  <strong>{searchResults.length}</strong>
                </div>

                {topMatches.length === 0 ? (
                  <div className="dropdown-empty">
                    <strong>No matches yet</strong>
                    <p>
                      Try food, coffee, safety, library, clubs, sick, or
                      stressed.
                    </p>
                  </div>
                ) : (
                  topMatches.map((item) => {
                    const category = getCategory(item.category);
                    const matchReasons = formatMatchReasons(item.matchReasons);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="dropdown-result"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectSearchResult(item)}
                      >
                        <span
                          className="dropdown-dot"
                          style={{ backgroundColor: category?.color }}
                        />

                        <div>
                          <strong>
                            {category?.emoji} {item.name}
                          </strong>
                          <p>{item.short}</p>
                          {matchReasons && (
                            <small>Matched: {matchReasons}</small>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {searchFocused && !hasSearch && suggestions.length > 0 && (
              <div className="search-dropdown suggestion-dropdown">
                <div className="dropdown-heading">
                  <span>Try searching</span>
                </div>

                <div className="suggestion-menu">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onSearchChange(suggestion);
                        setSearchFocused(true);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}