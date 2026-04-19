import { useEffect, useRef, useState } from 'react'

declare global {
    interface Window {
        adsbygoogle?: unknown[]
    }
}

interface AdSlotProps {
    slot: string
    className?: string
    minHeightClassName?: string
}

const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined

export function AdSlot({ slot, className, minHeightClassName = 'min-h-[96px]' }: AdSlotProps) {
    const [scriptReady, setScriptReady] = useState(false)
    const hasPushedRef = useRef(false)

    useEffect(() => {
        if (!ADSENSE_CLIENT_ID) {
            return
        }

        const scriptId = 'adsense-script'
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null

        if (existing) {
            setScriptReady(true)
            return
        }

        const script = document.createElement('script')
        script.id = scriptId
        script.async = true
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`
        script.crossOrigin = 'anonymous'
        script.onload = () => {
            setScriptReady(true)
        }
        document.head.appendChild(script)

        return () => {
            script.onload = null
        }
    }, [])

    useEffect(() => {
        if (!ADSENSE_CLIENT_ID || !slot || !scriptReady || hasPushedRef.current) {
            return
        }

        try {
            ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            hasPushedRef.current = true
        } catch {
            // Ad blockers can throw here. Ignore and keep the page stable.
        }
    }, [scriptReady, slot])

    if (!ADSENSE_CLIENT_ID || !slot) {
        return null
    }

    return (
        <div className={className}>
            <p className="mb-2 text-center text-[10px] uppercase tracking-[0.16em] text-skin-gray">Sponsored</p>
            <ins
                className={`adsbygoogle block w-full overflow-hidden rounded-2xl border border-skin-text/15 bg-skin-white/90 ${minHeightClassName}`}
                style={{ display: 'block' }}
                data-ad-client={ADSENSE_CLIENT_ID}
                data-ad-slot={slot}
                data-ad-format="auto"
                data-full-width-responsive="true"
                aria-label="Advertisement"
            />
        </div>
    )
}

export default AdSlot