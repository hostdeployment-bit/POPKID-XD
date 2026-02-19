const config = require('../config');
const { cmd } = require('../command');
const { handleCall } = require('../lib/anticall');

// Command to turn it ON or OFF
cmd({
    pattern: "anticall",
    desc: "Toggle automatic call rejection",
    category: "owner",
    filename: __filename
}, async (conn, m, mek, { from, reply, args }) => {
    if (!args[0]) return reply("📍 *Usage:* .anticall on / .anticall off");

    const mode = args[0].toLowerCase();

    if (mode === "on") {
        config.ANTICALL = "true";
        await conn.sendMessage(from, { react: { text: "📵", key: mek.key } });
        return reply("🛡️ *Anticall is now ON.* (Calls will be rejected automatically)");
    } 
    
    else if (mode === "off") {
        config.ANTICALL = "false";
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return reply("🔓 *Anticall is now OFF.*");
    } 
    
    else {
        return reply("❓ Use *.anticall on* or *.anticall off*");
    }
});

/** * This part depends on your framework's ability to handle custom events.
 * We register it to listen for 'call' data.
 */
cmd({
    on: "call" 
}, async (conn, call) => {
    await handleCall(conn, call);
});
