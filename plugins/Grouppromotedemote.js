const { cmd } = require('../command');

// FORCE PROMOTE
cmd({
    pattern: "promote",
    desc: "Promote a member to admin (Direct)",
    category: "group",
    filename: __filename
}, async (conn, m, mek, { from, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This is for groups only.");
        
        // We only check if the BOT is admin, because it physically needs it to work.
        if (!isBotAdmins) return reply("❌ I must be admin to promote others.");

        let user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
        if (!user) return reply("❗ Please tag or reply to a user.");

        // Direct action without checking the sender's rank
        await conn.groupParticipantsUpdate(from, [user], "promote");
        
        return await conn.sendMessage(from, { 
            text: `✅ Action Successful: @${user.split('@')[0]} promoted.`, 
            mentions: [user] 
        }, { quoted: mek });

    } catch (e) {
        // If it fails (e.g., if you weren't actually allowed), it fails silently or with a simple error.
        console.error(e);
        reply("❌ Action failed. Ensure I have the correct permissions.");
    }
});

// FORCE DEMOTE
cmd({
    pattern: "demote",
    desc: "Demote an admin to member (Direct)",
    category: "group",
    filename: __filename
}, async (conn, m, mek, { from, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This is for groups only.");
        if (!isBotAdmins) return reply("❌ I must be admin to demote others.");

        let user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
        if (!user) return reply("❗ Please tag or reply to an admin.");

        // Direct action
        await conn.groupParticipantsUpdate(from, [user], "demote");

        return await conn.sendMessage(from, { 
            text: `📉 Action Successful: @${user.split('@')[0]} demoted.`, 
            mentions: [user] 
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ Action failed.");
    }
});
