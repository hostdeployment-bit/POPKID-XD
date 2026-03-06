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
    desc: "Download and play audio from YouTube in Popkid style",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender }) => { // Parameter order matched to your ping
    try {
        if (!q) return reply("*Please provide a song name!* 🎧");

        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("*No results found.* ❌");

        // React to the message
        await conn.sendMessage(from, { react: { text: "🎶", key: mek.key } });

        // Define the fakevCard (Popkid Ke)
        const fakevCard = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "Popkid Ke",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:popkid\nORG:popkid;\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        // Context info for newsletter style
        const newsletterContextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            },
            externalAdReply: {
                title: `POPKID PLAYER: ${data.title}`,
                body: "⚡ 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐈𝐍𝐆 𝐀𝐔𝐃𝐈𝐎",
                mediaType: 1,
                thumbnailUrl: data.thumbnail, 
                renderLargerThumbnail: true,
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        // Send info message
        let desc = `*Title:* ${data.title}\n*Duration:* ${data.timestamp}\n*Link:* ${data.url}\n\n> © Popkid Ke`;
        await conn.sendMessage(from, { text: desc, contextInfo: newsletterContextInfo }, { quoted: fakevCard });

        // Download Audio
        const audioPath = path.join(os.tmpdir(), `${data.videoId}.mp3`);
        const stream = ytdl(data.url, { filter: 'audioonly', quality: 'highestaudio' });
        const fileStream = fs.createWriteStream(audioPath);
        stream.pipe(fileStream);

        fileStream.on('finish', async () => {
            await conn.sendMessage(from, { 
                audio: { url: audioPath }, 
                mimetype: 'audio/mpeg', 
                fileName: `${data.title}.mp3` 
            }, { quoted: mek });

            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        });

    } catch (err) {
        console.error("PLAY2 ERROR:", err);
        reply("❌ *Failed to process audio download.*");
    }
});
