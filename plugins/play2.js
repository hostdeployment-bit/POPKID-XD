const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "play2",
    alias: ["song2", "audio2"],
    desc: "YouTube Audio Player (Elite Engine)",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender, body }) => {
    try {
        if (!q && body.includes(" ")) q = body.split(" ").slice(1).join(" ");
        if (!q) return reply("❓ Please provide a song name or link.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 1. Get Metadata (Thumbnail & Title) from Search
        const searchUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl);
        
        if (!searchRes.data.status || !searchRes.data.result.metadata) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find the song.");
        }

        const meta = searchRes.data.result.metadata;

        // 2. Send Metadata Message
        await conn.sendMessage(from, {
            image: { url: meta.thumbnail || meta.image },
            caption: `*POPKID-XMD PLAYER* 🎶\n\n📌 *Title:* ${meta.title}\n🕒 *Duration:* ${meta.timestamp}\n👤 *Channel:* ${meta.author.name}\n\n*Fetching your audio file...* ⚡`,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                    newsletterName: config.OWNER_NAME || 'POPKID',
                    serverMessageId: 1
                }
            }
        }, { quoted: mek });

        // 3. Get Download Link from the NEW Elite API
        const eliteApiUrl = `https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(meta.url)}`;
        const downloadRes = await axios.get(eliteApiUrl);

        // Based on the response you provided: downloadRes.data.result.download
        const finalAudioUrl = downloadRes.data.result?.download;

        if (finalAudioUrl && finalAudioUrl.startsWith('http')) {
            // 4. Send the Audio File
            await conn.sendMessage(from, { 
                audio: { url: finalAudioUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${meta.title}.mp3`
            }, { quoted: mek });
            
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Server Busy:* The download link could not be generated at this time.");
        }

    } catch (err) {
        console.error("ELITE PLAY ERROR:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ *Error:* Failed to fetch audio. Try again shortly.");
    }
});
