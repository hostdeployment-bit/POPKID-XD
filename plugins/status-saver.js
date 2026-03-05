const { cmd } = require('../command')

/**
 * 📥 POPKID-MD Status Saver
 * Usage: Reply to a status with .save or .get
 */

cmd({
    pattern: "save",
    alias: ["get", "download"],
    desc: "Save the status update you replied to.",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // 1. Check if the user is replying to a message
        if (!m.quoted) return reply("❌ Please reply to the status update you want to save.");

        // 2. Check if the quoted message is from a status broadcast
        // Note: fromMe check is removed so you can save your own or others' statuses
        if (m.quoted.chat !== 'status@broadcast') {
            return reply("❌ This command only works when replying to a WhatsApp Status.");
        }

        reply("⏳ *Downloading status...*");

        // 3. Download the media from the quoted message
        const media = await m.quoted.download();
        const type = m.quoted.mtype; // imageMessage, videoMessage, etc.

        // 4. Send the media back to the current chat
        if (type === 'imageMessage') {
            await conn.sendMessage(from, { 
                image: media, 
                caption: m.quoted.text || "✅ Status Saved by POPKID-MD" 
            }, { quoted: mek });
        } else if (type === 'videoMessage') {
            await conn.sendMessage(from, { 
                video: media, 
                caption: m.quoted.text || "✅ Status Saved by POPKID-MD",
                mimetype: 'video/mp4'
            }, { quoted: mek });
        } else {
            return reply("❌ Unsupported status type (only images and videos are supported).");
        }

    } catch (e) {
        console.error("Status Saver Error: ", e);
        reply("❌ Failed to save status. Make sure the status hasn't expired.");
    }
})
