const { cmd } = require('../command');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

const SEARCH_API = "https://api.yupra.my.id/api/search/spotify?q=";
const DOWNLOAD_API = "https://api.yupra.my.id/api/downloader/spotify?url=";

cmd({
    pattern: "play",
    alias: ["spotify", "spdl"],
    desc: "Download Spotify songs using link or search",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botFooter, botPic }) => {

    try {

        if (!q) {
            return reply("🎧 Provide Spotify link or song name");
        }

        await conn.sendMessage(from, {
            react: { text: "🔎", key: mek.key }
        });

        let spotifyUrl = q;

        // If not Spotify link, search
        if (!q.includes("spotify.com")) {

            const searchRes = await axios.get(
                SEARCH_API + encodeURIComponent(q)
            );

            if (!searchRes.data.status || !searchRes.data.result.length) {
                return reply("❌ Song not found on Spotify");
            }

            spotifyUrl = searchRes.data.result[0].url;
        }

        await conn.sendMessage(from, {
            react: { text: "⬇️", key: mek.key }
        });

        // Download
        const { data } = await axios.get(
            DOWNLOAD_API + encodeURIComponent(spotifyUrl)
        );

        if (!data.status) {
            return reply("❌ Failed to download song");
        }

        const result = data.result;

        const title = result.title;
        const artist = result.artist;
        const image = result.image || botPic;
        const downloadUrl = result.download.url;

        const id = Date.now();

        const caption = `
✨ *POP KID MD SPOTIFY DOWNLOADER*

🎵 Title: ${title}
👤 Artist: ${artist}
💿 Quality: MP3

Select format below
`;

        await sendButtons(conn, from, {

            title: "Spotify Downloader",
            text: caption,
            footer: botFooter || "popkid ai 🇰🇪",
            image: image,

            buttons: [
                { id: `aud_${id}`, text: "🎵 Audio" },
                { id: `doc_${id}`, text: "📁 Document" },
                { id: `ptt_${id}`, text: "🔉 Voice Note" }
            ]

        });

        const handler = async (event) => {

            const msg = event.messages[0];
            if (!msg.message) return;

            const selected =
                msg.message?.templateButtonReplyMessage?.selectedId ||
                msg.message?.buttonsResponseMessage?.selectedButtonId;

            if (!selected || !selected.includes(id)) return;
            if (msg.key.remoteJid !== from) return;

            const type = selected.split("_")[0];

            await conn.sendMessage(from, {
                react: { text: "📥", key: msg.key }
            });

            if (type === "aud") {

                await conn.sendMessage(from, {
                    audio: { url: downloadUrl },
                    mimetype: "audio/mpeg"
                }, { quoted: msg });

            }

            else if (type === "doc") {

                await conn.sendMessage(from, {
                    document: { url: downloadUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title}.mp3`
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

        };

        conn.ev.on("messages.upsert", handler);

        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    }
    catch (e) {
        console.log(e);
        reply("❌ Error: " + e.message);
    }
});
