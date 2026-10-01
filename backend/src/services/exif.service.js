const exifr = require('exifr');
const fs = require('fs');

/**
 * Extract GPS and timestamp metadata from a drone image file
 * @param {string} filePath Absolute or relative path to image
 * @returns {Promise<{ latitude: number|null, longitude: number|null, altitude: number|null, capturedAt: Date|null, hasGps: boolean }>}
 */
async function extractExifGps(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Parse EXIF, GPS, and XMP metadata (crucial for DJI, Autel, and standard drones)
    const exifData = await exifr.parse(filePath, {
      gps: true,
      xmp: true,
      exif: true,
      pick: [
        'latitude',
        'longitude',
        'GPSLatitude',
        'GPSLongitude',
        'GPSAltitude',
        'RelativeAltitude',
        'AbsoluteAltitude',
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
      ],
    });

    if (!exifData) {
      return {
        latitude: null,
        longitude: null,
        altitude: null,
        capturedAt: null,
        hasGps: false,
      };
    }

    const latitude = exifData.latitude ?? null;
    const longitude = exifData.longitude ?? null;
    const altitude =
      exifData.RelativeAltitude ??
      exifData.AbsoluteAltitude ??
      exifData.GPSAltitude ??
      null;

    const capturedAt =
      exifData.DateTimeOriginal ||
      exifData.CreateDate ||
      exifData.ModifyDate ||
      new Date();

    const hasGps = latitude !== null && longitude !== null;

    return {
      latitude: hasGps ? parseFloat(latitude) : null,
      longitude: hasGps ? parseFloat(longitude) : null,
      altitude: altitude !== null ? parseFloat(altitude) : null,
      capturedAt: capturedAt ? new Date(capturedAt) : null,
      hasGps,
    };
  } catch (error) {
    console.warn(`[EXIF Service] Could not parse EXIF for ${filePath}:`, error.message);
    return {
      latitude: null,
      longitude: null,
      altitude: null,
      capturedAt: null,
      hasGps: false,
    };
  }
}

module.exports = {
  extractExifGps,
};
