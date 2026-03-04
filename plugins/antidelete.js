const { cmd } = require('../command')
const config = require('../config')

/**
 * 🛡️ POPKID-MD Anti-Delete System
 * Handles: Message Recovery and Destination Control (DM vs Chat)
 * Creator: Popkid Ke
 */

cmd({
    on: "body" 
},
async (conn, mek, m, { from, isGroup, isOwner }) => {
    // 1. Check if Anti-Delete is globally enabled
    if (config.ANTI_DELETE !== "true") return;

    // 2. Detect the 'Delete' signal (protocolMessage type 0)
    if (m.message && m.message.protocolMessage && m.message.protocolMessage.type === 0) {
        const key = m.message.protocolMessage.key;
        
        // 3. Retrieve the saved message from the bot's memory/database
        // This relies on 'await saveMessage(mek)' being in your index.js
        const deletedMsg = await conn.loadMessage(key.remoteJid, key.id);
        
        if (!deletedMsg) return; // Cannot recover if it wasn't saved first

        const participant = key.participant || key.remoteJid;
        const user = participant.split('@')[0];
        
        // 4. Decide where to send the recovered message
        // If ANTI_DEL_PATH is "inbox", it goes to your Private DM
        // If it's "chat", it goes back into the same group/chat where it was deleted
        const target = config.ANTI_DEL_PATH === "inbox" ? conn.user.id : from;

        let report = `🛡️ *POPKID-MD ANTI-DELETE* 🛡️\n\n`;
        report += `👤 *User:* @${user}\n`;
        report += `📍 *Location:* ${isGroup ? "Group Chat" : "Private Chat"}\n`;
        report += `📥 *Sent to:* ${config.ANTI_DEL_PATH === "inbox" ? "Owner Inbox" : "Current Chat"}\n`;
        report += `⏰ *Time:* ${new Date().toLocaleString()}\n\n`;
        report += `📝 *Recovered Content:* 👇`;

        // 5. Send the report and mention the user
        await conn.sendMessage(target, { 
            text: report, 
            mentions: [participant] 
        }, { quoted: deletedMsg });

        // 6. Forward the actual media or text that was deleted
        return await conn.copyNForward(target, deletedMsg, false);
    }
});

// ============ CONTROL COMMANDS ============

// Command to turn Anti-Delete ON or OFF
cmd({
    pattern: "antidelete",
    desc: "Toggle Anti-Delete ON or OFF",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { q, isOwner, reply }) => {
    if (!isOwner) return reply("❌ Owner only!");
    
    if (q === "on") {
        config.ANTI_DELETE = "true";
        reply("✅ *Anti-Delete enabled.* I will now capture deleted messages.");
    } else if (q === "off") {
        config.ANTI_DELETE = "false";
        reply("❌ *Anti-Delete disabled.*");
    } else {
        reply("*Usage:* .antidelete on/off");
    }
});

// Command to change the destination (Inbox or Chat)
cmd({
    pattern: "antidelpath",
    desc: "Set where deleted messages are sent (inbox or chat)",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { q, isOwner, reply }) => {
    if (!isOwner) return reply("❌ Owner only!");
    
    if (q === "inbox") {
        config.ANTI_DEL_PATH = "inbox";
        reply("📥 *Anti-Delete path set to Private Inbox.* (Messages will be sent to you only)");
    } else if (q === "chat") {
        config.ANTI_DEL_PATH = "chat";
        reply("📍 *Anti-Delete path set to Current Chat.* (Messages will be sent back where they were deleted)");
    } else {
        reply("*Usage:* .antidelpath inbox OR .antidelpath chat");
    }
});
