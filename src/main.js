import * as THREE from 'three'
import JSZip from 'jszip'
import threeSource from '../node_modules/three/build/three.module.min.js?raw'
import threeCoreSource from '../node_modules/three/build/three.core.min.js?raw'
import { embedHtml, exportReadme, playerHtml, playerScript, playerStyles } from './export-player.js'
import { defaultHotspotIcon, defaultInfoIcon, pinIcons, pinIconSvg } from './pin-icons.js'
import { defaultTheme, inkFor, normalizeHex, pinStyle, presetColors } from './pin-colors.js'
import { parseTourZip, viewFrom } from './tour-format.js'
import { currentRelease, releases } from './changelog.js'
import './style.css'

const icons = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4"/></svg>',
  hotspot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></svg>',
  export: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m0 0 5-5m-5 5-5-5M5 19h14"/></svg>',
  embed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.6 4.5l-3.2 15"/></svg>',
  import: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V8m0 0 5 5m-5-5-5 5M5 4h14"/></svg>',
  compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h9M19 18h1"/><circle cx="16" cy="6" r="2.2"/><circle cx="10" cy="12" r="2.2"/><circle cx="16" cy="18" r="2.2"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.6v4.8a1.6 1.6 0 0 0 1.6 1.6h2.2l7.6 4.3V3.7L7.8 8H5.6A1.6 1.6 0 0 0 4 9.6z"/><path d="M7.8 16v3a2 2 0 0 0 4 0v-.9M19 9.4a4.2 4.2 0 0 1 0 5.2"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3zM14.5 7.5l3 3"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>',
  camera360: '<svg class="orbit-mark" viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-15 20 20)"><path class="orbit-arc" d="M29.83 13.12A12 12 0 1 0 20 32"/><path class="orbit-head" d="M19.5 26.3 27.6 32 19.5 37.7Z"/></g><circle class="orbit-core" cx="20" cy="20" r="3.6"/></svg>',
}

