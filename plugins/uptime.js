const { cmd } = require('../command');
const config = require('../config'); // Make sure NEWSLETTER_JID and OWNER_NAME exist

cmd({
    pattern: "uptime",
    alias: ["runtime", "status"],
    desc: "Check how long the bot has been running.",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, sender, reply }) => {
    try {
        // Calculate uptime
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const uptimeString = `🕒 *ᴜᴘᴛɪᴍᴇ:* ${hours}ʜ ${minutes}ᴍ ${seconds}s`;

        // Forwarded newsletter style context
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

        // Send uptime with reaction and forwarded newsletter style
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await conn.sendMessage(from, { 
            text: uptimeString, 
            contextInfo: newsletterContextInfo 
        });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
