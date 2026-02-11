const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "play2",
    desc: "Download song from YouTube",
    category: "music",
    react: "🎵",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {

    const start = Date.now();
    const query = m.text.split(" ").slice(1).join(" ");

    if (!query) return reply("❗ Give a song name or YouTube link");

    await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });

    try {

        let videoUrl = query;

        // 🎯 If user sends name → search YouTube
        if (!query.startsWith("http")) {
            const searchApi = `https://api.giftedtech.co.ke/api/search/ytsearch?apikey=gifted&query=${encodeURIComponent(query)}`;
            const res = await fetch(searchApi);
            const data = await res.json();

            if (!data.result || data.result.length === 0) {
                return reply("❌ Song not found");
            }

            videoUrl = data.result[0].url;
        }

        // 🎵 Get MP3
        const apiUrl = `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const json = await response.json();

        if (!json.result) {
            return reply("❌ Failed to download audio");
        }

        const speed = Date.now() - start;

        await conn.sendMessage(from, {
            audio: { url: json.result },
            mimetype: "audio/mpeg"
        });

        return reply(`🎧 Downloaded successfully\n⚡ Speed: ${speed}ms`);

    } catch (err) {
        console.error(err);
        reply("❗ Error while processing request");
    }
});
