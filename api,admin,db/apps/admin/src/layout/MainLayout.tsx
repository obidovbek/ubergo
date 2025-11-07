/**
 * Main Layout
 * Primary layout for authenticated pages - Mantis Design Style
 */

import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  UserIcon,
  ChevronRightIcon,
  MenuIcon,
  ChevronDownIcon,
} from '../components/icons';
import { translations } from '../utils/translations';
import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: ReactNode;
  children?: MenuItem[];
  badge?: string;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['users']));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarProfileMenuOpen, setSidebarProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const sidebarProfileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (sidebarProfileMenuRef.current && !sidebarProfileMenuRef.current.contains(event.target as Node)) {
        setSidebarProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen || sidebarProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, sidebarProfileMenuOpen]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isPathActive = (path: string): boolean => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  };

  const isMenuItemActive = (item: MenuItem): boolean => {
    if (item.path && isPathActive(item.path)) {
      return true;
    }
    if (item.children) {
      return item.children.some(isMenuItemActive);
    }
    return false;
  };

  const collectActiveAncestors = (
    items: MenuItem[],
    pathname: string,
    stack: MenuItem[] = []
  ): string[] | null => {
    for (const item of items) {
      const newStack = [...stack, item];
      if (item.path && isPathActive(item.path)) {
        return newStack
          .filter((entry) => entry.children && entry.children.length > 0)
          .map((entry) => entry.id);
      }

      if (item.children) {
        const childResult = collectActiveAncestors(item.children, pathname, newStack);
        if (childResult) {
          return childResult;
        }
      }
    }
    return null;
  };

  const renderMenuItems = (items: MenuItem[], depth = 0): ReactNode => {
    return items.map((item) => {
      const hasChildren = !!item.children && item.children.length > 0;
      const isExpanded = expandedItems.has(item.id);
      const active = isMenuItemActive(item);

      const itemClasses = [
        'nav-item',
        `depth-${depth}`,
        hasChildren ? 'has-children' : '',
        active ? 'active' : '',
      ];

      if (depth > 0) {
        itemClasses.push('nav-child');
      }

      return (
        <div key={item.id}>
          <div
            className={itemClasses.filter(Boolean).join(' ')}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              } else if (item.path) {
                navigate(item.path);
              }
            }}
          >
            <span className="nav-icon">
              {item.icon ?? (depth > 0 ? <span className="nav-dot" /> : null)}
            </span>
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
            {hasChildren && (
              <span className={`nav-arrow ${isExpanded ? 'expanded' : ''}`}>
                <ChevronRightIcon />
              </span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className={`nav-children depth-${depth + 1}`}>
              {renderMenuItems(item.children ?? [], depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const menuItems: MenuItem[] = [
    {
      id: 'users',
      label: 'Foydalanuvchilar',
      icon: <UserIcon />,
      children: [
        {
          id: 'users-admin',
          label: translations.adminUsers.title,
          icon: <UserIcon />,
          children: [
            {
              id: 'users-admin-list',
              label: translations.adminUsers.list,
              path: '/admin-users',
            },
            {
              id: 'users-admin-create',
              label: translations.adminUsers.create,
              path: '/admin-users/create',
            },
          ],
        },
        {
          id: 'users-passengers',
          label: translations.passengers.title,
          icon: <UserIcon />,
          children: [
            {
              id: 'users-passengers-list',
              label: translations.passengers.list,
              path: '/passengers',
            },
          ],
        },
        {
          id: 'users-drivers',
          label: translations.drivers.title,
          icon: <UserIcon />,
          children: [
            {
              id: 'users-drivers-list',
              label: translations.drivers.list,
              path: '/drivers',
            },
          ],
        },
      ],
    },
    {
      id: 'settings',
      label: 'Sozlamalar',
      icon: <UserIcon />,
      children: [
        {
          id: 'settings-countries',
          label: translations.countries.title,
          icon: <UserIcon />,
          children: [
            {
              id: 'settings-countries-list',
              label: translations.countries.list,
              path: '/countries',
            },
            {
              id: 'settings-countries-create',
              label: translations.countries.create,
              path: '/countries/create',
            },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
    const ancestorIds = collectActiveAncestors(menuItems, location.pathname) || [];
    if (ancestorIds.length > 0) {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        ancestorIds.forEach((id) => next.add(id));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
          {renderMenuItems(menuItems)}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile-menu-container" ref={sidebarProfileMenuRef}>
            <div
              className="user-profile"
              onClick={() => setSidebarProfileMenuOpen(!sidebarProfileMenuOpen)}
            >
              <div className="user-avatar">
                <UserIcon />
              </div>
              <div className="user-info">
                <div className="user-name">{user?.full_name || 'Foydalanuvchi'}</div>
                <div className="user-role">
                  {user?.roles && user.roles.length > 0 
                    ? user.roles.map(r => r.name).join(', ')
                    : 'Admin'}
                </div>
              </div>
              <div className={`user-arrow ${sidebarProfileMenuOpen ? 'open' : ''}`}>
                <ChevronDownIcon />
              </div>
            </div>
            {sidebarProfileMenuOpen && (
              <div className="sidebar-profile-menu-dropdown">
                <button
                  className="sidebar-profile-menu-item"
                  onClick={() => {
                    navigate('/profile');
                    setSidebarProfileMenuOpen(false);
                  }}
                >
                  <UserIcon />
                  <span>{translations.common.profile}</span>
                </button>
                <div className="sidebar-profile-menu-divider"></div>
                <button
                  className="sidebar-profile-menu-item logout"
                  onClick={() => {
                    handleLogout();
                    setSidebarProfileMenuOpen(false);
                  }}
                >
                  <span>{translations.common.logout}</span>
                </button>
              </div>
            )}
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
          </div>
          <div className="top-bar-right">
            <div className="profile-menu-container" ref={profileMenuRef}>
              <button
                className="profile-menu-button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="top-bar-avatar">
                  <UserIcon />
                </div>
                <span className="profile-menu-name">{user?.full_name || 'Foydalanuvchi'}</span>
                <ChevronDownIcon className={`profile-menu-arrow ${profileMenuOpen ? 'open' : ''}`} />
              </button>
              {profileMenuOpen && (
                <div className="profile-menu-dropdown">
                  <button
                    className="profile-menu-item"
                    onClick={() => {
                      navigate('/profile');
                      setProfileMenuOpen(false);
                    }}
                  >
                    <UserIcon />
                    <span>{translations.common.profile}</span>
                  </button>
                  <div className="profile-menu-divider"></div>
                  <button
                    className="profile-menu-item logout"
                    onClick={() => {
                      handleLogout();
                      setProfileMenuOpen(false);
                    }}
                  >
                    <span>{translations.common.logout}</span>
                  </button>
                </div>
              )}
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

