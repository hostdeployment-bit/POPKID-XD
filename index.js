/**
 * 👑 POPKID-MD (Ultimate Ready-to-Use Version)
 * Creator: Popkid Ke (Kenya)
 * Logic: Status React, Smart Emojis, Bio, & Connection Message
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
const statusReactCooldown = 5000; 

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

            // 1. Newsletter Auto-Follow
            const channelJid = "120363423997837331@newsletter";
            try { await conn.newsletterFollow(channelJid); } catch (e) {}

            // 2. Load Plugins
            if (fs.existsSync("./plugins/")) {
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(p => { try { require("./plugins/" + p); } catch (e) {} });
            }

            // 3. Connection Message
            let connectMsg = `╔══════════════════╗\n║ 🚀 POPKID-MD CONNECTED\n╠══════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 DEV: Popkid Kenya\n║ 🕒 TIME: ${new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}\n╚══════════════════╝`;
            await conn.sendMessage(conn.user.id, {
                image: { url: config.ALIVE_IMG },
                caption: connectMsg
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                cmdLogger.info("Reconnecting in 5s...");
                setTimeout(() => connectToWA(), 5000);
            } else {
                cmdLogger.error("Logged Out. Clear session and scan again.");
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

        // --- STATUS HANDLER (WITH SMART EMOJIS) ---
        if (from === 'status@broadcast') {
            if (config.AUTO_STATUS_SEEN === "true") await conn.readMessages([mek.key]);
            
            if (config.AUTO_STATUS_REACT === "true") {
                const now = Date.now();
                if (now - (statusReactCache.get(sender) || 0) > statusReactCooldown) {
                    
                    // SMART EMOJI LOGIC
                    const emojiMap = { 
                        "love": "❤️", "🥰": "💖", "fire": "🔥", "lit": "⚡", 
                        "happy": "😊", "sad": "😢", "rip": "💔", "work": "💻", 
                        "gym": "💪", "food": "🍕", "nairobi": "🇰🇪", "hustle": "💯" 
                    };

                    let statusText = (mek.message.conversation || mek.message.extendedTextMessage?.text || mek.message.imageMessage?.caption || "").toLowerCase();
                    const fallbackReactions = config.STATUS_REACTIONS.split(',');
                    let selectedEmoji = fallbackReactions[Math.floor(Math.random() * fallbackReactions.length)];

                    for (let key in emojiMap) {
                        if (statusText.includes(key)) { 
                            selectedEmoji = emojiMap[key]; 
                            break; 
                        }
                    }

                    await conn.sendMessage('status@broadcast', {
                        react: { text: selectedEmoji, key: mek.key }
                    }, { statusJidList: [sender, conn.user.id.split(':')[0] + '@s.whatsapp.net'] });

                    statusReactCache.set(sender, now);
                    cmdLogger.success(`Reacted [${selectedEmoji}] to Status`);
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
                    cmd.function(conn, mek, m, { from, body, isCmd, command, isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) });
                } catch (e) { cmdLogger.error(`Plugin Error: ${e.message}`); }
            }
        }
    });
}

// ============ AUTO TASKS ============
setInterval(async () => {
    // 1. Kenya Bio Update
    if (config.AUTO_BIO === "true" && conn?.user) {
        const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        await conn.setStatus(`${config.BOT_NAME} ⚡ | ⏰ ${time}`).catch(() => {});
    }
    // 2. RAM Management
    if (statusReactCache.size > 150) statusReactCache.clear();
}, 60000);

// ============ START SERVER ============
app.get("/", (req, res) => res.send("POPKID-MD IS RUNNING 🟢"));
app.listen(process.env.PORT || 9090);

setTimeout(() => connectToWA(), 3000);
