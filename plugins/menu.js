const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { sendButtons } = require('gifted-btns');

const MENU_IMAGE_URL = "https://files.catbox.moe/aapw1p.png";

// =====================
// Helpers
// =====================

const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0MB';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + 'GB';
    return (bytes / 1048576).toFixed(2) + 'MB';
};

const formatUptime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / 86400);
    const h = Math.floor(seconds % 86400 / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

const getSystemStats = () => {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const ramPercentage = Math.floor((used / total) * 100);
    
    // Create the RAM bar style from the image
    const totalBars = 10;
    const filledBars = Math.round((ramPercentage / 100) * totalBars);
    const ramBar = "█".repeat(filledBars) + "░".repeat(totalBars - filledBars);
    
    return {
        ram: `${formatSize(used)} OF ${formatSize(total)}`,
        bar: ramBar,
        percent: ramPercentage
    };
};

const getGreeting = () => {
    const hour = moment().tz('Africa/Nairobi').hour();
    if (hour >= 5 && hour < 12) return "Good Morning 🌅";
    if (hour >= 12 && hour < 18) return "Good Afternoon 🏙️";
    return "Good Evening 🌆";
};

// =====================
// MENU COMMAND
// =====================

cmd({
    pattern: 'menu',
    alias: ['help', 'allmenu'],
    react: '✅',
    category: 'main',
    filename: __filename,
    desc: 'Show optimized main menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
    try {
        const start = Date.now();
        const now = moment().tz('Africa/Nairobi');

        const date = now.format('DD/MM/YYYY');
        const time = now.format('HH:mm:ss');
        const stats = getSystemStats();
        const userName = pushName || 'User';
        const greeting = getGreeting();

        const commandsByCategory = {};
        let totalCommands = 0;

        commands
            .filter(cmd => cmd.pattern && !cmd.dontAdd && cmd.category)
            .forEach(cmd => {
                const category = cmd.category.toUpperCase().trim();
                const name = cmd.pattern.split('|')[0].trim();

                if (!commandsByCategory[category])
                    commandsByCategory[category] = new Set();

                commandsByCategory[category].add(name);
                totalCommands++;
            });

        const sortedCategories = Object.keys(commandsByCategory).sort();

        // EXACT STYLE REPLICATION FROM THE IMAGE
        let menu = `| USAGE : ${stats.ram}
| RAM: [${stats.bar}] ${stats.percent}%

*POPKID XMD*
  ┃
  ┗━┓ ${greeting} 🤠
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

        menu += `\n\n> *${config.BOT_NAME || 'POPKID XMD'}* © 2026 🇰🇪`;

        // =====================
        // SEND BUTTON MESSAGE
        // =====================

        await sendButtons(conn, from, {
            title: `🤖 ${config.BOT_NAME || 'POPKID XMD'} MENU`,
            text: menu,
            footer: "🚀 Powered By Popkid XMD",
            image: MENU_IMAGE_URL,
            buttons: [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🌐 Official Channel",
                        url: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
                    })
                }
            ]
        });

    } catch (e) {
        console.error(e);
        reply('❌ Menu processing error.');
    }
});
