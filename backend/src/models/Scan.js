const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Scan = sequelize.define(
  'Scan',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tree_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    image_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    altitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    captured_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    young_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    mature_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    overmature_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    total_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    detections: {
      type: DataTypes.JSON,
      allowNull: true,
      // Format: [{ class: 'mature', confidence: 0.91, box: [x, y, w, h] }]
    },
  },
  {
    tableName: 'scans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_scans_tree',
        fields: ['tree_id'],
      },
    ],
  }
);

module.exports = Scan;
