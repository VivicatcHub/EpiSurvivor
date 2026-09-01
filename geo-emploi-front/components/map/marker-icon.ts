import L from "leaflet";

export const CHARTE_BLEU = "#1B3A6B";

export const markerIcon = L.divIcon({
  className: "geoemploi-marker",
  html: `<svg viewBox="0 0 24 34" width="26" height="36" aria-hidden focusable="false">
      <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.6 12 34 12 34s12-13.4 12-22.1C24 5.3 18.6 0 12 0z" fill="${CHARTE_BLEU}"/>
      <circle cx="12" cy="11.8" r="4.6" fill="#FFFFFF"/>
    </svg>`,
  iconSize: [26, 36],
  iconAnchor: [13, 34],
  popupAnchor: [0, -30],
});
