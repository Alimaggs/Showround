// Release history, newest first. This is the single source of truth for the
// version the app reports, so add a new entry at the top whenever an update is
// pushed and keep the version in package.json matching the top entry.
//
// Keep notes written for the person using Showround rather than for us: what
// they can now do, not which files changed.

export const releases = [
  {
    version: '0.8.0',
    date: '2026-10-16',
    title: 'Smoother moves between rooms',
    notes: [
      'Following a hotspot now turns towards it and moves forward, then fades into the next room. Choosing a room from the menu fades between them.',
      'This works in Preview and in published and embedded tours. Export your tour again to add it to a tour you have already published.',
      'If a visitor has reduced motion turned on in their device settings, they see a short fade instead.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-10-16',
    title: 'Rename your scenes',
    notes: [
      'Rename a scene from the Scenes list with the pencil button, or double-click its name. Press Enter to save or Esc to cancel.',
      'The file name follows, so a scene called Front garden exports as front-garden.jpg. Hotspots that link to the scene keep working.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-10-16',
    title: 'More icons, and pick where people look',
    notes: [
      'Forty icons to choose from, up from twelve, including books, seating, coffee, plants and flowers. A search box helps you find the one you want.',
      'Starting view sets which way visitors face when your tour opens. Turn the scene to the angle you want and save it.',
      'Each hotspot can now choose which way visitors face when they arrive in the next room.',
      'Tours you exported earlier open just as they did before.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-09-14',
    title: 'Choose your pin colours',
    notes: [
      'A new Tour settings button sets the colour of your hotspots and your info points across the whole tour. Pick one of eight presets or type any hex code.',
      'Colours carry through to published and embedded tours. Tours you made earlier keep the colours they already had.',
    ],
  },
  {
    version: '0.4.1',
    date: '2026-09-03',
    title: 'Notes stay in the picture',
    notes: [
      'A note attached near the edge of the picture now opens inwards instead of running off the side. This applies to published tours too.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-09-03',
    title: 'Tidier info points',
    notes: [
      'Long info point titles now wrap neatly inside their box instead of spilling across the picture.',
      'The settings panel only shows the fields that apply, so info points no longer ask you to link a scene.',
      'Info point notes now show how many characters you have left.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-09-03',
    title: 'A front door for Showround',
    notes: [
      'showround.app now has a home page, and the editor has moved to showround.app/app. Worth updating your bookmark.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-09-03',
    title: 'Pick up where you left off',
    notes: [
      'You can now import a tour you exported earlier and carry on editing it, scenes, hotspots, icons and all.',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-09-03',
    title: 'Showround is live',
    notes: [
      'Scenes can now be 360° photos as well as video, and a single tour can mix the two freely.',
      'Hotspots and info points take an icon from a set of twelve, chosen when you place one and changeable afterwards.',
      'A new Embed button gives you the code to drop a tour into any web page, with the picture filling the frame.',
    ],
  },
]

export const currentRelease = releases[0]
