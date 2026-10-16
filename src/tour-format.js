// Reading the tour manifest (tour.json) out of an exported zip.
//
// Kept free of the DOM so scripts/check-compat.mjs can run it under Node
// against a sample of every format the editor has ever exported. The editor's
// importer is a thin wrapper around parseTourZip.
//
// Format history, all of which must keep importing:
//
//   version 1  Chaos360 exports. Media in videos/ under a "video" key. No scene
//              kind, because every scene was video. Info points had no icon.
//   version 2  Media in media/ under "src", and each scene has a kind of photo
//              or video. Optional fields added since, none of which change the
//              meaning of anything older:
//                theme        pin colours (0.5.0)
//                entryView    direction the first scene opens facing (0.6.0)
//                targetView   on a hotspot, direction the scene it links to
//                             opens facing (0.6.0)
//
// The rule for changes: add optional fields whose absence reproduces the old
// behaviour. Never rename, remove or change the meaning of an existing field.
// If a meaning has to change, that is version 3, and this file converts the
// older versions into it.

import { themeFrom } from './pin-colors.js'

export const MANIFEST_VERSION = 2

// Errors thrown here are worded for the person importing. Anything else, such
// as JSZip failing on a file that is not a zip, gets a generic message.
export function importError(message) {
  const error = new Error(message)
  error.friendly = true
  return error
}

function mediaPath(scene) {
  return String(scene.src || scene.video || '').replace(/^\.\//, '')
}

// A view is the direction the camera faces, in the same degrees as a pin's
// yaw and pitch. Anything malformed is dropped rather than guessed at, which
// falls back to the default view.
export function viewFrom(value) {
  const yaw = Number(value?.yaw)
  const pitch = Number(value?.pitch)
  if (value == null || !Number.isFinite(yaw) || !Number.isFinite(pitch)) return null
  const wrapped = ((((yaw + 180) % 360) + 360) % 360) - 180
  return {
    yaw: Math.round((wrapped === -180 ? 180 : wrapped) * 10) / 10,
    pitch: Math.round(Math.max(-85, Math.min(85, pitch)) * 10) / 10,
  }
}

function hotspotsFrom(list) {
  if (!Array.isArray(list)) return []
  return list.map((hotspot) => {
    const copy = { ...hotspot }
    const targetView = viewFrom(hotspot.targetView)
    if (targetView) copy.targetView = targetView
    else delete copy.targetView
    return copy
  })
}

// Accepts a loaded JSZip instance. Media are returned as zip entries rather
// than read, so the caller decides how to load them (a Blob in the browser,
// bytes under Node).
export async function parseTourZip(zip) {
  const manifestEntry = zip.file('tour.json')
  if (!manifestEntry) throw importError('That zip does not contain a Showround tour')

  let manifest
  try {
    manifest = JSON.parse(await manifestEntry.async('string'))
  } catch {
    throw importError('The tour inside that zip could not be read')
  }
  if (!Array.isArray(manifest.scenes) || !manifest.scenes.length) {
    throw importError('That tour has no scenes in it')
  }

  const scenes = manifest.scenes.map((scene) => {
    const path = mediaPath(scene)
    const entry = path && zip.file(path)
    if (!entry) throw importError(`The tour is missing ${scene.fileName || 'a media file'}`)
    const fileName = scene.fileName || path.split('/').pop()
    return {
      id: scene.id || null,
      // Version 1 had no kind, and every scene in it was video.
      kind: scene.kind === 'photo' ? 'photo' : 'video',
      name: scene.name || fileName.replace(/\.[^.]+$/, ''),
      fileName,
      path,
      entry,
      duration: Number(scene.duration) || 0,
      hotspots: hotspotsFrom(scene.hotspots),
    }
  })

  return {
    version: Number(manifest.version) || 1,
    name: manifest.name,
    entrySceneId: manifest.entrySceneId,
    entryView: viewFrom(manifest.entryView),
    theme: themeFrom({
      hotspot: manifest.theme?.hotspot?.background,
      info: manifest.theme?.info?.background,
    }),
    scenes,
  }
}
