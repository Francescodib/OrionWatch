import { useEffect } from "react";
import { useTargetStore } from "@/store/useTargetStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { TelemetryContainer } from "@/components/telemetry/TelemetryContainer";
import { SceneContainer } from "@/components/scene/SceneContainer";
import { DistanceContainer } from "@/components/charts/DistanceContainer";
import { SpaceWeatherPanel } from "@/components/weather/SpaceWeatherPanel";
import { MilestoneTimeline } from "@/components/mission/MilestoneTimeline";
import { DsnPanel } from "@/components/dsn/DsnPanel";
import { ImageFeed } from "@/components/media/ImageFeed";
import { BlogFeed } from "@/components/media/BlogFeed";
import { EpicEarth } from "@/components/media/EpicEarth";
import { ApodPanel } from "@/components/media/ApodPanel";
import { PlaybackTimeline } from "@/components/ui/PlaybackTimeline";
import { TabBar, type Tab } from "@/components/ui/TabBar";
import { Sun, Radio, LineChart, Newspaper, Flag } from "lucide-react";

export function PanelGrid() {
  const { activeTarget } = useTargetStore();
  const { activeMainTab, setActiveMainTab } = useDashboardStore();

  const imageQuery = activeTarget.imageQuery ?? "";
  const blogRssUrl = activeTarget.blogRssUrl ?? "";
  const hasMilestones = activeTarget.milestones.length > 0;
  const hasMedia = !!(imageQuery || blogRssUrl);
  const weatherEnabled = activeTarget.spaceWeather.enabled;

  // Reset tab on target switch
  useEffect(() => {
    setActiveMainTab("profile");
  }, [activeTarget.id, setActiveMainTab]);

  const tabs: Tab[] = [
    { id: "profile", label: "Mission Profile", icon: <LineChart size={11} /> },
    { id: "weather", label: "Space Weather", icon: <Sun size={11} /> },
    { id: "dsn", label: "DSN", icon: <Radio size={11} /> },
    ...(hasMedia ? [{ id: "media", label: "Media", icon: <Newspaper size={11} /> }] : []),
  ];

  return (
    <div className="flex-1 flex flex-col xl:grid xl:grid-cols-[1fr_256px] overflow-hidden">
      {/* ── Column 1: Scene + controls ────────────────────── */}
      <div className="flex flex-col min-h-0">
        {/* Mobile-only telemetry */}
        <div className="lg:hidden shrink-0 p-2 sm:p-3 border-b border-space-border/30">
          <TelemetryContainer />
        </div>

        {/* 3D Scene — fills available space */}
        <div className="flex-1 min-h-[200px] sm:min-h-[350px]">
          <SceneContainer />
        </div>

        {/* Playback Timeline */}
        <div className="shrink-0">
          <PlaybackTimeline />
        </div>

        {/* Mission Timeline — compact strip */}
        {hasMilestones && (
          <div className="shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 border-t border-space-border/30 bg-space-surface/30">
            <div className="flex items-center gap-2 mb-1">
              <Flag size={10} className="text-text-muted/50" />
              <span className="text-[8px] font-heading uppercase tracking-[0.15em] text-text-muted/60">Mission Progress</span>
            </div>
            <MilestoneTimeline milestones={activeTarget.milestones} />
          </div>
        )}

        {/* Tabbed content (< xl only — on xl+ the right panel shows everything) */}
        <div className="xl:hidden shrink-0 border-t border-space-border/30">
          <TabBar tabs={tabs} activeTab={activeMainTab} onTabChange={setActiveMainTab} />
          <div className="h-[180px] sm:h-[200px] lg:h-[300px] overflow-y-auto p-2 sm:p-3">
            {activeMainTab === "profile" && <DistanceContainer />}
            {activeMainTab === "weather" && (
              <SpaceWeatherPanel enabled={weatherEnabled} />
            )}
            {activeMainTab === "dsn" && <DsnPanel />}
            {activeMainTab === "media" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {blogRssUrl && <BlogFeed rssUrl={blogRssUrl} />}
                {imageQuery && <ImageFeed query={imageQuery} />}
                <EpicEarth />
                <ApodPanel />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Column 2: Right panel (xl+ only) — operational data ── */}
      <div className="hidden xl:block border-l border-space-border/30 overflow-y-auto p-2 bg-space-surface/20">
        <div className="space-y-2">
          <DistanceContainer />
          <SpaceWeatherPanel enabled={weatherEnabled} />
          <DsnPanel />
        </div>
      </div>
    </div>
  );
}
