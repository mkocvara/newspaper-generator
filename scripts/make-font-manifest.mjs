// Look up the static TTF files of the built-in fonts, for embedding them in
// PDF exports. Google's download list can't be read from a browser (no CORS),
// but the files it points to on fonts.gstatic.com can, so the addresses are
// looked up here and shipped with the app.
//
// Usage: node scripts/make-font-manifest.mjs   (rerun when FONT_CHOICES changes)
import { readFileSync, writeFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/lib/fonts.ts', import.meta.url), 'utf8')
const list = source.slice(source.indexOf('FONT_CHOICES'), source.indexOf(']', source.indexOf('FONT_CHOICES')))
const families = [...list.matchAll(/'([^']+)'/g)].map((m) => m[1])

// Static instance file names end in the style: Lora-Regular.ttf, Lora-BoldItalic.ttf.
const STYLES = { Regular: 'normal', Bold: 'bold', Italic: 'italic', BoldItalic: 'bolditalic' }

const manifest = {}
for (const family of families) {
  const response = await fetch(`https://fonts.google.com/download/list?family=${encodeURIComponent(family)}`)
  if (!response.ok) throw new Error(`${family}: HTTP ${response.status}`)
  const text = await response.text()
  const data = JSON.parse(text.slice(text.indexOf('\n') + 1))
  const files = {}
  for (const { filename, url } of data.manifest.fileRefs) {
    const match = filename.match(/(?:^|\/)[^/]+-(Regular|Bold|Italic|BoldItalic)\.ttf$/)
    if (match && !filename.includes('Variable')) files[STYLES[match[1]]] = url
  }
  if (!files.normal) throw new Error(`${family}: no static regular TTF in ${data.manifest.fileRefs.map((f) => f.filename)}`)
  manifest[family] = files
  console.log(family.padEnd(20), Object.keys(files).join(' '))
}

const out = new URL('../src/lib/pdf/font-manifest.json', import.meta.url)
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n')
