const config = require('../config');
const axios = require('axios');
const { cmd } = require('../command');
const yts = require('yt-search');

cmd({
  pattern: 'play',
  desc: 'Search & play YouTube audio',
  category: 'downloader',
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    // 1. Validation: Ensure user provided text
    if (!args.length) {
      return reply('❌ *Provide a song name or link*\n\nExample:\n.play cardigan');
    }

    const query = args.join(' ');

    // 2. Visual Feedback: React to show the bot is searching
    await conn.sendMessage(from, {
      react: { text: '🎧', key: mek.key }
    });

    // 3. The Search Bridge: Find the video URL
    const search = await yts(query);
    const video = search.videos[0];
    
    if (!video) {
      return reply('❌ *No results found. Try a different name.*');
    }

    const videoUrl = video.url;

    // 4. API Request: Fetch download link from your working API
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(videoUrl)}&format=mp3`;
    const { data } = await axios.get(apiUrl);

    // 5. Error Handling: Check if API returned success
    if (!data.success || !data.downloadURL) {
      return reply('❌ *API Error: Failed to fetch the audio link.*');
    }

    // 6. Build UI: Use your preferred structure
    const caption = `
╭═══〘 *YOUTUBE PLAY* 〙═══⊷
┃❍ *Title:* ${data.title}
┃❍ *Duration:* ${video.timestamp}
┃❍ *Views:* ${video.views}
┃❍ *Channel:* ${video.author.name}
╰═════════════════════════⊷

> *${config.BOT_NAME || 'POPKID-MD'}*
> Powered by EliteProTech API
    `.trim();

    // 7. Send the Media
    await conn.sendMessage(from, {
      audio: { url: data.downloadURL },
      mimetype: 'audio/mpeg',
      fileName: `${data.title}.mp3`,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: data.title,
          body: 'Now Playing...',
          thumbnailUrl: video.thumbnail,
          sourceUrl: videoUrl,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

    // 8. Final Success Reaction
    await conn.sendMessage(from, {
      react: { text: '✅', key: mek.key }
    });

  } catch (e) {
    console.error("Play Command Error:", e);
    // Handle status 400 or other axios errors gracefully
    const errorMessage = e.response ? `API Error (${e.response.status})` : e.message;
    reply(`❌ *Error:* ${errorMessage}`);
  }
});
