const { Tree, Scan } = require('../models');

/**
 * Get all trees for map display and inventory listing
 */
async function getAllTrees(req, res, next) {
  try {
    const { readyOnly } = req.query;

    const filter = {};
    if (readyOnly === 'true') {
      filter.ready_for_harvest = true;
    }

    const trees = await Tree.findAll({
      where: filter,
      order: [['id', 'ASC']],
    });

    return res.json({
      count: trees.length,
      trees,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single tree details along with historical scans
 */
async function getTreeById(req, res, next) {
  try {
    const { id } = req.params;

    const tree = await Tree.findByPk(id, {
      include: [
        {
          model: Scan,
          as: 'scans',
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' });
    }

    return res.json({ tree });
  } catch (error) {
    next(error);
  }
}

/**
 * Update tree manual details (e.g. custom label or notes)
 */
async function updateTree(req, res, next) {
  try {
    const { id } = req.params;
    const { label, ready_for_harvest } = req.body;

    const tree = await Tree.findByPk(id);
    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' });
    }

    if (label !== undefined) tree.label = label;
    if (ready_for_harvest !== undefined) tree.ready_for_harvest = Boolean(ready_for_harvest);

    await tree.save();

    return res.json({ message: 'Tree updated successfully', tree });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTrees,
  getTreeById,
  updateTree,
};
