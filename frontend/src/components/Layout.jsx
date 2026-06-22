import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, activeLocation, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="brand">JRV <span>IMPACT</span></span>
          {activeLocation && <span className="location-pill">{activeLocation.shortCode}</span>}
        </div>
        <div className="topbar-right">
          <span className="mono" style={{ fontSize: '0.78rem', opacity: 0.8 }}>{user?.fullName}</span>
          <button className="icon-btn" onClick={() => navigate('/select-location')}>Switch Location</button>
          <button className="icon-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="navbar">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
        <NavLink to="/master/locations" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Locations</NavLink>
        <NavLink to="/master/companies" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Companies</NavLink>
        <NavLink to="/master/job-titles" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Job Titles</NavLink>
        <NavLink to="/transaction/pre-job-sheets" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Pre Job Sheet</NavLink>
        <NavLink to="/transaction/job-sheets" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Job Sheet</NavLink>
        <NavLink to="/report" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Report</NavLink>
      </div>

      <div className="page">
        <Outlet />
      </div>
    </div>
  );
}
