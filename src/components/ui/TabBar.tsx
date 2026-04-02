import type { ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center border-b border-space-border bg-space-surface/40 px-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-2.5 text-[10px] font-heading uppercase tracking-[0.15em] cursor-pointer
            transition-colors flex items-center gap-1.5 border-b-2
            ${activeTab === tab.id
              ? "text-cyan border-cyan"
              : "text-text-muted hover:text-text-secondary border-transparent"
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
