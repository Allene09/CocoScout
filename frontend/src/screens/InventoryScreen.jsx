import React, { useState, useEffect } from 'react';
import { Trees, CheckCircle2, PieChart, Layers, Search, Filter, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import client from '../api/client';
import StatCard from '../components/StatCard';
import TreeDetailModal from '../components/TreeDetailModal';

export default function InventoryScreen({ onNavigateToMap, onNavigateToHarvest }) {
  const [summary, setSummary] = useState(null);
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ready' | 'growing'
  const [selectedTreeId, setSelectedTreeId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, treeRes] = await Promise.all([
        client.get('/inventory/summary'),
        client.get('/trees'),
      ]);
      setSummary(sumRes.data.summary);
      setTrees(treeRes.data.trees || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      (tree.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      `Tree #${tree.id}`.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ready') return tree.ready_for_harvest;
    if (statusFilter === 'growing') return !tree.ready_for_harvest;
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>
            Farm Inventory & Yield Intelligence
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Comprehensive census of surveyed palms, maturity stages, and harvest potential
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchData} className="btn-secondary" title="Refresh data">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={onNavigateToHarvest} className="btn-primary">
            <CheckCircle2 size={16} /> Harvest Queue
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="stats-overview-grid">
        <StatCard
          label="Surveyed Palm Trees"
          value={summary ? summary.totalTrees : '—'}
          subtext="GPS Tagged & Monitored"
          icon={Trees}
          variant="trees"
        />
        <StatCard
          label="Harvest Ready Trees"
          value={summary ? summary.readyTrees : '—'}
          subtext="≥ 4 Mature Coconuts"
          icon={CheckCircle2}
          variant="ready"
          trend={summary && summary.totalTrees > 0 ? `${Math.round((summary.readyTrees / summary.totalTrees) * 100)}% of farm` : null}
        />
        <StatCard
          label="Mature Coconuts"
          value={summary ? summary.counts.mature : '—'}
          subtext="Ready for commercial harvest"
          icon={PieChart}
          variant="mature"
        />
        <StatCard
          label="Young Coconuts"
          value={summary ? summary.counts.young : '—'}
          subtext="Developing next cycle"
          icon={Layers}
          variant="young"
        />
      </div>

      {/* Fruit Maturity Distribution Bar */}
      {summary && summary.counts.total > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Farm-wide Maturity Distribution
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Total fruit population: <strong>{summary.counts.total} coconuts</strong> across surveyed canopies
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', fontWeight: 600 }}>
              <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                Mature ({summary.percentages.mature}%)
              </span>
              <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                Young ({summary.percentages.young}%)
              </span>
              <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#b45309' }} />
                Overmature ({summary.percentages.overmature}%)
              </span>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div
            style={{
              height: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${summary.percentages.mature}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                transition: 'width 0.5s ease',
              }}
              title={`Mature: ${summary.counts.mature}`}
            />
            <div
              style={{
                width: `${summary.percentages.young}%`,
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                transition: 'width 0.5s ease',
              }}
              title={`Young: ${summary.counts.young}`}
            />
            <div
              style={{
                width: `${summary.percentages.overmature}%`,
                background: 'linear-gradient(90deg, #b45309, #d97706)',
                transition: 'width 0.5s ease',
              }}
              title={`Overmature: ${summary.counts.overmature}`}
            />
          </div>
        </div>
      )}

      {/* Trees Directory & Search/Filter Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tree ID or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem 0.6rem 2.4rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Trees' },
              { id: 'ready', label: 'Harvest Ready' },
              { id: 'growing', label: 'Developing / Young' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === btn.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: statusFilter === btn.id ? 'var(--palm-400)' : 'var(--text-secondary)',
                  border: `1px solid ${statusFilter === btn.id ? 'rgba(52, 211, 153, 0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tree Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Tree Label</th>
                <th style={{ padding: '0.75rem 1rem' }}>GPS Coordinates</th>
                <th style={{ padding: '0.75rem 1rem' }}>Mature Fruits</th>
                <th style={{ padding: '0.75rem 1rem' }}>Young Fruits</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Last Scanned</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrees.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '0.88rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                    {t.label || `Tree #${t.id}`}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {Number(t.latitude).toFixed(5)}, {Number(t.longitude).toFixed(5)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>{t.mature_count}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>{t.young_count}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: t.ready_for_harvest ? 'rgba(244, 63, 94, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: t.ready_for_harvest ? '#fb7185' : '#4ade80',
                        border: `1px solid ${t.ready_for_harvest ? 'rgba(244, 63, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                      }}
                    >
                      {t.ready_for_harvest ? '● HARVEST READY' : '● GROWING'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {t.last_scanned_at ? new Date(t.last_scanned_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedTreeId(t.id)}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                    >
                      View Scan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTrees.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No trees matching filter criteria.
            </div>
          )}
        </div>
      </div>

      {selectedTreeId && (
        <TreeDetailModal
          treeId={selectedTreeId}
          onClose={() => setSelectedTreeId(null)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
}
