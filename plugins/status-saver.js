const { cmd } = require('../command')

cmd({
    pattern: "save",
    alias: ["get"],
    desc: "Save status updates",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // Check if there is a quoted message
        if (!m.quoted) return reply("❌ Please reply to a status update.");

        // Check if the quoted message actually contains media
        const mime = m.quoted.mimetype || "";
        if (!mime) return reply("❌ No media found to save.");

        reply("⏳ *Downloading status...*");

        // Download using the internal library method
        const media = await m.quoted.download();
        if (!media) throw new Error("Download failed");

        const isVideo = mime.includes('video');
        
        await conn.sendMessage(from, { 
            [isVideo ? 'video' : 'image']: media, 
            caption: m.quoted.text || "✅ Status Saved",
            mimetype: mime
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ *Failed to save media!*\n\nError: " + e.message);
    }
})
