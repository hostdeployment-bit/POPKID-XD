const { cmd } = require('../command');
const yts = require("yt-search");
const axios = require("axios");

const NEWSLETTER = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID MD";
const API = "https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=";

cmd({
    pattern: "play",
    alias: ["p", "music", "song"],
    desc: "Download Audio from YouTube",
    category: "downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name, Popkid!");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 1. Search YouTube
        const search = await yts(q);
        const video = search.videos?.[0];
        if (!video) return reply("❌ No song found");

        // 2. Fetch from GiftedTech API
        const { data } = await axios.get(API + encodeURIComponent(video.url));
        if (!data || !data.success || !data.result?.download_url) {
            return reply("❌ Failed to get download link from API.");
        }

        const { title, thumbnail, download_url } = data.result;

        // 3. Send Preview Image
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: `🎶 *POPKID MD PLAYER*\n\n⿻ *Title:* ${title}\n⿻ *Duration:* ${video.timestamp}\n\n⏳ *Sending audio...*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: NEWSLETTER,
                    newsletterName: NEWSLETTER_NAME
                }
            }
        }, { quoted: mek });

        // 4. Send Playable Audio (Fixed for "Not Available" Error)
        await conn.sendMessage(from, {
            audio: { url: download_url },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`, // Essential for playback support
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "Popkid-MD Music",
                    mediaType: 1,
                    thumbnailUrl: thumbnail,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error(error);
        reply("❌ Error: API is busy or link is broken.");
    }
});
