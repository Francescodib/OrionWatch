interface PanelSkeletonProps {
  lines?: number;
}

export function PanelSkeleton({ lines = 3 }: PanelSkeletonProps) {
  return (
    <div className="bg-space-panel border border-space-border rounded-lg p-4 motion-safe:animate-[shimmer_1.5s_ease-in-out_infinite]">
      <div className="h-3 w-24 bg-space-border rounded mb-4" />
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-6 bg-space-border rounded mb-2"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}
