interface CaptureButtonProps {
    onClick: () => void
    disabled?: boolean
}

export function CaptureButton({ onClick, disabled = false }: CaptureButtonProps) {
    return (
        <button
            type="button"
            aria-label="Capture photo"
            onClick={onClick}
            disabled={disabled}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-cyan-200/90 bg-cyan-300/20 backdrop-blur-sm transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
            <span className="h-12 w-12 rounded-full bg-cyan-100 shadow-[0_0_35px_rgba(103,232,249,0.55)]" />
        </button>
    )
}
