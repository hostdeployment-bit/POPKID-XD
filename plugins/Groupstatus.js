const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "togroupstatus",
    aliases: ["groupstatus", "statusgroup", "togcstatus"],
    react: "📢",
    category: "group",
    desc: "Send text or quoted media to group status. Superuser only.",
    filename: __filename
},
async (from, Gifted, conText) => {
    const { reply, react, isSuperUser, isGroup, q, quoted, quotedMsg, mek, botName } = conText;
    const { downloadMediaMessage } = require("gifted-baileys");
    const fs = require("fs");
    const path = require("path");

    if (!isGroup) return reply("❌ Group only command!");
    if (!isSuperUser) return reply("❌ Owner Only Command!");

    if (!q && !quotedMsg) {
        return reply(
            "📌 *Usage:*\n" +
            "• .togroupstatus <text>\n" +
            "• Reply to image/video/audio with .togroupstatus <caption>\n" +
            "• Or just .togroupstatus to forward quoted media"
        );
    }

    let tempFilePath = null;

    try {
        let payload = { groupStatusMessage: {} };

        if (quotedMsg) {
            const tempDir = "sessions/temp";
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            if (quoted?.imageMessage) {
                const caption = q || quoted.imageMessage.caption || "";
                const buffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
                tempFilePath = path.join(tempDir, `status_${Date.now()}.jpg`);
                fs.writeFileSync(tempFilePath, buffer);
                payload.groupStatusMessage.image = { url: tempFilePath };
                if (caption) payload.groupStatusMessage.caption = caption;

            } else if (quoted?.videoMessage) {
                const caption = q || quoted.videoMessage.caption || "";
                const buffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
                tempFilePath = path.join(tempDir, `status_${Date.now()}.mp4`);
                fs.writeFileSync(tempFilePath, buffer);
                payload.groupStatusMessage.video = { url: tempFilePath };
                if (caption) payload.groupStatusMessage.caption = caption;

            } else if (quoted?.audioMessage) {
                const buffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
                tempFilePath = path.join(tempDir, `status_${Date.now()}.mp3`);
                fs.writeFileSync(tempFilePath, buffer);
                payload.groupStatusMessage.audio = { url: tempFilePath };

            } else if (quoted?.documentMessage) {
                const buffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
                const ext = quoted.documentMessage.fileName?.split(".").pop() || "bin";
                tempFilePath = path.join(tempDir, `status_${Date.now()}.${ext}`);
                fs.writeFileSync(tempFilePath, buffer);
                payload.groupStatusMessage.document = { url: tempFilePath };

            } else if (quoted?.stickerMessage) {
                const buffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
                tempFilePath = path.join(tempDir, `status_${Date.now()}.webp`);
                fs.writeFileSync(tempFilePath, buffer);
                payload.groupStatusMessage.sticker = { url: tempFilePath };

            } else if (quoted?.conversation || quoted?.extendedTextMessage?.text) {
                payload.groupStatusMessage.text = quoted.conversation || quoted.extendedTextMessage.text;

            } else {
                return reply("❌ Unsupported media type for group status.");
            }

            if (q && !payload.groupStatusMessage.caption && !payload.groupStatusMessage.text) {
                payload.groupStatusMessage.caption = q;
            }
        } else {
            payload.groupStatusMessage.text = q;
        }

        // Add forwarded newsletter style
        payload.groupStatusMessage.contextInfo = {
            mentionedJid: [mek.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || botName || 'POPKID',
                serverMessageId: 1
            }
        };

        await Gifted.sendMessage(from, payload, { quoted: mek });
        await react("✅");

    } catch (error) {
        console.error("togroupstatus error:", error);
        await react("❌");
        return reply(`❌ Error sending group status: ${error.message}`);
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {}
        }
    }
});
