const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions2');

//---------------------------------------------
//           POPKID AI: DUAL-TEXT LOGOS
//---------------------------------------------

const dualTextEffects = [
    { pattern: "space3d", react: "🚀" },
    { pattern: "pornhub", react: "🟠" },
    { pattern: "pencilsketch", react: "✏️" },
    { pattern: "thor", react: "🔨" },
    { pattern: "deadpool", react: "💀" },
    { pattern: "footballshirt", react: "👕" },
    { pattern: "wolfgalaxy", react: "🐺" },
    { pattern: "marvel", react: "🦸" },
    { pattern: "avengers", react: "🅰️" },
    { pattern: "tiktok", react: "📱" }
];

dualTextEffects.forEach((effect) => {
    cmd({
        pattern: effect.pattern,
        desc: `Create a ${effect.pattern} logo with two names`,
        category: "logo",
        react: effect.react,
        filename: __filename
    }, async (conn, mek, m, { from, args, reply }) => {
        try {
            // Check if user provided two parts separated by a comma
            const text = args.join(" ");
            if (!text || !text.includes(",")) {
                return reply(`❌ Please provide two names separated by a comma.\nExample: .${effect.pattern} Popkid, AI`);
            }

            const [text1, text2] = text.split(",").map(item => item.trim());

            if (!text1 || !text2) {
                return reply(`❌ Both names are required.\nExample: .${effect.pattern} Popkid, AI`);
            }
            
            // Build the Dual-Text API URL
            const apiUrl = `https://api.giftedtech.co.ke/api/ephoto360/${effect.pattern}?apikey=gifted&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`;

            const data = await fetchJson(apiUrl);

            if (!data || !data.success || !data.result?.image_url) {
                return reply("❌ Generation failed. The API might be offline.");
            }

            await conn.sendMessage(from, {
                image: { url: data.result.image_url },
                caption: `*${effect.react} POPKID AI: ${effect.pattern.toUpperCase()} ${effect.react}*\n\n*👤 Text 1:* ${text1}\n*👤 Text 2:* ${text2}\n\n*Created by Popkid from Kenya*`
            }, { quoted: m });

        } catch (e) {
            return reply(`*Error:* ${e.message}`);
        }
    });
});
