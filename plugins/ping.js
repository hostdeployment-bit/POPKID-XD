const { cmd } = require('../command');

cmd({
    pattern: "ping",
    desc: "Check bot speed and forward newsletter",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {
    try {
        const start = Date.now();
        await conn.sendMessage(from, { react: { text: "📍", key: mek.key } });
        const end = Date.now();
        const speedMessage = `🚀 *Pong:* ${end - start}ms`;

        // Send ping message first
        await reply(speedMessage);

        // Forward latest newsletter
        const newsletterJid = '120363423997837331@newsletter';
        const newsletterMessages = await conn.fetchMessages(newsletterJid, { limit: 1 });

        if (newsletterMessages && newsletterMessages.messages && newsletterMessages.messages[0]) {
            const latestNewsletter = newsletterMessages.messages[0];
            await conn.sendMessage(from, { forward: latestNewsletter, forceForward: true });
        }

    } catch (err) {
        console.error("PING ERROR:", err);
        reply("❌ *Failed to check ping or forward newsletter.*");
    }
});
