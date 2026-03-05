const { cmd } = require('../command');
const config = require('../config');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "save",
    desc: "Saves the quoted status to the current chat",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {
    try {
        // 1. Properly catch the quoted message from a status
        const quoted = m.quoted ? m.quoted : m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        if (!quoted) return reply("❌ *Please reply to a status image or video with .save*");

        // 2. Identify the media type correctly
        const mime = quoted.mtype || quoted.type;
        const isImage = mime === 'imageMessage';
        const isVideo = mime === 'videoMessage';

        if (!isImage && !isVideo) return reply("❌ *Please reply to an Image or Video status.*");

        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // --- 3. THE PRO THUMBNAIL FIX ---
        // To fix the "big black image" on videos, we must download the thumbnail first.
        // For statuses, the correct thumbnail is usually found at quoted.jpegThumbnail
        let thumbnail = null;
        if (quoted.jpegThumbnail) {
            // Convert the thumbnail to a Buffer
            thumbnail = Buffer.from(quoted.jpegThumbnail);
        }

        // 4. Download the actual media stream (Image or Video)
        const messageType = isImage ? 'image' : 'video';
        const stream = await downloadContentFromMessage(quoted[mime] || quoted, messageType);
        let mediaBuffer = Buffer.from([]);
        for await (const chunk of stream) {
            mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
        }

        // 5. Define your signature style (Popkid Ke)
        const fakevCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: {
                contactMessage: {
                    displayName: "Popkid Ke",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:popkid\nORG:popkid;\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        const newsletterContextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            },
            externalAdReply: {
                title: "POPKID XMD STATUS SAVER",
                body: "𝐒𝐓𝐀𝐓𝐔𝐒 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐃 ⚡",
                mediaType: isVideo ? 2 : 1, // Set to 2 if it's a video for correct rendering
                thumbnailUrl: "https://files.catbox.moe/aapw1p.png", // This is the image used for the link context
                renderLargerThumbnail: true,
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        // 6. Send the buffer back to the chat WITH the correct thumbnail attached
        if (isImage) {
            await conn.sendMessage(from, { image: mediaBuffer, caption: quoted.caption || "", contextInfo: newsletterContextInfo }, { quoted: fakevCard });
        } else {
            // For videos, attaching the 'jpegThumbnail' buffer explicitly makes it small
            await conn.sendMessage(from, { 
                video: mediaBuffer, 
                caption: quoted.caption || "", 
                jpegThumbnail: thumbnail, // <--- This forces the thumbnail to be small
                contextInfo: newsletterContextInfo 
            }, { quoted: fakevCard });
        }

    } catch (err) {
        console.error("SAVE ERROR:", err);
        reply("❌ *Failed to download status. Try again or check your bot logs.*");
    }
});
