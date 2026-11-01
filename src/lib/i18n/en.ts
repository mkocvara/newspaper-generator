// English UI text. Other languages implement the same shape (see cs.ts), so a
// missing translation is a type error. Phrases are kept whole rather than
// assembled from words, since word order and grammar differ between languages.

const list = (items: string[]) => items.join(', ')

export const en = {
  languageName: 'English',
  percent: (n: number) => `${n}%`,

  page: {
    date: 'Date',
    name: 'Newspaper Name',
    location: 'Location',
    footerLeft: 'Left text',
    footerCenter: 'Centre text',
    footerRight: 'Right text',
    // Prefilled in the footer of a new page.
    footerDefault: 'Page 1',
  },

  elements: {
    eyecatcher: 'Eyecatcher',
    secondary: 'Secondary text',
    heading: 'Heading',
    article: 'Article text',
    imageDescription: 'Image description',
    chooseImage: 'Choose an image',
    orDropImage: 'or drop one here',
    replace: 'Replace',
    replaceTitle: 'Replace image',
    ink: 'Ink',
    inkTitle: 'Print the image in the ink colour',
    crop: 'Crop',
    cropOnTitle: 'Cropped to fill the cell. Click to show the whole image.',
    cropOffTitle: 'Whole image shown. Click to crop it to fill the cell.',
    panTitle: 'Drag to choose which part shows. Double-click to centre.',
  },

  grid: {
    cellLayout: 'Cell layout',
    insert: { eyecatcher: 'Insert eyecatcher', text: 'Insert text', image: 'Insert image' },
    changeTo: { eyecatcher: 'Change to eyecatcher', text: 'Change to text', image: 'Change to image' },
    clearCell: 'Clear cell',
    splitSideBySide: 'Split side by side',
    splitTopBottom: 'Split top and bottom',
    merge: {
      right: 'Merge with cell to the right',
      left: 'Merge with cell to the left',
      up: 'Merge with cell above',
      down: 'Merge with cell below',
    },
    mergeColumn: 'Merge entire column',
    mergeRow: 'Merge entire row',
    column: (n: number) => `Column ${n}`,
    row: (n: number) => `Row ${n}`,
    insertColumnLeft: 'Insert column left',
    insertColumnRight: 'Insert column right',
    insertRowAbove: 'Insert row above',
    insertRowBelow: 'Insert row below',
    deleteColumn: 'Delete column',
    deleteRow: 'Delete row',
    moveCell: 'Move cell',
    moveCellTitle: 'Drag to move this cell along its column or row',
  },

  toolbar: {
    tools: 'Newspaper tools',
    undo: 'Undo',
    undoTitle: 'Undo (Ctrl+Z)',
    redo: 'Redo',
    redoTitle: 'Redo (Ctrl+Y)',
    import: 'Import',
    export: 'Export',
    exporting: 'Exporting…',
    exportPng: 'Image (PNG)',
    exportJpg: 'Image (JPG)',
    exportPdf: 'PDF',
    exportPreset: 'Importable preset',
    pin: 'Pin toolbar',
    pinTitle: 'Pin: keep the toolbar visible',
    unpinTitle: 'Unpin: hide the toolbar when not in use',
    language: 'Language',
    menu: 'Tools',
    closeMenu: 'Close tools',
  },

  status: {
    exporting: 'Exporting…',
    exported: 'Exported.',
    exportFailed: 'Export failed. See the browser console for details.',
    notPreset: (file: string) => `${file} isn't a newspaper preset.`,
    imported: (file: string) => `Imported ${file}. Undo (Ctrl+Z) brings back the previous page.`,
    unreadable: (file: string) => `Couldn't read ${file}.`,
    newPaper: 'Started a new paper. Undo (Ctrl+Z) brings back the previous one.',
  },

  newPaper: {
    button: 'New Paper',
    title: 'Start a new paper?',
    warning: 'This resets the page to the default layout and styles, and your current changes will be lost.',
    keepWork: 'To keep your work, export it as a preset first; you can import it again later.',
    exported: 'Preset exported.',
    cancel: 'Cancel',
    exportFirst: 'Export preset first',
    confirm: 'Start new paper',
  },

  fonts: {
    panel: 'Fonts',
    roles: {
      body: 'Body text',
      heading: 'Headings',
      caption: 'Image descriptions',
      eyecatcher: 'Eyecatchers',
      headerFooter: 'Header & footer',
      name: 'Newspaper name',
    },
    manage: 'Manage fonts…',
    back: '‹ Back',
    yourFonts: 'Your fonts',
    inUse: 'in use',
    usedFor: (roles: string[]) => `Used for ${list(roles)}`,
    remove: (family: string) => `Remove ${family}`,
    removeInUse: (family: string, roles: string[], fallback: string) =>
      `Remove ${family}. ${list(roles)} will switch to ${fallback}.`,
    none: 'No fonts. Add one below or restore the default fonts.',
    // "Add a <link>Google Font</link> by name or link"
    addBefore: 'Add a ',
    addLink: 'Google Font',
    addAfter: ' by name or link',
    addPlaceholder: 'e.g. Crimson Text',
    add: 'Add',
    needInput: 'Enter a font name or a Google Fonts link.',
    loading: 'Loading…',
    couldNotLoad: (families: string[]) => `Couldn't load ${list(families)}. Check the name on fonts.google.com.`,
    added: (families: string[]) => `Added ${list(families)}.`,
    restore: (removed: number) => `Restore default fonts (${removed} removed)`,
    listNote: 'This list is kept in this browser and shared by all your pages.',
  },

  sizes: {
    panel: 'Text sizes',
    body: 'Body text',
    heading: 'Headings',
    caption: 'Image descriptions',
    hint:
      "Sizes are in points. When article text doesn't fit its cell, its body text shrinks first, then its heading. " +
      'Header, footer and eyecatcher text sizes follow their cells.',
  },

  frame: {
    panel: 'Frame & borders',
    legend: 'Header & footer frame',
    styles: {
      single: 'Single line',
      double: 'Double line',
      'thick-outer': 'Thick & thin (thick outside)',
      'thin-outer': 'Thick & thin (thin outside)',
      dashed: 'Dashed',
      dotted: 'Dotted',
      'dash-dot': 'Dash and dot',
      zigzag: 'Zigzag',
      wave: 'Wave',
    },
    borderWidth: 'Cell border thickness (pt)',
  },

  paper: {
    panel: 'Paper',
    styles: {
      newsprint: 'Newsprint',
      'aged-clean': 'Old paper',
      aged: 'Old & stained',
      modern: 'Modern plain',
      'modern-creased': 'Modern, creased',
    },
  },

  ink: {
    panel: 'Ink',
    presets: 'Ink presets',
    presetNames: ['Black', 'Sepia brown', 'Navy', 'Dark red', 'Dark green'],
    custom: 'Custom ink colour',
    hint: "Used for all text, frames, borders and the name's decoration, and for images with Ink on.",
  },

  name: {
    panel: 'Newspaper name',
    ornaments: 'Ornaments',
    ornamentStyles: {
      none: 'None',
      fleurons: 'Fleurons',
      'guillemets-in': 'Guillemets, pointing in',
      'guillemets-out': 'Guillemets, pointing out',
      hands: 'Pointing hands',
      curls: 'Curls',
      rules: 'Extending rules',
      custom: 'Custom symbols',
    },
    ornamentSize: 'Ornament size',
    ornamentSizeHint: 'Ornament size is in % of the standard size.',
    before: 'Before the name',
    after: 'After the name',
    beforePlaceholder: 'e.g. ✦',
    afterPlaceholder: 'same as before',
    symbols: 'Symbols',
    insertBefore: (symbol: string) => `Insert ${symbol} before the name`,
    insertAfter: (symbol: string) => `Insert ${symbol} after the name`,
    symbolsHint:
      'Click a symbol to add it to the highlighted field, or type any Unicode symbols. Fields can hold several.',
    effect: 'Effect',
    effects: {
      none: 'None',
      shadow: 'Drop shadow',
      extrude: '3D extrude',
      engraved: 'Engraved',
      outline: 'Outline',
      hatched: 'Hatched',
    },
  },

  view: {
    panVertical: 'Pan up and down',
    panHorizontal: 'Pan left and right',
    zoomTitle: 'Zoom level. Click to reset to 100%.',
  },
}

export type Strings = typeof en
