const { cmd } = require('../command')

/**
 * 📥 POPKID-MD Status & Message Saver
 * Adapted from context to support all media types and private delivery.
 */

cmd({
    pattern: "save",
    aliases: ["sv", "s", "sav", "get"],
    react: "⚡",
    desc: "Save status or messages (Images, Videos, Audio, Stickers, Text).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner, sender, body }) => {
    // 1. Owner Security Check
    if (!isOwner) return reply(`❌ Owner Only Command!`);

    // 2. Extract Quoted Message
    const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                     mek.message?.imageMessage?.contextInfo?.quotedMessage || 
                     mek.message?.videoMessage?.contextInfo?.quotedMessage;

    if (!quotedMsg) {
        return reply(`⚠️ Please reply to/quote a message.`);
    }

    try {
        let mediaData;
        // Use the internal download function from your sms utility
        const q = m.quoted ? m.quoted : m;

        // 3. Media Extraction Logic based on Type
        if (quotedMsg.imageMessage) {
            const buffer = await q.download();
            mediaData = { image: buffer, caption: quotedMsg.imageMessage.caption || "" };
        } 
        else if (quotedMsg.videoMessage) {
            const buffer = await q.download();
            mediaData = { video: buffer, caption: quotedMsg.videoMessage.caption || "" };
        } 
        else if (quotedMsg.audioMessage) {
            const buffer = await q.download();
            mediaData = { audio: buffer, mimetype: "audio/mp4" };
        } 
        else if (quotedMsg.stickerMessage) {
            const buffer = await q.download();
            mediaData = { sticker: buffer };
        } 
        else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
            const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
            mediaData = { text: text };
        } 
        else {
            return reply(`❌ Unsupported message type.`);
        }

        // 4. Send the recovered data to your Private DM (sender)
        await conn.sendMessage(sender, mediaData, { quoted: mek });
        
        // 5. Success Reaction
        if (typeof conn.sendMessage === 'function') {
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

    } catch (error) {
        console.error("Save Error:", error);
        await reply(`❌ Failed to save. Error: ${error.message}`);
    }
});
