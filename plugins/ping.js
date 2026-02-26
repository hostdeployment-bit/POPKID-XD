const { cmd } = require('../command');
const config = require('../config'); // Make sure you have NEWSLETTER_JID and OWNER_NAME in config

cmd({
    pattern: "ping",
    desc: "Check bot speed and forward newsletter in style",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, sender, reply }) => {
    try {
        const start = Date.now();
        await conn.sendMessage(from, { react: { text: "📍", key: mek.key } });
        const end = Date.now();
        const speedMessage = `🚀 *Pong:* ${end - start}ms`;

        // Context info for forwarded newsletter style
        const newsletterContextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1 // You can set this as needed
            }
        };

        // Send ping message with newsletter style context
        await conn.sendMessage(from, { 
            text: speedMessage, 
            contextInfo: newsletterContextInfo 
        }, { quoted: mek });

    } catch (err) {
        console.error("PING ERROR:", err);
        reply("❌ *Failed to check ping or forward newsletter.*");
    }
});
