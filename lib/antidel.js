const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../config');

// Reusable text sender that avoids newsletter/image styles
const sendSimpleNotice = async (conn, jid, text, mek, mentionedJids) => {
    await conn.sendMessage(jid, {
        text: text,
        mentions: mentionedJids
    }, { quoted: mek });
};

const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    try {
        const messageContent = mek.message?.conversation 
            || mek.message?.extendedTextMessage?.text
            || mek.message?.imageMessage?.caption
            || mek.message?.videoMessage?.caption
            || mek.message?.documentMessage?.caption
            || '🚫 Content unavailable';

        const fullMessage = `🗑️ *ANTIDELETE*\n${deleteInfo}\n✉️ *MESSAGE:*\n${messageContent}`;

        const mentionedJids = isGroup 
            ? [update.key.participant, mek.key.participant].filter(Boolean) 
            : [update.key.remoteJid].filter(Boolean);

        await sendSimpleNotice(conn, jid, fullMessage, mek, mentionedJids);
    } catch (error) {
        console.error('Error in DeletedText:', error);
    }
};

const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
    try {
        const antideletedmek = structuredClone(mek.message);
        const messageType = Object.keys(antideletedmek)[0];
        const caption = `🗑️ *ANTIDELETE*\n${deleteInfo}`;

        // Just send the caption/info text first
        await sendSimpleNotice(conn, jid, caption, mek, [mek.sender]);

        // If it's a media type, send the media immediately after without newsletter context
        if (antideletedmek[messageType]?.url) {
            const type = messageType.replace('Message', '');
            await conn.sendMessage(jid, {
                [type]: { url: antideletedmek[messageType].url },
                caption: messageType.includes('image') || messageType.includes('video') ? caption : undefined
            }, { quoted: mek });
        }
    } catch (error) {
        console.error('Error in DeletedMedia:', error);
    }
};

const AntiDelete = async (conn, updates) => {
    try {
        for (const update of updates) {
            if (update.update.message === null) {
                const store = await loadMessage(update.key.id);
                if (!store || !store.message) continue;

                const antiDeleteStatus = await getAnti();
                if (!antiDeleteStatus) continue;

                const mek = store.message;
                const isGroup = isJidGroup(store.jid);

                const deleteTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
                const deleteDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

                let deleteInfo;
                const sender = (isGroup ? mek.key.participant : mek.key.remoteJid)?.split('@')[0] || 'Unknown';

                deleteInfo = `📅 *DATE:* ${deleteDate}\n⏰ *TIME:* ${deleteTime}\n👤 *SENDER:* @${sender}`;

                const jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id : store.jid;

                if (mek.message?.conversation || mek.message?.extendedTextMessage) {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                } else {
                    await DeletedMedia(conn, mek, jid, deleteInfo);
                }
            }
        }
    } catch (error) {
        console.error('Error in AntiDelete:', error);
    }
};

module.exports = { DeletedText, DeletedMedia, AntiDelete };
