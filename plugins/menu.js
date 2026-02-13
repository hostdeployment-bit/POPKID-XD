const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

// 🔥 Your Hosted Image
const MENU_IMAGE_URL = "https://files.catbox.moe/7t824v.jpg";

// ===== Helpers =====
const formatSize = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
    return (bytes / 1048576).toFixed(1) + 'MB';
};

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

cmd({
    pattern: 'menu',
    alias: ['help', 'allmenu'],
    react: '⚡',
    category: 'main',
    filename: __filename,
    desc: 'Show Ultra Premium Main Menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {

    try {

        const timeZone = 'Africa/Nairobi';
        const date = moment.tz(timeZone).format('DD/MM/YYYY');
        const time = moment.tz(timeZone).format('HH:mm:ss');
        const uptime = formatUptime(process.uptime());
        const ram = `${formatSize(os.totalmem() - os.freemem())}/${formatSize(os.totalmem())}`;
        const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';
        const userName = pushName || 'User';
        const ping = Math.floor(Math.random() * 40) + 10;

        // ===== Group Commands =====
        const commandsByCategory = {};
        let totalCommands = 0;

        commands.forEach(cmd => {
            if (cmd.pattern && !cmd.dontAdd && cmd.category) {
                const cat = cmd.category.toUpperCase();
                if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
                commandsByCategory[cat].push(cmd.pattern.split('|')[0]);
                totalCommands++;
            }
        });

        const sortedCategories = Object.keys(commandsByCategory).sort();

        // ===== Build Caption =====
        let menu = `
╭━━━〔 ${config.BOT_NAME || 'POP KID-MD'} 〕━━━⊷
┃ 👤 User: ${userName}
┃ ⚙ Mode: ${mode}
┃ 📦 Plugins: ${totalCommands}
┃ ⏳ Uptime: ${uptime}
┃ 📅 Date: ${date}
┃ 🕒 Time: ${time}
┃ 💾 RAM: ${ram}
┃ 🚀 Ping: ${ping}ms
╰━━━━━━━━━━━━━━━━⊷

📂 Click *OPEN MENU* below to view commands`;

        // ===== Build Sections =====
        const sections = sortedCategories.map(category => ({
            title: `${category} COMMANDS`,
            rows: commandsByCategory[category]
                .sort()
                .map(cmdName => ({
                    title: `${config.PREFIX}${cmdName}`,
                    description: `Execute ${cmdName} command`,
                    rowId: `${config.PREFIX}${cmdName}`
                }))
        }));

        // ===== Send Image + Caption =====
        await conn.sendMessage(from, {
            image: { url: MENU_IMAGE_URL },
            caption: menu,
            mentions: [sender]
        }, { quoted: mek });

        // ===== Send Interactive List =====
        await conn.sendMessage(from, {
            text: "📜 Select a command category below:",
            footer: "POP KID-MD V4 • POWERED BY POPKID TECH",
            title: "POP KID-MD COMMAND CENTER",
            buttonText: "OPEN MENU",
            sections: sections
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply('❌ Menu processing error.');
    }
});
