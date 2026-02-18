const { cmd } = require('../command');
const fs = require('fs');
// This is the correct way to pull the button helper in Gifted-MD/Popkid-MD
const { sendButtons } = require('gifted-btns'); 

const dataPath = './data/antitag.json';

// Ensure data folder exists
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

// ==================== 1. THE COMMAND ====================
cmd({
    pattern: "antitag",
    desc: "Manage mass-tagging protection with Gifted Buttons",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply, botFooter }) => {
    try {
        if (!isGroup) return reply("❌ *This is for groups only!*");
        if (!isAdmins && !isOwner) return reply("❌ *Admin access required.*");

        let settings = JSON.parse(fs.readFileSync(dataPath));
        
        // Handle input from buttons
        if (args.length >= 1) {
            const status = args[0].toLowerCase();
            const action = args[1]?.toLowerCase() || 'delete';

            if (status === 'on') {
                settings[from] = { enabled: true, action: action };
                fs.writeFileSync(dataPath, JSON.stringify(settings, null, 2));
                return reply(`✅ *𝐀𝐧𝐭𝐢𝐭𝐚𝐠 𝐄𝐧𝐚𝐛𝐥𝐞𝐝*\n🛡️ *𝐌𝐨𝐝𝐞:* ${action.toUpperCase()}`);
            } else if (status === 'off') {
                settings[from] = { enabled: false };
                fs.writeFileSync(dataPath, JSON.stringify(settings, null, 2));
                return reply("❌ *𝐀𝐧𝐭𝐢𝐭𝐚𝐠 𝐃𝐢𝐬𝐚𝐛𝐥𝐞𝐝*");
            }
        }

        // --- GIFTED-BTNS STRUCTURE ---
        const buttons = [
            { buttonId: '.antitag on delete', buttonText: { displayText: '🗑️ DELETE' }, type: 1 },
            { buttonId: '.antitag on warn', buttonText: { displayText: '⚠️ WARN' }, type: 1 },
            { buttonId: '.antitag on kick', buttonText: { displayText: '🚫 KICK' }, type: 1 }
        ];

        const text = `🛡️ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐀𝐍𝐓𝐈-𝐓𝐀𝐆 𝐒𝐘𝐒𝐓𝐄𝐌*\n\n*Status:* ${settings[from]?.enabled ? '✅ ON' : '❌ OFF'}\n*Action:* ${settings[from]?.action || 'None'}\n\nSelect a protection mode below:`;

        // Correct Gifted-Btns Usage
        await sendButtons(conn, from, text, botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪', buttons, mek);

    } catch (err) {
        console.error("Gifted Button Error:", err);
        reply("❌ *Button error.* Make sure 'gifted-btns' is installed in your package.json!");
    }
});

// ==================== 2. THE WATCHER ====================
cmd({
    on: "body" 
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, body }) => {
    try {
        if (!isGroup || isAdmins || isOwner) return; 

        const settings = JSON.parse(fs.readFileSync(dataPath));
        if (!settings[from] || !settings[from].enabled) return;

        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMassTag = mentions.length > 5 || body?.includes('@everyone') || body?.includes('@here');

        if (isMassTag) {
            // Instant Delete
            await conn.sendMessage(from, { 
                delete: { 
                    remoteJid: from, 
                    fromMe: false, 
                    id: mek.key.id, 
                    participant: mek.key.participant 
                } 
            });

            const action = settings[from].action;
            if (action === 'warn') {
                await conn.sendMessage(from, { text: `⚠️ *No tagging allowed!* @${m.sender.split('@')[0]}`, mentions: [m.sender] });
            } else if (action === 'kick') {
                await conn.groupParticipantsUpdate(from, [m.sender], "remove");
            }
        }
    } catch (err) {}
});
