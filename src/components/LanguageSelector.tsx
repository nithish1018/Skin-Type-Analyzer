import { useEffect, useRef, useState } from 'react'
import { LANGUAGE_OPTIONS, useI18n } from '../i18n/I18nProvider'

export function LanguageSelector() {
    const { language, setLanguage, t } = useI18n()
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null
            if (!target || !wrapperRef.current || wrapperRef.current.contains(target)) {
                return
            }
            setIsOpen(false)
        }

        window.addEventListener('mousedown', onClickOutside)
        return () => window.removeEventListener('mousedown', onClickOutside)
    }, [])

    const activeLabel = LANGUAGE_OPTIONS.find((item) => item.code === language)?.label ?? 'English'

    return (
        <div ref={wrapperRef} className="relative z-20">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg border border-skin-text/15 bg-skin-white/92 px-2.5 py-1.5 text-[11px] font-semibold text-skin-text shadow-soft ring-1 ring-skin-text/5 backdrop-blur-md hover:bg-skin-white"
                aria-label={t('language.select', 'Language')}
                aria-expanded={isOpen}
            >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-skin-beige text-skin-text" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M3.9 12h16.2M12 3.9c2.1 2.2 3.3 5 3.3 8.1s-1.2 5.9-3.3 8.1M12 3.9c-2.1 2.2-3.3 5-3.3 8.1s1.2 5.9 3.3 8.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                </span>
                <span>{activeLabel}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg border border-skin-text/20 bg-skin-white p-1.5 shadow-card ring-1 ring-skin-text/5">
                    {LANGUAGE_OPTIONS.map((option) => (
                        <button
                            key={option.code}
                            type="button"
                            onClick={() => {
                                setLanguage(option.code)
                                setIsOpen(false)
                            }}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition ${option.code === language
                                ? 'bg-[#f1e1d8] text-skin-text'
                                : 'text-skin-gray hover:bg-skin-beige'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
