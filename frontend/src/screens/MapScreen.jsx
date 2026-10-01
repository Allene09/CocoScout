import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Layers, RefreshCw, Filter, Sparkles, AlertCircle, Compass } from 'lucide-react';
import client from '../api/client';
import TreeMarker from '../components/TreeMarker';
import TreeDetailModal from '../components/TreeDetailModal';

// Farm Center
const DEFAULT_CENTER = [13.9317, 121.6172];

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 18, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

export default function MapScreen({ onNavigateToUpload }) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTree, setSelectedTree] = useState(null);
  const [readyOnlyFilter, setReadyOnlyFilter] = useState(false);
  const [mapTileStyle, setMapTileStyle] = useState('satellite'); // 'satellite' | 'streets'

  const fetchTrees = async () => {
    setLoading(true);
    try {
      const res = await client.get('/trees');
      setTrees(res.data.trees || []);
    } catch (err) {
      console.error('Failed to load trees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  const filteredTrees = readyOnlyFilter
    ? trees.filter((t) => t.ready_for_harvest)
    : trees;

  const harvestReadyCount = trees.filter((t) => t.ready_for_harvest).length;
  const firstTreeCoord = trees.length > 0 ? [trees[0].latitude, trees[0].longitude] : DEFAULT_CENTER;

  return (
    <div className="map-screen-layout">
      {/* Map Canvas */}
      <div className="map-container-root">
        <MapContainer
          center={firstTreeCoord}
          zoom={18}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#070d14' }}
        >
          {mapTileStyle === 'satellite' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> Aerial Satellite'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {selectedTree && (
            <MapFlyTo center={[selectedTree.latitude, selectedTree.longitude]} />
          )}

          {filteredTrees.map((tree) => (
            <TreeMarker
              key={tree.id}
              tree={tree}
              isSelected={selectedTree?.id === tree.id}
              onClick={(t) => setSelectedTree(t)}
            />
          ))}
        </MapContainer>

        {/* Top Control Bar Over Map */}
        <div
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            zIndex: 1000,
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'center',
          }}
        >
          <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setMapTileStyle('satellite')}
              style={{
                background: mapTileStyle === 'satellite' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                border: `1px solid ${mapTileStyle === 'satellite' ? '#06b6d4' : 'transparent'}`,
                color: mapTileStyle === 'satellite' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Satellite Aerial
            </button>
            <button
              onClick={() => setMapTileStyle('streets')}
              style={{
                background: mapTileStyle === 'streets' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                border: `1px solid ${mapTileStyle === 'streets' ? '#06b6d4' : 'transparent'}`,
                color: mapTileStyle === 'streets' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Topography
            </button>
          </div>

          <button
            onClick={() => setReadyOnlyFilter(!readyOnlyFilter)}
            className="glass-panel"
            style={{
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: readyOnlyFilter ? '#f43f5e' : 'var(--text-main)',
              border: readyOnlyFilter ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <Filter size={14} />
            {readyOnlyFilter ? 'Harvest Ready Only' : 'Show All Trees'}
          </button>

          <button
            onClick={fetchTrees}
            className="glass-panel"
            style={{
              padding: '7px 10px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Refresh map pins"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Legend Dock at bottom left */}
        <div className="map-legend-dock glass-panel">
          <div className="legend-item">
            <div className="legend-dot ready" />
            <span>Ready to Harvest ({harvestReadyCount})</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot partly" />
            <span>Maturing Growth</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot not-ready" />
            <span>Young / Developing</span>
          </div>
        </div>

        {/* Selected Tree Floating Panel at top right */}
        {selectedTree && (
          <div className="map-overlay-sidebar glass-panel animate-fade-in" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
                  {selectedTree.label || `Tree #${selectedTree.id}`}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: selectedTree.ready_for_harvest ? '#fb7185' : '#4ade80',
                  }}
                >
                  {selectedTree.ready_for_harvest ? '★ Priority Harvest' : 'Normal Growth'}
                </span>
              </div>
              <button
                onClick={() => setSelectedTree(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', margin: '0.85rem 0' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mature</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{selectedTree.mature_count}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Young</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>{selectedTree.young_count}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dry/Over</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{selectedTree.overmature_count}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
              <div>• <strong>GPS:</strong> {Number(selectedTree.latitude).toFixed(6)}, {Number(selectedTree.longitude).toFixed(6)}</div>
              <div>• <strong>Last Scanned:</strong> {selectedTree.last_scanned_at ? new Date(selectedTree.last_scanned_at).toLocaleDateString() : 'Initial survey'}</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedTree({ ...selectedTree, openFullModal: true })}
                className="btn-primary"
                style={{ flex: 1, padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}
              >
                Inspect Drone AI Scan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Modal View when requested */}
      {selectedTree?.openFullModal && (
        <TreeDetailModal
          treeId={selectedTree.id}
          onClose={() => setSelectedTree({ ...selectedTree, openFullModal: false })}
          onUpdated={fetchTrees}
        />
      )}
    </div>
  );
}
