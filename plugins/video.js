const { cmd } = require('../command');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

cmd({
    pattern: "video",
    desc: "Download video and video document",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, botFooter, botPic }) => {
    try {
        if (!args[0]) {
            return reply("❌ Give me a video name or YouTube link!\n\nExample:\n.video arike kumnie");
        }

        const query = args.join(" ");
        await conn.sendMessage(from, { react: { text: "🎬", key: mek.key } });

        let videoUrl = query;

        // 1. KEEPING YOUR YUPRA SEARCH LOGIC
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const searchUrl = `https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`;
            const searchRes = await axios.get(searchUrl);
            if (!searchRes.data.status || !searchRes.data.results[0]) {
                return reply("❌ No results found.");
            }
            videoUrl = searchRes.data.results[0].url;
        }

        // 2. KEEPING YOUR JAWAD-TECH API LOGIC
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result || !data.result.mp4) {
            return reply("❌ Failed to fetch video data.");
        }

        const title = data.result.title || "YouTube Video";
        const videoDownloadUrl = data.result.mp4;
        const thumbnail = data.result.thumbnail || botPic;
        const dateNow = Date.now();

        // 3. FANCY BUTTON LAYOUT
        const fancyCaption = `
╔═══════════════════╗
     🎥  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝐈𝐃𝐄𝐎* 🎥
╚═══════════════════╝

📌 *𝐓𝐢𝐭𝐥𝐞:* ${title}
🚀 *𝐒𝐭𝐚𝐭𝐮𝐬:* Ready to Send

*Select your format below:*
_You can click both buttons!_
`.trim();

        await sendButtons(conn, from, {
            title: `ᴠɪᴅᴇᴏ ᴍᴜʟᴛɪ-ᴅᴏᴡɴʟᴏᴀᴅᴇʀ`,
            text: fancyCaption,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
            image: thumbnail,
            buttons: [
                { id: `vid_${dateNow}`, text: "🎥 𝐕𝐢𝐝𝐞𝐨 (𝐌𝐏𝟒)" },
                { id: `vdoc_${dateNow}`, text: "📁 𝐕𝐢𝐝𝐞𝐨 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭" }
            ],
        });

        // 4. MULTI-RESPONSE HANDLER (Allows clicking both)
        const handleVideoResponse = async (event) => {
            const messageData = event.messages[0];
            if (!messageData.message) return;

            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            if (!selectedButtonId || !selectedButtonId.includes(`${dateNow}`)) return;
            if (messageData.key?.remoteJid !== from) return;

            await conn.sendMessage(from, { react: { text: "📥", key: messageData.key } });

            try {
                const buttonType = selectedButtonId.split("_")[0];

                if (buttonType === "vid") {
                    await conn.sendMessage(from, { 
                        video: { url: videoDownloadUrl }, 
                        caption: `🎬 ${title}\n_By Popkid-MD_`,
                        mimetype: "video/mp4"
                    }, { quoted: messageData });
                } 
                
                else if (buttonType === "vdoc") {
                    await conn.sendMessage(from, { 
                        document: { url: videoDownloadUrl }, 
                        mimetype: "video/mp4", 
                        fileName: `${title}.mp4`,
                        caption: `📂 ${title}`
                    }, { quoted: messageData });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: messageData.key } });
                
                // Note: No conn.ev.off here to allow clicking the second button
            } catch (err) {
                console.error("Video Download Error:", err);
            }
        };

        // Register listener
        conn.ev.on("messages.upsert", handleVideoResponse);

        // Auto-stop listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handleVideoResponse);
        }, 300000);

    } catch (err) {
        console.error(err);
        reply("❌ Error processing video request.");
    }
});
