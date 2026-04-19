import { motion } from 'framer-motion'
import { useState } from 'react'
import { ResultCard } from '../components/ResultCard'
import type { SkinAnalysisResult, SkinRecommendation, SkinType } from '../types/skin'

interface ResultsProps {
    imageSrc: string | null
    result: SkinAnalysisResult
    onBackHome: () => void
    onViewHistory: () => void
}

const recommendations: Record<SkinType, SkinRecommendation> = {
    'Oily Skin': {
        morningRoutine: [
            'Foaming cleanser with salicylic acid',
            'Light niacinamide serum',
            'Oil-free gel moisturizer',
            'Matte SPF 50 sunscreen',
        ],
        nightRoutine: [
            'Double cleanse',
            'BHA leave-on toner 3x/week',
            'Non-comedogenic moisturizer',
        ],
        tips: [
            'Blot excess oil instead of over-washing.',
            'Avoid heavy creams around the T-zone.',
            'Sanitize phone screen and pillow cover regularly.',
        ],
        products: [
            { name: 'CeraVe Foaming Cleanser', category: 'Cleanser' },
            { name: 'The Ordinary Niacinamide 10%', category: 'Serum' },
            { name: 'La Roche-Posay Anthelios Oil Control', category: 'Sunscreen' },
        ],
    },
    'Dry Skin': {
        morningRoutine: [
            'Cream-based gentle cleanser',
            'Hydrating hyaluronic acid serum',
            'Ceramide-rich moisturizer',
            'Hydrating SPF 50 sunscreen',
        ],
        nightRoutine: [
            'Non-foaming cleanser',
            'Peptide or barrier repair serum',
            'Occlusive moisturizer layer',
        ],
        tips: [
            'Use lukewarm water for washing.',
            'Add a humidifier at night.',
            'Patch test exfoliants before full use.',
        ],
        products: [
            { name: 'Vanicream Gentle Cleanser', category: 'Cleanser' },
            { name: 'Hada Labo Gokujyun Lotion', category: 'Hydration' },
            { name: 'CeraVe Moisturizing Cream', category: 'Moisturizer' },
        ],
    },
    'Normal Skin': {
        morningRoutine: [
            'Gentle pH-balanced cleanser',
            'Antioxidant serum (vitamin C)',
            'Lightweight moisturizer',
            'Broad-spectrum SPF 50',
        ],
        nightRoutine: [
            'Cleanser',
            'Retinoid 2-3x/week',
            'Barrier-support moisturizer',
        ],
        tips: [
            'Keep routines consistent and minimal.',
            'Exfoliate only once weekly.',
            'Hydrate and sleep 7-8 hours.',
        ],
        products: [
            { name: 'La Roche-Posay Toleriane Cleanser', category: 'Cleanser' },
            { name: 'Geek & Gorgeous C-Glow', category: 'Serum' },
            { name: 'Beauty of Joseon Relief Sun', category: 'Sunscreen' },
        ],
    },
    'Combination Skin': {
        morningRoutine: [
            'Balanced gel cleanser',
            'Niacinamide + hydrating toner',
            'Dual-zone moisturizer application',
            'Light SPF 50 sunscreen',
        ],
        nightRoutine: [
            'Cleanser',
            'BHA on T-zone + hydrating serum on cheeks',
            'Medium-weight moisturizer',
        ],
        tips: [
            'Treat oily and dry zones differently.',
            'Use clay mask only on T-zone once weekly.',
            'Avoid over-layering active ingredients.',
        ],
        products: [
            { name: 'COSRX Low pH Cleanser', category: 'Cleanser' },
            { name: 'Paula’s Choice 2% BHA Liquid', category: 'Exfoliant' },
            { name: 'Neutrogena Hydro Boost Gel', category: 'Moisturizer' },
        ],
    },
}

const getRiskLabel = (value: number): string => {
    if (value >= 70) return 'High'
    if (value >= 45) return 'Moderate'
    return 'Low'
}

interface MetricBar {
    label: string
    value: number
    gradient: string
}

