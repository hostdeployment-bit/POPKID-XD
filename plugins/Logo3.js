const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions2');

//---------------------------------------------
//           POPKID AI: DUAL-TEXT LOGOS (FIXED)
//---------------------------------------------

const dualTextEffects = [
    { pattern: "space3d", react: "🚀" },
    { pattern: "pornhubLogo", react: "🟠" },
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
        desc: `Create a ${effect.pattern} logo`,
        category: "logo",
        react: effect.react,
        filename: __filename
    }, async (conn, mek, m, { from, args, reply }) => {
        try {
            const input = args.join(" ").trim();
            if (!input) return reply(`❌ Use: .${effect.pattern} Text1, Text2`);

            let text1, text2;

            if (input.includes(",")) {
                let split = input.split(",");
                text1 = split[0].trim();
                text2 = split[1].trim();
            } else {
                let split = input.split(" ");
                text1 = split[0].trim();
                text2 = split.slice(1).join(" ").trim() || "AI";
            }

            // Ensure we don't send empty strings to the API
            if (!text1 || !text2) return reply("❌ Please provide two valid names.");

            const apiUrl = `https://api.giftedtech.co.ke/api/ephoto360/${effect.pattern}?apikey=gifted&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`;

            // Adding a small delay/timeout handling via fetchJson
            const data = await fetchJson(apiUrl);

            if (!data || data.success !== true || !data.result?.image_url) {
                // Log error to console to see what the API actually says
                console.log(`API Error [${effect.pattern}]:`, data);
                return reply("❌ Generation failed. The API might be rate-limited. Try again in a few seconds.");
            }

            await conn.sendMessage(from, {
                image: { url: data.result.image_url },
                caption: `*${effect.react} POPKID AI: ${effect.pattern.toUpperCase()} ${effect.react}*\n\n*👤 Text 1:* ${text1}\n*👤 Text 2:* ${text2}\n\n*Created by Popkid Kenya*`
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            return reply(`*Error:* ${e.message}`);
        }
    });
});
