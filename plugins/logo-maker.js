const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions2');

// --- THE ENGINE: Centralized API Handler ---
async function generateLogo(conn, from, name, themeUrl, reply) {
    try {
        // Using Gifted Tech API (Kenya-based)
        const apiUrl = `https://api.giftedtech.co.ke/api/maker/ephoto360?url=${themeUrl}&name=${encodeURIComponent(name)}&apikey=gifted`;
        
        const buffer = await getBuffer(apiUrl);

        if (!buffer || buffer.length < 500) {
            return reply("❌ Failed to generate logo. The API may be down or the name is too long.");
        }

        await conn.sendMessage(from, {
            image: buffer,
            caption: `*✨ KHAN-MD LOGO GENERATOR ✨*\n*👤 Name:* ${name}\n*🎨 Style:* ${themeUrl.split('-').slice(-2, -1)}`
        });
    } catch (e) {
        reply(`*API Error:* ${e.message}`);
    }
}

// --- ALL ACCURATE EFFECTS ---

const effects = [
    { pattern: "3dcomic", url: "https://en.ephoto360.com/create-online-3d-comic-style-text-effects-817.html" },
    { pattern: "dragonball", url: "https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html" },
    { pattern: "blackpink", url: "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html" },
    { pattern: "neonlight", url: "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html" },
    { pattern: "pornhub", url: "https://en.ephoto360.com/create-pornhub-style-logos-online-free-549.html" },
    { pattern: "hacker", url: "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html" },
    { pattern: "naruto", url: "https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html" },
    { pattern: "thor", url: "https://en.ephoto360.com/create-thor-logo-style-text-effects-online-for-free-796.html" },
    { pattern: "sadgirl", url: "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html" },
    { pattern: "galaxy", url: "https://en.ephoto360.com/create-galaxy-wallpaper-mobile-online-528.html" },
    { pattern: "luxury", url: "https://en.ephoto360.com/floral-luxury-logo-collection-for-branding-616.html" },
    { pattern: "birthday", url: "https://en.ephoto360.com/beautiful-3d-foil-balloon-effects-for-holidays-and-birthday-803.html" },
    { pattern: "3dpaper", url: "https://en.ephoto360.com/multicolor-3d-paper-cut-style-text-effect-658.html" },
    { pattern: "eraser", url: "https://en.ephoto360.com/create-eraser-deleting-text-effect-online-717.html" },
    { pattern: "boom", url: "https://en.ephoto360.com/boom-text-comic-style-text-effect-675.html" },
    { pattern: "devilwings", url: "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html" },
    { pattern: "typography", url: "https://en.ephoto360.com/create-typography-status-online-with-impressive-leaves-357.html" },
    { pattern: "sunset", url: "https://en.ephoto360.com/create-sunset-light-text-effects-online-807.html" },
    { pattern: "cat", url: "https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html" },
    { pattern: "frozen", url: "https://en.ephoto360.com/create-a-frozen-christmas-text-effect-online-792.html" }
];

// Automatically register all commands
effects.forEach(effect => {
    cmd({
        pattern: effect.pattern,
        desc: `Generate ${effect.pattern} logo`,
        category: "logo",
        react: "🎨",
        filename: __filename
    }, async (conn, mek, m, { from, args, reply }) => {
        if (!args.length) return reply(`❌ Please provide a name. Example: .${effect.pattern} Popkid`);
        await generateLogo(conn, from, args.join(" "), effect.url, reply);
    });
});
