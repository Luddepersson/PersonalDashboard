"use client";

import GlassCard from "./GlassCard";

const M365_APPS = [
  { name: "Word", url: "https://www.office.com/launch/word", color: "#2B579A", icon: "W" },
  { name: "Excel", url: "https://www.office.com/launch/excel", color: "#217346", icon: "X" },
  { name: "PowerPoint", url: "https://www.office.com/launch/powerpoint", color: "#D24726", icon: "P" },
  { name: "Outlook", url: "https://outlook.office.com", color: "#0078D4", icon: "O" },
  { name: "Teams", url: "https://teams.microsoft.com", color: "#6264A7", icon: "T" },
  { name: "OneDrive", url: "https://onedrive.live.com", color: "#0078D4", icon: "D" },
  { name: "OneNote", url: "https://www.onenote.com", color: "#7719AA", icon: "N" },
  { name: "SharePoint", url: "https://www.office.com/launch/sharepoint", color: "#0B828C", icon: "S" },
];

export default function M365Widget() {
  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider mb-3">Microsoft 365</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2 flex-1 content-start">
        {M365_APPS.map((app) => (
          <a
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-separator/50 transition-all"
          >
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm transition-transform group-hover:scale-110"
              style={{ background: app.color }}
            >
              {app.icon}
            </div>
            <span className="text-[10px] text-fg-tertiary group-hover:text-fg-secondary transition-colors">{app.name}</span>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}
