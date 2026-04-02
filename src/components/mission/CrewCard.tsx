import type { CrewMember } from "@/data/targets/types";

interface CrewCardProps {
  crew: CrewMember[];
  spacecraftName: string;
}

export function CrewCard({ crew, spacecraftName }: CrewCardProps) {
  if (crew.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-heading uppercase tracking-widest text-text-muted">
        Crew — {spacecraftName}
      </div>
      <div className="space-y-1.5">
        {crew.map((member) => (
          <div
            key={member.name}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-text-primary font-medium">{member.name}</span>
            <span className="text-text-muted font-mono text-[10px]">
              {member.role} · {member.agency}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
