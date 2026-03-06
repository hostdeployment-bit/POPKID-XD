const { cmd } = require('../command');
const config = require('../config');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

cmd({
    pattern: "play2",
    alias: ["song2", "music2"],
    desc: "Download and play audio from YouTube",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => { 
    try {
        // 1. Validation
        if (!q) return reply("*Please provide a song name or link!* 🎧");

        // 2. Search Logic
        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("*No results found.* ❌");

        // 3. React to indicate processing
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // 4. Fake vCard for styling (Popkid style)
        const fakevCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: {
                contactMessage: {
                    displayName: "Popkid Ke",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:popkid\nORG:popkid;\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        // 5. Send Info with Newsletter Context
        const newsletterContext = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: 'POPKID XMD PLAYER',
                serverMessageId: 1
            },
            externalAdReply: {
                title: data.title,
                body: "⚡ 𝐒𝐄𝐀𝐑𝐂𝐇𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋",
                mediaType: 1,
                thumbnailUrl: data.thumbnail,
                renderLargerThumbnail: true,
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        await conn.sendMessage(from, { 
            text: `*Title:* ${data.title}\n*Duration:* ${data.timestamp}\n\n> © Popkid Ke`, 
            contextInfo: newsletterContext 
        }, { quoted: fakevCard });

        // 6. Download Process
        const audioPath = path.join(os.tmpdir(), `${data.videoId}.mp3`);
        const stream = ytdl(data.url, { 
            filter: 'audioonly', 
            quality: 'highestaudio' 
        });

        const fileStream = fs.createWriteStream(audioPath);
        stream.pipe(fileStream);

        fileStream.on('finish', async () => {
            // 7. Send the Audio
            await conn.sendMessage(from, { 
                audio: { url: audioPath }, 
                mimetype: 'audio/mpeg', 
                fileName: `${data.title}.mp3` 
            }, { quoted: mek });

            // 8. Cleanup
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        });

        fileStream.on('error', (err) => {
            console.error(err);
            reply("❌ *Error saving file.*");
        });

    } catch (err) {
        console.error("PLAY2 ERROR:", err);
        reply("❌ *Download failed. Try again.*");
    }
});
