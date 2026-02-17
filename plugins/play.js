const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');
const { buttons } = require('gifted-btns'); // Import your buttons library

cmd({
    pattern: "play",
    desc: "Search music with buttons",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name, Popkid!");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 1. Search Tubidy.buzz
        const searchUrl = `https://www39.tubidy.buzz/search.php?q=${encodeURIComponent(q)}`;
        const { data: searchHtml } = await axios.get(searchUrl);
        const $ = cheerio.load(searchHtml);

        const firstSongPath = $('.media-list .media-body a').first().attr('href');
        const songTitle = $('.media-list .media-body a').first().text().trim();

        if (!firstSongPath) return reply("❌ Song not found!");

        // 2. Prepare the Button Message
        // This uses the gifted-btns structure
        const btnList = [
            { buttonId: `.t_audio ${firstSongPath}`, buttonText: { displayText: '🎵 Audio (MP3)' }, type: 1 },
            { buttonId: `.t_video ${firstSongPath}`, buttonText: { displayText: '🎥 Video (MP4)' }, type: 1 }
        ];

        const buttonMessage = {
            text: `*Title:* ${songTitle}\n*Source:* Tubidy.buzz\n\nSelect your format below:`,
            footer: 'POPKID-MD BY POPKID',
            buttons: btnList,
            headerType: 1
        };

        await conn.sendMessage(from, buttonMessage, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ Error fetching results.");
    }
});
