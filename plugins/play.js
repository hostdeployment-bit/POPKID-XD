const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "song", // Changed pattern to song
    desc: "Download audio from YouTube by name or link",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Give me a song name or YouTube link!\n\nExample:\n.song arike kumnie\n.song https://youtu.be/xxxx");
        }

        const query = args.join(" ");  
        const start = Date.now();  

        // Changed reaction to music icon
        await conn.sendMessage(from, { react: { text: "🎶", key: mek.key } });  

        let videoUrl = query;  

        // Search logic (Same as video)
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {  
            const searchUrl = `https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`;  
            const searchRes = await axios.get(searchUrl);  

            if (!searchRes.data.status || !searchRes.data.results || searchRes.data.results.length === 0) {  
                return reply("❌ No results found for that song.");  
            }  

            videoUrl = searchRes.data.results[0].url;  
        }  

        // Download logic using the same Jawad-Tech API
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoUrl)}`;  
        const { data } = await axios.get(apiUrl);  

        // Check for mp3 instead of mp4
        if (!data.status || !data.result || !data.result.mp3) {  
            return reply("❌ Failed to get the audio. Try another link or name.");  
        }  

        const title = data.result.title || "YouTube Audio";  
        const audioDownloadUrl = data.result.mp3; // Using mp3 link

        const end = Date.now();  
        const speed = end - start;  

        await reply(  
            `🎶 *YouTube Audio Downloader*\n\n` +  
            `📌 *Title:* ${title}\n` +  
            `⚡ *Speed:* ${speed} ms\n\n` +  
            `⬇️ Sending audio...`  
        );  

        // Send as Audio/MPEG
        await conn.sendMessage(from, {  
            audio: { url: audioDownloadUrl },  
            mimetype: "audio/mpeg",  
            fileName: `${title}.mp3`
        }, { quoted: mek });  

    } catch (err) {  
        console.error(err);  
        reply("❌ Error while processing your audio request.");  
    }
});
