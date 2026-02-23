const { cmd } = require('../command')

cmd({
    pattern: "unlockgc",
    alias: ["unlock"],
    react: "🔓",
    desc: "Unlock the group",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, sender, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only command");

        const metadata = await conn.groupMetadata(from)

        const admins = metadata.participants
            .filter(p => p.admin)
            .map(p => p.id.split(':')[0])

        const user = sender.split(':')[0]
        const bot = conn.user.id.split(':')[0]

        if (!admins.includes(user))
            return reply("❌ Admin only command");

        if (!admins.includes(bot))
            return reply("❌ Bot must be admin");

        await conn.groupSettingUpdate(from, "unlocked")

        reply("🔓 Group unlocked successfully")
    } catch (e) {
        console.log(e)
        reply("❌ Error unlocking group")
    }
})
