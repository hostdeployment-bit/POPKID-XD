/**
 * POPKID MD - MASTER ENGINE 2026 (Unified Edition)
 * Features: Multi-Strategy Session Loader (Zlib/API/Mega), Anti-Crash, LID-Aware Status, Plugin Loader, Auto-Bio
 * Creator: Popkid Kenya 🇰🇪
 */

console.clear();
console.log("🚀 Starting POPKID-MD Master Engine...");

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection:", reason);
});

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    getContentType,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const express = require("express");
const qrcode = require("qrcode-terminal");
const util = require("util");
const { exec } = require("child_process");
const axios = require("axios");
const { File } = require("megajs");
const zlib = require("zlib");
const { promisify } = require("util");
const os = require("os");

// Internal Libraries
const { sms } = require("./lib/serialize");
const { GroupEvents } = require("./lib/groupEvents");
const { AntilinkHandler } = require("./lib/antilinkHandler");
const { AntideleteHandler } = require("./lib/antidelete");
const { handleTagDetection } = require("./lib/tagDetector");
const { handleIncomingCall } = require("./lib/callHandler");
const { getGroupAdmins } = require('./lib/functions');
const config = require("./config");

const app = express();
const port = process.env.PORT || 9090;

// Global Variables
global.plugins = new Map();
let conn; // ✅ GLOBAL conn declaration

const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

// ================= SESSION LOADER (Multi-Strategy) =================

async function loadSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) return true;

    if (!config.SESSION_ID) {
        console.log('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    // Handle POPKID~ or POPKID;;; formats
    const sessionData = config.SESSION_ID.replace("POPKID~", "").replace("POPKID;;;", "");

    // Strategy 1: Zlib Decompression
    try {
        const compressedBuffer = Buffer.from(sessionData, 'base64');
        const gunzip = promisify(zlib.gunzip);
        const decompressedBuffer = await gunzip(compressedBuffer);
        fs.writeFileSync(credsPath, decompressedBuffer.toString('utf-8'));
        console.log("[ 📥 ] Session decompressed via Zlib ✅");
        return true;
    } catch (e) {
        // Strategy 2: API Fetch fallback
        try {
            if (sessionData.length < 50) {
                const { data } = await axios.get(`https://popkidxmdsessions-uolm.onrender.com/session/${sessionData}`);
                if (data && data.startsWith("POPKID~")) {
                    config.SESSION_ID = data;
                    return await loadSession();
                }
            }
        } catch (apiErr) {}
    }

    // Strategy 3: Mega.nz
    try {
        const filer = File.fromURL(`https://mega.nz/file/${sessionData}`);
        return new Promise((resolve) => {
            filer.download((err, data) => {
                if (err) resolve(false);
                else {
                    fs.writeFileSync(credsPath, data);
                    console.log("[ 📥 ] Session downloaded from MEGA ✅");
                    resolve(true);
                }
            });
        });
    } catch (error) { return false; }
}

// ================= WA CONNECTION =================

async function startPopkid() {
    await loadSession();

    // 2. DYNAMIC PLUGIN LOADER
    const pluginsDir = path.join(__dirname, "plugins");
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);

    fs.readdirSync(pluginsDir).forEach((file) => {
        if (file.endsWith(".js")) {
            try {
                const plugin = require(path.join(pluginsDir, file));
                if (plugin.cmd) global.plugins.set(plugin.cmd, plugin);
            } catch (e) { console.error(`❌ Plugin Load Error [${file}]:`, e.message); }
        }
    });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    conn = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        }
    });

    conn.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === "close") {
            let reason = lastDisconnect.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnecting...");
                setTimeout(() => startPopkid(), 5000);
            }
        } else if (connection === "open") {
            console.log("✅ POPKID MD: Successfully Connected!");
            
            if (config.ALWAYS_ONLINE === "true") await conn.sendPresenceUpdate('available');

            try {
                await conn.newsletterFollow("120363423997837331@newsletter");
            } catch (err) {}

            const upMsg = `╔════════════════╗\n║ 🤖 ▰𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗▰\n╠════════════════╣\n║ 🔑 PREFIX  : ${config.PREFIX}\n║ 👨‍💻 DEV     : POPKID-MD\n╚════════════════╝`;
            await conn.sendMessage(conn.user.id, { 
                image: { url: "https://files.catbox.moe/j9ia5c.png" },
                caption: upMsg 
            });
        }
    });

    conn.ev.on("creds.update", saveCreds);

    // Auto-Bio Updater
    setInterval(async () => {
        if (config.AUTO_BIO === "true" && conn?.user) {
            const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
            const bioText = `❤️ ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ ɪs ʟɪᴠᴇ ⏰ ${time} | Prefix: ${config.PREFIX}`;
            try { await conn.updateProfileStatus(bioText); } catch (err) {}
        }
    }, 60000);

    // 5. MESSAGE HANDLER
    conn.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            
            const from = mek.key.remoteJid;
            const type = getContentType(mek.message);

            // ADVANCED STATUS HANDLER
            if (from === 'status@broadcast') {
                const shouldRead = config.AUTO_READ_STATUS === 'true';
                const shouldReact = config.AUTO_REACT_STATUS === 'true';
                const statusParticipant = mek.key.participant || mek.participant;

                if (statusParticipant) {
                    let realJid = statusParticipant;
                    if (statusParticipant.endsWith('@lid')) {
                        const rawPn = mek.key?.participantPn || mek.key?.senderPn || mek.participantPn;
                        realJid = rawPn ? (rawPn.includes('@') ? rawPn : `${rawPn}@s.whatsapp.net`) : realJid;
                    }

                    const resolvedKey = { remoteJid: 'status@broadcast', id: mek.key.id, participant: realJid };
                    if (shouldRead) await conn.readMessages([resolvedKey]);
                    if (shouldReact) {
                        const emojis = ['🧩', '🌸', '💫', '🫀', '🧿', '🤖', '🥰', '🗿'];
                        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await conn.sendMessage(from, { react: { key: resolvedKey, text: emoji } }, { statusJidList: [realJid, conn.user.id.split(':')[0] + '@s.whatsapp.net'] });
                    }
                }
                return;
            }

            const m = sms(conn, mek);
            const isOwner = config.OWNER_NUMBER.includes(m.sender.split('@')[0]) || m.fromMe;
            
            // Eval/Exec Logic
            if (isOwner) {
                if (m.body.startsWith("$")) {
                    try { return m.reply(util.format(await eval(`(async () => { ${m.body.slice(1)} })()`))); } catch (e) { return m.reply(util.format(e)); }
                }
                if (m.body.startsWith("%")) {
                    exec(m.body.slice(1), (err, stdout) => { if (stdout) m.reply(stdout); });
                }
            }

            // Command/Plugin Loader
            const body = m.body || '';
            const isCmd = body.startsWith(config.PREFIX);
            const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : (config.NON_PREFIX === "true" ? body.trim().split(' ').shift().toLowerCase() : '');
            
            const plugin = global.plugins.get(command) || [...global.plugins.values()].find(p => p.alias && p.alias.includes(command));
            
            if (plugin) {
                if (plugin.isOwner && !isOwner) return m.reply("❌ Restricted.");
                const args = body.trim().split(/ +/).slice(1);
                await plugin.execute(conn, m, { text: args.join(' '), args, isOwner, isGroup: m.isGroup, pushname: m.pushName });
            }

        } catch (e) { console.error(e); }
    });
}

app.get("/", (req, res) => res.send("POPKID-MD MASTER ENGINE ACTIVE ⚡"));
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    startPopkid();
});
