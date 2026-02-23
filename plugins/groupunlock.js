const { cmd } = require('../command')

cmd({
    pattern: "unlockgc",
    alias: ["unlock"],
    react: "🔓",
    desc: "Unlock the group",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only command");

        // Direct unlock without admin checks
        await conn.groupSettingUpdate(from, "unlocked")

        reply("🔓 Group unlocked successfully")
    } catch (e) {
        console.log(e)
        reply("❌ Failed to unlock group (make sure bot is admin)")
    }
})
