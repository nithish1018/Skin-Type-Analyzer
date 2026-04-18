interface ResultCardProps {
    title: string
    value: string
    helper: string
}

export function ResultCard({ title, value, helper }: ResultCardProps) {
    return (
        <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.16em] text-skin-gray">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-skin-text">{value}</p>
            <p className="mt-1 text-sm text-skin-gray">{helper}</p>
        </article>
    )
}
