const config = require('../config');

const handleCall = async (conn, call) => {
    // Check if the feature is toggled 'true' in config
    if (config.ANTICALL === 'true') {
        const callerId = call[0].from;
        const callId = call[0].id;
        const status = call[0].status;

        // 'offer' is the incoming ring signal
        if (status === 'offer') {
            try {
                // Reject the call immediately
                await conn.rejectCall(callId, callerId);

                // Send the automatic notification message
                await conn.sendMessage(callerId, {
                    text: `🚫 *BOT SYSTEM: CALLS NOT ALLOWED* 🚫\n\n@${callerId.split('@')[0]}, please do not call this number. Use text messages instead.\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ popkid ᴛᴇᴄʜ 🌟*`,
                    mentions: [callerId]
                });
            } catch (err) {
                console.error("Failed to reject call:", err);
            }
        }
    }
};

module.exports = { handleCall };
