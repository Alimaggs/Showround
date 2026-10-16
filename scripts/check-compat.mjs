// Compatibility check: every tour the editor has ever exported must still
// import. Run with `npm test`.
//
// Builds one sample zip per historical manifest format, each shaped exactly as
// the export code of that era wrote it (the commit is noted beside each), and
// runs it through parseTourZip, the same function the editor's Import uses.
// Also covers the live demo tour and the failures that should produce a
// readable message rather than a crash.
//
// `node scripts/check-compat.mjs --write <dir>` also saves the sample zips, so
// they can be dragged into the editor by hand.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'
import { parseTourZip } from '../src/tour-format.js'
import { pinIcons } from '../src/pin-icons.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const photo = fs.readFileSync(path.join(root, 'demo/media/bedroom.jpg'))
const clip = fs.readFileSync(path.join(root, 'test/fixtures/clip.webm'))

// Icon keys that have appeared in an export. These must always resolve.
const SHIPPED_ICONS = ['arrow', 'door', 'stairs', 'info', 'bed', 'kitchen', 'bath', 'tree', 'car', 'star', 'eye', 'play']
const DEFAULT_THEME = { hotspot: '#eeff66', info: '#62c2cc' }

async function zipOf(manifest, media) {
  const zip = new JSZip()
  if (manifest) zip.file('tour.json', typeof manifest === 'string' ? manifest : JSON.stringify(manifest, null, 2))
  for (const [name, bytes] of Object.entries(media)) zip.file(name, bytes)
  return zip.generateAsync({ type: 'uint8array' })
}

