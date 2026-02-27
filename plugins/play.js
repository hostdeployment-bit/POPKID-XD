const { cmd } = require('../command');
const axios = require('axios');

const SEARCH_API = "https://api.yupra.my.id/api/search/spotify?q=";
const DOWNLOAD_API = "https://api.yupra.my.id/api/downloader/spotify?url=";

cmd({
    pattern: "play",
    alias: ["spotify", "spdl"],
    desc: "Download Spotify song using name or link",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

    try {

        if (!q) {
            return reply("🎧 Please provide song name or Spotify link");
        }

        await conn.sendMessage(from, {
            react: { text: "🔎", key: mek.key }
        });

        let spotifyUrl = q;

        // If user entered song name → search Spotify
        if (!q.includes("spotify.com")) {

            const search = await axios.get(
                SEARCH_API + encodeURIComponent(q)
            );

            if (!search.data.status || !search.data.result.length) {
                return reply("❌ Song not found");
            }

            spotifyUrl = search.data.result[0].url;
        }

        await conn.sendMessage(from, {
            react: { text: "⬇️", key: mek.key }
        });

        // Download from Spotify downloader API
        const { data } = await axios.get(
            DOWNLOAD_API + encodeURIComponent(spotifyUrl)
        );

        if (!data.status) {
            return reply("❌ Failed to download song");
        }

        const result = data.result;

        const title = result.title;
        const artist = result.artist;
        const image = result.image;
        const downloadUrl = result.download.url;

        // Send thumbnail + info
        await conn.sendMessage(from, {

            image: { url: image },
            caption:
`🎧 *SPOTIFY DOWNLOADER*

🎵 Title: ${title}
👤 Artist: ${artist}

⬇️ Downloading audio...`

        }, { quoted: mek });

        // Send audio
        await conn.sendMessage(from, {

            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`

        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    }

    catch (err) {

        console.error(err);
        reply("❌ Error downloading song");

    }

});
