import { NavLink } from "react-router-dom";

export type SidebarItem = {
  label: string;
  to: string;
  icon: string;
};

type SidebarProps = {
  items: SidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
};

const Sidebar = ({ items, collapsed, onToggle }: SidebarProps) => {
  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">CH</div>
        {!collapsed && (
          <div>
            <div className="sidebar__title">Control de Usuarios</div>
            <div className="sidebar__subtitle">Hospitalaria GovTech</div>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "sidebar__link active" : "sidebar__link"
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar__toggle" onClick={onToggle}>
        {collapsed ? ">" : "<"}
      </button>
    </aside>
  );
};

export default Sidebar;

