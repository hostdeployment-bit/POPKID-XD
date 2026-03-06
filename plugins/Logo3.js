const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions2');

//---------------------------------------------
//           POPKID AI: SHORT DUAL-TEXT
//---------------------------------------------

const dualTextEffects = [
    { pattern: "space", api: "space3d", react: "🚀" },
    { pattern: "phub", api: "pornhubLogo", react: "🟠" },
    { pattern: "sketch", api: "pencilSketch", react: "✏️" },
    { pattern: "thor", api: "thorLogo", react: "🔨" },
    { pattern: "deadpool", api: "deadpool", react: "💀" },
    { pattern: "shirt", api: "footballShirt", react: "👕" },
    { pattern: "wolf", api: "wolfGalaxy", react: "🐺" },
    { pattern: "marvel", api: "marvelLogo", react: "🦸" },
    { pattern: "avengers", api: "avengersLogo", react: "🅰️" },
    { pattern: "tiktok", api: "tiktok", react: "📱" }
];

dualTextEffects.forEach((effect) => {
    cmd({
        pattern: effect.pattern,
        desc: `Create a ${effect.pattern} logo`,
        category: "logo",
        react: effect.react,
        filename: __filename
    }, async (conn, mek, m, { from, args, reply }) => {
        try {
            const input = args.join(" ").trim();
            if (!input) return reply(`❌ Use: .${effect.pattern} Text1, Text2`);

            let text1, text2;

            // Better splitting logic
            if (input.includes(",")) {
                let split = input.split(",");
                text1 = split[0].trim();
                text2 = split[1].trim();
            } else {
                let split = input.split(" ");
                text1 = split[0].trim();
                text2 = split.slice(1).join(" ").trim() || "AI";
            }

            // Correct API Mapping
            const apiUrl = `https://api.giftedtech.co.ke/api/ephoto360/${effect.api}?apikey=gifted&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`;

            const data = await fetchJson(apiUrl);

            if (!data || data.success !== true || !data.result?.image_url) {
                return reply("❌ Generation failed. Try again with shorter names.");
            }

            await conn.sendMessage(from, {
                image: { url: data.result.image_url },
                caption: `*${effect.react} POPKID AI: ${effect.pattern.toUpperCase()} ${effect.react}*\n\n*👤 Text 1:* ${text1}\n*👤 Text 2:* ${text2}\n\n*Created by Popkid Kenya*`
            }, { quoted: m });

        } catch (e) {
            return reply(`*Error:* ${e.message}`);
        }
    });
});
