const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const { sendButtons } = require('gifted-btns');

// API Engine
const API_BASE = 'https://api-aswin-sparky.koyeb.app/api/downloader';

cmd({
    pattern: "a",
    alias: ["playvid", "ytvideo", "mp4"],
    desc: "Download video in MP4 and Document formats",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botFooter, botPic }) => {
    try {
        if (!q) return reply("🎬 *Popkid, please provide a video name!*");

        await conn.sendMessage(from, { react: { text: "🎥", key: mek.key } });

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No video results found.");

        const dateNow = Date.now();

        // Premium Caption
        const fancyCaption = `
✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝐈𝐃𝐄𝐎 𝐄𝐍𝐆𝐈𝐍𝐄* ✨

📝 *𝐓𝐢𝐭𝐥𝐞:* ${video.title}
🕒 *𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧:* ${video.timestamp}
👤 *𝐀𝐮𝐭𝐡𝐨𝐫:* ${video.author.name}
📅 *𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐝:* ${video.ago}
👁 *𝐕𝐢𝐞𝐰𝐬:* ${video.views.toLocaleString()}

🚀 *𝐒𝐞𝐥𝐞𝐜𝐭 𝐕𝐢𝐝𝐞𝐨 𝐅𝐨𝐫𝐦𝐚𝐭:*
_Download your preferred format below_
`.trim();

        await sendButtons(conn, from, {
            title: `ᴠɪᴅᴇᴏ ᴍᴜʟᴛɪ-ᴅᴏᴡɴʟᴏᴀᴅᴇʀ`,
            text: fancyCaption,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
            image: video.thumbnail || botPic,
            buttons: [
                { id: `vid_${video.id}_${dateNow}`, text: "🎬 𝐕𝐢𝐝𝐞𝐨 (𝐌𝐏𝟒)" },
                { id: `doc_${video.id}_${dateNow}`, text: "📁 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭" }
            ],
        });

        // ================= VIDEO BUTTON HANDLER =================
        const handleVideoResponse = async (event) => {

            const messageData = event.messages[0];
            if (!messageData.message) return;

            const selectedButtonId =
                messageData.message?.templateButtonReplyMessage?.selectedId ||
                messageData.message?.buttonsResponseMessage?.selectedButtonId;

            if (!selectedButtonId || !selectedButtonId.includes(`_${dateNow}`)) return;
            if (messageData.key?.remoteJid !== from) return;

            await conn.sendMessage(from, {
                react: { text: "⬇️", key: messageData.key }
            });

            try {

                const { data } = await axios.get(
                    `${API_BASE}/video?search=${encodeURIComponent(video.url)}`
                );

                if (!data.status) return reply("❌ Failed to fetch video.");

                const downloadUrl = data.data.url;
                const buttonType = selectedButtonId.split("_")[0];

                switch (buttonType) {

                    case "vid":

                        await conn.sendMessage(from, {
                            video: { url: downloadUrl },
                            mimetype: "video/mp4",
                            caption:
`🎬 *${video.title}*
🕒 ${video.timestamp}
👤 ${video.author.name}`
                        }, { quoted: messageData });

                        break;

                    case "doc":

                        await conn.sendMessage(from, {
                            document: { url: downloadUrl },
                            mimetype: "video/mp4",
                            fileName: `${video.title}.mp4`,
                            caption: `📁 *${video.title}*`
                        }, { quoted: messageData });

                        break;
                }

                await conn.sendMessage(from, {
                    react: { text: "✅", key: messageData.key }
                });

            } catch (err) {
                console.error("Video Button Error:", err);
                reply("❌ Download failed.");
            }

        };

        // Start listener
        conn.ev.on("messages.upsert", handleVideoResponse);

        // Stop listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handleVideoResponse);
        }, 300000);

    } catch (e) {

        console.error(e);
        reply(`❌ Popkid, video search failed: ${e.message}`);

    }
});
