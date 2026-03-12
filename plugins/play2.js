const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "play2",
    alias: ["song2"],
    desc: "Improved YouTube Player with Auto-Fallback",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender, body }) => {
    try {
        if (!q && body.includes(" ")) q = body.split(" ").slice(1).join(" ");
        if (!q) return reply("❓ Please provide a song name.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API 1: Fetching Metadata
        const searchUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl);
        
        if (!searchRes.data.status || !searchRes.data.result.metadata) {
            return reply("❌ Could not find the song.");
        }

        const meta = searchRes.data.result.metadata;
        
        // Send the "Processing" message first so the user isn't waiting in silence
        let desc = `*POPKID-XMD PLAYER* 🎶\n\n📝 *Title:* ${meta.title}\n🕒 *Duration:* ${meta.timestamp}\n\n*Trying to generate audio link...* ⚡`;
        await conn.sendMessage(from, { image: { url: meta.thumbnail }, caption: desc }, { quoted: mek });

        // ATTEMPT 1: Primary API Download
        let audioUrl = searchRes.data.result.download?.url;

        // ATTEMPT 2: Fallback (If Attempt 1 failed)
        if (!audioUrl) {
            try {
                // Using an alternative endpoint from the same provider or a different one
                const fallbackUrl = `https://api.vreden.my.id/api/v1/download/ytmp3?url=${encodeURIComponent(meta.url)}`;
                const fallbackRes = await axios.get(fallbackUrl);
                audioUrl = fallbackRes.data.result?.download?.url || fallbackRes.data.result?.url;
            } catch (e) {
                console.log("Fallback failed too.");
            }
        }

        if (audioUrl) {
            await conn.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${meta.title}.mp3`
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            // Final Error if all attempts fail
            reply(`❌ *Server Busy:* The API is currently unable to convert this specific song. Please try again in a few minutes or try another song.`);
        }

    } catch (err) {
        console.error("PLAY2 ERROR:", err);
        reply("❌ *Error:* Something went wrong on the server side.");
    }
});
