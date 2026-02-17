const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

cmd({
    pattern: "play",
    desc: "Download music from Tubidy",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name, Popkid!");

        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

        // 1. Search Tubidy (Updated to latest 2026 domain)
        const baseUrl = 'https://tubidy.cv';
        const searchUrl = `${baseUrl}/search.php?q=${encodeURIComponent(q)}`;
        
        const { data: searchHtml } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        const $ = cheerio.load(searchHtml);

        // Flexible selector: finds the first link that looks like a song result
        const firstResult = $('a[href*="watch/"]').first();
        const songPath = firstResult.attr('href');
        const songTitle = firstResult.text().trim() || "Popkid Music";

        if (!songPath) {
            return reply("❌ Song not found. Try adding the artist name (e.g., .play Burna Boy City Boys)");
        }

        // 2. Navigate to the download options page
        const downloadPageUrl = `${baseUrl}/${songPath}`;
        const { data: downloadHtml } = await axios.get(downloadPageUrl);
        const $$ = cheerio.load(downloadHtml);

        // Find the MP3 download button
        // Tubidy usually hides the direct link behind another button
        const mp3Page = $$('a:contains("MP3")').first().attr('href');
        
        if (!mp3Page) return reply("❌ MP3 format not available for this song.");

        // 3. Get final direct link
        const finalPageUrl = `${baseUrl}/${mp3Page}`;
        const { data: finalHtml } = await axios.get(finalPageUrl);
        const $$$ = cheerio.load(finalHtml);
        const directLink = $$$('a.download-button, a:contains("Download MP3")').first().attr('href');

        if (!directLink) return reply("❌ Failed to capture direct download link.");

        // 4. Send the Audio
        await conn.sendMessage(from, {
            audio: { url: directLink.startsWith('http') ? directLink : `${baseUrl}/${directLink}` },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: songTitle,
                    body: "POPKID-MD TUBIDY",
                    mediaType: 1,
                    sourceUrl: searchUrl,
                    showAdAttribution: true,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("TUBIDY ERROR:", e.message);
        reply(`❌ System Error: ${e.message}`);
    }
});
