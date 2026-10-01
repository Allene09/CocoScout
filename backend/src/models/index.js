const sequelize = require('../config/db');
const User = require('./User');
const Tree = require('./Tree');
const Scan = require('./Scan');

// Model associations
Tree.hasMany(Scan, { foreignKey: 'tree_id', as: 'scans', onDelete: 'CASCADE' });
Scan.belongsTo(Tree, { foreignKey: 'tree_id', as: 'tree' });

User.hasMany(Scan, { foreignKey: 'user_id', as: 'scans', onDelete: 'SET NULL' });
Scan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Tree,
  Scan,
};
