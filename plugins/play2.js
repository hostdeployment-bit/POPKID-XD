const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "play2",
    alias: ["song2", "audio2"],
    desc: "Download and play audio from YouTube",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender, body }) => {
    try {
        // Fallback: If 'q' is empty, try to extract it manually from the message body
        // This fixes the issue where the bot doesn't "see" the song name
        if (!q && body.includes(" ")) {
            q = body.split(" ").slice(1).join(" ");
        }

        if (!q) return reply("❓ Please provide a song name or YouTube link.");

        // Initial Reaction
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // Fetching data from the API
        const apiUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if the API returned a valid result
        if (!data || !data.status || !data.result || !data.result.metadata) {
            return reply("❌ Song not found. Please try a different title.");
        }

        const meta = data.result.metadata;
        const downloadData = data.result.download;

        // Create the description message
        let desc = `*POPKID-XMD AUDIO PLAYER* 🎶\n\n` +
                   `📝 *Title:* ${meta.title}\n` +
                   `👤 *Channel:* ${meta.author.name}\n` +
                   `🕒 *Duration:* ${meta.timestamp}\n` +
                   `👁️ *Views:* ${meta.views.toLocaleString()}\n` +
                   `📅 *Uploaded:* ${meta.ago}\n` +
                   `🔗 *Link:* ${meta.url}\n\n` +
                   `*Processing your audio... Please wait.* ⚡`;

        // Send Metadata with Thumbnail
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

        // Check for download URL
        if (downloadData && downloadData.url) {
            await conn.sendMessage(from, { 
                audio: { url: downloadData.url }, 
                mimetype: 'audio/mpeg',
                fileName: `${meta.title}.mp3`
            }, { quoted: mek });
            
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            return reply(`❌ *Download Error:* The API could not provide a download link for this song.`);
        }

    } catch (err) {
        console.error("PLAY2 ERROR:", err);
        reply("❌ *An error occurred while fetching the audio.*");
    }
});
