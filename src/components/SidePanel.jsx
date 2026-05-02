import { categories } from "../data/campusItems";
import { getHoursLabel, getHoursLines } from "../utils/formatHours";

function getCategory(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

function DetailList({ title, items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="detail-section">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ParkingAvailability({ item }) {
  const hasParkingData =
    typeof item.capacity === "number" && typeof item.available === "number";

  if (!hasParkingData) return null;

  const percent =
    item.capacity > 0 ? Math.round((item.available / item.capacity) * 100) : 0;

  return (
    <div className="parking-live-card">
      <div className="parking-live-top">
        <strong>Live parking demo</strong>
        <span>{item.availabilityStatus}</span>
      </div>

      <div className="parking-live-count">
        <strong>{item.available}</strong>
        <span>/ {item.capacity} spots available</span>
      </div>

      <div className="parking-meter" aria-label={`${percent}% available`}>
        <span style={{ width: `${percent}%` }} />
      </div>

      {item.lastUpdated && <small>{item.lastUpdated}</small>}

      <p>
        Simulated availability updates every few seconds. In a production
        version, this could connect to sensors, permit data, camera counts, or
        campus transportation data.
      </p>
    </div>
  );
}

function HoursBlock({ item }) {
  const lines = getHoursLines(item?.hours);
  if (lines.length === 0) return null;

  return (
    <div className="detail-hours">
      <strong>{getHoursLabel(item)}</strong>
      <span className="detail-hours-lines">
        {lines.map((line, index) => (
          <span key={`${item.id}-hours-${index}`} className="detail-hours-line">
            {line}
          </span>
        ))}
      </span>
    </div>
  );
}

function ParkingPermitInfo({ item }) {
  if (item?.category !== "parking") return null;

  return (
    <div className="detail-section">
      <strong>Parking permit</strong>
      <p>
        A Union College parking permit is required for campus parking. Vehicle
        registration and permit details are handled by Campus Safety.
      </p>
      <a
        href="https://www.union.edu/campus-safety/parking-and-traffic"
        target="_blank"
        rel="noreferrer"
      >
        Parking and traffic info →
      </a>
    </div>
  );
}

function CertificationLinks({ links }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="detail-section">
      <strong>Certifications / appointments</strong>

      <div className="certification-list">
        {links.map((link) => (
          <a
            key={link.url}
            className="certification-card"
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <strong>{link.label}</strong>
              {link.duration && <em>{link.duration}</em>}
            </span>

            {link.description && <p>{link.description}</p>}
            {link.prep && <small>{link.prep}</small>}

            <b>Book appointment →</b>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function SidePanel({ selectedItem }) {
  if (!selectedItem) {
    return (
      <aside className="side-panel">
        <section className="detail-card empty-detail">
          <h2>No place selected</h2>
          <p>Search or click a marker on the map to view details.</p>
        </section>
      </aside>
    );
  }

  return (
    <aside className="side-panel">
      <section className="detail-card">
        <div className="detail-eyebrow">
          {getCategory(selectedItem.category)?.emoji} {selectedItem.type}
        </div>

        <h2>{selectedItem.name}</h2>
        <p className="detail-short">{selectedItem.short}</p>
        <p>{selectedItem.description}</p>

        <div className="meta-grid">
          {selectedItem.location && (
            <div className="meta-row">
              <strong>Location</strong>
              <span>{selectedItem.location}</span>
            </div>
          )}
        </div>

        <HoursBlock item={selectedItem} />

        <ParkingAvailability item={selectedItem} />
        <ParkingPermitInfo item={selectedItem} />
        <CertificationLinks links={selectedItem.certificationLinks} />

        <DetailList title="Tools / resources" items={selectedItem.tools} />
        <DetailList title="Open-hours snapshot" items={selectedItem.scheduleHighlights} />
        <DetailList title="Meal periods" items={selectedItem.mealPeriods} />
        <DetailList title="Menu highlights" items={selectedItem.menuHighlights} />
        <DetailList title="Dietary notes" items={selectedItem.dietaryNotes} />

        {selectedItem.sourceNote && (
          <p className="source-note">{selectedItem.sourceNote}</p>
        )}

        {selectedItem.url && (
          <a href={selectedItem.url} target="_blank" rel="noreferrer">
            More info →
          </a>
        )}
      </section>
    </aside>
  );
}
