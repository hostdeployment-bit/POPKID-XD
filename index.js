/**
 * 👑 POPKID-MD (Fixed & Optimized Version)
 * Creator: Popkid Ke
 * Fixes: conn.setStatus -> updateProfileStatus | Status React Stability
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

// ============ CACHE & COOLDOWN ============
const statusReactCache = new Map();
const statusReactCooldown = 3000; // Increased slightly for stability

// ============ LOGGER CONFIGURATION ============
const logThemes = {
    info: ['#4facfe', '#00f2fe'],
    success: ['#00b09b', '#96c93d'],
    error: ['#ff416c', '#ff4b2b'],
    banner: ['#ff00cc', '#3333ff']
};

const cmdLogger = {
    info: (msg) => console.log(gradient(logThemes.info[0], logThemes.info[1])(`ℹ ${msg}`)),
    success: (msg) => console.log(gradient(logThemes.success[0], logThemes.success[1])(`✓ ${msg}`)),
    error: (msg) => console.log(gradient(logThemes.error[0], logThemes.error[1])(`✗ ${msg}`)),
    banner: (msg) => console.log(gradient(logThemes.banner[0], logThemes.banner[1])(msg))
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

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => cmdLogger.error(`Error: ${err.message}`));
process.on("unhandledRejection", (reason) => cmdLogger.error(`Rejection: ${reason}`));

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    Browsers,
    jidDecode,
    fetchLatestBaileysVersion,
    delay // Added delay to prevent 'not-acceptable' errors
} = require('@whiskeysockets/baileys')

const { saveMessage } = require('./data')

//=================== SESSION LOADER ============================
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

async function loadSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) return true;
    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        try {
            const compressedBase64 = config.SESSION_ID.replace("POPKID~", "");
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
            cmdLogger.success("Session Restored ✅");
            return true;
        } catch (e) {
            cmdLogger.error("Session Decompression Failed!");
            return false;
        }
    }
    return false;
}

const app = express()
let conn

async function connectToWA() {
    try {
        await loadSession();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
        const { version } = await fetchLatestBaileysVersion()
        
        conn = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Desktop"),
            auth: state,
            version,
            syncFullHistory: true
        })

        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) qrcode.generate(qr, { small: true })
            
            if (connection === 'open') {
                cmdLogger.success('POPKID-MD IS ONLINE 📲');
                
                // 1. Newsletter Auto-Follow
                const channelJid = "120363423997837331@newsletter";
                try { await conn.newsletterFollow(channelJid); } catch (e) {}

                // 2. Load Plugins
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(p => require("./plugins/" + p));

                // 3. Connection Success Message
                let connectMsg = `╔══════════════════╗\n║ 🚀 POPKID-MD CONNECTED\n╠══════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 DEV: Popkid Kenya\n║ 🕒 TIME: ${new Date().toLocaleTimeString()}\n╚══════════════════╝`;
                await conn.sendMessage(conn.user.id, {
                    image: { url: config.ALIVE_IMG },
                    caption: connectMsg
                });
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
                if (shouldReconnect) connectToWA();
            }
        })

        conn.ev.on('creds.update', saveCreds)

        conn.ev.on('messages.upsert', async (mek) => {
            mek = mek.messages[0]
            if (!mek.message) return
            mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            
            const from = mek.key.remoteJid
            const sender = mek.key.participant || mek.key.remoteJid;

            // ============ ✅ FIXED STATUS HANDLER ============
            if (from === 'status@broadcast') {
                if (config.AUTO_STATUS_SEEN === "true") await conn.readMessages([mek.key]);
                
                if (config.AUTO_STATUS_REACT === "true") {
                    const now = Date.now()
                    // Use Cooldown to prevent spam and account bans
                    if (now - (statusReactCache.get(sender) || 0) > statusReactCooldown) {
                        await delay(1000); // Small delay to prevent 'not-acceptable' error
                        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                        
                        // Smart Emoji Map
                        const emojiMap = { 
                            "love": ["❤️", "💖", "🥰"], "fire": ["🔥", "⚡"], 
                            "happy": ["😊", "🎉"], "sad": ["😢", "💔"],
                            "work": ["💼", "💻"], "food": ["🍕", "🍔"] 
                        };
                        const fallback = config.STATUS_REACTIONS.split(',');
                        let statusText = (mek.message.conversation || mek.message.extendedTextMessage?.text || mek.message.imageMessage?.caption || "").toLowerCase();
                        let selectedEmoji = fallback[Math.floor(Math.random() * fallback.length)];
                        
                        for (let key in emojiMap) {
                            if (statusText.includes(key)) { 
                                selectedEmoji = emojiMap[key][Math.floor(Math.random() * emojiMap[key].length)]; 
                                break; 
                            }
                        }

                        try {
                            await conn.sendMessage('status@broadcast', {
                                react: { text: selectedEmoji, key: mek.key }
                            }, { statusJidList: [sender, botJid] });
                            
                            statusReactCache.set(sender, now);
                            cmdLogger.success(`Reacted to Status: ${sender.split('@')[0]}`);
                        } catch (e) {
                            cmdLogger.error(`Status React Failed: ${e.message}`);
                        }
                    }
                }
                
                if (config.AUTO_STATUS_REPLY === "true" && !mek.key.fromMe) {
                    await conn.sendMessage(sender, { text: config.AUTO_STATUS_MSG }, { quoted: mek });
                }
                return;
            }

            // ============ NORMAL MESSAGE PROCESSING ============
            const m = sms(conn, mek)
            const type = getContentType(mek.message)
            const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
            const isCmd = body.startsWith(config.PREFIX)
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
            const isOwner = sender.split('@')[0] === config.OWNER_NUMBER || mek.key.fromMe
            
            if (config.READ_MESSAGE === 'true' && from !== 'status@broadcast') await conn.readMessages([mek.key]);
            
            // Eval for Owner (%)
            if (isOwner && body.startsWith('%')) {
                try { conn.sendMessage(from, { text: util.format(eval(body.slice(2))) }, { quoted: mek }); } catch (e) { conn.sendMessage(from, { text: util.format(e) }, { quoted: mek }); }
                return;
            }

            // Command Handling
            const events = require('./command')
            if (isCmd) {
                const cmd = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)))
                if (cmd) {
                    if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })
                    try {
                        cmd.function(conn, mek, m, { 
                            from, body, isCmd, command, 
                            isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) 
                        });
                    } catch (err) { cmdLogger.error(`Plugin Error: ${err}`); }
                }
            }
        });

    } catch (err) { cmdLogger.error(`Fail: ${err.message}`); }
}

// ============ AUTO BIO (Kenya Time) ============
setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        // FIXED: updateProfileStatus instead of setStatus
        await conn.updateProfileStatus(`${config.BOT_NAME} ⚡ | ⏰ ${time}`).catch(() => {});
    }
}, 60000);

// Simple Cache Clear to prevent Memory Leak
setInterval(() => statusReactCache.clear(), 1000 * 60 * 60); // Clear every hour

app.get("/", (req, res) => res.send("POPKID-MD ACTIVE ✅"));
app.listen(process.env.PORT || 9090);
setTimeout(() => connectToWA(), 3000);
