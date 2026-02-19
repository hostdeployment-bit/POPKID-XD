const config = require('../config');
const { cmd } = require('../command');
const { handleAntilink } = require('../lib/antilink');

cmd({
    pattern: "antilink",
    desc: "Setup antilink actions",
    category: "group",
    filename: __filename
}, async (conn, m, mek, { from, reply, isGroup, args, isAdmins }) => {
    if (!isGroup) return reply("Groups only.");
    if (!isAdmins) return reply("Admin only.");

    const type = args[0] ? args[0].toLowerCase() : '';
    const action = args[1] ? args[1].toLowerCase() : '';

    // .antilink on or .antilink off
    if (type === "on") {
        config.ANTILINK = "true";
        return reply("🛡️ Antilink is now *ON*");
    }
    if (type === "off") {
        config.ANTILINK = "false";
        return reply("🔓 Antilink is now *OFF*");
    }

    // .antilink action delete/warn/kick
    if (type === "action") {
        if (['delete', 'warn', 'kick'].includes(action)) {
            config.ANTILINK_ACTION = action;
            return reply(`✅ Antilink action set to: *${action}*`);
        } else {
            return reply("📍 Usage: \n.antilink action delete\n.antilink action warn\n.antilink action kick");
        }
    }
    
    return reply("📍 *Commands:*\n.antilink on\n.antilink off\n.antilink action <delete/warn/kick>");
});

// Auto-detector
cmd({ on: "body" }, async (conn, m, mek, { isGroup, isAdmins, isOwner }) => {
    await handleAntilink(conn, m, { isAdmins, isOwner });
});
