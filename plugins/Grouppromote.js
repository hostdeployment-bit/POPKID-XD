const { cmd } = require('../command');


// PROMOTE
cmd({
    pattern: "promote",
    desc: "Promote user",
    category: "group",
    filename: __filename
},
async (conn, m, mek, { from, reply, isGroup, quoted }) => {

    try {

        if (!isGroup) return reply("❌ Group only command.");

        let user;

        // get mentioned user
        if (mek.message.extendedTextMessage?.contextInfo?.mentionedJid) {
            user = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // get replied user
        else if (quoted) {
            user = quoted.sender;
        }
        else {
            return reply("❌ Reply or mention user.");
        }

        await conn.groupParticipantsUpdate(from, [user], "promote");

        reply(`✅ Successfully promoted @${user.split("@")[0]}`, {
            mentions: [user]
        });

    } catch (err) {
        console.log(err);
        reply("❌ Error promoting user.");
    }

});



// DEMOTE
cmd({
    pattern: "demote",
    desc: "Demote user",
    category: "group",
    filename: __filename
},
async (conn, m, mek, { from, reply, isGroup, quoted }) => {

    try {

        if (!isGroup) return reply("❌ Group only command.");

        let user;

        if (mek.message.extendedTextMessage?.contextInfo?.mentionedJid) {
            user = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        else if (quoted) {
            user = quoted.sender;
        }
        else {
            return reply("❌ Reply or mention user.");
        }

        await conn.groupParticipantsUpdate(from, [user], "demote");

        reply(`✅ Successfully demoted @${user.split("@")[0]}`, {
            mentions: [user]
        });

    } catch (err) {
        console.log(err);
        reply("❌ Error demoting user.");
    }

});
