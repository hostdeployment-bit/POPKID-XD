const { cmd } = require('../command');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

cmd({
    pattern: "play2",
    alias: ["song", "music"],
    desc: "Download and play audio from YouTube",
    category: "download",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("*Please provide a song name or YouTube link!* 🎧");

        // 1. Search for the video
        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("*No results found.* ❌");

        let desc = `
╔══════════════════╗
  👑 *POPKID-MD PLAYER*
╚══════════════════╝
📝 *Title:* ${data.title}
🕒 *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👁️ *Views:* ${data.views}
🔗 *Link:* ${data.url}

*Downloading your audio...* 🚀
> © Popkid Ke`;

        // Send thumbnail and details first
        await conn.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        // 2. Define temp file path
        const audioPath = path.join(os.tmpdir(), `${data.videoId}.mp3`);

        // 3. Download using @distube/ytdl-core
        const stream = ytdl(data.url, { 
            filter: 'audioonly', 
            quality: 'highestaudio' 
        });

        const fileStream = fs.createWriteStream(audioPath);
        stream.pipe(fileStream);

        fileStream.on('finish', async () => {
            // 4. Send the Audio File (as a playable audio)
            await conn.sendMessage(from, { 
                audio: { url: audioPath }, 
                mimetype: 'audio/mpeg', 
                fileName: `${data.title}.mp3` 
            }, { quoted: mek });

            // 5. Cleanup the file from system
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }
        });

        fileStream.on('error', (err) => {
            console.error(err);
            reply("*Failed to save audio file.* ✗");
        });

    } catch (e) {
        console.error(e);
        reply("*An error occurred while processing your request.* ❌");
    }
});
