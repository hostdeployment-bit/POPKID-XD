const { cmd } = require('../command')

cmd({
    pattern: "save",
    aliases: ["sv", "s", "sav", "get"],
    react: "⚡",
    desc: "Save status or messages (Images, Videos, Audio, Stickers, Text).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner, sender }) => {
    if (!isOwner) return reply(`❌ Owner Only Command!`);

    // Ensure there is a quoted message
    if (!m.quoted) return reply(`⚠️ Please reply to/quote a message.`);

    try {
        let mediaData;
        const q = m.quoted; // This uses the sms utility from your lib folder

        // Logic for different media types using the .download() method
        if (q.mtype === 'imageMessage') {
            const buffer = await q.download(); 
            mediaData = { image: buffer, caption: q.text || "" };
        } 
        else if (q.mtype === 'videoMessage') {
            const buffer = await q.download();
            mediaData = { video: buffer, caption: q.text || "" };
        } 
        else if (q.mtype === 'audioMessage') {
            const buffer = await q.download();
            mediaData = { audio: buffer, mimetype: "audio/mp4" };
        } 
        else if (q.mtype === 'stickerMessage') {
            const buffer = await q.download();
            mediaData = { sticker: buffer };
        } 
        else if (q.mtype === 'conversation' || q.mtype === 'extendedTextMessage') {
            mediaData = { text: q.text };
        } 
        else {
            return reply(`❌ Unsupported message type: ${q.mtype}`);
        }

        // Send to your private DM
        await conn.sendMessage(sender, mediaData, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Save Error:", error);
        await reply(`❌ Failed to save. Error: ${error.message}`);
    }
});
