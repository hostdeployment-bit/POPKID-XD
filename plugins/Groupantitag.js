const { cmd } = require('../command');
const fs = require('fs');

// Path to save settings
const dataPath = './data/antitag.json';

// Ensure data folder exists
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

// ==================== 1. THE COMMAND ====================
cmd({
    pattern: "antitag",
    alias: ["antimention"],
    desc: "Protect group from mass mentions",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isGroup) return reply("❌ *Popkid, this is for groups only!*");
        if (!isAdmins && !isOwner) return reply("❌ *Admin or Owner access required.*");

        let settings = JSON.parse(fs.readFileSync(dataPath));
        const status = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase() || 'delete';

        if (status === 'on') {
            settings[from] = { enabled: true, action: action };
            fs.writeFileSync(dataPath, JSON.stringify(settings, null, 2));
            return reply(`✅ *Antitag Enabled*\n🛡️ *Action:* ${action.toUpperCase()}\n\n> *Unauthorized mass tags will be handled.*`);
        } 
        
        if (status === 'off') {
            settings[from] = { enabled: false };
            fs.writeFileSync(dataPath, JSON.stringify(settings, null, 2));
            return reply("❌ *Antitag Disabled.*");
        }

        reply(`🛡️ *Popkid-MD Antitag Settings*\n\nUsage: .antitag [on/off] [action]\nActions: delete | warn | kick\n\nExample: *.antitag on kick*`);

    } catch (err) {
        console.error(err);
        reply("❌ Error setting Antitag.");
    }
});

// ==================== 2. THE WATCHER ====================
// This part runs automatically for every message without touching index.js
cmd({
    on: "body" 
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, body }) => {
    try {
        if (!isGroup || isAdmins || isOwner) return; // Skip if not group or if sender is Admin

        const settings = JSON.parse(fs.readFileSync(dataPath));
        if (!settings[from] || !settings[from].enabled) return;

        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMassTag = mentions.length > 5 || body.includes('@everyone') || body.includes('@here');

        if (isMassTag) {
            const action = settings[from].action;

            // 1. Delete the message
            await conn.sendMessage(from, { delete: mek.key });

            // 2. Perform action
            if (action === 'warn') {
                await conn.sendMessage(from, { 
                    text: `⚠️ @${m.sender.split('@')[0]}, mass tagging is not allowed!`,
                    mentions: [m.sender]
                }, { quoted: mek });
            } 
            
            else if (action === 'kick') {
                await conn.sendMessage(from, { text: `🚫 *Kicking @${m.sender.split('@')[0]} for mass tagging...*`, mentions: [m.sender] });
                await conn.groupParticipantsUpdate(from, [m.sender], "remove");
            }
        }
    } catch (err) {
        // Silent error to prevent logs spamming during every message
    }
});
