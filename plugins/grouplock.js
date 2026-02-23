const { cmd } = require('../command')

cmd({
    pattern: "lockgc",
    alias: ["lock"],
    react: "🔒",
    desc: "Lock the group",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only command");

        // Directly attempt to lock (no admin checks)
        await conn.groupSettingUpdate(from, "locked")

        reply("🔒 Group locked successfully")
    } catch (e) {
        console.log(e)
        reply("❌ Failed to lock group (make sure bot is admin)")
    }
})
