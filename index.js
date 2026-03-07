/**
 * 👑 POPKID-MD (Complete Signature Version)
 * Creator: Popkid Ke (Kenya)
 * Features: Retry Status Logic, Box Logger, Newsletter Follow, Anti-Crash
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

// ============ LOGGER & BANNER CONFIGURATION ============
const logThemes = {
    info: ['#4facfe', '#00f2fe'],
    success: ['#00b09b', '#96c93d'],
    warning: ['#f83600', '#f9d423'],
    error: ['#ff416c', '#ff4b2b'],
    banner: ['#ff00cc', '#3333ff'],
    msgBox: ['#00c6ff', '#0072ff']
};

const cmdLogger = {
    info: (msg) => console.log(gradient(logThemes.info[0], logThemes.info[1])(`ℹ ${msg}`)),
    success: (msg) => console.log(gradient(logThemes.success[0], logThemes.success[1])(`✓ ${msg}`)),
    warning: (msg) => console.log(gradient(logThemes.warning[0], logThemes.warning[1])(`⚠ ${msg}`)),
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
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const { sleep, saveMessage } = require('./lib/functions')

const ownerNumber = ['254732297194']
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

// ============ SESSION LOADER ============
async function loadSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) return true;
    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        try {
            const compressedBase64 = config.SESSION_ID.substring("POPKID~".length);
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
            cmdLogger.success("Session restored successfully ✅");
            return true;
        } catch (error) {
            cmdLogger.error("Failed to restore session.");
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
            browser: Browsers.macOS("Firefox"),
            auth: state,
            version
        })

        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) qrcode.generate(qr, { small: true })
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
                if (shouldReconnect) setTimeout(() => connectToWA(), 5000)
            } else if (connection === 'open') {
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(plugin => require("./plugins/" + plugin));
                cmdLogger.success(`Bot Online! Loaded ${plugins.length} plugins.`);
                
                // POPKID SIGNATURE CONNECTED MSG
                let up = `╔══════════════════╗\n║ 🚀 POPKID-MD CONNECTED\n╠══════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 DEV: Popkid Kenya\n╚══════════════════╝`;
                await conn.sendMessage(conn.user.id, { 
                    image: { url: `https://files.catbox.moe/j9ia5c.png` },
                    caption: up 
                });

                // NEWSLETTER FOLLOW
                try {
                    await conn.newsletterFollow("120363423997837331@newsletter");
                } catch (e) {}
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
            const myJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

            // ============ STABLE STATUS HANDLER (RETRY LOGIC) ============
            if (isStatus) {
                if (config.AUTO_STATUS_SEEN === "true") {
                    let retries = 3;
                    while (retries > 0) {
                        try { await conn.readMessages([mek.key]); break; } catch { retries--; await sleep(1000); }
                    }
                }
                if (config.AUTO_STATUS_REACT === "true" && !mek.key.fromMe) {
                    const emojis = (config.STATUS_REACTIONS || '❤️,🔥,✨,⚡').split(',').map(e => e.trim());
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    let retries = 3;
                    while (retries > 0) {
                        try { 
                            await conn.sendMessage(from, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [sender] }); 
                            break; 
                        } catch { retries--; await sleep(1000); }
                    }
                }
                return;
            }

            // ============ MESSAGE BOX LOGGER (POPKID STYLE) ============
            if (!mek.key.fromMe) {
                const typeLog = getContentType(mek.message);
                const pushLog = (mek.pushName || 'User').substring(0, 12);
                const timeLog = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
                const locLog = from.endsWith('@g.us') ? 'Group' : 'Private';
                const msgBody = (typeLog === 'conversation') ? mek.message.conversation : (typeLog === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : `📦 ${typeLog}`;
                const cleanMsg = msgBody.replace(/\n/g, ' ').substring(0, 25);
                const boxColor = gradient(logThemes.msgBox[0], logThemes.msgBox[1]);

                console.log(boxColor(`┌──────────────────────────────────────────┐`));
                console.log(boxColor(`│ `) + gradient('#f7971e', '#ffd200')(`${timeLog}`) + boxColor(` 👤 `) + pushLog + " ".repeat(Math.max(0, 12 - pushLog.length)) + boxColor(` 📍 `) + locLog + boxColor(`│`));
                console.log(boxColor(`│ `) + gradient('#ff00cc', '#3333ff')(`📩 Msg: ${cleanMsg}`) + " ".repeat(Math.max(0, 34 - cleanMsg.length)) + boxColor(`│`));
                console.log(boxColor(`└──────────────────────────────────────────┘`));
            }

            // ============ LOGIC & COMMANDS ============
            const m = sms(conn, mek)
            const body = (getContentType(mek.message) === 'conversation') ? mek.message.conversation : (getContentType(mek.message) === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : ''
            const isCmd = body.startsWith(config.PREFIX)
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const isOwner = ownerNumber.includes(sender.split('@')[0]) || mek.key.fromMe

            if (config.READ_MESSAGE === 'true' && !mek.key.fromMe) await conn.readMessages([mek.key]);
            
            // Mode Filters
            if (!isOwner && config.MODE === "private") return

            // Command Execution
            const events = require('./command')
            const cmd = events.commands.find((c) => c.pattern === command || (c.alias && c.alias.includes(command)))
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })
                try {
                    cmd.function(conn, mek, m, { from, body, isCmd, command, args, isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) });
                } catch (e) { cmdLogger.error(e); }
            }
        });
    } catch (err) { cmdLogger.error(`Connection Error: ${err.message}`); }
}

setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        await conn.updateProfileStatus(`POPKID XMD 🤖 | ⏰ ${time}`).catch(() => {});
    }
}, 60000);

app.get("/", (req, res) => res.send("POPKID-MD ACTIVE ✅"));
app.listen(process.env.PORT || 9090);
setTimeout(() => connectToWA(), 5000);
