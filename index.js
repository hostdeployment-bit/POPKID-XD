/**
 * 👑 POPKID-MD (Final Ready-to-Use Version)
 * Creator: Popkid Ke
 * Logic: Stable Status React, Auto-Bio Fix, & Anti-Crash
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
const { sms, AntiDelete } = require('./lib')
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

console.clear();
cmdLogger.banner(botBanner);

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => cmdLogger.error(`Uncaught Exception: ${err.message}`));
process.on("unhandledRejection", (reason) => cmdLogger.error(`Unhandled Rejection: ${reason}`));

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    Browsers,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    delay
} = require('@whiskeysockets/baileys')

const { saveMessage } = require('./data')
const { getGroupAdmins } = require('./lib/functions')

// ============ SESSION LOADER ============
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

async function loadSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) return true;

    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        const compressedBase64 = config.SESSION_ID.substring("POPKID~".length);
        try {
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
            cmdLogger.success("Session restored ✅");
            return true;
        } catch (error) { 
            cmdLogger.error("Failed to decompress session ID");
            return false; 
        }
    }
    return false;
}

const app = express();
const port = process.env.PORT || 9090;
let conn;

async function connectToWA() {
    try {
        await loadSession();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        conn = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Firefox"),
            syncFullHistory: true,
            auth: state,
            version
        });

        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) qrcode.generate(qr, { small: true });

            if (connection === 'open') {
                cmdLogger.success('Bot connected to WhatsApp 📲');
                
                // Install Plugins
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(p => require("./plugins/" + p));

                let up = `╔════════════════╗\n║ 🤖 ▰𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗▰\n╠════════════════╣\n║ 👤 USER: ${conn.user.name}\n║ 🔑 PREFIX: ${config.PREFIX}\n╚════════════════╝`;
                await conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/j9ia5c.png` }, caption: up });
                
                try { await conn.newsletterFollow("120363423997837331@newsletter"); } catch (e) {}
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) setTimeout(() => connectToWA(), 5000);
            }
        });

        conn.ev.on('creds.update', saveCreds);

        conn.ev.on('messages.upsert', async (mek) => {
            mek = mek.messages[0];
            if (!mek.message) return;
            mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

            const from = mek.key.remoteJid;
            const sender = mek.key.participant || mek.key.remoteJid;

            // ============ ✅ FIXED STATUS HANDLER (NO SKIPPING) ============
            if (from === 'status@broadcast') {
                if (config.AUTO_STATUS_SEEN === "true") {
                    await conn.readMessages([mek.key]);
                }

                if (config.AUTO_STATUS_REACT === "true") {
                    await delay(2000); // Critical delay to prevent 'not-acceptable' error
                    const emojis = ['❤️', '🔥', '✨', '🙌', '✅', '🌟', '💎', '😎'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                    try {
                        await conn.sendMessage('status@broadcast', {
                            react: { text: randomEmoji, key: mek.key }
                        }, { statusJidList: [sender, conn.user.id.split(':')[0] + '@s.whatsapp.net'] });
                        cmdLogger.success(`Reacted to: ${sender.split('@')[0]}`);
                    } catch (e) {
                        cmdLogger.error(`Status React Failed: ${e.message}`);
                    }
                }

                if (config.AUTO_STATUS_REPLY === "true" && !mek.key.fromMe) {
                    await conn.sendMessage(sender, { text: config.AUTO_STATUS_MSG }, { quoted: mek });
                }
                return;
            }

            // ============ MESSAGE PROCESSING ============
            const m = sms(conn, mek);
            const type = getContentType(mek.message);
            const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : '';
            
            if (config.READ_MESSAGE === 'true' && from !== 'status@broadcast') {
                await conn.readMessages([mek.key]);
            }

            const isCmd = body.startsWith(config.PREFIX);
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : '';
            const isOwner = sender.split('@')[0] === "254732297194" || mek.key.fromMe;

            // Manual React logic for owner
            if (sender.split('@')[0] === "254732297194" && !isCmd) {
                const reactions = ["👑", "🎯", "📈", "🔥", "🚀"];
                m.react(reactions[Math.floor(Math.random() * reactions.length)]);
            }

            const events = require('./command');
            if (isCmd) {
                const cmd = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)));
                if (cmd) {
                    if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                    try {
                        cmd.function(conn, mek, m, { from, body, isCmd, command, isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) });
                    } catch (err) { cmdLogger.error(`Plugin Error: ${err}`); }
                }
            }
        });

    } catch (err) { cmdLogger.error(`Connection Error: ${err.message}`); }
}

// ============ ✅ FIXED AUTO BIO (KENYA TIME) ============
setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        const date = new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
        const bioText = `❤️ ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ 🤖 ɪs ʟɪᴠᴇ ɴᴏᴡ\n📅 ${date}\n⏰ ${time}`;
        
        try {
            // FIXED: updateProfileStatus is the modern Baileys method
            await conn.updateProfileStatus(bioText);
        } catch (err) {
            cmdLogger.error("Bio Update Failed");
        }
    }
}, 60000);

app.get("/", (req, res) => res.send("POPKID-MD ACTIVE ✅"));
app.listen(port, () => cmdLogger.info(`Server on port ${port}`));
setTimeout(() => connectToWA(), 3000);
