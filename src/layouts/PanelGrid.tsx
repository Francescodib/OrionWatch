import { useState, useEffect, useCallback } from "react";
import { useTargetStore } from "@/store/useTargetStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { TelemetryContainer } from "@/components/telemetry/TelemetryContainer";
import { OrbitalElements } from "@/components/telemetry/OrbitalElements";
import { GroundTrack } from "@/components/telemetry/GroundTrack";
import { SpeedComparison } from "@/components/telemetry/SpeedComparison";
import { CrewCard } from "@/components/mission/CrewCard";
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
import { AccordionSection } from "@/components/ui/AccordionSection";
import { Panel } from "@/components/ui/Panel";
import { Sun, Radio, LineChart, Newspaper, Flag, Activity, Radar, Orbit, MapPin, Gauge, Users } from "lucide-react";

export function PanelGrid() {
  const { activeTarget } = useTargetStore();
  const { activeMainTab, setActiveMainTab } = useDashboardStore();

  const telemetryState = useTelemetryStore((s) => s.state);

  const imageQuery = activeTarget.imageQuery ?? "";
  const blogRssUrl = activeTarget.blogRssUrl ?? "";
  const hasMilestones = activeTarget.milestones.length > 0;
  const hasMedia = !!(imageQuery || blogRssUrl);
  const hasCrew = activeTarget.spacecraft.crew.length > 0;
  const weatherEnabled = activeTarget.spaceWeather.enabled;

  // Reset tab on target switch
  useEffect(() => {
    setActiveMainTab("profile");
  }, [activeTarget.id, setActiveMainTab]);

  // Mobile accordion state — telemetry open by default
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(["telemetry"])
  );

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const tabs: Tab[] = [
    { id: "profile", label: "Mission Profile", icon: <LineChart size={11} /> },
    { id: "weather", label: "Space Weather", icon: <Sun size={11} /> },
    { id: "dsn", label: "DSN", icon: <Radio size={11} /> },
    ...(hasMedia
      ? [{ id: "media", label: "Media", icon: <Newspaper size={11} /> }]
      : []),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto sm:overflow-hidden sm:flex sm:flex-col xl:grid xl:grid-cols-[1fr_256px]">
      {/* ── Column 1: Scene + controls ────────────────────── */}
      <div className="flex flex-col sm:min-h-0 sm:flex-1">
        {/* 3D Scene — fixed height on mobile, flex on tablet+ */}
        <div className="h-[38vh] shrink-0 sm:flex-1 sm:h-auto sm:min-h-[350px]">
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
              <span className="text-[8px] font-heading uppercase tracking-[0.15em] text-text-muted/60">
                Mission Progress
              </span>
            </div>
            <MilestoneTimeline milestones={activeTarget.milestones} />
          </div>
        )}

        {/* ── Mobile: Accordion sections (< sm) ────────────── */}
        <div className="sm:hidden">
          {/* Crew */}
          {hasCrew && (
            <AccordionSection
              title="Crew"
              icon={<Users size={12} />}
              open={openSections.has("crew")}
              onToggle={() => toggleSection("crew")}
            >
              <CrewCard
                crew={activeTarget.spacecraft.crew}
                spacecraftName={activeTarget.spacecraft.name}
              />
            </AccordionSection>
          )}

          {/* Telemetry */}
          <AccordionSection
            title="Telemetry"
            icon={<Activity size={12} />}
            open={openSections.has("telemetry")}
            onToggle={() => toggleSection("telemetry")}
            badge="LIVE"
          >
            <TelemetryContainer />
            {/* Extra sidebar panels inline */}
            {telemetryState && (
              <div className="space-y-2 mt-2">
                <Panel title="Orbital" icon={<Orbit size={12} />} status="nominal" compact>
                  <OrbitalElements state={telemetryState} />
                </Panel>
                <Panel title="Position" icon={<MapPin size={12} />} status="nominal" compact>
                  <GroundTrack state={telemetryState} />
                </Panel>
                <Panel title="Speed" icon={<Gauge size={12} />} status="nominal" compact>
                  <SpeedComparison speedKmS={telemetryState.speedKmS} />
                </Panel>
              </div>
            )}
          </AccordionSection>

          {/* Mission Profile */}
          <AccordionSection
            title="Mission Profile"
            icon={<LineChart size={12} />}
            open={openSections.has("profile")}
            onToggle={() => toggleSection("profile")}
          >
            <DistanceContainer />
          </AccordionSection>

          {/* Space Weather */}
          {weatherEnabled && (
            <AccordionSection
              title="Space Weather"
              icon={<Sun size={12} />}
              open={openSections.has("weather")}
              onToggle={() => toggleSection("weather")}
            >
              <SpaceWeatherPanel enabled={weatherEnabled} />
            </AccordionSection>
          )}

          {/* DSN */}
          <AccordionSection
            title="Deep Space Network"
            icon={<Radar size={12} />}
            open={openSections.has("dsn")}
            onToggle={() => toggleSection("dsn")}
          >
            <DsnPanel />
          </AccordionSection>

          {/* Media */}
          {hasMedia && (
            <AccordionSection
              title="Media"
              icon={<Newspaper size={12} />}
              open={openSections.has("media")}
              onToggle={() => toggleSection("media")}
            >
              <div className="space-y-3">
                {blogRssUrl && <BlogFeed rssUrl={blogRssUrl} />}
                {imageQuery && <ImageFeed query={imageQuery} />}
                <EpicEarth />
                <ApodPanel />
              </div>
            </AccordionSection>
          )}
        </div>

        {/* ── Tablet/Desktop: Tabbed content (sm – xl) ──────── */}
        <div className="hidden sm:block xl:hidden shrink-0 border-t border-space-border/30">
          <TabBar
            tabs={tabs}
            activeTab={activeMainTab}
            onTabChange={setActiveMainTab}
          />
          <div className="h-[200px] lg:h-[300px] overflow-y-auto p-2 sm:p-3">
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
