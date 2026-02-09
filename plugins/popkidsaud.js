const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

// Helper: get buffer
async function getBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return res.data;
}

// ================= PLAY (YT MP3 WITH BUTTONS) =================
cmd({
    pattern: "popkidplay",
    desc: "Download song from YouTube",
    category: "downloader",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!q) return reply("❌ Please provide a song name");

    try {
        await conn.sendMessage(from, { react: { text: "🎶", key: mek.key } });

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found");

        const video = search.videos[0];
        const api = `http://31.220.82.203:2029/api/yta?url=${encodeURIComponent(video.url)}&stream=true`;

        const audioBuffer = await getBuffer(api);

        const timeTag = Date.now();

        const buttons = [
            { buttonId: `aud1_${timeTag}`, buttonText: { displayText: "Audio 🎶" }, type: 1 },
            { buttonId: `aud2_${timeTag}`, buttonText: { displayText: "Voice 🔉" }, type: 1 },
            { buttonId: `aud3_${timeTag}`, buttonText: { displayText: "Document 📄" }, type: 1 }
        ];

        const buttonMessage = {
            image: { url: video.thumbnail },
            caption: `🎵 *${video.title}*\n⏱ ${video.timestamp}\n\nSelect download format:`,
            footer: "POPKID MD",
            buttons: buttons,
            headerType: 4
        };

        const sentMsg = await conn.sendMessage(from, buttonMessage, { quoted: mek });

        // Button handler
        conn.ev.on("messages.upsert", async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg.message) return;

                const btn = msg.message.buttonsResponseMessage;
                if (!btn) return;

                if (msg.key.remoteJid !== from) return;

                const id = btn.selectedButtonId;
                if (!id.endsWith(`_${timeTag}`)) return;

                await conn.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

                if (id.startsWith("aud1")) {
                    // Audio
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/mpeg"
                    }, { quoted: msg });

                } else if (id.startsWith("aud2")) {
                    // Voice note
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true
                    }, { quoted: msg });

                } else if (id.startsWith("aud3")) {
                    // Document
                    await conn.sendMessage(from, {
                        document: audioBuffer,
                        mimetype: "audio/mpeg",
                        fileName: `${video.title}.mp3`.replace(/[^\w\s.-]/gi, "")
                    }, { quoted: msg });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (e) {
                console.error(e);
            }
        });

    } catch (e) {
        console.error(e);
        reply("❌ Failed to download song.");
    }
});

// ================= VIDEO (YT MP4 WITH BUTTONS) =================
cmd({
    pattern: "popkidvideo",
    desc: "Download video from YouTube",
    category: "downloader",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!q) return reply("❌ Please provide a video name");

    try {
        await conn.sendMessage(from, { react: { text: "🎥", key: mek.key } });

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found");

        const video = search.videos[0];
        const api = `http://31.220.82.203:2029/api/ytv?url=${encodeURIComponent(video.url)}&stream=true`;

        const videoBuffer = await getBuffer(api);

        const timeTag = Date.now();

        const buttons = [
            { buttonId: `vid1_${timeTag}`, buttonText: { displayText: "Video 🎥" }, type: 1 },
            { buttonId: `vid2_${timeTag}`, buttonText: { displayText: "Document 📄" }, type: 1 }
        ];

        const buttonMessage = {
            image: { url: video.thumbnail },
            caption: `🎥 *${video.title}*\n⏱ ${video.timestamp}\n\nSelect download format:`,
            footer: "POPKID MD",
            buttons: buttons,
            headerType: 4
        };

        await conn.sendMessage(from, buttonMessage, { quoted: mek });

        // Button handler
        conn.ev.on("messages.upsert", async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg.message) return;

                const btn = msg.message.buttonsResponseMessage;
                if (!btn) return;

                if (msg.key.remoteJid !== from) return;

                const id = btn.selectedButtonId;
                if (!id.endsWith(`_${timeTag}`)) return;

                await conn.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

                if (id.startsWith("vid1")) {
                    // Normal video
                    await conn.sendMessage(from, {
                        video: videoBuffer,
                        mimetype: "video/mp4",
                        caption: `🎥 ${video.title}`
                    }, { quoted: msg });

                } else if (id.startsWith("vid2")) {
                    // Document
                    await conn.sendMessage(from, {
                        document: videoBuffer,
                        mimetype: "video/mp4",
                        fileName: `${video.title}.mp4`.replace(/[^\w\s.-]/gi, "")
                    }, { quoted: msg });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (e) {
                console.error(e);
            }
        });

    } catch (e) {
        console.error(e);
        reply("❌ Failed to download video.");
    }
});
