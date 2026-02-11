const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "app",
    desc: "Search app on HappyMod / F-Droid and send APK",
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
        // Gifted HappyMod API
        const api = `https://api.giftedtech.co.ke/api/search/happymod?apikey=gifted&query=${encodeURIComponent(query)}`;
        const res = await fetch(api);
        const json = await res.json();

        if (!json.success || !json.results || !json.results.data || !json.results.data.length) {
            return reply("❌ No apps found");
        }

        // Take first app result
        const app = json.results.data[0];

        if (!app.url) return reply("❌ APK download not available for this app");

        // fetch APK buffer
        const apkBuffer = await fetch(app.url).then(r => r.buffer());

        const speed = Date.now() - start;

        // send APK as document
        await conn.sendMessage(from, {
            document: apkBuffer,
            fileName: `${app.name}.apk`,
            mimetype: "application/vnd.android.package-archive",
            caption: `📱 *${app.name}*\n📝 ${app.summary}\n📦 Source: ${app.source}\n⚡ Speed: ${speed}ms`
        });

    } catch (err) {
        console.error(err);
        reply("❗ Error while fetching app");
    }
});
