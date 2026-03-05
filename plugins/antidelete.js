const { cmd } = require('../command');

cmd({
    pattern: "antidelete",
    desc: "Turn Anti-Delete ON or OFF",
    category: "config",
    filename: __filename
}, async (conn, m, mek, { args, reply }) => {
    try {
        if (!args[0]) return reply("📍 *Usage:* .antidelete on / off");
        
        if (args[0] === "on") {
            global.antidelete = true;
            reply("✅ *POPKID XMD Anti-Delete is now ENABLED*");
        } else if (args[0] === "off") {
            global.antidelete = false;
            reply("❌ *POPKID XMD Anti-Delete is now DISABLED*");
        } else {
            reply("❗ *Invalid choice. Use .antidelete on OR off*");
        }
    } catch (err) {
        console.error("TOGGLE ERROR:", err);
        reply("❌ *Failed to change settings.*");
    }
});
