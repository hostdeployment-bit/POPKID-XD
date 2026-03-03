const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "uptime",
    alias: ["runtime", "status"],
    desc: "Check how long the bot has been running.",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, sender, reply }) => {
    try {
        // Calculate uptime
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const uptimeString = `🕒 *ᴜᴘᴛɪᴍᴇ:* ${hours}ʜ ${minutes}ᴍ ${seconds}s`;

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

        // Context info for newsletter and large clear image
        const newsletterContextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            },
            externalAdReply: {
                title: "POPKID XMD UPTIME",
                body: "𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒 🟢",
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/aapw1p.png", // Clear image URL
                renderLargerThumbnail: true, // Makes it full and visible
                sourceUrl: "https://whatsapp.com/channel/0029Vb70ySJHbFV91PNKuL3T"
            }
        };

        // Send reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Send uptime with the fixed context and quoted vCard
        await conn.sendMessage(from, { 
            text: uptimeString, 
            contextInfo: newsletterContextInfo 
        }, { quoted: fakevCard });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
