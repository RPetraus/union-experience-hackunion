import { useEffect, useMemo, useState } from "react";
import CampusMap from "./components/CampusMap.jsx";
import FilterBar from "./components/FilterBar.jsx";
import SidePanel from "./components/SidePanel.jsx";
import EventCalendar from "./components/EventCalendar.jsx";
import { campusItems, categories } from "./data/campusItems.js";

function buildSearchText(item) {
  return [
    item.name,
    item.category,
    item.type,
    item.location,
    item.hours,
    item.short,
    item.description,
    item.sourceNote,
    item.availabilityStatus,
    ...(item.tags || []),
    ...(item.menuHighlights || []),
    ...(item.dietaryNotes || []),
    ...(item.tools || []),
    ...(item.scheduleHighlights || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getSearchResults(items, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return [];

  return items
    .filter((item) => buildSearchText(item).includes(normalizedQuery))
    .map((item) => ({
      ...item,
      matchReasons: [
        item.name?.toLowerCase().includes(normalizedQuery) ? "name" : null,
        item.category?.toLowerCase().includes(normalizedQuery)
          ? "category"
          : null,
        item.type?.toLowerCase().includes(normalizedQuery) ? "type" : null,
        item.location?.toLowerCase().includes(normalizedQuery)
          ? "location"
          : null,
        item.availabilityStatus?.toLowerCase().includes(normalizedQuery)
          ? "availability"
          : null,
        item.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
          ? "tags"
          : null,
      ].filter(Boolean),
    }));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getAvailabilityStatus(available, capacity) {
  if (!capacity || available <= 0) return "Full";

  const ratio = available / capacity;

  if (ratio <= 0.15) return "Nearly full";
  if (ratio <= 0.35) return "Limited";
  if (ratio <= 0.65) return "Available";
  return "Open";
}

function getParkingDelta(capacity) {
  const maxStep = capacity >= 80 ? 5 : capacity >= 50 ? 4 : capacity >= 25 ? 3 : 1;
  return Math.floor(Math.random() * (maxStep * 2 + 1)) - maxStep;
}

function updateLiveParking(items, isInitial = false) {
  return items.map((item) => {
    const isParking =
      item.category === "parking" &&
      typeof item.capacity === "number" &&
      typeof item.available === "number";

    if (!isParking) return item;

    const nextAvailable = isInitial
      ? item.available
      : clamp(item.available + getParkingDelta(item.capacity), 0, item.capacity);

    return {
      ...item,
      available: nextAvailable,
      availabilityStatus: getAvailabilityStatus(nextAvailable, item.capacity),
      lastUpdated: isInitial
        ? "Live demo: updated just now"
        : `Live demo: updated ${new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}`,
    };
  });
}

export default function App() {
  const [liveItems, setLiveItems] = useState(() =>
    updateLiveParking(campusItems, true)
  );

  const [activeCategories, setActiveCategories] = useState(
    categories.map((category) => category.id)
  );
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLiveItems((currentItems) => updateLiveParking(currentItems));
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, []);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return liveItems.find((item) => item.id === selectedItemId) || null;
  }, [liveItems, selectedItemId]);

  const visibleItems = useMemo(() => {
    return liveItems.filter((item) => activeCategories.includes(item.category));
  }, [liveItems, activeCategories]);

  const searchResults = useMemo(() => {
    return getSearchResults(liveItems, searchTerm);
  }, [liveItems, searchTerm]);

  function handleToggleCategory(categoryId) {
    setActiveCategories((currentCategories) => {
      if (currentCategories.includes(categoryId)) {
        return currentCategories.filter((id) => id !== categoryId);
      }

      return [...currentCategories, categoryId];
    });
  }

  function handleShowAll() {
    setActiveCategories(categories.map((category) => category.id));
  }

  function handleClear() {
    setActiveCategories([]);
    setSelectedItemId(null);
    setSearchTerm("");
  }

  function handleSelectItem(item, options = {}) {
    setSelectedItemId(item.id);

    if (options.clearSearch) {
      setSearchTerm("");
    }

    if (!activeCategories.includes(item.category)) {
      setActiveCategories((currentCategories) => [
        ...currentCategories,
        item.category,
      ]);
    }
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Union Pulse</p>
          <h1>Feel the rhythm of campus.</h1>
          <p>
            Search food, wellness, safety, study spaces, parking, MakerWeb labs,
            certifications, and campus events through one living, map-based interface.
          </p>
        </div>

        <div className="hero-badge">
          <strong>{liveItems.length}</strong>
          <span>campus resources</span>
        </div>
      </section>

      <FilterBar
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
        onShowAll={handleShowAll}
        onClear={handleClear}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchResults={searchResults}
        allItems={liveItems}
        onSelectItem={handleSelectItem}
      />

      <section className="workspace">
        <CampusMap
          items={visibleItems}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />

        <SidePanel selectedItem={selectedItem} />
      </section>

      <EventCalendar onSelectEventLocation={handleSelectItem} />
    </main>
  );
}
