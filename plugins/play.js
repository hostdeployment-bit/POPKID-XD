/**
 * yt-play.js
 * Plugin command to play audio/video from YouTube using numbered replies
 *
 * Requires: axios, yt-search
 * Install: npm i axios yt-search
 */

const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../command");
const config = require("../config");

const NEWSLETTER_JID = "120363382023564830@newsletter";
const NEWSLETTER_NAME = "Bmb Tech Info";
const BOT = config.botName || "Nova-Xmd";
const BASE_URL = process.env.BASE_URL || "https://noobs-api.top";

// Temporary store to track user selections
const pendingPlayRequests = {};

const buildCaption = (type, video) => {
  const banner = type.includes("video") ? "🎬 Nova-Xmd Video Player" : "🎧 Nova-Xmd Music Player";
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

const getContextInfo = (query = "") => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: NEWSLETTER_NAME,
    serverMessageId: -1
  },
  body: query ? `Requested: ${query}` : undefined,
  title: BOT
});

/* ========== PLAY COMMAND ========== */
cmd({
  pattern: "play",
  alias: ["p"],
  use: ".play <song/video name>",
  react: "🎵",
  desc: "Play audio/video from YouTube with numbered menu",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
  const query = q || args.join(" ").trim();
  if (!query) return conn.sendMessage(from, { text: "Please provide a song or video name." }, { quoted: mek });

  try {
    const search = await yts(query);
    const video = (search && (search.videos && search.videos[0])) || (search.all && search.all[0]);
    if (!video) return conn.sendMessage(from, { text: "No results found." }, { quoted: mek });

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");

    // Save pending request with sender ID
    pendingPlayRequests[from] = { video, safeTitle };

    // Send numbered menu
    const menu = `
Choose how you want to receive "${video.title}":

1. 🎧 Audio
2. 🎬 Video
3. 📃 Audio Document
4. 📃 Video Document
5. 🎙 Voice Note

Reply with the number (1-5) to get your choice.
`;

    await conn.sendMessage(from, { text: menu }, { quoted: mek });

  } catch (e) {
    console.error("[PLAY ERROR]", e);
    await conn.sendMessage(from, { text: "An error occurred while searching for your request." }, { quoted: mek });
  }
});

/* ========== REPLY HANDLER FOR NUMBER MENU ========== */
cmd({
  pattern: ".*",
  dontAddCommandList: true
}, async (conn, mek, m, { from, body }) => {
  if (!pendingPlayRequests[from]) return; // No pending menu for this user
  if (!/^[1-5]$/.test(body.trim())) return; // Only accept 1-5

  const choice = body.trim();
  const { video, safeTitle } = pendingPlayRequests[from];
  delete pendingPlayRequests[from]; // Clear after selection

  const formatMap = {
    "1": { type: "audio", format: "mp3" },
    "2": { type: "video", format: "mp4" },
    "3": { type: "adoc", format: "mp3" },
    "4": { type: "vdoc", format: "mp4" },
    "5": { type: "vn", format: "mp3" }
  };

  const { type, format } = formatMap[choice];
  const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId || video.url)}&format=${format}`;

  try {
    const { data } = await axios.get(apiURL);
    if (!data || !data.downloadLink) return conn.sendMessage(from, { text: "Failed to get download link." }, { quoted: mek });

    const fileName = `${safeTitle}.${format}`;

    if (type === "audio") {
      await conn.sendMessage(from, {
        audio: { url: data.downloadLink },
        mimetype: "audio/mpeg",
        fileName,
        contextInfo: getContextInfo(safeTitle)
      }, { quoted: mek });
    } else if (type === "video") {
      await conn.sendMessage(from, {
        video: { url: data.downloadLink },
        caption: buildCaption("video", video),
        mimetype: "video/mp4",
        fileName,
        contextInfo: getContextInfo(safeTitle)
      }, { quoted: mek });
    } else if (type === "adoc") {
      await conn.sendMessage(from, {
        document: { url: data.downloadLink },
        mimetype: "audio/mpeg",
        fileName,
        contextInfo: getContextInfo(safeTitle)
      }, { quoted: mek });
    } else if (type === "vdoc") {
      await conn.sendMessage(from, {
        document: { url: data.downloadLink },
        mimetype: "video/mp4",
        fileName,
        contextInfo: getContextInfo(safeTitle)
      }, { quoted: mek });
    } else if (type === "vn") {
      await conn.sendMessage(from, {
        audio: { url: data.downloadLink },
        mimetype: "audio/mpeg",
        ptt: true,
        contextInfo: getContextInfo(safeTitle)
      }, { quoted: mek });
    }

  } catch (e) {
    console.error("[PLAY NUMBER ERROR]", e);
    await conn.sendMessage(from, { text: "An error occurred while processing your selection." }, { quoted: mek });
  }
});
