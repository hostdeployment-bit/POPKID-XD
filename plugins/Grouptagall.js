const { cmd } = require('../command');

cmd({
    pattern: "tagall",
    alias: ["everyone", "all"],
    desc: "Mention all members with a stylish header",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, args, q, reply, botFooter }) => {
    try {
        // 1. Group check
        if (!isGroup) return reply("❌ *Popkid, this command only works in groups!*");

        await conn.sendMessage(from, { react: { text: "📣", key: mek.key } });

        // 2. Fetch all group participants
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // 3. Prepare Stylish Caption
        let mentions = [];
        let tagMessage = `
╔═══════════════════╗
 ✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐀𝐋𝐋* ✨
╚═══════════════════╝

📢 *𝐀𝐧𝐧𝐨𝐮𝐧𝐜𝐞𝐦𝐞𝐧𝐭:* _${q ? q : 'Hey everyone, pay attention to this group!'}_

👤 *𝐈𝐧𝐢𝐭𝐢𝐚𝐭𝐞𝐝 𝐛𝐲:* @${m.sender.split('@')[0]}
👥 *𝐓𝐨𝐭𝐚𝐥 𝐌𝐞𝐦𝐛𝐞𝐫𝐬:* ${participants.length}

┌───⊷ *𝐆𝐑𝐎𝐔𝐏 𝐌𝐄𝐌𝐁𝐄𝐑𝐒*
`;

        // 4. Build the mention list with fancy bullets
        for (let participant of participants) {
            tagMessage += `│🔹 @${participant.id.split('@')[0]}\n`;
            mentions.push(participant.id);
        }

        tagMessage += `└──────────────⊷

> *𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐏𝐨𝐩𝐤𝐢𝐝🇰🇪*`;

        // 5. Send Image with Stylish Caption
        await conn.sendMessage(from, { 
            image: { url: 'https://files.catbox.moe/aapw1p.png' }, 
            caption: tagMessage, 
            mentions: mentions,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪'
        }, { quoted: mek });

    } catch (err) {
        console.error("TAGALL ERROR:", err);
        reply("❌ *Failed to tag all members.*");
    }
});
