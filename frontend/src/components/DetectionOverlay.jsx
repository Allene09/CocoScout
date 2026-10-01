import React, { useRef, useState, useEffect } from 'react';

/**
 * Renders drone image with scaled AI bounding box overlays and confidence tags
 */
export default function DetectionOverlay({
  imageUrl,
  detections = [],
  filterClass = 'all',
  showLabels = true,
  aspectRatio = '4/3',
}) {
  const imgRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [renderedSize, setRenderedSize] = useState({ width: 1, height: 1 });

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = e.target;
    setNaturalSize({ width: naturalWidth || 1920, height: naturalHeight || 1080 });
    setRenderedSize({ width: clientWidth, height: clientHeight });
  };

  useEffect(() => {
    const handleResize = () => {
      if (imgRef.current) {
        setRenderedSize({
          width: imgRef.current.clientWidth,
          height: imgRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scaleX = renderedSize.width / naturalSize.width;
  const scaleY = renderedSize.height / naturalSize.height;

  const filteredDetections = detections.filter((d) => {
    if (filterClass === 'all') return true;
    return d.class === filterClass;
  });

  return (
    <div
      className="drone-preview-container"
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#090e17',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Drone canopy aerial survey"
        onLoad={handleImageLoad}
        className="drone-photo-img"
        style={{ width: '100%', display: 'block', maxHeight: '520px', objectFit: 'contain' }}
      />

      {/* Render AI Bounding Boxes */}
      {filteredDetections.map((det, idx) => {
        const [x, y, w, h] = det.box || [0, 0, 50, 50];
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledW = w * scaleX;
        const scaledH = h * scaleY;

        return (
          <div
            key={idx}
            className={`detection-box ${det.class}`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledW}px`,
              height: `${scaledH}px`,
            }}
          >
            {showLabels && (
              <span className={`detection-tag ${det.class}`}>
                {det.class.toUpperCase()} {Math.round(det.confidence * 100)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
