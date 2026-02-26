const config = require('../config');
const { cmd } = require('../command');

// helper to get admin list
async function getGroupAdmins(conn, groupId) {
    const metadata = await conn.groupMetadata(groupId);
    return metadata.participants
        .filter(p => p.admin !== null)
        .map(p => p.id);
}

// ================================
// PROMOTE
// ================================

cmd({
    pattern: "promote",
    desc: "Promote user to admin",
    category: "group",
    react: "⬆️",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, mentionedJid, reply }) => {

try {

if (!isGroup)
return reply("❌ This command is for groups only.");

const groupAdmins = await getGroupAdmins(conn, from);
const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";

const isAdmin = groupAdmins.includes(sender);
const isBotAdmin = groupAdmins.includes(botNumber);

if (!isAdmin)
return reply("❌ You must be an admin.");

if (!isBotAdmin)
return reply("❌ I must be admin first.");

let target = mentionedJid[0] 
|| mek.message?.extendedTextMessage?.contextInfo?.participant;

if (!target)
return reply("❌ Tag or reply to a user.");

await conn.groupParticipantsUpdate(from, [target], "promote");

reply("✅ Successfully promoted to admin.");

} catch (err) {
console.log(err);
reply("❌ Error promoting user.");
}

});


// ================================
// DEMOTE
// ================================

cmd({
    pattern: "demote",
    desc: "Demote admin to member",
    category: "group",
    react: "⬇️",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, mentionedJid, reply }) => {

try {

if (!isGroup)
return reply("❌ This command is for groups only.");

const groupAdmins = await getGroupAdmins(conn, from);
const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";

const isAdmin = groupAdmins.includes(sender);
const isBotAdmin = groupAdmins.includes(botNumber);

if (!isAdmin)
return reply("❌ You must be an admin.");

if (!isBotAdmin)
return reply("❌ I must be admin first.");

let target = mentionedJid[0] 
|| mek.message?.extendedTextMessage?.contextInfo?.participant;

if (!target)
return reply("❌ Tag or reply to a user.");

await conn.groupParticipantsUpdate(from, [target], "demote");

reply("✅ Successfully demoted.");

} catch (err) {
console.log(err);
reply("❌ Error demoting user.");
}

});
