/**
 * 👑 POPKID-MD (Final Stable Version - Full Fix)
 * Creator: Popkid Ke (Kenya)
 * Fix: Multi-Contact Status Viewing & Smart React
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const util = require('util');
const { sms } = require('./lib');
const axios = require('axios');
const gradient = require('gradient-string');
const express = require("express");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    Browsers,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

// ============ CACHE & SETTINGS ============
const statusReactCache = new Map();

const cmdLogger = {
    info: (msg) => console.log(gradient('#4facfe', '#00f2fe')(`ℹ ${msg}`)),
    success: (msg) => console.log(gradient('#00b09b', '#96c93d')(`✓ ${msg}`)),
    error: (msg) => console.log(gradient('#ff416c', '#ff4b2b')(`✗ ${msg}`)),
    banner: (msg) => console.log(gradient('#ff00cc', '#3333ff')(msg))
};

// ============ ANTI-CRASH ============
process.on("uncaughtException", (e) => cmdLogger.error(`System Error: ${e.message}`));
process.on("unhandledRejection", (e) => cmdLogger.error(`Rejection: ${e.message}`));

// ============ SESSION LOADER ============
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
            cmdLogger.error("Session Restoration Failed!");
            return false;
        }
    }
    return false;
}

const app = express();
let conn;

async function connectToWA() {
    await loadSession();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop"),
        auth: state,
        version,
        syncFullHistory: false
    });

    // ============ CONNECTION EVENTS ============
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'open') {
            cmdLogger.success('POPKID-MD IS ONLINE 🇰🇪');

            const channelJid = "120363423997837331@newsletter";
            try { await conn.newsletterFollow(channelJid); } catch (e) {}

            if (fs.existsSync("./plugins/")) {
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(p => { try { require("./plugins/" + p); } catch (e) {} });
            }

            let connectMsg = `╔══════════════════╗\n║ 🚀 POPKID-MD CONNECTED\n╠══════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 DEV: Popkid Kenya\n║ 🕒 TIME: ${new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}\n╚══════════════════╝`;
            await conn.sendMessage(conn.user.id, {
                image: { url: config.ALIVE_IMG },
                caption: connectMsg
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                cmdLogger.info("Connection lost. Reconnecting in 5s...");
                setTimeout(() => connectToWA(), 5000);
            } else {
                cmdLogger.error("Logged Out. Please scan again.");
            }
        }
    });

    conn.ev.on('creds.update', saveCreds);

    // ============ MESSAGE PROCESSING ============
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];
        if (!mek.message) return;
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

        const from = mek.key.remoteJid;
        const sender = mek.key.participant || mek.key.remoteJid;

        // --- FIXED STATUS HANDLER (VIEWS ALL CONTACTS) ---
        if (from === 'status@broadcast') {
            const contactName = mek.pushName || sender.split('@')[0];

            // 1. Auto View Every Status
            if (config.AUTO_STATUS_SEEN === "true") {
                await conn.readMessages([mek.key]);
            }
            
            // 2. Auto React with Smart Logic
            if (config.AUTO_STATUS_REACT === "true") {
                // Unique key per status slide to avoid skipping contacts
                const statusKey = `${sender}_${mek.key.id}`;
                
                if (!statusReactCache.has(statusKey)) {
                    const emojiMap = { 
                        "love": "❤️", "🥰": "💖", "fire": "🔥", "lit": "⚡", 
                        "happy": "😊", "sad": "😢", "rip": "💔", "work": "💻", 
                        "gym": "💪", "food": "🍕", "nairobi": "🇰🇪", "hustle": "💯" 
                    };

                    let statusText = (mek.message.conversation || mek.message.extendedTextMessage?.text || mek.message.imageMessage?.caption || "").toLowerCase();
                    const reactions = config.STATUS_REACTIONS.split(',');
                    let selectedEmoji = reactions[Math.floor(Math.random() * reactions.length)];

                    for (let key in emojiMap) {
                        if (statusText.includes(key)) { 
                            selectedEmoji = emojiMap[key]; 
                            break; 
                        }
                    }

                    await conn.sendMessage('status@broadcast', {
                        react: { text: selectedEmoji, key: mek.key }
                    }, { statusJidList: [sender] });

                    statusReactCache.set(statusKey, Date.now());
                    cmdLogger.success(`Viewed & Reacted [${selectedEmoji}] to: ${contactName}`);
                }
            }
            return;
        }

        // --- COMMAND HANDLER ---
        const m = sms(conn, mek);
        const type = getContentType(mek.message);
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : '';
        const isCmd = body.startsWith(config.PREFIX);
        const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : '';
        const isOwner = sender.split('@')[0] === config.OWNER_NUMBER || mek.key.fromMe;

        if (isCmd) {
            const events = require('./command');
            const cmd = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)));
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                try {
                    cmd.function(conn, mek, m, { 
                        from, body, isCmd, command, isOwner, 
                        reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) 
                    });
                } catch (e) { cmdLogger.error(`Plugin Error: ${e.message}`); }
            }
        }
    });
}

// ============ BACKGROUND MAINTENANCE ============
setInterval(async () => {
    // 1. Kenya Bio (Nairobi Time)
    if (config.AUTO_BIO === "true" && conn?.user) {
        const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        await conn.setStatus(`${config.BOT_NAME} ⚡ | ⏰ ${time}`).catch(() => {});
    }
    // 2. Clear RAM Cache (Prevents slowdown)
    if (statusReactCache.size > 500) {
        statusReactCache.clear();
        cmdLogger.info("Memory Cleanup: Cache cleared.");
    }
}, 60000);

// ============ WEB SERVER ============
app.get("/", (req, res) => res.send("POPKID-MD ACTIVE 🟢"));
app.listen(process.env.PORT || 9090);

setTimeout(() => connectToWA(), 3000);
