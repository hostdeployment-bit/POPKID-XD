const { cmd } = require('../command');

// PROMOTE COMMAND
cmd({
    pattern: "promote",
    desc: "Promote a member to admin",
    category: "group",
    filename: __filename
}, async (conn, m, mek, { from, isGroup, isAdmins, isOwner, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command is only for groups.");
        
        // Allow if user is Admin OR the Bot Owner
        if (!isAdmins && !isOwner) return reply("❌ Only group admins can use this command.");
        
        if (!isBotAdmins) return reply("❌ I need to be an admin to promote others.");

        let user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
        if (!user) return reply("❗ Please tag or reply to a user to promote.");

        await conn.groupParticipantsUpdate(from, [user], "promote");
        return await reply(`✅ @${user.split('@')[0]} has been promoted to Admin successfully.`, { mentions: [user] });
    } catch (e) {
        console.error(e);
        reply("❌ Error: Could not complete promotion.");
    }
});

// DEMOTE COMMAND
cmd({
    pattern: "demote",
    desc: "Demote an admin to member",
    category: "group",
    filename: __filename
}, async (conn, m, mek, { from, isGroup, isAdmins, isOwner, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command is only for groups.");
        
        // Accurate Check: If the sender is NOT an admin AND NOT the owner, block them
        if (!isAdmins && !isOwner) return reply("❌ Only group admins can use this command.");
        
        if (!isBotAdmins) return reply("❌ I need to be an admin to demote others.");

        let user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
        if (!user) return reply("❗ Please tag or reply to an admin to demote.");

        await conn.groupParticipantsUpdate(from, [user], "demote");
        return await reply(`📉 @${user.split('@')[0]} is no longer an Admin.`, { mentions: [user] });
    } catch (e) {
        console.error(e);
        reply("❌ Error: Could not complete demotion.");
    }
});
