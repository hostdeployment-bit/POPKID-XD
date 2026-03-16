const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "",
    
    // ====== Status Settings ======
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true", // Added for logic sync
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    AUTO_REACT_STATUS: process.env.AUTO_REACT_STATUS || "true", // Added for logic sync
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃 𝐕𝐈𝐄𝐖𝐄𝐃✅*",
    ANTICALL: process.env.ANTICALL || "false", // Recommended to add this for the logic we added earlier
    CUSTOM_STATUS_EMOJIS: process.env.CUSTOM_STATUS_EMOJIS || "❤️,✨,🔥,💯,👑",

    // ====== Anti-Delete Config ======
    ANTI_DELETE: process.env.ANTI_DELETE || "false",       
    ANTI_DELETE_DM: process.env.ANTI_DELETE_DM || "false", 
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "log",     

    // ====== Bot Behavior ======
    PREFIX: process.env.PREFIX || ".",
    MODE: process.env.MODE || "public",
    PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    READ_CMD: process.env.READ_CMD || "false",
    AUTO_TYPING: process.env.AUTO_TYPING || "true",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
    AUTO_BIO: process.env.AUTO_BIO || "true",
    TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi", // Fixed for your region

    // ====== Security & Group ======
    ANTI_CALL: process.env.ANTI_CALL || "false",
    ANTI_LINK: process.env.ANTI_LINK || "false",
    ANTI_LINK_MODE: process.env.ANTI_LINK_MODE || "warn",
    ANTI_BAD: process.env.ANTI_BAD || "true",
    ANTI_VV: process.env.ANTI_VV || "true",
    DELETE_LINKS: process.env.DELETE_LINKS || "true",

    // ====== Personalization ======
    BOT_NAME: process.env.BOT_NAME || "𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃",
    OWNER_NAME: process.env.OWNER_NAME || "𝐏𝐎𝐏𝐊𝐈𝐃",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "254732297194",
    DEV: process.env.DEV || "254732297194",
    STICKER_NAME: process.env.STICKER_NAME || "𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃",
    DESCRIPTION: process.env.DESCRIPTION || "*𝙿𝙾𝙿𝙺𝙸𝙳 𝚇𝙼𝙳 𝙱𝙾𝚃😇*",
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/d1stg5.jpg",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/d1stg5.jpg",
    LIVE_MSG: process.env.LIVE_MSG || "> 𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃 𝐁𝐎𝐓😇",
    
    // ====== Reactions ======
    AUTO_REACT: process.env.AUTO_REACT || "false",
    CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",

    // ====== Group Events ======
    WELCOME: process.env.WELCOME || "false",
    ADMIN_EVENTS: process.env.ADMIN_EVENTS || "true",
};
