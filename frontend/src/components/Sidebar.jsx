import { NavLink } from "react-router-dom";
import { FileText, Users, Clock, Plus } from "lucide-react";

import "./Sidebar.css";

function Sidebar({ onCreate }) {
  const menuItems = [
    {
      name: "My Documents",
      path: "/",
      icon: FileText,
    },
    {
      name: "Shared With Me",
      path: "/shared",
      icon: Users,
    },
    {
      name: "Recent",
      path: "/recent",
      icon: Clock,
    },
  ];

  return (
    <aside className="workspace-sidebar">
      <button className="sidebar-create-btn" onClick={onCreate}>
        <Plus size={19} />
        Create Document
      </button>

      <p className="sidebar-section-label">Workspace</p>

      <nav className="sidebar-navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-workspace-info">
        <h3>Your Workspace</h3>
        <p>
          Organize your ideas and collaborate with your team.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;