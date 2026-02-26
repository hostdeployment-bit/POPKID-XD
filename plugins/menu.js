const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

const MENU_IMAGE_URL = "https://files.catbox.moe/aapw1p.png";

// =====================
// Greeting
// =====================

const getGreeting = () => {
    const hour = moment().tz('Africa/Nairobi').hour();  

    if (hour >= 5 && hour < 12)  
        return "🌅 Good Morning";  

    if (hour >= 12 && hour < 18)  
        return "🌤️ Good Afternoon";  

    return "🌙 Good Night";
};

// =====================
// MENU COMMAND
// =====================

cmd({
    pattern: "menu",
    alias: ["help", "allmenu"],
    react: "✨",
    category: "main",
    desc: "Show bot menu",
    filename: __filename
},
async (conn, mek, m, { from, sender, pushName, reply }) => {

    try {

        const now = moment().tz("Africa/Nairobi");
        const date = now.format("DD/MM/YYYY");
        const time = now.format("HH:mm:ss");

        // FIX USERNAME (real WhatsApp name)
        let userName =
            pushName ||
            mek.pushName ||
            conn.getName(sender) ||
            "Unknown";

        const greeting = getGreeting();

        // =====================
        // Organize Commands
        // =====================

        const commandsByCategory = {};
        commands
            .filter(cmd => cmd.pattern && !cmd.dontAdd && cmd.category)
            .forEach(cmd => {
                const category = cmd.category.toUpperCase();
                const name = cmd.pattern.split("|")[0].trim();
                if (!commandsByCategory[category])
                    commandsByCategory[category] = [];
                commandsByCategory[category].push(name);
            });

        const sortedCategories = Object.keys(commandsByCategory).sort();

        // =====================
        // HEADER
        // =====================

        let menu = `
┌─❖
│POPKID XMD
└┬❖
│${greeting} 😴
└────────┈❖
▬▬▬▬▬▬▬▬▬▬

> 🕵️ᴜsᴇʀ ɴᴀᴍᴇ: ${userName}
📅ᴅᴀᴛᴇ: ${date}
⏰ᴛɪᴍᴇ: ${time}
⭐ᴜsᴇʀs: ${commands.length}
▬▬▬▬▬▬▬▬▬▬
`;

        // =====================
        // COMMAND LIST
        // =====================

        for (const category of sortedCategories) {
            menu += `\n*╭─❖ ${category} MENU ❖*\n`;
            const sortedCommands = commandsByCategory[category].sort();
            for (const cmdName of sortedCommands) {
                menu += `*│➤ ${config.PREFIX}${cmdName}*\n`;
            }
            menu += `*╰──────────────❖*\n`;
        }

        // =====================
        // FOOTER
        // =====================
        menu += `*┌─❖* *│POPKID XMD BOT* *└──────────────❖*`;

        // =====================
        // CONTEXT INFO (FORWARDED NEWSLETTER STYLE)
        // =====================
        const newsletterContextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            }
        };

        // =====================
        // SEND MENU
        // =====================
        await conn.sendMessage(from, {
            image: { url: MENU_IMAGE_URL },
            caption: menu,
            contextInfo: {
                ...newsletterContextInfo,
                externalAdReply: {
                    title: "POPKID XMD",
                    body: userName,
                    mediaType: 1,
                    renderLargerThumbnail: false // IMPORTANT FIX
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Error loading menu.");
    }
});
