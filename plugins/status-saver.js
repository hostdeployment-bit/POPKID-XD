const { cmd } = require('../command')
const { downloadMediaMessage } = require('../lib') 
const path = require('path')
const fs = require('fs')

cmd({
    pattern: "save",
    aliases: ["sv", "s", "sav", "get"],
    react: "⚡",
    desc: "Save status or messages (Images, Videos, Audio, Stickers, Text).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {
    if (!isOwner) return reply(`❌ Owner Only Command!`);
    if (!m.quoted) return reply(`⚠️ Please reply to a status or message.`);

    try {
        const q = m.quoted;
        const myJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        // 1. Handle Text
        if (!q.mtype || q.mtype === 'conversation' || q.mtype === 'extendedTextMessage') {
             if (q.text) {
                 await conn.sendMessage(myJid, { text: q.text });
                 return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
             }
        }

        // 2. Handle Media using your lib/msg.js logic
        // We create a unique filename based on the message ID
        const tempName = path.join(__dirname, '../' + q.id);
        
        // This calls your specific downloadMediaMessage(m, filename) function
        const buffer = await downloadMediaMessage(q, tempName); 

        if (!buffer) return reply("❌ Download failed.");

        let mediaData = {};
        if (q.mtype === 'imageMessage') {
            mediaData = { image: buffer, caption: q.text || "✅ Saved" };
        } else if (q.mtype === 'videoMessage') {
            mediaData = { video: buffer, caption: q.text || "✅ Saved", mimetype: 'video/mp4' };
        } else if (q.mtype === 'audioMessage') {
            mediaData = { audio: buffer, mimetype: "audio/mp4" };
        } else if (q.mtype === 'stickerMessage') {
            mediaData = { sticker: buffer };
        }

        // 3. Send to your Private DM
        await conn.sendMessage(myJid, mediaData);
        
        // 4. Cleanup: Delete the temp file from your server so it doesn't get full
        const extMap = { imageMessage: '.jpg', videoMessage: '.mp4', audioMessage: '.mp3', stickerMessage: '.webp' };
        const fullPath = tempName + (extMap[q.mtype] || '');
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Save Error:", error);
        await reply(`❌ Error: ${error.message}`);
    }
});
