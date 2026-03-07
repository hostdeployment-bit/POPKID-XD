/**
👑 POPKID-MD (Ultimate Version)
Creator: Popkid Ke
Features: Smart Status React, Autofollow, Anti-Delete, Command Eval, Aesthetic Logs
*/

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys')

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
const gradient = require('gradient-string')
const express = require("express")

// ============ CACHE & COOLDOWN (Nova Style) ============
const statusReactCache = new Map();
const statusReactCooldown = 3000; 

// ============ LOGGER & BANNER CONFIGURATION ============
const logThemes = {
    info: ['#4facfe', '#00f2fe'],
    success: ['#00b09b', '#96c93d'],
    warning: ['#f83600', '#f9d423'],
    error: ['#ff416c', '#ff4b2b'],
    banner: ['#ff00cc', '#3333ff']
};

const cmdLogger = {
    info: (msg) => console.log(gradient(logThemes.info[0], logThemes.info[1])(`ℹ ${msg}`)),
    success: (msg) => console.log(gradient(logThemes.success[0], logThemes.success[1])(`✓ ${msg}`)),
    warning: (msg) => console.log(gradient(logThemes.warning[0], logThemes.warning[1])(`⚠ ${msg}`)),
    error: (msg) => console.log(gradient(logThemes.error[0], logThemes.error[1])(`✗ ${msg}`)),
    banner: (msg) => console.log(gradient(logThemes.banner[0], logThemes.banner[1])(msg))
};

const botBanner = `██████╗  ██████╗ ██████╗ ██╗  ██╗██╗██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██║██╔══██╗
██████╔╝██║   ██║██████╔╝█████╔╝ ██║██║  ██║
██╔═══╝ ██║   ██║██╔═══╝ ██╔═██╗ ██║██║  ██║
██║     ╚██████╔╝██║     ██║  ██╗██║██████╔╝
╚═╝      ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝`;

console.clear();
cmdLogger.banner(botBanner);

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => cmdLogger.error(`Uncaught Exception: ${err.message}`));
process.on("unhandledRejection", (reason) => cmdLogger.error(`Unhandled Rejection: ${reason}`));

const { getBuffer, getGroupAdmins, saveMessage } = require('./lib/functions')
const ownerNumber = ['254732297194']
const sessionDir = path.join(__dirname, 'sessions');

async function loadGiftedSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(path.join(sessionDir, 'creds.json'))) return true;
    if (config.SESSION_ID && config.SESSION_ID.includes("~")) {
        const prefix = config.SESSION_ID.split('~')[0] + '~';
        const compressedBase64 = config.SESSION_ID.replace(prefix, '');
        try {
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(path.join(sessionDir, 'creds.json'), decompressedBuffer.toString('utf-8'));
            cmdLogger.success("Session restored successfully ✅");
            return true;
        } catch (error) {
            cmdLogger.error("Failed to decompress session ID");
            return false;
        }
    }
    return false;
}

const app = express()
const port = process.env.PORT || 9090
let conn

