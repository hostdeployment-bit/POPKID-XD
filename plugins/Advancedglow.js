const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions2');

//---------------------------------------------
//           POPKID AI: ADVANCED GLOW
//---------------------------------------------
cmd({
    pattern: "advancedglow",
    desc: "Create an Advanced Glow text effect",
    category: "logo",
    react: "🌟",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return reply("❌ Please provide a name. Example: .advancedglow Popkid");
        }
        
        const name = args.join(" ");
        
        // Build the API URL for Advanced Glow
        const apiUrl = `https://api.giftedtech.co.ke/api/ephoto360/advancedglow?apikey=gifted&text=${encodeURIComponent(name)}`;

        // Fetch JSON response
        const data = await fetchJson(apiUrl);

        // Validation based on the JSON structure
        if (!data || !data.success || !data.result?.image_url) {
            return reply("❌ Failed to generate logo. The API might be offline.");
        }

        // Send the image using the result.image_url
        await conn.sendMessage(from, {
            image: { url: data.result.image_url },
            caption: `*🌟 POPKID AI: ADVANCED GLOW 🌟*\n\n*👤 Name:* ${name}\n\n*Created by Popkid from Kenya*`
        }, { quoted: m });

    } catch (e) {
        return reply(`*Error:* ${e.message}`);
    }
});
