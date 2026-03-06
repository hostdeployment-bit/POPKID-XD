const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions2');

//---------------------------------------------
//           POPKID AI: LOGO COLLECTION
//---------------------------------------------

// List of all your provided Gifted Tech endpoints
const logoEffects = [
    { pattern: "nigerianflag", react: "🇳🇬" },
    { pattern: "neonglitch", react: "⚡" },
    { pattern: "pixelglitch", react: "👾" },
    { pattern: "typographytext", react: "🔠" },
    { pattern: "americanflag", react: "🇺🇸" },
    { pattern: "deletingtext", react: "📝" },
    { pattern: "cartoonstyle", react: "🎨" },
    { pattern: "logomaker", react: "🛠️" },
    { pattern: "underwater", react: "🌊" },
    { pattern: "glowingtext", react: "✨" },
    { pattern: "blackpinkstyle", react: "💗" },
    { pattern: "multicolored", react: "🌈" },
    { pattern: "luxurygold", react: "🏆" },
    { pattern: "summerbeach", react: "🏖️" },
    { pattern: "gradienttext", react: "🖍️" },
    { pattern: "effectclouds", react: "☁️" },
    { pattern: "galaxystyle", react: "🌌" },
    { pattern: "texteffect", react: "🪄" },
    { pattern: "makingneon", react: "💡" },
    { pattern: "1917", react: "🎞️" },
    { pattern: "galaxy", react: "✨" }
];

logoEffects.forEach((effect) => {
    cmd({
        pattern: effect.pattern,
        desc: `Create a ${effect.pattern} text effect`,
        category: "logo",
        react: effect.react,
        filename: __filename
    }, async (conn, mek, m, { from, args, reply }) => {
        try {
            if (!args.length) {
                return reply(`❌ Please provide a name. Example: .${effect.pattern} Popkid`);
            }

            const name = args.join(" ");
            
            // Build the API URL dynamically
            const apiUrl = `https://api.giftedtech.co.ke/api/ephoto360/${effect.pattern}?apikey=gifted&text=${encodeURIComponent(name)}`;

            // Fetch JSON response
            const data = await fetchJson(apiUrl);

            // Validation based on Gifted Tech's JSON structure
            if (!data || !data.success || !data.result?.image_url) {
                return reply("❌ Failed to generate logo. The API might be offline.");
            }

            // Send the image using the result.image_url
            await conn.sendMessage(from, {
                image: { url: data.result.image_url },
                caption: `*${effect.react} POPKID AI: ${effect.pattern.toUpperCase()} ${effect.react}*\n\n*👤 Name:* ${name}\n\n*Created by Popkid from Kenya*`
            }, { quoted: m });

        } catch (e) {
            return reply(`*Error:* ${e.message}`);
        }
    });
});
