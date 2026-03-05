const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "save",
    desc: "Saves the quoted status to the current chat",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, reply, quoted }) => {
    try {
        // Check if the user is actually replying to a status/message
        if (!quoted) return reply("❌ *Please reply to a status image or video with .save*");

        // React to show processing
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // Define the fakevCard (Popkid Ke)
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

        // Newsletter and link preview context
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

        // Forward the quoted content (Image/Video) with the new context
        await conn.sendMessage(from, { 
            forward: quoted, 
            contextInfo: newsletterContextInfo 
        }, { quoted: fakevCard });

    } catch (err) {
        console.error("SAVE ERROR:", err);
        reply("❌ *Failed to save status. Ensure you are replying to a media file.*");
    }
});
