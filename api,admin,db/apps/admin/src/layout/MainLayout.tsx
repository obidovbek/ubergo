/**
 * Main Layout
 * Primary layout for authenticated pages - Mantis Design Style
 */

import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  DashboardIcon,
  ClockIcon,
  DocumentIcon,
  BoxIcon,
  ChartIcon,
  SpreadsheetIcon,
  LineChartIcon,
  ChatIcon,
  CalendarIcon,
  KanbanIcon,
  UserIcon,
  ChevronRightIcon,
  MenuIcon,
  BriefcaseIcon,
  SearchIcon,
  GridIcon,
  LayoutIcon,
  BellIcon,
  MaximizeIcon,
  SettingsIcon,
  ChevronDownIcon,
} from '../components/icons';
import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon: ReactNode;
  children?: MenuItem[];
  badge?: string;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <ClockIcon />,
    },
    {
      id: 'default',
      label: 'Default',
      path: '/dashboard',
      icon: <ClockIcon />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/dashboard',
      icon: <ClockIcon />,
    },
    {
      id: 'invoice',
      label: 'Invoice',
      path: '/rides',
      icon: <DocumentIcon />,
    },
    {
      id: 'components',
      label: 'Components',
      icon: <BoxIcon />,
      badge: 'new',
    },
    {
      id: 'statistics',
      label: 'Statistics',
      path: '/dashboard',
      icon: <ChartIcon />,
    },
    {
      id: 'data',
      label: 'Data',
      path: '/dashboard',
      icon: <SpreadsheetIcon />,
    },
    {
      id: 'chart',
      label: 'Chart',
      path: '/dashboard',
      icon: <LineChartIcon />,
    },
    {
      id: 'chat',
      label: 'Chat',
      path: '/dashboard',
      icon: <ChatIcon />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      path: '/dashboard',
      icon: <CalendarIcon />,
    },
    {
      id: 'kanban',
      label: 'Kanban',
      path: '/dashboard',
      icon: <KanbanIcon />,
    },
    {
      id: 'customer',
      label: 'Customer',
      icon: <UserIcon />,
      children: [
        { id: 'customer-list', label: 'List', path: '/users', icon: <UserIcon /> },
        { id: 'customer-details', label: 'Details', path: '/users', icon: <UserIcon /> },
      ],
    },
    {
      id: 'invoice-menu',
      label: 'Invoice',
      icon: <DocumentIcon />,
      children: [
        { id: 'invoice-list', label: 'List', path: '/rides', icon: <DocumentIcon /> },
        { id: 'invoice-preview', label: 'Preview', path: '/rides', icon: <DocumentIcon /> },
      ],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon />,
      children: [
        { id: 'profile-settings', label: 'Settings', path: '/settings', icon: <UserIcon /> },
        { id: 'profile-account', label: 'Account', path: '/settings', icon: <UserIcon /> },
      ],
    },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.path);

    return (
      <div key={item.id}>
        <div
          className={`nav-item ${active ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              navigate(item.path);
            }
          }}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
          {hasChildren && (
            <span className={`nav-arrow ${isExpanded ? 'expanded' : ''}`}>
              <ChevronRightIcon />
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="nav-children">
            {item.children?.map((child) => (
              <div
                key={child.id}
                className={`nav-item nav-child ${isActive(child.path) ? 'active' : ''}`}
                onClick={() => child.path && navigate(child.path)}
              >
                <span className="nav-icon">{child.icon}</span>
                <span className="nav-label">{child.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`main-layout ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">◆</div>
            <span className="logo-text">UbexGo</span>
          </div>
          <div className="sidebar-divider"></div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(renderMenuItem)}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <UserIcon />
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'JWT User'}</div>
              <div className="user-role">UI/UX Designer</div>
            </div>
            <div className="user-arrow">
              <ChevronRightIcon />
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MenuIcon />
            </button>
            <div className="company-selector">
              <BriefcaseIcon />
              <span className="company-name">Acme Corp</span>
              <span className="company-badge">Free</span>
              <ChevronDownIcon />
            </div>
            <div className="search-box">
              <SearchIcon />
              <span className="search-shortcut">Q K</span>
            </div>
          </div>
          <div className="top-bar-right">
            <button className="top-bar-icon">
              <GridIcon />
            </button>
            <button className="top-bar-icon">
              <LayoutIcon />
            </button>
            <button className="top-bar-icon notification-icon">
              <BellIcon />
              <span className="notification-badge">2</span>
            </button>
            <button className="top-bar-icon">
              <ChatIcon />
            </button>
            <button className="top-bar-icon">
              <MaximizeIcon />
            </button>
            <button className="top-bar-icon">
              <SettingsIcon />
            </button>
            <div className="top-bar-avatar">
              <UserIcon />
            </div>
          </div>
        </header>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

