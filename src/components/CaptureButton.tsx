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
            className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-skin-white/95 bg-[linear-gradient(145deg,#E8CFC1_0%,#D8A7B1_100%)] shadow-card transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
            <span className="h-12 w-12 animate-bounce rounded-full bg-skin-white shadow-soft [animation-duration:1.5s]" />
        </button>
    )
}