async function connectToWA() {
    try {
        await loadGiftedSession();
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
                }
            } else if (connection === 'open') {
                cmdLogger.success('POPKID-MD IS ONLINE 📲');
                
                // ============ AUTOFOLLOW LOGIC ============
                const channelJid = "120363423997837331@newsletter"; 
                try {
                    await conn.newsletterFollow(channelJid);
                    cmdLogger.success("Auto-followed Official Channel ✅");
                } catch (e) {}

                // Load Plugins
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(plugin => require("./plugins/" + plugin));
                
                let up = `╔══════════════════╗\n║ 🚀 POPKID-MD CONNECTED\n╠══════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 DEV: Popkid Kenya\n╚══════════════════╝`;
                await conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/j9ia5c.png` }, caption: up });
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

            // ============ SMART STATUS HANDLER (NOVA STYLE) ============  
            if (isStatus) {  
                if (config.AUTO_STATUS_SEEN === "true") {  
                    await conn.readMessages([{ remoteJid: from, id: mek.key.id, participant: mek.key.participant }]);
                }  
                if (config.AUTO_STATUS_REACT === "true") {  
                    const now = Date.now();
                    const lastReact = statusReactCache.get(sender) || 0;
                    if (now - lastReact > statusReactCooldown) {
                        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                        const emojiMap = { "hello": "👋", "morning": "🌅", "night": "🌙", "love": "❤️", "cool": "🔥", "happy": "🎉" };
                        const fallbacks = ['❤️', '🔥', '✨', '💯', '👑', '🥰', '🧡', '⚡'];
                        
                        let statusText = (mek.message.conversation || mek.message.extendedTextMessage?.text || 
                                         mek.message.imageMessage?.caption || mek.message.videoMessage?.caption || '').toLowerCase();

                        let selectedEmoji = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                        for (const word in emojiMap) {
                            if (statusText.includes(word)) { selectedEmoji = emojiMap[word]; break; }
                        }

                        await conn.sendMessage('status@broadcast', { react: { text: selectedEmoji, key: mek.key } }, { statusJidList: [sender, botJid] });
                        statusReactCache.set(sender, now);
                        cmdLogger.info(`✅ Status React: ${selectedEmoji} from ${pushname || sender.split('@')[0]}`);
                    }
                }
                if (config.AUTO_STATUS_REPLY === "true" && !mek.key.fromMe) {  
                    await conn.sendMessage(sender, { text: config.AUTO_STATUS_MSG }, { quoted: mek });  
                }  
                return;  
            }  

            // ============ MESSAGE LOGGER ============  
            if (!mek.key.fromMe) {  
                const typeLog = getContentType(mek.message);  
                const pushLog = (mek.pushName || 'User').substring(0, 12);  
                const timeLog = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false, hour: '2-digit', minute: '2-digit' });  
                console.log(gradient('#00c6ff', '#0072ff')(`┌─── 📩 Msg | 👤 ${pushLog} | ⏰ ${timeLog}`));  
            }  

            // ============ COMMANDS & UTILS ============
            if (config.READ_MESSAGE === 'true' && !isStatus) await conn.readMessages([mek.key]);
            await saveMessage(mek);  
            const m = sms(conn, mek); const type = getContentType(mek.message);  
            const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage' || type == 'videoMessage') ? mek.message[type].caption : ''  
            const isCmd = body.startsWith(config.PREFIX); const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''  
            const args = body.trim().split(/ +/).slice(1); const q = args.join(' ');  
            const isGroup = from.endsWith('@g.us'); const senderNumber = sender.split('@')[0];  
            const botNumber = conn.user.id.split(':')[0]; const isOwner = ownerNumber.includes(senderNumber) || mek.key.fromMe;  
            const pushname = mek.pushName || 'User'; const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek })  
              
            // ============ CREATOR EVAL ============  
            if (isOwner && body.startsWith('%')) {  
                try { let resultTest = eval(body.slice(2)); reply(util.format(resultTest)); } catch (err) { reply(util.format(err)); }  
                return;  
            }  
              
            // ============ COMMAND EXECUTION ============  
            const events = require('./command')  
            const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;  
            if (isCmd) {  
                const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))  
                if (cmd) {  
                    if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })  
                    try { cmd.function(conn, mek, m, { from, body, isCmd, command, args, q, text: q, isGroup, sender, senderNumber, botNumber, pushname, isOwner, reply }); } catch (e) { cmdLogger.error("[PLUGIN ERROR] " + e); }  
                }  
            }  
        });  

        // ============ CORE FUNCTIONS ============  
        conn.decodeJid = jid => { if (!jid) return jid; let decode = jidDecode(jid) || {}; return (decode.user && decode.server && decode.user + '@' + decode.server) || jid; };  
        conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {  
            let quoted = message.msg ? message.msg : message; let mime = (message.msg || message).mimetype || '';  
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];  
            const stream = await downloadContentFromMessage(quoted, messageType); let buffer = Buffer.from([]);  
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }  
            let type = await FileType.fromBuffer(buffer); let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;  
            await fs.writeFileSync(trueFileName, buffer); return trueFileName;  
        }  
        conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {  
            let res = await axios.head(url); let buffer = await getBuffer(url); let mime = res.headers['content-type'];  
            if (mime.split("/")[0] === "image") return conn.sendMessage(jid, { image: buffer, caption, ...options }, { quoted })  
            if (mime.split("/")[0] === "video") return conn.sendMessage(jid, { video: buffer, caption, ...options }, { quoted })  
            if (mime.split("/")[0] === "audio") return conn.sendMessage(jid, { audio: buffer, caption, mimetype: 'audio/mpeg', ...options }, { quoted })  
        }  
        conn.setStatus = status => { conn.query({ tag: 'iq', attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' }, content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }] }); return status; };  
    } catch (err) { cmdLogger.error(`Connection failed: ${err.message}`); }
}

// ============ AUTO BIO & SERVER ============
setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const now = new Date();
        const date = now.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
        const time = now.toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        await conn.setStatus(`❤️ POPKID XMD 🤖 | 📅 ${date} | ⏰ ${time}`).catch(() => { });
    }
}, 60000);

app.get("/", (req, res) => res.send("POPKID-MD ACTIVE ✅"));
app.listen(port, () => cmdLogger.info(`Server active on port ${port}`));
setTimeout(() => { connectToWA() }, 5000);
