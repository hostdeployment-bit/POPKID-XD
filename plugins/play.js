const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "play",
    desc: "Download music accurately using Aswin Sparky API",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Please provide a song name or Spotify link, Popkid!");
        }

        const query = args.join(" ");
        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

        let finalUrl = query;

        // 1. Search YouTube if the input is not a link
        if (!query.startsWith("http")) {
            const searchRes = await axios.get(`https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`);
            if (!searchRes.data.status || !searchRes.data.results.length) {
                return reply("❌ Song not found.");
            }
            finalUrl = searchRes.data.results[0].url;
        }

        // 2. Fetch data from the Aswin Sparky API
        const apiUrl = `https://aswin-sparky.koyeb.app/api/downloader/spotify?url=${encodeURIComponent(finalUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) {
            return reply("❌ Failed to fetch audio from the API.");
        }

        // 3. Extracting exact fields from your working result
        const audioDownloadUrl = data.data.download; 
        const songTitle = data.data.title;
        const artist = data.data.artist || "Unknown Artist";

        // 4. Send confirmation message
        await reply(`🎶 *Popkid-MD Player*\n\n📌 *Title:* ${songTitle}\n👤 *Artist:* ${artist}\n📦 *Status:* Sending Audio...`);

        // 5. Send Audio File accurately
        await conn.sendMessage(from, { 
            audio: { url: audioDownloadUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3` // Keeps file recognition stable
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ System Error: API is currently unresponsive.");
    }
});
