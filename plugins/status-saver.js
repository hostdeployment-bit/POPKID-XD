const { cmd } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

cmd({
  pattern: "save",
  alias: ["sendme", "send"],
  react: "📤",
  desc: "Forward quoted media back to yourself",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from }) => {
  try {

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "🍁 *Reply to an image, video, or audio message.*"
      }, { quoted: message });
    }

    const quotedMsg = match.quoted;
    const msgType = Object.keys(quotedMsg.message)[0];

    // Only allow supported media types
    if (!["imageMessage", "videoMessage", "audioMessage"].includes(msgType)) {
      return await client.sendMessage(from, {
        text: "❌ Only *image, video, and audio* messages are supported."
      }, { quoted: message });
    }

    // Download media properly (New Baileys Method)
    const stream = await downloadContentFromMessage(
      quotedMsg.message[msgType],
      msgType.replace("Message", "")
    );

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // Prepare outgoing message
    let sendContent = {};

    if (msgType === "imageMessage") {
      sendContent = {
        image: buffer,
        caption: quotedMsg.message.imageMessage.caption || "",
        mimetype: "image/jpeg"
      };
    }

    if (msgType === "videoMessage") {
      sendContent = {
        video: buffer,
        caption: quotedMsg.message.videoMessage.caption || "",
        mimetype: "video/mp4"
      };
    }

    if (msgType === "audioMessage") {
      sendContent = {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: quotedMsg.message.audioMessage.ptt || false
      };
    }

    await client.sendMessage(from, sendContent, { quoted: message });

  } catch (error) {
    console.error("🔥 SEND COMMAND ERROR:", error);

    await client.sendMessage(from, {
      text: "❌ *Failed to forward media!*\n\n" + error.message
    }, { quoted: message });
  }
});