const state = {
  projectName: 'Untitled tour',
  scenes: [],
  activeSceneId: null,
  activeHotspotId: null,
  addingType: null,
  previewMode: false,
  pendingPoint: null,
  pendingIcon: defaultHotspotIcon,
  theme: { ...defaultTheme },
  // Which scene a tour opens on, and which way it faces. Null means the first
  // scene in the list, facing the default direction, which is how every tour
  // behaved before these existed.
  entrySceneId: null,
  entryView: null,
  // Set while the author is turning the viewer to choose a direction.
  pickingView: null,
  renamingSceneId: null,
  pendingImport: null,
  renderer: null,
}

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="../" aria-label="Showround home">
      <span class="brand-mark">${icons.camera360}</span>
      <span class="brand-lockup">
        <span class="brand-name">SHOW<span>ROUND</span></span>
        <span class="brand-endorsement">by Chaos Created</span>
      </span>
    </a>
    <div class="project-title">
      <input id="project-name" value="${state.projectName}" aria-label="Project name">
      <span class="save-state"><i></i> Saved locally</span>
    </div>
    <div class="top-actions">
      <button class="button secondary" id="preview-tour">Preview</button>
      <button class="button secondary" id="embed-tour">${icons.embed} Embed</button>
      <button class="button secondary" id="import-tour">${icons.import} Import</button>
      <button class="button primary" id="export-tour">${icons.export} Export tour</button>
      <button class="icon-button whats-new-button" id="whats-new" aria-label="What's new in Showround">${icons.megaphone}</button>
      <button class="icon-button" id="tour-settings" aria-label="Tour settings">${icons.settings}</button>
    </div>
  </header>

  <main class="workspace">
    <aside class="sidebar">
      <div class="sidebar-heading">
        <div>
          <span class="eyebrow">Tour content</span>
          <h2>Scenes <span id="scene-count">0</span></h2>
        </div>
        <button class="icon-button compact" id="add-scenes" aria-label="Add media">${icons.plus}</button>
      </div>
      <input id="media-input" type="file" accept="video/*,image/*" multiple hidden>
      <input id="import-input" type="file" accept=".zip,application/zip" hidden>
      <div class="scene-list" id="scene-list"></div>
      <button class="upload-card" id="upload-card">
        <span class="upload-icon">${icons.upload}</span>
        <span><strong>Add 360° media</strong><small>MP4, WebM, MOV, JPG or PNG</small></span>
      </button>
      <div class="sidebar-tip">
        <span>${icons.hotspot}</span>
        <p><strong>Build your journey</strong>Link scenes with interactive hotspots.</p>
      </div>
    </aside>

    <section class="stage">
      <div class="stage-toolbar">
        <div class="breadcrumb">
          <span class="muted">Scenes</span>${icons.chevron}<strong id="active-scene-name">No scene selected</strong>
        </div>
        <div class="interaction-tools">
          <button class="button view-button" id="set-start-view" disabled title="Choose which way the tour faces when it opens">${icons.compass} Starting view</button>
          <button class="button info-button" id="add-info" disabled>i&nbsp; Add info</button>
          <button class="button hotspot-button" id="add-hotspot" disabled>${icons.hotspot} Add hotspot</button>
        </div>
      </div>

      <div class="viewer-shell" id="viewer-shell">
        <div id="viewer"></div>
        <div class="empty-viewer" id="empty-viewer">
          <span class="empty-orbit">${icons.camera360}</span>
          <h1>Turn 360° media into a journey</h1>
          <p>Upload 360° videos or photos, then connect scenes with interactive hotspots.</p>
          <button class="button primary large" id="empty-upload">${icons.upload} Upload media</button>
        </div>
        <div class="drop-overlay" id="drop-overlay">${icons.upload}<strong>Drop videos or photos to add scenes</strong></div>
        <div class="hotspot-layer" id="hotspot-layer"></div>
        <div class="add-instruction" id="add-instruction">Click anywhere to place the hotspot <kbd>Esc</kbd> to cancel</div>
        <div class="view-picker" id="view-picker" hidden>
          <p id="view-picker-text">Turn the view, then choose Use this view.</p>
          <div class="view-picker-actions">
            <button class="button secondary" id="view-picker-cancel" type="button">Cancel</button>
            <button class="button secondary" id="view-picker-default" type="button">Use the default</button>
            <button class="button primary" id="view-picker-use" type="button">Use this view</button>
          </div>
        </div>
        <span class="view-crosshair" id="view-crosshair" aria-hidden="true" hidden></span>
        <div class="view-hint" id="view-hint"><span>↔</span> Drag to look around</div>
      </div>

      <div class="timeline-panel" id="timeline-panel">
        <div class="player-controls">
          <button class="play-button" id="play" disabled>${icons.play}</button>
          <span id="current-time">00:00</span>
          <div class="scrubber" id="scrubber"><div class="scrubber-fill" id="scrubber-fill"></div><div class="scrubber-markers" id="scrubber-markers"></div></div>
          <span id="duration">00:00</span>
        </div>
        <div class="timeline-details">
          <div class="scene-meta">
            <span class="scene-thumb mini" id="timeline-thumb"><span>360°</span></span>
            <div><strong id="timeline-title">Choose a scene</strong><small id="timeline-info">Upload media to get started</small></div>
          </div>
          <div class="hotspot-summary"><span id="hotspot-count">0 interactions</span><small>Interactions remain visible throughout the scene</small></div>
        </div>
      </div>
    </section>

    <aside class="inspector">
      <div class="inspector-empty" id="inspector-empty">
        <span>${icons.hotspot}</span>
        <h3 id="inspector-overview-title">No scene selected</h3>
        <p id="inspector-overview-copy">Choose a scene to view and edit its interactions.</p>
        <div class="interaction-index" id="interaction-index"></div>
      </div>
      <div class="inspector-content" id="inspector-content" hidden>
        <div class="inspector-header">
          <div><span class="eyebrow">Interaction</span><h2 id="interaction-settings-title">Hotspot settings</h2></div>
          <button class="icon-button compact" id="close-inspector">${icons.close}</button>
        </div>
        <label><span id="interaction-label-title">Label</span><input id="hotspot-label" maxlength="60" placeholder="e.g. Enter the kitchen"></label>
        <label id="hotspot-description-wrap" hidden>Information<textarea id="hotspot-description" maxlength="240" rows="5" placeholder="Add a couple of sentences about this point."></textarea><small class="char-count" id="hotspot-description-count"></small></label>
        <label id="hotspot-target-wrap">Link to scene<select id="hotspot-target"></select></label>
        <div class="view-field" id="arrival-view-wrap">
          <span class="pin-field-title">Arrival view</span>
          <div class="view-row">
            <span class="view-status" id="arrival-view-status">Default</span>
            <button class="button secondary compact-button" id="arrival-view-choose" type="button">Choose</button>
            <button class="text-button" id="arrival-view-reset" type="button">Reset</button>
          </div>
          <small class="field-hint">Which way visitors face when this hotspot takes them to the next scene.</small>
        </div>
        <label>Placed at<input id="hotspot-time" type="text" readonly></label>
        <div class="pin-field">
          <span class="pin-field-title">Icon</span>
          <input class="icon-search" type="search" placeholder="Search icons" aria-label="Search icons" data-icon-search="hotspot-icon-picker" autocomplete="off">
          <div class="icon-picker" id="hotspot-icon-picker"></div>
        </div>
        <div class="position-readout"><span>View position</span><code id="hotspot-position">0°, 0°</code></div>
        <button class="delete-button" id="delete-hotspot">Delete hotspot</button>
      </div>
    </aside>
  </main>

  <dialog id="hotspot-dialog">
    <form method="dialog">
      <div class="dialog-icon">${icons.hotspot}</div>
      <h2>Create a hotspot</h2>
      <p>Choose where visitors go when they select this point.</p>
      <label>Hotspot label<input id="new-hotspot-label" maxlength="50" placeholder="e.g. Go to the kitchen" autofocus></label>
      <label>Destination scene<select id="new-hotspot-target"></select></label>
      <div class="pin-field">
        <span class="pin-field-title">Icon</span>
        <input class="icon-search" type="search" placeholder="Search icons" aria-label="Search icons" data-icon-search="new-hotspot-icon-picker" autocomplete="off">
        <div class="icon-picker" id="new-hotspot-icon-picker"></div>
      </div>
      <div class="dialog-actions">
        <button class="button secondary" value="cancel">Cancel</button>
        <button class="button primary" id="confirm-hotspot" value="default">Create hotspot</button>
      </div>
    </form>
  </dialog>
  <dialog id="info-dialog">
    <form method="dialog">
      <div class="dialog-icon info-dialog-icon">i</div>
      <h2>Create an info point</h2>
      <p>Add context visitors can reveal without leaving the scene.</p>
      <label>Title<input id="new-info-title" maxlength="60" placeholder="e.g. Original oak staircase"></label>
      <label>Information<textarea id="new-info-description" maxlength="240" rows="5" placeholder="Add a couple of sentences about this point."></textarea><small class="char-count" id="new-info-description-count"></small></label>
      <div class="pin-field">
        <span class="pin-field-title">Icon</span>
        <input class="icon-search" type="search" placeholder="Search icons" aria-label="Search icons" data-icon-search="new-info-icon-picker" autocomplete="off">
        <div class="icon-picker" id="new-info-icon-picker"></div>
      </div>
      <div class="dialog-actions">
        <button class="button secondary" value="cancel">Cancel</button>
        <button class="button primary" id="confirm-info" value="default">Create info point</button>
      </div>
    </form>
  </dialog>
  <dialog id="embed-dialog">
    <form method="dialog">
      <div class="dialog-icon">${icons.embed}</div>
      <h2>Embed this tour</h2>
      <p>Export the tour, upload the whole folder to your web host, then paste this code where you want the tour to appear.</p>
      <label>Where the tour folder will live<input id="embed-base" placeholder="https://example.com/tours/my-tour" autocomplete="off" spellcheck="false"></label>
      <div class="field-row">
        <label>Width<input id="embed-width" value="100%" autocomplete="off"></label>
        <label>Height<input id="embed-height" value="600" autocomplete="off"></label>
      </div>
      <label>Embed code<textarea id="embed-code" rows="4" readonly spellcheck="false"></textarea></label>
      <div class="dialog-actions">
        <button class="button secondary" value="cancel">Close</button>
        <button class="button primary" id="copy-embed" value="default">Copy code</button>
      </div>
    </form>
  </dialog>
  <dialog id="replace-dialog">
    <form method="dialog">
      <div class="dialog-icon">${icons.import}</div>
      <h2>Replace this tour?</h2>
      <p id="replace-copy">Importing opens the tour from the file. Anything currently open will be discarded, and there is no way back to it.</p>
      <div class="dialog-actions">
        <button class="button secondary" value="cancel">Keep editing</button>
        <button class="button primary" id="confirm-replace" value="default">Import anyway</button>
      </div>
    </form>
  </dialog>
  <dialog id="settings-dialog">
    <form method="dialog">
      <div class="dialog-icon">${icons.settings}</div>
      <h2>Tour settings</h2>
      <p>Pin colours apply to every interaction in this tour. Pick a preset or type any hex code.</p>
      <div class="theme-field">
        <span class="pin-field-title">Hotspots</span>
        <div class="color-picker" id="hotspot-swatches"></div>
        <div class="color-custom">
          <span class="color-preview" id="hotspot-preview"></span>
          <input id="hotspot-hex" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hotspot colour hex code">
        </div>
      </div>
      <div class="theme-field">
        <span class="pin-field-title">Info points</span>
        <div class="color-picker" id="info-swatches"></div>
        <div class="color-custom">
          <span class="color-preview" id="info-preview"></span>
          <input id="info-hex" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Info point colour hex code">
        </div>
      </div>
      <div class="dialog-actions">
        <button class="button primary" value="default">Done</button>
      </div>
    </form>
  </dialog>
  <dialog id="whats-new-dialog">
    <form method="dialog">
      <div class="dialog-icon">${icons.megaphone}</div>
      <h2>What's new</h2>
      <p>You are running Showround <strong id="whats-new-version"></strong>.</p>
      <div class="release-list" id="release-list"></div>
      <div class="dialog-actions">
        <button class="button primary" value="default">Got it</button>
      </div>
    </form>
  </dialog>
  <div class="toast" id="toast"></div>
