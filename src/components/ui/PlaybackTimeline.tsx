import { useCallback, useMemo } from "react";
import { usePlaybackStore } from "@/store/usePlaybackStore";
import { Play, Pause, Radio } from "lucide-react";

const SPEED_OPTIONS = [100, 500, 1000, 5000] as const;

function formatShortDate(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPlaybackTime(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function PlaybackTimeline() {
  const {
    isPlaying,
    playbackTime,
    playbackSpeed,
    missionStart,
    missionEnd,
    play,
    pause,
    setPlaybackTime,
    setPlaybackSpeed,
    goLive,
  } = usePlaybackStore();

  const isLive = playbackTime === null;
  const currentEnd = useMemo(() => Math.min(missionEnd, Date.now()), [missionEnd]);
  const displayTime = playbackTime ?? Date.now();

  // Progress percentage for the filled bar
  const progress = useMemo(() => {
    if (isLive) return 100;
    const range = currentEnd - missionStart;
    if (range <= 0) return 0;
    return ((displayTime - missionStart) / range) * 100;
  }, [isLive, displayTime, missionStart, currentEnd]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleSpeedCycle = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(playbackSpeed as typeof SPEED_OPTIONS[number]);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]!;
    setPlaybackSpeed(next);
  }, [playbackSpeed, setPlaybackSpeed]);

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlaybackTime(Number(e.target.value));
    },
    [setPlaybackTime],
  );

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-1.5 bg-space-surface/50 border-t border-space-border/30">
      {/* Play / Pause */}
      <button
        onClick={handlePlayPause}
        className="w-10 h-10 sm:w-6 sm:h-6 flex items-center justify-center bg-space-bg/60 border border-space-border hover:border-cyan/40 text-text-muted hover:text-cyan transition-colors rounded-sm cursor-pointer shrink-0"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={10} /> : <Play size={10} />}
      </button>

      {/* Speed selector */}
      <button
        onClick={handleSpeedCycle}
        className="px-2 sm:px-1.5 py-1.5 sm:py-0.5 text-[10px] sm:text-[8px] font-mono text-amber bg-space-bg/60 border border-space-border hover:border-amber/40 rounded-sm cursor-pointer shrink-0 min-w-[42px] text-center transition-colors min-h-[44px] sm:min-h-0"
        aria-label={`Playback speed: ${playbackSpeed}x`}
      >
        {playbackSpeed}x
      </button>

      {/* Start label */}
      <span className="text-[8px] font-mono text-text-muted/60 shrink-0 hidden sm:inline">
        {formatShortDate(missionStart)}
      </span>

      {/* Scrubber */}
      <div className="flex-1 relative h-4 flex items-center min-w-0">
        {/* Track background */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-[3px] bg-space-border/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan/60 transition-[width] duration-100"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
        <input
          type="range"
          min={missionStart}
          max={currentEnd}
          value={displayTime}
          onChange={handleScrub}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Playback timeline scrubber"
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan rounded-full pointer-events-none shadow-[0_0_4px_rgba(0,212,255,0.6)] z-[5]"
          style={{ left: `calc(${Math.min(100, Math.max(0, progress))}% - 4px)` }}
        />
      </div>

      {/* End label */}
      <span className="text-[8px] font-mono text-text-muted/60 shrink-0 hidden sm:inline">
        {formatShortDate(currentEnd)}
      </span>

      {/* Current time display */}
      {!isLive && (
        <span className="text-[8px] font-mono text-cyan/80 shrink-0 hidden md:inline min-w-[110px] text-right">
          {formatPlaybackTime(displayTime)}
        </span>
      )}

      {/* LIVE button */}
      <button
        onClick={goLive}
        className={`px-3 sm:px-2 py-2 sm:py-0.5 text-[10px] sm:text-[8px] font-mono uppercase tracking-wider rounded-sm cursor-pointer shrink-0 flex items-center gap-1 border transition-colors min-h-[44px] sm:min-h-0 ${
          isLive
            ? "text-green bg-green/10 border-green/30"
            : "text-text-muted bg-space-bg/60 border-space-border hover:border-green/40 hover:text-green"
        }`}
        aria-label="Go to live"
      >
        <Radio size={8} />
        Live
      </button>
    </div>
  );
}
