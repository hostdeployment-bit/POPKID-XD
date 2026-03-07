/**
 * 👑 POPKID-MD (Final & Complete)
 * Includes: Status Logic, Channel Auto-Follow, Aesthetic Terminal
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { promisify } = require('util')
const P = require('pino')
const config = require('./config')
const qrcode = require('qrcode-terminal')
const util = require('util')
const { sms } = require('./lib')
const express = require("express")
const gradient = require('gradient-string')

const cmdLogger = {
    info: (msg) => console.log(gradient('#4facfe', '#00f2fe')(`ℹ ${msg}`)),
    success: (msg) => console.log(gradient('#00b09b', '#96c93d')(`✓ ${msg}`)),
    error: (msg) => console.log(gradient('#ff416c', '#ff4b2b')(`✗ ${msg}`)),
    banner: (msg) => console.log(gradient('#ff00cc', '#3333ff')(msg))
};

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys')

const { getGroupAdmins } = require('./lib/functions')
const { saveMessage } = require('./data')

const botBanner = `
██████╗  ██████╗ ██████╗ ██╗  ██╗██╗██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██║██╔══██╗
██████╔╝██║   ██║██████╔╝█████╔╝ ██║██║  ██║
██╔═══╝ ██║   ██║██╔═══╝ ██╔═██╗ ██║██║  ██║
██║     ╚██████╔╝██║     ██║  ██╗██║██████╔╝
╚═╝      ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝ `;

const ownerNumber = [config.OWNER_NUMBER]
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

async function loadSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) return true;
    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        try {
            const compressedBase64 = config.SESSION_ID.split("POPKID~")[1];
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
            return true;
        } catch (e) { return false; }
    }
    return false;
}

async function startBot() {
    console.clear();
    cmdLogger.banner(botBanner);
    cmdLogger.info("Initializing POPKID-MD... 🚀");
    
    await loadSession();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Firefox"),
        auth: state,
        version
    })

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) qrcode.generate(qr, { small: true })
        if (connection === 'open') {
            cmdLogger.success('POPKID XD IS ONLINE 📲');
            
            // ============ AUTO-FOLLOW CHANNEL ============
            const channelJid = "120363423997837331@newsletter"
            try {
                await conn.newsletterFollow(channelJid)
                cmdLogger.success('Auto-followed Official Channel ✅');
            } catch (e) { 
                cmdLogger.info('Channel already followed or error.');
            }

            // Load Plugins
            if (fs.existsSync("./plugins/")) {
                const files = fs.readdirSync("./plugins/").filter(p => p.endsWith(".js"));
                files.forEach(file => require("./plugins/" + file));
                cmdLogger.success(`Loaded ${files.length} plugins 💎`);
            }
            
            await conn.sendMessage(conn.user.id, {
                image: { url: `https://files.catbox.moe/j9ia5c.png` },
                caption: `🚀 POPKID-MD CONNECTED\n👤 USER: ${conn.user.name || 'Bot'}\n🔑 PREFIX: ${config.PREFIX}`
            });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                cmdLogger.error('Connection lost. Reconnecting... 🔄');
                setTimeout(() => startBot(), 5000);
            }
        }
    })

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('messages.upsert', async (mek) => {
        const msg = mek.messages[0]
        if (!msg.message) return
        const from = msg.key.remoteJid
        const isStatus = from === 'status@broadcast'
        const participant = msg.key.participant || msg.key.remoteJid

        // ============ STATUS HANDLER ============
        if (isStatus) {
            if (config.AUTO_STATUS_SEEN === "true" || config.AUTO_STATUS_SEEN === true) {
                await conn.readMessages([msg.key]);
            }
            if (config.AUTO_STATUS_REACT === "true" || config.AUTO_STATUS_REACT === true) {
                const emojis = config.STATUS_REACTIONS.split(',');
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)].trim();
                await conn.sendMessage(from, { react: { text: randomEmoji, key: msg.key } }, { statusJidList: [participant, conn.user.id.split(':')[0] + '@s.whatsapp.net'] });
            }
            if ((config.AUTO_STATUS_REPLY === "true" || config.AUTO_STATUS_REPLY === true) && !msg.key.fromMe) {
                await conn.sendMessage(participant, { text: config.AUTO_STATUS_MSG }, { quoted: msg });
            }
            return;
        }

        // ============ MESSAGE PROCESSING ============
        const sender = msg.key.participant || msg.key.remoteJid;
        const m = sms(conn, msg)
        const type = getContentType(msg.message)
        const body = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : (type == 'imageMessage') && msg.message.imageMessage.caption ? msg.message.imageMessage.caption : (type == 'videoMessage') && msg.message.videoMessage.caption ? msg.message.videoMessage.caption : ''
        
        const isCmd = body.startsWith(config.PREFIX)
        const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
        const isOwner = ownerNumber.includes(sender.split('@')[0]) || msg.key.fromMe
        
        // Console Log (Gradient Style)
        if (!msg.key.fromMe) {
            const timeLog = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' });
            console.log(gradient('#00c6ff', '#0072ff')(`│ 📩 ${timeLog} | ${msg.pushName || 'User'} -> ${body.substring(0,20)}`));
        }

        if ((config.READ_MESSAGE === 'true' || config.READ_MESSAGE === true) && !msg.key.fromMe) {
            await conn.readMessages([msg.key]);
        }

        // Auto React
        if (!msg.key.fromMe && (config.AUTO_REACT === 'true' || config.AUTO_REACT === true)) {
            const reacts = ['❤️', '🔥', '⚡', '✨', '👑'];
            m.react(reacts[Math.floor(Math.random() * reacts.length)]);
        }

        // Command Plugin Execution
        const events = require('./command')
        if (isCmd) {
            const cmd = events.commands.find((c) => c.pattern === command) || events.commands.find((c) => c.alias && c.alias.includes(command))
            if (cmd) {
                try {
                    cmd.function(conn, msg, m, { from, body, isCmd, command, isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: msg }) });
                } catch (e) { cmdLogger.error(e); }
            }
        }
    })
}

// Keeping the bot alive
const app = express();
app.get("/", (req, res) => res.send("POPKID-MD Active ✅"));
app.listen(process.env.PORT || 9090);

startBot();