const fixtures = [
  {
    // Chaos360, written by the export in 53e9d51 to a66f514.
    name: 'v1-chaos360',
    expect: { version: 1, kinds: ['video', 'video'], theme: DEFAULT_THEME, entryView: null },
    media: { 'videos/hall.webm': clip, 'videos/kitchen.webm': clip },
    manifest: {
      version: 1,
      name: 'Old Chaos360 tour',
      entrySceneId: 's-hall',
      scenes: [
        {
          id: 's-hall', name: 'hall', fileName: 'hall.webm', video: './videos/hall.webm', duration: 1,
          hotspots: [
            { id: 'h1', type: 'hotspot', label: 'To the kitchen', targetSceneId: 's-kitchen', time: 0.4, icon: 'door', yaw: -32.5, pitch: 4.1 },
            { id: 'h2', type: 'info', label: 'Old staircase', description: 'Restored in 2019.', time: 0, yaw: 61, pitch: -8 },
          ],
        },
        {
          id: 's-kitchen', name: 'kitchen', fileName: 'kitchen.webm', video: './videos/kitchen.webm', duration: 1,
          hotspots: [{ id: 'h3', type: 'hotspot', label: 'Back', targetSceneId: 's-hall', time: 0, icon: 'arrow', yaw: 170, pitch: 0 }],
        },
      ],
    },
  },
  {
    // Showround 0.1.0 to 0.4.1, written by the export in 17a325e to 4b3b9e1.
    name: 'v2-no-theme',
    expect: { version: 2, kinds: ['photo', 'video'], theme: DEFAULT_THEME, entryView: null },
    media: { 'media/lounge.jpg': photo, 'media/garden.webm': clip },
    manifest: {
      version: 2,
      name: 'Photos and video',
      entrySceneId: 's-lounge',
      scenes: [
        {
          id: 's-lounge', kind: 'photo', name: 'lounge', fileName: 'lounge.jpg', src: './media/lounge.jpg', duration: 0,
          hotspots: [
            { id: 'h1', type: 'hotspot', label: 'Garden', targetSceneId: 's-garden', time: 0, icon: 'tree', yaw: 90, pitch: -2 },
            { id: 'h2', type: 'info', label: 'Kitchen', description: 'Through the arch.', icon: 'kitchen', time: 0, yaw: -40, pitch: 0 },
          ],
        },
        { id: 's-garden', kind: 'video', name: 'garden', fileName: 'garden.webm', src: './media/garden.webm', duration: 1, hotspots: [] },
      ],
    },
  },
  {
    // Showround 0.5.0, written by the export in 4f634e8.
    name: 'v2-theme',
    expect: { version: 2, kinds: ['photo'], theme: { hotspot: '#171b1c', info: '#7b2d8e' }, entryView: null },
    media: { 'media/lounge.jpg': photo },
    manifest: {
      version: 2,
      name: 'Themed tour',
      theme: { hotspot: { background: '#171b1c', ink: '#ffffff' }, info: { background: '#7b2d8e', ink: '#ffffff' } },
      entrySceneId: 's-lounge',
      scenes: [
        {
          id: 's-lounge', kind: 'photo', name: 'lounge', fileName: 'lounge.jpg', src: './media/lounge.jpg', duration: 0,
          hotspots: [{ id: 'h1', type: 'info', label: 'Note', description: 'Hello.', icon: 'star', time: 0, yaw: 10, pitch: 5 }],
        },
      ],
    },
  },
  {
    // Showround 0.6.0: starting view, arrival views and the wider icon set.
    name: 'v2-views',
    expect: { version: 2, kinds: ['photo', 'photo'], theme: DEFAULT_THEME, entryView: { yaw: -120, pitch: 6.5 } },
    media: { 'media/lounge.jpg': photo, 'media/bedroom.jpg': photo },
    manifest: {
      version: 2,
      name: 'Views',
      theme: { hotspot: { background: '#eeff66', ink: '#171b1c' }, info: { background: '#62c2cc', ink: '#171b1c' } },
      entrySceneId: 's-lounge',
      entryView: { yaw: -120, pitch: 6.5 },
      scenes: [
        {
          id: 's-lounge', kind: 'photo', name: 'lounge', fileName: 'lounge.jpg', src: './media/lounge.jpg', duration: 0,
          hotspots: [
            { id: 'h1', type: 'hotspot', label: 'Bedroom', targetSceneId: 's-bedroom', time: 0, icon: 'door', yaw: 30, pitch: 0, targetView: { yaw: 15, pitch: -4 } },
            { id: 'h2', type: 'info', label: 'Books', description: 'The library.', icon: 'books', time: 0, yaw: -10, pitch: 2 },
          ],
        },
        {
          id: 's-bedroom', kind: 'photo', name: 'bedroom', fileName: 'bedroom.jpg', src: './media/bedroom.jpg', duration: 0,
          hotspots: [{ id: 'h3', type: 'hotspot', label: 'Back', targetSceneId: 's-lounge', time: 0, icon: 'arrow', yaw: 128, pitch: -7 }],
        },
      ],
    },
  },
  {
    // Views that are malformed or out of range should be cleaned up or
    // dropped, never passed through to the viewer.
    name: 'v2-bad-views',
    expect: { version: 2, kinds: ['photo', 'photo'], theme: DEFAULT_THEME, entryView: null },
    media: { 'media/a.jpg': photo, 'media/b.jpg': photo },
    manifest: {
      version: 2,
      name: 'Bad views',
      entrySceneId: 's-a',
      entryView: { yaw: 'north', pitch: 0 },
      scenes: [
        {
          id: 's-a', kind: 'photo', name: 'a', fileName: 'a.jpg', src: './media/a.jpg', duration: 0,
          hotspots: [
            { id: 'h1', type: 'hotspot', label: 'Wrapped', targetSceneId: 's-b', time: 0, icon: 'arrow', yaw: 0, pitch: 0, targetView: { yaw: 400, pitch: 120 } },
            { id: 'h2', type: 'hotspot', label: 'Null', targetSceneId: 's-b', time: 0, icon: 'arrow', yaw: 5, pitch: 0, targetView: null },
          ],
        },
        { id: 's-b', kind: 'photo', name: 'b', fileName: 'b.jpg', src: './media/b.jpg', duration: 0, hotspots: [] },
      ],
    },
    extra(tour, check) {
      const [wrapped, nulled] = tour.scenes[0].hotspots
      check(JSON.stringify(wrapped.targetView) === JSON.stringify({ yaw: 40, pitch: 85 }), 'targetView yaw wraps to 40 and pitch clamps to 85')
      check(!('targetView' in nulled), 'a null targetView is dropped')
    },
  },
]

let failures = 0
function reporter(label) {
  return (condition, message) => {
    if (condition) return
    failures += 1
    console.log(`  FAIL ${label}: ${message}`)
  }
}

