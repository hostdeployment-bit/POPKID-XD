const { cmd } = require('../command'); // Adjust based on your plugin handler

cmd({
    pattern: "anticall",
    desc: "Toggle anti-call feature",
    category: "owner",
    react: "🚫",
    filename: __filename
},
async (conn, mek, m, { args, reply, isOwner }) => {
    if (!isOwner) return reply("This command is for the owner only.");

    if (!args[0]) return reply("Usage: .anticall on | off");

    if (args[0].toLowerCase() === "on") {
        // You would typically update your config or database here
        reply("✅ Anti-call has been enabled.");
    } else if (args[0].toLowerCase() === "off") {
        reply("❌ Anti-call has been disabled.");
    }
});
