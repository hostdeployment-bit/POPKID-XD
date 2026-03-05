const { cmd } = require('../command')

/**
 * 📥 POPKID-MD FINAL STATUS SAVER
 * Fixed: Uses working download() method and private delivery
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
    // Owner Security
    if (!isOwner) return reply(`❌ Owner Only Command!`);

    // Check for quoted status/message
    if (!m.quoted) return reply(`⚠️ Please reply to/quote a status or message.`);

    try {
        let mediaData;
        const q = m.quoted; // Uses internal sms utility

        // Validate if media exists
        if (!q.mtype || q.mtype === 'conversation') {
             if (q.text) {
                 return await conn.sendMessage(sender, { text: q.text }, { quoted: mek });
             }
             return reply("❌ No media found to save.");
        }

        // Processing Media
        if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'].includes(q.mtype)) {
            const buffer = await q.download(); // Use internal download utility
            
            if (q.mtype === 'imageMessage') {
                mediaData = { image: buffer, caption: q.text || "✅ Status Saved" };
            } else if (q.mtype === 'videoMessage') {
                mediaData = { video: buffer, caption: q.text || "✅ Status Saved", mimetype: 'video/mp4' };
            } else if (q.mtype === 'audioMessage') {
                mediaData = { audio: buffer, mimetype: "audio/mp4" };
            } else if (q.mtype === 'stickerMessage') {
                mediaData = { sticker: buffer };
            }
        }

        // Send to Private DM
        await conn.sendMessage(sender, mediaData, { quoted: mek });
        
        // Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Save Error:", error);
        await reply(`❌ Failed to save. Error: ${error.message}`);
    }
});
