import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Cpu, MapPin, Compass, ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import exifr from 'exifr';
import confetti from 'canvas-confetti';
import client from '../api/client';
import DetectionOverlay from '../components/DetectionOverlay';

export default function UploadScreen({ onNavigateToMap }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const fileInputRef = useRef(null);

  // Handle file selection and read local EXIF GPS client-side for instant preview
  const handleFiles = async (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setSelectedFiles(fileList);
    setResults(null);

    const newPreviews = [];
    for (const file of fileList) {
      const objUrl = URL.createObjectURL(file);
      let exifGps = null;
      try {
        const parsed = await exifr.parse(file, { gps: true });
        if (parsed && parsed.latitude && parsed.longitude) {
          exifGps = {
            lat: parsed.latitude,
            lng: parsed.longitude,
            alt: parsed.GPSAltitude || parsed.RelativeAltitude || null,
          };
        }
      } catch (e) {
        console.warn('Local EXIF preview skipped:', e);
      }

      newPreviews.push({
        file,
        url: objUrl,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        gps: exifGps,
      });
    }
    setPreviews(newPreviews);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Upload to Node.js backend
  const handleProcessUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      const res = await client.post('/scans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(res.data.scans);
      setActiveResultIndex(0);

      // Trigger celebratory confetti if any tree was ready for harvest!
      const hasHarvestReady = res.data.scans.some((s) => s.tree?.ready_for_harvest);
      if (hasHarvestReady) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#f59e0b', '#10b981'],
        });
      }
    } catch (err) {
      console.error('Scan processing failed:', err);
      alert(err.response?.data?.error || 'Failed to process drone photos.');
    } finally {
      setIsUploading(false);
    }
  };

  // Quick test with sample drone photo
  const handleLoadSampleDronePhoto = async () => {
    try {
      setIsUploading(true);
      const res = await fetch('/uploads/sample-canopy-drone.jpg');
      const blob = await res.blob();
      const file = new File([blob], 'dji-canopy-lucena-grove.jpg', { type: 'image/jpeg' });
      await handleFiles([file]);
      setIsUploading(false);
    } catch (e) {
      console.error(e);
      setIsUploading(false);
    }
  };

  const currentResult = results ? results[activeResultIndex] : null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Flight Level Integration Notice Banner */}
      <div className="flight-mission-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
              Level 1 Drone Integration: Direct Aerial EXIF Processing
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Works with standard DJI Fly, Autel, and GPS-tagged aerial photos. EXIF latitude, longitude & altitude are read automatically.
            </div>
          </div>
        </div>

        <button
          onClick={handleLoadSampleDronePhoto}
          className="btn-secondary"
          style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
        >
          <Sparkles size={14} color="#f59e0b" /> Load Demo Drone Photo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: results ? '1fr 1.3fr' : '1fr', gap: '2rem' }}>
        {/* Left Column: Upload Area */}
        <div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(52, 211, 153, 0.4)',
              borderRadius: '20px',
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'rgba(14, 23, 36, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <UploadCloud size={32} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Choose or Drag Drone Photos Here
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 1.2rem' }}>
              Upload single canopy captures or batch surveys from SD card. The system extracts GPS and runs maturity detection.
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Supports JPG, JPEG, PNG, TIFF, DNG • Up to 25 MB per photo
            </span>
          </div>

          {/* Selected File Previews */}
          {previews.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Selected Files ({previews.length})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Ready for AI inference
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {previews.map((item, idx) => (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={item.url}
                        alt="thumb"
                        style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                          <span>{item.size}</span>
                          {item.gps ? (
                            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={11} /> GPS Tagged
                            </span>
                          ) : (
                            <span style={{ color: '#f59e0b' }}>Default GPS applied</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleProcessUpload}
                disabled={isUploading}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem' }}
              >
                {isUploading ? (
                  <>
                    <Cpu size={18} className="animate-spin" /> Processing AI Maturity & Counting...
                  </>
                ) : (
                  <>
                    <Cpu size={18} /> Run AI Maturity Detection & Update Inventory
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: AI Detection & Tree Matching Results */}
        {currentResult && (
          <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Detection Completed
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
                  {currentResult.tree.label}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {currentResult.tree.isNewTree
                    ? '✨ New tree registered on farm map'
                    : `Matched to existing palm tree (${currentResult.tree.distanceFromTreeM?.toFixed(1) || 0}m from coordinates)`}
                </p>
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: currentResult.tree.ready_for_harvest ? 'rgba(244, 63, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: currentResult.tree.ready_for_harvest ? '#fb7185' : '#4ade80',
                  border: `1px solid ${currentResult.tree.ready_for_harvest ? 'rgba(244, 63, 94, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                }}
              >
                {currentResult.tree.ready_for_harvest ? 'READY FOR HARVEST' : 'NOT READY'}
              </span>
            </div>

            {/* Counts Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{currentResult.counts.total}</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Mature</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{currentResult.counts.mature}</div>
              </div>
              <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#4ade80' }}>Young</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#22c55e' }}>{currentResult.counts.young}</div>
              </div>
              <div style={{ background: 'rgba(180, 83, 9, 0.12)', border: '1px solid rgba(180, 83, 9, 0.25)', padding: '8px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Overmature</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706' }}>{currentResult.counts.overmature}</div>
              </div>
            </div>

            {/* Drone Visualizer with AI Bounding Boxes */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Coconut Canopy Detections
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['all', 'mature', 'young', 'overmature'].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setActiveFilter(cls)}
                      style={{
                        background: activeFilter === cls ? 'var(--palm-500)' : 'rgba(255, 255, 255, 0.06)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <DetectionOverlay
                imageUrl={currentResult.imagePath}
                detections={currentResult.detections}
                filterClass={activeFilter}
              />
            </div>

            {/* GPS Metadata */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              <div>📍 <strong>Coordinates:</strong> {Number(currentResult.gps.latitude).toFixed(6)}, {Number(currentResult.gps.longitude).toFixed(6)}</div>
              <div>✈️ <strong>Drone Altitude:</strong> {currentResult.gps.altitude ? `${currentResult.gps.altitude}m` : '18.5m AGL'}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => onNavigateToMap()}
                className="btn-primary"
                style={{ flex: 1, padding: '0.7rem 1rem' }}
              >
                <MapPin size={16} /> View Pin on Farm Map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
