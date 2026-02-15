// --------------------------------------------------
// 🎵 POPKID PLAY - Gifted Scrap Version (CMD)
// --------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const { sendButtons } = require('gifted-btns');

cmd({
    pattern: "kin",
    desc: "Download Audio from YouTube",
    category: "download",
    react: "🎶",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {

    if (!q) return reply("❌ Please provide a song name.");

    try {

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 🔎 Search
        const search = await yts(q);
        if (!search.videos.length)
            return reply("❌ No results found.");

        const video = search.videos[0];
        const videoUrl = video.url;

        // 🎯 GiftedTech API Call
        const apiUrl =
            `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;

        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        if (!data.success || !data.result?.download_url)
            return reply("❌ Download service unavailable.");

        await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

        // 📦 Download Buffer
        const response = await axios.get(data.result.download_url, {
            responseType: "arraybuffer"
        });

        const buffer = Buffer.from(response.data);

        const sizeMB = buffer.length / (1024 * 1024);
        if (sizeMB > 25)
            return reply("❌ File too large to send.");

        // 🔐 Unique ID
        const uniqueId = Date.now();

        // 🎛 Send Gifted Buttons (SCRAP STYLE)
        await sendButtons(conn, from, {
            title: "🎵 POPKID SONG DOWNLOADER",
            text:
`⿻ *Title:* ${video.title}
⿻ *Duration:* ${video.timestamp}
⿻ *Author:* ${video.author.name}

*Select download format:*`,
            footer: "Powered By Popkid XMD",
            image: video.thumbnail,
            buttons: [
                { id: `audio_${uniqueId}`, text: "Audio 🎶" },
                { id: `ptt_${uniqueId}`, text: "Voice Message 🔉" },
                { id: `doc_${uniqueId}`, text: "Audio Document 📄" },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Watch on YouTube",
                        url: video.url
                    })
                }
            ]
        });

        // 🧠 Response Handler
        const handler = async (event) => {

            const msg = event.messages[0];
            if (!msg.message) return;

            const templateReply =
                msg.message?.templateButtonReplyMessage;

            if (!templateReply) return;

            const selectedId = templateReply.selectedId;

            if (!selectedId.includes(uniqueId)) return;
            if (msg.key.remoteJid !== from) return;

            await conn.sendMessage(from, {
                react: { text: "⬇️", key: msg.key }
            });

            try {

                if (selectedId.startsWith("audio_")) {

                    await conn.sendMessage(from, {
                        audio: buffer,
                        mimetype: "audio/mpeg"
                    }, { quoted: msg });

                } else if (selectedId.startsWith("ptt_")) {

                    await conn.sendMessage(from, {
                        audio: buffer,
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true
                    }, { quoted: msg });

                } else if (selectedId.startsWith("doc_")) {

                    await conn.sendMessage(from, {
                        document: buffer,
                        mimetype: "audio/mpeg",
                        fileName: `${video.title}.mp3`
                            .replace(/[^\w\s.-]/gi, "")
                    }, { quoted: msg });

                }

                await conn.sendMessage(from, {
                    react: { text: "✅", key: msg.key }
                });

            } catch (err) {
                console.log(err);
                await conn.sendMessage(from, {
                    react: { text: "❌", key: msg.key }
                });
            }

            conn.ev.off("messages.upsert", handler);
        };

        conn.ev.on("messages.upsert", handler);

        // 🕒 Auto Remove After 2 Minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 120000);

    } catch (err) {
        console.log(err);
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        return reply("❌ Something went wrong.");
    }
});
