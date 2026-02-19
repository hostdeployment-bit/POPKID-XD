const config = require('../config');

/**
 * Logic to handle incoming calls
 * @param {Object} conn - Baileys connection
 * @param {Array} call - Call event data
 */
const handleCall = async (conn, call) => {
    // Only run if the config is set to 'true'
    if (config.ANTICALL === 'true') {
        const callerId = call[0].from;
        const callId = call[0].id;
        const status = call[0].status;

        // 'offer' is the state when the phone starts ringing
        if (status === 'offer') {
            // 1. Reject the call
            await conn.rejectCall(callId, callerId);

            // 2. Send an automated message to the caller
            await conn.sendMessage(callerId, {
                text: `*⚠️ AUTO REJECTED ⚠️*\n\n@${callerId.split('@')[0]}, calls are not allowed for this bot.\nPlease send a text message instead.\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ popkid ᴛᴇᴄʜ 🌟*`,
                mentions: [callerId]
            });
        }
    }
};

module.exports = { handleCall };
