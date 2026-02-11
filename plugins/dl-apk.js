const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "app",
    desc: "Search and send app APK",
    category: "search",
    react: "📱",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {

    const start = Date.now();
    const query = m.text.split(" ").slice(1).join(" ").trim();

    if (!query) return reply("❗ Send an app name to search");

    // ping-style reaction
    await conn.sendMessage(from, { react: { text: "🔎", key: mek.key } });

    try {
        // Gifted Play Store API
        const api = `https://api.giftedtech.co.ke/api/search/playstore?apikey=gifted&query=${encodeURIComponent(query)}`;
        const res = await fetch(api);
        const json = await res.json();

        if (!json.success || !json.result || !json.result.length) {
            return reply("❌ No apps found");
        }

        // Take first app result
        const app = json.result[0];
        const downloadUrl = app.download_url; // Gifted provides this

        if (!downloadUrl) return reply("❌ Download link not available for this app");

        // fetch APK into buffer
        const apkBuffer = await fetch(downloadUrl).then(r => r.buffer());

        const speed = Date.now() - start;

        // send as document
        await conn.sendMessage(from, {
            document: apkBuffer,
            fileName: `${app.title}.apk`,
            mimetype: "application/vnd.android.package-archive",
            caption: `📱 *${app.title}*\n👤 Developer: ${app.developer}\n⚡ Speed: ${speed}ms`
        });

    } catch (err) {
        console.error(err);
        reply("❗ Error while fetching app");
    }
});
