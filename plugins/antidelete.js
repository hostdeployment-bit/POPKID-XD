const { cmd } = require('../command');
const { setAnti, getAnti } = require('../data/antidel');
const { AntiDelete } = require('../lib/antidel');

cmd({
    pattern: "antidelete",
    alias: ["antidel"],
    desc: "Toggle Antidelete for Groups and DMs",
    category: "owner",
    filename: __filename
}, async (conn, m, mek, { from, reply, args }) => {
    if (!args[0]) {
        const status = await getAnti();
        return reply(`📍 *Antidelete Status:* ${status ? 'ON' : 'OFF'}\nUsage: .antidelete on / off`);
    }

    if (args[0] === "on") {
        await setAnti(true);
        return reply("🛡️ *Antidelete Enabled.* (Works for Groups & DMs)");
    } else if (args[0] === "off") {
        await setAnti(false);
        return reply("🔓 *Antidelete Disabled.*");
    }
});

// The actual listener for deletions
cmd({
    on: "messages.update"
}, async (conn, updates) => {
    await AntiDelete(conn, updates);
});
