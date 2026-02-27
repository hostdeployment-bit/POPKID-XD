/**
 * yt-play.js
 * Legitimate styling for Popkid-MD
 * * Requires: axios, yt-search
 */

const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../command");
const config = require("../config");

// Updated to your Popkid-MD newsletter and bot name
const NEWSLETTER_JID = "120363423997837331@newsletter"; //
const NEWSLETTER_NAME = "POPKID MD"; //
const BOT = "POPKID-MD"; //

const buildCaption = (type, video) => {
  const banner = type === "video" ? `🎬 POPKID MD VIDEO PLAYER` : `🎶 POPKID MD PLAYER`; //
  const duration = video.timestamp || video.duration || "N/A";

  return (
    `*${banner}*\n\n` +
    `╭───────────────◆\n` +
    `│ 📑 Title: ${video.title}\n` + //
    `│ ⏳ Duration: ${duration}\n` + //
    `╰────────────────◆\n\n` +
    `⏳ *Sending audio...*` //
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
  body: query ? `Popkid-MD • Requested: ${query}` : undefined,
  title: BOT
});

const BASE_URL = process.env.BASE_URL || "https://noobs-api.top";

/* ========== PLAY (audio stream) ========== */
cmd({
  pattern: "play",
  alias: ["p", "song"],
  use: ".play <song name>",
  react: "🎵",
  desc: "Play audio (stream) from YouTube",
  category: "download",
  filename: __filename
},
async (conn, mek, m, { from, args, q, quoted, isCmd, reply }) => {
  const query = q || args.join(" ");
  if (!query) return conn.sendMessage(from, { text: "❌ Give me a song name, Popkid!" }, { quoted: mek });

  try {
    const search = await yts(query);
    const video = (search && (search.videos && search.videos[0])) || (search.all && search.all[0]);
    if (!video) return conn.sendMessage(from, { text: "❌ No results found." }, { quoted: mek });

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeTitle}.mp3`;
    const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId || video.url)}&format=mp3`;

    const { data } = await axios.get(apiURL);
    if (!data || !data.downloadLink) return conn.sendMessage(from, { text: "❌ API failed to fetch audio link." }, { quoted: mek });

    // Send styled message with standardized thumbnail
    await conn.sendMessage(from, {
        image: { url: video.thumbnail, renderSmallThumbnail: true }, // standardised width
        caption: buildCaption("audio", video),
        contextInfo: {
            ...getContextInfo(query),
            externalAdReply: {
                title: video.title,
                body: "Popkid-MD Music Downloader",
                mediaType: 1,
                thumbnailUrl: video.thumbnail,
                sourceUrl: video.url,
                renderLargerThumbnail: false // standards
            }
        }
    }, { quoted: mek });

    // Send audio file with styled metadata
    await conn.sendMessage(from, {
      audio: { url: data.downloadLink },
      mimetype: "audio/mpeg",
      fileName,
      contextInfo: {
        externalAdReply: {
          title: video.title, //
          body: "Popkid-MD Music", //
          mediaType: 1,
          thumbnailUrl: video.thumbnail, // standard
          renderLargerThumbnail: false
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error("[PLAY ERROR]", e);
    await conn.sendMessage(from, { text: "❌ An error occurred while processing your request." }, { quoted: mek });
  }
});
