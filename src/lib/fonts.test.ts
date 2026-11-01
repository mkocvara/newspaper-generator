import { describe, expect, it } from 'vitest'
import { parseFontInput } from './fonts'

describe('parseFontInput', () => {
  it('accepts a family name', () => {
    expect(parseFontInput('  Crimson Text ')).toEqual([{ family: 'Crimson Text', url: '' }])
    expect(parseFontInput('   ')).toEqual([])
  })

  it('reads the families from a Google Fonts link', () => {
    const url = 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&family=Lobster&display=swap'
    expect(parseFontInput(url)).toEqual([
      { family: 'Crimson Text', url },
      { family: 'Lobster', url },
    ])
  })
})
