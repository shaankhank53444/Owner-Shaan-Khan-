const fs = require("fs-extra");

/* ================= CONFIG ================= */
module.exports.config = {
  name: "cache",
  version: "2.0.5",
  hasPermssion: 2,
  credits: "Shaan Khan",
  description: "Delete files or folders inside cache (System Mode)",
  commandCategory: "Admin-bot system",
  usages: "cache / cache start <text> / cache ext <text> / cache <text> / cache help",
  cooldowns: 5
};

/* ================= SYSTEM BOX ================= */
const systemBox = (title, body) =>
`╭───〔 ${title} 〕───╮
${body}
╰────────────────────╯`;

/* ================= HANDLE REPLY ================= */
module.exports.handleReply = ({ api, event, handleReply }) => {
  if (event.senderID != handleReply.author) return;
  let nums = event.body.split(" ").map(n => parseInt(n));
  let msg = "";
  
  for (let num of nums) {
    let target = handleReply.files[num - 1];
    if (!target) continue;
    
    let fullPath = __dirname + "/cache/" + target;
    try {
      if (fs.existsSync(fullPath)) {
        let stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          msg += `🗂️ Folder Deleted : ${target}\n`;
        } else {
          fs.unlinkSync(fullPath);
          msg += `📄 File Deleted   : ${target}\n`;
        }
      }
    } catch (e) {
      msg += `❌ Error: ${target}\n`;
    }
  }
  
  api.sendMessage(
    systemBox("🧹 CACHE CLEAN RESULT", msg || "Nothing deleted."),
    event.threadID,
    event.messageID
  );
};

/* ================= MAIN RUN ================= */
module.exports.run = async function ({ api, event, args }) {
  // Authorized Admin ID
  const ADMIN = ["100016828397863"]; 
  
  if (!ADMIN.includes(event.senderID))
    return api.sendMessage(
      systemBox("⛔ ACCESS DENIED", "This command is strictly for the authorized Admin."),
      event.threadID,
      event.messageID
    );

  let cachePath = __dirname + "/cache";
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

  let files = fs.readdirSync(cachePath) || [];
  let msg = "";
  let i = 1;

  /* ===== HELP ===== */
  if (args[0] === "help") {
    return api.sendMessage(
      systemBox(
        "📘 CACHE COMMAND HELP",
        `cache\n→ Show all cache files\n\ncache start <text>\n→ Filter by start name\n\ncache ext <ext>\n→ Filter by extension\n\ncache <text>\n→ Search file name\n\nReply with numbers to delete`
      ),
      event.threadID,
      event.messageID
    );
  }

  /* ===== FILTERS ===== */
  if (args[0] === "start" && args[1]) {
    let word = args.slice(1).join(" ");
    files = files.filter(f => f.startsWith(word));
  }
  else if (args[0] === "ext" && args[1]) {
    let ext = args[1];
    files = files.filter(f => f.endsWith(ext));
  }
  else if (args[0]) {
    let word = args.join(" ");
    files = files.filter(f => f.includes(word));
  }

  /* ===== CHECK EMPTY ===== */
  if (!files.length)
    return api.sendMessage(
      systemBox("📂 CACHE STATUS", "No matching files found in cache."),
      event.threadID,
      event.messageID
    );

  /* ===== LIST FILES ===== */
  for (let file of files) {
    try {
      let stat = fs.statSync(cachePath + "/" + file);
      msg += `${i++}. ${stat.isDirectory() ? "🗂️" : "📄"} ${file}\n`;
    } catch (e) { continue; }
  }

  api.sendMessage(
    systemBox(
      "🧹 CACHE FILE LIST",
      `Reply with numbers to delete:\n\n${msg}`
    ),
    event.threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        files
      });
    }
  );
};
