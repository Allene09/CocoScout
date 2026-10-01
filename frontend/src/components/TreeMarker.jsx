import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

/**
 * Custom Leaflet Tree Pin with harvest readiness color and pulse effect
 */
export default function TreeMarker({ tree, isSelected, onClick }) {
  const getReadinessClass = () => {
    if (tree.ready_for_harvest) return 'ready';
    if (tree.mature_count > 0) return 'partly';
    return 'not-ready';
  };

  const readiness = getReadinessClass();
  const iconEmoji = readiness === 'ready' ? '🥥' : '🌴';

  const customIcon = L.divIcon({
    className: 'custom-tree-pin',
    html: `
      <div class="tree-pin-pulse ${readiness} ${isSelected ? 'selected' : ''}" style="${
      isSelected ? 'outline: 3px solid #38bdf8; outline-offset: 3px; transform: scale(1.25);' : ''
    }">
        <span style="font-size: 14px;">${iconEmoji}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

  return (
    <Marker
      position={[tree.latitude, tree.longitude]}
      icon={customIcon}
      eventHandlers={{
        click: () => onClick(tree),
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
        <div style={{ fontFamily: 'Inter, sans-serif', padding: '2px 4px' }}>
          <strong style={{ display: 'block', fontSize: '13px', color: '#f8fafc' }}>
            {tree.label || `Tree #${tree.id}`}
          </strong>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color:
                readiness === 'ready'
                  ? '#fb7185'
                  : readiness === 'partly'
                  ? '#fbbf24'
                  : '#4ade80',
            }}
          >
            {readiness === 'ready'
              ? '● Ready to Harvest'
              : readiness === 'partly'
              ? '● Maturing'
              : '● Young Growth'}
          </span>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
            Mature: {tree.mature_count} | Young: {tree.young_count}
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}
