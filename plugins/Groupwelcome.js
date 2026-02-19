const config = require('../config');
const { cmd } = require('../command');

// --- WELCOME COMMAND ---
cmd({
    pattern: "welcome",
    desc: "Turn welcome messages on or off",
    category: "group",
    filename: __filename
}, async (conn, m, mek, { from, l, quote, reply, isGroup, participants, args }) => {
    try {
        if (!isGroup) return reply("✨ This command is for groups only.");
        
        // Admin Check
        const groupMetadata = await conn.groupMetadata(from);
        const isAdmin = groupMetadata.participants.find(p => p.id === m.sender && (p.admin === 'admin' || p.admin === 'superadmin'));
        if (!isAdmin) return reply("❌ *Admin access required.*");

        if (!args[0]) return reply("📍 *Usage:* .welcome on / .welcome off");

        if (args[0].toLowerCase() === "on") {
            config.WELCOME = "true";
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return await reply("🌟 *Welcome messages enabled!*");
        } else if (args[0].toLowerCase() === "off") {
            config.WELCOME = "false";
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await reply("🚫 *Welcome messages disabled!*");
        } else {
            return reply("❓ Use *on* or *off*");
        }
    } catch (e) {
        console.log(e);
        reply("Error toggling welcome.");
    }
});

// --- GOODBYE COMMAND ---
cmd({
    pattern: "goodbye",
    desc: "Turn goodbye messages on or off",
    category: "group",
    filename: __filename
}, async (conn, m, mek, { from, l, quote, reply, isGroup, participants, args }) => {
    try {
        if (!isGroup) return reply("✨ This command is for groups only.");
        
        // Admin Check
        const groupMetadata = await conn.groupMetadata(from);
        const isAdmin = groupMetadata.participants.find(p => p.id === m.sender && (p.admin === 'admin' || p.admin === 'superadmin'));
        if (!isAdmin) return reply("❌ *Admin access required.*");

        if (!args[0]) return reply("📍 *Usage:* .goodbye on / .goodbye off");

        // Note: Your current groupevents.js uses config.WELCOME for both. 
        // If you want separate control, you'd need config.GOODBYE in your config file.
        if (args[0].toLowerCase() === "on") {
            config.GOODBYE = "true"; 
            await conn.sendMessage(from, { react: { text: "👋", key: mek.key } });
            return await reply("🌟 *Goodbye messages enabled!*");
        } else if (args[0].toLowerCase() === "off") {
            config.GOODBYE = "false";
            await conn.sendMessage(from, { react: { text: "📴", key: mek.key } });
            return await reply("🚫 *Goodbye messages disabled!*");
        } else {
            return reply("❓ Use *on* or *off*");
        }
    } catch (e) {
        console.log(e);
        reply("Error toggling goodbye.");
    }
});
