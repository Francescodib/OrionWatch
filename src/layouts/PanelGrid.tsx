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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile-only telemetry (hidden on desktop where sidebar shows it) */}
      <div className="lg:hidden shrink-0 p-3 border-b border-space-border/30">
        <TelemetryContainer />
      </div>

      {/* 3D Scene — fills available vertical space, generous min height */}
      <div className="flex-1 min-h-[350px]">
        <SceneContainer />
      </div>

      {/* Playback Timeline — scrubber for mission replay */}
      <div className="shrink-0">
        <PlaybackTimeline />
      </div>

      {/* Mission Timeline — compact strip */}
      {hasMilestones && (
        <div className="shrink-0 px-4 py-2 border-t border-space-border/30 bg-space-surface/30">
          <div className="flex items-center gap-2 mb-1">
            <Flag size={10} className="text-text-muted/50" />
            <span className="text-[8px] font-heading uppercase tracking-[0.15em] text-text-muted/60">Mission Progress</span>
          </div>
          <MilestoneTimeline milestones={activeTarget.milestones} />
        </div>
      )}

      {/* Tabbed secondary content */}
      <div className="shrink-0 border-t border-space-border/30">
        <TabBar tabs={tabs} activeTab={activeMainTab} onTabChange={setActiveMainTab} />
        <div className="h-[200px] lg:h-[250px] overflow-y-auto p-3">
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
  );
}
