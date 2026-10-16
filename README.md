# Showround

_by Chaos Created_

Showround is a browser-based editor for turning 360-degree videos and photos into interactive tours. Upload scenes, connect them with hotspots, add information points, preview the journey, and export a self-contained tour package.

## Media

Scenes can be 360-degree video (MP4, WebM, MOV) or 360-degree stills (JPG, PNG, WebP), and a single tour can mix both. Stills are shown without the playback transport, and their interactions stay on screen for as long as the scene is open. Equirectangular source images larger than the GPU texture limit are downscaled to fit before they are uploaded to the sphere.

## Interactions

Hotspots move a visitor to another scene; info points reveal a note in place.
Both carry an icon chosen from a shared set of forty (defined in
`src/pin-icons.js`), picked when the interaction is created and changeable
later in the inspector. Each picker has a search box that matches the icon's
name and label. The same definitions are injected into the exported player, so
a published tour draws the identical icons.

Icon keys are stored in exported tours, so a key that has shipped must never be
renamed or removed. New icons can go anywhere in the list.

## Views

**Starting view** sets which way a visitor faces when the tour opens. Press the
button above the viewer, drag the scene to the angle you want and choose Use
this view. It is stored as `entryView` and applies to the first scene only.

**Arrival view** belongs to a hotspot: which way the visitor faces when that
hotspot takes them to the next scene. Choose it in the hotspot's inspector and
the editor opens the target scene for you to aim. Two hotspots into the same
room can arrive facing different ways, so the door from the hall can face into
the room while the door from the garden faces the window. It is stored on the
hotspot as `targetView`, and changing the hotspot's target clears it.

Both are `{ "yaw": degrees, "pitch": degrees }`. Opening a scene any other
way, from the scene list or the location menu, uses the default view.

## Moving between scenes

Following a hotspot in Preview or in a published tour turns the camera
towards the pin and narrows the field of view over about half a second, as
if stepping towards it. A still of that last frame is then laid over the
viewer, the next scene loads underneath, and the still fades and grows while
the new scene widens back out. Choosing a scene from the menu skips the turn
and just dissolves. Visitors with reduced motion set get a short fade only.

The camera only looks halfway down or up towards the pin, so following a pin
placed on the floor does not end with a view of the carpet. The still waits
for the next scene to be drawable (the photo decoded or the video's first
frame), up to two and a half seconds, so a slow connection shows the old room
rather than a black sphere.

It lives in two places that must be kept in step: `travel` in the editor's
`createViewer` (`src/main.js`) and in the player script in
`src/export-player.js`. Published tours carry their own copy of the player,
so a tour picks up a change here when it is exported again. Nothing is added
to the manifest.

## Scene names

A scene starts out named after the file it was made from. The pencil on its
row in the Scenes list, or a double-click on the name, renames it. The file
name follows: the scene name is turned into a lower-case, hyphenated file name
with the original extension, so "Main bedroom & ensuite" exports as
`media/main-bedroom-and-ensuite.jpg`. Hotspots link by scene id rather than
by name, so renaming never breaks a link.

## Pin colours

Colour is a property of the tour rather than of each interaction: one colour
for hotspots, one for info points, set in Tour settings. That keeps a tour
looking like a set rather than a bag of differently coloured markers, and it
means recolouring is one decision instead of one per pin.

`src/pin-colors.js` holds eight presets, but any hex code is accepted, so the
icon's colour is calculated rather than chosen: `inkFor` picks whichever of
near-black or white contrasts better against the background. It compares
contrast ratios rather than using a brightness threshold, because a threshold
gets the brand orange wrong. Orange is bright enough to look light, yet white
on it reaches only about 3:1 where near-black reaches 6:1.

The editor resolves both background and ink into the manifest at export:

```json
"theme": {
  "hotspot": { "background": "#eeff66", "ink": "#171b1c" },
  "info":    { "background": "#62c2cc", "ink": "#171b1c" }
}
```

A published tour then only has to apply those values, with no contrast maths
of its own. Manifests without a `theme`, which is every export made before
this, fall back to the original lime and aqua.

## Tour format and old tours

Every tour anyone has exported must keep importing, so the manifest only ever
gains optional fields whose absence means the old behaviour. A field is never
renamed, removed or given a new meaning; that would need a new manifest
version and a migration. The history is written up at the top of
`src/tour-format.js`, which holds the import parsing and has no DOM, so it
runs under Node too.

```sh
npm test
```

runs `scripts/check-compat.mjs`, which builds a sample zip in each format
that has shipped (Chaos360, 0.1 to 0.4, 0.5 with colours, 0.6 with views),
imports each one, and checks that zips which are not tours are refused with a
readable message. Pass `--write <dir>` to keep the sample zips for importing
by hand. When the format changes, add a fixture that mirrors the new export
code.

## Embedding

Every export contains `embed.html` alongside `index.html`. It is the same
tour with the page chrome removed: the scene picker floats over the top right
of the image, the transport bar appears only for video scenes, and a small
credit links back to showround.app. It fills whatever iframe it is given.

