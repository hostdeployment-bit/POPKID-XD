const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "play",
    desc: "Download music from YouTube or Spotify accurately",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Please provide a song name, Spotify link, or YouTube link!");
        }

        const query = args.join(" ");
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        let audioUrl = "";
        let title = "";

        // 1. Check if it's a Spotify Link
        if (query.includes("spotify.com")) {
            const spotifyApi = `https://api.yupra.my.id/api/download/spotify?url=${encodeURIComponent(query)}`;
            const { data } = await axios.get(spotifyApi);

            if (data.status && data.result) {
                // Using the exact result path you provided
                audioUrl = data.result.download.url;
                title = `${data.result.title} - ${data.result.artist}`;
            } else {
                return reply("❌ Spotify API could not find the song.");
            }
        } 
        
        // 2. Otherwise, treat as YouTube (Search + Download)
        else {
            let youtubeLink = query;
            
            // Search via Yupra if it's just text
            if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
                const search = await axios.get(`https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`);
                if (!search.data.status || !search.data.results.length) return reply("❌ Song not found on YouTube.");
                youtubeLink = search.data.results[0].url;
            }

            // Download via Jawad-Tech (Your confirmed working API)
            const download = await axios.get(`https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(youtubeLink)}`);
            if (download.data.status && download.data.result) {
                audioUrl = download.data.result.mp3;
                title = download.data.result.title;
            } else {
                return reply("❌ YouTube API error. Please try again.");
            }
        }

        // 3. Final Step: Send the Audio File
        await conn.sendMessage(from, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: "Popkid-MD Player",
                    body: title,
                    mediaType: 1,
                    sourceUrl: "https://github.com/Popkid", // Optional: Your profile link
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ System Error: " + e.message);
    }
});
