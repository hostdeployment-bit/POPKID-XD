const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const { sendButtons } = require('gifted-btns');

// API Engine
const API_BASE = 'https://api-aswin-sparky.koyeb.app/api/downloader';

cmd({
    pattern: "video",
    alias: ["ytv", "mp4"],
    desc: "Download video in 2 formats: MP4 and Video Document",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botName, botFooter, botPic }) => {
    try {
        if (!q) return reply("🎥 *Popkid, please provide a video name or link!*");
        
        await conn.sendMessage(from, { react: { text: "🎬", key: mek.key } });

        // Search for video details
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        const dateNow = Date.now();

        // Fancy Premium Video Caption
        const fancyCaption = `
╔═══════════════════╗
     🎥  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝐈𝐃𝐄𝐎* 🎥
╚═══════════════════╝

📌 *𝐓𝐢𝐭𝐥𝐞:* ${video.title}
🕒 *𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧:* ${video.timestamp}
👤 *𝐂𝐡𝐚𝐧𝐧𝐞𝐥:* ${video.author.name}
👁️ *𝐕𝐢𝐞𝐰𝐬:* ${video.views.toLocaleString()}

🚀 *𝐒𝐞𝐥𝐞𝐜𝐭 𝐕𝐢𝐝𝐞𝐨 𝐅𝐨𝐫𝐦𝐚𝐭:*
_You can download both if you like!_
`.trim();

        // Send Gifted Style Buttons
        await sendButtons(conn, from, {
            title: `ᴠɪᴅᴇᴏ ᴍᴜʟᴛɪ-ᴅᴏᴡɴʟᴏᴀᴅᴇʀ`,
            text: fancyCaption,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
            image: video.thumbnail || botPic,
            buttons: [
                { id: `vid_${video.id}_${dateNow}`, text: "🎥 𝐕𝐢𝐝𝐞𝐨 (𝐌𝐏𝟒)" },
                { id: `vdoc_${video.id}_${dateNow}`, text: "📁 𝐕𝐢𝐝𝐞𝐨 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭" }
            ],
        });

        // ==================== MULTI-RESPONSE HANDLER ====================
        const handleVideoResponse = async (event) => {
            const messageData = event.messages[0];
            if (!messageData.message) return;

            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            // Validate the click for this specific session
            if (!selectedButtonId || !selectedButtonId.includes(`_${dateNow}`)) return;
            if (messageData.key?.remoteJid !== from) return;

            await conn.sendMessage(from, { react: { text: "📥", key: messageData.key } });

            try {
                // Using the stable Aswin Sparky API for downloads
                const { data } = await axios.get(`${API_BASE}/ytv?url=${encodeURIComponent(video.url)}`);
                if (!data.status) return;
                
                const downloadUrl = data.data.url;
                const buttonType = selectedButtonId.split("_")[0];

                if (buttonType === "vid") {
                    // Send as normal Video
                    await conn.sendMessage(from, { 
                        video: { url: downloadUrl }, 
                        caption: `🎬 *${video.title}*\n_Downloaded by Popkid-MD_`,
                        mimetype: "video/mp4"
                    }, { quoted: messageData });
                } 
                
                else if (buttonType === "vdoc") {
                    // Send as Video Document
                    await conn.sendMessage(from, { 
                        document: { url: downloadUrl }, 
                        mimetype: "video/mp4", 
                        fileName: `${video.title}.mp4`,
                        caption: `📂 *${video.title}* (Document)`
                    }, { quoted: messageData });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: messageData.key } });
                
                // Note: Listener stays ON so the user can click the other button too!
            } catch (err) {
                console.error("Video Button Error:", err);
            }
        };

        // Register the event listener
        conn.ev.on("messages.upsert", handleVideoResponse);

        // Auto-kill listener after 5 minutes to prevent memory leaks
        setTimeout(() => {
            conn.ev.off("messages.upsert", handleVideoResponse);
        }, 300000);

    } catch (e) {
        reply(`❌ Popkid, video search failed: ${e.message}`);
    }
});
