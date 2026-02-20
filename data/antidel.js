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
        defaultValue: false, // Default is OFF
    },
}, {
    tableName: 'antidelete',
    timestamps: false,
});

async function setAnti(status) {
    try {
        await AntiDelDB.sync();
        const [record, created] = await AntiDelDB.findOrCreate({
            where: { id: 1 },
            defaults: { status }
        });
        if (!created) await record.update({ status });
        return true;
    } catch (error) {
        console.error('Error setting anti-delete:', error);
        return false;
    }
}

async function getAnti() {
    try {
        await AntiDelDB.sync();
        const record = await AntiDelDB.findByPk(1);
        return record ? record.status : false;
    } catch (error) {
        return false;
    }
}

module.exports = { setAnti, getAnti };