`

const $ = (selector) => document.querySelector(selector)
const video = document.createElement('video')
video.crossOrigin = 'anonymous'
video.playsInline = true
video.preload = 'metadata'

function uid() {
  return crypto.randomUUID()
}

function activeScene() {
  return state.scenes.find((scene) => scene.id === state.activeSceneId)
}

function activeHotspot() {
  return activeScene()?.hotspots.find((hotspot) => hotspot.id === state.activeHotspotId)
}

function formatTime(seconds = 0) {
  if (!Number.isFinite(seconds)) return '00:00'
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function escapeHtml(value) {
  const element = document.createElement('span')
  element.textContent = value
  return element.innerHTML
}

const SEEN_VERSION_KEY = 'showround:last-seen-version'

function lastSeenVersion() {
  try {
    return localStorage.getItem(SEEN_VERSION_KEY)
  } catch {
    return null
  }
}

function markReleaseSeen() {
  try {
    localStorage.setItem(SEEN_VERSION_KEY, currentRelease.version)
  } catch {
    // Private browsing and blocked site data both throw here. The badge just
    // reappears next visit, which is harmless.
  }
}

function formatReleaseDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function renderReleases() {
  $('#whats-new-version').textContent = `v${currentRelease.version}`
  $('#release-list').innerHTML = releases.map((release, index) => `
    <section class="release${index === 0 ? ' current' : ''}">
      <div class="release-head">
        <span class="release-version">v${escapeHtml(release.version)}</span>
        <time datetime="${escapeAttr(release.date)}">${escapeHtml(formatReleaseDate(release.date))}</time>
      </div>
      <h3>${escapeHtml(release.title)}</h3>
      <ul>${release.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
    </section>
  `).join('')
}

function refreshWhatsNewBadge() {
  $('#whats-new').classList.toggle('unseen', lastSeenVersion() !== currentRelease.version)
}

function openWhatsNew() {
  renderReleases()
  markReleaseSeen()
  refreshWhatsNewBadge()
  $('#whats-new-dialog').showModal()
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

function iconFor(interaction) {
  return interaction?.icon || (interaction?.type === 'info' ? defaultInfoIcon : defaultHotspotIcon)
}

function themeColorFor(interaction) {
  return interaction?.type === 'info' ? state.theme.info : state.theme.hotspot
}

function renderThemeControls() {
  ;['hotspot', 'info'].forEach((kind) => {
    const current = state.theme[kind]
    $(`#${kind}-swatches`).innerHTML = presetColors.map((preset) => `
      <button type="button" class="color-choice ${preset.value === current ? 'selected' : ''}" data-color="${preset.value}" title="${preset.label}" aria-label="${preset.label}" aria-pressed="${preset.value === current}"><span style="background:${preset.value}"></span></button>
    `).join('')

    // Leave the field alone while it is being typed into, otherwise rewriting
    // the value fights the person editing it.
    const field = $(`#${kind}-hex`)
    if (document.activeElement !== field) {
      field.value = current
      field.classList.remove('invalid')
    }

    const preview = $(`#${kind}-preview`)
    preview.setAttribute('style', pinStyle(current))
    preview.innerHTML = pinIconSvg(kind === 'info' ? defaultInfoIcon : defaultHotspotIcon)
  })
}

function applyThemeColor(kind, value) {
  const color = normalizeHex(value)
  if (!color) return false
  state.theme[kind] = color
  renderThemeControls()
  renderHotspots()
  renderInspectorOverview()
  return true
}

function openSettings() {
  renderThemeControls()
  $('#settings-dialog').showModal()
}

function renderIconPicker(container, selected) {
  container.innerHTML = Object.entries(pinIcons).map(([name, icon]) => `
    <button type="button" class="icon-choice ${name === selected ? 'selected' : ''}" data-icon="${name}" data-search="${icon.label.toLowerCase()} ${name}" title="${icon.label}" aria-label="${icon.label}" aria-pressed="${name === selected}">${pinIconSvg(name)}</button>
  `).join('')
  filterIconPicker(container)
}

// The selected icon always stays visible, so filtering never hides the
// current choice.
function filterIconPicker(container) {
  const query = (container.dataset.query || '').trim().toLowerCase()
  container.querySelectorAll('.icon-choice').forEach((choice) => {
    choice.hidden = Boolean(query) && !choice.dataset.search.includes(query) && !choice.classList.contains('selected')
  })
}

function resetIconSearch(container) {
  container.dataset.query = ''
  const field = document.querySelector(`[data-icon-search="${container.id}"]`)
  if (field) field.value = ''
}

function bindIconPicker(container, onPick) {
  container.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-icon]')
    if (!choice) return
    event.preventDefault()
    renderIconPicker(container, choice.dataset.icon)
    onPick(choice.dataset.icon)
  })
}

// An invisible maxlength just stops accepting keystrokes with no explanation,
// so each capped field shows how much room is left.
const charCounters = []

function bindCharCount(fieldSelector, counterSelector) {
  const field = $(fieldSelector)
  const counter = $(counterSelector)
  const limit = Number(field.getAttribute('maxlength'))
  const update = () => {
    counter.textContent = `${field.value.length} / ${limit}`
    counter.classList.toggle('near-limit', field.value.length >= limit - 25)
  }
  field.addEventListener('input', update)
  charCounters.push(update)
  update()
}

function refreshCharCounts() {
  charCounters.forEach((update) => update())
}

function notify(message) {
  const toast = $('#toast')
  toast.textContent = message
  toast.classList.add('visible')
  clearTimeout(notify.timeout)
  notify.timeout = setTimeout(() => toast.classList.remove('visible'), 2200)
}

function isPhotoScene(scene) {
  return scene?.kind === 'photo'
}

function sceneMeta(scene) {
  return isPhotoScene(scene) ? 'Photo' : formatTime(scene.duration)
}

function createPhotoThumbnail(url) {
  return new Promise((resolve) => {
    const image = new Image()
    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 240
      canvas.height = 120
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }, { once: true })
    image.addEventListener('error', () => resolve(''), { once: true })
    image.src = url
  })
}

function loadPhotoTexture(url, maxSize) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => {
      let source = image
      const largest = Math.max(image.naturalWidth, image.naturalHeight)
      if (maxSize && largest > maxSize) {
        const scale = maxSize / largest
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.naturalWidth * scale)
        canvas.height = Math.round(image.naturalHeight * scale)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        source = canvas
      }
      const texture = new THREE.Texture(source)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      resolve(texture)
    }, { once: true })
    image.addEventListener('error', () => reject(new Error('Image could not be loaded')), { once: true })
    image.src = url
  })
}

function createThumbnail(file, url) {
  return new Promise((resolve) => {
    const preview = document.createElement('video')
    preview.muted = true
    preview.preload = 'metadata'
    preview.src = url
    preview.addEventListener('loadeddata', () => {
      preview.currentTime = Math.min(1, preview.duration / 3 || 0)
    }, { once: true })
    preview.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 240
      canvas.height = 120
      canvas.getContext('2d').drawImage(preview, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }, { once: true })
    preview.addEventListener('error', () => resolve(''), { once: true })
    setTimeout(() => resolve(''), 3000)
  })
}

async function addFiles(files) {
  const media = [...files].filter((file) => file.type.startsWith('video/') || file.type.startsWith('image/'))
  if (!media.length) {
    notify('Choose one or more 360° videos or photos')
    return
  }

  for (const file of media) {
    const url = URL.createObjectURL(file)
    const kind = file.type.startsWith('image/') ? 'photo' : 'video'
    const scene = {
      id: uid(),
      kind,
      name: file.name.replace(/\.[^.]+$/, ''),
      fileName: file.name,
      file,
      url,
      thumbnail: '',
      duration: 0,
      hotspots: [],
    }
    state.scenes.push(scene)
    scene.thumbnail = kind === 'photo' ? await createPhotoThumbnail(url) : await createThumbnail(file, url)
  }

  if (!state.activeSceneId) selectScene(state.scenes[0].id)
  renderScenes()
  notify(`${media.length} scene${media.length === 1 ? '' : 's'} added`)
}

