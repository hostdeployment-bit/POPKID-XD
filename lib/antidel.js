const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAnti } = require('../data/antidel');
const { loadMessage } = require('../lib/database'); // Ensure this is your message store
const config = require('../config');

const NEWSLETTER_CONFIG = {
    jid: '120363289379419860@newsletter',
    name: '𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄 🌟',
    imageUrl: 'https://files.catbox.moe/kiy0hl.jpg',
    watermark: '> 𝐩𝐨𝐩𝐤𝐢𝐝 𝐚𝐧𝐭𝐢𝐝𝐞𝐥𝐞𝐭𝐞☯️'
};

const AntiDelete = async (conn, updates) => {
    try {
        const antiStatus = await getAnti();
        if (!antiStatus) return; // Only works if turned ON

        for (const update of updates) {
            if (update.update.message === null) {
                const store = await loadMessage(update.key.id);
                if (!store || !store.message) continue;

                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                
                // Determine destination: Inbox (self) or Original Chat
                const jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id : store.jid;

                const sender = (isGroup ? mek.key.participant : mek.key.remoteJid).split('@')[0];
                const type = Object.keys(mek.message)[0].replace('Message', '');

                const caption = `🗑️ *ANTIDELETE DETECTED*\n\n` +
                                `👤 *From:* @${sender}\n` +
                                `📍 *Loc:* ${isGroup ? 'Group Chat' : 'Private DM'}\n` +
                                `📌 *Type:* ${type}\n\n` +
                                `${NEWSLETTER_CONFIG.watermark}`;

                // Repost the deleted content
                await conn.sendMessage(jid, {
                    forward: mek,
                    contextInfo: {
                        mentionedJid: [isGroup ? mek.key.participant : mek.key.remoteJid],
                        externalAdReply: {
                            title: NEWSLETTER_CONFIG.name,
                            body: "Recovered Message",
                            thumbnailUrl: NEWSLETTER_CONFIG.imageUrl,
                            sourceUrl: "https://github.com/popkid"
                        }
                    },
                    caption: caption
                });
            }
        }
    } catch (e) {
        console.error("Antidel Lib Error:", e);
    }
};

module.exports = { AntiDelete };
