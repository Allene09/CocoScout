const { QueryTypes, Op } = require('sequelize');
const { sequelize, Tree } = require('../models');
const { getBoundingBox, haversineDistanceMeters } = require('../utils/geo');

const DEFAULT_MATCH_RADIUS_M =
  parseFloat(process.env.TREE_MATCH_RADIUS_M) || 5;

/**
 * Match a scan location to the nearest existing tree within radius, or create a new tree
 * @param {number} latitude Scan latitude
 * @param {number} longitude Scan longitude
 * @param {object} counts { youngCount, matureCount, overmatureCount }
 * @param {number} [radiusMeters] Search radius in meters
 * @returns {Promise<{ tree: Tree, isNew: boolean, distanceMeters: number|null }>}
 */
async function matchOrCreateTree(
  latitude,
  longitude,
  counts,
  radiusMeters = DEFAULT_MATCH_RADIUS_M
) {
  const { youngCount = 0, matureCount = 0, overmatureCount = 0 } = counts;
  // A tree is considered ready for harvest if it has at least 4 mature coconuts
  const isReady = matureCount >= 4;

  const isMySQL = sequelize.getDialect() === 'mysql';
  let matchedTree = null;
  let distanceM = null;

  const bbox = getBoundingBox(latitude, longitude, radiusMeters);

  if (isMySQL) {
    try {
      const query = `
        SELECT id, ST_Distance_Sphere(POINT(longitude, latitude), POINT(:lon, :lat)) AS distance_m
        FROM trees
        WHERE latitude BETWEEN :minLat AND :maxLat
          AND longitude BETWEEN :minLon AND :maxLon
        HAVING distance_m <= :radius
        ORDER BY distance_m ASC
        LIMIT 1;
      `;

      const results = await sequelize.query(query, {
        replacements: {
          lon: longitude,
          lat: latitude,
          minLat: bbox.minLat,
          maxLat: bbox.maxLat,
          minLon: bbox.minLon,
          maxLon: bbox.maxLon,
          radius: radiusMeters,
        },
        type: QueryTypes.SELECT,
      });

      if (results && results.length > 0) {
        matchedTree = await Tree.findByPk(results[0].id);
        distanceM = parseFloat(results[0].distance_m);
      }
    } catch (err) {
      console.warn('[TreeMatch] Spatial MySQL query failed, falling back to Haversine:', err.message);
    }
  }

  // Fallback to in-application Haversine if MySQL spatial wasn't used or returned error
  if (!matchedTree) {
    const candidates = await Tree.findAll({
      where: {
        latitude: { [Op.between]: [bbox.minLat, bbox.maxLat] },
        longitude: { [Op.between]: [bbox.minLon, bbox.maxLon] },
      },
    });

    let bestDist = Infinity;
    let closestCandidate = null;

    for (const cand of candidates) {
      const dist = haversineDistanceMeters(
        latitude,
        longitude,
        cand.latitude,
        cand.longitude
      );
      if (dist <= radiusMeters && dist < bestDist) {
        bestDist = dist;
        closestCandidate = cand;
      }
    }

    if (closestCandidate) {
      matchedTree = closestCandidate;
      distanceM = bestDist;
    }
  }

  const now = new Date();

  if (matchedTree) {
    // Found: update that tree's counts and last scanned date
    matchedTree.young_count = youngCount;
    matchedTree.mature_count = matureCount;
    matchedTree.overmature_count = overmatureCount;
    matchedTree.ready_for_harvest = isReady;
    matchedTree.last_scanned_at = now;
    await matchedTree.save();

    return {
      tree: matchedTree,
      isNew: false,
      distanceMeters: distanceM,
    };
  }

  // Not found: generate incremental label and insert a new tree
  const totalTrees = await Tree.count();
  const newLabel = `Tree #${String(totalTrees + 1).padStart(3, '0')}`;

  const newTree = await Tree.create({
    label: newLabel,
    latitude,
    longitude,
    young_count: youngCount,
    mature_count: matureCount,
    overmature_count: overmatureCount,
    ready_for_harvest: isReady,
    last_scanned_at: now,
  });

  return {
    tree: newTree,
    isNew: true,
    distanceMeters: 0,
  };
}

module.exports = {
  matchOrCreateTree,
};
