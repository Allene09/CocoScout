const { Tree, Scan } = require('../models');

/**
 * Get farm-wide inventory totals and statistics
 */
async function getInventorySummary(req, res, next) {
  try {
    const trees = await Tree.findAll();

    let totalTrees = trees.length;
    let readyTrees = 0;
    let notReadyTrees = 0;
    let totalYoung = 0;
    let totalMature = 0;
    let totalOvermature = 0;

    trees.forEach((t) => {
      totalYoung += t.young_count;
      totalMature += t.mature_count;
      totalOvermature += t.overmature_count;

      if (t.ready_for_harvest) {
        readyTrees++;
      } else {
        notReadyTrees++;
      }
    });

    const totalFruits = totalYoung + totalMature + totalOvermature;
    const totalScans = await Scan.count();

    return res.json({
      summary: {
        totalTrees,
        readyTrees,
        notReadyTrees,
        totalScans,
        counts: {
          young: totalYoung,
          mature: totalMature,
          overmature: totalOvermature,
          total: totalFruits,
        },
        percentages: {
          mature: totalFruits > 0 ? ((totalMature / totalFruits) * 100).toFixed(1) : 0,
          young: totalFruits > 0 ? ((totalYoung / totalFruits) * 100).toFixed(1) : 0,
          overmature: totalFruits > 0 ? ((totalOvermature / totalFruits) * 100).toFixed(1) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get prioritized harvest-ready tree list
 */
async function getHarvestReadyTrees(req, res, next) {
  try {
    const trees = await Tree.findAll({
      where: {
        ready_for_harvest: true,
      },
      order: [['mature_count', 'DESC']],
    });

    return res.json({
      count: trees.length,
      trees,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInventorySummary,
  getHarvestReadyTrees,
};
