const config = require('../config');
const { cmd } = require('../command');
const { handleCall } = require('../lib/anticall');

// --- THE COMMAND TO ON/OFF ---
cmd({
    pattern: "anticall",
    desc: "Enable/Disable call rejection",
    category: "owner",
    filename: __filename
}, async (conn, m, mek, { from, reply, args }) => {
    if (!args[0]) return reply("📍 *Usage:* .anticall on / .anticall off");

    const status = args[0].toLowerCase();

    if (status === "on") {
        config.ANTICALL = "true";
        await conn.sendMessage(from, { react: { text: "📵", key: mek.key } });
        return reply("🛡️ *Anticall is now ON.* (Calls will be rejected automatically)");
    } 
    
    else if (status === "off") {
        config.ANTICALL = "false";
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return reply("🔓 *Anticall is now OFF.*");
    } 
    
    else {
        return reply("❓ Use *.anticall on* or *.anticall off*");
    }
});

// --- THE CALL LISTENER ---
// This special block ensures the bot listens for calls globally
cmd({
    on: "call" 
}, async (conn, call) => {
    await handleCall(conn, call);
});
