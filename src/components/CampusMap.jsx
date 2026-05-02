import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  PolygonF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { categories } from "../data/campusItems";
import { getHoursLabel, getHoursLines } from "../utils/formatHours";

const unionCenter = { lat: 42.8174, lng: -73.9301 };
const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "620px",
};

const mapOptions = {
  mapTypeId: "hybrid",
  clickableIcons: true,
  streetViewControl: false,
  fullscreenControl: true,
  mapTypeControl: true,
};

const parkingFootprints = {
  "parking-nott-seward": {
    customPolygonLatLng: [
      { lat: 42.81996078723, lng: -73.93117479154431 },
      { lat: 42.82003554769349, lng: -73.93112919399444 },
      { lat: 42.82005325410582, lng: -73.93118552037956 },
      { lat: 42.820454598095395, lng: -73.93091193507219 },
      { lat: 42.82041525076096, lng: -73.93078318904904 },
      { lat: 42.82045263072925, lng: -73.93076441358734 },
      { lat: 42.82032475179697, lng: -73.93008581471597 },
      { lat: 42.82018900310231, lng: -73.9297129876906 },
      { lat: 42.81974437485619, lng: -73.93001607728677 },
      { lat: 42.819950950324134, lng: -73.93095216822115 },
    ],
    cutoutPolygonsLatLng: [
      [
        { lat: 42.820426597423676, lng: -73.9306540414216 },
        { lat: 42.82038615839773, lng: -73.93068667085893 },
        { lat: 42.820396061835126, lng: -73.93046276536644 },
        { lat: 42.820363050370894, lng: -73.93052914940526 },
      ],
    ],
  },

  "parking-richmond": {
    customPolygonLatLng: [
      { lat: 42.81940794222096, lng: -73.9309821319628 },
      { lat: 42.81960664924093, lng: -73.93085070372166 },
      { lat: 42.8195938611846, lng: -73.93078498960107 },
      { lat: 42.819633209041754, lng: -73.93077157855606 },
      { lat: 42.81963714382608, lng: -73.9306374681059 },
      { lat: 42.8195938611846, lng: -73.93043898463968 },
      { lat: 42.81958107312564, lng: -73.93038668156412 },
      { lat: 42.819270224109665, lng: -73.93060662270236 },
    ],
  },

  "parking-college-park-hall": {
    customPolygonLatLng: [
      { lat: 42.82083825777725, lng: -73.93492039783848 },
      { lat: 42.820721273549005, lng: -73.9347731750989 },
      { lat: 42.82075051962681, lng: -73.93473330227359 },
      { lat: 42.82036582011282, lng: -73.93428549977402 },
      { lat: 42.82028932986571, lng: -73.93423029124666 },
      { lat: 42.82018584291017, lng: -73.93420882126381 },
      { lat: 42.8200868552254, lng: -73.93421495554463 },
      { lat: 42.82004411049005, lng: -73.93423949266969 },
      { lat: 42.81996537011867, lng: -73.93429163405663 },
      { lat: 42.819927124759246, lng: -73.93432230546071 },
      { lat: 42.81990537730372, lng: -73.93435416243608 },
      { lat: 42.81987586654311, lng: -73.93438903115312 },
      { lat: 42.81983651884039, lng: -73.93446681521422 },
      { lat: 42.819808975433595, lng: -73.93459287903737 },
      { lat: 42.819808975433595, lng: -73.93467870972545 },
      { lat: 42.81982864929684, lng: -73.93477258704057 },
      { lat: 42.81986012746502, lng: -73.93485841772866 },
      { lat: 42.81990144253645, lng: -73.93493351958075 },
      { lat: 42.82029885276588, lng: -73.93526611349714 },
      { lat: 42.82051132847773, lng: -73.9354136349941 },
    ],
    cutoutPolygonsLatLng: [
      [
        { lat: 42.82042640713936, lng: -73.93537969763825 },
        { lat: 42.82034672872483, lng: -73.93529923136816 },
        { lat: 42.82038902715519, lng: -73.93523888166558 },
        { lat: 42.82045198290497, lng: -73.93530727799516 },
      ],
    ],
  },

  "parking-fox-davidson": {
    customPolygonLatLng: [
      { lat: 42.81782921589895, lng: -73.93271823152696 },
      { lat: 42.81775272251386, lng: -73.93250966597921 },
      { lat: 42.8158831047438, lng: -73.9337579921701 },
      { lat: 42.81597984928701, lng: -73.93396042343704 },
    ],
  },

  "parking-west-college": {
    customPolygonLatLng: [
      { lat: 42.81838993532343, lng: -73.93195445447545 },
      { lat: 42.81849434877483, lng: -73.93222819958915 },
      { lat: 42.8186196446838, lng: -73.9321296513482 },
      { lat: 42.81870156879469, lng: -73.93213622123095 },
      { lat: 42.81915616532689, lng: -73.93186247610207 },
      { lat: 42.8191063686994, lng: -73.93170479890084 },
      { lat: 42.819133676533454, lng: -73.93168289929174 },
      { lat: 42.81914973995964, lng: -73.93172012862719 },
      { lat: 42.81948546461854, lng: -73.9314923726773 },
      { lat: 42.819435668254215, lng: -73.93134783525156 },
      { lat: 42.818963403965135, lng: -73.93174859810182 },
      { lat: 42.81903087050875, lng: -73.93153617190058 },
    ],
  },

  "parking-lamont": {
    customPolygonLatLng: [
      { lat: 42.81543757160542, lng: -73.92941364042203 },
      { lat: 42.815664393568134, lng: -73.92954104153225 },
      { lat: 42.81568191626018, lng: -73.92947866804847 },
      { lat: 42.81572766993263, lng: -73.92950255576565 },
      { lat: 42.81579289319445, lng: -73.9291880341559 },
      { lat: 42.81581723021777, lng: -73.92888545638206 },
      { lat: 42.815772450092865, lng: -73.92888014800046 },
      { lat: 42.81572085556097, lng: -73.92882573708907 },
      { lat: 42.81569262457246, lng: -73.92881644742127 },
      { lat: 42.81566439357106, lng: -73.92881644742127 },
      { lat: 42.815676075366255, lng: -73.92861207471353 },
      { lat: 42.815627401204836, lng: -73.92859614956873 },
      { lat: 42.815607931529016, lng: -73.92854173864815 },
      { lat: 42.815520317912906, lng: -73.92850457996984 },
      { lat: 42.815505715631595, lng: -73.92888943768142 },
      { lat: 42.815467749684395, lng: -73.92920661348198 },
    ],
  },

  "parking-alexander": {
    customPolygonLatLng: [
      { lat: 42.8155949130315, lng: -73.92734223445142 },
      { lat: 42.815536463968165, lng: -73.92718053043936 },
      { lat: 42.81638454301324, lng: -73.92661417576653 },
      { lat: 42.81643740919969, lng: -73.92677401768508 },
    ],
  },

  "parking-library": {
    widthMeters: 66,
    heightMeters: 36,
    rotationDegrees: -9,
    centerOffsetMeters: { east: 0, north: 0 },
  },

  "parking-achilles-center": {
    customPolygonLatLng: [
      { lat: 42.817715032822385, lng: -73.92455039005905 },
      { lat: 42.817696137327786, lng: -73.92450447000611 },
      { lat: 42.81751846219021, lng: -73.92474477989778 },
      { lat: 42.81743137462459, lng: -73.92456055125521 },
      { lat: 42.81753047425824, lng: -73.92444080261986 },
      { lat: 42.81750795162794, lng: -73.92432924194289 },
      { lat: 42.81748092446098, lng: -73.92427602033614 },
      { lat: 42.817448641995895, lng: -73.92429444319923 },
      { lat: 42.8173855785274, lng: -73.92415422473528 },
      { lat: 42.817692636954355, lng: -73.9239126805082 },
      { lat: 42.8177136580143, lng: -73.92396180814178 },
      { lat: 42.817734679066625, lng: -73.92394645575233 },
      { lat: 42.817712156510765, lng: -73.92388095223278 },
      { lat: 42.817608552648636, lng: -73.92377860298723 },
      { lat: 42.817652847075024, lng: -73.92370695851191 },
      { lat: 42.81781726170047, lng: -73.92386457634589 },
      { lat: 42.81794789219063, lng: -73.92419004696997 },
      { lat: 42.817912606971376, lng: -73.92422791619288 },
      { lat: 42.81786305748064, lng: -73.9244592254817 },
    ],
  },

  "parking-nott-lenox": {
    customPolygonLatLng: [
      { lat: 42.81942960831156, lng: -73.92451324699984 },
      { lat: 42.819591125617734, lng: -73.92452179850576 },
      { lat: 42.819619351903874, lng: -73.92417760036302 },
      { lat: 42.81993454451887, lng: -73.92421822000674 },
      { lat: 42.819944384952905, lng: -73.92388897851367 },
      { lat: 42.81993265260819, lng: -73.92379872011053 },
      { lat: 42.81995192717288, lng: -73.92356679029342 },
      { lat: 42.819941870879106, lng: -73.92344568406615 },
      { lat: 42.819926786435474, lng: -73.92333029041424 },
      { lat: 42.81903092247453, lng: -73.92350628511365 },
      { lat: 42.81887428358875, lng: -73.92348065929426 },
      { lat: 42.8188375852779, lng: -73.92334276800365 },
      { lat: 42.8185667294614, lng: -73.923514765761 },
      { lat: 42.81847722090359, lng: -73.92363679345125 },
      { lat: 42.81841098448437, lng: -73.92374295755985 },
      { lat: 42.818444102701044, lng: -73.92384912165676 },
      { lat: 42.81869293630479, lng: -73.92368316399393 },
      { lat: 42.81887732315099, lng: -73.92359286350937 },
      { lat: 42.818914916521216, lng: -73.92359896489047 },
      { lat: 42.81900442444475, lng: -73.92366241928853 },
      { lat: 42.81941884444183, lng: -73.92357333906946 },
      { lat: 42.81942242473554, lng: -73.92413344618652 },
      { lat: 42.819443906472046, lng: -73.9242274075311 },
    ],
    cutoutPolygonsLatLng: [
      [
        { lat: 42.819649698397086, lng: -73.92417917666238 },
        { lat: 42.81965363318036, lng: -73.92410541591994 },
        { lat: 42.819751018986935, lng: -73.92412016806844 },
        { lat: 42.819747084209844, lng: -73.9242006343329 },
      ],
    ],
  },

  "parking-ev-connect": {
    customPolygonLatLng: [
      { lat: 42.820426597423676, lng: -73.9306540414216 },
      { lat: 42.82038615839773, lng: -73.93068667085893 },
      { lat: 42.820396061835126, lng: -73.93046276536644 },
      { lat: 42.820363050370894, lng: -73.93052914940526 },
    ],
  },

  "parking-ev-college-park": {
    customPolygonLatLng: [
      { lat: 42.82042640713936, lng: -73.93537969763825 },
      { lat: 42.82034672872483, lng: -73.93529923136816 },
      { lat: 42.82038902715519, lng: -73.93523888166558 },
      { lat: 42.82045198290497, lng: -73.93530727799516 },
    ],
  },

  "parking-ev-nott-lenox": {
    customPolygonLatLng: [
      { lat: 42.819649698397086, lng: -73.92417917666238 },
      { lat: 42.81965363318036, lng: -73.92410541591994 },
      { lat: 42.819751018986935, lng: -73.92412016806844 },
      { lat: 42.819747084209844, lng: -73.9242006343329 },
    ],
  },

  "parking-shell-recharge": {
    customPolygonLatLng: [
      { lat: 42.81823998542412, lng: -73.92734499119595 },
      { lat: 42.81818932391209, lng: -73.92735639058067 },
      { lat: 42.81816423907056, lng: -73.92722697400369 },
      { lat: 42.818215392463095, lng: -73.92721289240428 },
    ],
  },

  "parking-east-campus": {
    customPolygonLatLng: [
      { lat: 42.81906655706624, lng: -73.92630080473215 },
      { lat: 42.81906280461689, lng: -73.92634343629337 },
      { lat: 42.81877011284774, lng: -73.92640482574119 },
      { lat: 42.81873759145445, lng: -73.92627522578597 },
      { lat: 42.81868630768363, lng: -73.92622406790727 },
      { lat: 42.818660040370276, lng: -73.9262684047332 },
      { lat: 42.81854621521489, lng: -73.92617973107315 },
      { lat: 42.818431139022536, lng: -73.92613709950976 },
      { lat: 42.81842863736324, lng: -73.9256920259688 },
      { lat: 42.81861626148806, lng: -73.9257363627885 },
      { lat: 42.81873759145191, lng: -73.92580457328992 },
      { lat: 42.818907703168776, lng: -73.92595804692203 },
      { lat: 42.81907781441415, lng: -73.92617461526407 },
      { lat: 42.81906030298404, lng: -73.92624964681563 },
    ],
  },
};

