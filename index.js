/**
 * POPKID-MD WhatsApp Bot (2026 Master Edition)
 * Creator: Popkid (Kenya)
 * Features: Prince Host Logs, Detailed Message Logger, Self-Status View/React, Newsletter
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers,
    downloadContentFromMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { promisify } = require('util');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const util = require('util');
const express = require("express");
const gradient = require('gradient-string');

const config = require('./config');
const { sms } = require('./lib/functions');
const { saveMessage, AntiDelete } = require('./data');
const GroupEvents = require('./lib/groupevents');

// ==========================================
// SECTION 1: STYLED LOGGERS (PRINCE STYLE)
// ==========================================

const getTS = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

// Startup/System Logs (Green Prince Style)
const hostLog = (msg, icon = '✅') => {
    console.log(gradient('#00ff00', '#00ff7f')(`${getTS()} app[web.1]: 0|popkidmd  | ${icon} ${msg}`));
};

// Message Activity Logger (Clean Cyan/Blue Style)
const msgLog = (name, phone, chat, text, isGroup) => {
    const context = isGroup ? `[GRP: ${chat}]` : `[PRIV]`;
    console.log(gradient('#00d2ff', '#3a7bd5')(`${getTS()} app[web.1]: 📩 ${context} | ${name} (${phone}) -> ${text.substring(0, 35)}...`));
};

const ownerNumber = ['254732297194'];
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

// ==========================================
// SECTION 2: UTILITIES & SESSION MANAGER
// ==========================================

process.on("uncaughtException", (err) => console.log(`[CRITICAL] ${err.message}`));
process.on("unhandledRejection", (reason) => console.log(`[REJECTION] ${reason}`));

async function loadSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    
    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        try {
            const compressedBuffer = Buffer.from(config.SESSION_ID.substring(7), 'base64');
            const gunzip = promisify(zlib.gunzip);
            const decompressed = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressed.toString());
            hostLog("Session File Loaded");
            hostLog("Database Synchronized");
            return true;
        } catch (e) { return false; }
    }
    if (fs.existsSync(credsPath)) {
        hostLog("Session File Loaded");
        return true;
    }
    return false;
}

// ==========================================
// SECTION 3: CORE CONNECTION ENGINE
// ==========================================

async function connectToWA() {
    console.log(gradient('#00ff00', '#55ff55')(`\n--------------------------------------------------------------------------`));
    hostLog("Bot Settings Initialized");
    
    await loadSession();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version
    });

    hostLog("Connecting Bot...", "⏳");

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const reconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (reconnect) {
                hostLog("Connection Failed. Retrying...", "❌");
                setTimeout(() => connectToWA(), 5000);
            }
        } else if (connection === 'open') {
            hostLog("Connection Instance is Online");
            const groups = await conn.groupFetchAllParticipating();
            hostLog(`LID store initialized => ${Object.keys(groups).length} mappings from groups`);
            hostLog("Connected to Whatsapp, Active! 💜", "✅");
            
            // Auto-Follow Kenya Newsletter
            try { await conn.newsletterFollow("120363423997837331@newsletter"); } catch (e) {}
            
            // Load External Plugins
            fs.readdirSync("./plugins/").forEach(p => { if (p.endsWith(".js")) require("./plugins/" + p); });

            // Premium Dashboard Message
            const dashboard = `
┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🤖 *POPKID-MD CONNECTED* ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
✨ *Status:* Online & Active
👤 *Owner:* Popkid (Kenya)
🕒 *Time:* ${new Date().toLocaleTimeString()}
📅 *Date:* ${new Date().toLocaleDateString()}

💡 *SYSTEM INFO:*
🖥️ *Platform:* ${os.platform()}
📟 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
📡 *Newsletter:* Subscribed ✅

🚀 *All Systems Functional!*
_Powered by Popkid AI Technology_`.trim();

            await conn.sendMessage(conn.user.id, { 
                image: { url: `https://files.catbox.moe/j9ia5c.png` }, 
                caption: dashboard,
                contextInfo: {
                    externalAdReply: {
                        title: "POPKID-MD V2",
                        body: "Kenya's Finest WhatsApp Bot",
                        thumbnailUrl: "https://files.catbox.moe/j9ia5c.png",
                        sourceUrl: "https://whatsapp.com/channel/0029VajV9vS6LwHqXo7G3829",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });
        }
    });

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on("group-participants.update", (u) => GroupEvents(conn, u));
    conn.ev.on('messages.update', async u => { for (const up of u) { if (up.update.message === null) await AntiDelete(conn, u); } });

    // ==========================================
    // SECTION 4: MESSAGE & STATUS HANDLER
    // ==========================================

    conn.ev.on('messages.upsert', async (mek) => {
        const msg = mek.messages[0];
        if (!msg.message) return;
        const from = msg.key.remoteJid;
        const isStatus = from === 'status@broadcast';

        // 1. Status Manager (Views & Reacts to Self + Others)
        if (isStatus) {
            const isSelf = msg.key.participant?.includes(conn.user.id.split(':')[0]);
            const tasks = [];
            if (config.AUTO_STATUS_SEEN === "true" || isSelf) tasks.push(conn.readMessages([msg.key]));
            if (config.AUTO_STATUS_REACT === "true") {
                const emo = ['❤️', '🔥', '✨', '🙌', '✅', '🌟'][Math.floor(Math.random() * 6)];
                tasks.push(conn.sendMessage(from, { react: { text: emo, key: msg.key } }, { statusJidList: [msg.key.participant, conn.user.id.split(':')[0] + '@s.whatsapp.net'] }));
            }
            if (!isSelf && config.AUTO_STATUS_REPLY === "true") tasks.push(conn.sendMessage(msg.key.participant, { text: config.AUTO_STATUS_MSG }, { quoted: msg }));
            await Promise.all(tasks).catch(() => {});
            return;
        }

        // 2. Data & Advanced Message Logging
        const m = sms(conn, msg);
        const type = getContentType(msg.message);
        const body = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : (msg.message.imageMessage?.caption || '[Media Content]');
        const isGroup = from.endsWith('@g.us');
        const senderNum = m.sender.split('@')[0];

        if (!msg.key.fromMe) {
            let chatTitle = 'Private Chat';
            if (isGroup) {
                const metadata = await conn.groupMetadata(from).catch(() => ({ subject: 'Group' }));
                chatTitle = metadata.subject;
            }
            msgLog(msg.pushName || 'User', senderNum, chatTitle, body, isGroup);
        }

        await saveMessage(msg);
        if (config.READ_MESSAGE === 'true') await conn.readMessages([msg.key]);

        // 3. Command Logic
        const isCreator = ownerNumber.includes(senderNum) || msg.key.fromMe;
        const isCmd = body.startsWith(config.PREFIX);
        const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);

        // EVAL & EXEC
        if (isCreator && body.startsWith('%')) { try { m.reply(util.format(eval(body.slice(1).trim()))); } catch (e) { m.reply(util.format(e)); } return; }
        if (isCreator && body.startsWith('$')) { try { let ex = await eval(`(async()=> { ${body.slice(1).trim()} })()`); if(ex) m.reply(util.format(ex)); } catch (e) { m.reply(util.format(e)); } return; }

        // PLUGIN ENGINE
        const events = require('./command');
        const cmd = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)));
        const context = { conn, mek: msg, m, from, body, isCmd, command, args, isOwner: isCreator, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: msg }) };

        if (cmd) {
            if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: msg.key } });
            try { cmd.function(conn, msg, m, context); } catch (e) { console.log(e); }
        }

        events.commands.forEach(c => { if ((c.on === "body" && body) || (c.on === "text" && args.length > 0)) c.function(conn, msg, m, context); });
    });

    conn.decodeJid = (jid) => { if (!jid) return jid; const d = jidDecode(jid) || {}; return (d.user && d.server && d.user + '@' + d.server) || jid; };
}

// ==========================================
// SECTION 5: STARTUP & WEB SERVER
// ==========================================

const app = express();
app.get("/", (req, res) => res.send("POPKID-MD STATUS: ONLINE ✅"));
app.listen(process.env.PORT || 9090, () => { hostLog(`Server Running on Port: ${process.env.PORT || 9090}`); });

console.clear();
connectToWA();
