/**
 * 👑 POPKID-MD (Anti-Crash Version)
 * Creator: Popkid Ke
 * Improvements: Customizable Status Reactions, Refined Logic, Aesthetic Logs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { promisify } = require('util');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const util = require('util');
const FileType = require('file-type');
const axios = require('axios');
const gradient = require('gradient-string');
const express = require("express");

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
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const { sms, getGroupAdmins, getBuffer } = require('./lib/functions');
const { saveMessage } = require('./data');

const ownerNumbers = ['254732297194'];
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

//=================== SESSION-AUTH ============================
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

let conn;

async function connectToWA() {
    try {
        await loadGiftedSession();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        conn = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Firefox"),
            auth: state,
            version
        });

        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) qrcode.generate(qr, { small: true });
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) setTimeout(() => connectToWA(), 5000);
            } else if (connection === 'open') {
                cmdLogger.success('POPKID XD IS ONLINE 📲');
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(plugin => require("./plugins/" + plugin));
                
                let up = `*POPKID-MD CONNECTED* ✅\n\n👤 *User:* ${conn.user.name}\n🔑 *Prefix:* ${config.PREFIX}`;
                await conn.sendMessage(jidNormalizedUser(conn.user.id), { text: up });
            }
        });

        conn.ev.on('creds.update', saveCreds);

        conn.ev.on('messages.upsert', async (mek) => {
            mek = mek.messages[0];
            if (!mek.message) return;
            
            const from = mek.key.remoteJid;
            const isStatus = from === 'status@broadcast';
            const sender = mek.key.participant || mek.key.remoteJid;
            const botJid = jidNormalizedUser(conn.user.id);

            // ============ STATUS HANDLER ============
            if (isStatus) {
                // 1. Auto View
                if (config.AUTO_STATUS_SEEN === "true") {
                    await conn.readMessages([mek.key]);
                }

                // 2. Auto React
                if (config.AUTO_STATUS_REACT === "true") {
                    const emojis = (config.STATUS_REACTIONS || '❤️,🔥,✨,⚡,💎,👑').split(',').map(e => e.trim());
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    
                    await conn.sendMessage(from, {
                        react: { text: randomEmoji, key: mek.key }
                    }, {
                        statusJidList: [sender, botJid]
                    });
                }

                // 3. Auto Reply
                if (config.AUTO_STATUS_REPLY === "true" && !mek.key.fromMe) {
                    await conn.sendMessage(sender, { 
                        text: config.AUTO_STATUS_MSG || '✅ Status Viewed by Popkid-Md' 
                    }, { quoted: mek });
                }
                return;
            }

            // ============ MESSAGE HANDLING ============
            const m = sms(conn, mek);
            const type = getContentType(mek.message);
            const body = (type === 'conversation') ? mek.message.conversation : 
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                         (type == 'imageMessage') ? mek.message.imageMessage.caption : 
                         (type == 'videoMessage') ? mek.message.videoMessage.caption : '';

            const isCmd = body.startsWith(config.PREFIX);
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const q = args.join(' ');
            const isGroup = from.endsWith('@g.us');
            const senderNumber = sender.split('@')[0];
            const isOwner = ownerNumbers.includes(senderNumber) || mek.key.fromMe;

            // ============ LOGGING ============
            if (!mek.key.fromMe) {
                console.log(gradient('#00c6ff', '#0072ff')(`📩 Msg from ${mek.pushName || 'User'} in ${isGroup ? 'Group' : 'Direct'}: ${body.substring(0, 20)}`));
            }

            // ============ AUTO READ MESSAGES ============
            if (config.READ_MESSAGE === 'true') {
                await conn.readMessages([mek.key]);
            }

            // ============ COMMAND EXECUTION ============
            const events = require('./command');
            const cmd = events.commands.find((c) => c.pattern === command || (c.alias && c.alias.includes(command)));
            
            if (isCmd && cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                
                // Permission Check
                if (!isOwner && config.MODE === "private") return;

                try {
                    await cmd.function(conn, mek, m, { 
                        from, body, isCmd, command, args, q, isGroup, sender, 
                        senderNumber, botNumber: botJid.split('@')[0], 
                        pushname: mek.pushName, isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: mek }) 
                    });
                } catch (e) {
                    cmdLogger.error(e);
                }
            }
        });

    } catch (err) {
        cmdLogger.error(`Connection failed: ${err.message}`);
    }
}

// ============ AUTO BIO ============
setInterval(async () => {
    if (config.AUTO_BIO === "true" && conn) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
        await conn.updateProfileStatus(`❤️ POPKID XMD | ⏰ ${time}`).catch(() => {});
    }
}, 60000);

const app = express();
app.get("/", (req, res) => res.send("POPKID-MD ACTIVE ✅"));
app.listen(process.env.PORT || 9090);

setTimeout(() => connectToWA(), 5000);
