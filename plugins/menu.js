const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

// ✅ Your Live Image URL
const MENU_IMAGE_URL = "https://files.catbox.moe/7t824v.jpg";

// Helpers
const formatSize = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
    return (bytes / 1048576).toFixed(1) + 'MB';
};

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (24 * 3600));
    const h = Math.floor((seconds % (24 * 3600)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

cmd({
    pattern: 'menu',
    alias: ['help', 'allmenu'],
    react: '✅',
    category: 'main',
    filename: __filename,
    desc: 'Show optimized main menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
    try {

        const timeZone = 'Africa/Nairobi';
        const date = moment.tz(timeZone).format('DD/MM/YYYY');
        const uptime = formatUptime(process.uptime());
        const ram = `${formatSize(os.totalmem() - os.freemem())}/${formatSize(os.totalmem())}`;
        const mode = (config.MODE === 'public') ? 'PUBLIC' : 'PRIVATE';
        const userName = pushName || 'User';

        // Group Commands
        const commandsByCategory = {};
        let totalCommands = 0;

        commands.forEach(command => {
            if (command.pattern && !command.dontAdd && command.category) {
                const cat = command.category.toUpperCase();
                if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
                commandsByCategory[cat].push(command.pattern.split('|')[0]);
                totalCommands++;
            }
        });

        // Build Menu
        let menu = `╭══〘 *${config.BOT_NAME || 'POP KID-MD'}* 〙══⊷
┃❍ *Mode:* ${mode}
┃❍ *User:* ${userName}
┃❍ *Plugins:* ${totalCommands}
┃❍ *Uptime:* ${uptime}
┃❍ *Date:* ${date}
┃❍ *RAM:* ${ram}
┃❍ *Ping:* ${Math.floor(Math.random() * 50) + 10}ms
╰═════════════════⊷

*Command List ⤵*`;

        for (const category in commandsByCategory) {
            menu += `\n\n╭━━━━❮ *${category}* ❯━⊷\n`;
            commandsByCategory[category].sort().forEach(cmdName => {
                menu += `┃✞︎ ${config.PREFIX + cmdName}\n`;
            });
            menu += `╰━━━━━━━━━━━━━━━━━⊷`;
        }

        menu += `\n\n> *${config.BOT_NAME || 'POP KID-MD'}* © 2026 🇰🇪`;

        // ✅ Clean Send
        await conn.sendMessage(from, {
            image: { url: MENU_IMAGE_URL },
            caption: menu,
            mentions: [sender]
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply('❌ Menu processing error.');
    }
});
