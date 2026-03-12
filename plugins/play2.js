const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "play2",
    alias: ["song2", "audio2"],
    desc: "YouTube Audio Player (New API Engine)",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender, body }) => {
    try {
        // Fallback for query extraction
        if (!q && body.includes(" ")) {
            q = body.split(" ").slice(1).join(" ");
        }
        
        if (!q) return reply("❓ Please provide a song name or YouTube link.");

        // Initial Reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 1. Fetch Metadata from Search API
        const searchUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl);
        
        if (!searchRes.data.status || !searchRes.data.result.metadata) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Song not found. Try a different title.");
        }

        const meta = searchRes.data.result.metadata;
        const videoUrl = meta.url;

        // 2. Send Metadata/Thumbnail Message
        let desc = `*POPKID-XMD PLAYER (V2)* 🎶\n\n` +
                   `📝 *Title:* ${meta.title}\n` +
                   `👤 *Channel:* ${meta.author.name}\n` +
                   `🕒 *Duration:* ${meta.timestamp}\n\n` +
                   `*Generating high-quality audio...* ⚡`;

        await conn.sendMessage(from, {
            image: { url: meta.thumbnail || meta.image },
            caption: desc,
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

        // 3. Fetch Direct MP3 link from the NEW ytmp3 endpoint
        const downloadApiUrl = `https://api.vreden.my.id/api/v1/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const downloadRes = await axios.get(downloadApiUrl);
        
        // FAIL-SAFE URL EXTRACTION: Checks every possible JSON path
        const finalAudioUrl = downloadRes.data.result?.download?.url || 
                              downloadRes.data.result?.url || 
                              downloadRes.data.url;

        // 4. Send the Audio File
        if (finalAudioUrl && finalAudioUrl.startsWith('http')) {
            await conn.sendMessage(from, { 
                audio: { url: finalAudioUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${meta.title}.mp3`
            }, { quoted: mek });
            
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            // Detailed error logging
            console.error("API ERROR RESPONSE:", downloadRes.data);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ *Download Failed:* The converter is currently busy or blocked by YouTube. Link: ${videoUrl}`);
        }

    } catch (err) {
        console.error("PLAY2 CRITICAL ERROR:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ *Error:* Failed to connect to the download server.");
    }
});
