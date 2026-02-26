const { cmd } = require('../command');


// PROMOTE COMMAND
cmd({
    pattern: "promote",
    desc: "Promote a user to admin",
    category: "group",
    filename: __filename
},
async (conn, m, mek, { from, reply, isGroup, participants, quoted }) => {

    try {

        if (!isGroup) return reply("❌ This command only works in groups.");

        // check if bot is admin
        const groupMetadata = await conn.groupMetadata(from);
        const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const botAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;

        if (!botAdmin) return reply("❌ Bot must be admin to promote.");

        let user;

        if (mek.message.extendedTextMessage?.contextInfo?.mentionedJid) {
            user = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (quoted) {
            user = quoted.sender;
        } else {
            return reply("❌ Mention or reply to a user to promote.");
        }

        await conn.groupParticipantsUpdate(from, [user], "promote");

        reply(`✅ @${user.split("@")[0]} promoted to admin.`,
            { mentions: [user] });

    } catch (e) {
        console.log(e);
        reply("❌ Failed to promote user.");
    }

});



// DEMOTE COMMAND
cmd({
    pattern: "demote",
    desc: "Demote an admin",
    category: "group",
    filename: __filename
},
async (conn, m, mek, { from, reply, isGroup, participants, quoted }) => {

    try {

        if (!isGroup) return reply("❌ This command only works in groups.");

        // check if bot is admin
        const groupMetadata = await conn.groupMetadata(from);
        const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const botAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;

        if (!botAdmin) return reply("❌ Bot must be admin to demote.");

        let user;

        if (mek.message.extendedTextMessage?.contextInfo?.mentionedJid) {
            user = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (quoted) {
            user = quoted.sender;
        } else {
            return reply("❌ Mention or reply to a user to demote.");
        }

        await conn.groupParticipantsUpdate(from, [user], "demote");

        reply(`✅ @${user.split("@")[0]} demoted from admin.`,
            { mentions: [user] });

    } catch (e) {
        console.log(e);
        reply("❌ Failed to demote user.");
    }

});
