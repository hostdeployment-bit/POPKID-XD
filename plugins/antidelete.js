const { cmd } = require("../command");
const config = require("../config");

// Temporary store for messages
const messageStore = new Map();

cmd({ on: "body" }, async (client, message, m, { isOwner, sender }) => {
    try {
        if (!message?.key || !message.message) return;

        const msgId = message.key.id;

        // 1️⃣ Store normal messages
        if (!message.message.protocolMessage) {
            messageStore.set(msgId, message);

            // Auto-clean after 30 minutes
            setTimeout(() => messageStore.delete(msgId), 30 * 60 * 1000);
            return;
        }

        // 2️⃣ Detect deleted messages
        const proto = message.message.protocolMessage;
        if (proto.type !== 0) return; // 0 = delete
        if (!config.ANTI_DELETE) return;

        const deletedId = proto.key.id;
        const recoveredMsg = messageStore.get(deletedId);
        if (!recoveredMsg) return;

        const chat = message.key.remoteJid;
        const originalSender = recoveredMsg.key.participant || recoveredMsg.key.remoteJid;

        // Decide where to send: DM to owner or same chat
        const targetChat = config.ANTI_DELETE_DM ? sender : chat;

        // Notify about recovered message
        await client.sendMessage(targetChat, {
            text: `🚨 *ANTI DELETE ALERT*\n\n👤 From: @${originalSender.split("@")[0]}\n📩 Recovered message below 👇`,
            mentions: [originalSender]
        });

        // Re-send original message
        await client.relayMessage(targetChat, recoveredMsg.message, {
            messageId: recoveredMsg.key.id
        });

    } catch (error) {
        console.error("❌ Anti-delete error:", error);
    }
});

// === Anti-Delete Command ===
cmd({
    pattern: "antidelete",
    alias: ["antidel", "recover"],
    desc: "Toggle anti delete system",
    category: "owner",
    react: "🛡️",
    filename: __filename,
    fromMe: true
}, async (client, message, m, { isOwner, from, sender, args }) => {
    try {
        if (!isOwner) {
            return client.sendMessage(from, { text: "🚫 Owner-only command!", mentions: [sender] }, { quoted: message });
        }

        const action = args[0]?.toLowerCase() || "status";
        let statusText = "", reaction = "🛡️", info = "";

        switch (action) {
            case "on":
                config.ANTI_DELETE = true;
                config.ANTI_DELETE_DM = false;
                statusText = "✅ Anti-delete is *ENABLED* (recovery in same chat)";
                reaction = "✅";
                info = "Deleted messages will now be recovered in the chat 🔄";
                break;
            case "off":
                config.ANTI_DELETE = false;
                statusText = "❌ Anti-delete is *DISABLED*";
                reaction = "❌";
                info = "Deleted messages will no longer be recovered 🚫";
                break;
            case "dm":
                config.ANTI_DELETE = true;
                config.ANTI_DELETE_DM = true;
                statusText = "✅ Anti-delete is *ENABLED* (recovery to owner DM)";
                reaction = "📩";
                info = "Deleted messages will now be sent directly to your DM 🔒";
                break;
            default:
                statusText = `📌 Anti-delete Status: ${config.ANTI_DELETE ? "✅ ENABLED" : "❌ DISABLED"}`;
                info = config.ANTI_DELETE
                    ? (config.ANTI_DELETE_DM ? "Messages go to your DM 📩" : "Messages recover in chat 🔄")
                    : "Recovery is OFF 🚫";
        }

        // Send confirmation with optional image/newsletter
        await client.sendMessage(from, {
            image: { url: "https://files.catbox.moe/kiy0hl.jpg" },
            caption: `
${statusText}
${info}

_𝐩𝐨𝐩𝐤𝐢𝐝 𝐚𝐧𝐭𝐢𝐝𝐞𝐥𝐞𝐭𝐞 🛡️_
            `,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363289379419860@newsletter",
                    newsletterName: "𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝",
                    serverMessageId: 144
                }
            }
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: reaction, key: message.key } });

    } catch (error) {
        console.error("❌ Anti-delete command error:", error);
        await client.sendMessage(from, { text: `⚠️ Error: ${error.message}`, mentions: [sender] }, { quoted: message });
    }
});
