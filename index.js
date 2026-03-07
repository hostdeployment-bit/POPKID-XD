/**
 * 👑 POPKID-MD (Ultra-Performance Final Version)
 * Fixes: Command Lags, Status Viewing, and "Random Stops"
 * Features: Auto-Follow, Startup Image, Slim Box Logger
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} = require('@whiskeysockets/baileys')

const fs = require('fs')
const path = require('path')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const zlib = require('zlib')
const express = require("express")
const gradient = require('gradient-string')
const { promisify } = require('util')

const config = require('./config')
const { sms, getGroupAdmins } = require('./lib/functions')

// ============ AESTHETIC LOGGER ============
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
cmdLogger.info("Starting POPKID-MD High-Performance Engine... 🚀");

const sessionDir = path.join(__dirname, 'sessions');

async function connectToWA() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    // Faster Session Recovery
    if (config.SESSION_ID && !fs.existsSync(path.join(sessionDir, 'creds.json'))) {
        try {
            const sessData = config.SESSION_ID.replace("POPKID~", "");
            const decompressed = await promisify(zlib.gunzip)(Buffer.from(sessData, 'base64'));
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), decompressed.toString());
        } catch (e) { cmdLogger.error("Session Repair Failed"); }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    // --- SOCKET CONFIGURATION (TUNED FOR SPEED) ---
    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop"),
        auth: {
            creds: state.creds,
            // makeCacheableSignalKeyStore prevents the "lag" when encryption keys are processed
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })) 
        },
        version,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false, // Prevents "Stopping" while downloading old chats
        maxMsgRetryCount: 3
    })

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                cmdLogger.warning('Connection lost. Reconnecting instantly... 🔄');
                setTimeout(connectToWA, 2000);
            }
        } else if (connection === 'open') {
            cmdLogger.success('POPKID-MD CONNECTED ✅');
            
            // --- NON-BLOCKING STARTUP TASKS ---
            (async () => {
                const upMsg = `╔══════════════════╗\n║ 🚀 POPKID-MD ONLINE\n╠══════════════════╣\n║ 👤 USER: ${conn.user.name || 'Bot'}\n║ 🔑 PREFIX: ${config.PREFIX}\n║ 👨‍💻 DEV: Popkid Kenya\n╚══════════════════╝`;
                await conn.sendMessage(conn.user.id, {
                    image: { url: `https://files.catbox.moe/j9ia5c.png` },
                    caption: upMsg
                }).catch(() => {});

                const channelJid = "120363423997837331@newsletter";
                await conn.newsletterFollow(channelJid).catch(() => {});
            })();

            const plugins = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
            plugins.forEach(plugin => require("./plugins/" + plugin));
            cmdLogger.success(`${plugins.length} Plugins Integrated.`);
        }
    })

    conn.ev.on('messages.upsert', async (mek) => {
        const m = mek.messages[0];
        if (!m || !m.message) return;
        
        const from = m.key.remoteJid;
        const isStatus = from === 'status@broadcast';
        const sender = m.key.participant || m.key.remoteJid;

        // ============ ⚡ RAPID STATUS HANDLER ============
        if (isStatus) {
            if (config.AUTO_STATUS_SEEN === "true") await conn.readMessages([m.key]);
            if (config.AUTO_STATUS_REACT === "true" && !m.key.fromMe) {
                const emojis = (config.STATUS_REACTIONS || '❤️,🔥,✨,⚡,💎,👑').split(',');
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)].trim();
                // Send reaction without 'await' to keep the loop moving fast
                conn.sendMessage(from, { react: { text: randomEmoji, key: m.key } }, { statusJidList: [sender, conn.user.id.split(':')[0] + '@s.whatsapp.net'] }).catch(() => {});
            }
            return;
        }

        // ============ 📩 AESTHETIC BOX LOGGER ============
        if (!m.key.fromMe) {
            const typeLog = getContentType(m.message);
            const pushLog = (m.pushName || 'User').substring(0, 12);
            const timeLog = new Date().toLocaleTimeString('en-KE', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const locLog = from.endsWith('@g.us') ? 'Group' : 'Private';
            
            let msgBody = (typeLog === 'conversation') ? m.message.conversation : (typeLog === 'extendedTextMessage') ? m.message.extendedTextMessage.text : `📦 ${typeLog}`;
            const cleanMsg = (msgBody || '').replace(/\n/g, ' ').substring(0, 25);
            const boxColor = gradient('#00c6ff', '#0072ff');

            console.log(boxColor(`┌──────────────────────────────────────────┐`));
            console.log(
                boxColor(`│ `) + gradient('#f7971e', '#ffd200')(`${timeLog}`) + 
                boxColor(` 👤 `) + gradient('#ffffff', '#bdc3c7')(`${pushLog}`) + " ".repeat(Math.max(0, 12 - pushLog.length)) +
                boxColor(` 📍 `) + gradient('#00b09b', '#96c93d')(`${locLog}`) + " ".repeat(Math.max(0, 10 - locLog.length)) + 
                boxColor(`│`)
            );
            console.log(
                boxColor(`│ `) + gradient('#ff00cc', '#3333ff')(`📩 Msg: ${cleanMsg}`) + 
                " ".repeat(Math.max(0, 34 - cleanMsg.length)) + 
                boxColor(`│`)
            );
            console.log(boxColor(`└──────────────────────────────────────────┘`));
        }

        // ============ 🚀 OPTIMIZED COMMAND HANDLER ============
        const body = (getContentType(m.message) === 'conversation') ? m.message.conversation : (getContentType(m.message) === 'extendedTextMessage') ? m.message.extendedTextMessage.text : (getContentType(m.message) == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption : (getContentType(m.message) == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption : '';
        const isCmd = body.startsWith(config.PREFIX);
        if (!isCmd) return;

        const command = body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const isOwner = config.OWNER_NUMBER?.includes(sender.split('@')[0]) || m.key.fromMe;

        const events = require('./command');
        const cmd = events.commands.find((c) => c.pattern === command || (c.alias && c.alias.includes(command)));

        if (cmd) {
            // Lazy-loading group data to prevent lag during chat processing
            let groupMetadata = from.endsWith('@g.us') ? await conn.groupMetadata(from).catch(() => ({})) : {};
            try {
                await cmd.function(conn, m, sms(conn, m), {
                    from, body, isCmd, command, args, isOwner, groupMetadata,
                    reply: (teks) => conn.sendMessage(from, { text: teks }, { quoted: m })
                });
            } catch (e) { cmdLogger.error(e); }
        }
    });
}

// Keep Alive Server
const app = express();
app.get("/", (req, res) => res.send("POPKID-MD IS ACTIVE 🚀"));
app.listen(process.env.PORT || 9090);

connectToWA();
