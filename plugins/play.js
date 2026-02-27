// Temporary store for pending replies
const pendingPlayReplies = {};

// ========== PLAY COMMAND ==========
cmd({
  pattern: "play",
  alias: ["p"],
  react: "🎵",
  desc: "Play audio/video from YouTube using numbers",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
  const query = q || args.join(" ").trim();
  if (!query) return conn.sendMessage(from, { text: "Please provide a song or video name." }, { quoted: mek });

  try {
    const search = await yts(query);
    const video = (search && search.videos && search.videos[0]) || (search.all && search.all[0]);
    if (!video) return conn.sendMessage(from, { text: "No results found." }, { quoted: mek });

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");

    // Save pending request for this user
    pendingPlayReplies[from] = { video, safeTitle };

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
    await conn.sendMessage(from, { text: "An error occurred while searching." }, { quoted: mek });
  }
});

// ========== REPLY HANDLER ==========
cmd({
  pattern: ".*",
  dontAddCommandList: true
}, async (conn, mek, m, { from, body }) => {
  // Only proceed if user has a pending menu
  if (!pendingPlayReplies[from]) return;

  const choice = body.trim();
  if (!/^[1-5]$/.test(choice)) return; // Only accept numbers 1–5

  const { video, safeTitle } = pendingPlayReplies[from];
  delete pendingPlayReplies[from]; // Clear pending request

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
    console.error("[PLAY REPLY ERROR]", e);
    await conn.sendMessage(from, { text: "An error occurred while processing your selection." }, { quoted: mek });
  }
});
