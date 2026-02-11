const { cmd } = require('../command');
const fetch = require('node-fetch');
const yts = require('yt-search');

cmd({
    pattern: "video2",
    desc: "Download YouTube video (mp4)",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {

    const start = Date.now();
    const query = m.text.split(" ").slice(1).join(" ").trim();

    if (!query) return reply("❗ Send a video name or YouTube link");

    // ping-style reaction
    await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });

    try {
        let videoUrl = query;
        let title = "";
        let thumbnail = "";

        // 🔎 If not a link → search YouTube locally
        if (!/^https?:\/\//i.test(query)) {
            const search = await yts(query);
            if (!search.videos.length) return reply("❌ Video not found");

            const v = search.videos[0];
            videoUrl = v.url;
            title = v.title;
            thumbnail = v.thumbnail;
        }

        // 🎥 Gifted MP4 API
        const api = `https://api.giftedtech.co.ke/api/download/dlmp4?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;
        const res = await fetch(api);
        const json = await res.json();

        if (!json.success || !json.result || !json.result.download_url) {
            return reply("❌ Failed to fetch video");
        }

        const { download_url } = json.result;

        // ✅ download real video buffer (avoids WhatsApp playback errors)
        const videoBuffer = await fetch(download_url).then(r => r.buffer());

        const speed = Date.now() - start;

        // preview (clean premium)
        await conn.sendMessage(from, {
            image: { url: thumbnail || json.result.thumbnail },
            caption: `🎬 *${title || json.result.title}*\n⚡ Speed: ${speed}ms`
        });

        // send playable video
        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: "video/mp4",
            fileName: `${title || json.result.title}.mp4`,
            caption: `▶️ ${title || json.result.title}`
        });

    } catch (err) {
        console.error(err);
        reply("❗ Error while downloading video");
    }
});
