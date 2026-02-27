const yts = require("yt-search");
const axios = require("axios");
const { cmd } = require('../command');

const GIFTED_API = "https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=";

// Newsletter settings
const NEWSLETTER_JID = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "𝙋𝙊𝙋𝙆𝙄𝘿 𝙈𝘿";
const BOT_NAME = "Popkid XD";

cmd({
    pattern: "play",
    aliases: ["ytmp3", "music", "song", "yta"],
    category: "downloader",
    react: "🎶",
    desc: "Download Audio from Youtube",
    filename: __filename
}, async (conn, m, mek, { from, reply, react, botPic, botName, gmdBuffer, formatAudio, q }) => {

    try {

        if (!q) {
            await react("❌", mek.key);
            return reply("Please provide a song name");
        }

        // Ping-style search start
        const start = Date.now();
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        const searchTime = Date.now() - start;

        // Search YouTube
        const search = await yts(q);
        if (!search.videos.length) {
            await react("❌", mek.key);
            return reply("No song found");
        }

        const video = search.videos[0];
        const videoUrl = video.url;

        await react("⬇️", mek.key);

        // Call GiftedTech API
        const { data } = await axios.get(GIFTED_API + encodeURIComponent(videoUrl));
        if (!data.success) {
            await react("❌", mek.key);
            return reply("Download failed");
        }

        const downloadUrl = data.result.download_url;
        const title = data.result.title;
        const thumbnail = data.result.thumbnail;

        // Get audio buffer
        const buffer = await gmdBuffer(downloadUrl);
        const convertedAudio = await formatAudio(buffer);

        // Send thumbnail with newsletter style
        await conn.sendMessage(from, {
            image: { url: thumbnail || botPic },
            caption:
`🎶 *${botName} AUDIO DOWNLOADER*

⿻ Title: ${title}
⿻ Duration: ${video.timestamp}

Downloading took: ${searchTime}ms
Sending audio...`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: NEWSLETTER_JID,
                    newsletterName: NEWSLETTER_NAME,
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: title,
                    body: NEWSLETTER_NAME,
                    mediaType: 1,
                    thumbnailUrl: thumbnail || botPic,
                    renderLargerThumbnail: false,
                    showAdAttribution: false,
                    sourceUrl: videoUrl
                }
            }
        });

        // Send audio
        await conn.sendMessage(from, {
            audio: convertedAudio,
            mimetype: "audio/mpeg",
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: NEWSLETTER_JID,
                    newsletterName: NEWSLETTER_NAME,
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: title,
                    body: NEWSLETTER_NAME,
                    mediaType: 1,
                    thumbnailUrl: thumbnail || botPic,
                    renderLargerThumbnail: false,
                    showAdAttribution: false,
                    sourceUrl: videoUrl
                }
            }
        });

        await react("✅", mek.key);

    } catch (error) {
        console.error("Play Error:", error);
        await react("❌", mek.key);
        reply("Failed to download audio. Try again later.");
    }

});
