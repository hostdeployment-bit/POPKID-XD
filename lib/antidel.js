const { isJidGroup, getContentType } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../config');

const NEWSLETTER = {
    name: "𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄 🌟",
    watermark: "> popkid antidelete ☯️"
};

function getMessageType(message) {
    if (!message) return "Unknown";
    const type = getContentType(message);

    const map = {
        conversation: "Text",
        extendedTextMessage: "Text",
        imageMessage: "Image",
        videoMessage: "Video",
        audioMessage: "Audio",
        stickerMessage: "Sticker",
        documentMessage: "Document",
        contactMessage: "Contact",
        locationMessage: "Location"
    };

    return map[type] || type;
}

function extractText(message) {
    return (
        message?.conversation ||
        message?.extendedTextMessage?.text ||
        message?.imageMessage?.caption ||
        message?.videoMessage?.caption ||
        message?.documentMessage?.caption ||
        null
    );
}

async function sendTextRestore(conn, mek, jid, info, senderJid) {

    const text = extractText(mek.message) || "🚫 Media message";

    const msg = `🗑️ *ANTIDELETE DETECTED*

${info}

✉️ MESSAGE:
${text}

${NEWSLETTER.watermark}`;

    await conn.sendMessage(jid, {
        text: msg,
        mentions: [senderJid]
    });
}

async function sendMediaRestore(conn, mek, jid, info, senderJid) {

    const messageType = getContentType(mek.message);

    const media = mek.message[messageType];

    const caption = `🗑️ *ANTIDELETE DETECTED*

${info}

${NEWSLETTER.watermark}`;

    let sendObj = {};

    if (messageType === "imageMessage")
        sendObj = { image: media, caption };

    else if (messageType === "videoMessage")
        sendObj = { video: media, caption };

    else if (messageType === "audioMessage")
        sendObj = { audio: media, mimetype: "audio/mp4" };

    else if (messageType === "stickerMessage")
        sendObj = { sticker: media };

    else if (messageType === "documentMessage")
        sendObj = { document: media, caption };

    else {
        await conn.relayMessage(jid, mek.message, {});
        return;
    }

    await conn.sendMessage(jid, sendObj, {});
}

async function AntiDelete(conn, updates) {

    try {

        const enabled = await getAnti();

        if (!enabled) return;

        for (const update of updates) {

            if (update.update.message !== null) continue;

            const stored = await loadMessage(update.key.id);

            if (!stored || !stored.message) continue;

            const mek = stored.message;

            const isGroup = isJidGroup(stored.jid);

            const sender =
                (mek.key.participant || mek.key.remoteJid).split("@")[0];

            const time = new Date().toLocaleTimeString();

            const date = new Date().toLocaleDateString();

            let info = "";
            let destination;

            if (isGroup) {

                const meta = await conn.groupMetadata(stored.jid);

                info =
`📅 DATE: ${date}
⏰ TIME: ${time}
👤 USER: @${sender}
👥 GROUP: ${meta.subject}
📌 TYPE: ${getMessageType(mek.message)}`;

                destination =
                    config.ANTI_DEL_PATH === "inbox"
                        ? conn.user.id
                        : stored.jid;

            } else {

                info =
`📅 DATE: ${date}
⏰ TIME: ${time}
👤 USER: @${sender}
📌 TYPE: ${getMessageType(mek.message)}`;

                destination =
                    config.ANTI_DEL_PATH === "inbox"
                        ? conn.user.id
                        : stored.jid;
            }

            const text = extractText(mek.message);

            if (text)
                await sendTextRestore(conn, mek, destination, info, mek.key.participant || mek.key.remoteJid);

            else
                await sendMediaRestore(conn, mek, destination, info, mek.key.participant || mek.key.remoteJid);

        }

    } catch (err) {

        console.log("AntiDelete Error:", err);

    }
}

module.exports = {

    AntiDelete

};
