const config = require('../config');

// Object to keep track of warnings in memory
const linkWarnings = {}; 

const handleAntilink = async (conn, m, { isAdmins, isOwner }) => {
    // 1. Check if feature is ON and sender is restricted
    if (config.ANTILINK === 'true' && m.isGroup && !isAdmins && !isOwner && !m.fromMe) {
        
        const body = (m.mtype === 'conversation') ? m.message.conversation : 
                     (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';
        
        const linkRegex = /chat.whatsapp.com\/|http:\/\/|https:\/\//i;

        if (linkRegex.test(body)) {
            const user = m.sender;
            const group = m.chat;
            const warnerId = `${group}-${user}`;

            // Initialize warning count if first time
            if (!linkWarnings[warnerId]) linkWarnings[warnerId] = 0;
            linkWarnings[warnerId]++;

            // 2. Action: DELETE
            await conn.sendMessage(group, { 
                delete: { 
                    remoteJid: group, 
                    fromMe: false, 
                    id: m.key.id, 
                    participant: m.key.participant 
                } 
            });

            // 3. Action: KICK (if warnings exceed 2)
            if (linkWarnings[warnerId] >= 3) {
                await conn.sendMessage(group, { text: `🚫 *MAX WARNINGS REACHED* 🚫\n\n@${user.split('@')[0]} has been kicked for repeated link spamming.`, mentions: [user] });
                
                await conn.groupParticipantsUpdate(group, [user], "remove");
                delete linkWarnings[warnerId]; // Reset count after kick
                return true;
            }

            // 4. Action: WARN
            await conn.sendMessage(group, { 
                text: `🚫 *ANTILINK DETECTED* 🚫\n\n@${user.split('@')[0]}, links are not allowed!\n*Warning:* ${linkWarnings[warnerId]}/3\n_(You will be kicked on the 3rd warning)_`,
                mentions: [user]
            });
            
            return true; 
        }
    }
    return false;
};

module.exports = { handleAntilink };
