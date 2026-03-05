const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "save",
    desc: "Saves the quoted status to the current chat",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, reply, quoted }) => {
    try {
        // 1. Check if there is a quoted message
        if (!m.quoted) return reply("❌ *Please reply to a status image or video with .save*");

        // 2. React to show the bot is working
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // 3. Download the media from the status
        let media = await m.quoted.download();

        // 4. Define your signature style (Popkid Ke)
        const fakevCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
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

        // 5. Determine if it's an image or video and send it
        if (m.quoted.mtype === 'imageMessage') {
            await conn.sendMessage(from, { 
                image: media, 
                caption: m.quoted.caption || "", 
                contextInfo: newsletterContextInfo 
            }, { quoted: fakevCard });
        } else if (m.quoted.mtype === 'videoMessage') {
            await conn.sendMessage(from, { 
                video: media, 
                caption: m.quoted.caption || "", 
                contextInfo: newsletterContextInfo 
            }, { quoted: fakevCard });
        } else {
            reply("❌ *This is not a supported media status (Image/Video only).*");
        }

    } catch (err) {
        console.error("FINAL SAVE ERROR:", err);
        reply("❌ *Failed to download status. The media might have expired.*");
    }
});
