const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const BACKGROUNDS = [
  "https://i.imgur.com/0aEluTM.jpeg",
  "https://i.imgur.com/0geTIBC.jpeg",
  "https://i.imgur.com/3Y3C1Yr.jpeg",
  "https://i.imgur.com/2zz53lV.jpeg",
  "https://i.imgur.com/S1hIuc7.jpeg",
  "https://i.imgur.com/2lDJNM3.jpeg",
  "https://i.imgur.com/2PrkMNy.jpeg",
  "https://i.imgur.com/TF9diX2.jpeg",
  "https://i.imgur.com/fK7OtYq.jpeg",
  "https://i.imgur.com/5OO802y.jpeg"
];

const ROMANTIC_POETRY = [
  "تیرے خیال سے مہکتی ہے میری ہر بات،\nتمہیں سوچنا بھی کتنا حسین احساس ہے! ✨✨",
  "تو پاس نہیں تو کیا ہوا، دل کے سب سے قریب تو ہے،\nمحبت میں جسم نہیں، روح کا تعلق ہوتا ہے! ❤️🌹",
  "تیرے بغیر زندگی ادھوری سی لگتی ہے،\nتم مل جاؤ تو دنیا مکمل سی لگتی ہے! 💕✨",
  "ہم نے ہر سانس میں تجھ کو ہی پکارا ہے،\nتیرے سوا کون اس دل کا سہارا ہے! 💖💫",
  "تیری مسکراہٹ ہی میری زندگی کا حاصل ہے،\nتو ساتھ ہے تو ہر راستہ آسان سا لگتا ہے! 🌷🌺",
  "دل کی کتاب میں نام صرف تمہارا ہے،\nتمہاری چاہت ہی میری زندگانی کا سہارا ہے! 💞🔥",
  "اک چاہت ہے تمہارے ساتھ جینے کی،\nورنہ پتہ تو ہمیں بھی ہے کہ مرنا اکیلے ہی ہے! 💫❤️",
  "تجھے دیکھ کر جو آ جاتی ہے چہرے پہ رونق،\nوہ سمجھتے ہیں کہ بیمار کا حال اچھا ہے! 🌹🥰",
  "تیرے لمس کی گرمی، تیری سانسوں کی خوشبو،\nدل کہتا ہے تیرے آغوش میں ہی دم نکلے! 💓✨",
  "محبت کی داستان میں تیرا نام پہلے آتا ہے،\nمیرا ہر دن تمہاری سوچ سے شروع ہوتا ہے! 🌸💗"
];

