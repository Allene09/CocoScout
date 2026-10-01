const path = require('path');
const { Scan, Tree, User } = require('../models');
const { extractExifGps } = require('../services/exif.service');
const { runInference } = require('../services/inference.service');
const { matchOrCreateTree } = require('../services/treeMatch.service');

// Default farm reference coordinates (e.g. Quezon Province / Davao coconut farm)
const DEFAULT_FARM_LAT = 13.9317;
const DEFAULT_FARM_LNG = 121.6172;

/**
 * Upload single or multiple drone photos, run AI detection, match trees, update inventory
 */
async function processUpload(req, res, next) {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No drone photos were uploaded.' });
    }

    const userId = req.user ? req.user.id : null;
    const manualLat = req.body.latitude ? parseFloat(req.body.latitude) : null;
    const manualLng = req.body.longitude ? parseFloat(req.body.longitude) : null;
    const customRadius = req.body.radius ? parseFloat(req.body.radius) : undefined;

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = file.path;

      // 1. Extract GPS from EXIF
      const exif = await extractExifGps(filePath);

      let latitude = exif.latitude;
      let longitude = exif.longitude;
      let altitude = exif.altitude;
      let capturedAt = exif.capturedAt || new Date();
      let gpsSource = 'exif';

      if (!latitude || !longitude) {
        if (manualLat && manualLng) {
          latitude = manualLat;
          longitude = manualLng;
          gpsSource = 'manual_input';
        } else {
          // Provide realistic cluster offset around default farm for demo/testing without GPS
          const offsetLat = (Math.random() - 0.5) * 0.001; // ~50m
          const offsetLng = (Math.random() - 0.5) * 0.001;
          latitude = DEFAULT_FARM_LAT + offsetLat;
          longitude = DEFAULT_FARM_LNG + offsetLng;
          altitude = altitude || 15.0; // 15m drone altitude
          gpsSource = 'simulated_fallback';
        }
      }

      // 2. Run AI maturity classification and fruit counting
      const inference = await runInference(filePath);

      // 3. Match scan to existing tree or create new one
      const { tree, isNew, distanceMeters } = await matchOrCreateTree(
        latitude,
        longitude,
        {
          youngCount: inference.youngCount,
          matureCount: inference.matureCount,
          overmatureCount: inference.overmatureCount,
        },
        customRadius
      );

      // 4. Save scan in database
      const relativeImagePath = `/uploads/${path.basename(file.filename)}`;

      const scan = await Scan.create({
        tree_id: tree.id,
        user_id: userId,
        image_path: relativeImagePath,
        latitude,
        longitude,
        altitude,
        captured_at: capturedAt,
        young_count: inference.youngCount,
        mature_count: inference.matureCount,
        overmature_count: inference.overmatureCount,
        total_count: inference.totalCount,
        detections: inference.detections,
      });

      results.push({
        scanId: scan.id,
        filename: file.originalname,
        imagePath: relativeImagePath,
        tree: {
          id: tree.id,
          label: tree.label,
          latitude: tree.latitude,
          longitude: tree.longitude,
          ready_for_harvest: tree.ready_for_harvest,
          isNewTree: isNew,
          distanceFromTreeM: distanceMeters,
        },
        gps: {
          latitude,
          longitude,
          altitude,
          source: gpsSource,
        },
        counts: {
          young: inference.youngCount,
          mature: inference.matureCount,
          overmature: inference.overmatureCount,
          total: inference.totalCount,
        },
        detections: inference.detections,
        isModelTrained: inference.isModelTrained,
      });
    }

    return res.status(201).json({
      message: `Successfully processed ${results.length} drone photo(s)`,
      scans: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get scan details by ID
 */
async function getScanById(req, res, next) {
  try {
    const { id } = req.params;

    const scan = await Scan.findByPk(id, {
      include: [
        { model: Tree, as: 'tree' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    return res.json({ scan });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  processUpload,
  getScanById,
};
