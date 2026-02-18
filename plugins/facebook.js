const { cmd } = require("../command");
const getFBInfo = require("@xaviabot/fb-downloader");
const config = require("../config");
const { sendButtons } = require('gifted-btns');

cmd({
    pattern: "fb",
    alias: ["facebook", "facebook1", "fb1"],
    desc: "Download Facebook videos/audios with buttons",
    category: "download",
    react: "📽️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, botFooter, botPic }) => {
    try {
        const fbUrl = q && q.trim();
        if (!fbUrl) return reply("Please provide a Facebook video link!");
        if (!fbUrl.includes("facebook.com") && !fbUrl.includes("fb.watch"))
            return reply("Please provide a valid Facebook video link.");

        const videoData = await getFBInfo(fbUrl);

        if (!videoData || !videoData.sd)
            return reply("❌ Failed to fetch video. Ensure the video is public.");

        const uniqueId = Math.random().toString(36).substring(7);

        const fancyCaption = `
✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* ✨

📝 *𝐓𝐢𝐭𝐥𝐞:* ${videoData.title || 'Facebook Video'}
🎬 *𝐐𝐮𝐚𝐥𝐢𝐭𝐲:* SD ${videoData.hd ? '/ HD Available' : ''}

🚀 *𝐒𝐞𝐥𝐞𝐜𝐭 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐅𝐨𝐫𝐦𝐚𝐭:*
`.trim();

        await sendButtons(conn, from, {
            title: `ꜰᴀᴄᴇʙᴏᴏᴋ ᴠɪᴅᴇᴏ ᴇɴɢɪɴᴇ`,
            text: fancyCaption,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
            image: videoData.thumbnail || botPic,
            buttons: [
                { id: `fbsd_${uniqueId}`, text: "📽️ 𝐒𝐃 𝐕𝐢𝐝𝐞𝐨" },
                { id: `fbhd_${uniqueId}`, text: "🎥 𝐇𝐃 𝐕𝐢𝐝𝐞𝐨" },
                { id: `fbaud_${uniqueId}`, text: "🎵 𝐀𝐮𝐝𝐢𝐨 (𝐌𝐏𝟑)" }
            ],
        });

        // ==================== BUTTON HANDLER ====================
        const handleFbResponse = async (update) => {
            const messageData = update.messages[0];
            if (!messageData.message) return;

            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            if (!selectedButtonId || !selectedButtonId.endsWith(uniqueId)) return;

            // Kill listener after selection
            conn.ev.off("messages.upsert", handleFbResponse);
            await conn.sendMessage(from, { react: { text: "📥", key: messageData.key } });

            try {
                const type = selectedButtonId.split("_")[0];

                switch (type) {
                    case "fbsd":
                        await conn.sendMessage(from, { 
                            video: { url: videoData.sd }, 
                            caption: `*${videoData.title || 'FB Video'}* - SD Quality` 
                        }, { quoted: messageData });
                        break;

                    case "fbhd":
                        const hdUrl = videoData.hd || videoData.sd;
                        await conn.sendMessage(from, { 
                            video: { url: hdUrl }, 
                            caption: `*${videoData.title || 'FB Video'}* - ${videoData.hd ? 'HD' : 'SD (HD N/A)'} Quality` 
                        }, { quoted: messageData });
                        break;

                    case "fbaud":
                        await conn.sendMessage(from, { 
                            audio: { url: videoData.sd }, 
                            mimetype: "audio/mpeg" 
                        }, { quoted: messageData });
                        break;
                }

                await conn.sendMessage(from, { react: { text: "✅", key: messageData.key } });
            } catch (err) {
                console.error("FB Download Error:", err);
                reply("❌ Error processing your request.");
            }
        };

        // Start listening
        conn.ev.on("messages.upsert", handleFbResponse);

        // Cleanup listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handleFbResponse);
        }, 300000);

    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});
