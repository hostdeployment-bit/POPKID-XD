const yts = require("yt-search");
const axios = require("axios");

const GIFTED_API = "https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=";

module.exports = {

  pattern: "play",
  aliases: ["ytmp3", "music", "song", "yta"],
  category: "downloader",
  react: "🎶",
  description: "Download Audio from Youtube",

  async run(from, Gifted, conText) {

    const {
      q,
      reply,
      react,
      botPic,
      botName,
      gmdBuffer,
      formatAudio
    } = conText;

    try {

      if (!q) {
        await react("❌");
        return reply("Please provide a song name");
      }

      await react("🔍");

      // Search YouTube
      const search = await yts(q);

      if (!search.videos.length) {
        await react("❌");
        return reply("No song found");
      }

      const video = search.videos[0];
      const videoUrl = video.url;

      await react("⬇️");

      // Call GiftedTech API
      const { data } = await axios.get(
        GIFTED_API + encodeURIComponent(videoUrl)
      );

      if (!data.success) {
        await react("❌");
        return reply("Download failed");
      }

      const downloadUrl = data.result.download_url;
      const title = data.result.title;
      const thumbnail = data.result.thumbnail;

      // Get audio buffer
      const buffer = await gmdBuffer(downloadUrl);

      // Convert audio to WhatsApp compatible format
      const convertedAudio = await formatAudio(buffer);

      // Send thumbnail info
      await Gifted.sendMessage(
        from,
        {
          image: { url: thumbnail || botPic },
          caption:
`🎶 *${botName} AUDIO DOWNLOADER*

⿻ Title: ${title}
⿻ Duration: ${video.timestamp}

Sending audio...`
        }
      );

      // Send audio using new WhatsApp format
      await Gifted.sendMessage(
        from,
        {
          audio: convertedAudio,
          mimetype: "audio/mpeg"
        }
      );

      await react("✅");

    }
    catch (error) {

      console.error("Play Error:", error);

      await react("❌");
      reply("Failed to download audio. Try again later.");

    }

  }

};
