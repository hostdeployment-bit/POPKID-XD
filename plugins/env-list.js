const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');

//━━━━━━━━━━━━━━━━━━━━━━━━━━//
//      iOS STYLE HELPERS
//━━━━━━━━━━━━━━━━━━━━━━━━━━//

const isEnabled = (val) => 
    val && val.toString().toLowerCase() === "true";

// Custom iOS-style toggles
const toggle = (val) => 
    isEnabled(val) ? " ON  [🟢]" : " OFF [⚪]";

const row = (label, value) => 
    `│  %- ${label.padEnd(15)} : ${value}\n`;

const sectionHeader = (title) => 
    `╭───────────────╮\n│  📱 *${title}*\n├───────────────╯\n`;

const sectionFooter = 
    `╰━━━━━━━━━━━━━━━╼\n`;

//━━━━━━━━━━━━━━━━━━━━━━━━━━//
//          COMMAND
//━━━━━━━━━━━━━━━━━━━━━━━━━━//

cmd({
    pattern: "config",
    alias: ["settings", "setup", "ios"],
    desc: "iOS-themed Bot Configuration Menu",
    category: "system",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    try {
        // --- Header Section ---
        let iosMenu = ` *${config.BOT_NAME}* Settings\n`;
        iosMenu += `_v4.0.2 • System Update Ready_\n\n`;

        // --- Profile Section ---
        iosMenu += sectionHeader("SYSTEM PROFILE");
        iosMenu += row("Owner", config.OWNER_NAME);
        iosMenu += row("Version", "Gemini-3-Flash");
        iosMenu += row("Uptime", runtime(process.uptime()));
        iosMenu += row("Mode", config.MODE.toUpperCase());
        iosMenu += sectionFooter;

        // --- Connectivity ---
        iosMenu += sectionHeader("CONNECTIVITY");
        iosMenu += row("Public Mode", toggle(config.PUBLIC_MODE));
        iosMenu += row("Always On", toggle(config.ALWAYS_ONLINE));
        iosMenu += row("Read Status", toggle(config.READ_MESSAGE));
        iosMenu += sectionFooter;

        // --- Automation ---
        iosMenu += sectionHeader("AUTOMATION");
        iosMenu += row("Auto Reply", toggle(config.AUTO_REPLY));
        iosMenu += row("Auto React", toggle(config.AUTO_REACT));
        iosMenu += row("Auto Stick", toggle(config.AUTO_STICKER));
        iosMenu += sectionFooter;

        // --- Privacy & Security ---
        iosMenu += sectionHeader("PRIVACY & SECURITY");
        iosMenu += row("Anti-Link", toggle(config.ANTI_LINK));
        iosMenu += row("Anti-Bad", toggle(config.ANTI_BAD));
        iosMenu += row("Anti-ViewOnce", toggle(config.ANTI_VV));
        iosMenu += sectionFooter;

        // --- Status Updates ---
        iosMenu += sectionHeader("STATUS UPDATES");
        iosMenu += row("Auto View", toggle(config.AUTO_STATUS_SEEN));
        iosMenu += row("Auto Like", toggle(config.AUTO_STATUS_REACT));
        iosMenu += sectionFooter;

        // --- Footer Notes ---
        iosMenu += `\n*Description:* _${config.DESCRIPTION}_\n`;
        iosMenu += `\n📌 _Tap to manage your device configuration_`;

        await conn.sendMessage(
            from,
            {
                image: { url: config.MENU_IMAGE_URL },
                caption: iosMenu,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: "System Settings",
                        body: `Connected as: ${config.BOT_NAME}`,
                        mediaType: 1,
                        thumbnailUrl: config.MENU_IMAGE_URL,
                        sourceUrl: "https://github.com/Popkid-Official", // Custom link
                        showAdAttribution: true
                    }
                }
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error("iOS Menu Error:", error);
        reply(`⚠️ *System Error:* ${error.message}`);
    }
});
