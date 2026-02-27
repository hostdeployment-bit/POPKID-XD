const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd({
    pattern: "play",
    alias: ["p"],
    desc: "Simply play audio from YouTube",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name, Popkid!");

        // 1. Quick Search
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });

        // 2. Fetch Audio from API
        const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(video.url)}&format=mp3`;
        const { data } = await axios.get(apiURL);

        if (!data || !data.downloadLink) return reply("❌ Failed to get audio link.");

        // 3. Simple Info Message
        const caption = `🎶 *Popkid-MD Player*\n\n` +
                        `📌 *Title:* ${video.title}\n` +
                        `⏱️ *Duration:* ${video.timestamp}\n` +
                        `🔗 *Link:* ${video.url}`;

        await conn.sendMessage(from, { 
            image: { url: video.thumbnail }, 
            caption 
        }, { quoted: mek });

        // 4. Send Audio File
        await conn.sendMessage(from, {
            audio: { url: data.downloadLink },
            mimetype: "audio/mpeg",
            fileName: `${video.title}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Error processing request.");
    }
});
