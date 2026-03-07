const axios = require('axios');
const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "repo",
    alias: ["git", "sc", "script"],
    desc: "Fetch the bot repository details",
    category: "main",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, sender }) => {
    try {
        const repoUrl = "https://github.com/popkidc/POPKID-XD";
        const apiUrl = "https://api.github.com/repos/popkidc/POPKID-XD";
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        let repoMsg = `👑 *POPKID-MD REPO DETAILS* 👑

✨ *Repository Name:* ${data.name}
👤 *Owner:* ${data.owner.login}
⭐ *Stars:* ${data.stargazers_count}
🍴 *Forks:* ${data.forks_count}
📅 *Last Updated:* ${new Date(data.updated_at).toLocaleDateString()}

🔗 *Repo Link:* ${repoUrl}

> *Created by Popkid Kenya* 👨‍💻`;

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
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            },
            externalAdReply: {
                title: "POPKID XMD REPO",
                body: "𝐒𝐂𝐑𝐈𝐏𝐓 𝐃𝐄𝐓𝐀𝐈𝐋𝐒 ⚡",
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/j9ia5c.png",
                renderLargerThumbnail: false, // Changed to false to remove the "big" preview
                sourceUrl: repoUrl
            }
        };

        // Changed from 'image' to 'text' to remove the main attached image
        await conn.sendMessage(from, {
            text: repoMsg, 
            contextInfo: newsletterContextInfo
        }, { quoted: fakevCard });

    } catch (e) {
        console.log(e);
        reply("❌ Error fetching repository details. Please try again later.");
    }
});
