const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "play",
    desc: "Fast music downloader via McTwize",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name, Popkid!");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 1. Search McTwize
        const searchUrl = `https://mctwize.co.za/search?q=${encodeURIComponent(q)}`;
        const { data: searchHtml } = await axios.get(searchUrl);
        const $ = cheerio.load(searchHtml);

        // Find the first result link and title
        const firstResult = $('.video-card a').first();
        const songPath = firstResult.attr('href');
        const songTitle = $('.video-card .video-title').first().text().trim();

        if (!songPath) return reply("❌ Song not found on McTwize.");

        // 2. Navigate to Download Page
        const downloadPageUrl = songPath.startsWith('http') ? songPath : `https://mctwize.co.za${songPath}`;
        const { data: downloadHtml } = await axios.get(downloadPageUrl);
        const $$ = cheerio.load(downloadHtml);

        // 3. Extract the Direct MP3 Link
        // McTwize usually lists download buttons; we target the Audio/MP3 one
        const directDownloadUrl = $$('a:contains("Download MP3"), a[href*=".mp3"]').first().attr('href');

        if (!directDownloadUrl) return reply("❌ Could not find a direct download link.");

        // 4. Send with Buttons (using gifted-btns)
        const btnList = [
            { buttonId: `.down_mp3 ${directDownloadUrl}`, buttonText: { displayText: '🎵 Confirm MP3' }, type: 1 }
        ];

        const buttonMessage = {
            image: { url: $$('video').attr('poster') || 'https://telegra.ph/file/ba64a13e617d5b8823f95.jpg' },
            caption: `*Title:* ${songTitle}\n*Source:* McTwize Fast Server\n\nClick below to receive your audio:`,
            footer: 'POPKID-MD BY POPKID',
            buttons: btnList,
            headerType: 4
        };

        await conn.sendMessage(from, buttonMessage, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ McTwize Error: ${e.message}`);
    }
});
