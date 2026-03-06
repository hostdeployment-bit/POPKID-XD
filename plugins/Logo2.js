const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions2');

//---------------------------------------------
//           POPKID AI: FULL LOGO COLLECTION
//---------------------------------------------

const logoEffects = [
    // --- Initial Set ---
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
    { pattern: "galaxy", react: "✨" },
    // --- Extra Set ---
    { pattern: "colorfulneon", react: "🌈" },
    { pattern: "blackpinksignatures", react: "✍️" },
    { pattern: "dragonball", react: "🐉" },
    { pattern: "comic3d", react: "💥" },
    { pattern: "lighteffect", react: "🔦" },
    { pattern: "sunsetLight", react: "🌇" },
    { pattern: "narutoShippuden", react: "🦊" },
    { pattern: "typographyArt", react: "🎭" },
    { pattern: "titanium", react: "⚔️" },
    { pattern: "watercolor", react: "🖌️" },
    { pattern: "arrowTattoo", react: "🏹" },
    { pattern: "signatureArrow", react: "💘" },
    { pattern: "mascotShield", react: "🛡️" },
    { pattern: "decorativeMetal3d", react: "🔩" },
    { pattern: "foilBalloon", react: "🎈" },
    { pattern: "brokenGlass", react: "🔨" },
    { pattern: "footballLogo", react: "⚽" },
    { pattern: "foggyGlass", react: "🌫️" },
    { pattern: "neonDevilWings", react: "😈" },
    { pattern: "shinyMetallic3d", react: "✨" },
    { pattern: "beachText3d", react: "🏝️" },
    { pattern: "birthdayBalloon", react: "🎂" },
    { pattern: "snow3d", react: "❄️" },
    { pattern: "christmasSnow", react: "🎄" },
    { pattern: "futuristicLight", react: "🚀" },
    { pattern: "embroidery", react: "🧵" },
    { pattern: "fireworks", react: "🎆" },
    { pattern: "assassinLogo", react: "🗡️" },
    { pattern: "sandWriting", react: "🏖️" },
    { pattern: "sand3d", react: "🏜️" },
    { pattern: "sandMessages", react: "📩" },
    { pattern: "roadPaint", react: "🛣️" },
    { pattern: "noelText", react: "🎅" },
    { pattern: "metalLogo", react: "🤘" },
    { pattern: "angelWing", react: "😇" },
    { pattern: "neonGalaxy", react: "🌌" },
    { pattern: "galaxyWrite", react: "🖋️" },
    { pattern: "galaxyBat", react: "🦇" }
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
            
            // Build the API URL dynamically using the pattern name
            const apiUrl = `https://api.giftedtech.co.ke/api/ephoto360/${effect.pattern}?apikey=gifted&text=${encodeURIComponent(name)}`;

            // Fetch JSON response from Gifted Tech API
            const data = await fetchJson(apiUrl);

            // Check success and extract image_url
            if (!data || !data.success || !data.result?.image_url) {
                return reply("❌ Generation failed. The API might be offline or rate-limited.");
            }

            // Send image back to user
            await conn.sendMessage(from, {
                image: { url: data.result.image_url },
                caption: `*${effect.react} POPKID AI: ${effect.pattern.toUpperCase()} ${effect.react}*\n\n*👤 Name:* ${name}\n\n*Created by Popkid from Kenya*`
            }, { quoted: m });

        } catch (e) {
            return reply(`*Error:* ${e.message}`);
        }
    });
});
