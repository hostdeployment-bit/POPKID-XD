const { cmd } = require('../command');
const speedTest = require('speedtest-net');

cmd({
    pattern: "speedtest",
    alias: ["speed", "st"],
    desc: "Check the bot server internet speed",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {
    try {
        // 1. Initial reaction to show the test has started
        await conn.sendMessage(from, { react: { text: "⚡", key: mek.key } });
        await reply("⏳ *Running Speed Test... Please wait.*");

        // 2. Run the speed test
        // This process can take 15-30 seconds
        const result = await speedTest({ acceptLicense: true, acceptGdpr: true });

        // 3. Format the result
        const downloadSpeed = (result.download.bandwidth / 125000).toFixed(2); // Convert to Mbps
        const uploadSpeed = (result.upload.bandwidth / 125000).toFixed(2);     // Convert to Mbps
        const ping = result.ping.latency.toFixed(2);

        const speedMsg = `
🚀 *POPKID-MD SPEED TEST*
───────────────────
📡 *ISP:* ${result.isp}
📍 *Location:* ${result.server.location} (${result.server.country})
───────────────────
📥 *Download:* ${downloadSpeed} Mbps
📤 *Upload:* ${uploadSpeed} Mbps
⏳ *Ping:* ${ping} ms
───────────────────
> © Powered by Popkid Ke`;

        // 4. Send the result with a success reaction
        await reply(speedMsg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("SPEEDTEST ERROR:", err);
        reply("❌ *Failed to perform speed test. The server might be busy.*");
    }
});
