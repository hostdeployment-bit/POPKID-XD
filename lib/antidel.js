const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../config');

// Newsletter configuration (watermark only, no image)
const NEWSLETTER_CONFIG = {
    jid: '120363382023564830@newsletter',
    name: '𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄 🌟',
    serverMessageId: 143,
    watermark: '> POWERED BY NOVA XMD'
};

const getNewsletterContext = () => ({
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_CONFIG.jid,
        newsletterName: NEWSLETTER_CONFIG.name,
        serverMessageId: NEWSLETTER_CONFIG.serverMessageId
    }
});

const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    try {
        const messageContent = mek.message?.conversation 
            || mek.message?.extendedTextMessage?.text
            || mek.message?.imageMessage?.caption
            || mek.message?.videoMessage?.caption
            || mek.message?.documentMessage?.caption
            || '🚫 Content unavailable (may be media without caption)';

        const fullMessage = `
┏━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🗑️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄 🗑️
┣━━━━━━━━━━━━━━━━━━━━━
${deleteInfo}
┣━━━━━━━━━━━━━━━━━━━━━
📝 *Message Content:*
${messageContent}
┗━━━━━━━━━━━━━━━━━━━━━━┛
${NEWSLETTER_CONFIG.watermark}`;

        const mentionedJids = isGroup 
            ? [update.key.participant, mek.key.participant].filter(Boolean) 
            : [update.key.remoteJid].filter(Boolean);

        await conn.sendMessage(
            jid,
            {
                text: fullMessage,
                contextInfo: {
                    ...getNewsletterContext(),
                    mentionedJid: mentionedJids,
                },
            },
            { quoted: mek }
        );
    } catch (error) {
        console.error('Error in DeletedText:', error);
    }
};

const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
    try {
        const antideletedmek = structuredClone(mek.message);
        const messageType = Object.keys(antideletedmek)[0];

        const mediaTypes = {
            imageMessage: 'Image',
            videoMessage: 'Video',
            audioMessage: 'Audio',
            documentMessage: 'Document',
            stickerMessage: 'Sticker'
        };

        const currentType = mediaTypes[messageType];

        const caption = `
┏━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🗑️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄 🗑️
┣━━━━━━━━━━━━━━━━━━━━━
${deleteInfo}
┣━━━━━━━━━━━━━━━━━━━━━
*Media Type:* ${currentType || 'Unknown'}
┗━━━━━━━━━━━━━━━━━━━━━━┛
${NEWSLETTER_CONFIG.watermark}`;

        if (['imageMessage', 'videoMessage'].includes(messageType)) {
            await conn.sendMessage(jid, { 
                text: caption,
                contextInfo: { ...getNewsletterContext(), mentionedJid: [mek.sender] }
            }, { quoted: mek });
        } else {
            await conn.sendMessage(jid, { 
                text: caption,
                contextInfo: { ...getNewsletterContext(), mentionedJid: [mek.sender] }
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
                if (!store?.message) continue;

                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                const antiDeleteStatus = await getAnti();
                if (!antiDeleteStatus) continue;

                const deleteTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                const deleteDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

                let deleteInfo, jid;
                if (isGroup) {
                    const groupMetadata = await conn.groupMetadata(store.jid);
                    const groupName = groupMetadata.subject;
                    const sender = mek.key.participant?.split('@')[0] || 'Unknown';
                    const deleter = update.key.participant?.split('@')[0] || 'Unknown';

                    deleteInfo = `*├📅 DATE:* ${deleteDate}\n*├⏰ TIME:* ${deleteTime}\n*├👤 SENDER:* @${sender}\n*├👥 GROUP:* ${groupName}\n*├🗑️ DELETED BY:* @${deleter}`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id : store.jid;
                } else {
                    const senderNumber = mek.key.remoteJid?.split('@')[0] || 'Unknown';
                    deleteInfo = `*├📅 DATE:* ${deleteDate}\n*├⏰ TIME:* ${deleteTime}\n*├📱 SENDER:* @${senderNumber}`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id : update.key.remoteJid;
                }

                deleteInfo += `\n*╰⚠️ ACTION:* Message Deletion Detected`;

                if (mek.message?.conversation || mek.message?.extendedTextMessage || 
                    mek.message?.imageMessage?.caption || mek.message?.videoMessage?.caption) {
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

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
};
