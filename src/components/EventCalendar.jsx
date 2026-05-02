import { useMemo, useState } from "react";
import { campusEvents, eventTypes } from "../data/campusEvents";
import { campusItems } from "../data/campusItems";

const primaryViews = [
  { id: "today", label: "Today", short: "Today" },
  { id: "events", label: "Events", short: "Events" },
  { id: "recurring", label: "Recurring", short: "Recurring" },
];

function getLocationItem(event) {
  if (event.locationItemId) {
    const linkedItem = campusItems.find((item) => item.id === event.locationItemId);
    if (linkedItem) return linkedItem;
  }

  const location = event.location || "";

  const fallbackMatchers = [
    ["Karp", "karp-hall"],
    ["ISEC", "isec-building"],
    ["Wold", "wold-center"],
    ["Lippman", "lippman-hall"],
    ["Olin", "olin-center"],
    ["Sorum", "sorum-house"],
    ["Old Chapel", "old-chapel"],
    ["Language Center", "language-center"],
    ["Schaffer Library", "schaffer-library"],
    ["Wicker Wellness Center", "wicker-health"],
    ["Yulman Theater", "yulman-theater"],
    ["Nott Memorial", "nott-events"],
    ["West College", "west-social-space"],
    ["West Social Space", "west-social-space"],
    ["West Beach Lawn", "west-beach-lawn"],
    ["Lower Aerobics Room", "alumni-gym"],
    ["Reamer", "reamer-campus-center"],
    ["Kenney Center", "kenney-center"],
    ["Make Lab", "maker-make-lab"],
  ];

  const fallbackItemId = fallbackMatchers.find(([label]) =>
    location.includes(label)
  )?.[1];

  return campusItems.find((item) => item.id === fallbackItemId);
}

function normalizeText(value = "") {
  return value
    .replace(/Ã¢â‚¬â€œ/g, "-")
    .replace(/Ã¢â‚¬â€/g, "-")
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "-")
    .toLowerCase();
}

function getTypeLabel(typeId) {
  return eventTypes.find((type) => type.id === typeId)?.label || typeId;
}

function getTodayContext() {
  const now = new Date();
  const shortDay = now.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
  const isoDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  )
    .toISOString()
    .slice(0, 10);

  return { shortDay, isoDate };
}

function recurringEventMatchesDay(event, dayId) {
  const day = normalizeText(event.day);
  const dateLabel = normalizeText(event.dateLabel);

  const dayMap = {
    Sun: "sun",
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  };

  const target = dayMap[dayId];

  if (!target) return false;
  if (day.includes(target)) return true;

  if (day.includes("mon-fri") || day.includes("weekdays")) {
    return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(dayId);
  }

  if (day.includes("sat-sun") || day.includes("weekends")) {
    return ["Sat", "Sun"].includes(dayId);
  }

  if (day.includes("daily") || day.includes("every day")) {
    return true;
  }

  if (dateLabel.includes("today")) return true;

  return false;
}

