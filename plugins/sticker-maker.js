const { cmd } = require('../command');
const config = require('../config');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

cmd({
    pattern: "s",
    alias: ["sticker", "wm"],
    desc: "Convert image/video to sticker with Popkid branding",
    category: "convert",
    filename: __filename
}, async (conn, m, mek, { from, reply, sender, isQuotedImage, isQuotedVideo, isQuotedSticker }) => {
    try {
        // 1. Check if user replied to media
        if (!(isQuotedImage || isQuotedVideo || isQuotedSticker || m.type === 'imageMessage' || m.type === 'videoMessage')) {
            return reply("*Reply to an image or short video!* 📸");
        }

        await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });

        // 2. Download the media
        const nameJid = sender.split('@')[0];
        const download = m.quoted ? m.quoted : m;
        const buffer = await download.download();

        // 3. Define the vCard and Newsletter context (Slim style)
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

        // 4. Create the sticker with custom metadata
        const sticker = new Sticker(buffer, {
            pack: 'POPKID XMD', // The Pack Name
            author: 'Popkid Ke', // The Author Name
            type: StickerTypes.FULL, 
            categories: ['🤩', '🎉'],
            id: nameJid,
            quality: 70,
            background: 'transparent'
        });

        const stickerBuffer = await sticker.toBuffer();

        // 5. Send the sticker
        await conn.sendMessage(from, { 
            sticker: stickerBuffer, 
            contextInfo: minimalistContext 
        }, { quoted: fakevCard });

    } catch (err) {
        console.error("STICKER ERROR:", err);
        reply("❌ *Failed to convert.*");
    }
});
