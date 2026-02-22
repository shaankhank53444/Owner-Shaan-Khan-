const fs = require("fs-extra");
const { resolve } = require("path");

/* ================= SYSTEM BOX DESIGN ================= */

function systemBox(title, text) {
  return `╭─── ${title} ───╮\n\n${text}\n\n╰─────────────────╯`;
}

const ADMIN_BOX = (text) => systemBox("🎀 〔 ADMIN SYSTEM 〕", text);
const SECURITY_BOX = (text) => systemBox("🔥 〔 SECURITY MODE 〕", text);
const BOT_BOX = (text) => systemBox("🤖 〔 BOT STATUS 〕", text);

/* ================= CONFIG ================= */

module.exports.config = {
  name: "admin",
  version: "3.6.0",
  hasPermssion: 0,
  credits: "SHAAN BABU",
  description: "Admin Only Mode (Prefix/No-Prefix Block System)",
  commandCategory: "Admin",
  usages: "admin [list/add/remove/only/public]",
  cooldowns: 3
};

/* ================= HANDLE EVENT (DYNAMIC BLOCKING) ================= */

module.exports.handleEvent = async function ({ api, event }) {
    const { senderID, body } = event;
    const configPath = global.client.configPath;
    const config = require(configPath);

    // Agar Admin Only mode ON hai (True hai)
    if (config.adminOnly === true) {
        const isAdmin = config.ADMINBOT.includes(senderID) || config.NDH.includes(senderID);

        // Agar user admin nahi hai, toh message/command process mat karo
        if (!isAdmin && body) {
            return; // Yahan se code ruk jayega, bot reply nahi karega
        }
    }
};

/* ================= ON LOAD ================= */

module.exports.onLoad = () => {
  const path = resolve(__dirname, "cache", "data.json");
  if (!fs.existsSync(path)) {
    if (!fs.existsSync(resolve(__dirname, "cache"))) fs.mkdirSync(resolve(__dirname, "cache"));
    fs.writeFileSync(path, JSON.stringify({ adminbox: {} }, null, 4));
  }
};

/* ================= RUN ================= */

module.exports.run = async function ({
  api,
  event,
  args,
  Users,
  permssion
}) {
  const { threadID, messageID, mentions } = event;
  const configPath = global.client.configPath;

  delete require.cache[require.resolve(configPath)];
  const config = require(configPath);

  config.ADMINBOT = config.ADMINBOT || [];
  config.NDH = config.NDH || [];

  const mentionIDs = Object.keys(mentions || {});

  if (!args[0]) {
    return api.sendMessage(
      ADMIN_BOX(
        "ADMIN COMMANDS\n\n" +
          "• admin list - Admins ki list\n" +
          "• admin add @tag - Naya admin banayein\n" +
          "• admin remove @tag - Admin hatayein\n" +
          "• admin only - Bot Admin Only ON 🔒\n" +
          "• admin public - Bot Public Mode ON 🔓\n" +
          "• admin qtvonly - Group Admin mode"
      ),
      threadID,
      messageID
    );
  }

  switch (args[0]) {
    /* ===== LIST ===== */
    case "list": {
      let adminText = "";
      for (const id of config.ADMINBOT) {
        const name = (await Users.getData(id)).name || id;
        adminText += `• ${name} (${id})\n`;
      }
      return api.sendMessage(BOT_BOX("👑 ADMINS\n" + (adminText || "None")), threadID, messageID);
    }

    /* ===== ADD ADMIN ===== */
    case "add": {
      if (permssion != 3) return api.sendMessage(SECURITY_BOX("Permission Denied ❌"), threadID, messageID);
      const ids = mentionIDs.length > 0 ? mentionIDs : event.messageReply ? [event.messageReply.senderID] : [];
      if (!ids.length) return api.sendMessage("Tag ya Reply karein!", threadID, messageID);
      for (const id of ids) { if (!config.ADMINBOT.includes(id)) config.ADMINBOT.push(id); }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      return api.sendMessage(ADMIN_BOX(`Successfully added Admin(s) ✅`), threadID, messageID);
    }

    /* ===== REMOVE ADMIN ===== */
    case "remove": {
      if (permssion != 3) return api.sendMessage(SECURITY_BOX("Permission Denied ❌"), threadID, messageID);
      const ids = mentionIDs.length > 0 ? mentionIDs : event.messageReply ? [event.messageReply.senderID] : [];
      for (const id of ids) {
        const index = config.ADMINBOT.indexOf(id);
        if (index !== -1) config.ADMINBOT.splice(index, 1);
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      return api.sendMessage(ADMIN_BOX(`Successfully removed Admin(s) ❌`), threadID, messageID);
    }

    /* ===== ONLY ADMIN (Lock) ===== */
    case "only": {
      if (permssion != 3) return api.sendMessage(SECURITY_BOX("Permission Denied ❌"), threadID, messageID);
      config.adminOnly = true; 
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      return api.sendMessage(SECURITY_BOX("Admin Only Mode ENABLED 🔒\nAb bot sirf admins ke commands maanega."), threadID, messageID);
    }

    /* ===== PUBLIC MODE (Unlock) ===== */
    case "public": {
      if (permssion != 3) return api.sendMessage(SECURITY_BOX("Permission Denied ❌"), threadID, messageID);
      config.adminOnly = false; 
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      return api.sendMessage(SECURITY_BOX("Admin Only Mode DISABLED 🔓\nAb bot sabke liye (Public) kaam karega."), threadID, messageID);
    }

    /* ===== QTV ONLY ===== */
    case "qtvonly": {
      const dataPath = resolve(__dirname, "cache", "data.json");
      const data = require(dataPath);
      data.adminbox[threadID] = !data.adminbox[threadID];
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
      return api.sendMessage(SECURITY_BOX(data.adminbox[threadID] ? "QTV Only Mode ENABLED 🔥" : "QTV Only Mode DISABLED ❄️"), threadID, messageID);
    }

    default:
      return api.sendMessage(BOT_BOX("Invalid Command ❌"), threadID, messageID);
  }
};
