const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { sendButtons } = require('gifted-btns');

// The image provided in your request
const MENU_IMAGE_URL = "https://files.catbox.moe/aapw1p.png";

// =====================
// Helpers
// =====================

const getGreeting = () => {
    const hour = moment().tz('Africa/Nairobi').hour();
    if (hour >= 5 && hour < 12) return { text: "Good Morning", emoji: "🌅" };
    if (hour >= 12 && hour < 18) return { text: "Good Afternoon", emoji: "🏙️" };
    return { text: "Good Evening", emoji: "🌃" };
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
    
    // Smooth RAM bar
    const totalBars = 10;
    const filledBars = Math.round((ramPercentage / 100) * totalBars);
    const ramBar = "▓".repeat(filledBars) + "░".repeat(totalBars - filledBars);
    
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
    desc: 'Show the ultimate POPKID XMD menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
    try {
        const start = Date.now();
        const now = moment().tz('Africa/Nairobi');
        const date = now.format('DD/MM/YYYY');
        const time = now.format('HH:mm:ss');
        const stats = getSystemStats();
        const userName = pushName || 'User';
        const greeting = getGreeting();

        // Categorize Commands
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

        // --- FULL "BWM" STYLE REPLICATION ---
        let menuHeader = `| USAGE : ${stats.usage}
| RAM : [${stats.bar}] ${stats.percent}%
| PING : ${ping}ms

**POPKID XMD**
  ┃
  ┗━┓ ${greeting.emoji} **${greeting.text}** 🤠
    ┃ ─────────── ◆

┝━━━━━━━━━━━━━━━⊷
┃ 🕵️‍♂️ USER NAME: ${userName}
┃ 📅 DATE: ${date}
┃ ⏰ TIME: ${time}
┃ ⭐ USERS: 4212
┃ 🚀 STATUS: ONLINE
┝━━━━━━━━━━━━━━━⊷

*Command List ⤵*`;

        let fullMenu = menuHeader;

        for (const category of sortedCategories) {
            fullMenu += `\n\n╭━━━━❮ *${category}* ❯━⊷\n`;
            const sortedCommands = [...commandsByCategory[category]].sort();
            for (const cmdName of sortedCommands) {
                fullMenu += `┃✞︎ ${config.PREFIX}${cmdName}\n`;
            }
            fullMenu += `╰━━━━━━━━━━━━━━━━━⊷`;
        }

        fullMenu += `\n\n> *POPKID XMD* © 2026 🇰🇪`;

        // =====================
        // SEND MESSAGE WITH IMAGE & BUTTONS
        // =====================

        await sendButtons(conn, from, {
            title: `🤖 POPKID XMD v3.0`,
            text: fullMenu,
            footer: "🚀 High Performance Bot Interface",
            image: MENU_IMAGE_URL,
            buttons: [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🌐 Join Official Channel",
                        url: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Ping Bot",
                        id: ".ping"
                    })
                }
            ]
        });

    } catch (e) {
        console.error("Menu Error:", e);
        reply('❌ Something went wrong while loading the menu.');
    }
});
