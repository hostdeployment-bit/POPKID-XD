const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

const MENU_IMAGE_URL = "https://files.catbox.moe/aapw1p.png";

// =====================
// Simple Greeting Logic
// =====================

const getGreeting = () => {
    const hour = moment().tz('Africa/Nairobi').hour();

    if (hour >= 5 && hour < 12) return "Good Morning 🌅";
    if (hour >= 12 && hour < 17) return "Good Afternoon ☀️";
    if (hour >= 17 && hour < 21) return "Good Evening 🌆";
    return "Good Night 😴";
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

        let userName = pushName || mek.pushName || conn.getName(sender) || "User";
        const greeting = getGreeting();

        // =====================
        // Organize Commands
        // =====================
        const commandsByCategory = {};
        const activeCommands = commands.filter(cmd => cmd.pattern && !cmd.dontAdd && cmd.category);
        const totalCommands = activeCommands.length; 

        activeCommands.forEach(cmd => {
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
*┌─❖*
*│POPKID XMD*
*└┬❖*
   *│${greeting}*
   *└────────┈❖*
▬▬▬▬▬▬▬▬▬▬
> 🕵️ᴜsᴇʀ ɴᴀᴍᴇ: ${userName}
> 📅ᴅᴀᴛᴇ: ${date}
> ⏰ᴛɪᴍᴇ: ${time}
> ⭐ᴛᴏᴛᴀʟ ᴄᴍᴅꜱ: ${totalCommands}
▬▬▬▬▬▬▬▬▬▬
`;

        // =====================
        // COMMAND LIST
        // =====================
        for (const category of sortedCategories) {
            menu += `\n*╭─❖ ${category} MENU ❖*\n`;
            const sortedCommands = commandsByCategory[category].sort();
            for (const cmdName of sortedCommands) {
                menu += `*│❍⁠⁠ ${config.PREFIX}${cmdName}*\n`;
            }
            menu += `*╰──────────────❖*\n`;
        }

        // =====================
        // FOOTER
        // =====================
        menu += `
*┌─❖*
*│POPKID XMD BOT*
*└──────────────❖*
`;

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

        await conn.sendMessage(from, {
            image: { url: MENU_IMAGE_URL },
            caption: menu,
            contextInfo: {
                ...newsletterContextInfo,
                externalAdReply: {
                    title: "POPKID XD",
                    body: userName,
                    mediaType: 1,
                    renderLargerThumbnail: false 
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Error loading menu.");
    }

});
