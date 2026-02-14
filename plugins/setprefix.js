const { cmd } = require('../command');

cmd({
    pattern: "setprefix",
    desc: "Change the bot's command prefix",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, m, mek, { from, reply, isOwner }) => {

    // 🛡️ Security Check: Only the owner should change the prefix
    if (!isOwner) return reply("*❌ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ*");

    const text = m.text.split(" ").slice(1).join(" ").trim();

    if (!text) return reply("*⚠️ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴘʀᴇғɪx (ᴇ.ɢ .sᴇᴛᴘʀᴇғɪx !)*");

    try {
        // Update the global prefix variable
        global.prefix = text;

        // ping-style reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // Styled response in POPKID MP3 style 💝
        await conn.sendMessage(from, {
            image: { url: "https://i.ibb.co/vzP6H7B/prefix-settings.jpg" }, // Optional: Add a settings icon URL here
            caption: `*⚙️ P O P K I D  S E T T I N G S 💝*\n\n` +
                     `*✨ sᴛᴀᴛᴜs:* ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ\n` +
                     `*🎯 ɴᴇᴡ ᴘʀᴇғɪx:* [ ${text} ]\n\n` +
                     `> *ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs ᴡɪʟʟ ɴᴏᴡ ʀᴇsᴘᴏɴᴅ ᴛᴏ ${text}*`
        });

    } catch (e) {
        console.error(e);
        reply("*❗ ᴇʀʀᴏʀ ᴜᴘᴅᴀᴛɪɴɢ ᴘʀᴇғɪx*");
    }
});
