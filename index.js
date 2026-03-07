/**
 * 👑 POPKID-MD (Final Ultra-Performance Version)
 * Creator: Popkid Ke
 * Features: Auto-View/React (Including Self), Fast Commands, Aesthetic Logs
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    jidDecode,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys')

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

// ============ LOGGER & BANNER ============
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

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => cmdLogger.error(`Global Error: ${err.message}`));
process.on("unhandledRejection", (reason) => cmdLogger.error(`Rejected Promise: ${reason}`));

const { getBuffer, getGroupAdmins, sleep } = require('./lib/functions')
const { saveMessage } = require('./data')

const ownerNumber = ['254732297194']
const sessionDir = path.join(__dirname, 'sessions');

async function loadGiftedSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const credsPath = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsPath)) return true;
    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        try {
            const compressedBase64 = config.SESSION_ID.substring("POPKID~".length);
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
            cmdLogger.success("Session Data Decrypted! ✅");
            return true;
        } catch (error) { return false; }
    }
    return false;
}

const app = express()
let conn

async function connectToWA() {
    try {
        await loadGiftedSession();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
        const { version } = await fetchLatestBaileysVersion()

        conn = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Desktop"),
            auth: {
                creds: state.creds,
                // Signal key caching prevents lags by keeping encryption hot in RAM
                keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })) 
            },
            version,
            // Disabled full sync to prevent the bot from hanging during startup
            syncFullHistory: false, 
            markOnlineOnConnect: true
        })

        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) qrcode.generate(qr, { small: true })
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
                if (shouldReconnect) {
                    cmdLogger.warning('Connection lost. Reconnecting... 🔄');
                    setTimeout(() => connectToWA(), 3000);
                }
            } else if (connection === 'open') {
                cmdLogger.success('POPKID-MD CONNECTED SUCCESSFULLY 🚀');
                
                // Startup Alert Message
                let up = `╔══════════════════╗\n║ 🚀 POPKID-MD ONLINE\n╠══════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 STATUS: Full Status Power ✅\n╚══════════════════╝`;
                await conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/j9ia5c.png` }, caption: up });
                
                // Automated Channel Follow
                try { await conn.newsletterFollow("120363423997837331@newsletter") } catch (e) {}
                
                // Dynamic Plugin Loading
                const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                plugins.forEach(plugin => require("./plugins/" + plugin));
                cmdLogger.success(`Successfully loaded ${plugins.length} plugins.`);
            }
        })

        conn.ev.on('creds.update', saveCreds)

        conn.ev.on('messages.upsert', async (mek) => {
            const msg = mek.messages[0]
            if (!msg.message) return
            
            const from = msg.key.remoteJid
            const isStatus = from === 'status@broadcast'
            const sender = msg.key.participant || msg.key.remoteJid;

            // ============ ⚡ THE STATUS MASTER FIX (INCLUDES SELF) ============
            if (isStatus) {
                const participant = msg.key.participant || msg.key.remoteJid;
                const myJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

                // Auto-View Status (Self & Others)
                if (config.AUTO_STATUS_SEEN === "true") {
                    await conn.readMessages([msg.key]);
                }

                // Auto-React Status (Self & Others)
                if (config.AUTO_STATUS_REACT === "true") {
                    const emojis = (config.STATUS_REACTIONS || '❤️,🔥,✨,⚡,👑').split(',').map(e => e.trim());
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    
                    // Sending reaction with statusJidList to ensure 100% visibility
                    await conn.sendMessage(from, { 
                        react: { text: randomEmoji, key: msg.key } 
                    }, { 
                        statusJidList: [participant, myJid] 
                    }).catch(() => {});
                }
                return; 
            }

            // ============ 📩 LOGGING (SLIM BOX STYLE) ============
            if (!msg.key.fromMe) {
                const typeLog = getContentType(msg.message);
                const pushLog = (msg.pushName || 'User').substring(0, 12);
                const timeLog = new Date().toLocaleTimeString('en-KE', { hour12: false, hour: '2-digit', minute: '2-digit' });
                const locLog = from.endsWith('@g.us') ? 'Group' : 'Private';
                const boxColor = gradient('#00c6ff', '#0072ff');
                console.log(boxColor(`┌─── ${timeLog} 👤 ${pushLog} 📍 ${locLog} ───┐`));
            }

            // ============ 🚀 COMMAND ENGINE ============
            const m = sms(conn, msg)
            const type = getContentType(msg.message)
            const body = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : (type == 'imageMessage') && msg.message.imageMessage.caption ? msg.message.imageMessage.caption : (type == 'videoMessage') && msg.message.videoMessage.caption ? msg.message.videoMessage.caption : ''
            
            const isCmd = body.startsWith(config.PREFIX)
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const text = args.join(' ')
            const isGroup = from.endsWith('@g.us')
            const senderNumber = sender.split('@')[0]
            const isOwner = ownerNumber.includes(senderNumber) || msg.key.fromMe

            // Filter for Mode
            if (!isOwner && config.MODE === "private") return
            if (!isOwner && isGroup && config.MODE === "inbox") return
            if (!isOwner && !isGroup && config.MODE === "groups") return

            const events = require('./command')
            if (isCmd) {
                const cmd = events.commands.find((c) => c.pattern === command || (c.alias && c.alias.includes(command)))
                if (cmd) {
                    if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: msg.key } })
                    try {
                        await cmd.function(conn, msg, m, { 
                            from, body, isCmd, command, args, q: text, text, isGroup, 
                            sender, senderNumber, pushname: msg.pushName || 'User', isOwner, 
                            reply: (teks) => conn.sendMessage(from, { text: teks }, { quoted: msg }) 
                        });
                    } catch (e) { cmdLogger.error(`Plugin Error: ${e}`) }
                }
            }

            // Body Listeners
            events.commands.map(async (command) => {
                if (body && command.on === "body") {
                    command.function(conn, msg, m, { from, body, isCmd, command, args, q: text, text, isGroup, sender, senderNumber, pushname: msg.pushName || 'User', isOwner, reply: (teks) => conn.sendMessage(from, { text: teks }, { quoted: msg }) })
                }
            });

        })

        // Core Helper Logic
        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            } else return jid;
        };

    } catch (err) { cmdLogger.error(`Connection Error: ${err.message}`) }
}

// Keep Alive Web Server
app.get("/", (req, res) => res.send("POPKID-MD ACTIVE ✅"));
app.listen(process.env.PORT || 9090);

connectToWA();
