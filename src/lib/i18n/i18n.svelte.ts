import { cs } from './cs'
import { en, type Strings } from './en'

export type Language = 'en' | 'cs'

export const LANGUAGES: Record<Language, Strings> = { en, cs }

const STORAGE_KEY = 'newspaper:language'

// The UI language: remembered per browser once chosen, otherwise the
// browser's own (Czech if it prefers Czech, else English).
function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'cs') return saved
  } catch {
    // Storage unavailable; fall through to the browser's language.
  }
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]
  return preferred.some((tag) => tag?.toLowerCase().startsWith('cs')) ? 'cs' : 'en'
}

class I18n {
  language = $state<Language>(typeof window === 'undefined' ? 'en' : initialLanguage())
  // The text for the current language: `i18n.t.toolbar.undo`.
  t = $derived(LANGUAGES[this.language])

  set(language: Language) {
    this.language = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Not remembered; the choice still applies for this visit.
    }
  }
}

export const i18n = new I18n()