type PdfJsDoc = {
    internal: {
        pageSize: {
            getWidth: () => number
            getHeight: () => number
        }
        getNumberOfPages: () => number
    }
    setFillColor: (r: number, g: number, b: number) => PdfJsDoc
    setTextColor: (r: number, g: number, b: number) => PdfJsDoc
    setDrawColor: (r: number, g: number, b: number) => PdfJsDoc
    setLineWidth: (width: number) => PdfJsDoc
    setFont: (fontName: string, fontStyle?: string) => PdfJsDoc
    setFontSize: (size: number) => PdfJsDoc
    roundedRect: (x: number, y: number, width: number, height: number, rx: number, ry: number, style?: 'F' | 'S' | 'FD' | 'DF' | null) => PdfJsDoc
    rect: (x: number, y: number, width: number, height: number, style: 'F' | 'S' | 'FD' | 'DF') => PdfJsDoc
    text: (text: string | string[], x: number, y: number, options?: { maxWidth?: number; align?: 'left' | 'center' | 'right' }) => PdfJsDoc
    addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => PdfJsDoc
    addPage: () => PdfJsDoc
    getTextWidth: (text: string) => number
    splitTextToSize: (text: string, size: number) => string[]
    save: (fileName: string) => void
}

const downloadReportFileName = 'skin-condition-report.pdf'

const createRoundedImageDataUrl = async (source: string, width: number, height: number, radius: number): Promise<string> => {
    const image = new Image()
    image.decoding = 'async'
    image.src = source

    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
        throw new Error('Canvas context unavailable')
    }

    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    const offsetX = (width - drawWidth) / 2
    const offsetY = (height - drawHeight) / 2

    context.clearRect(0, 0, width, height)
    context.save()
    context.beginPath()
    context.moveTo(radius, 0)
    context.lineTo(width - radius, 0)
    context.quadraticCurveTo(width, 0, width, radius)
    context.lineTo(width, height - radius)
    context.quadraticCurveTo(width, height, width - radius, height)
    context.lineTo(radius, height)
    context.quadraticCurveTo(0, height, 0, height - radius)
    context.lineTo(0, radius)
    context.quadraticCurveTo(0, 0, radius, 0)
    context.closePath()
    context.clip()
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
    context.restore()

    return canvas.toDataURL('image/png')
}

const getHowItWasCalculated = (result: SkinAnalysisResult): string[] => {
    const oilinessLine = result.oiliness >= result.hydration
        ? 'The skin looked shinier than dry, so the app leaned more toward an oily or combination type.'
        : 'The skin looked drier than shiny, so the app leaned more toward a dry or combination type.'

    const acneLine = result.acneRisk >= 70
        ? 'More redness and texture were detected, so acne risk was marked higher.'
        : result.acneRisk >= 45
            ? 'Some redness and texture were detected, so acne risk was marked medium.'
            : 'Only a small amount of redness and texture was detected, so acne risk was marked lower.'

    const darkSpotLine = result.darkSpots >= 50
        ? 'Darker patches stood out more, so the dark spot score is higher.'
        : 'Only a few darker patches stood out, so the dark spot score is lower.'

    const confidenceLine = result.lowLighting
        ? 'The photo was a bit dim, so the confidence score is lower than usual.'
        : 'The photo was clear enough, so the confidence score is more dependable.'

    return [
        'The app looks at the captured face area and compares how shiny, dry, even, and clear the skin appears.',
        oilinessLine,
        acneLine,
        darkSpotLine,
        confidenceLine,
    ]
}

