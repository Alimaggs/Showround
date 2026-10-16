// Icon set shared by the editor and the exported player.
// Each entry is the inner markup of a 24x24 stroke icon. The consuming
// stylesheet supplies fill, stroke, width and linecaps so the same paths
// render identically in the editor viewer and in a published tour.
//
// Keys are stored in exported tours, so an existing key must never be renamed
// or removed: scripts/check-compat.mjs fails if one that has shipped goes
// missing. New icons can be added anywhere. The order here is the order of the
// picker, grouped loosely into rows of eight: getting about, things worth a
// look, rooms, facilities, and outside.

export const pinIcons = {
  arrow: { label: 'Arrow', path: '<path d="M4 12h15M13 6l6 6-6 6"/>' },
  door: { label: 'Door', path: '<path d="M7 21V4h10v17M4 21h16M13.6 12.4h.01"/>' },
  stairs: { label: 'Stairs', path: '<path d="M4 20h4v-4h4v-4h4v-4h4"/>' },
  lift: { label: 'Lift', path: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="m9 9.5 3-3 3 3M9 14.5l3 3 3-3"/>' },
  exit: { label: 'Exit', path: '<path d="M13 4H5v16h8"/><path d="M9.5 12H21M17 8l4 4-4 4"/>' },
  location: { label: 'Location', path: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>' },
  info: { label: 'Info', path: '<circle cx="12" cy="12" r="9"/><path d="M12 11.2v5M12 7.9h.01"/>' },
  question: { label: 'Help', path: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.6a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 16.9h.01"/>' },

  star: { label: 'Feature', path: '<path d="m12 3.4 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.9l6.1-.9z"/>' },
  heart: { label: 'Favourite', path: '<path d="M12 20.5S4.5 16 4.5 10.2A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.8-7.5 10.3-7.5 10.3z"/>' },
  eye: { label: 'Viewpoint', path: '<path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>' },
  camera: { label: 'Photo spot', path: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.8L9 4.5h6L16.7 7h2.8A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><circle cx="12" cy="13.2" r="3.6"/>' },
  play: { label: 'Media', path: '<circle cx="12" cy="12" r="9"/><path d="m10.2 8.4 5.6 3.6-5.6 3.6z"/>' },
  music: { label: 'Music', path: '<path d="M9 17.5V5.5l11-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/>' },
  key: { label: 'Key', path: '<circle cx="8" cy="15.5" r="4.5"/><path d="M11.2 12.3 20 3.5M16.5 7l2.5 2.5M14 9.5l2 2"/>' },
  wifi: { label: 'Wi-Fi', path: '<path d="M2.5 8.8a14 14 0 0 1 19 0M5.6 12.2a9.5 9.5 0 0 1 12.8 0M8.7 15.5a5 5 0 0 1 6.6 0"/><path d="M12 19h.01"/>' },

  bed: { label: 'Bedroom', path: '<path d="M2 20v-5h20v5M4 15V8h16v7M8 12h8"/>' },
  sofa: { label: 'Lounge', path: '<path d="M5.5 10.5V7.5A1.5 1.5 0 0 1 7 6h10a1.5 1.5 0 0 1 1.5 1.5v3"/><path d="M3 18v-5.5a1.8 1.8 0 0 1 3.6 0V14h10.8v-1.5a1.8 1.8 0 0 1 3.6 0V18zM5 18v2M19 18v2"/>' },
  chair: { label: 'Seating', path: '<path d="M7 11.5V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6.5"/><path d="M5 11.5h14V15H5zM6.5 15v6M17.5 15v6"/>' },
  kitchen: { label: 'Kitchen', path: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 15h16"/><circle cx="9" cy="10.5" r="1.4"/><circle cx="15" cy="10.5" r="1.4"/>' },
  dining: { label: 'Dining', path: '<path d="M7 3v18M5 3v5.5a2 2 0 0 0 4 0V3"/><path d="M17 21V3c-2 1.4-3 4-3 7.2 0 1.8 1.2 2.8 3 2.8"/>' },
  coffee: { label: 'Café', path: '<path d="M4 9.5h12.5v5a5 5 0 0 1-5 5h-2.5a5 5 0 0 1-5-5z"/><path d="M16.5 11h1.3a2.5 2.5 0 0 1 0 5h-1.6"/><path d="M8 3.2c-.9 1 .9 1.7 0 2.8M12 3.2c-.9 1 .9 1.7 0 2.8"/>' },
  tv: { label: 'TV', path: '<rect x="3" y="6.5" width="18" height="11.5" rx="1.5"/><path d="m8.5 2.8 3.5 3.5 3.5-3.5M8.5 21h7"/>' },
  monitor: { label: 'Computer', path: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8.5 20.5h7M12 16v4.5"/>' },

  bath: { label: 'Bathroom', path: '<path d="M12 3.2c0 0 6.2 6.6 6.2 10.6a6.2 6.2 0 0 1-12.4 0C5.8 9.8 12 3.2 12 3.2z"/>' },
  toilet: { label: 'Toilet', path: '<path d="M6 3h5v8H6z"/><path d="M4 11h16c0 3.3-2.7 6-6 6h-2.5l.9 4H8.2l.9-4.4C6.1 16 4 13.8 4 11z"/>' },
  accessible: { label: 'Accessible', path: '<circle cx="11" cy="4.5" r="1.7"/><path d="M11 8.5V14h5.5l2.5 5.5"/><path d="M8 11.3a5 5 0 1 0 7.5 6.5"/>' },
  laundry: { label: 'Laundry', path: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4.2"/><path d="M7.5 6.5h.01M10.5 6.5h.01"/>' },
  firstaid: { label: 'First aid', path: '<rect x="3.5" y="6.5" width="17" height="13.5" rx="2"/><path d="M9 6.5V4h6v2.5M12 10v7M8.5 13.5h7"/>' },
  flame: { label: 'Fireplace', path: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.8 3-5.6 3.8-9 2.6 1.6 4.2 4 4.2 6.6.9-.6 1.4-1.7 1.5-3 1.8 1.6 3.5 3.6 3.5 5.6 0 3.4-2.6 5.8-6.5 5.8z"/>' },
  books: { label: 'Books', path: '<rect x="4" y="4" width="3.6" height="16" rx=".6"/><rect x="9.6" y="6.5" width="3.6" height="13.5" rx=".6"/><path d="m15 7.6 3.4-.9 3.1 12.4-3.4.9z"/>' },
  phone: { label: 'Phone', path: '<path d="M6.2 3.5h2.9l1.4 4.6-1.9 1.4a11.5 11.5 0 0 0 5.9 5.9l1.4-1.9 4.6 1.4v2.9a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.2 5.5a2 2 0 0 1 2-2z"/>' },

  tree: { label: 'Garden', path: '<path d="M12 3 6.8 11.4h3.1L6 17.6h12l-3.9-6.2h3.1z"/><path d="M12 17.6V21"/>' },
  plant: { label: 'Plant', path: '<path d="M7 14.5h10l-1.5 6.5h-7z"/><path d="M12 14.5V9.5M12 9.5C12 6.6 10 4.5 7 4.5c0 2.9 2 5 5 5zM12 11.5c0-2.6 2-4.5 5-4.5 0 2.6-2 4.5-5 4.5z"/>' },
  flower: { label: 'Flowers', path: '<path d="M12 21v-8.5"/><path d="M12 12.5c-2.9 0-4.8-2.1-4.8-5.3L9.1 8.5 12 4.6l2.9 3.9 1.9-1.3c0 3.2-1.9 5.3-4.8 5.3z"/><path d="M12 18c-1.8-2.4-4.7-2.6-6-2 .6 2.3 3.1 3.2 6 2zM12 18c1.8-2.4 4.7-2.6 6-2-.6 2.3-3.1 3.2-6 2z"/>' },
  sun: { label: 'Outdoors', path: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>' },
  pool: { label: 'Pool', path: '<path d="M8 14.5V5.5a2 2 0 0 1 4 0M15 14.5V5.5a2 2 0 0 1 4 0M8 9.5h7M8 12.5h7"/><path d="M2.5 18.5c1.6 0 1.6-1.2 3.2-1.2s1.6 1.2 3.2 1.2 1.6-1.2 3.1-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2 1.6 1.2 3.1 1.2"/>' },
  gym: { label: 'Gym', path: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>' },
  car: { label: 'Parking', path: '<path d="M4 17v-4l2-5.2h12L20 13v4M4.5 17h15"/><circle cx="7.5" cy="17.3" r="1.6"/><circle cx="16.5" cy="17.3" r="1.6"/>' },
  bike: { label: 'Bikes', path: '<circle cx="5.8" cy="16" r="3.6"/><circle cx="18.2" cy="16" r="3.6"/><path d="M5.8 16 9.5 9h6l2.7 7M9.5 9l3 7h-6.7M8.5 6h2.5M15.5 9l-1-3h2.2"/>' },
}

export const defaultHotspotIcon = 'arrow'
export const defaultInfoIcon = 'info'

export function pinIconSvg(name, fallback = defaultHotspotIcon) {
  const icon = pinIcons[name] || pinIcons[fallback] || pinIcons.arrow
  return `<svg class="pin-icon" viewBox="0 0 24 24" aria-hidden="true">${icon.path}</svg>`
}
