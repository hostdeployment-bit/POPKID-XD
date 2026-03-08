/**
 * 👑 POPKID-MD (Ultimate Ready-to-Use Version - FIXED)
 * Creator: Popkid Ke (Kenya)
 * Fixes:
 * ✔ Better Status Sync
 * ✔ Views More Contacts Status
 * ✔ Stable Status Reactions
 * ✔ Improved Presence Update
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const { sms } = require('./lib');
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

// ===== CACHE =====
const statusReactCache = new Map();
const statusReactCooldown = 5000;

// ===== LOGGER =====
const cmdLogger = {
    info: (msg) => console.log(gradient('#4facfe', '#00f2fe')(`ℹ ${msg}`)),
    success: (msg) => console.log(gradient('#00b09b', '#96c93d')(`✓ ${msg}`)),
    error: (msg) => console.log(gradient('#ff416c', '#ff4b2b')(`✗ ${msg}`)),
    banner: (msg) => console.log(gradient('#ff00cc', '#3333ff')(msg))
};

// ===== ANTI CRASH =====
process.on("uncaughtException", (e) => cmdLogger.error(e.message));
process.on("unhandledRejection", (e) => cmdLogger.error(e.message));

// ===== SESSION =====
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

async function loadSession() {

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    if (fs.existsSync(credsPath)) return true;

    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {

        try {

            const compressedBase64 = config.SESSION_ID.replace("POPKID~", "");
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');

            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);

            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));

            cmdLogger.success("Session Restored Successfully");

            return true;

        } catch {

            cmdLogger.error("Session Restoration Failed");

            return false;

        }

    }

    return false;
}

// ===== EXPRESS =====
const app = express();
let conn;

// ===== MAIN CONNECTION =====
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

        // FIXES
        syncFullHistory: true,
        markOnlineOnConnect: true,
        emitOwnEvents: true

    });

    // ===== CONNECTION EVENTS =====
    conn.ev.on('connection.update', async (update) => {

        const { connection, lastDisconnect, qr } = update;

        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'open') {

            cmdLogger.success('POPKID-MD IS ONLINE 🇰🇪');

            // Follow channel
            try {
                await conn.newsletterFollow("120363423997837331@newsletter");
            } catch {}

            // Load plugins
            if (fs.existsSync("./plugins/")) {

                const plugins = fs.readdirSync("./plugins/").filter(v => v.endsWith(".js"));

                for (const p of plugins) {
                    try { require("./plugins/" + p); } catch {}
                }

            }

            // Connected message
            let msg = `╔══════════════════╗
║ 🚀 POPKID-MD CONNECTED
╠══════════════════╣
║ 👤 USER: ${conn.user.name || 'Bot'}
║ 🔑 PREFIX: ${config.PREFIX}
║ 👨‍💻 DEV: Popkid Kenya
║ 🕒 TIME: ${new Date().toLocaleTimeString('en-KE',{timeZone:'Africa/Nairobi'})}
╚══════════════════╝`;

            await conn.sendMessage(conn.user.id,{
                image:{url:config.ALIVE_IMG},
                caption:msg
            });

        }

        if (connection === 'close') {

            const reason = lastDisconnect?.error?.output?.statusCode;

            if (reason !== DisconnectReason.loggedOut) {

                cmdLogger.info("Reconnecting in 5 seconds...");
                setTimeout(connectToWA,5000);

            } else {

                cmdLogger.error("Logged Out. Scan again.");

            }

        }

    });

    conn.ev.on('creds.update', saveCreds);

    // ===== MESSAGE EVENT =====
    conn.ev.on('messages.upsert', async (mek) => {

        mek = mek.messages[0];
        if (!mek.message) return;

        mek.message = getContentType(mek.message) === 'ephemeralMessage'
        ? mek.message.ephemeralMessage.message
        : mek.message;

        const from = mek.key.remoteJid;
        const sender = mek.key.participant || mek.key.remoteJid;

        // ===== STATUS HANDLER =====
        if (from === 'status@broadcast') {

            if (config.AUTO_STATUS_SEEN === "true") {

                await conn.readMessages([mek.key]);
                await conn.sendPresenceUpdate("available");

            }

            if (config.AUTO_STATUS_REACT === "true") {

                const now = Date.now();

                if (now - (statusReactCache.get(sender) || 0) > statusReactCooldown) {

                    const emojiMap = {

                        love:"❤️",
                        fire:"🔥",
                        lit:"⚡",
                        happy:"😊",
                        sad:"😢",
                        rip:"💔",
                        gym:"💪",
                        food:"🍕",
                        nairobi:"🇰🇪",
                        hustle:"💯"

                    };

                    let statusText = (
                        mek.message.conversation ||
                        mek.message.extendedTextMessage?.text ||
                        mek.message.imageMessage?.caption ||
                        ""
                    ).toLowerCase();

                    const fallback = config.STATUS_REACTIONS.split(',');

                    let emoji = fallback[Math.floor(Math.random()*fallback.length)];

                    for (let key in emojiMap){

                        if(statusText.includes(key)){

                            emoji = emojiMap[key];
                            break;

                        }

                    }

                    await conn.sendMessage('status@broadcast',{

                        react:{ text:emoji, key:mek.key }

                    },{

                        statusJidList:[
                            sender,
                            conn.user.id.split(':')[0]+'@s.whatsapp.net'
                        ]

                    });

                    statusReactCache.set(sender,now);

                    cmdLogger.success(`Reacted ${emoji}`);

                }

            }

            return;
        }

        // ===== COMMAND SYSTEM =====
        const m = sms(conn,mek);
        const type = getContentType(mek.message);

        const body =
        type === 'conversation' ? mek.message.conversation :
        type === 'extendedTextMessage' ? mek.message.extendedTextMessage.text :
        type === 'imageMessage' ? mek.message.imageMessage.caption :
        type === 'videoMessage' ? mek.message.videoMessage.caption :
        '';

        const isCmd = body.startsWith(config.PREFIX);

        const command = isCmd
        ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase()
        : '';

        const isOwner =
        sender.split('@')[0] === config.OWNER_NUMBER || mek.key.fromMe;

        if (isCmd){

            const events = require('./command');

            const cmd = events.commands.find(
                v => v.pattern === command || (v.alias && v.alias.includes(command))
            );

            if(cmd){

                if(cmd.react){
                    conn.sendMessage(from,{react:{text:cmd.react,key:mek.key}});
                }

                try{

                    cmd.function(conn,mek,m,{
                        from,
                        body,
                        isCmd,
                        command,
                        isOwner,
                        reply:(t)=>conn.sendMessage(from,{text:t},{quoted:mek})
                    });

                }catch(e){

                    cmdLogger.error(e.message);

                }

            }

        }

    });

}

// ===== AUTO TASKS =====
setInterval(async ()=>{

    if(config.AUTO_BIO==="true" && conn?.user){

        const time=new Date().toLocaleTimeString(
            'en-KE',
            {timeZone:'Africa/Nairobi',hour12:false}
        );

        await conn.setStatus(`${config.BOT_NAME} ⚡ | ⏰ ${time}`).catch(()=>{});

    }

    if(statusReactCache.size>150){
        statusReactCache.clear();
    }

},60000);

// ===== SERVER =====
app.get("/",(req,res)=>res.send("POPKID-MD RUNNING 🟢"));
app.listen(process.env.PORT||9090);

// ===== START =====
setTimeout(connectToWA,3000);
