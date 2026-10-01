const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { sequelize, User, Tree, Scan } = require('../models');
require('dotenv').config();

// Reference coordinates for sample coconut farm (Lucena / Quezon Province coconut belt)
const BASE_LAT = 13.9317;
const BASE_LNG = 121.6172;

async function initDatabase() {
  console.log('[CocoScout DB] Initializing database...');
  const dialect = (process.env.DB_DIALECT || 'sqlite').toLowerCase();

  if (dialect === 'mysql') {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'cocoscout';

    try {
      console.log(`[CocoScout DB] Ensuring MySQL database '${dbName}' exists...`);
      const connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
      });

      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      await connection.end();
      console.log(`[CocoScout DB] MySQL database '${dbName}' is ready.`);
    } catch (err) {
      console.warn(`[CocoScout DB] MySQL auto-create error: ${err.message}`);
    }
  }

  try {
    await sequelize.authenticate();
    console.log(`[CocoScout DB] Authenticated with ${dialect.toUpperCase()} successfully.`);

    await sequelize.sync({ alter: false });
    console.log('[CocoScout DB] Database tables verified/synchronized.');

    // Seed default admin owner if no users exist
    const userCount = await User.count();
    let defaultUser = null;
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('farm1234', 10);
      defaultUser = await User.create({
        name: 'Carlos Mendoza',
        email: 'owner@cocoscout.farm',
        password_hash: passwordHash,
        role: 'owner',
      });
      console.log('[CocoScout DB] Seeded default owner: owner@cocoscout.farm (pw: farm1234)');
    } else {
      defaultUser = await User.findOne();
    }

    // Seed sample coconut trees if empty
    const treeCount = await Tree.count();
    if (treeCount === 0) {
      console.log('[CocoScout DB] Seeding initial farm palm grove...');

      const sampleTreesData = [
        {
          label: 'Tree #001',
          latOffset: 0.00012,
          lngOffset: 0.00015,
          young: 3,
          mature: 8,
          overmature: 2,
          ready: true,
        },
        {
          label: 'Tree #002',
          latOffset: 0.00035,
          lngOffset: 0.00042,
          young: 8,
          mature: 2,
          overmature: 0,
          ready: false,
        },
        {
          label: 'Tree #003',
          latOffset: -0.00021,
          lngOffset: 0.00028,
          young: 4,
          mature: 6,
          overmature: 1,
          ready: true,
        },
        {
          label: 'Tree #004',
          latOffset: -0.00018,
          lngOffset: -0.00031,
          young: 10,
          mature: 1,
          overmature: 0,
          ready: false,
        },
        {
          label: 'Tree #005',
          latOffset: 0.00045,
          lngOffset: -0.00019,
          young: 2,
          mature: 11,
          overmature: 3,
          ready: true,
        },
        {
          label: 'Tree #006',
          latOffset: 0.00008,
          lngOffset: -0.00045,
          young: 5,
          mature: 5,
          overmature: 2,
          ready: true,
        },
        {
          label: 'Tree #007',
          latOffset: -0.00038,
          lngOffset: -0.00012,
          young: 7,
          mature: 3,
          overmature: 0,
          ready: false,
        },
      ];

      for (const item of sampleTreesData) {
        const treeLat = BASE_LAT + item.latOffset;
        const treeLng = BASE_LNG + item.lngOffset;

        const tree = await Tree.create({
          label: item.label,
          latitude: treeLat,
          longitude: treeLng,
          young_count: item.young,
          mature_count: item.mature,
          overmature_count: item.overmature,
          ready_for_harvest: item.ready,
          last_scanned_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 2)),
        });

        const mockDetections = [];
        const total = item.young + item.mature + item.overmature;
        for (let y = 0; y < item.young; y++) {
          mockDetections.push({
            class: 'young',
            confidence: 0.88,
            box: [450 + y * 20, 320 + y * 15, 65, 70],
          });
        }
        for (let m = 0; m < item.mature; m++) {
          mockDetections.push({
            class: 'mature',
            confidence: 0.94,
            box: [520 + m * 18, 380 + m * 12, 75, 80],
          });
        }
        for (let o = 0; o < item.overmature; o++) {
          mockDetections.push({
            class: 'overmature',
            confidence: 0.82,
            box: [600 + o * 25, 430 + o * 10, 80, 85],
          });
        }

        await Scan.create({
          tree_id: tree.id,
          user_id: defaultUser ? defaultUser.id : null,
          image_path: '/uploads/sample-canopy-drone.jpg',
          latitude: treeLat,
          longitude: treeLng,
          altitude: 18.5,
          captured_at: new Date(),
          young_count: item.young,
          mature_count: item.mature,
          overmature_count: item.overmature,
          total_count: total,
          detections: mockDetections,
        });
      }
      console.log(`[CocoScout DB] Seeded ${sampleTreesData.length} sample trees with drone scan records.`);
    }

    console.log('[CocoScout DB] Initialization complete!');
  } catch (error) {
    console.error('[CocoScout DB] Error during database initialization:', error);
    throw error;
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = initDatabase;