export function Results({ imageSrc, result, onBackHome, onViewHistory }: ResultsProps) {
    const routine = recommendations[result.skinType]
    const howItWasCalculated = getHowItWasCalculated(result)
    const appUrl = window.location.origin + window.location.pathname
    const [isSharing, setIsSharing] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const metricBars: MetricBar[] = [
        { label: 'Oiliness', value: result.oiliness, gradient: 'linear-gradient(90deg,#D8A7B1 0%,#E8CFC1 100%)' },
        { label: 'Hydration', value: result.hydration, gradient: 'linear-gradient(90deg,#A8C3A0 0%,#DCE8D8 100%)' },
        { label: 'Acne Risk', value: result.acneRisk, gradient: 'linear-gradient(90deg,#D8A7B1 0%,#F1D8DF 100%)' },
    ]

    const reportWarnings = [
        result.lowLighting ? 'Low lighting was detected. The result is still useful, but a brighter, even light can improve accuracy.' : 'Lighting looked stable during capture, which supports a more dependable result.',
        'Blurry photos can reduce confidence. Retake with steady hands, the phone at eye level, and a clear focus lock.',
    ]
    const imageWeightPercent = result.weighting ? Math.round(result.weighting.imageWeight * 100) : null
    const questionnaireWeightPercent = result.weighting ? Math.round(result.weighting.questionnaireWeight * 100) : null
    const dehydrationTendencyPercent = result.weighting ? result.weighting.dehydrationTendency : null

    const downloadReport = async () => {
        if (isDownloading) {
            return
        }

        setIsDownloading(true)
        try {
            const { jsPDF } = await import('jspdf')
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }) as unknown as PdfJsDoc
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 14
            const contentWidth = pageWidth - margin * 2
            const accent = { r: 201, g: 143, b: 157 }
            const accentSoft = { r: 232, g: 207, b: 193 }
            const accentGreen = { r: 168, g: 195, b: 160 }
            const text = { r: 63, g: 48, b: 41 }
            const gray = { r: 111, g: 99, b: 92 }
            const beige = { r: 248, g: 242, b: 236 }

            const drawSectionTitle = (title: string, y: number): number => {
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(13)
                pdf.setTextColor(text.r, text.g, text.b)
                pdf.text(title, margin, y)
                return y + 6
            }

            const drawBadge = (label: string, value: string, x: number, y: number, width: number, fill: { r: number; g: number; b: number }) => {
                pdf.setFillColor(fill.r, fill.g, fill.b)
                pdf.setDrawColor(fill.r, fill.g, fill.b)
                pdf.roundedRect(x, y, width, 18, 4, 4, 'F')
                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(8)
                pdf.setTextColor(gray.r, gray.g, gray.b)
                pdf.text(label.toUpperCase(), x + 4, y + 6)
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(10)
                pdf.setTextColor(text.r, text.g, text.b)
                pdf.text(value, x + 4, y + 13)
            }

            pdf.setFillColor(250, 249, 247)
            pdf.rect(0, 0, pageWidth, pageHeight, 'F')

            pdf.setFillColor(beige.r, beige.g, beige.b)
            pdf.setDrawColor(accentSoft.r, accentSoft.g, accentSoft.b)
            pdf.roundedRect(margin, 12, contentWidth, 26, 6, 6, 'F')
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(16)
            pdf.setTextColor(text.r, text.g, text.b)
            pdf.text('Skin Condition Analyzer Report', margin + 4, 22)
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(8)
            pdf.setTextColor(gray.r, gray.g, gray.b)
            const generatedAt = new Date().toLocaleString()
            const generatedLabel = `Generated: ${generatedAt}`
            pdf.text('Generated from the captured photo and on-device skin analysis', margin + 4, 30)
            pdf.text(generatedLabel, margin + 4, 35)

            const imageTop = 45
            const imageBoxWidth = 84
            const imageBoxHeight = 96
            pdf.setFillColor(255, 255, 255)
            pdf.setDrawColor(accentSoft.r, accentSoft.g, accentSoft.b)
            pdf.roundedRect(margin, imageTop, imageBoxWidth, imageBoxHeight, 5, 5, 'F')
            pdf.setFillColor(244, 236, 229)
            pdf.roundedRect(margin + 4, imageTop + 4, imageBoxWidth - 8, imageBoxHeight - 8, 4, 4, 'F')

            const imageWidth = imageBoxWidth - 8
            const imageHeight = imageBoxHeight - 8
            if (imageSrc) {
                try {
                    const roundedImage = await createRoundedImageDataUrl(imageSrc, Math.round(imageWidth * 6), Math.round(imageHeight * 6), 36)
                    pdf.addImage(roundedImage, 'PNG', margin + 4, imageTop + 4, imageWidth, imageHeight)
                } catch (error) {
                    const reason = error instanceof Error ? error.message : 'unknown image error'
                    pdf.setFont('helvetica', 'bold')
                    pdf.setFontSize(9)
                    pdf.setTextColor(gray.r, gray.g, gray.b)
                    pdf.text(`Image could not be embedded (${reason})`, margin + 8, imageTop + 50, { maxWidth: imageWidth - 4 })
                }
            } else {
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(11)
                pdf.setTextColor(gray.r, gray.g, gray.b)
                pdf.text('No image available', margin + 24, imageTop + 50)
            }

            const summaryX = margin + imageBoxWidth + 8
            const summaryWidth = contentWidth - imageBoxWidth - 8
            pdf.setFillColor(255, 255, 255)
            pdf.setDrawColor(accentSoft.r, accentSoft.g, accentSoft.b)
            pdf.roundedRect(summaryX, imageTop, summaryWidth, imageBoxHeight, 5, 5, 'F')

            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(14)
            pdf.setTextColor(text.r, text.g, text.b)
            pdf.text(result.skinType, summaryX + 5, imageTop + 12)

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(gray.r, gray.g, gray.b)
            pdf.text(`Confidence score: ${result.confidence}%`, summaryX + 5, imageTop + 20)

            if (result.weighting) {
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(8)
                pdf.setTextColor(text.r, text.g, text.b)
                pdf.text(
                    `Weighted blend: Image ${Math.round(result.weighting.imageWeight * 100)}% + Questionnaire ${Math.round(result.weighting.questionnaireWeight * 100)}%`,
                    summaryX + 5,
                    imageTop + 26,
                    { maxWidth: summaryWidth - 10 },
                )
                pdf.setFont('helvetica', 'normal')
                pdf.text(
                    `Dehydration tendency (questionnaire): ${result.weighting.dehydrationTendency}%`,
                    summaryX + 5,
                    imageTop + 30,
                    { maxWidth: summaryWidth - 10 },
                )
            }

            const badgeStartY = result.weighting ? imageTop + 38 : imageTop + 30
            drawBadge('Oiliness', `${result.oiliness}%`, summaryX + 5, badgeStartY, summaryWidth - 10, beige)
            drawBadge('Hydration', `${result.hydration}%`, summaryX + 5, badgeStartY + 20, summaryWidth - 10, accentGreen)
            drawBadge('Acne Risk', `${result.acneRisk}%`, summaryX + 5, badgeStartY + 40, summaryWidth - 10, { r: 247, g: 231, b: 236 })

            let cursorY = 145
            cursorY = drawSectionTitle('Capture Quality Notes', cursorY)
            pdf.setFillColor(255, 255, 255)
            pdf.setDrawColor(accentSoft.r, accentSoft.g, accentSoft.b)
            pdf.roundedRect(margin, cursorY, contentWidth, 28, 5, 5, 'F')
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(text.r, text.g, text.b)
            reportWarnings.forEach((line, index) => {
                pdf.text(`- ${line}`, margin + 5, cursorY + 8 + index * 7, { maxWidth: contentWidth - 10 })
            })

            cursorY += 38
            cursorY = drawSectionTitle('Recommended Tips', cursorY)
            pdf.setFillColor(255, 255, 255)
            pdf.setDrawColor(accentSoft.r, accentSoft.g, accentSoft.b)
            pdf.roundedRect(margin, cursorY, contentWidth, 44, 5, 5, 'F')
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(text.r, text.g, text.b)
            routine.tips.forEach((tip, index) => {
                pdf.text(`- ${tip}`, margin + 5, cursorY + 8 + index * 7, { maxWidth: contentWidth - 10 })
            })

            cursorY += 54
            const calculatedTitleHeight = 6
            const calculatedIntro = 'The app looks at the captured face area and compares how shiny, dry, even, and clear the skin appears.'
            const calculatedLines = [calculatedIntro, ...howItWasCalculated.slice(1)]
            const calculatedCardText = calculatedLines.flatMap((line, index) => {
                const prefix = index === 0 ? '- ' : '- '
                return pdf.splitTextToSize(`${prefix}${line}`, contentWidth - 10)
            })
            const calculatedCardHeight = calculatedCardText.length * 6 + calculatedTitleHeight + 10
            if (cursorY + calculatedCardHeight + 64 > pageHeight - 18) {
                pdf.addPage()
                pdf.setFillColor(250, 249, 247)
                pdf.rect(0, 0, pageWidth, pageHeight, 'F')
                cursorY = 20
            }
            cursorY = drawSectionTitle('How this was calculated', cursorY)
            pdf.setFillColor(255, 255, 255)
            pdf.setDrawColor(accentSoft.r, accentSoft.g, accentSoft.b)
            pdf.roundedRect(margin, cursorY, contentWidth, calculatedCardHeight, 5, 5, 'F')
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(text.r, text.g, text.b)
            let calculationLineY = cursorY + 8
            calculatedCardText.forEach((line) => {
                pdf.text(line, margin + 5, calculationLineY, { maxWidth: contentWidth - 10 })
                calculationLineY += 6
            })

            cursorY += calculatedCardHeight + 10
            if (cursorY + 62 > pageHeight - 18) {
                pdf.addPage()
                pdf.setFillColor(250, 249, 247)
                pdf.rect(0, 0, pageWidth, pageHeight, 'F')
                cursorY = 20
            }
            cursorY = drawSectionTitle('Suggested Routine', cursorY)
            const routineCardWidth = (contentWidth - 5) / 2
            pdf.setFillColor(255, 255, 255)
            pdf.setDrawColor(accentSoft.r, accentSoft.g, accentSoft.b)
            pdf.roundedRect(margin, cursorY, routineCardWidth, 42, 5, 5, 'F')
            pdf.roundedRect(margin + routineCardWidth + 5, cursorY, routineCardWidth, 42, 5, 5, 'F')

            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(10)
            pdf.setTextColor(text.r, text.g, text.b)
            pdf.text('Morning', margin + 5, cursorY + 8)
            pdf.text('Night', margin + routineCardWidth + 10, cursorY + 8)

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(8)
            pdf.setTextColor(gray.r, gray.g, gray.b)
            routine.morningRoutine.slice(0, 3).forEach((step, index) => {
                pdf.text(`- ${step}`, margin + 5, cursorY + 14 + index * 6, { maxWidth: routineCardWidth - 8 })
            })
            routine.nightRoutine.slice(0, 3).forEach((step, index) => {
                pdf.text(`- ${step}`, margin + routineCardWidth + 10, cursorY + 14 + index * 6, { maxWidth: routineCardWidth - 8 })
            })

            const warningY = cursorY + 52
            pdf.setFillColor(252, 243, 221)
            pdf.setDrawColor(230, 184, 90)
            pdf.roundedRect(margin, warningY, contentWidth, 22, 4, 4, 'F')
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(10)
            pdf.setTextColor(122, 78, 12)
            pdf.text('Important: Treat this as guidance, not a clinical diagnosis.', margin + 5, warningY + 8)
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(122, 78, 12)
            pdf.text('Great for trends and routine planning. For medical concerns, consult a dermatologist.', margin + 5, warningY + 15, { maxWidth: contentWidth - 10 })

            const footerY = warningY + 28
            pdf.setFillColor(accent.r, accent.g, accent.b)
            pdf.roundedRect(margin, footerY, contentWidth, 12, 4, 4, 'F')
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(8)
            pdf.setTextColor(255, 255, 255)
            pdf.text('Source of information', margin + 5, footerY + 4)
            pdf.setFont('helvetica', 'normal')
            pdf.text(appUrl, margin + 5, footerY + 9, { maxWidth: contentWidth - 10 })

            pdf.save(downloadReportFileName)
        } catch (error) {
            console.error('PDF report generation failed', error)
            const reason = error instanceof Error ? error.message : 'Unknown error'
            window.alert(`Unable to generate the PDF report right now. ${reason}`)
        } finally {
            setIsDownloading(false)
        }
    }

    const onShare = async () => {
        if (isSharing) {
            return
        }

        const baseShareText = `Skin Type: ${result.skinType}\nConfidence: ${result.confidence}%\nOiliness: ${result.oiliness}%\nHydration: ${result.hydration}%\nAcne Risk: ${result.acneRisk}%`
        const clipboardShareText = `${baseShareText}\nApp: ${appUrl}`

        setIsSharing(true)
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Skin Analysis Result',
                    text: baseShareText,
                    url: appUrl,
                })
                return
            }

            await navigator.clipboard.writeText(clipboardShareText)
            window.alert('Result copied to clipboard')
        } catch (error) {
            const reason = error instanceof Error ? error.message : ''

            if (navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(clipboardShareText)
                    window.alert(reason ? `Share unavailable. Result copied instead. (${reason})` : 'Share unavailable. Result copied instead.')
                    return
                } catch {
                    // fall through to the alert below
                }
            }

            window.alert(reason ? `Unable to share right now. (${reason})` : 'Unable to share right now.')
        } finally {
            setIsSharing(false)
        }
    }

    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_10%,rgba(232,207,193,0.65),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(216,167,177,0.22),transparent_35%),linear-gradient(170deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-16 pt-8 text-skin-text">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mx-auto flex max-w-md flex-col gap-5"
            >
                <article className="overflow-hidden rounded-3xl border border-skin-text/20 bg-skin-white p-6 shadow-card ring-1 ring-skin-text/5 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.2em] text-skin-gray">Analysis Complete</p>
                    <p className="mt-2 rounded-2xl bg-skin-beige px-3 py-2 text-xs text-skin-gray">Step 1: Capture -&gt; Step 2: Analyze -&gt; Step 3: Results</p>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(145deg,#E8CFC1_0%,#D8A7B1_100%)] text-2xl shadow-soft">
                            <span role="img" aria-label="Face">🧴</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold text-skin-text">{result.skinType}</h1>
                            <p className="mt-1 text-sm text-skin-gray">Confidence score: {result.confidence}%</p>
                        </div>
                    </div>
                    {result.lowLighting && (
                        <p className="alert-warning mt-4 rounded-xl px-3 py-2 text-xs">
                            Low lighting detected. Results may improve with brighter, even light.
                        </p>
                    )}
                </article>

                <motion.article
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-card ring-1 ring-skin-text/5"
                >
                    <h2 className="text-lg font-semibold text-skin-text">Skin Signals</h2>
                    <div className="mt-4 space-y-4">
                        {metricBars.map((metric, index) => (
                            <div key={metric.label}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <p className="text-skin-gray">{metric.label}</p>
                                    <p className="font-medium text-skin-text">{metric.value}%</p>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full border border-skin-tone/80 bg-skin-beige">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metric.value}%` }}
                                        transition={{ duration: 0.65, delay: 0.1 + index * 0.12, ease: 'easeOut' }}
                                        style={{ background: metric.gradient }}
                                        className="h-full rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.article>

                {result.weighting && (
                    <motion.article
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.09 }}
                        className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-soft ring-1 ring-skin-text/5"
                    >
                        <h2 className="text-lg font-semibold text-skin-text">Weighted Result Blend</h2>
                        <p className="mt-1 text-sm text-skin-gray">
                            Final result combines photo signals with your skin profile answers.
                        </p>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                            <div className="rounded-2xl border border-skin-tone/80 bg-skin-beige px-3 py-2">
                                <p className="text-[11px] leading-tight text-skin-gray">Image Weight</p>
                                <p className="mt-1 text-sm font-semibold text-skin-text">{imageWeightPercent}%</p>
                            </div>
                            <div className="rounded-2xl border border-skin-tone/80 bg-skin-beige px-3 py-2">
                                <p className="text-[11px] leading-tight text-skin-gray">Questionnaire Weight</p>
                                <p className="mt-1 text-sm font-semibold text-skin-text">{questionnaireWeightPercent}%</p>
                            </div>
                            <div className="rounded-2xl border border-skin-tone/80 bg-skin-beige px-3 py-2">
                                <p className="text-[11px] leading-tight text-skin-gray">Dehydration Tendency</p>
                                <p className="mt-1 text-sm font-semibold text-skin-text">{dehydrationTendencyPercent}%</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-skin-gray">
                            <p>
                                Image-only type:{' '}
                                <span className="font-semibold text-skin-text">{result.weighting.imageOnlySkinType}</span>
                            </p>
                            <p>
                                Questionnaire type:{' '}
                                <span className="font-semibold text-skin-text">{result.weighting.questionnaireSkinType}</span>
                            </p>
                        </div>
                    </motion.article>
                )}

                <ResultCard title="Dark Spots" value={`${result.darkSpots}%`} helper="Pigmentation tendency" />
                <ResultCard title="Acne Risk Label" value={getRiskLabel(result.acneRisk)} helper={`${result.acneRisk}% probability`} />

                <motion.article
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.12 }}
                    className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-soft ring-1 ring-skin-text/5"
                >
                    <h2 className="text-lg font-semibold text-skin-text">How this was calculated</h2>
                    <p className="mt-2 text-sm text-skin-gray">
                        This result comes from the face photo you captured and the stable frames from the burst.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-skin-gray">
                        {howItWasCalculated.map((line) => (
                            <motion.li
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                key={line}
                                className="rounded-2xl border border-skin-tone/80 bg-skin-beige px-3 py-2"
                            >
                                {line}
                            </motion.li>
                        ))}
                    </ul>
                </motion.article>

                <motion.article
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.16 }}
                    className="rounded-3xl border border-[#e6b85a]/70 bg-[linear-gradient(145deg,#fcf3dd_0%,#fff7e8_100%)] p-4 shadow-soft ring-1 ring-[#e6b85a]/35"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a4e0c]">Friendly Reality Check</p>
                    <p className="mt-2 text-sm font-medium text-[#7a4e0c]">
                        Useful for trends, not a final diagnosis. Treat this as smart guidance and confirm medical concerns with a dermatologist.
                    </p>
                </motion.article>

                <motion.article
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-soft ring-1 ring-skin-text/5"
                >
                    <h2 className="text-lg font-semibold text-skin-text">Recommended Routine</h2>
                    <div className="mt-3 grid gap-4 text-sm text-skin-text">
                        <div className="rounded-2xl border border-skin-tone/80 bg-skin-beige p-3">
                            <h3 className="font-medium text-skin-text">Morning</h3>
                            <ul className="mt-2 space-y-1 text-skin-gray">
                                {routine.morningRoutine.map((step) => (
                                    <li key={step}>• {step}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-skin-tone/80 bg-skin-beige p-3">
                            <h3 className="font-medium text-skin-text">Night</h3>
                            <ul className="mt-2 space-y-1 text-skin-gray">
                                {routine.nightRoutine.map((step) => (
                                    <li key={step}>• {step}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.article>

                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                        type="button"
                        onClick={onBackHome}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-3 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        Back to Home
                    </button>
                    <button
                        type="button"
                        onClick={onViewHistory}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-3 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        History
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void onShare()
                        }}
                        disabled={isSharing}
                        className="rounded-2xl bg-[#c98f9d] px-3 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#b98190] disabled:opacity-60"
                    >
                        {isSharing ? 'Sharing...' : 'Share Result'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void downloadReport()
                        }}
                        disabled={isDownloading}
                        className="rounded-2xl bg-[#A8C3A0] px-3 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#95af8d] disabled:opacity-60"
                    >
                        {isDownloading ? 'Creating...' : 'Download Report'}
                    </button>
                </div>
            </motion.section>
        </main>
    )
}
