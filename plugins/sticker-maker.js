const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "s",
    alias: ["sticker", "wm"],
    desc: "Pro-Level Media Detection Sticker Maker",
    category: "convert",
    filename: __filename
}, async (conn, m, mek, { from, reply, sender }) => {
    try {
        // 1. PRO-LEVEL DETECTION
        // This checks deep inside the message structure to find any image or video
        const isQuoted = m.quoted ? m.quoted : m;
        const mime = (isQuoted.msg || isQuoted).mimetype || '';
        const isMedia = /image|video|sticker/.test(mime);

        if (!isMedia) {
            return reply("*Reply to a photo or a short video!* 📸");
        }

        await conn.sendMessage(from, { react: { text: "🪄", key: mek.key } });

        // 2. STABLE DOWNLOAD
        // Uses the built-in downloader which is safest for Heroku's memory
        const buffer = await isQuoted.download();

        // 3. POPKID SLIM BRANDING
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

        // 4. THE PRO SEND
        // Sending directly with packname/author prevents 'sticker-formatter' module errors
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
        console.error("PRO STICKER ERROR:", err);
        reply("❌ *Processing failed. Ensure the video is under 7 seconds!*");
    }
});
