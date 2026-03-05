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

        // 3. The "Pro" Fix: Use the downloader with the specific message stream
        const messageType = isImage ? 'image' : 'video';
        const stream = await downloadContentFromMessage(quoted[mime] || quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Style Settings (Your signature Popkid Ke style)
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
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/aapw1p.png",
                renderLargerThumbnail: true,
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        // 5. Send the buffer back to the chat
        if (isImage) {
            await conn.sendMessage(from, { image: buffer, caption: quoted.caption || "", contextInfo: newsletterContextInfo }, { quoted: fakevCard });
        } else {
            await conn.sendMessage(from, { video: buffer, caption: quoted.caption || "", contextInfo: newsletterContextInfo }, { quoted: fakevCard });
        }

    } catch (err) {
        console.error("SAVE ERROR:", err);
        reply("❌ *Failed to download status. Try again or check your bot logs.*");
    }
});
