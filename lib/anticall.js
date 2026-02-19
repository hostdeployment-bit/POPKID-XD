const config = require('../config');

const handleCall = async (conn, call) => {
    // Only proceed if the toggle is 'true'
    if (config.ANTICALL === 'true') {
        const callerId = call[0].from;
        const callId = call[0].id;
        const status = call[0].status;

        // We only act when the call is first offered (ringing)
        if (status === 'offer') {
            try {
                // 1. Send the reject signal
                await conn.rejectCall(callId, callerId);

                // 2. Notify the user via text
                await conn.sendMessage(callerId, {
                    text: `*⚠️ AUTO REJECTED ⚠️*\n\n@${callerId.split('@')[0]}, calls are not allowed for this bot. Please text.\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ popkid ᴛᴇᴄʜ 🌟*`,
                    mentions: [callerId]
                });
            } catch (err) {
                console.error("Error rejecting call:", err);
            }
        }
    }
};

module.exports = { handleCall };
