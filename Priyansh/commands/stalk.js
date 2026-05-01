/**
 * Mirai Bot Stalk Command
 * Direct API Key Integration
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "stalk",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Facebook user ki details aur profile picture hasil karein.",
  commandCategory: "utility",
  usages: "[@mention/reply/link/ID]",
  cooldowns: 5
};

// Link preview bypass helper
function preventLinkPreview(value) {
  if (!value || value === "No data") return value;
  return value.replace(/https?:\/\/\S+/gi, (url) => url.replace("://", "://\u200b"));
}

// Facebook link formatter
function normalizeFacebookLink(link) {
  if (!link) return link;
  let normalized = link.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

// Result UI formatter
function buildFormattedMessage(data = {}) {
  const safeWebsite = preventLinkPreview(data.website || "No data");
  const safeLink = preventLinkPreview(data.link || "No data");

  return (
    `👤 𝐍𝐚𝐦𝐞: ${data.name || "No data"}\n` +
    `🆔 𝐈𝐃: ${data.userId || "No data"}\n` +
    `📛 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${data.username || "No data"}\n` +
    `🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${data.birthday || "No data"}\n` +
    `⚤ 𝐆𝐞𝐧𝐝𝐞𝐫: ${data.gender || "No data"}\n` +
    `💑 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩: ${data.relationshipStatus || "No data"}\n` +
    `ℹ️ 𝐀𝐛𝐨𝐮𝐭: ${data.about || "No data"}\n` +
    `🏡 𝐇𝐨𝐦𝐞𝐭𝐨𝐰𝐧: ${data.hometown || "No data"}\n` +
    `📍 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧: ${data.location || "No data"}\n` +
    `🌐 𝐖𝐞𝐛𝐬𝐢𝐭𝐞: ${safeWebsite}\n` +
    `🔗 𝐋𝐢𝐧𝐤: ${safeLink}\n` +
    `💬 𝐒𝐭𝐚𝐭𝐮𝐬: ${data.quotes || "No data"}\n` +
    `❤️ 𝐖𝐢𝐭𝐡: ${data.significantOther || "No data"}\n` +
    `👥 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬: ${data.subscribersCount ?? "No data"}`
  );
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  
  // Yahan aapki key direct laga di gayi hai
  const apiKey = "Apim_B6kjY2DA0JvWZyrA74rZcZktTBYzGMAghu9Wuh7zv5c";
  const API_ENDPOINT = "https://priyanshuapi.xyz/api/runner/fb-stalk/stalk";

  try {
    let userId = null;
    let targetLink = null;

    // Identifying Target
    if (Object.keys(mentions).length > 0) {
      userId = Object.keys(mentions)[0];
    } else if (type === "message_reply") {
      userId = messageReply.senderID;
    } else if (args.length > 0 && /^\d+$/.test(args[0])) {
      userId = args[0];
    } else if (args.length > 0 && args[0].match(/(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/(?:profile\.php\?id=|[\w.]+)/)) {
      targetLink = normalizeFacebookLink(args[0]);
    } else if (args.length === 0) {
      userId = senderID;
    } else {
      return api.sendMessage('❓ Usage:\n- stalk\n- stalk @mention\n- stalk [UID]\n- stalk [Link]', threadID, messageID);
    }

    const waitMsg = await api.sendMessage('🔍 Information fetch ho rahi hai, intezar karein...', threadID);

    const payload = targetLink ? { link: targetLink } : { userId: String(userId) };
    
    const response = await axios.post(API_ENDPOINT, payload, {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      timeout: 25000
    });

    if (!response.data?.success || !response.data?.data) {
      api.unsendMessage(waitMsg.messageID);
      throw new Error(response.data?.message || 'Data nahi mil saka.');
    }

    const userData = response.data.data;
    const formattedBody = buildFormattedMessage(userData);
    
    // Ensure cache folder exists
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    
    const tmpPath = path.join(cacheDir, `stalk_${userData.userId || Date.now()}.jpg`);

    // Profile Picture Handling
    let msg = { body: formattedBody };
    
    if (userData.profilePictureUrl) {
      try {
        const picRes = await axios.get(userData.profilePictureUrl, { responseType: "arraybuffer" });
        await fs.outputFile(tmpPath, Buffer.from(picRes.data));
        msg.attachment = fs.createReadStream(tmpPath);
      } catch (e) {
        console.log("Pic download failed, sending text only.");
      }
    }

    api.unsendMessage(waitMsg.messageID);

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(`❌ Error: ${error.message || "Server connection problem."}`, threadID, messageID);
  }
};
