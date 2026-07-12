import { TABS } from "../../lib/constants";

interface SidebarLeftProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SidebarLeft({ activeTab, onTabChange }: SidebarLeftProps) {
  return (
    <aside className="app-sidebar-left">
      {TABS.map(tab => (
        <div
          key={tab.id}
          className={`sidebar-tab ${activeTab === tab.id ? "is-active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <div style={{ fontSize: "20px", marginBottom: "4px" }}>{tab.icon}</div>
          {tab.id}
        </div>
      ))}
    </aside>
  );
}
