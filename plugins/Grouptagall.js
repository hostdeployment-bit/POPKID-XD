const { cmd } = require('../command');

cmd({
    pattern: "tagall",
    alias: ["everyone", "all"],
    desc: "Mention all members in the group (Public Access)",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, args, q, reply, botFooter }) => {
    try {
        // 1. Check if the command is used in a group
        if (!isGroup) return reply("❌ *Popkid, this command only works in groups!*");

        await conn.sendMessage(from, { react: { text: "📢", key: mek.key } });

        // 2. Fetch all group participants
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // 3. Prepare the message
        let mentions = [];
        let tagMessage = `
╔═══════════════════╗
📢 *𝐆𝐑𝐎𝐔𝐏 𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄𝐌𝐄𝐍𝐓* 
╚═══════════════════╝

💬 *𝐌𝐞𝐬𝐬𝐚𝐠𝐞:* ${q ? q : 'No message provided'}
👤 *𝐓𝐚𝐠𝐠𝐞𝐝 𝐛𝐲:* @${m.sender.split('@')[0]}

📌 *𝐌𝐞𝐦𝐛𝐞𝐫𝐬:*
`;

        // 4. Build mention list and text string
        for (let participant of participants) {
            tagMessage += `🔹 @${participant.id.split('@')[0]}\n`;
            mentions.push(participant.id);
        }

        tagMessage += `\n> *𝐏𝐨𝐩𝐤𝐢𝐝-𝐌𝐃: 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞 𝐢𝐬 𝐡𝐞𝐫𝐞!*`;

        // 5. Send with mentions
        await conn.sendMessage(from, { 
            text: tagMessage, 
            mentions: mentions,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪'
        }, { quoted: mek });

    } catch (err) {
        console.error("TAGALL ERROR:", err);
        reply("❌ *Failed to tag all members.*");
    }
});