function scrollToMap() {
  const mapArea =
    document.querySelector(".workspace") ||
    document.querySelector(".map-layout") ||
    document.querySelector(".map-shell");

  if (mapArea) {
    mapArea.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function getEventDateValue(event) {
  if (!event.isoDate) return null;
  const date = new Date(`${event.isoDate}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateChip(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return {
    label: date.toLocaleDateString([], { month: "short", day: "numeric" }),
    short: date.toLocaleDateString([], { weekday: "short" }),
    full: date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  };
}

function isTodayEvent(event, todayContext) {
  if (event.isoDate) return event.isoDate === todayContext.isoDate;
  return recurringEventMatchesDay(event, todayContext.shortDay);
}

function getPrimaryViewLabel(activeView) {
  if (activeView === "today") return "What's relevant today";
  if (activeView === "events") return "Scheduled events and dated sign-ups";
  return "Recurring hours and standing services";
}

export default function EventCalendar({ onSelectEventLocation }) {
  const [activeType, setActiveType] = useState("all");
  const [activeView, setActiveView] = useState("today");
  const [activeDate, setActiveDate] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(null);

  const selectedEvent = useMemo(() => {
    return campusEvents.find((event) => event.id === selectedEventId);
  }, [selectedEventId]);

  const todayContext = useMemo(() => getTodayContext(), []);

  const datedEvents = useMemo(
    () => campusEvents.filter((event) => event.isoDate),
    []
  );

  const dateOptions = useMemo(() => {
    return Array.from(new Set(datedEvents.map((event) => event.isoDate)))
      .sort()
      .map((isoDate) => ({
        id: isoDate,
        ...formatDateChip(isoDate),
      }));
  }, [datedEvents]);

  const viewCounts = useMemo(() => {
    return {
      today: campusEvents.filter((event) => isTodayEvent(event, todayContext)).length,
      events: datedEvents.filter((event) => event.isoDate > todayContext.isoDate).length,
      recurring: campusEvents.filter((event) => !event.isoDate).length,
    };
  }, [datedEvents, todayContext]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return campusEvents.filter((event) => {
      const matchesType = activeType === "all" || event.type === activeType;

      const matchesPrimaryView =
        activeView === "today"
          ? isTodayEvent(event, todayContext)
          : activeView === "events"
            ? Boolean(event.isoDate) &&
              event.isoDate > todayContext.isoDate &&
              (activeDate === "all" || event.isoDate === activeDate)
            : !event.isoDate;

      const searchable = [
        event.title,
        event.location,
        event.short,
        event.description,
        event.source,
        event.type,
        event.dateLabel,
        event.day,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || searchable.includes(normalizedQuery);

      return matchesType && matchesPrimaryView && matchesQuery;
    });
  }, [activeDate, activeType, activeView, query, todayContext]);

  const groupedEvents = useMemo(() => {
    const sections = [];

    if (activeView === "today") {
      const datedToday = filteredEvents
        .filter((event) => event.isoDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      const recurringToday = filteredEvents.filter((event) => !event.isoDate);

      if (datedToday.length > 0) {
        sections.push({
          id: "today-scheduled",
          title: "Scheduled today",
          kicker: "Timed events and appointments",
          events: datedToday,
        });
      }

      if (recurringToday.length > 0) {
        sections.push({
          id: "today-recurring",
          title: "Active today",
          kicker: "Recurring hours and standing services",
          events: recurringToday,
        });
      }

      return sections;
    }

    if (activeView === "events") {
      const dated = filteredEvents
        .filter((event) => event.isoDate)
        .sort((a, b) => {
          const dateDiff =
            getEventDateValue(a)?.getTime() - getEventDateValue(b)?.getTime();

          if (dateDiff !== 0) return dateDiff;
          return a.startTime.localeCompare(b.startTime);
        });

      dated.forEach((event) => {
        const existing = sections.find((section) => section.id === event.isoDate);

        if (existing) {
          existing.events.push(event);
          return;
        }

        const label = formatDateChip(event.isoDate);
        sections.push({
          id: event.isoDate,
          title: label.full,
          kicker: `${label.short} schedule`,
          events: [event],
        });
      });

      return sections;
    }

    const activeToday = filteredEvents.filter((event) =>
      recurringEventMatchesDay(event, todayContext.shortDay)
    );
    const notToday = filteredEvents.filter(
      (event) => !recurringEventMatchesDay(event, todayContext.shortDay)
    );

    if (activeToday.length > 0) {
      sections.push({
        id: "resources-active",
        title: "Active today",
        kicker: "Standing resources available now",
        events: activeToday,
      });
    }

    if (notToday.length > 0) {
      sections.push({
        id: "resources-later",
        title: "Not active today",
        kicker: "Standing resources for other days",
        events: notToday,
      });
    }

    return sections;
  }, [activeView, filteredEvents, todayContext]);

  function selectEvent(event, shouldJumpToMap = false) {
    const locationItem = getLocationItem(event);

    setSelectedEventId(event.id);

    if (locationItem && onSelectEventLocation) {
      onSelectEventLocation(locationItem, { clearSearch: true });
    }

    if (shouldJumpToMap) {
      window.setTimeout(scrollToMap, 80);
    }
  }

  function setView(nextView) {
    setActiveView(nextView);
    if (nextView !== "events") {
      setActiveDate("all");
    }
  }

  return (
    <section className="event-calendar-card">
      <div className="calendar-intro">
        <div>
          <p className="calendar-eyebrow">Campus pulse</p>
          <h2>What's happening around Union?</h2>
          <p>
            One map-connected place for events, open hours, sign-ups, and
            student resources that usually get scattered across UEngage emails,
            posters, and department pages.
          </p>
        </div>

        <div className="calendar-summary">
          <strong>{campusEvents.length}</strong>
          <span>tracked events/resources</span>
        </div>
      </div>

      <div className="schedule-strip" aria-label="Filter events by view">
        {primaryViews.map((view) => (
          <button
            key={view.id}
            type="button"
            className={`schedule-chip ${activeView === view.id ? "active" : ""}`}
            onClick={() => setView(view.id)}
          >
            <span>{view.short}</span>
            <strong>{viewCounts[view.id] || 0}</strong>
          </button>
        ))}
      </div>

      {activeView === "events" && (
        <div className="schedule-strip schedule-strip-dates" aria-label="Filter dated events by date">
          <button
            type="button"
            className={`schedule-chip ${activeDate === "all" ? "active" : ""}`}
            onClick={() => setActiveDate("all")}
          >
            <span>All</span>
            <strong>{viewCounts.events}</strong>
          </button>

          {dateOptions
            .filter((option) => option.id > todayContext.isoDate)
            .map((option) => (
              <button
                key={option.id}
                type="button"
                className={`schedule-chip ${activeDate === option.id ? "active" : ""}`}
                onClick={() => setActiveDate(option.id)}
              >
                <span>{option.short}</span>
                <strong>{option.label}</strong>
              </button>
            ))}
        </div>
      )}

      <div className="calendar-toolbar">
        <div className="event-search-row">
          <span aria-hidden="true">🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, certifications, locations, or resources..."
          />
        </div>

        <div className="event-type-row">
          {eventTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`event-type-pill ${
                activeType === type.id ? "active" : ""
              }`}
              onClick={() => setActiveType(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="selected-event-banner">
          <div>
            <span>Selected event</span>
            <strong>{selectedEvent.title}</strong>
            <p>
              Showing the linked location: <b>{selectedEvent.location}</b>
            </p>
          </div>

          <button type="button" onClick={scrollToMap}>
            Jump to map ↑
          </button>
        </div>
      )}

      <div className="calendar-content">
        <div className="calendar-sidebar">
          <p>Selected view</p>
          <strong>{getPrimaryViewLabel(activeView)}</strong>
          <span>
            {activeType === "all"
              ? "Showing every event type"
              : `Filtered to ${getTypeLabel(activeType)}`}
          </span>
          <small>{filteredEvents.length} matching items</small>
        </div>

        <div className="event-list">
          {groupedEvents.length === 0 ? (
            <div className="empty-events">
              <strong>No matching events</strong>
              <p>Try another view, date, event type, or search term.</p>
            </div>
          ) : (
            groupedEvents.map((section) => (
              <section key={section.id} className="event-section">
                <div className="event-section-header">
                  <span>{section.kicker}</span>
                  <strong>{section.title}</strong>
                </div>

                <div className="event-section-list">
                  {section.events.map((event) => {
                    const isSelected = selectedEventId === event.id;

                    return (
                      <article
                        key={event.id}
                        className={`event-card ${isSelected ? "selected" : ""}`}
                      >
                        <button
                          type="button"
                          className="event-card-main"
                          onClick={() => selectEvent(event, false)}
                        >
                          <div className="event-date-tile">
                            <span>{event.dateLabel}</span>
                            <strong>{event.day}</strong>
                          </div>

                          <div className="event-info">
                            <div className="event-title-row">
                              <strong>{event.title}</strong>
                              <span>{getTypeLabel(event.type)}</span>
                            </div>

                            <p>{event.short}</p>

                            <div className="event-meta">
                              <span>
                                🕒 {event.startTime}
                                {event.endTime ? `-${event.endTime}` : ""}
                              </span>
                              <span>📍 {event.location}</span>
                            </div>

                            {isSelected && (
                              <div className="event-selected-note">
                                Location selected above
                              </div>
                            )}
                          </div>
                        </button>

                        <div className="event-card-footer">
                          <span>{event.source || "Campus source"}</span>

                          <div className="event-actions">
                            {event.signupUrl && (
                              <a
                                href={event.signupUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open link →
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => selectEvent(event, true)}
                            >
                              Show on map ↑
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
