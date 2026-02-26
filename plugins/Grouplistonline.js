const { cmd } = require('../command')

cmd({
    pattern: "listonline",
    alias: ["online"],
    react: "🟢",
    desc: "Show online members (maximum accuracy possible)",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {

    try {

        if (!isGroup) return reply("❌ Group only command")

        // subscribe to presence
        await conn.presenceSubscribe(from)

        // wait longer for better accuracy
        await new Promise(resolve => setTimeout(resolve, 3000))

        const metadata = await conn.groupMetadata(from)
        const participants = metadata.participants

        const presences = conn.presences?.[from] || {}

        let onlineUsers = []

        for (const user of Object.keys(presences)) {

            const presence = presences[user]?.lastKnownPresence

            if (
                presence === "available" ||
                presence === "composing" ||
                presence === "recording"
            ) {
                onlineUsers.push(user)
            }

        }

        let text =
            "╭───────────────◆\n" +
            "│ 🟢 ONLINE USERS\n" +
            `│ 👥 Total: ${onlineUsers.length}\n` +
            "╰───────────────◆\n\n"

        if (onlineUsers.length > 0) {

            onlineUsers.forEach(user => {
                text += `◦ @${user.split("@")[0]}\n`
            })

        } else {

            text += "No online users detected"

        }

        return conn.sendMessage(from, {
            text,
            mentions: onlineUsers
        }, { quoted: mek })

    }
    catch (e) {

        console.log(e)

        return reply("❌ Failed to fetch online users")

    }

})
