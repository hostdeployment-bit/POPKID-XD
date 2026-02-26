const config = require('../config');
const { cmd } = require('../command');

// ================================
// PROMOTE COMMAND
// ================================

cmd({
    pattern: "promote",
    desc: "Promote a member to admin",
    category: "group",
    react: "⬆️",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, isAdmins, isBotAdmins, mentionedJid, reply }) => {

try {

if (!isGroup)
return reply("❌ This command can only be used in groups.");

if (!isAdmins)
return reply("❌ Only group admins can use this command.");

if (!isBotAdmins)
return reply("❌ I must be admin to promote members.");

let users = mentionedJid && mentionedJid[0]
? mentionedJid
: mek.message?.extendedTextMessage?.contextInfo?.participant
? [mek.message.extendedTextMessage.contextInfo.participant]
: [];

if (users.length === 0)
return reply("❌ Tag or reply to a user to promote.");

await conn.groupParticipantsUpdate(from, users, "promote");

reply("✅ User promoted to admin successfully.");

} catch (e) {

console.log(e);
reply("❌ Failed to promote user.");

}

});


// ================================
// DEMOTE COMMAND
// ================================

cmd({
    pattern: "demote",
    desc: "Demote an admin to member",
    category: "group",
    react: "⬇️",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, isAdmins, isBotAdmins, mentionedJid, reply }) => {

try {

if (!isGroup)
return reply("❌ This command can only be used in groups.");

if (!isAdmins)
return reply("❌ Only group admins can use this command.");

if (!isBotAdmins)
return reply("❌ I must be admin to demote members.");

let users = mentionedJid && mentionedJid[0]
? mentionedJid
: mek.message?.extendedTextMessage?.contextInfo?.participant
? [mek.message.extendedTextMessage.contextInfo.participant]
: [];

if (users.length === 0)
return reply("❌ Tag or reply to a user to demote.");

await conn.groupParticipantsUpdate(from, users, "demote");

reply("✅ User demoted successfully.");

} catch (e) {

console.log(e);
reply("❌ Failed to demote user.");

}

});
