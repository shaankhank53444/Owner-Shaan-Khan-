const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pair4",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Cute romantic pair system",
  commandCategory: "FUN & SOCIAL",
  usages: "[reply/tag/leave blank]",
  cooldowns: 6
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  const { threadID, messageID, senderID, messageReply, mentions } = event;

  try {
    let targetID = senderID;
    
    // Reply ya Mention handle karne ka mechanism
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    const loading = await api.sendMessage("💗 | Finding your perfect partner...", threadID);

    // Sender/Target profile fetching
    const senderData = await Users.getData(targetID);
    const senderName = senderData.name || "User";
    const senderGender = senderData.gender;

    // Thread Members load karna
    const threadInfo = await api.getThreadInfo(threadID);
    const members = threadInfo.participantIDs.filter(uid => uid != targetID);

    if (members.length === 0) {
      return api.sendMessage("❌ | Group me pair banane ke liye aur members ka hona zaroori hai!", threadID, messageID);
    }

    // Opposite Gender Select karne ki logic
    let targetGender;
    if (senderGender === 1) {
      targetGender = 2;
    } else if (senderGender === 2) {
      targetGender = 1;
    } else {
      targetGender = Math.random() > 0.5 ? 1 : 2;
    }

    let partnerList = [];
    const randomMembers = members.sort(() => 0.5 - Math.random());

    for (const uid of randomMembers) {
      try {
        const data = await Users.getData(uid);
        if (data && data.gender === targetGender) {
          partnerList.push({ id: uid, name: data.name, gender: data.gender });
        }
      } catch (e) {}
    }

    let partner;

    if (partnerList.length > 0) {
      partner = partnerList[Math.floor(Math.random() * partnerList.length)];
    } else {
      let fallbackPartner = null;

      for (const uid of randomMembers) {
        try {
          const data = await Users.getData(uid);
          if (data && data.gender !== senderGender && data.gender !== undefined) {
            fallbackPartner = { id: uid, name: data.name, gender: data.gender };
            break;
          }
        } catch (e) {}
      }

      if (fallbackPartner) {
        partner = fallbackPartner;
      } else {
        const fallbackId = randomMembers[Math.floor(Math.random() * randomMembers.length)];
        const fallbackData = await Users.getData(fallbackId);
        partner = {
          id: fallbackId,
          name: fallbackData.name || "Someone Special",
          gender: fallbackData.gender || targetGender
        };
      }
    }

    const match = Math.floor(Math.random() * 31) + 70;

    // Canvas Image Creation
    const canvas = Canvas.createCanvas(1200, 700);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
    gradient.addColorStop(0, "#ffe6f2");
    gradient.addColorStop(1, "#fff0f7");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 50; i++) {
      ctx.font = `${20 + Math.random() * 35}px sans-serif`;
      ctx.fillStyle = "rgba(255,105,180,0.15)";
      ctx.fillText("💖", Math.random() * canvas.width, Math.random() * canvas.height);
    }

    ctx.strokeStyle = "#ffb6d9";
    ctx.lineWidth = 16;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.font = "55px sans-serif";
    for (let i = 0; i < 6; i++) {
      ctx.fillText("🎀", 80 + i * 190, 65);
    }

    const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
    const avt1 = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${token}`;
    const avt2 = `https://graph.facebook.com/${partner.id}/picture?width=512&height=512&access_token=${token}`;

    async function loadImage(url) {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      return await Canvas.loadImage(response.data);
    }

    const [img1, img2] = await Promise.all([loadImage(avt1), loadImage(avt2)]);

    function drawCuteFrame(img, x, y) {
      const size = 260;

      ctx.shadowColor = "#ff69b4";
      ctx.shadowBlur = 30;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 14, y - 14, size + 28, size + 28);

      ctx.strokeStyle = "#ff8dc7";
      ctx.lineWidth = 10;
      ctx.strokeRect(x - 6, y - 6, size + 12, size + 12);

      ctx.drawImage(img, x, y, size, size);

      ctx.shadowBlur = 0;

      ctx.font = "35px sans-serif";
      ctx.fillText("🎀", x - 18, y - 18);
      ctx.fillText("🎀", x + size - 5, y - 18);

      ctx.fillText("💖", x - 10, y + size + 28);
      ctx.fillText("💖", x + size - 5, y + size + 28);
    }

    drawCuteFrame(img1, 120, 200);
    drawCuteFrame(img2, 820, 200);

    ctx.font = "130px sans-serif";
    ctx.fillText("💗", 515, 355);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ff1493";
    ctx.font = "bold 48px Sans";
    ctx.fillText(`${match}% MATCH`, 600, 520);

    ctx.fillStyle = "#d63384";
    ctx.font = "bold 32px Sans";

    let displayName1 = senderName;
    let displayName2 = partner.name;

    if (displayName1.length > 15) displayName1 = displayName1.substring(0, 15) + "...";
    if (displayName2.length > 15) displayName2 = displayName2.substring(0, 15) + "...";

    ctx.fillText(displayName1, 250, 585);
    ctx.fillText(displayName2, 950, 585);

    ctx.font = "28px Sans";
    ctx.fillStyle = "#ff69b4";
    ctx.fillText("Made with Love 💕", 600, 650);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const filePath = path.join(cacheDir, `pair_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer());

    if (loading && loading.messageID) {
      try {
        await api.unsendMessage(loading.messageID);
      } catch (e) {}
    }

    const emoji = match > 85 ? "💞" : match > 75 ? "💗" : "💕";
    const compatibility = match > 85 ? "Perfect" : match > 75 ? "Great" : "Good";

    const genderEmoji1 = senderGender === 1 ? "👦" : senderGender === 2 ? "👧" : "👤";
    const genderEmoji2 = partner.gender === 1 ? "👦" : partner.gender === 2 ? "👧" : "👤";

    const msg = `${emoji} 𝗣𝗘𝗥𝗙𝗘𝗖𝗧 𝗣𝗔𝗜𝗥\n\n${genderEmoji1} ${senderName} ✦ ${genderEmoji2} ${partner.name}\n📊 ${match}% ${compatibility} Match\n💘 Status: Matched!`;

    return api.sendMessage(
      {
        body: msg,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {}
        }
      },
      messageID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ | Pair system failed!", threadID, messageID);
  }
};
