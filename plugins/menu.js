const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

const MENU_IMAGE_URL = "https://files.catbox.moe/aapw1p.png";

// =====================
// Helpers
// =====================

const getGreeting = () => {
    const hour = moment().tz('Africa/Nairobi').hour();
    if (hour >= 5 && hour < 12) return "Good Morning 🌅";
    if (hour >= 12 && hour < 18) return "Good Afternoon 🏙️";
    return "Good Evening 🌆";
};

const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0MB';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + 'GB';
    return (bytes / 1048576).toFixed(2) + 'MB';
};

const getSystemStats = () => {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const ramPercentage = Math.floor((used / total) * 100);
    const totalBars = 10;
    const filledBars = Math.round((ramPercentage / 100) * totalBars);
    const ramBar = "█".repeat(filledBars) + "░".repeat(totalBars - filledBars);
    
    return {
        usage: `${formatSize(used)} OF ${formatSize(total)}`,
        bar: ramBar,
        percent: ramPercentage
    };
};

// =====================
// MENU COMMAND
// =====================

cmd({
    pattern: 'menu',
    alias: ['help', 'allmenu'],
    react: '✨',
    category: 'main',
    filename: __filename,
    desc: 'Show optimized main menu'
}, async (conn, mek, m, { from, pushName, reply }) => {
    try {
        const start = Date.now();
        const now = moment().tz('Africa/Nairobi');
        const date = now.format('DD/MM/YYYY');
        const time = now.format('HH:mm:ss');
        const stats = getSystemStats();
        const userName = pushName || 'User';
        const greeting = getGreeting();

        const commandsByCategory = {};
        commands.filter(cmd => cmd.pattern && !cmd.dontAdd && cmd.category).forEach(cmd => {
            const category = cmd.category.toUpperCase().trim();
            const name = cmd.pattern.split('|')[0].trim();
            if (!commandsByCategory[category]) commandsByCategory[category] = new Set();
            commandsByCategory[category].add(name);
        });

        const sortedCategories = Object.keys(commandsByCategory).sort();
        const end = Date.now();
        const ping = end - start;

        // EXACT STYLE REPLICATION FROM IMAGE
        let menu = `| USAGE : ${stats.usage}
| RAM: [${stats.bar}] ${stats.percent}%
| PING: ${ping}ms

**POPKID XMD**
  ┃
  ┗━┓ 🏙️ **${greeting}** 🤠
    ┃ ─────────── ◆

┝━━━━━━━━━━━━━━━⊷
┃ 🕵️‍♂️ USER NAME: ${userName}
┃ 📅 DATE: ${date}
┃ ⏰ TIME: ${time}
┃ ⭐ USERS: 4212
┝━━━━━━━━━━━━━━━⊷

*Command List ⤵*`;

        for (const category of sortedCategories) {
            menu += `\n\n╭━━━━❮ *${category}* ❯━⊷\n`;
            const sortedCommands = [...commandsByCategory[category]].sort();
            for (const cmdName of sortedCommands) {
                menu += `┃✞︎ ${config.PREFIX}${cmdName}\n`;
            }
            menu += `╰━━━━━━━━━━━━━━━━━⊷`;
        }

        menu += `\n\n> *POPKID XMD* © 2026 🇰🇪`;

        // =====================
        // SEND MESSAGE (Using standard send method like .ping)
        // =====================
        await conn.sendMessage(from, {
            image: { url: MENU_IMAGE_URL },
            caption: menu,
            contextInfo: {
                externalAdReply: {
                    title: "POPKID XMD",
                    body: "The Best WhatsApp Bot",
                    thumbnailUrl: MENU_IMAGE_URL,
                    sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply('❌ Menu processing error.');
    }
});
