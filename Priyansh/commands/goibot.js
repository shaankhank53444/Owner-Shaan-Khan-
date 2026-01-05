const fs = global.nodemodule["fs-extra"];

module.exports.config = {
  name: "goibot",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "MR SHAAN",
  description: "Goibot noprefix auto reply",
  commandCategory: "Noprefix",
  usages: "noprefix",
  cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  const threadID = event.threadID;
  const body = event.body.toLowerCase();

  /* ================= EMOJI REPLIES ================= */

  if (body === "🙈🙈")
    return api.sendMessage(
      "Mujhe pata hai tum bander ho 🐒🤣\nChhup ke kya kar rahe ho 😜",
      threadID
    );

  if (body === "🙉🙉")
    return api.sendMessage(
      "Kaan band karke kya milega 😂\nSach to sunna hi padega 😏",
      threadID
    );

  if (body === "🐒")
    return api.sendMessage(
      "Bander mil gaya 🐒😂\nZoo se bhaag aaye ho kya 😆",
      threadID
    );

  if (body === "🙊")
    return api.sendMessage(
      "Muh band kar liya 🙊😂\nSach bolne ka time aa gaya 😜",
      threadID
    );

  if (body === "😏")
    return api.sendMessage(
      "Aise kya dekh rahe ho 😏\nKuch gadbad lag rahi 😎",
      threadID
    );

  if (body === "🤐")
    return api.sendMessage(
      "Bilkul chup 🤐😜\nLagta hai kaand hua 😂",
      threadID
    );

  if (body === "😂")
    return api.sendMessage(
      "Itni hasi kyun 😂😂\nJoke mast tha kya 😆",
      threadID
    );

  if (body === "😭")
    return api.sendMessage(
      "Arre baba 😭\nKya dukh aa gaya 🫂",
      threadID
    );

  if (body === "❤️")
    return api.sendMessage(
      "Dil se bheja ❤️\nMood romantic lagta 😌",
      threadID
    );

  if (body === "💔")
    return api.sendMessage(
      "Dil toot gaya kya 💔\nChal hug le lo 🫂",
      threadID
    );

  /* ================= TEXT REPLIES ================= */

  if (body === "hello")
    return api.sendMessage(
      "Hello ji 👋🙂\nKya haal chaal 😄",
      threadID
    );

  if (body === "hi")
    return api.sendMessage(
      "Hi dost 😄\nKaise ho 🙂",
      threadID
    );

  if (body === "oye")
    return api.sendMessage(
      "Oye haan bolo 😌\nKya scene hai 😜",
      threadID
    );

  if (body === "kaise ho")
    return api.sendMessage(
      "Main mast hoon 😎\nTum batao kya haal 😌",
      threadID
    );

  if (body === "kese ho")
    return api.sendMessage(
      "Bilkul badhiya 😄\nLife set chal rahi 😎",
      threadID
    );

  if (body === "good morning")
    return api.sendMessage(
      "Good morning 🌅\nChai pi li ya nahi ☕",
      threadID
    );

  if (body === "good night")
    return api.sendMessage(
      "Good night 🌙😴\nSweet dreams 😌",
      threadID
    );

  if (body === "kya kar rahe ho")
    return api.sendMessage(
      "Tumse baat 😌\nAur kya hi kaam 😄",
      threadID
    );

  if (body === "free ho")
    return api.sendMessage(
      "Tumhare liye hamesha 😉\nBolo kya plan 😎",
      threadID
    );

  if (body === "i love you")
    return api.sendMessage(
      "Love you too ❤️😘\nDil se 😌",
      threadID
    );

  if (body === "miss you")
    return api.sendMessage(
      "Main bhi miss kar raha 😌\nJaldi milenge 🫂",
      threadID
    );

  if (body === "sad")
    return api.sendMessage(
      "Sad kyun 😟\nBatao kya hua 🫂",
      threadID
    );

  if (body === "nobody loves me")
    return api.sendMessage(
      "Aisa mat socho 🫂❤️\nMain hoon na 😌",
      threadID
    );

  if (body === "bhai")
    return api.sendMessage(
      "Bhai ho to tu hi 😎\nFull support 💪",
      threadID
    );

  if (body === "yaar")
    return api.sendMessage(
      "Yaar tu dil ka banda 😌\nSolid dost 🤝",
      threadID
    );

  if (body === "lol")
    return api.sendMessage(
      "Lol 😂😂\nHas has ke pagal 😆",
      threadID
    );

  if (body === "hmm")
    return api.sendMessage(
      "Hmm 🤔\nSoch gehri lag rahi 😏",
      threadID
    );

  if (body === "acha")
    return api.sendMessage(
      "Acha 😄\nPhir theek hai 😌",
      threadID
    );

  if (body === "boring")
    return api.sendMessage(
      "Boring ho raha 😴\nMain hoon na 😎",
      threadID
    );

  if (body === "school")
    return api.sendMessage(
      "School ka time 📚\nTeacher se bach ke 😜",
      threadID
    );

  if (body === "college")
    return api.sendMessage(
      "College life 😎📖\nPadhai + masti 😄",
      threadID
    );

  if (body === "khana khaya")
    return api.sendMessage(
      "Haan kha liya 😄\nTumne khaya 🍽️",
      threadID
    );

  if (body === "bhook lagi")
    return api.sendMessage(
      "Bhook lagi 😄\nKuch tasty kha lo 😋",
      threadID
    );

  if (body === "sleep")
    return api.sendMessage(
      "So jao 😴\nKal fresh rahoge 😌",
      threadID
    );

  if (body === "dp")
    return api.sendMessage(
      "DP mast hai 😎\nStyle full 🔥",
      threadID
    );

  if (body === "attitude")
    return api.sendMessage(
      "Attitude level high 😎🔥\nApna swag 😏",
      threadID
    );

  if (body === "plan")
    return api.sendMessage(
      "Plan solid hai 😎\nExecute karte hain 🔥",
      threadID
    );

  if (body === "chill")
    return api.sendMessage(
      "Chill scene 😎❄️\nNo tension 😄",
      threadID
    );

  if (body === "tension")
    return api.sendMessage(
      "Tension mat le 😌\nSab set ho jayega 💪",
      threadID
    );
};

module.exports.run = function () {};