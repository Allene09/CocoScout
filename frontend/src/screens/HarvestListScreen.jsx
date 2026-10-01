import React, { useState, useEffect } from 'react';
import { CheckCircle2, MapPin, RefreshCw, Scissors, Award, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import client from '../api/client';
import TreeDetailModal from '../components/TreeDetailModal';

export default function HarvestListScreen({ onNavigateToMap }) {
  const [harvestTrees, setHarvestTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTreeId, setSelectedTreeId] = useState(null);
  const [harvestedIds, setHarvestedIds] = useState(new Set());

  const fetchHarvestReady = async () => {
    setLoading(true);
    try {
      const res = await client.get('/inventory/harvest-ready');
      setHarvestTrees(res.data.trees || []);
    } catch (err) {
      console.error('Failed to load harvest list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvestReady();
  }, []);

  const handleMarkHarvested = async (tree) => {
    try {
      // Mark as harvested: reset mature count or update status
      await client.patch(`/trees/${tree.id}`, {
        ready_for_harvest: false,
      });

      setHarvestedIds((prev) => new Set([...prev, tree.id]));

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#f59e0b'],
      });

      // Refresh list
      fetchHarvestReady();
    } catch (err) {
      console.error('Error marking harvested:', err);
    }
  };

  const totalHarvestableFruits = harvestTrees.reduce((acc, t) => acc + t.mature_count, 0);
  // Estimate ~1.2kg per mature coconut for copra / oil
  const estimatedBiomassKg = (totalHarvestableFruits * 1.2).toFixed(0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
              FIELD HARVEST DIRECTIVE
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
            Trees Ready for Harvest
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Auto-prioritized queue detected by drone AI. Workers harvest only flagged palms without unnecessary climbing.
          </p>
        </div>

        <button onClick={fetchHarvestReady} className="btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Yield Projection Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
          borderLeft: '4px solid #f43f5e',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Target Trees
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-display)' }}>
            {harvestTrees.length} Palms
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for immediate cutting</div>
        </div>

        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Prime Mature Fruits
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-display)' }}>
            {totalHarvestableFruits} Coconuts
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classified with ≥85% AI confidence</div>
        </div>

        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Estimated Harvest Yield
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-display)' }}>
            ~{estimatedBiomassKg} kg
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated gross fruit weight</div>
        </div>
      </div>

      {/* Trees List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {harvestTrees.map((tree, idx) => (
          <div
            key={tree.id}
            className="glass-panel"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  color: '#f43f5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-display)',
                }}
              >
                #{idx + 1}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                    {tree.label || `Tree #${tree.id}`}
                  </h4>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 7px', borderRadius: '6px', fontWeight: 600 }}>
                    {tree.mature_count} Mature Ready
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={12} /> {Number(tree.latitude).toFixed(6)}, {Number(tree.longitude).toFixed(6)}
                  </span>
                  <span>•</span>
                  <span>Young fruits on tree: {tree.young_count}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSelectedTreeId(tree.id)}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
              >
                Inspect Drone Image
              </button>

              <button
                onClick={() => handleMarkHarvested(tree)}
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              >
                <Scissors size={15} /> Complete Harvest
              </button>
            </div>
          </div>
        ))}

        {harvestTrees.length === 0 && !loading && (
          <div
            className="glass-panel"
            style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌴✨</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              All Harvests Up to Date!
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem', color: 'var(--text-muted)' }}>
              No surveyed trees currently meet the mature threshold. Upload fresh drone canopy photos after your next scouting flight.
            </p>
          </div>
        )}
      </div>

      {selectedTreeId && (
        <TreeDetailModal
          treeId={selectedTreeId}
          onClose={() => setSelectedTreeId(null)}
          onUpdated={fetchHarvestReady}
        />
      )}
    </div>
  );
}
