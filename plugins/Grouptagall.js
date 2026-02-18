const { cmd } = require('../command');

cmd({
    pattern: "tagall",
    alias: ["everyone", "all"],
    desc: "Mention all members in the group",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, args, q, reply, botFooter }) => {
    try {
        // 1. Security check: Group only & Admin only
        if (!isGroup) return reply("❌ *Popkid, this command can only be used in groups!*");
        if (!isAdmins) return reply("❌ *Admin access required to tag everyone.*");

        // 2. Fetch all group participants
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // 3. Prepare the mention list
        let mentions = [];
        let tagMessage = `
╔═══════════════════╗
📢 *𝐆𝐑𝐎𝐔𝐏 𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄𝐌𝐄𝐍𝐓*
╚═══════════════════╝

💬 *𝐌𝐞𝐬𝐬𝐚𝐠𝐞:* ${q ? q : 'No message provided'}
👤 *𝐁𝐲:* @${m.sender.split('@')[0]}

📌 *𝐌𝐞𝐦𝐛𝐞𝐫𝐬:*
`;

        // 4. Loop through participants to build the string and mention array
        for (let participant of participants) {
            tagMessage += `🔹 @${participant.id.split('@')[0]}\n`;
            mentions.push(participant.id);
        }

        tagMessage += `\n> *𝐏𝐨𝐩𝐤𝐢𝐝 𝐀𝐈: 𝐒𝐭𝐚𝐲 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝*`;

        // 5. Send the message with mentions
        await conn.sendMessage(from, { 
            text: tagMessage, 
            mentions: mentions,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪'
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "📢", key: mek.key } });

    } catch (err) {
        console.error("TAGALL ERROR:", err);
        reply("❌ *Failed to tag all members.*");
    }
});
