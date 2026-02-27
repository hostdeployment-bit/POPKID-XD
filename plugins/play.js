/**
 * yt-play.js
 * Pluins command play song enjoy
 *
 * Requires: axios, yt-search
 * Install: npm i axios yt-search
 */

const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../command");
const config = require("../config");

// Helper context info (match other plugins)
const NEWSLETTER_JID = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "🎧POPKID🎧";
const BOT = config.botName || "POPKID-XD";

const buildCaption = (type, video) => {
  const banner = type === "video" ? "🎬 POPKID-XD Video Player" : "🎧 Nova-Xmd Music Player";
  const views = typeof video.views === "number" ? video.views.toLocaleString() : video.views || "N/A";
  const ago = video.ago || video.timestamp || "N/A";
  const channel = (video.author && video.author.name) || video.author || "Unknown";

  return (
    `┌───────────────\n` +
    `│ ${banner}\n` +
    `├───────────────\n` +
    `│ 🎵 Title   : ${video.title}\n` +
    `│ ⏱ Duration: ${video.timestamp || video.duration || "N/A"}\n` +
    `│ 👁 Views   : ${views}\n` +
    `│ 📅 Uploaded: ${ago}\n` +
    `│ 📺 Channel : ${channel}\n` +
    `└───────────────\n\n` +
    `🔗 ${video.url}`
  );
};

// STYLISH NEWSLETTER CONTEXT
const getContextInfo = (query = "", video = {}) => ({
  forwardingScore: 999,
  isForwarded: true,

  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: NEWSLETTER_NAME,
    serverMessageId: 143
  },

  externalAdReply: {
    title: video.title || BOT,
    body: NEWSLETTER_NAME,
    mediaType: 1,
    renderLargerThumbnail: true,
    thumbnailUrl: video.thumbnail,
    sourceUrl: video.url,
    showAdAttribution: false
  },

  body: query ? `🎧 Requested: ${query}` : BOT,
  title: NEWSLETTER_NAME
});

const BASE_URL = process.env.BASE_URL || "https://noobs-api.top";

/* ========== PLAY (audio stream) ========== */
cmd({
  pattern: "play",
  alias: ["p"],
  use: ".play <song name>",
  react: "🎵",
  desc: "Play audio (stream) from YouTube",
  category: "download",
  filename: __filename
},
async (conn, mek, m, { from, args, q, quoted, isCmd, reply }) => {

  const query = q || args.join(" ");
  if (!query) return conn.sendMessage(from, { text: "Please provide a song name." }, { quoted: mek });

  try {

    const search = await yts(query);
    const video = (search && (search.videos && search.videos[0])) || (search.all && search.all[0]);

    if (!video)
      return conn.sendMessage(from, { text: "No results found." }, { quoted: mek });

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeTitle}.mp3`;

    const apiURL =
      `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId || video.url)}&format=mp3`;

    const { data } = await axios.get(apiURL);

    if (!data || !data.downloadLink)
      return conn.sendMessage(from, { text: "Failed to get download link." }, { quoted: mek });

    await conn.sendMessage(from, {
      image: {
        url: video.thumbnail,
        renderSmallThumbnail: true
      },
      caption: buildCaption("audio", video),
      contextInfo: getContextInfo(query, video)
    }, { quoted: mek });

    await conn.sendMessage(from, {
      audio: {
        url: data.downloadLink
      },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo: getContextInfo(query, video)
    }, { quoted: mek });

  } catch (e) {

    console.error("[PLAY ERROR]", e);

    await conn.sendMessage(from, {
      text: "An error occurred while processing your request."
    }, { quoted: mek });

  }

});
