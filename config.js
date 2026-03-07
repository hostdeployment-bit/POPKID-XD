const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "POPKID~HcURgQQT#el1w53_DkYDDW13cEvqw0q80vHfOfnyZO_cyAL0mAUU",
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃 𝐕𝐈𝐄𝐖𝐄𝐃✅*",
    STATUS_REACTIONS: process.env.STATUS_REACTIONS || "❤️,✨,🔥,💯,👑,🥰,😇,🧡",
    PREFIX: process.env.PREFIX || ".",
    MODE: process.env.MODE || "public",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
    AUTO_BIO: process.env.AUTO_BIO || "true",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "254732297194",
    BOT_NAME: process.env.BOT_NAME || "𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃",
    AUTO_REACT: process.env.AUTO_REACT || "false",
    TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi"
};
