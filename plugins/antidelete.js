const { cmd } = require("../command");
const config = require("../config");

// Anti-Delete Event Handler
// This listens for message updates (like deletions)
cmd({ on: "body" }, async (client, message, chat) => {
    try {
        client.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                if (!config.ANTI_DELETE || !update.update.message === null) return;

                // Check if the update is a "delete for everyone" action
                if (update.update.protocolMessage && update.update.protocolMessage.type === 0) {
                    const key = update.update.protocolMessage.key;
                    const originalMsg = await client.loadMessage(key.remoteJid, key.id);

                    if (!originalMsg) return; // Can't restore if not in cache

                    const sender = key.participant || key.remoteJid;
                    const caption = `*🚫 ANTI-DELETE DETECTED 🚫*\n\n` +
                                    `*👤 From:* @${sender.split("@")[0]}\n` +
                                    `*🕒 Time:* ${new Date().toLocaleString()}\n\n` +
                                    `_Restoring deleted message..._`;

                    // Forward or re-send the deleted content
                    await client.sendMessage(client.user.id, { 
                        text: caption, 
                        mentions: [sender] 
                    });
                    
                    await client.copyNForward(client.user.id, originalMsg, true);
                }
            }
        });
    } catch (e) {
        console.error("Anti-delete error:", e);
    }
});

// Anti-Delete Toggle Command
cmd({
    pattern: "antidelete",
    alias: ["nodelete", "atd"],
    desc: "Toggle anti-delete feature",
    category: "owner",
    react: "🗑️",
    filename: __filename,
    fromMe: true
},
async (client, message, m, { isOwner, from, sender, args }) => {
    try {
        if (!isOwner) {
            return client.sendMessage(from, { 
                text: "🚫 Owner-only command",
                mentions: [sender]
            }, { quoted: message });
        }

        const action = args[0]?.toLowerCase() || 'status';
        let statusText, reaction = "🗑️", additionalInfo = "";

        switch (action) {
            case 'on':
                if (config.ANTI_DELETE) {
                    statusText = "Anti-Delete is already *enabled* ✅";
                    reaction = "ℹ️";
                } else {
                    config.ANTI_DELETE = true;
                    statusText = "Anti-Delete has been *enabled*!";
                    reaction = "✅";
                    additionalInfo = "Deleted messages will be sent to your DM 🛡️";
                }
                break;
                
            case 'off':
                if (!config.ANTI_DELETE) {
                    statusText = "Anti-Delete is already *disabled* ❌";
                    reaction = "ℹ️";
                } else {
                    config.ANTI_DELETE = false;
                    statusText = "Anti-Delete has been *disabled* 📛";
                    reaction = "❌";
                    additionalInfo = "Deleted messages will no longer be captured";
                }
                break;
                
            default:
                statusText = `Anti-Delete Status: ${config.ANTI_DELETE ? "✅ *ENABLED*" : "❌ *DISABLED*"}`;
                additionalInfo = config.ANTI_DELETE ? "Monitoring deletions..." : "Not monitoring";
                break;
        }

        await client.sendMessage(from, {
            image: { url: "https://files.catbox.moe/ktr7qs.jpg" },
            caption: `${statusText}\n\n${additionalInfo}\n\n_Nova-Xmd_`,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363382023564830@newsletter',
                    newsletterName: 'Nova-Xmd',
                    serverMessageId: 143
                }
            }
        }, { quoted: message });

        await client.sendMessage(from, {
            react: { text: reaction, key: message.key }
        });

    } catch (error) {
        console.error("Anti-delete command error:", error);
        await client.sendMessage(from, { text: `⚠️ Error: ${error.message}` });
    }
});
