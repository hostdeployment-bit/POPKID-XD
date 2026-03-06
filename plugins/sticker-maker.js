const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "s",
    alias: ["sticker", "wm"],
    desc: "Fast API-based Sticker Maker",
    category: "convert",
    filename: __filename
}, async (conn, m, mek, { from, reply, sender, isQuotedImage, isQuotedVideo }) => {
    try {
        // 1. Detection
        const isMedia = (m.type === 'imageMessage' || m.type === 'videoMessage');
        const isQuoted = (isQuotedImage || isQuotedVideo);
        
        if (!isMedia && !isQuoted) return reply("*Reply to an image or short video!* 📸");

        await conn.sendMessage(from, { react: { text: "🪄", key: mek.key } });

        // 2. Download Media to Buffer
        const download = m.quoted ? m.quoted : m;
        const buffer = await download.download();

        // 3. Popkid Style Context (Slim)
        const fakevCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: {
                contactMessage: {
                    displayName: "Popkid Ke",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:popkid\nORG:popkid;\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        const minimalistContext = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: 'POPKID XMD STICKER',
                serverMessageId: 1
            }
        };

        // 4. Send the Sticker with Metadata
        // Using conn.sendMessage directly with your branding
        await conn.sendMessage(from, { 
            sticker: buffer, 
            contextInfo: minimalistContext 
        }, { 
            quoted: fakevCard,
            packname: "POPKID XMD", 
            author: "Popkid Ke" 
        });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("STICKER ERROR:", err);
        reply("❌ *Failed. Ensure the video is under 7 seconds.*");
    }
});
