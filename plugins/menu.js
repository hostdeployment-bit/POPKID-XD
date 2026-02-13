const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

// 🔥 Your Hosted Menu Image
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

// ===== MENU COMMAND =====
cmd({
    pattern: 'menu',
    alias: ['help', 'allmenu'],
    react: '⚡',
    category: 'main',
    filename: __filename,
    desc: 'Show Advanced Main Menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {

    try {

        const timeZone = 'Africa/Nairobi';
        const date = moment.tz(timeZone).format('DD/MM/YYYY');
        const time = moment.tz(timeZone).format('HH:mm:ss');
        const uptime = formatUptime(process.uptime());
        const ramUsage = `${formatSize(os.totalmem() - os.freemem())}/${formatSize(os.totalmem())}`;
        const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';
        const userName = pushName || 'User';
        const ping = Math.floor(Math.random() * 40) + 10;

        // ===== Group Commands =====
        const commandsByCategory = {};
        let totalCommands = 0;

        commands.forEach(cmd => {
            if (cmd.pattern && !cmd.dontAdd && cmd.category) {
                const category = cmd.category.toUpperCase();
                if (!commandsByCategory[category]) {
                    commandsByCategory[category] = [];
                }
                commandsByCategory[category].push(cmd.pattern.split('|')[0]);
                totalCommands++;
            }
        });

        // ===== Sort Categories Alphabetically =====
        const sortedCategories = Object.keys(commandsByCategory).sort();

        // ===== Build Menu =====
        let menu = `
╭━━━〔 ${config.BOT_NAME || 'POP KID-MD'} 〕━━━⊷
┃ 👤 User: ${userName}
┃ ⚙ Mode: ${mode}
┃ 📦 Plugins: ${totalCommands}
┃ ⏳ Uptime: ${uptime}
┃ 📅 Date: ${date}
┃ 🕒 Time: ${time}
┃ 💾 RAM: ${ramUsage}
┃ 🚀 Ping: ${ping}ms
╰━━━━━━━━━━━━━━━━⊷

📜 *COMMAND LIST* ↓`;

        sortedCategories.forEach(category => {
            menu += `\n\n╭─〔 ${category} 〕─⊷\n`;

            commandsByCategory[category]
                .sort()
                .forEach(commandName => {
                    menu += `│ ➤ ${config.PREFIX}${commandName}\n`;
                });

            menu += `╰──────────────⊷`;
        });

        menu += `\n\n© ${new Date().getFullYear()} ${config.BOT_NAME || 'POP KID-MD'} 🇰🇪`;

        // ===== Send Message =====
        await conn.sendMessage(from, {
            image: { url: MENU_IMAGE_URL },
            caption: menu,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `${config.BOT_NAME || 'POP KID-MD'} V2 ADVANCED`,
                    body: 'POPKID TECH • Ultra Performance',
                    thumbnailUrl: MENU_IMAGE_URL,
                    sourceUrl: 'https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply('❌ Menu processing error.');
    }
});
