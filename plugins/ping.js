const { cmd } = require('../command');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: "ping",
    desc: "Check bot speed with fake vCard and newsletter style",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, sender, reply }) => {
    try {
        const start = Date.now();
        await conn.sendMessage(from, { react: { text: "📍", key: mek.key } });
        const end = Date.now();
        const speedMessage = `🚀 *Pong:* ${end - start}ms`;

        // Define the fakevCard (Popkid Ke)
        const fakevCard = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "Popkid Ke",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:popkid\nORG:popkid;\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        // Context info for newsletter and link preview
        const newsletterContextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            },
            externalAdReply: {
                title: "POPKID XMD PING",
                body: "𝐒𝐏𝐄𝐄𝐃 𝐂𝐇𝐄𝐂𝐊 ⚡",
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/aapw1p.png", // Same menu image
                renderLargerThumbnail: true,
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        // Send ping message with newsletter style and quoted vCard
        await conn.sendMessage(from, { 
            text: speedMessage, 
            contextInfo: newsletterContextInfo 
        }, { quoted: fakevCard });

    } catch (err) {
        console.error("PING ERROR:", err);
        reply("❌ *Failed to check ping.*");
    }
});
