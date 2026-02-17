const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "play",
    desc: "Fast downloader for Popkid",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name, Popkid!");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 1. Updated McTwize Search (Handles multi-word queries better)
        const searchUrl = `https://mctwize.co.za/search?q=${encodeURIComponent(q)}`;
        
        // Adding headers makes McTwize think you are a real phone, preventing 400 errors
        const { data: searchHtml } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' }
        });
        
        const $ = cheerio.load(searchHtml);

        // Find the first video/song card
        const firstSong = $('.video-card a').first();
        const songPath = firstSong.attr('href');
        const songTitle = firstSong.find('.video-title').text().trim() || q;

        if (!songPath) {
            return reply("❌ Song not found. Try a simpler name like: .play Fave Mr Man");
        }

        // 2. Navigate to Download Page
        const downloadPage = `https://mctwize.co.za${songPath}`;
        const { data: downloadHtml } = await axios.get(downloadPage);
        const $$ = cheerio.load(downloadHtml);

        // 3. Find the DIRECT MP3 Link
        // McTwize links often change, so we look for ANY link that contains "download" and "mp3"
        let downloadUrl = $$('a[href*="/download/"][href*="mp3"]').attr('href') 
                       || $$('a:contains("Download MP3")').attr('href');

        if (!downloadUrl) return reply("❌ Download link not available for this song.");

        // Ensure the URL is full
        const finalUrl = downloadUrl.startsWith('http') ? downloadUrl : `https://mctwize.co.za${downloadUrl}`;

        // 4. Send the Audio
        await conn.sendMessage(from, {
            audio: { url: finalUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: songTitle,
                    body: "POPKID-MD FAST DL",
                    thumbnailUrl: "https://files.catbox.moe/aapw1p.png", // Default Popkid Icon
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ System Busy. Error: ${e.message}`);
    }
});
