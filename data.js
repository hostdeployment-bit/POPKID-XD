const fs = require('fs');
const path = require('path');

// Path to store messages temporarily
const msgPath = path.join(__dirname, 'temp_messages.json');

// Ensure the file exists
if (!fs.existsSync(msgPath)) {
    fs.writeFileSync(msgPath, JSON.stringify({}));
}

/**
 * Saves incoming messages to a local file so they can be recovered if deleted.
 */
async function saveMessage(mek) {
    try {
        if (!mek.message) return;
        const id = mek.key.id;
        const messages = JSON.parse(fs.readFileSync(msgPath, 'utf-8'));
        
        // Store the message object
        messages[id] = mek;

        // Keep the file from getting too large (limit to last 500 messages)
        const keys = Object.keys(messages);
        if (keys.length > 500) {
            delete messages[keys[0]];
        }

        fs.writeFileSync(msgPath, JSON.stringify(messages, null, 2));
    } catch (e) {
        console.error("Error saving message:", e);
    }
}

/**
 * Loads a saved message by its ID.
 */
async function loadMessage(id) {
    try {
        const messages = JSON.parse(fs.readFileSync(msgPath, 'utf-8'));
        return messages[id] || null;
    } catch (e) {
        console.error("Error loading message:", e);
        return null;
    }
}

// Exporting the functions your index.js expects
module.exports = {
    saveMessage,
    loadMessage,
    // Adding placeholders for other functions your index.js imports to prevent errors
    AntiDelDB: {}, 
    initializeAntiDeleteSettings: () => {},
    setAnti: () => {},
    getAnti: () => {},
    getAllAntiDeleteSettings: () => {},
    saveContact: () => {},
    getName: () => {},
    getChatSummary: () => {},
    saveGroupMetadata: () => {},
    getGroupMetadata: () => {},
    saveMessageCount: () => {},
    getInactiveGroupMembers: () => {},
    getGroupMembersMessageCount: () => {}
};
