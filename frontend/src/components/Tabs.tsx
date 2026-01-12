import { ReactNode } from "react";

type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
};

const Tabs = ({ tabs, activeId, onChange }: TabsProps) => {
  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeId ? "tab active" : "tab"}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs__panel">
        {tabs.find((tab) => tab.id === activeId)?.content}
      </div>
    </div>
  );
};

export default Tabs;