async function checkTour(label, bytes, expect, extra) {
  const check = reporter(label)
  let tour
  try {
    tour = await parseTourZip(await JSZip.loadAsync(bytes))
  } catch (error) {
    check(false, `did not import: ${error.message}`)
    return
  }

  check(tour.version === expect.version, `version ${tour.version}, expected ${expect.version}`)
  check(JSON.stringify(tour.scenes.map((scene) => scene.kind)) === JSON.stringify(expect.kinds), `scene kinds ${tour.scenes.map((s) => s.kind)}`)
  check(JSON.stringify(tour.theme) === JSON.stringify(expect.theme), `theme ${JSON.stringify(tour.theme)}`)
  check(JSON.stringify(tour.entryView) === JSON.stringify(expect.entryView), `entryView ${JSON.stringify(tour.entryView)}`)

  const ids = new Set(tour.scenes.map((scene) => scene.id))
  check(ids.has(tour.entrySceneId), 'entry scene exists')
  for (const scene of tour.scenes) {
    const bytesRead = await scene.entry.async('uint8array')
    check(bytesRead.length > 0, `media for ${scene.name} is readable`)
    check(Boolean(scene.fileName && scene.name), `${scene.name} has a name and file name`)
    for (const hotspot of scene.hotspots) {
      check(hotspot.type === 'hotspot' || hotspot.type === 'info', `${hotspot.id} has a known type`)
      check(Number.isFinite(hotspot.yaw) && Number.isFinite(hotspot.pitch), `${hotspot.id} keeps its position`)
      check(Boolean(hotspot.label), `${hotspot.id} keeps its label`)
      if (hotspot.type === 'hotspot') check(ids.has(hotspot.targetSceneId), `${hotspot.id} links to a scene that exists`)
      if (hotspot.icon) check(hotspot.icon in pinIcons, `${hotspot.id} icon "${hotspot.icon}" exists`)
    }
  }
  if (extra) extra(tour, check)
  if (expect.entryView === null) {
    const stray = tour.scenes.flatMap((scene) => scene.hotspots).filter((h) => h.targetView && label.startsWith('v1'))
    check(stray.length === 0, 'older tours gain no arrival views')
  }
}

async function checkFailure(label, bytes, expectedMessage) {
  const check = reporter(label)
  try {
    await parseTourZip(await JSZip.loadAsync(bytes))
    check(false, 'imported when it should have been refused')
  } catch (error) {
    check(error.friendly === true, `error is not worded for the user: ${error.message}`)
    check(error.message.includes(expectedMessage), `message was "${error.message}"`)
  }
}

const writeIndex = process.argv.indexOf('--write')
const writeDir = writeIndex > -1 ? path.resolve(process.argv[writeIndex + 1]) : null
if (writeDir) fs.mkdirSync(writeDir, { recursive: true })

for (const icon of SHIPPED_ICONS) reporter('icons')(icon in pinIcons, `shipped icon "${icon}" is missing from the icon set`)

for (const fixture of fixtures) {
  const bytes = await zipOf(fixture.manifest, fixture.media)
  if (writeDir) fs.writeFileSync(path.join(writeDir, `${fixture.name}.zip`), bytes)
  const before = failures
  await checkTour(fixture.name, bytes, fixture.expect, fixture.extra)
  console.log(`${failures === before ? 'ok  ' : 'FAIL'} ${fixture.name}`)
}

// The live demo on the landing page is a real tour too.
{
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'demo/tour.json'), 'utf8'))
  const media = Object.fromEntries(manifest.scenes.map((scene) => [scene.src.replace(/^\.\//, ''), fs.readFileSync(path.join(root, 'demo', scene.src))]))
  const before = failures
  await checkTour('demo', await zipOf(manifest, media), { version: 2, kinds: ['photo', 'photo'], theme: DEFAULT_THEME, entryView: manifest.entryView ?? null })
  console.log(`${failures === before ? 'ok  ' : 'FAIL'} demo tour`)
}

for (const [label, bytes, message] of [
  ['no-manifest', await zipOf(null, { 'readme.txt': Buffer.from('hello') }), 'does not contain a Showround tour'],
  ['bad-json', await zipOf('{ not json', {}), 'could not be read'],
  ['no-scenes', await zipOf({ version: 2, scenes: [] }, {}), 'has no scenes'],
  ['missing-media', await zipOf({ version: 2, entrySceneId: 'a', scenes: [{ id: 'a', kind: 'photo', fileName: 'gone.jpg', src: './media/gone.jpg', hotspots: [] }] }, {}), 'missing gone.jpg'],
]) {
  const before = failures
  await checkFailure(label, bytes, message)
  console.log(`${failures === before ? 'ok  ' : 'FAIL'} refuses ${label}`)
}

if (writeDir) console.log(`\nsample zips written to ${writeDir}`)
console.log(failures ? `\n${failures} check(s) failed` : '\nall formats import')
process.exit(failures ? 1 : 0)