module.exports.config = {
  name: "pair3",
  version: "9.5.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Romantic pair system with random background & Poetry for Mirai Bot",
  commandCategory: "FUN & SOCIAL",
  usages: "[x1 y1 x2 y2]",
  cooldowns: 6,
  dependencies: {
    "axios": "",
    "canvas": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function ({ api, event, Users, Threads, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  try {
    let targetID = senderID;
    let targetName = null;

    if (messageReply) {
      targetID = messageReply.senderID;
    }

    const [senderData, threadInfo] = await Promise.all([
      Users.getData(targetID).catch(() => ({})),
      api.getThreadInfo(threadID)
    ]);

    if (!targetName && senderData && senderData.name) {
      targetName = senderData.name;
    }

    if (!targetName) {
      const userInfo = await api.getUserInfo(targetID).catch(() => ({}));
      targetName = userInfo[targetID] ? userInfo[targetID].name : "User";
    }

    const senderName = targetName;
    const senderGender = senderData.gender;

    const members = threadInfo.participantIDs.filter(uid => uid != targetID);

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
      } catch {}
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
        } catch {}
      }
      if (fallbackPartner) {
        partner = fallbackPartner;
      } else {
        const fallbackId = randomMembers[Math.floor(Math.random() * randomMembers.length)];
        let realName = "User";
        try {
          const fetchedUser = await api.getUserInfo(fallbackId);
          if (fetchedUser && fetchedUser[fallbackId]) {
            realName = fetchedUser[fallbackId].name || "User";
          }
        } catch {}

        partner = {
          id: fallbackId,
          name: realName,
          gender: targetGender
        };
      }
    }

    if (!partner.name || partner.name === "Someone Special") {
      try {
        const pInfo = await api.getUserInfo(partner.id);
        if (pInfo && pInfo[partner.id]) {
          partner.name = pInfo[partner.id].name;
        }
      } catch {
        partner.name = "User";
      }
    }

    const match = Math.floor(Math.random() * 31) + 70;

    let x1 = 0.20, y1 = 0.55, x2 = 0.80, y2 = 0.55;
    if (args.length >= 4) {
      const parsed = args.slice(0, 4).map(Number);
      if (parsed.every(n => !isNaN(n) && n >= 0 && n <= 1)) {
        [x1, y1, x2, y2] = parsed;
      }
    }

    const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

    const templateResponse = await axios.get(randomBg, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const templateImg = await Canvas.loadImage(templateResponse.data);

    const avt1 = `https://graph.facebook.com/${targetID}/picture?width=1024&height=1024&access_token=${token}`;
    const avt2 = `https://graph.facebook.com/${partner.id}/picture?width=1024&height=1024&access_token=${token}`;

    async function loadImage(url) {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      return await Canvas.loadImage(response.data);
    }

    const [img1, img2] = await Promise.all([loadImage(avt1), loadImage(avt2)]);

    const canvas = Canvas.createCanvas(templateImg.width, templateImg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

    const W = canvas.width;
    const H = canvas.height;
    const centerX1 = W * x1;
    const centerY1 = H * y1;
    const centerX2 = W * x2;
    const centerY2 = H * y2;
    const radius = W * 0.14;

    function drawCircleProfile(img, cx, cy, r) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const aspect = img.width / img.height;
      let drawW, drawH, dx, dy;
      if (aspect > 1) {
        drawW = r * 2;
        drawH = drawW / aspect;
        dx = cx - r;
        dy = cy - drawH / 2;
      } else {
        drawH = r * 2;
        drawW = drawH * aspect;
        dx = cx - drawW / 2;
        dy = cy - r;
      }
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    drawCircleProfile(img1, centerX1, centerY1, radius);
    drawCircleProfile(img2, centerX2, centerY2, radius);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `bold ${Math.round(W * 0.035)}px 'Segoe UI', 'Arial'`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#000000";

    const nameY1 = centerY1 + radius + 16;
    const nameY2 = centerY2 + radius + 16;
    const maxNameWidth = W * 0.2;
    function truncateName(name) {
      let w = ctx.measureText(name).width;
      if (w > maxNameWidth) {
        while (ctx.measureText(name + "…").width > maxNameWidth && name.length > 1) {
          name = name.slice(0, -1);
        }
        name += "…";
      }
      return name;
    }

    const displayName1 = truncateName(senderName);
    const displayName2 = truncateName(partner.name);

    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.fillText(displayName1, centerX1, nameY1);
    ctx.fillText(displayName2, centerX2, nameY2);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const filePath = path.join(cacheDir, `pair_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer());

    const emoji = match > 85 ? "💞" : match > 75 ? "💗" : "💕";
    const compatibility = match > 85 ? "Perfect" : match > 75 ? "Great" : "Good";
    const genderEmoji1 = senderGender === 1 ? "👦" : senderGender === 2 ? "👧" : "👤";
    const genderEmoji2 = partner.gender === 1 ? "👦" : partner.gender === 2 ? "👧" : "👤";

    const randomPoetry = ROMANTIC_POETRY[Math.floor(Math.random() * ROMANTIC_POETRY.length)];
    const ownerTag = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

    const msg = `${emoji} 𝗣𝗮𝗶𝗿 𝗠𝗮𝘁𝗰𝗵\n\n${genderEmoji1} ${senderName} ✦ ${genderEmoji2} ${partner.name}\n📊 ${match}% ${compatibility} Match\n💘 Status: Matched!\n\n✨ 𝑹𝒐𝒎𝒂𝒏𝒕𝒊𝒄 𝑷𝒐𝒆𝒕𝒓𝒚:\n${randomPoetry}\n\n${ownerTag}`;

    return api.sendMessage(
      {
        body: msg,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      },
      messageID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ | Pair system failed! Please try again.", threadID, messageID);
  }
};
