const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "play",
    desc: "Download and play music from YouTube",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) return reply("Please provide a YouTube URL or song name! 🎵");

        // 1. React to show the bot is processing
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // 2. Call your custom API
        // Note: If 'q' is a name, you might need a search step first, 
        // but here we assume 'q' is the URL as per your API example.
        const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(q)}&format=mp3`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.success) {
            return reply("❌ Failed to fetch audio. Please check the link.");
        }

        const { title, downloadURL } = data;

        // 3. Send the Audio with Context Info (External Ad Reply)
        await conn.sendMessage(from, {
            audio: { url: downloadURL },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: title,
                    body: "Popkid AI - Music Downloader",
                    thumbnailUrl: `https://img.youtube.com/vi/${q.split('v=')[1]?.split('&')[0] || 'k_-ipa1VasM'}/0.jpg`,
                    sourceUrl: q,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // 4. Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
