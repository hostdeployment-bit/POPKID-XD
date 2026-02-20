const { cmd } = require('../command');
const { setAnti, getAnti, setPath, getPath } = require('../data');

cmd({
    pattern: "antidelete",
    desc: "Control AntiDelete system",
    category: "settings",
    filename: __filename
}, async (conn, m, mek, { from, args, reply }) => {

    if (!args[0]) {
        const status = await getAnti();
        const path = await getPath();
        return reply(`🗑️ *ANTIDELETE SETTINGS*

Status : ${status ? "✅ ON" : "❌ OFF"}
Path   : ${path}

Usage:
.antidelete on
.antidelete off
.antidelete inbox
.antidelete chat`);
    }

    const option = args[0].toLowerCase();

    if (option === "on") {
        await setAnti(true);
        return reply("✅ AntiDelete Enabled");
    }

    if (option === "off") {
        await setAnti(false);
        return reply("❌ AntiDelete Disabled");
    }

    if (option === "inbox") {
        await setPath("inbox");
        return reply("📥 Deleted messages will be sent to your inbox");
    }

    if (option === "chat") {
        await setPath("chat");
        return reply("💬 Deleted messages will be restored in same chat");
    }

    return reply("❌ Invalid option\nUse: on / off / inbox / chat");
});
