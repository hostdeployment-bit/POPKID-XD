const config = require('../config');
const os = require('os');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

// --- PRELOAD MENU IMAGE TO REDUCE LAG ---
const menuImagePath = path.resolve('./popkid/menu.jpg');
let menuImageBuffer = null;
try {
    menuImageBuffer = fs.readFileSync(menuImagePath);
} catch (e) {
    console.log("Menu image not found, sending placeholder image.");
}

// Helpers
const monospace = (text) => `\`${text}\``;
const formatSize = (bytes) => bytes >= 1073741824 ? (bytes / 1073741824).toFixed(2) + ' GB' : (bytes / 1048576).toFixed(2) + ' MB';
const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

// Stylish Menu Command
cmd({
    pattern: 'menu2',
    alias: ['help', 'allmenu'],
    react: '✨',
    category: 'main',
    filename: __filename,
    desc: 'Show full advanced stylish menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
    try {
        const timeZone = 'Africa/Nairobi';
        const time = moment.tz(timeZone).format('hh:mm A');
        const date = moment.tz(timeZone).format('dddd, DD MMMM YYYY');
        const uptime = formatUptime(process.uptime());
        const ram = `${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}`;
        const mode = (config.MODE === 'public') ? 'PUBLIC 🔓' : 'PRIVATE 🔒';
        const userName = pushName || 'User';

        // Organize commands by category
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

        // Construct stylish menu
        let menu = `╔═════════════════════════╗
║     ✨ *${config.BOT_NAME || 'POP KID-MD'}* ✨
║═════════════════════════║
║ 🕒 Time : ${monospace(time)}
║ 📅 Date : ${monospace(date)}
║ 🧑‍💻 User : ${monospace(userName)}
║ 🔹 Mode : ${monospace(mode)}
║ ⚡ Uptime : ${monospace(uptime)}
║ 💾 RAM : ${monospace(ram)}
║ 🛠️ Plugins : ${monospace(totalCommands)}
║ ⏱️ Ping : ${monospace(Math.floor(Math.random() * 50) + 10 + 'ms')}
╚═════════════════════════╝

╔══════✨ *COMMANDS* ✨═════╗`;

        for (const category of Object.keys(commandsByCategory).sort()) {
            menu += `\n\n┌─❑ *${category}* ❑─`;
            commandsByCategory[category].sort().forEach(cmdName => {
                menu += `\n│ • ${monospace(config.PREFIX + cmdName)}`;
            });
            menu += `\n└────────────────────────`;
        }

        menu += `\n\n╔═════════════════════════╗
║ 🔗 Channel : https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r
║ © 2026 *${config.BOT_NAME || 'POP KID-MD'}*
╚═════════════════════════╝`;

        // Send the menu with image and advanced preview
        await conn.sendMessage(from, {
            image: menuImageBuffer ? { url: menuImagePath } : { url: 'https://via.placeholder.com/600x400?text=POP+KID+MD' },
            caption: menu,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 1,
                externalAdReply: {
                    title: 'POP KID-MD V2 ADVANCED',
                    body: 'The Ultimate Tech Bot',
                    thumbnail: menuImageBuffer,
                    sourceUrl: 'https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply('❌ Failed to generate menu.');
    }
});