function renderScenes() {
  $('#scene-count').textContent = state.scenes.length
  $('#scene-list').innerHTML = state.scenes.map((scene, index) => {
    const thumb = `
      <span class="scene-thumb" ${scene.thumbnail ? `style="background-image:url('${scene.thumbnail}')"` : ''}>
        <span>${isPhotoScene(scene) ? 'Photo' : '360°'}</span>
        <b>${index + 1}</b>
      </span>`
    const meta = `<small>${sceneMeta(scene)} · ${scene.hotspots.length} interaction${scene.hotspots.length === 1 ? '' : 's'}</small>`
    // An input cannot sit inside a button, so a row being renamed swaps its
    // button for a plain container until the name is saved or abandoned.
    if (scene.id === state.renamingSceneId) {
      return `
        <div class="scene-item is-renaming ${scene.id === state.activeSceneId ? 'active' : ''}">
          <div class="scene-open">
            ${thumb}
            <span class="scene-copy">
              <input class="scene-name-input" data-rename-input="${scene.id}" value="${escapeHtml(scene.name)}" maxlength="${SCENE_NAME_LIMIT}" aria-label="Scene name" spellcheck="false">
              <small>Enter to save, Esc to cancel</small>
            </span>
          </div>
        </div>`
    }
    return `
      <div class="scene-item ${scene.id === state.activeSceneId ? 'active' : ''}">
        <button class="scene-open" data-scene="${scene.id}">
          ${thumb}
          <span class="scene-copy">
            <strong>${escapeHtml(scene.name)}</strong>
            ${meta}
          </span>
        </button>
        <button class="scene-rename" data-rename-scene="${scene.id}" aria-label="Rename ${escapeHtml(scene.name)}" title="Rename">
          ${icons.pencil}
        </button>
      </div>`
  }).join('')

  $('#upload-card').classList.toggle('with-scenes', state.scenes.length > 0)

  const input = document.querySelector('[data-rename-input]')
  if (input) {
    input.focus()
    input.select()
  }
}

const SCENE_NAME_LIMIT = 60

