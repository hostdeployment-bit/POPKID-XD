const { cmd } = require('../command')

cmd({
    pattern: "promote",
    alias: ["admin"],
    react: "👑",
    desc: "Promote a member to admin",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply, mentionedJid, quoted }) => {
    try {
        if (!isGroup) return reply("❌ Group only command");

        // Identify the user: either mentioned or from a replied message
        const user = mentionedJid[0] || (quoted ? quoted.sender : null);
        
        if (!user) return reply("❌ Please mention or reply to the user you want to promote.");

        await conn.groupParticipantsUpdate(from, [user], "promote")

        reply(`✅ User @${user.split('@')[0]} has been promoted to Admin!`, { mentions: [user] })
    } catch (e) {
        console.log(e)
        reply("❌ Failed to promote (make sure bot is admin and user is in the group)")
    }
})
