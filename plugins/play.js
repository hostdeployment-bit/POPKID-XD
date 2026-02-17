const { cmd } = require('../command');
const axios = require('axios');
const { createButtons } = require('gifted-btns'); // Importing the button handler

cmd({
    pattern: "play",
    desc: "Fetch audio/video details from YouTube",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❗ Please provide a YouTube URL.");

        // 1. Fetch data from your specific API
        const apiUrl = `https://rest.alyabotpe.xyz/dl/youtubeplay?url=${encodeURIComponent(q)}&key=stellar-PSnzL1zZ`;
        const response = await axios.get(apiUrl);
        
        if (!response.data || !response.data.status) {
            return reply("❌ API Error: Could not retrieve media information.");
        }

        const info = response.data.data;
        const title = info.title;
        const thumbnail = info.thumbnail;
        
        // 2. Extract specific URLs (Selecting the first entry for each)
        const videoUrl = info.videos?.[0]?.url;
        const audioUrl = info.audios?.[0]?.url;

        if (!videoUrl && !audioUrl) return reply("❌ No downloadable links found.");

        // 3. Prepare the display message
        let caption = `🎬 *YOUTUBE DOWNLOADER*\n\n`;
        caption += `📝 *Title:* ${title}\n\n`;
        caption += `*Tap a button below to get your file:*`;

        // 4. Create Buttons using gifted-btns
        // We pass the URL in the ID so the listener knows what to download
        const buttons = [
            { type: 'reply', text: '🎧 Audio (MP3)', id: `download_mp3|${audioUrl}` },
            { type: 'reply', text: '🎥 Video (MP4)', id: `download_mp4|${videoUrl}` }
        ];

        // 5. Send the message
        return await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: caption,
            footer: 'Powered by Alyabot API',
            buttons: buttons,
            headerType: 4
        }, { quoted: mek });

    } catch (e) {
        console.error("Play Command Error:", e);
        return reply("❌ *Error:* " + e.message);
    }
});