The Embed button in the editor writes the iframe snippet for you. Enter the
URL the uploaded tour folder will live at, adjust the size if you want, then
copy the code.

## Updating the player's look after export

Exported tours are self-contained, which means a design change would normally
never reach a tour someone already published. To get around that, both player
pages load a small theme stylesheet from this site immediately after their own
bundled `styles.css`:

```html
<link rel="stylesheet" href="./styles.css">
<link rel="stylesheet" href="https://showround.app/player/v1/theme.css">
```

That file lives at `public/player/v1/theme.css`. Because it loads second it
wins on the cascade, so editing it restyles every tour already pointing at
that version.

Three constraints keep this safe:

- **It has to stay optional.** `styles.css` always carries the complete
  design, and the theme layer only adjusts it. A tour whose copy fails to
  load still renders correctly, so a published tour cannot be broken by this
  site going down, and exports still work on a private network.
- **CSS only restyles markup that already exists.** Older exports have older
  markup, so anything structural needs a new player version instead.
- **Breaking changes get a new version directory.** `playerThemeVersion` in
  `src/export-player.js` sets what new exports point at. Old tours keep the
  version they shipped with, so `v1` has to keep working indefinitely.

To confirm the layer loaded on a given tour:

```js
getComputedStyle(document.documentElement).getPropertyValue('--showround-theme')
```

## Branding

The wordmark uses the `--brand-font` custom property in `src/style.css`, which defaults to Bungee, the closest freely licensed face to the Chaos Created wordmark. To use the licensed Chaos Created display face instead, drop the web font files into `public/fonts`, uncomment the `@font-face` block at the top of that file, and point `--brand-font` at the family name.

## Pages

The build has two entry points, wired up in `vite.config.js`:

| Path | Source | What it is |
| --- | --- | --- |
| `/` | `index.html`, `src/landing.css`, `src/landing.js` | Marketing landing page |
| `/demo/` | `demo/` plus the export modules | The live demo tour embedded in the landing page |
| `/app/` | `app/index.html` plus `src/main.js` | The editor |

They are one project on purpose. It stays a single build and a single deploy,
sessions will not have to cross an origin once accounts exist, and it keeps
the root path free for published tour URLs such as `/t/<slug>`.

The landing page works without JavaScript. `src/landing.js` only adds the
rotating audience line, the scroll reveals and the deferred loading of the
demo, and a `noscript` link opens the demo directly.

The landing page repeats the design tokens rather than importing the editor's
stylesheet, so that a 1.4MB app bundle is not pulled onto a static page. If
they drift, lift the `:root` block into a file both stylesheets import.

## Live demo

The tour at the top of the landing page is a real published tour, not a mock.
`scripts/build-demo.mjs` assembles it into `public/demo` from two things: the
manifest and panoramas in `demo/`, and the same player files the editor writes
into an export (`src/export-player.js`). Building it this way, instead of
committing a copy of the player, means the demo cannot drift from what the
editor produces. `public/demo` is gitignored and regenerated by `npm run dev`
and `npm run build`.

To change the demo, edit `demo/tour.json`. Pin positions are `yaw` and
`pitch` in degrees. The two panoramas are licensed stock photographs, resized
to 4096 pixels wide and rotated by half a turn, because the player opens each
scene facing the left and right edges of the image and the best view of both
rooms is in the middle.

## Releases

The megaphone button in the top bar shows the version and what changed in it.
An orange dot appears on that button until the current version has been
opened, remembered per browser in `localStorage`.

`src/changelog.js` is the source of truth. Every push that users would notice
gets a new entry at the top:

```js
{
  version: '0.2.0',
  date: '2026-09-17',
  title: 'Short headline',
  notes: ['One sentence per change, written for the person using Showround.'],
}
```

Then set the same version in `package.json` so the two agree. Write the notes
in terms of what someone can now do rather than which files moved, and skip
releases that only contain refactoring or docs, since a what's new box with
nothing in it for the reader is worse than no box.

## Development

```sh
npm install
npm run dev
```

## Production

```sh
npm run build
```

## Deployment

The editor is a static build, so it is hosted on Sevalla as a **Static Site**
rather than an Application. Applications run a server process, which this
project does not need.

Sevalla settings:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Root directory | leave empty (the project is at the repo root) |
| Node version | 22 |

Static sites take the Node version from a dropdown on the Sevalla form, not
from `package.json`. The `engines` field is kept anyway so the expected
version is recorded in the repo and npm warns on a mismatch locally, but it
is the dropdown that decides the build image. Pick the same major version.

Connect the repository in the Sevalla dashboard and pick the branch to
deploy. Pushes to that branch then rebuild automatically.

`vite.config.js` sets `base: './'`, which keeps every asset path relative.
That works whether the site is served from a domain root or a subpath, and
it is also what lets an exported tour run from any folder.
