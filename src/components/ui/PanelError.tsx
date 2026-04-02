interface PanelErrorProps {
  message: string;
  onRetry?: () => void;
}

export function PanelError({ message, onRetry }: PanelErrorProps) {
  return (
    <div className="bg-space-panel border border-amber/20 rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[120px]">
      <div className="text-amber text-2xl">&#9888;</div>
      <p className="text-text-secondary text-xs text-center font-mono">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-mono text-cyan border border-cyan/30 rounded px-3 py-1
                     hover:bg-cyan/10 transition-colors cursor-pointer"
        >
          RETRY
        </button>
      )}
    </div>
  );
}
