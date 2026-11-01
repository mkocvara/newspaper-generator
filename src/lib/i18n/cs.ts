import type { Strings } from './en'

// Czech UI text (to be proof-read).

const list = (items: string[]) => items.join(', ')

export const cs: Strings = {
  languageName: 'Čeština',
  // Czech typography puts a space before the per cent sign.
  percent: (n: number) => `${n} %`,

  page: {
    date: 'Datum',
    name: 'Název novin',
    location: 'Místo',
    footerLeft: 'Text vlevo',
    footerCenter: 'Text uprostřed',
    footerRight: 'Text vpravo',
    footerDefault: 'Strana 1',
  },

  elements: {
    eyecatcher: 'Poutač',
    secondary: 'Vedlejší text',
    heading: 'Nadpis',
    article: 'Text článku',
    imageDescription: 'Popis obrázku',
    chooseImage: 'Vyberte obrázek',
    orDropImage: 'nebo ho sem přetáhněte',
    replace: 'Nahradit',
    replaceTitle: 'Nahradit obrázek',
    ink: 'Inkoust',
    inkTitle: 'Vytisknout obrázek barvou inkoustu',
    crop: 'Oříznout',
    cropOnTitle: 'Oříznuto na celou buňku. Kliknutím zobrazíte celý obrázek.',
    cropOffTitle: 'Zobrazen celý obrázek. Kliknutím ho oříznete na celou buňku.',
    panTitle: 'Přetažením vyberete, která část je vidět. Dvojklikem ji vycentrujete.',
  },

  grid: {
    cellLayout: 'Rozvržení buňky',
    insert: { eyecatcher: 'Vložit poutač', text: 'Vložit text', image: 'Vložit obrázek' },
    changeTo: { eyecatcher: 'Změnit na poutač', text: 'Změnit na text', image: 'Změnit na obrázek' },
    clearCell: 'Vyprázdnit buňku',
    splitSideBySide: 'Rozdělit vedle sebe',
    splitTopBottom: 'Rozdělit nad sebe',
    merge: {
      right: 'Sloučit s buňkou vpravo',
      left: 'Sloučit s buňkou vlevo',
      up: 'Sloučit s buňkou nahoře',
      down: 'Sloučit s buňkou dole',
    },
    mergeColumn: 'Sloučit celý sloupec',
    mergeRow: 'Sloučit celý řádek',
    column: (n: number) => `Sloupec ${n}`,
    row: (n: number) => `Řádek ${n}`,
    insertColumnLeft: 'Vložit sloupec vlevo',
    insertColumnRight: 'Vložit sloupec vpravo',
    insertRowAbove: 'Vložit řádek nad',
    insertRowBelow: 'Vložit řádek pod',
    deleteColumn: 'Smazat sloupec',
    deleteRow: 'Smazat řádek',
    moveCell: 'Přesunout buňku',
    moveCellTitle: 'Přetažením přesunete buňku v jejím sloupci nebo řádku',
  },

  toolbar: {
    tools: 'Nástroje novin',
    undo: 'Zpět',
    undoTitle: 'Zpět (Ctrl+Z)',
    redo: 'Znovu',
    redoTitle: 'Znovu (Ctrl+Y)',
    import: 'Importovat',
    export: 'Exportovat',
    exporting: 'Exportuji…',
    exportPng: 'Obrázek (PNG)',
    exportJpg: 'Obrázek (JPG)',
    exportPdf: 'PDF',
    exportPreset: 'Importovatelná šablona',
    pin: 'Připnout lištu',
    pinTitle: 'Připnout: lišta zůstane viditelná',
    unpinTitle: 'Odepnout: lišta se skryje, když se nepoužívá',
    language: 'Jazyk',
  },

  status: {
    exporting: 'Exportuji…',
    exported: 'Exportováno.',
    exportFailed: 'Export se nezdařil. Podrobnosti najdete v konzoli prohlížeče.',
    notPreset: (file: string) => `${file} není šablona novin.`,
    imported: (file: string) => `Importováno: ${file}. Zpět (Ctrl+Z) vrátí předchozí stránku.`,
    unreadable: (file: string) => `Soubor ${file} nelze přečíst.`,
    newPaper: 'Začaly nové noviny. Zpět (Ctrl+Z) vrátí ty předchozí.',
  },

  newPaper: {
    button: 'Nové noviny',
    title: 'Začít nové noviny?',
    warning: 'Stránka se vrátí do výchozího rozvržení a stylů a vaše současné změny se ztratí.',
    keepWork: 'Chcete-li si práci ponechat, nejdřív ji exportujte jako šablonu; později ji můžete znovu importovat.',
    exported: 'Šablona exportována.',
    cancel: 'Zrušit',
    exportFirst: 'Nejdřív exportovat šablonu',
    confirm: 'Začít nové noviny',
  },

  fonts: {
    panel: 'Písma',
    roles: {
      body: 'Text článků',
      heading: 'Nadpisy',
      caption: 'Popisy obrázků',
      eyecatcher: 'Poutače',
      headerFooter: 'Záhlaví a zápatí',
      name: 'Název novin',
    },
    manage: 'Spravovat písma…',
    back: '‹ Zpět',
    yourFonts: 'Vaše písma',
    inUse: 'používá se',
    usedFor: (roles: string[]) => `Použito pro: ${list(roles)}`,
    remove: (family: string) => `Odebrat ${family}`,
    removeInUse: (family: string, roles: string[], fallback: string) =>
      `Odebrat ${family}. Místo něj se použije ${fallback} (${list(roles)}).`,
    none: 'Žádná písma. Přidejte nějaké níže, nebo obnovte výchozí písma.',
    addBefore: 'Přidejte ',
    addLink: 'písmo Google',
    addAfter: ' podle názvu nebo odkazu',
    addPlaceholder: 'např. Crimson Text',
    add: 'Přidat',
    needInput: 'Zadejte název písma nebo odkaz na Google Fonts.',
    loading: 'Načítám…',
    couldNotLoad: (families: string[]) =>
      `Nepodařilo se načíst: ${list(families)}. Zkontrolujte název na fonts.google.com.`,
    added: (families: string[]) => `Přidáno: ${list(families)}.`,
    restore: (removed: number) => `Obnovit výchozí písma (odebráno: ${removed})`,
    listNote: 'Seznam je uložený v tomto prohlížeči a sdílejí ho všechny vaše stránky.',
  },

  sizes: {
    panel: 'Velikost textu',
    body: 'Text článků',
    heading: 'Nadpisy',
    caption: 'Popisy obrázků',
    hint:
      'Velikosti jsou v bodech. Když se text článku nevejde do buňky, zmenší se nejdřív jeho text, potom nadpis. ' +
      'Velikost textu v záhlaví, zápatí a poutačích se řídí jejich buňkami.',
  },

  frame: {
    panel: 'Rámeček a ohraničení',
    legend: 'Rámeček záhlaví a zápatí',
    styles: {
      single: 'Jednoduchá čára',
      double: 'Dvojitá čára',
      'thick-outer': 'Silná a tenká (silná vně)',
      'thin-outer': 'Silná a tenká (tenká vně)',
      dashed: 'Čárkovaná',
      dotted: 'Tečkovaná',
      'dash-dot': 'Čerchovaná',
      zigzag: 'Klikatá',
      wave: 'Vlnovka',
    },
    borderWidth: 'Tloušťka ohraničení buněk (pt)',
  },

  paper: {
    panel: 'Papír',
    styles: {
      newsprint: 'Novinový papír',
      'aged-clean': 'Starý papír',
      aged: 'Starý se skvrnami',
      modern: 'Moderní hladký',
      'modern-creased': 'Moderní přeložený',
    },
  },

  ink: {
    panel: 'Inkoust',
    presets: 'Předvolby inkoustu',
    presetNames: ['Černá', 'Sépiově hnědá', 'Námořnická modrá', 'Tmavě červená', 'Tmavě zelená'],
    custom: 'Vlastní barva inkoustu',
    hint: 'Použije se pro veškerý text, rámečky, ohraničení a ozdoby názvu a pro obrázky se zapnutým Inkoustem.',
  },

  name: {
    panel: 'Název novin',
    ornaments: 'Ozdoby',
    ornamentStyles: {
      none: 'Žádné',
      fleurons: 'Fleurony',
      'guillemets-in': 'Uvozovky, dovnitř',
      'guillemets-out': 'Uvozovky, ven',
      hands: 'Ukazující ruce',
      curls: 'Kudrlinky',
      rules: 'Protažené linky',
      custom: 'Vlastní symboly',
    },
    ornamentSize: 'Velikost ozdob',
    ornamentSizeHint: 'Velikost ozdob je v % standardní velikosti.',
    before: 'Před názvem',
    after: 'Za názvem',
    beforePlaceholder: 'např. ✦',
    afterPlaceholder: 'stejné jako před',
    symbols: 'Symboly',
    insertBefore: (symbol: string) => `Vložit ${symbol} před název`,
    insertAfter: (symbol: string) => `Vložit ${symbol} za název`,
    symbolsHint:
      'Kliknutím na symbol ho přidáte do zvýrazněného pole, nebo napište libovolné symboly Unicode. Pole může obsahovat i více symbolů.',
    effect: 'Efekt',
    effects: {
      none: 'Žádný',
      shadow: 'Vržený stín',
      extrude: '3D vysunutí',
      engraved: 'Vtlačený',
      outline: 'Obrys',
      hatched: 'Šrafovaný',
    },
  },

  view: {
    panVertical: 'Posun nahoru a dolů',
    panHorizontal: 'Posun doleva a doprava',
    zoomTitle: 'Úroveň přiblížení. Kliknutím obnovíte 100 %.',
  },
}