function getCategory(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

function getPosition(item) {
  return {
    lat: Number(item?.lat),
    lng: Number(item?.lng),
  };
}

function isValidPosition(position) {
  return Number.isFinite(position.lat) && Number.isFinite(position.lng);
}

function isParkingItem(item) {
  return item?.category === "parking";
}

function hasParkingData(item) {
  return typeof item?.capacity === "number" && typeof item?.available === "number";
}

function getParkingRatio(item) {
  if (!hasParkingData(item) || item.capacity === 0) return 0;
  return item.available / item.capacity;
}

function getParkingColor(item) {
  const ratio = getParkingRatio(item);

  if (ratio <= 0.05) return "#dc2626";
  if (ratio <= 0.15) return "#f97316";
  if (ratio <= 0.35) return "#f59e0b";
  if (ratio <= 0.65) return "#2563eb";
  return "#16a34a";
}

function metersToLat(meters) {
  return meters / 111_320;
}

function metersToLng(meters, latitude) {
  return meters / (111_320 * Math.cos((latitude * Math.PI) / 180));
}

function offsetPosition(center, offsetMeters = {}) {
  const east = offsetMeters.east || 0;
  const north = offsetMeters.north || 0;

  return {
    lat: center.lat + metersToLat(north),
    lng: center.lng + metersToLng(east, center.lat),
  };
}

function getPolygonCenter(points) {
  if (!points || points.length === 0) return null;

  const total = points.reduce(
    (sum, point) => ({
      lat: sum.lat + point.lat,
      lng: sum.lng + point.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: total.lat / points.length,
    lng: total.lng / points.length,
  };
}

function makeRotatedRectangle(center, widthMeters, heightMeters, rotationDegrees) {
  const angle = (rotationDegrees * Math.PI) / 180;

  const corners = [
    { x: -widthMeters / 2, y: -heightMeters / 2 },
    { x: widthMeters / 2, y: -heightMeters / 2 },
    { x: widthMeters / 2, y: heightMeters / 2 },
    { x: -widthMeters / 2, y: heightMeters / 2 },
  ];

  return corners.map((corner) => {
    const rotatedX = corner.x * Math.cos(angle) - corner.y * Math.sin(angle);
    const rotatedY = corner.x * Math.sin(angle) + corner.y * Math.cos(angle);

    return {
      lat: center.lat + metersToLat(rotatedY),
      lng: center.lng + metersToLng(rotatedX, center.lat),
    };
  });
}

function getParkingVisualCenter(item) {
  const rawCenter = getPosition(item);
  if (!isValidPosition(rawCenter)) return null;

  const footprint = parkingFootprints[item.id];

  if (footprint?.customPolygonLatLng) {
    return getPolygonCenter(footprint.customPolygonLatLng);
  }

  if (footprint?.centerOffsetMeters) {
    return offsetPosition(rawCenter, footprint.centerOffsetMeters);
  }

  return rawCenter;
}

function getParkingFootprint(item) {
  const customFootprint = parkingFootprints[item.id];

  if (customFootprint?.customPolygonLatLng) {
    if (customFootprint.cutoutPolygonsLatLng?.length) {
      return [
        customFootprint.customPolygonLatLng,
        ...customFootprint.cutoutPolygonsLatLng,
      ];
    }

    return customFootprint.customPolygonLatLng;
  }

  const visualCenter = getParkingVisualCenter(item);
  if (!visualCenter) return null;

  if (customFootprint?.customPolygonMeters) {
    return customFootprint.customPolygonMeters.map((point) => ({
      lat: visualCenter.lat + metersToLat(point.north),
      lng: visualCenter.lng + metersToLng(point.east, visualCenter.lat),
    }));
  }

  const fallbackFootprint = {
    widthMeters: Math.min(105, Math.max(34, (item.capacity || 40) * 1.05)),
    heightMeters: Math.min(58, Math.max(22, (item.capacity || 40) * 0.48)),
    rotationDegrees: 0,
  };

  const footprint = customFootprint || fallbackFootprint;

  return makeRotatedRectangle(
    visualCenter,
    footprint.widthMeters,
    footprint.heightMeters,
    footprint.rotationDegrees
  );
}

function getParkingLabel(item) {
  if (!hasParkingData(item)) return "P";
  return `${item.available}/${item.capacity}`;
}

function selectMapItem(item, onSelectItem) {
  onSelectItem(item, { clearSearch: true });
}

export default function CampusMap({ items = [], selectedItem, onSelectItem }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [map, setMap] = useState(null);
  const [activeInfoId, setActiveInfoId] = useState(selectedItem?.id ?? null);
  const lastFocusedItemId = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  const selectedPosition = useMemo(() => {
    if (!selectedItem) return null;

    if (isParkingItem(selectedItem)) {
      const visualCenter = getParkingVisualCenter(selectedItem);
      return visualCenter && isValidPosition(visualCenter) ? visualCenter : null;
    }

    const position = getPosition(selectedItem);
    return isValidPosition(position) ? position : null;
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem?.id) {
      setActiveInfoId(selectedItem.id);
    }
  }, [selectedItem?.id]);

  useEffect(() => {
    if (!selectedItem?.id) {
      lastFocusedItemId.current = null;
      return;
    }

    if (!map || !selectedPosition) return;

    if (lastFocusedItemId.current === selectedItem.id) return;

    lastFocusedItemId.current = selectedItem.id;

    map.panTo(selectedPosition);
    map.setZoom(isParkingItem(selectedItem) ? 18 : 17);
  }, [map, selectedItem?.id, selectedPosition, selectedItem]);

  if (!apiKey) {
    return (
      <div className="map-shell map-fallback">
        <h2>Google Maps API key missing</h2>
        <p>
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>.env.local</code>,
          then restart the dev server.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-shell map-fallback">
        <h2>Google Maps failed to load</h2>
        <p>Check that Maps JavaScript API and Places API are enabled.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-shell map-fallback">
        <h2>Loading Google Maps...</h2>
      </div>
    );
  }

  return (
    <div className="map-shell">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={unionCenter}
        zoom={17}
        options={mapOptions}
        onLoad={(loadedMap) => setMap(loadedMap)}
      >
        {items.map((item) => {
          const position = getPosition(item);
          if (!isValidPosition(position)) return null;

          const category = getCategory(item.category);
          const isSelected = selectedItem?.id === item.id;

          if (isParkingItem(item)) {
            const footprint = getParkingFootprint(item);
            const visualCenter = getParkingVisualCenter(item) || position;
            const parkingColor = getParkingColor(item);

            return (
              <Fragment key={item.id}>
                {footprint && (
                  <PolygonF
                    paths={footprint}
                    onClick={() => {
                      setActiveInfoId(item.id);
                      selectMapItem(item, onSelectItem);
                    }}
                    options={{
                      fillColor: parkingColor,
                      fillOpacity: isSelected ? 0.34 : 0.22,
                      strokeColor: parkingColor,
                      strokeOpacity: 0.95,
                      strokeWeight: isSelected ? 4 : 3,
                      clickable: true,
                      zIndex: isSelected ? 20 : 10,
                    }}
                  />
                )}

                <MarkerF
                  position={visualCenter}
                  onClick={() => {
                    setActiveInfoId(item.id);
                    selectMapItem(item, onSelectItem);
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: isSelected ? 23 : 20,
                    fillColor: "#ffffff",
                    fillOpacity: 0.96,
                    strokeColor: parkingColor,
                    strokeWeight: isSelected ? 5 : 4,
                    labelOrigin: new window.google.maps.Point(0, 0),
                  }}
                  label={{
                    text: getParkingLabel(item),
                    color: "#111827",
                    fontWeight: "900",
                    fontSize: "11px",
                  }}
                  title={`${item.name}: ${getParkingLabel(item)} spots`}
                />
              </Fragment>
            );
          }

          return (
            <MarkerF
              key={item.id}
              position={position}
              onClick={() => {
                setActiveInfoId(item.id);
                selectMapItem(item, onSelectItem);
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: isSelected ? 10 : 8,
                fillColor: category?.color || "#111827",
                fillOpacity: 0.95,
                strokeColor: "#111827",
                strokeWeight: isSelected ? 3 : 2,
              }}
              title={item.name}
            />
          );
        })}

        {selectedItem && selectedPosition && activeInfoId === selectedItem.id && (
          <InfoWindowF
            position={selectedPosition}
            onCloseClick={() => setActiveInfoId(null)}
          >
            <div className="popup-content">
              <div className="popup-kicker">
                {getCategory(selectedItem.category)?.emoji} {selectedItem.type}
              </div>

              <strong>{selectedItem.name}</strong>

              <p>{selectedItem.short}</p>

              {selectedItem.location && (
                <p>
                  <strong>Location:</strong> {selectedItem.location}
                </p>
              )}

              {selectedItem.hours && (
                <div className="popup-hours">
                  <strong>{getHoursLabel(selectedItem)}:</strong>
                  <ul className="popup-list">
                    {getHoursLines(selectedItem.hours).map((line) => (
                      <li key={`${selectedItem.id}-${line}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hasParkingData(selectedItem) && (
                <p>
                  <strong>Live parking:</strong> {selectedItem.available} /{" "}
                  {selectedItem.capacity} spots available
                  {selectedItem.availabilityStatus
                    ? ` (${selectedItem.availabilityStatus})`
                    : ""}
                </p>
              )}

              {selectedItem.lastUpdated && isParkingItem(selectedItem) && (
                <p>
                  <strong>Updated:</strong> {selectedItem.lastUpdated}
                </p>
              )}

              {selectedItem.certificationLinks?.length > 0 && (
                <p>
                  <strong>Appointments:</strong> available in the detail card
                </p>
              )}

              {selectedItem.url && (
                <a href={selectedItem.url} target="_blank" rel="noreferrer">
                  More info
                </a>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
