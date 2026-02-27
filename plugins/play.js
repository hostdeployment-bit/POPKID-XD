const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "play",
    desc: "Download music using GiftedTech API",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Please provide a song name or link, Popkid!");
        }

        const query = args.join(" ");
        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

        let finalUrl = query;

        // 1. YouTube Search (if input isn't a link)
        if (!query.startsWith("http")) {
            const searchRes = await axios.get(`https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`);
            if (!searchRes.data.status || !searchRes.data.results.length) {
                return reply("❌ Song not found.");
            }
            finalUrl = searchRes.data.results[0].url;
        }

        // 2. Fetch using GiftedTech API (The result structure you provided)
        const apiUrl = `https://api.giftedtech.co.ke/api/download/ytdl?url=${encodeURIComponent(finalUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.success || !data.result) {
            return reply("❌ API error. Please try again later.");
        }

        // Mapping to your new GiftedTech JSON structure
        const audioUrl = data.result.download_url;
        const title = data.result.title;
        const thumbnail = data.result.thumbnail;

        // 3. Simple Status Message
        await reply(`🎶 *Popkid-MD Player*\n\n📌 *Title:* ${title}\n📦 *Status:* Sending...`);

        // 4. Send Audio (Corrected for playback issues)
        await conn.sendMessage(from, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3` // Ensures WhatsApp treats it as a playable file
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ System Error: API might be busy.");
    }
});
