const { cmd } = require('../command');
const yts = require("yt-search");
const axios = require("axios");

const NEWSLETTER = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID MD";
const API = "https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=";

cmd({
    pattern: "play",
    alias: ["ytmp3", "music", "song", "yta"],
    desc: "Download Audio from YouTube",
    category: "downloader",
    react: "🎶",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {

    try {

        // No query provided
        if (!q) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Please provide a song name\nExample: .play Shape of You");
        }

        // Searching reaction
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // YouTube search
        const search = await yts(q);
        const video = search.videos?.[0];

        if (!video) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No song found");
        }

        const videoUrl = video.url;

        // Downloading reaction
        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        // Call GiftedTech API
        const response = await axios.get(API + encodeURIComponent(videoUrl), {
            timeout: 60000
        });
        const data = response.data;

        if (!data || !data.success || !data.result?.download_url) {
            throw new Error("API returned invalid response");
        }

        const { title, thumbnail, download_url, quality } = data.result;

        // Send thumbnail preview
        await conn.sendMessage(
            from,
            {
                image: { url: thumbnail },
                caption:
`🎶 *${NEWSLETTER_NAME} AUDIO DOWNLOADER*

⿻ Title: ${title}
⿻ Duration: ${video.timestamp}
⿻ Views: ${video.views.toLocaleString()}
⿻ Quality: ${quality}

⏳ Sending audio...`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: NEWSLETTER,
                        newsletterName: NEWSLETTER_NAME
                    }
                }
            },
            { quoted: mek }
        );

        // Send playable audio
        try {
            // Stream directly from URL (fastest & safest)
            await conn.sendMessage(from, {
                audio: { url: download_url },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`,
                ptt: false
            }, { quoted: mek });
        } catch {
            // Fallback: download buffer then send
            const res = await axios.get(download_url, { responseType: "arraybuffer" });
            const buffer = Buffer.from(res.data);

            await conn.sendMessage(from, {
                audio: buffer,
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`,
                ptt: false
            }, { quoted: mek });
        }

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {

        console.error("Play command error:", error);

        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Failed to download audio. API may be busy. Try again.");
    }

});
