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

        if (!q) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("Please provide a song name");
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // Search YouTube
        const search = await yts(q);

        if (!search.videos || search.videos.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("No song found");
        }

        const video = search.videos[0];
        const videoUrl = video.url;

        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        // Call GiftedTech API
        const res = await axios.get(API + encodeURIComponent(videoUrl));
        const data = res.data;

        if (!data.success) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("Download failed");
        }

        const title = data.result.title;
        const thumbnail = data.result.thumbnail;
        const downloadUrl = data.result.download_url;
        const quality = data.result.quality;

        // Send thumbnail info with newsletter context
        await conn.sendMessage(
            from,
            {
                image: { url: thumbnail },
                caption:
`🎶 *${NEWSLETTER_NAME} AUDIO DOWNLOADER*

⿻ Title: ${title}
⿻ Quality: ${quality}

Sending audio...`,
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

        // Send audio directly from URL (better than buffer)
        await conn.sendMessage(
            from,
            {
                audio: { url: downloadUrl },
                mimetype: "audio/mpeg",
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

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {

        console.error("Play Error:", err);

        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("Failed to download audio. Try again later.");

    }

});
