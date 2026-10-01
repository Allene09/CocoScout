import React, { useState, useEffect } from 'react';
import { Map, UploadCloud, BarChart3, CheckSquare, User, LogOut, Shield } from 'lucide-react';
import client from './api/client';
import MapScreen from './screens/MapScreen';
import UploadScreen from './screens/UploadScreen';
import InventoryScreen from './screens/InventoryScreen';
import HarvestListScreen from './screens/HarvestListScreen';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'upload' | 'inventory' | 'harvest'
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [harvestReadyCount, setHarvestReadyCount] = useState(0);

  // Check saved login session and fetch harvest count badge
  useEffect(() => {
    const savedUser = localStorage.getItem('cocoscout_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('cocoscout_user');
      }
    }

    refreshHarvestBadge();
  }, []);

  const refreshHarvestBadge = async () => {
    try {
      const res = await client.get('/inventory/harvest-ready');
      setHarvestReadyCount(res.data.count || 0);
    } catch (e) {
      // Ignore initial unauth or offline badge
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cocoscout_token');
    localStorage.removeItem('cocoscout_user');
    setUser(null);
  };

  return (
    <div className="app-container">
      {/* Top Application Navbar */}
      <header className="app-navbar">
        <div className="brand-wrapper" onClick={() => setActiveTab('map')}>
          <div className="brand-icon-box">🥥</div>
          <div>
            <div className="brand-title">CocoScout</div>
            <div className="brand-tagline">Drone Coconut Maturity & Precision Farm Mapping</div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('map');
              refreshHarvestBadge();
            }}
          >
            <Map size={17} /> Farm Map
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadCloud size={17} /> Drone Upload
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('inventory');
              refreshHarvestBadge();
            }}
          >
            <BarChart3 size={17} /> Inventory
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'harvest' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('harvest');
              refreshHarvestBadge();
            }}
          >
            <CheckSquare size={17} /> Harvest List
            {harvestReadyCount > 0 && <span className="nav-badge">{harvestReadyCount}</span>}
          </button>
        </nav>

        {/* Right Header Actions: User Profile & Auth */}
        <div className="header-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-badge">
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{user.name}</span>
                <span className="user-role-tag">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '0.45rem', borderRadius: '8px' }}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="btn-primary"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
            >
              <User size={16} /> Portal Login
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="main-viewport">
        {activeTab === 'map' && (
          <MapScreen onNavigateToUpload={() => setActiveTab('upload')} />
        )}
        {activeTab === 'upload' && (
          <UploadScreen
            onNavigateToMap={() => {
              setActiveTab('map');
              refreshHarvestBadge();
            }}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryScreen
            onNavigateToMap={() => setActiveTab('map')}
            onNavigateToHarvest={() => setActiveTab('harvest')}
          />
        )}
        {activeTab === 'harvest' && (
          <HarvestListScreen onNavigateToMap={() => setActiveTab('map')} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          refreshHarvestBadge();
        }}
      />
    </div>
  );
}
