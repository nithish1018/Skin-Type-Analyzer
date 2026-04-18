interface ResultCardProps {
    title: string
    value: string
    helper: string
}

export function ResultCard({ title, value, helper }: ResultCardProps) {
    return (
        <article className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-4 shadow-xl shadow-cyan-500/5 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-100">{value}</p>
            <p className="mt-1 text-sm text-slate-300">{helper}</p>
        </article>
    )
}