// The file name follows the scene name, so a renamed scene exports as, say,
// media/front-garden.jpg. It keeps the original extension because that is what
// tells the browser how to read the file.
function fileNameFor(name, previousFileName) {
  const extension = (previousFileName.match(/\.[a-zA-Z0-9]+$/) || [''])[0].toLowerCase()
  const stem = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${stem || 'scene'}${extension}`
}

function startRenameScene(id) {
  if (state.previewMode || !state.scenes.some((scene) => scene.id === id)) return
  state.renamingSceneId = id
  renderScenes()
}

function finishRenameScene(save) {
  const id = state.renamingSceneId
  if (!id) return
  const input = document.querySelector('[data-rename-input]')
  const scene = state.scenes.find((item) => item.id === id)
  // Cleared before re-rendering so the blur that follows removing the input
  // finds nothing left to save.
  state.renamingSceneId = null
  const name = input?.value.replace(/\s+/g, ' ').trim().slice(0, SCENE_NAME_LIMIT)
  if (save && scene && name && name !== scene.name) {
    scene.name = name
    scene.fileName = fileNameFor(name, scene.fileName)
    document.querySelectorAll(`option[value="${id}"]`).forEach((option) => { option.textContent = name })
    if (id === state.activeSceneId) {
      $('#active-scene-name').textContent = scene.name
      $('#timeline-title').textContent = scene.name
      $('#timeline-info').textContent = scene.fileName
      $('#inspector-overview-title').textContent = scene.name
    }
    notify(`Renamed to ${name}`)
  }
  renderScenes()
}

function selectScene(id, view) {
  const scene = state.scenes.find((item) => item.id === id)
  if (!scene) return

  const photo = isPhotoScene(scene)
  state.activeSceneId = id
  state.activeHotspotId = null
  state.addingType = null
  video.pause()
  if (!photo) {
    video.src = scene.url
    video.load()
  }
  state.renderer?.showScene(scene)
  $('#timeline-panel').classList.toggle('still', photo)
  $('#active-scene-name').textContent = scene.name
  $('#timeline-title').textContent = scene.name
  $('#timeline-info').textContent = scene.fileName
  $('#timeline-thumb').style.backgroundImage = scene.thumbnail ? `url('${scene.thumbnail}')` : ''
  $('#timeline-thumb').querySelector('span').textContent = photo ? 'Photo' : '360°'
  $('#empty-viewer').hidden = true
  $('#add-hotspot').disabled = state.previewMode
  $('#add-info').disabled = state.previewMode
  $('#play').disabled = photo
  $('#view-hint').classList.add('visible')
  setTimeout(() => $('#view-hint').classList.remove('visible'), 3200)
  closeInspector()
  renderScenes()
  renderHotspots()
  updateTimeline()
  updateStartViewButton()
  state.renderer?.resetView(view || defaultViewFor(id))
}

function renderHotspots() {
  const scene = activeScene()
  if (!scene || !state.renderer) {
    $('#hotspot-layer').innerHTML = ''
    return
  }

  $('#hotspot-layer').innerHTML = scene.hotspots.map((hotspot) => `
    <button class="viewer-hotspot ${hotspot.type === 'info' ? 'info-point' : ''} ${hotspot.id === state.activeHotspotId ? 'selected' : ''}" data-hotspot="${hotspot.id}" title="${escapeHtml(hotspot.label)}">
      <span style="${pinStyle(themeColorFor(hotspot))}">${pinIconSvg(iconFor(hotspot))}</span>
      ${hotspot.type === 'info'
        ? `<span class="info-card"><b>${escapeHtml(hotspot.label)}</b><p>${escapeHtml(hotspot.description || '')}</p></span>`
        : `<b>${escapeHtml(hotspot.label)}</b>`}
    </button>
  `).join('')

  document.querySelectorAll('[data-hotspot]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      const hotspot = scene.hotspots.find((item) => item.id === button.dataset.hotspot)
      if (state.previewMode && hotspot?.type === 'info') {
        button.classList.toggle('expanded')
      } else if (state.previewMode) {
        followHotspot(button.dataset.hotspot)
      } else {
        selectHotspot(button.dataset.hotspot)
      }
    })
  })
  measureHotspotCards()
  positionHotspots()
  updateTimeline()
}

// Measured once per render rather than per frame: positionHotspots runs on
// every animation frame, and reading a width there would force a layout each
// time. Card content only changes on a re-render, so this stays in step.
function measureHotspotCards() {
  document.querySelectorAll('[data-hotspot]').forEach((button) => {
    const card = button.querySelector('.info-card') || button.querySelector(':scope > b')
    button.dataset.cardWidth = card ? Math.ceil(card.getBoundingClientRect().width) : 0
  })
}

function positionHotspots() {
  const scene = activeScene()
  if (!scene || !state.renderer) return

  const bounds = $('#viewer').getBoundingClientRect()
  document.querySelectorAll('[data-hotspot]').forEach((button) => {
    const hotspot = scene.hotspots.find((item) => item.id === button.dataset.hotspot)
    const point = state.renderer.worldToScreen(hotspot.yaw, hotspot.pitch)
    button.style.transform = `translate(${point.x}px, ${point.y}px)`
    button.classList.toggle('behind', !point.visible)
    // Prefer the right, flip only when that overflows and the left has room.
    // If neither side fits the card is wider than the viewer, so leave it right.
    const cardWidth = Number(button.dataset.cardWidth) || 0
    const noRoomRight = point.x + cardWidth > bounds.width - 16
    const noRoomLeft = point.x - cardWidth < 16
    button.classList.toggle('flipped', noRoomRight && !noRoomLeft)
  })
}

function selectHotspot(id) {
  state.activeHotspotId = id
  const hotspot = activeHotspot()
  if (!hotspot) return

  $('#inspector-empty').hidden = false
  $('#inspector-content').hidden = false
  const isInfo = hotspot.type === 'info'
  $('#interaction-settings-title').textContent = isInfo ? 'Info settings' : 'Hotspot settings'
  $('#interaction-label-title').textContent = isInfo ? 'Title' : 'Label'
  $('#hotspot-label').value = hotspot.label
  $('#hotspot-description').value = hotspot.description || ''
  $('#hotspot-description-wrap').hidden = !isInfo
  $('#hotspot-target-wrap').hidden = isInfo
  $('#arrival-view-wrap').hidden = isInfo
  if (!isInfo) renderArrivalView(hotspot)
  $('#delete-hotspot').textContent = isInfo ? 'Delete info point' : 'Delete hotspot'
  resetIconSearch($('#hotspot-icon-picker'))
  renderIconPicker($('#hotspot-icon-picker'), iconFor(hotspot))
  $('#hotspot-time').value = formatTime(hotspot.time)
  $('#hotspot-position').textContent = `${Math.round(hotspot.yaw)}°, ${Math.round(hotspot.pitch)}°`
  refreshCharCounts()
  if (!isInfo) populateSceneSelect($('#hotspot-target'), hotspot.targetSceneId)
  renderInspectorOverview()
  renderHotspots()
}

function closeInspector() {
  state.activeHotspotId = null
  $('#inspector-empty').hidden = false
  $('#inspector-content').hidden = true
  renderInspectorOverview()
  renderHotspots()
}

function renderInspectorOverview() {
  const scene = activeScene()
  const panel = $('#inspector-empty')
  panel.classList.toggle('has-scene', Boolean(scene))
  if (!scene) {
    $('#inspector-overview-title').textContent = 'No scene selected'
    $('#inspector-overview-copy').textContent = 'Choose a scene to view and edit its interactions.'
    $('#interaction-index').innerHTML = ''
    return
  }

  $('#inspector-overview-title').textContent = scene.name
  $('#inspector-overview-copy').textContent = scene.hotspots.length
    ? 'Select an interaction below or directly in the viewer.'
    : 'This scene has no interactions yet. Add a hotspot or info point above the viewer.'
  $('#interaction-index').innerHTML = scene.hotspots.map((interaction) => `
    <div class="interaction-index-row ${interaction.id === state.activeHotspotId ? 'selected' : ''}">
      <button class="interaction-index-edit" data-inspector-interaction="${interaction.id}" aria-label="Edit ${escapeHtml(interaction.label)}">
        <i style="${pinStyle(themeColorFor(interaction))}">${pinIconSvg(iconFor(interaction))}</i>
        <span><strong>${escapeHtml(interaction.label)}</strong><small>${interaction.type === 'info' ? 'Info point' : 'Linked hotspot'}</small></span>
        ${icons.chevron}
      </button>
      <button class="interaction-index-delete" data-delete-interaction="${interaction.id}" aria-label="Delete ${escapeHtml(interaction.label)}" title="Delete">
        ${icons.trash}
      </button>
    </div>
  `).join('')
  document.querySelectorAll('[data-inspector-interaction]').forEach((button) => {
    button.addEventListener('click', () => selectHotspot(button.dataset.inspectorInteraction))
  })
  document.querySelectorAll('[data-delete-interaction]').forEach((button) => {
    button.addEventListener('click', () => deleteInteraction(button.dataset.deleteInteraction))
  })
}

function deleteInteraction(id) {
  const scene = activeScene()
  const interaction = scene?.hotspots.find((item) => item.id === id)
  if (!scene || !interaction) return
  scene.hotspots = scene.hotspots.filter((item) => item.id !== id)
  closeInspector()
  renderScenes()
  notify(`${interaction.type === 'info' ? 'Info point' : 'Hotspot'} deleted`)
}

function entrySceneId() {
  return state.scenes.some((scene) => scene.id === state.entrySceneId) ? state.entrySceneId : state.scenes[0]?.id
}

// The view a scene opens at when nothing more specific was asked for: the
// starting view for the first scene, the default direction for the rest.
function defaultViewFor(sceneId) {
  return sceneId === entrySceneId() ? state.entryView : null
}

function updateStartViewButton() {
  const button = $('#set-start-view')
  button.disabled = !state.scenes.length || state.previewMode || Boolean(state.pickingView)
  button.classList.toggle('is-set', Boolean(state.entryView))
}

function renderArrivalView(hotspot) {
  const set = Boolean(hotspot?.targetView)
  $('#arrival-view-status').textContent = set ? 'Set' : 'Default'
  $('#arrival-view-status').classList.toggle('is-set', set)
  $('#arrival-view-reset').hidden = !set
  $('#arrival-view-choose').disabled = !state.scenes.some((scene) => scene.id === hotspot?.targetSceneId)
}

function enterViewPicker(picking) {
  cancelAddHotspot()
  state.pickingView = picking
  document.body.classList.add('picking-view')
  if (picking.mode === 'entry') {
    selectScene(entrySceneId())
    $('#view-picker-text').textContent = 'Turn the view to where the tour should open, then choose Use this view.'
    $('#view-picker-default').hidden = !state.entryView
  } else {
    const hotspot = findHotspot(picking.sourceSceneId, picking.hotspotId)
    const target = state.scenes.find((scene) => scene.id === hotspot.targetSceneId)
    selectScene(target.id, hotspot.targetView)
    $('#view-picker-text').textContent = `Turn the view to where visitors should face when they arrive in ${target.name}, then choose Use this view.`
    $('#view-picker-default').hidden = !hotspot.targetView
  }
  $('#view-picker').hidden = false
  $('#view-crosshair').hidden = false
  updateStartViewButton()
}

function exitViewPicker(view) {
  const picking = state.pickingView
  if (!picking) return
  state.pickingView = null
  document.body.classList.remove('picking-view')
  $('#view-picker').hidden = true
  $('#view-crosshair').hidden = true

  if (picking.mode === 'entry') {
    if (view !== undefined) {
      state.entryView = view
      notify(view ? 'Starting view saved' : 'Starting view reset to the default')
    }
  } else {
    const hotspot = findHotspot(picking.sourceSceneId, picking.hotspotId)
    if (hotspot && view !== undefined) {
      if (view) hotspot.targetView = view
      else delete hotspot.targetView
      notify(view ? 'Arrival view saved' : 'Arrival view reset to the default')
    }
    selectScene(picking.sourceSceneId)
    if (hotspot) selectHotspot(hotspot.id)
  }
  updateStartViewButton()
}

function findHotspot(sceneId, hotspotId) {
  return state.scenes.find((scene) => scene.id === sceneId)?.hotspots.find((item) => item.id === hotspotId)
}

function playVideo() {
  if (isPhotoScene(activeScene())) return
  video.play().catch(() => {
    notify('Playback was blocked. Select play to continue.')
  })
}

function followHotspot(id) {
  const hotspot = activeScene()?.hotspots.find((item) => item.id === id)
  const target = state.scenes.find((scene) => scene.id === hotspot?.targetSceneId)
  if (!target) {
    notify('This hotspot has no destination scene')
    return
  }

  selectScene(target.id, hotspot.targetView)
  playVideo()
  notify(`Entering ${target.name}`)
}

function togglePreview() {
  if (!activeScene()) {
    notify('Add a scene to preview')
    return
  }

  state.previewMode = !state.previewMode
  document.body.classList.toggle('preview-mode', state.previewMode)
  $('#preview-tour').textContent = state.previewMode ? 'Exit preview' : 'Preview'
  $('#preview-tour').classList.toggle('preview-active', state.previewMode)
  $('#add-hotspot').disabled = state.previewMode
  $('#add-info').disabled = state.previewMode
  cancelAddHotspot()
  closeInspector()
  updateStartViewButton()

  if (state.previewMode) {
    playVideo()
    notify('Preview mode — select a hotspot to move between scenes')
  } else {
    video.pause()
    notify('Back in editor mode')
  }
}

function populateSceneSelect(select, selectedId = '') {
  const choices = state.scenes.filter((scene) => scene.id !== state.activeSceneId)
  select.innerHTML = choices.length
    ? choices.map((scene) => `<option value="${scene.id}" ${scene.id === selectedId ? 'selected' : ''}>${escapeHtml(scene.name)}</option>`).join('')
    : '<option value="">Add another scene first</option>'
  select.disabled = !choices.length
}

function beginAddHotspot() {
  if (!activeScene()) return
  if (state.scenes.length < 2) {
    notify('Add another scene before creating a link')
    $('#media-input').click()
    return
  }
  beginPlacement('hotspot')
}

function beginAddInfo() {
  if (!activeScene()) return
  beginPlacement('info')
}

function beginPlacement(type) {
  state.addingType = type
  $('#add-instruction').innerHTML = `Click anywhere to place the ${type === 'info' ? 'info point' : 'hotspot'} <kbd>Esc</kbd> to cancel`
  $('#viewer-shell').classList.add('placing')
  $('#add-instruction').classList.add('visible')
}

function cancelAddHotspot() {
  state.addingType = null
  state.pendingPoint = null
  $('#viewer-shell').classList.remove('placing')
  $('#add-instruction').classList.remove('visible')
}

function openHotspotDialog(event) {
  if (!state.addingType || !state.renderer) return
  const bounds = $('#viewer').getBoundingClientRect()
  state.pendingPoint = state.renderer.screenToAngles(event.clientX - bounds.left, event.clientY - bounds.top)
  if (state.addingType === 'info') {
    state.pendingIcon = defaultInfoIcon
    resetIconSearch($('#new-info-icon-picker'))
    renderIconPicker($('#new-info-icon-picker'), state.pendingIcon)
    $('#new-info-title').value = ''
    $('#new-info-description').value = ''
    refreshCharCounts()
    $('#info-dialog').showModal()
  } else {
    state.pendingIcon = defaultHotspotIcon
    resetIconSearch($('#new-hotspot-icon-picker'))
    renderIconPicker($('#new-hotspot-icon-picker'), state.pendingIcon)
    populateSceneSelect($('#new-hotspot-target'))
    $('#new-hotspot-label').value = ''
    $('#hotspot-dialog').showModal()
  }
}

function confirmHotspot(event) {
  event.preventDefault()
  const label = $('#new-hotspot-label').value.trim()
  const targetSceneId = $('#new-hotspot-target').value
  if (!label || !targetSceneId || !state.pendingPoint) {
    notify('Add a label and destination')
    return
  }

  const hotspot = {
    id: uid(),
    type: 'hotspot',
    label,
    targetSceneId,
    time: isPhotoScene(activeScene()) ? 0 : video.currentTime,
    icon: state.pendingIcon || defaultHotspotIcon,
    ...state.pendingPoint,
  }
  activeScene().hotspots.push(hotspot)
  $('#hotspot-dialog').close()
  cancelAddHotspot()
  renderScenes()
  selectHotspot(hotspot.id)
  notify('Hotspot created')
}

function confirmInfo(event) {
  event.preventDefault()
  const label = $('#new-info-title').value.trim()
  const description = $('#new-info-description').value.trim()
  if (!label || !description || !state.pendingPoint) {
    notify('Add a title and some information')
    return
  }

  const infoPoint = {
    id: uid(),
    type: 'info',
    label,
    description,
    icon: state.pendingIcon || defaultInfoIcon,
    time: isPhotoScene(activeScene()) ? 0 : video.currentTime,
    ...state.pendingPoint,
  }
  activeScene().hotspots.push(infoPoint)
  $('#info-dialog').close()
  cancelAddHotspot()
  renderScenes()
  selectHotspot(infoPoint.id)
  notify('Info point created')
}

function updateTimeline() {
  const scene = activeScene()
  const photo = isPhotoScene(scene)
  const duration = photo ? 0 : Number.isFinite(video.duration) ? video.duration : scene?.duration || 0
  const progress = duration ? (video.currentTime / duration) * 100 : 0
  $('#current-time').textContent = photo ? '00:00' : formatTime(video.currentTime)
  $('#duration').textContent = photo ? '00:00' : formatTime(duration)
  $('#scrubber-fill').style.width = `${photo ? 0 : progress}%`
  $('#play').innerHTML = video.paused ? icons.play : icons.pause
  $('#hotspot-count').textContent = `${scene?.hotspots.length || 0} interaction${scene?.hotspots.length === 1 ? '' : 's'}`
  $('#scrubber-markers').innerHTML = (photo ? [] : scene?.hotspots || []).map((hotspot) => {
    const left = duration ? (hotspot.time / duration) * 100 : 0
    return `<i style="left:${left}%" title="${escapeHtml(hotspot.label)}"></i>`
  }).join('')
  positionHotspots()
}

function createViewer() {
  const container = $('#viewer')
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 1100)
  camera.target = new THREE.Vector3(0, 0, 0)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const geometry = new THREE.SphereGeometry(500, 60, 40)
  geometry.scale(-1, 1, 1)
  const videoTexture = new THREE.VideoTexture(video)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshBasicMaterial({ map: videoTexture })
  scene.add(new THREE.Mesh(geometry, material))
  const photoTextures = new Map()

  let longitude = 0
  let latitude = 0
  let dragging = false
  let startX = 0
  let startY = 0
  let startLongitude = 0
  let startLatitude = 0

  function resize() {
    const { clientWidth, clientHeight } = container
    renderer.setSize(clientWidth, clientHeight, false)
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
  }

  function updateCamera() {
    latitude = Math.max(-85, Math.min(85, latitude))
    const phi = THREE.MathUtils.degToRad(90 - latitude)
    const theta = THREE.MathUtils.degToRad(longitude)
    camera.target.set(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta))
    camera.lookAt(camera.target)
  }

  function animate() {
    requestAnimationFrame(animate)
    resize()
    updateCamera()
    renderer.render(scene, camera)
    positionHotspots()
  }

  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (state.addingType) return
    dragging = true
    startX = event.clientX
    startY = event.clientY
    startLongitude = longitude
    startLatitude = latitude
    renderer.domElement.setPointerCapture(event.pointerId)
  })
  renderer.domElement.addEventListener('pointermove', (event) => {
    if (!dragging) return
    longitude = startLongitude + (startX - event.clientX) * 0.14
    latitude = startLatitude + (event.clientY - startY) * 0.14
  })
  renderer.domElement.addEventListener('pointerup', () => { dragging = false })
  renderer.domElement.addEventListener('wheel', (event) => {
    camera.fov = Math.max(35, Math.min(90, camera.fov + event.deltaY * 0.04))
    camera.updateProjectionMatrix()
  }, { passive: true })
  renderer.domElement.addEventListener('click', openHotspotDialog)

  const raycaster = new THREE.Raycaster()
  animate()

  return {
    showScene(target) {
      if (!target) return
      if (target.kind !== 'photo') {
        material.map = videoTexture
        material.needsUpdate = true
        return
      }

      const cached = photoTextures.get(target.id)
      if (cached) {
        material.map = cached
        material.needsUpdate = true
        return
      }

      loadPhotoTexture(target.url, renderer.capabilities.maxTextureSize).then((photoTexture) => {
        photoTextures.set(target.id, photoTexture)
        if (state.activeSceneId !== target.id) return
        material.map = photoTexture
        material.needsUpdate = true
      }).catch(() => notify(`${target.name} could not be displayed`))
    },
    resetView(view) {
      longitude = view ? view.yaw : 0
      latitude = view ? view.pitch : 0
      camera.fov = 72
      camera.updateProjectionMatrix()
    },
    // In the same degrees as a pin's yaw and pitch, so a saved view and a pin
    // placed at the centre of the screen agree.
    getView() {
      return viewFrom({ yaw: longitude, pitch: Math.max(-85, Math.min(85, latitude)) })
    },
    screenToAngles(x, y) {
      const rect = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const direction = raycaster.ray.direction
      return {
        yaw: THREE.MathUtils.radToDeg(Math.atan2(direction.z, direction.x)),
        pitch: THREE.MathUtils.radToDeg(Math.asin(direction.y)),
      }
    },
    worldToScreen(yaw, pitch) {
      const phi = THREE.MathUtils.degToRad(pitch)
      const theta = THREE.MathUtils.degToRad(yaw)
      const point = new THREE.Vector3(Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta))
      const visible = point.dot(camera.getWorldDirection(new THREE.Vector3())) > 0
      point.project(camera)
      const rect = renderer.domElement.getBoundingClientRect()
      return { x: (point.x * 0.5 + 0.5) * rect.width, y: (-point.y * 0.5 + 0.5) * rect.height, visible }
    },
  }
}

function buildEmbedCode() {
  const base = ($('#embed-base').value.trim() || 'https://example.com/tours/my-tour').replace(/\/+$/, '')
  const width = $('#embed-width').value.trim() || '100%'
  const rawHeight = $('#embed-height').value.trim() || '600'
  const height = /^\d+$/.test(rawHeight) ? rawHeight : rawHeight
  const title = escapeAttr(state.projectName || 'Virtual tour')
  return `<iframe src="${escapeAttr(base)}/embed.html" title="${title}" width="${escapeAttr(width)}" height="${escapeAttr(height)}" style="border:0;border-radius:12px;max-width:100%" loading="lazy" allowfullscreen></iframe>`
}

function refreshEmbedCode() {
  $('#embed-code').value = buildEmbedCode()
}

function openEmbedDialog() {
  if (!state.scenes.length) {
    notify('Add a scene before embedding')
    return
  }
  refreshEmbedCode()
  $('#embed-dialog').showModal()
}

async function copyEmbedCode(event) {
  event.preventDefault()
  try {
    await navigator.clipboard.writeText(buildEmbedCode())
    notify('Embed code copied')
  } catch {
    $('#embed-code').select()
    notify('Press Ctrl+C to copy the selected code')
  }
}

const MIME_BY_EXTENSION = {
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v', ogv: 'video/ogg',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif',
}

function mimeForFile(name) {
  return MIME_BY_EXTENSION[name.split('.').pop()?.toLowerCase()] || ''
}

// The manifest itself is read by tour-format.js, which knows every format the
// editor has ever exported. This only turns its media entries into files.
async function readTourZip(file) {
  const tour = await parseTourZip(await JSZip.loadAsync(file))
  const scenes = []
  for (const scene of tour.scenes) {
    const blob = await scene.entry.async('blob')
    const media = new File([blob], scene.fileName, { type: blob.type || mimeForFile(scene.fileName) })
    scenes.push({
      id: scene.id || uid(),
      kind: scene.kind,
      name: scene.name,
      fileName: scene.fileName,
      file: media,
      url: URL.createObjectURL(media),
      thumbnail: '',
      duration: scene.duration,
      hotspots: scene.hotspots,
    })
  }
  return { ...tour, scenes }
}

async function applyImportedTour(file) {
  const button = $('#import-tour')
  button.disabled = true
  button.textContent = 'Opening tour…'
  try {
    const tour = await readTourZip(file)
    state.scenes.forEach((scene) => URL.revokeObjectURL(scene.url))
    video.pause()
    video.removeAttribute('src')
    state.scenes = tour.scenes
    state.activeSceneId = null
    state.activeHotspotId = null
    state.projectName = tour.name || 'Imported tour'
    state.theme = tour.theme
    state.entrySceneId = tour.entrySceneId || null
    state.entryView = tour.entryView
    $('#project-name').value = state.projectName

    for (const scene of state.scenes) {
      scene.thumbnail = scene.kind === 'photo'
        ? await createPhotoThumbnail(scene.url)
        : await createThumbnail(scene.file, scene.url)
    }

    const entry = state.scenes.find((scene) => scene.id === tour.entrySceneId) || state.scenes[0]
    renderScenes()
    selectScene(entry.id)
    notify(`Opened ${state.projectName}`)
  } catch (error) {
    notify(error.friendly ? error.message : 'That file is not a Showround tour export')
  } finally {
    button.disabled = false
    button.innerHTML = `${icons.import} Import`
  }
}

function requestImport(file) {
  if (!file) return
  if (!state.scenes.length) {
    applyImportedTour(file)
    return
  }
  state.pendingImport = file
  $('#replace-copy').textContent = `Importing opens the tour from the file. The ${state.scenes.length} scene${state.scenes.length === 1 ? '' : 's'} currently open will be discarded, and there is no way back.`
  $('#replace-dialog').showModal()
}

async function exportTour() {
  if (!state.scenes.length) {
    notify('Add scenes before exporting')
    return
  }

  const button = $('#export-tour')
  button.disabled = true
  button.textContent = 'Building tour…'
  const zip = new JSZip()
  const usedNames = new Set()
  const exportedScenes = state.scenes.map(({ id, kind, name, fileName, file, duration, hotspots }) => {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
    let exportName = safeName
    let suffix = 2
    while (usedNames.has(exportName.toLowerCase())) {
      const dot = safeName.lastIndexOf('.')
      exportName = dot > 0 ? `${safeName.slice(0, dot)}-${suffix}${safeName.slice(dot)}` : `${safeName}-${suffix}`
      suffix += 1
    }
    usedNames.add(exportName.toLowerCase())
    zip.file(`media/${exportName}`, file)
    return { id, kind: kind || 'video', name, fileName, src: `./media/${exportName}`, duration, hotspots }
  })

  // Ink is resolved here rather than in the player, so a published tour does
  // not have to carry the contrast maths just to draw two discs.
  const manifest = {
    version: 2,
    name: state.projectName,
    theme: {
      hotspot: { background: state.theme.hotspot, ink: inkFor(state.theme.hotspot) },
      info: { background: state.theme.info, ink: inkFor(state.theme.info) },
    },
    entrySceneId: entrySceneId(),
    ...(state.entryView ? { entryView: state.entryView } : {}),
    scenes: exportedScenes,
  }

  const iconPaths = Object.fromEntries(Object.entries(pinIcons).map(([name, icon]) => [name, icon.path]))
  zip.file('index.html', playerHtml)
  zip.file('embed.html', embedHtml)
  zip.file('styles.css', playerStyles)
  zip.file('player.js', playerScript.replace('__PIN_ICONS__', JSON.stringify(iconPaths)))
  zip.file('three.module.js', threeSource)
  zip.file('three.core.min.js', threeCoreSource)
  zip.file('tour.json', JSON.stringify(manifest, null, 2))
  zip.file('README.txt', exportReadme)

  try {
    const blob = await zip.generateAsync({ type: 'blob', streamFiles: true })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${state.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'showround-tour'}.zip`
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    notify('Publishable tour exported')
  } catch {
    notify('The tour could not be exported')
  } finally {
    button.disabled = false
    button.innerHTML = `${icons.export} Export tour`
  }
}

