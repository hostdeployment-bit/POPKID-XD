const { DATABASE } = require('../lib/database');
const { DataTypes } = require('sequelize');
const config = require('../config');

const AntiDelDB = DATABASE.define('AntiDelete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: config.ANTI_DELETE || false,
    },
}, {
    tableName: 'antidelete',
    timestamps: false,
    hooks: {
        beforeCreate: record => { record.id = 1; },
        beforeBulkCreate: records => { records.forEach(record => { record.id = 1; }); },
    },
});

let isInitialized = false;

/**
 * Initialize anti-delete settings table and migrate if needed
 */
async function initializeAntiDeleteSettings() {
    if (isInitialized) return;

    try {
        // Sync model (create table if missing)
        await AntiDelDB.sync({ alter: true });

        // Check for old schema (gc_status/dm_status)
        const tableInfo = await DATABASE.getQueryInterface().describeTable('antidelete');
        if (tableInfo.gc_status || tableInfo.dm_status) {
            console.log('[AntiDelete] Migrating from old schema...');

            const [oldRecord] = await DATABASE.query(
                'SELECT * FROM antidelete WHERE id = 1',
                { type: DATABASE.QueryTypes.SELECT }
            );

            if (oldRecord) {
                const oldStatus = oldRecord.gc_status ?? oldRecord.dm_status ?? config.ANTI_DELETE ?? false;

                // Drop old table safely
                await DATABASE.query('DROP TABLE IF EXISTS antidelete');

                // Recreate new table
                await AntiDelDB.sync({ force: true });

                // Insert migrated record
                await AntiDelDB.create({ id: 1, status: oldStatus });
            }
        } else {
            // Normal case: just ensure record exists
            await AntiDelDB.findOrCreate({
                where: { id: 1 },
                defaults: { status: config.ANTI_DELETE || false },
            });
        }

        isInitialized = true;
        console.log('[AntiDelete] Settings initialized successfully');
    } catch (error) {
        console.error('[AntiDelete] Initialization error:', error.message);

        // Fallback: force recreate table on critical errors
        try {
            await AntiDelDB.sync({ force: true });
            await AntiDelDB.create({ id: 1, status: config.ANTI_DELETE || false });
            isInitialized = true;
        } catch (fallbackErr) {
            console.error('[AntiDelete] Fallback sync failed:', fallbackErr.message);
        }
    }
}

/**
 * Set anti-delete status (true/false)
 * @param {boolean} status
 * @returns {Promise<boolean>} success
 */
async function setAnti(status) {
    try {
        await initializeAntiDeleteSettings();

        const [affectedRows] = await AntiDelDB.update(
            { status: !!status },
            { where: { id: 1 } }
        );

        return affectedRows > 0;
    } catch (error) {
        console.error('[setAnti] Error:', error.message);
        return false;
    }
}

/**
 * Get current anti-delete status
 * @returns {Promise<boolean>}
 */
async function getAnti() {
    try {
        await initializeAntiDeleteSettings();

        const record = await AntiDelDB.findByPk(1);
        return record ? record.status : (config.ANTI_DELETE || false);
    } catch (error) {
        console.error('[getAnti] Error:', error.message);
        return config.ANTI_DELETE || false;
    }
}

module.exports = {
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
};
