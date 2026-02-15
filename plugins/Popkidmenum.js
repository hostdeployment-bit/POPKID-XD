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
    return {
        ram: `${formatSize(total - free)}/${formatSize(total)}`,
        cpu: os.cpus()[0]?.model || 'Unknown CPU',
        platform: os.platform()
    };
};

// =====================
// MAIN MENU
// =====================

cmd({
    pattern: 'menu5',
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
        const uptime = formatUptime(process.uptime());
        const stats = getSystemStats();
        const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';
        const userName = pushName || 'User';

        const commandsByCategory = {};
        commands
            .filter(cmd => cmd.pattern && !cmd.dontAdd && cmd.category)
            .forEach(cmd => {
                const category = cmd.category.toUpperCase().trim();
                const name = cmd.pattern.split('|')[0].trim();

                if (!commandsByCategory[category])
                    commandsByCategory[category] = new Set();

                commandsByCategory[category].add(name);
            });

        const sortedCategories = Object.keys(commandsByCategory).sort();

        const end = Date.now();
        const ping = end - start;

        const header = `╭══〘 *${config.BOT_NAME || 'POP KID-MD'}* 〙══⊷
┃❍ *Mode:* ${mode}
┃❍ *User:* ${userName}
┃❍ *Uptime:* ${uptime}
┃❍ *Date:* ${date}
┃❍ *RAM:* ${stats.ram}
┃❍ *Ping:* ${ping}ms
╰═════════════════⊷

*Select a Category Below ⤵*`;

        // Create buttons from categories (max 3 per row supported)
        const buttons = sortedCategories.slice(0, 3).map(cat => ({
            id: `menu_${cat}`,
            text: cat
        }));

        await sendButtons(conn, from, {
            title: `🤖 ${config.BOT_NAME || 'POP KID-MD'} MENU`,
            text: header,
            footer: "🚀 Powered By Popkid XMD",
            image: MENU_IMAGE_URL,
            buttons
        });

        // =====================
        // CATEGORY HANDLER
        // =====================

        const handler = async (event) => {

            const msg = event.messages?.[0];
            if (!msg?.message) return;
            if (msg.key.remoteJid !== from) return;

            let selectedId = null;

            if (msg.message.buttonsResponseMessage) {
                selectedId =
                    msg.message.buttonsResponseMessage.selectedButtonId;
            }

            if (!selectedId || !selectedId.startsWith("menu_")) return;

            const category = selectedId.replace("menu_", "");

            if (!commandsByCategory[category]) return;

            let categoryMenu = `╭━━━━❮ *${category}* ❯━⊷\n`;

            const sortedCommands = [...commandsByCategory[category]].sort();

            for (const cmdName of sortedCommands) {
                categoryMenu += `┃✞︎ ${config.PREFIX}${cmdName}\n`;
            }

            categoryMenu += `╰━━━━━━━━━━━━━━━━━⊷`;

            await conn.sendMessage(from, {
                text: categoryMenu
            }, { quoted: msg });

            conn.ev.off("messages.upsert", handler);
        };

        conn.ev.on("messages.upsert", handler);

        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 120000);

    } catch (e) {
        console.error(e);
        reply('❌ Menu processing error.');
    }
});
