import { createContext, useContext, useMemo, useState } from 'react'
import {
    LANGUAGE_OPTIONS,
    LANGUAGE_STORAGE_KEY,
    LANGUAGE_TO_LOCALE,
    type AppLanguage,
    translations,
} from './translations'

interface I18nContextValue {
    language: AppLanguage
    locale: string
    setLanguage: (language: AppLanguage) => void
    t: (key: string, fallback?: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const getInitialLanguage = (): AppLanguage => {
    try {
        const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null
        if (stored && stored in translations) {
            return stored
        }
    } catch {
        // no-op
    }

    return 'en'
}

const interpolate = (template: string, vars?: Record<string, string | number>): string => {
    if (!vars) {
        return template
    }

    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
        const value = vars[key]
        return value === undefined ? `{${key}}` : String(value)
    })
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage)

    const setLanguage = (nextLanguage: AppLanguage) => {
        setLanguageState(nextLanguage)
        try {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
        } catch {
            // no-op
        }
    }

    const value = useMemo<I18nContextValue>(() => {
        return {
            language,
            locale: LANGUAGE_TO_LOCALE[language],
            setLanguage,
            t: (key, fallback, vars) => {
                const source = translations[language][key] ?? translations.en[key] ?? fallback ?? key
                return interpolate(source, vars)
            },
        }
    }, [language])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used inside I18nProvider')
    }
    return context
}

export { LANGUAGE_OPTIONS }
