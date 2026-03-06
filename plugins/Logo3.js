const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions2');

//---------------------------------------------
//           POPKID AI: DUAL-TEXT LOGOS
//---------------------------------------------

const dualTextEffects = [
    { pattern: "space3d", react: "🚀" },
    { pattern: "pornhub", react: "🟠" },
    { pattern: "pencilSketch", react: "✏️" },
    { pattern: "thorLogo", react: "🔨" },
    { pattern: "deadpool", react: "💀" },
    { pattern: "footballShirt", react: "👕" },
    { pattern: "wolfGalaxy", react: "🐺" },
    { pattern: "marvelLogo", react: "🦸" },
    { pattern: "avengersLogo", react: "🅰️" },
    { pattern: "tiktok", react: "📱" }
];

dualTextEffects.forEach((effect) => {
    cmd({
        pattern: effect.pattern,
        desc: `Create a ${effect.pattern} logo with two texts`,
        category: "logo",
        react: effect.react,
        filename: __filename
    }, async (conn, mek, m, { from, args, reply }) => {
        try {
            const input = args.join(" ");
            if (!input) return reply(`❌ Please provide text. Example: .${effect.pattern} Popkid, AI`);

            let text1, text2;

            // Smart Splitter: Check for comma, otherwise split by first space
            if (input.includes(",")) {
                [text1, text2] = input.split(",").map(i => i.trim());
            } else {
                const words = input.split(" ");
                text1 = words[0];
                text2 = words.slice(1).join(" ") || "AI"; // Default second text if missing
            }

            // API URL for Dual Text
            const apiUrl = `https://api.giftedtech.co.ke/api/ephoto360/${effect.pattern}?apikey=gifted&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`;

            // Fetch JSON Response
            const data = await fetchJson(apiUrl);

            // Validation using your specific JSON result structure
            if (!data || !data.success || !data.result?.image_url) {
                return reply("❌ Generation failed. The API might be down.");
            }

            // Send image using the image_url from the JSON response
            await conn.sendMessage(from, {
                image: { url: data.result.image_url },
                caption: `*${effect.react} POPKID AI: ${effect.pattern.toUpperCase()} ${effect.react}*\n\n*👤 Text 1:* ${text1}\n*👤 Text 2:* ${text2}\n\n*Created by Popkid from Kenya*`
            }, { quoted: m });

        } catch (e) {
            return reply(`*Error:* ${e.message}`);
        }
    });
});
