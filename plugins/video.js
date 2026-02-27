/**
 * yt-play-video.js
 * Plugin command to play video from YouTube
 *
 * Requires: axios, yt-search
 * Install: npm i axios yt-search
 */

const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../command");
const config = require("../config");

// Helper context info
const NEWSLETTER_JID = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID XD";
const BOT = "Popkid XD";

const buildCaption = (video) => {
  const views = typeof video.views === "number" ? video.views.toLocaleString() : video.views || "N/A";
  const ago = video.ago || video.timestamp || "N/A";
  const channel = (video.author && video.author.name) || video.author || "Unknown";

  return (
    `┌───────────────\n` +
    `│ 🎬 Popkid XD Video \n` +
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
  body: query ? `🎬 Requested: ${query}` : BOT,
  title: NEWSLETTER_NAME
});

const BASE_URL = process.env.BASE_URL || "https://noobs-api.top";

/* ========== PLAY VIDEO ========== */
cmd({
  pattern: "video",
  alias: ["pv", "vx"],
  use: ".playvideo <video name>",
  react: "🎬",
  desc: "Play video from YouTube",
  category: "download",
  filename: __filename
},
async (conn, mek, m, { from, args, q, quoted, isCmd, reply }) => {

  const query = q || args.join(" ");
  if (!query) return conn.sendMessage(from, { text: "Please provide a video name." }, { quoted: mek });

  try {
    const search = await yts(query);
    const video = (search && (search.videos && search.videos[0])) || (search.all && search.all[0]);
    if (!video) return conn.sendMessage(from, { text: "No results found." }, { quoted: mek });

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeTitle}.mp4`;
    const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId || video.url)}&format=mp4`;

    const { data } = await axios.get(apiURL);
    if (!data || !data.downloadLink) return conn.sendMessage(from, { text: "Failed to get download link." }, { quoted: mek });

    // Send thumbnail + caption
    await conn.sendMessage(from, {
      image: { url: video.thumbnail, renderSmallThumbnail: true },
      caption: buildCaption(video),
      contextInfo: getContextInfo(query, video)
    }, { quoted: mek });

    // Send video file
    await conn.sendMessage(from, {
      video: { url: data.downloadLink },
      caption: buildCaption(video),
      mimetype: "video/mp4",
      fileName,
      contextInfo: getContextInfo(query, video)
    }, { quoted: mek });

  } catch (e) {
    console.error("[PLAY VIDEO ERROR]", e);
    await conn.sendMessage(from, { text: "An error occurred while processing your request." }, { quoted: mek });
  }

});
