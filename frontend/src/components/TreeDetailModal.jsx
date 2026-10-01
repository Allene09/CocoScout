import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, CheckCircle, AlertTriangle, Layers, Eye } from 'lucide-react';
import client from '../api/client';
import DetectionOverlay from './DetectionOverlay';

export default function TreeDetailModal({ treeId, onClose, onUpdated }) {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!treeId) return;

    let mounted = true;
    setLoading(true);

    client
      .get(`/trees/${treeId}`)
      .then((res) => {
        if (mounted) {
          setTreeData(res.data.tree);
          if (res.data.tree.scans && res.data.tree.scans.length > 0) {
            setSelectedScan(res.data.tree.scans[0]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch tree details:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [treeId]);

  if (!treeId) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                {treeData ? treeData.label || `Tree #${treeData.id}` : 'Loading...'}
              </h2>
              {treeData && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    background: treeData.ready_for_harvest ? 'rgba(244, 63, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: treeData.ready_for_harvest ? '#fb7185' : '#4ade80',
                    border: `1px solid ${treeData.ready_for_harvest ? 'rgba(244, 63, 94, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                  }}
                >
                  {treeData.ready_for_harvest ? 'HARVEST READY' : 'GROWING'}
                </span>
              )}
            </div>
            {treeData && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                <MapPin size={14} /> GPS: {Number(treeData.latitude).toFixed(6)}, {Number(treeData.longitude).toFixed(6)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading tree analytics...
          </div>
        ) : treeData ? (
          <div>
            {/* Fruit Count Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, textTransform: 'uppercase' }}>Young Fruits</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{treeData.young_count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Water / Tender</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase' }}>Mature Fruits</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{treeData.mature_count}</div>
                <div style={{ fontSize: '0.7rem', color: '#fcd34d' }}>Prime for copra/meat</div>
              </div>
              <div style={{ background: 'rgba(180, 83, 9, 0.15)', border: '1px solid rgba(180, 83, 9, 0.35)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase' }}>Overmature</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{treeData.overmature_count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dry / Seedling</div>
              </div>
            </div>

            {/* Drone Scan Aerial Inspection */}
            {selectedScan ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={16} color="#06b6d4" /> Drone Aerial Inspection with AI Bounding Boxes
                  </span>
                  {/* Class Filter */}
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                    {['all', 'mature', 'young', 'overmature'].map((cls) => (
                      <button
                        key={cls}
                        onClick={() => setActiveFilter(cls)}
                        style={{
                          background: activeFilter === cls ? 'var(--palm-500)' : 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          fontWeight: 600,
                        }}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <DetectionOverlay
                  imageUrl={selectedScan.image_path}
                  detections={selectedScan.detections || []}
                  filterClass={activeFilter}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <span>Altitude: {selectedScan.altitude ? `${selectedScan.altitude}m` : '18.5m AGL'}</span>
                  <span>Captured: {new Date(selectedScan.captured_at || selectedScan.created_at).toLocaleString()}</span>
                  <span>Detected Coconuts: {selectedScan.total_count}</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                No aerial scans uploaded yet for this tree.
              </div>
            )}

            {/* Historical Scan Timeline */}
            {treeData.scans && treeData.scans.length > 1 && (
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                  Scan History ({treeData.scans.length} flights)
                </h4>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {treeData.scans.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScan(s)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: selectedScan?.id === s.id ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${selectedScan?.id === s.id ? '#06b6d4' : 'var(--border-subtle)'}`,
                        color: '#f8fafc',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                      }}
                    >
                      Flight #{s.id} • {new Date(s.captured_at || s.created_at).toLocaleDateString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
