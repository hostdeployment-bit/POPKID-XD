const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "save",
    desc: "Saves the quoted status to the current chat",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {
    try {
        // More robust check for quoted messages
        const quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        
        if (!quoted) return reply("❌ *Please reply to a status image or video with .save*");

        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const fakevCard = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "Popkid Ke",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:popkid\nORG:popkid;\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        const newsletterContextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            },
            externalAdReply: {
                title: "POPKID XMD STATUS SAVER",
                body: "𝐒𝐓𝐀𝐓𝐔𝐒 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐃 ⚡",
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/aapw1p.png",
                renderLargerThumbnail: true,
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        // Use copyNForward to ensure the media is captured and re-sent correctly
        await conn.copyNForward(from, m.quoted ? m.quoted.fakeObj : mek, false, { 
            contextInfo: newsletterContextInfo, 
            quoted: fakevCard 
        });

    } catch (err) {
        console.error("SAVE ERROR:", err);
        reply("❌ *Error: Could not process status.*");
    }
});
