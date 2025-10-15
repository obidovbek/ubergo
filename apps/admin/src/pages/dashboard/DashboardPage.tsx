/**
 * Dashboard Page
 * Main dashboard overview
 */

import { useAuth } from '../../hooks/useAuth';
import './DashboardPage.css';

export const DashboardPage = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Users', value: '1,234', change: '+12%', trend: 'up' },
    { label: 'Active Rides', value: '56', change: '+5%', trend: 'up' },
    { label: 'Total Drivers', value: '432', change: '-2%', trend: 'down' },
    { label: 'Revenue', value: '$12,345', change: '+18%', trend: 'up' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's what's happening with your platform today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className={`stat-change ${stat.trend}`}>
              {stat.change} from last month
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <p>Recent rides and user activities will appear here.</p>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">Add User</button>
            <button className="action-btn">View Reports</button>
            <button className="action-btn">Manage Drivers</button>
          </div>
        </div>
      </div>
    </div>
  );
};

