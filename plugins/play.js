const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const { sendButtons } = require('gifted-btns');

const API_BASE = 'https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=';

cmd({
    pattern: "play",
    alias: ["song", "audio", "music"],
    desc: "Download audio using GiftedTech API",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botFooter, botPic }) => {

    try {

        if (!q) return reply("🎵 *Popkid, please provide a song name!*");

        await conn.sendMessage(from, {
            react: { text: "🎶", key: mek.key }
        });

        // Search YouTube
        const search = await yts(q);
        const video = search.videos[0];

        if (!video) return reply("❌ No results found.");

        const dateNow = Date.now();

        // Premium caption
        const caption = `
✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐆𝐈𝐅𝐓𝐄𝐃𝐓𝐄𝐂𝐇 𝐀𝐔𝐃𝐈𝐎* ✨

📝 *Title:* ${video.title}
🕒 *Duration:* ${video.timestamp}
👤 *Author:* ${video.author.name}
👁 *Views:* ${video.views.toLocaleString()}
📅 *Uploaded:* ${video.ago}

🎧 *Select format below*
`.trim();

        // Send buttons
        await sendButtons(conn, from, {

            title: "ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ",
            text: caption,
            footer: botFooter || "ᴘᴏᴘᴋɪᴅ ᴀɪ 🇰🇪",
            image: video.thumbnail || botPic,

            buttons: [

                {
                    id: `aud_${video.id}_${dateNow}`,
                    text: "🎵 Audio (MP3)"
                },

                {
                    id: `doc_${video.id}_${dateNow}`,
                    text: "📁 Document"
                },

                {
                    id: `ptt_${video.id}_${dateNow}`,
                    text: "🔉 Voice Note"
                }

            ]

        });

        // Button handler
        const handler = async (event) => {

            const msg = event.messages[0];
            if (!msg.message) return;

            const selectedId =
                msg.message?.templateButtonReplyMessage?.selectedId ||
                msg.message?.buttonsResponseMessage?.selectedButtonId;

            if (!selectedId) return;
            if (!selectedId.includes(`_${dateNow}`)) return;
            if (msg.key.remoteJid !== from) return;

            await conn.sendMessage(from, {
                react: { text: "⬇️", key: msg.key }
            });

            try {

                // Fetch download from GiftedTech
                const { data } = await axios.get(
                    API_BASE + encodeURIComponent(video.url)
                );

                if (!data.success) {

                    return reply("❌ Failed to fetch audio.");

                }

                const downloadUrl = data.result.download_url;
                const title = data.result.title;

                const type = selectedId.split("_")[0];

                // Send based on type
                if (type === "aud") {

                    await conn.sendMessage(from, {

                        audio: { url: downloadUrl },
                        mimetype: "audio/mpeg",
                        ptt: false

                    }, { quoted: msg });

                }

                else if (type === "doc") {

                    await conn.sendMessage(from, {

                        document: { url: downloadUrl },
                        mimetype: "audio/mpeg",
                        fileName: title + ".mp3",
                        caption: `📁 *${title}*`

                    }, { quoted: msg });

                }

                else if (type === "ptt") {

                    await conn.sendMessage(from, {

                        audio: { url: downloadUrl },
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true

                    }, { quoted: msg });

                }

                await conn.sendMessage(from, {

                    react: { text: "✅", key: msg.key }

                });

            }

            catch (err) {

                console.error(err);
                reply("❌ Download failed.");

            }

        };

        conn.ev.on("messages.upsert", handler);

        setTimeout(() => {

            conn.ev.off("messages.upsert", handler);

        }, 300000);

    }

    catch (e) {

        console.error(e);
        reply("❌ Error: " + e.message);

    }

});
