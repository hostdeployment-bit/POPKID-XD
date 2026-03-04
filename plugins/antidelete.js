const config = require('../config')
const { cmd } = require('../command')

/**
 * 🛠️ ANTI-DELETE CONTROLS
 * Toggle the system and change the delivery path.
 */

// 1. Toggle Anti-Delete ON/OFF
cmd({
    pattern: "antidelete",
    alias: ["antidel"],
    desc: "Turn Anti-Delete system ON or OFF.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { q, isOwner, reply }) => {
    if (!isOwner) return reply("❌ Owner only!");
    
    if (q === "on") {
        config.ANTI_DELETE = "true";
        reply("✅ *Anti-Delete is now ENABLED.* I will capture deleted messages.");
    } else if (q === "off") {
        config.ANTI_DELETE = "false";
        reply("❌ *Anti-Delete is now DISABLED.*");
    } else {
        reply("*Usage:* .antidelete on/off");
    }
})

// 2. Change Delivery Path (DM or Chat)
cmd({
    pattern: "antidelpath",
    desc: "Set where deleted messages are sent (inbox/chat).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { q, isOwner, reply }) => {
    if (!isOwner) return reply("❌ Owner only!");
    
    if (q === "inbox") {
        config.ANTI_DEL_PATH = "inbox";
        reply("📥 *Recovered messages will be sent to your Private DM.*");
    } else if (q === "chat") {
        config.ANTI_DEL_PATH = "chat";
        reply("📍 *Recovered messages will be sent back to the same Chat.*");
    } else {
        reply("*Usage:* .antidelpath inbox (Private) OR .antidelpath chat (Public)");
    }
})

// 3. Status Check
cmd({
    pattern: "antidelstatus",
    desc: "Check Anti-Delete current status.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { isOwner, reply }) => {
    if (!isOwner) return reply("❌ Owner only!");
    const status = `🛡️ *ANTI-DELETE STATUS*
    
🟢 *Enabled:* ${config.ANTI_DELETE}
📍 *Path:* ${config.ANTI_DEL_PATH}
💾 *Storage:* Active (via data.js)`;
    return reply(status);
})
