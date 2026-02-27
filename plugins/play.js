const { cmd } = require('../command');
const yts = require("yt-search");
const axios = require("axios");

const NEWSLETTER = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID MD";
const GIFTED_API = "https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=";

// Query GiftedTech API
const queryGiftedAPI = async (videoUrl) => {
    const { data } = await axios.get(GIFTED_API + encodeURIComponent(videoUrl));
    if (!data.success) return { success: false };
    return { 
        success: true, 
        download_url: data.result.download_url, 
        title: data.result.title, 
        thumbnail: data.result.thumbnail, 
        quality: "128kbps" 
    };
};

cmd({
    pattern: "play",
    aliases: ["ytmp3", "ytmp3doc", "audiodoc", "yta"],
    category: "downloader",
    react: "🎶",
    description: "Download Audio from Youtube",
    filename: __filename
},
async (from, Gifted, conText) => {
    const { q, reply, react, botPic, botName, gmdBuffer, formatAudio } = conText;

    if (!q) {
        await react("❌");
        return reply("Please provide a song name");
    }

    try {
        await react("🔍");

        // Search YouTube
        const searchRes = await yts(q);
        if (!searchRes.videos.length) return reply("No video found for your query.");

        const video = searchRes.videos[0];
        const videoUrl = video.url;

        // Query GiftedTech API
        const apiRes = await queryGiftedAPI(videoUrl);
        if (!apiRes.success) {
            await react("❌");
            return reply("Download service unavailable. Try later.");
        }

        await react("⬇️");

        // Fetch buffer and convert properly
        const buffer = await gmdBuffer(apiRes.download_url);
        const audioBuffer = await formatAudio(buffer); // Ensure WhatsApp-compatible format

        // Send as **playable audio** with thumbnail
        await Gifted.sendMessage(
            from,
            {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                fileName: `${apiRes.title}.mp3`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: NEWSLETTER,
                        newsletterName: NEWSLETTER_NAME
                    },
                    externalAdReply: {
                        title: apiRes.title,
                        body: NEWSLETTER_NAME,
                        mediaType: 1,
                        thumbnailUrl: apiRes.thumbnail || botPic,
                        renderLargerThumbnail: true,
                        sourceUrl: videoUrl
                    }
                },
                caption: `🎶 *${botName} AUDIO PLAYER*\n⿻ Title: ${apiRes.title}\n⿻ Quality: ${apiRes.quality}`
            }
        );

        await react("✅");

    } catch (err) {
        console.error("Play command error:", err);
        await react("❌");
        reply("Oops! Something went wrong. Please try again.");
    }
});
