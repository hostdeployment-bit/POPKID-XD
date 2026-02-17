const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "getpp",
    alias: ["pp", "profile"],
    desc: "Get the profile picture of a user",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, args, q, reply, botFooter }) => {
    try {
        let targetNumber;

        // 1. Check if replying to a message
        if (m.quoted) {
            targetNumber = m.quoted.sender.split('@')[0];
        } 
        // 2. Check if a number was provided as an argument
        else if (q) {
            targetNumber = q.replace(/[^0-9]/g, '');
        } 
        // 3. Fallback if no target is found
        else {
            return reply("👤 *Popkid, please reply to a message or provide a number!*\n\nExample: .getpp 254xxx");
        }

        await conn.sendMessage(from, { react: { text: "📸", key: mek.key } });

        // 254111385747
        const apiUrl = `https://eliteprotech-apis.zone.id/getpp?prompt=${targetNumber}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.profilePicture) {
            return reply("❌ *Could not find a public profile picture for this user.*");
        }

        const fancyCaption = `
╔═══════════════════╗
 👤  *𝐔𝐒𝐄𝐑 𝐏𝐑𝐎𝐅𝐈𝐋𝐄* 👤
╚═══════════════════╝

📌 *𝐍𝐮𝐦𝐛𝐞𝐫:* ${data.number}
🔗 *𝐋𝐢𝐧𝐤:* [Click here](${data.profilePicture})

*Requested by Popkid-MD*
`.trim();

        // Send the image with a stylish caption
        await conn.sendMessage(from, {
            image: { url: data.profilePicture },
            caption: fancyCaption,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪'
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        reply("❌ *Error fetching profile picture. Make sure the number is correct.*");
    }
});
