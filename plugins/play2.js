const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "play2",
    alias: ["song", "audio"],
    desc: "Download and play audio from YouTube",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender }) => {
    try {
        if (!q) return reply("❓ Please provide a song name or YouTube link.");

        // Initial Reaction
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // Fetching data from the API
        const apiUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result.metadata) {
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

        // Send Metadata with Thumbnail (Newsletter Style)
        await conn.sendMessage(from, {
            image: { url: meta.thumbnail },
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

        // Check if download URL is available
        if (downloadData && downloadData.url) {
            await conn.sendMessage(from, { 
                audio: { url: downloadData.url }, 
                mimetype: 'audio/mpeg',
                fileName: `${meta.title}.mp3`
            }, { quoted: mek });
            
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            // Handle the "Converting error" or missing link
            return reply(`❌ *Download Error:* The server is currently unable to convert this audio. Link: ${meta.url}`);
        }

    } catch (err) {
        console.error("PLAY CMD ERROR:", err);
        reply("❌ *An error occurred while fetching the audio.*");
    }
});