function bindEvents() {
  const sceneList = $('#scene-list')
  // Double-clicking a name renames it. The first click re-renders the list,
  // which stops the browser seeing a dblclick, so the pair is timed here.
  let lastNameClick = { id: null, at: 0 }
  sceneList.addEventListener('click', (event) => {
    const rename = event.target.closest('[data-rename-scene]')
    if (rename) return startRenameScene(rename.dataset.renameScene)
    const open = event.target.closest('[data-scene]')
    if (!open) return
    const id = open.dataset.scene
    if (event.target.closest('.scene-copy strong')) {
      const now = performance.now()
      if (lastNameClick.id === id && now - lastNameClick.at < 450) {
        lastNameClick = { id: null, at: 0 }
        return startRenameScene(id)
      }
      lastNameClick = { id, at: now }
    }
    selectScene(id)
  })
  sceneList.addEventListener('keydown', (event) => {
    if (!event.target.matches('[data-rename-input]')) return
    if (event.key === 'Enter') { event.preventDefault(); finishRenameScene(true) }
    if (event.key === 'Escape') { event.stopPropagation(); finishRenameScene(false) }
  })
  sceneList.addEventListener('focusout', (event) => {
    if (event.target.matches('[data-rename-input]')) finishRenameScene(true)
  })

  const input = $('#media-input')
  ;['#add-scenes', '#upload-card', '#empty-upload'].forEach((selector) => {
    $(selector).addEventListener('click', () => input.click())
  })
  input.addEventListener('change', () => {
    addFiles(input.files)
    input.value = ''
  })
  $('#add-hotspot').addEventListener('click', beginAddHotspot)
  $('#add-info').addEventListener('click', beginAddInfo)
  $('#confirm-hotspot').addEventListener('click', confirmHotspot)
  $('#confirm-info').addEventListener('click', confirmInfo)
  $('#hotspot-dialog').addEventListener('close', cancelAddHotspot)
  $('#info-dialog').addEventListener('close', cancelAddHotspot)
  $('#close-inspector').addEventListener('click', closeInspector)
  $('#play').addEventListener('click', () => {
    if (isPhotoScene(activeScene())) return
    video.paused ? playVideo() : video.pause()
  })
  $('#scrubber').addEventListener('click', (event) => {
    if (isPhotoScene(activeScene()) || !Number.isFinite(video.duration)) return
    const rect = event.currentTarget.getBoundingClientRect()
    video.currentTime = ((event.clientX - rect.left) / rect.width) * video.duration
  })
  $('#project-name').addEventListener('input', (event) => { state.projectName = event.target.value })
  $('#export-tour').addEventListener('click', exportTour)
  const importInput = $('#import-input')
  $('#import-tour').addEventListener('click', () => importInput.click())
  importInput.addEventListener('change', () => {
    requestImport(importInput.files[0])
    importInput.value = ''
  })
  $('#confirm-replace').addEventListener('click', () => {
    const file = state.pendingImport
    state.pendingImport = null
    if (file) applyImportedTour(file)
  })
  $('#replace-dialog').addEventListener('close', () => { state.pendingImport = null })
  $('#preview-tour').addEventListener('click', togglePreview)

  $('#hotspot-label').addEventListener('input', (event) => {
    activeHotspot().label = event.target.value
    renderInspectorOverview()
    renderHotspots()
    renderScenes()
  })
  $('#hotspot-description').addEventListener('input', (event) => {
    activeHotspot().description = event.target.value
    renderHotspots()
  })
  $('#hotspot-target').addEventListener('change', (event) => {
    const hotspot = activeHotspot()
    hotspot.targetSceneId = event.target.value
    // An arrival view belongs to the scene it was chosen in.
    delete hotspot.targetView
    renderArrivalView(hotspot)
  })
  $('#arrival-view-choose').addEventListener('click', () => {
    const hotspot = activeHotspot()
    if (hotspot) enterViewPicker({ mode: 'arrival', sourceSceneId: state.activeSceneId, hotspotId: hotspot.id })
  })
  $('#arrival-view-reset').addEventListener('click', () => {
    const hotspot = activeHotspot()
    if (!hotspot) return
    delete hotspot.targetView
    renderArrivalView(hotspot)
    notify('Arrival view reset to the default')
  })
  $('#set-start-view').addEventListener('click', () => enterViewPicker({ mode: 'entry' }))
  $('#view-picker-use').addEventListener('click', () => exitViewPicker(state.renderer.getView()))
  $('#view-picker-default').addEventListener('click', () => exitViewPicker(null))
  $('#view-picker-cancel').addEventListener('click', () => exitViewPicker())
  document.querySelectorAll('[data-icon-search]').forEach((field) => {
    field.addEventListener('input', () => {
      const container = document.getElementById(field.dataset.iconSearch)
      container.dataset.query = field.value
      filterIconPicker(container)
    })
    // Enter in a search box inside a dialog form would otherwise submit it.
    field.addEventListener('keydown', (event) => { if (event.key === 'Enter') event.preventDefault() })
  })
  bindIconPicker($('#hotspot-icon-picker'), (icon) => {
    activeHotspot().icon = icon
    renderHotspots()
    renderInspectorOverview()
  })
  bindIconPicker($('#new-hotspot-icon-picker'), (icon) => { state.pendingIcon = icon })
  bindIconPicker($('#new-info-icon-picker'), (icon) => { state.pendingIcon = icon })
  bindCharCount('#hotspot-description', '#hotspot-description-count')
  bindCharCount('#new-info-description', '#new-info-description-count')
  $('#tour-settings').addEventListener('click', openSettings)
  ;['hotspot', 'info'].forEach((kind) => {
    $(`#${kind}-swatches`).addEventListener('click', (event) => {
      const choice = event.target.closest('[data-color]')
      if (!choice) return
      event.preventDefault()
      applyThemeColor(kind, choice.dataset.color)
    })
    $(`#${kind}-hex`).addEventListener('input', (event) => {
      const applied = applyThemeColor(kind, event.target.value)
      event.target.classList.toggle('invalid', !applied && event.target.value.trim() !== '')
    })
    $(`#${kind}-hex`).addEventListener('blur', renderThemeControls)
  })
  $('#embed-tour').addEventListener('click', openEmbedDialog)
  $('#whats-new').addEventListener('click', openWhatsNew)
  $('#copy-embed').addEventListener('click', copyEmbedCode)
  ;['#embed-base', '#embed-width', '#embed-height'].forEach((selector) => {
    $(selector).addEventListener('input', refreshEmbedCode)
  })
  $('#delete-hotspot').addEventListener('click', () => deleteInteraction(state.activeHotspotId))

  video.addEventListener('loadedmetadata', () => {
    const scene = activeScene()
    if (scene && !isPhotoScene(scene)) scene.duration = video.duration
    renderScenes()
    updateTimeline()
  })
  video.addEventListener('timeupdate', updateTimeline)
  video.addEventListener('play', updateTimeline)
  video.addEventListener('pause', updateTimeline)

  const shell = $('#viewer-shell')
  ;['dragenter', 'dragover'].forEach((name) => shell.addEventListener(name, (event) => {
    event.preventDefault()
    $('#drop-overlay').classList.add('visible')
  }))
  ;['dragleave', 'drop'].forEach((name) => shell.addEventListener(name, (event) => {
    event.preventDefault()
    $('#drop-overlay').classList.remove('visible')
  }))
  shell.addEventListener('drop', (event) => addFiles(event.dataTransfer.files))
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      cancelAddHotspot()
      if (state.pickingView) exitViewPicker()
    }
    const isFormControl = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(event.target.tagName) || event.target.isContentEditable
    if (event.code === 'Space' && !isFormControl) {
      event.preventDefault()
      if (activeScene() && !isPhotoScene(activeScene())) video.paused ? playVideo() : video.pause()
    }
  })
  window.addEventListener('beforeunload', () => state.scenes.forEach((scene) => URL.revokeObjectURL(scene.url)))
}

state.renderer = createViewer()
bindEvents()
refreshWhatsNewBadge()
renderScenes()
renderInspectorOverview()
