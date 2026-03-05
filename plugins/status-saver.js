const { cmd } = require('../command')
const { downloadMediaMessage } = require('../lib') // Import from your lib folder

/**
 * 📥 POPKID-MD FINAL STATUS SAVER
 * Specifically fixed for your lib/index.js setup
 */

cmd({
    pattern: "save",
    aliases: ["sv", "s", "sav", "get"],
    react: "⚡",
    desc: "Save status or messages (Images, Videos, Audio, Stickers, Text).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner, sender }) => {
    // Owner Security Check
    if (!isOwner) return reply(`❌ Owner Only Command!`);

    // Check for quoted status/message
    if (!m.quoted) return reply(`⚠️ Please reply to/quote a status or message.`);

    try {
        let mediaData;
        const q = m.quoted;

        // 1. Handle Plain Text Status/Messages
        if (!q.mtype || q.mtype === 'conversation' || q.mtype === 'extendedTextMessage') {
             if (q.text) {
                 return await conn.sendMessage(sender, { text: q.text }, { quoted: mek });
             }
             return reply("❌ No content found to save.");
        }

        // 2. Handle Media (Images, Videos, Audio, Stickers)
        // Use downloadMediaMessage from your lib as exported in lib/index.js
        const buffer = await downloadMediaMessage(q); 
        
        if (!buffer) return reply("❌ Failed to download media.");

        if (q.mtype === 'imageMessage') {
            mediaData = { image: buffer, caption: q.text || "✅ Status Saved" };
        } else if (q.mtype === 'videoMessage') {
            mediaData = { video: buffer, caption: q.text || "✅ Status Saved", mimetype: 'video/mp4' };
        } else if (q.mtype === 'audioMessage') {
            mediaData = { audio: buffer, mimetype: "audio/mp4" };
        } else if (q.mtype === 'stickerMessage') {
            mediaData = { sticker: buffer };
        } else {
            return reply(`❌ Unsupported message type: ${q.mtype}`);
        }

        // 3. Send to your Private DM
        await conn.sendMessage(sender, mediaData, { quoted: mek });
        
        // 4. Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Save Error:", error);
        await reply(`❌ Failed to save. Error: ${error.message}`);
    }
});
