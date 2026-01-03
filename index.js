const fs = require('fs-extra');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const appstatePath = path.join(__dirname, 'appstate.json');

let botModule = null;
let botStarted = false;

const BRAND_NAME = "SHAAN KHAN";
const BRAND_WHATSAPP = "+923368783346";
const BRAND_EMAIL = "shankhank345@gmail.com";

function getConfig() {
  try {
    return fs.readJsonSync(configPath);
  } catch {
    return {
      BOTNAME: '™★𝐁𝐎𝐓 𝐉𝐀𝐍𝐔',
      PREFIX: '.',
      ADMINBOT: ['100016828397863'],
      TIMEZONE: 'Asia/Karachi',
      PREFIX_ENABLED: true,
      REACT_DELETE_EMOJI: '😡',
      ADMIN_ONLY_MODE: false,
      AUTO_ISLAMIC_POST: true,
      AUTO_GROUP_MESSAGE: true,
      APPROVE_ONLY: false
    };
  }
}

function saveConfig(config) {
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

function getAppstate() {
  try {
    return fs.readJsonSync(appstatePath);
  } catch {
    return null;
  }
}

function saveAppstate(appstate) {
  fs.writeJsonSync(appstatePath, appstate, { spaces: 2 });
}

// Start bot
async function startBot() {
  try {
    if (!fs.existsSync(appstatePath)) {
      console.log('❌ AppState not found. Please add appstate.json to start the bot.');
      return;
    }

    console.log(`\n╔═══════════════════════════════════════════════════╗`);
    console.log(`║  ██████╗ ██████╗ ██╗  ██╗    ██████╗  ██████╗ ████████╗║`);
    console.log(`║  ██╔══██╗██╔══██╗╚██╗██╔╝    ██╔══██╗██╔═══██╗╚══██╔══╝║`);
    console.log(`║  ██████╔╝██║  ██║ ╚███╔╝     ██████╔╝██║   ██║   ██║   ║`);
    console.log(`║  ██╔══██╗██║  ██║ ██╔██╗     ██╔══██╗██║   ██║   ██║   ║`);
    console.log(`║  ██║  ██║██████╔╝██╔╝ ██╗    ██████╔╝╚██████╔╝   ██║   ║`);
    console.log(`║  ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   ║`);
    console.log(`╠═══════════════════════════════════════════════════╣`);
    console.log(`║ WhatsApp: ${BRAND_WHATSAPP}                           ║`);
    console.log(`║ Email: ${BRAND_EMAIL}                      ║`);
    console.log(`╚═══════════════════════════════════════════════════╝\n`);

    console.log('[BOT] Starting SARDAR RDX...');

    botModule = require('./rdx');
    botModule.startBot();
    botStarted = true;

    console.log('[BOT] SARDAR RDX is now online! 🚀');
  } catch (error) {
    console.error('❌ Error starting bot:', error.message);
    process.exit(1);
  }
}

// Start the bot immediately
startBot();