const { cmd } = require('../command');

/**
 * 🔒 LOCK GROUP COMMAND
 * Sets group to "Admins Only"
 */
cmd({
    pattern: "lockgc",
    alias: ["closegc", "mute"],
    desc: "Close the group so only admins can message",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ *Popkid, this command only works in groups!*");

        // 1. Fetch Group Data & Permissions
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botNumber = await conn.decodeJid(conn.user.id);
        
        // Filter out admins
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);
        const isAdmins = groupAdmins.includes(m.sender);
        const isBotAdmins = groupAdmins.includes(botNumber);

        // 2. Verification Checks
        if (!isAdmins) return reply("❌ *You need to be an Admin to lock this group!*");
        if (!isBotAdmins) return reply("❌ *I need Admin rights to change group settings!*");

        // 3. Update Group Setting
        await conn.groupSettingUpdate(from, 'announcement');
        await conn.sendMessage(from, { react: { text: "🔒", key: mek.key } });

        let lockMsg = `
╔═══════════════════╗
  🔒 *𝐆𝐑𝐎𝐔𝐏 𝐂𝐋𝐎𝐒𝐄𝐃* ╚═══════════════════╝

📢 *𝐒𝐭𝐚𝐭𝐮𝐬:* _Admins Only_
👤 *𝐈𝐧𝐢𝐭𝐢𝐚𝐭𝐞𝐝 𝐛𝐲:* @${m.sender.split('@')[0]}

> *𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐏𝐨𝐩𝐤𝐢𝐝🇰🇪*`;

        await conn.sendMessage(from, { 
            text: lockMsg, 
            mentions: [m.sender] 
        }, { quoted: mek });

    } catch (err) {
        console.error("LOCK ERROR:", err);
        reply("❌ *Failed to lock the group. Check my permissions.*");
    }
});

/**
 * 🔓 UNLOCK GROUP COMMAND
 * Sets group to "All Participants"
 */
cmd({
    pattern: "unlockgc",
    alias: ["opengc", "unmute"],
    desc: "Open the group so everyone can message",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ *Popkid, this command only works in groups!*");

        // 1. Fetch Group Data & Permissions
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botNumber = await conn.decodeJid(conn.user.id);
        
        // Filter out admins
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);
        const isAdmins = groupAdmins.includes(m.sender);
        const isBotAdmins = groupAdmins.includes(botNumber);

        // 2. Verification Checks
        if (!isAdmins) return reply("❌ *You need to be an Admin to open this group!*");
        if (!isBotAdmins) return reply("❌ *I need Admin rights to perform this action!*");

        // 3. Update Group Setting
        await conn.groupSettingUpdate(from, 'not_announcement');
        await conn.sendMessage(from, { react: { text: "🔓", key: mek.key } });

        let unlockMsg = `
╔═══════════════════╗
  🔓 *𝐆𝐑𝐎𝐔𝐏 𝐎𝐏𝐄𝐍𝐄𝐃* ╚═══════════════════╝

📢 *𝐒𝐭𝐚𝐭𝐮𝐬:* _Everyone can chat_
👤 *𝐈𝐧𝐢𝐭𝐢𝐚𝐭𝐞𝐝 𝐛𝐲:* @${m.sender.split('@')[0]}

> *𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐏𝐨𝐩𝐤𝐢𝐝🇰🇪*`;

        await conn.sendMessage(from, { 
            text: unlockMsg, 
            mentions: [m.sender] 
        }, { quoted: mek });

    } catch (err) {
        console.error("UNLOCK ERROR:", err);
        reply("❌ *Failed to open the group.*");
    }
});
