const { cmd } = require('../command')

// global store inside this plugin
let presenceStore = {}

cmd({
    pattern: "listonline",
    alias: ["online", "onlinelist"],
    react: "🟢",
    desc: "Show online group members",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {

    try {

        if (!isGroup) return reply("❌ Group only command")

        // initialize group store
        if (!presenceStore[from]) {
            presenceStore[from] = {}
        }

        // listen once safely
        const listener = (update) => {

            if (update.id === from) {

                for (const user in update.presences) {

                    presenceStore[from][user] =
                        update.presences[user].lastKnownPresence

                }

            }

        }

        conn.ev.on("presence.update", listener)

        // subscribe to group presence
        await conn.presenceSubscribe(from)

        // wait to gather presence info
        await new Promise(resolve => setTimeout(resolve, 2000))

        // get metadata
        const metadata = await conn.groupMetadata(from)

        let onlineUsers = []

        for (const participant of metadata.participants) {

            const jid = participant.id

            const presence = presenceStore[from][jid]

            if (
                presence === "available" ||
                presence === "composing" ||
                presence === "recording"
            ) {
                onlineUsers.push(jid)
            }

        }

        // remove listener after use
        conn.ev.off("presence.update", listener)

        // build message
        let text =
            "╭───────────────◆\n" +
            "│ 🟢 ONLINE USERS\n" +
            `│ 👥 Total: ${onlineUsers.length}\n` +
            "╰───────────────◆\n\n"

        if (onlineUsers.length > 0) {

            for (const user of onlineUsers) {
                text += `◦ @${user.split("@")[0]}\n`
            }

        } else {

            text += "No users currently online"

        }

        return await conn.sendMessage(from, {
            text,
            mentions: onlineUsers
        }, { quoted: mek })

    }
    catch (err) {

        console.log("ListOnline Error:", err)

        return reply("❌ Failed to fetch online users")

    }

})
