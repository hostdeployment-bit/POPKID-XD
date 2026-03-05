const { cmd } = require('../command')
const { fetchJson, downloadMediaMessage } = require('../lib')
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')

/**
 * 🎵 POPKID-MD Music Identifier (Pro Version)
 * Works with: YouTube Links OR Replying to Audio/Voice Notes.
 */

cmd({
    pattern: "whatmusic",
    alias: ["findmusic", "shazam"],
    desc: "Identify music from a URL or an Audio reply.",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        let musicUrl = q;

        // 1. Check if replying to Audio/Video
        if (m.quoted && (m.quoted.mtype === 'audioMessage' || m.quoted.mtype === 'videoMessage')) {
            reply("📥 *Processing audio, please wait...*");
            
            // Download the audio
            const buffer = await downloadMediaMessage(m.quoted, 'temp_shazam');
            
            // Upload to a temporary hosting (Catbox) to get a URL for the API
            const bodyForm = new FormData();
            bodyForm.append("fileToUpload", buffer, { filename: "music.mp3" });
            bodyForm.append("reqtype", "fileupload");
            
            const uploadRes = await axios.post("https://catbox.moe/user/api.php", bodyForm, {
                headers: { ...bodyForm.getHeaders() }
            });
            
            musicUrl = uploadRes.data; // This is now your audio link
        }

        // 2. Validate we have a URL now
        if (!musicUrl) {
            return reply("⚠️ Please provide a YouTube URL or reply to an audio/voice note with *.whatmusic*");
        }

        reply("🔍 *Analyzing music details...*");

        // 3. Call the API
        const apiUrl = `https://api-faa.my.id/faa/whatmusic?url=${encodeURIComponent(musicUrl)}`;
        const data = await fetchJson(apiUrl);

        if (!data || !data.status || !data.result) {
            return reply("❌ Could not identify any music. Make sure the audio is clear.");
        }

        const res = data.result;

        // 4. Format the Result
        let resultMsg = `🎵 *MUSIC IDENTIFIED* 🎵\n\n`;
        resultMsg += `📌 *Title:* ${res.title}\n`;
        resultMsg += `👤 *Channel/Artist:* ${res.channel}\n`;
        resultMsg += `🕒 *Duration:* ${res.duration}\n`;
        resultMsg += `👁️ *Views:* ${res.views.toLocaleString()}\n`;
        resultMsg += `📅 *Uploaded:* ${res.uploadedAt}\n`;
        resultMsg += `🔗 *Watch:* ${res.url}\n\n`;
        resultMsg += `> *© POPKID-MD BY POPKID KE*`;

        // 5. Send with Thumbnail
        await conn.sendMessage(from, { 
            image: { url: res.thumbnail }, 
            caption: resultMsg 
        }, { quoted: mek });

        // Cleanup temp files if any
        if (fs.existsSync('temp_shazam.mp3')) fs.unlinkSync('temp_shazam.mp3');

    } catch (e) {
        console.error("Music Finder Error: ", e);
        reply("❌ An error occurred. Please ensure you are replying to a valid audio file.");
    }
})
