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
  version: "4.0.0",
  hasPermssion: 0,
  credits: "SHAAN BABU",
  description: "Strict Admin Only Mode (Blocks Everything)",
  commandCategory: "Admin",
  usages: "admin [list/add/remove/only/public]",
  cooldowns: 2
};

/* ================= STRICT BLOCKING LOGIC ================= */

module.exports.handleEvent = async function ({ api, event }) {
    const { senderID, threadID, body } = event;
    const configPath = global.client.configPath;
    const config = require(configPath);

    // Agar Admin Only mode ON hai
    if (config.adminOnly === true) {
        const isAdmin = config.ADMINBOT.includes(senderID) || config.NDH.includes(senderID);

        // Agar user admin nahi hai toh uske har message ko 'kill' kar do
        if (!isAdmin && body) {
            // Hum stopPropagation jaisa kaam karenge taaki aage koi command na chale
            if (typeof event.continueProcessing !== 'undefined') {
                event.continueProcessing = false;
            }
            return; 
        }
    }
};

/* ================= RUN COMMAND ================= */

module.exports.run = async function ({ api, event, args, Users, permssion }) {
  const { threadID, messageID, mentions, senderID } = event;
  const configPath = global.client.configPath;

  // Har baar fresh config uthao taaki update turant ho
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  config.ADMINBOT = config.ADMINBOT || [];
  config.NDH = config.NDH || [];

  const mentionIDs = Object.keys(mentions || {});

  if (!args[0]) {
    return api.sendMessage(
      ADMIN_BOX(
        "ADMIN COMMANDS\n\n" +
          "• admin list - Admins ki list\n" +
          "• admin add @tag - Naya admin\n" +
          "• admin remove @tag - Admin hatayein\n" +
          "• admin only - LOCK BOT (Full) 🔒\n" +
          "• admin public - UNLOCK BOT (Sabke liye) 🔓"
      ),
      threadID,
      messageID
    );
  }

  switch (args[0]) {
    case "list": {
      let adminText = "";
      for (const id of config.ADMINBOT) {
        const name = (await Users.getData(id)).name || id;
        adminText += `• ${name} (${id})\n`;
      }
      return api.sendMessage(BOT_BOX("👑 ADMINS\n" + (adminText || "None")), threadID, messageID);
    }

    case "add": {
      if (permssion != 3) return api.sendMessage(SECURITY_BOX("Permission Denied ❌"), threadID, messageID);
      const ids = mentionIDs.length > 0 ? mentionIDs : event.messageReply ? [event.messageReply.senderID] : [];
      if (!ids.length) return api.sendMessage("Tag ya Reply karein!", threadID, messageID);
      for (const id of ids) { if (!config.ADMINBOT.includes(id)) config.ADMINBOT.push(id); }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      return api.sendMessage(ADMIN_BOX(`Successfully added Admin(s) ✅`), threadID, messageID);
    }

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

    case "only": {
      if (permssion != 3) return api.sendMessage(SECURITY_BOX("Permission Denied ❌"), threadID, messageID);
      config.adminOnly = true; 
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      global.config.adminOnly = true; // Global state update
      return api.sendMessage(SECURITY_BOX("Admin Only Mode ENABLED 🔒\nAb koi bhi local/prefix command public ke liye nahi chalegi."), threadID, messageID);
    }

    case "public": {
      if (permssion != 3) return api.sendMessage(SECURITY_BOX("Permission Denied ❌"), threadID, messageID);
      config.adminOnly = false; 
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
      global.config.adminOnly = false; // Global state update
      return api.sendMessage(SECURITY_BOX("Admin Only Mode DISABLED 🔓\nBot ab sabke liye public hai."), threadID, messageID);
    }

    case "qtvonly": {
      const dataPath = resolve(__dirname, "cache", "data.json");
      const data = require(dataPath);
      data.adminbox[threadID] = !data.adminbox[threadID];
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
      return api.sendMessage(SECURITY_BOX(data.adminbox[threadID] ? "QTV Only ENABLED 🔥" : "QTV Only DISABLED ❄️"), threadID, messageID);
    }

    default:
      return api.sendMessage(BOT_BOX("Invalid Command ❌"), threadID, messageID);
  }
};
