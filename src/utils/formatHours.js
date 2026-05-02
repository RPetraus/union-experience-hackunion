function normalizeHoursText(text) {
  return text
    .replaceAll("â€“", "–")
    .replaceAll("â€”", "—")
    .replaceAll("Ã©", "é");
}

export function getHoursLines(hours) {
  if (!hours) return [];

  return normalizeHoursText(hours)
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getHoursLabel(item) {
  if (item?.category === "parking") {
    return item.id === "parking-ev-connect" ? "Charging / permit" : "Parking / permit";
  }

  return "Hours / time";
}
