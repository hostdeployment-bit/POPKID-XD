const { cmd } = require('../command')

// temporary presence store (standalone)
const presenceStore = {}

cmd({
    pattern: "listonline",
    alias: ["online", "onlinelist"],
    react: "🟢",
    desc: "Show currently online group members",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {

    try {

        if (!isGroup) {
            return reply("❌ Group only command")
        }

        // initialize store for this group
        if (!presenceStore[from]) {
            presenceStore[from] = {}
        }

        // listen for presence updates (standalone)
        conn.ev.on("presence.update", (update) => {

            if (update.id === from) {

                for (let user in update.presences) {

                    presenceStore[from][user] = update.presences[user]

                }

            }

        })

        // subscribe to presence
        await conn.presenceSubscribe(from)

        // wait to collect presence data
        await new Promise(resolve => setTimeout(resolve, 1500))

        // get group metadata
        const metadata = await conn.groupMetadata(from)
        const participants = metadata.participants

        let onlineUsers = []

        for (let member of participants) {

            const jid = member.id
            const presenceData = presenceStore[from][jid]

            if (presenceData) {

                const state = presenceData.lastKnownPresence

                if (
                    state === "available" ||
                    state === "composing" ||
                    state === "recording"
                ) {
                    onlineUsers.push(jid)
                }

            }

        }

        // no users
        if (onlineUsers.length === 0) {

            return reply(
                "╭───────────────◆\n" +
                "│ 🟢 ONLINE USERS\n" +
                "│ 👥 Total: 0\n" +
                "╰───────────────◆"
            )

        }

        // build result
        let message =
            "╭───────────────◆\n" +
            "│ 🟢 ONLINE USERS\n" +
            `│ 👥 Total: ${onlineUsers.length}\n` +
            "╰───────────────◆\n\n"

        for (let user of onlineUsers) {

            message += `◦ @${user.split("@")[0]}\n`

        }

        await conn.sendMessage(from, {
            text: message,
            mentions: onlineUsers
        }, { quoted: mek })

    }
    catch (error) {

        console.log("ListOnline Error:", error)

        return reply("❌ Failed to fetch online users")

    }

})
