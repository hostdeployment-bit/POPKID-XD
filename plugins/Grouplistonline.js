const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "online",
    alias: ["listonline", "whosonline", "whoisonline"],
    react: "🟢",
    desc: "List members currently typing or recording",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply, react }) => {

    try {

        if (!isGroup) {
            await react("❌");
            return reply("❌ This command only works in groups!");
        }

        await react("🔍");
        await reply("🔍 Checking online members... Please wait...");

        // Get group metadata
        const metadata = await conn.groupMetadata(from);
        const participants = metadata.participants;

        let presenceMap = new Map();
        let onlineMembers = [];

        // Presence handler
        const handler = (update) => {

            if (!update.presences) return;

            for (const jid in update.presences) {

                const presence = update.presences[jid];

                presenceMap.set(jid, presence.lastKnownPresence);

            }

        };

        // Listen for presence updates
        conn.ev.on("presence.update", handler);

        // Subscribe to presence of each participant
        for (const member of participants) {

            const jid = member.id || member.jid;

            try {
                await conn.presenceSubscribe(jid);
            } catch {}

            await new Promise(res => setTimeout(res, 150));

        }

        // Wait for presence updates to arrive
        await new Promise(res => setTimeout(res, 3000));

        // Stop listening
        conn.ev.off("presence.update", handler);

        // Filter active members
        for (const member of participants) {

            const jid = member.id || member.jid;

            const presence = presenceMap.get(jid);

            if (
                presence === "composing" ||
                presence === "recording"
            ) {

                onlineMembers.push({
                    jid,
                    name: member.notify || member.name || jid.split("@")[0]
                });

            }

        }

        // No one online
        if (onlineMembers.length === 0) {

            await react("😴");

            return reply(
                "😴 No members are currently typing or recording.\n\n" +
                "_WhatsApp only reveals users who are actively typing or recording._"
            );

        }

        // Format list
        let text =
`🟢 *ACTIVE MEMBERS*

📊 Active: ${onlineMembers.length}
👥 Total: ${participants.length}

`;

        let mentions = [];

        onlineMembers.forEach((user, i) => {

            text += `${i + 1}. @${user.jid.split("@")[0]}\n`;

            mentions.push(user.jid);

        });

        text += "\n_Note: Only shows members typing or recording._";

        await react("✅");

        await conn.sendMessage(from, {
            text: text,
            mentions: mentions,
            contextInfo: {
                forwardingScore: 5,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: config.BOT_NAME || "WhatsApp Bot",
                    newsletterJid: config.NEWSLETTER_JID || "120363000000000000@newsletter"
                }
            }
        }, { quoted: mek });

    } catch (error) {

        console.log(error);

        await react("❌");

        reply(`❌ Failed to check online members.\n\nError: ${error.message}`);

    }

});
