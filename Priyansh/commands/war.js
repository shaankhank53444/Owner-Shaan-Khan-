module.exports.config = {
  name: "war",
  version: "1.2.5",
  hasPermssion: 2,
  credits: "SMART SHANKAR",
  description: "War mode with Roman Hindi insults (Optimized)",
  commandCategory: "Admin",
  usages: "war on [UID] [language] / war off",
  cooldowns: 2,
};

const request = require("request");

// Global state management
if (!global.warSystem) {
  global.warSystem = new Map();
}

const insults = [
  "Oye {name}, teri maa ki chut faad dunga haram ki aulad likh tu aaj 👅✍️",
  "Sunn {name}, teri maa ko shilajeet khakar chodunga purn shaktiyon ke saath 👅✍️ mere putra",
  "Abey {name}, teri behen ki seal tod duga behen ke lund oyo ne pata kar leja kar 😂✍️",
  "{name}, teri maa ki chut me nalke ki tonti ghused dunga 👅✍️ tere ghar me paani ki kami nahi hogi bas nal ghumana teri maa mutna chalu kar degi tu bhar lena 😂✍️",
  "Dekh {name}, teri maa ki chut par patthar maar maar ke pichka duga 🙄✍️ lund ke tope type karta ja",
  "{name}, teri maa ko paris me lejakar chodunga behen ke lode bharat me bhanak bhi nahi lagne duga ki woh chud gayi mujh se 🤣✍️",
  "Beta {name}, teri maa ki aankhon me lund rakh kar sounga jab neend aayegi aaj mujhe 👅✍️",
  "Oye {name}, jab teri budhi maa chhoti thi usey toffee dekar choda karta tha me yakeen nahi to jaakar pooch us behen ki landi se 🤣✍️",
  "{name}, teri maa chodne me humko aanand aata hai aise hi roj apni maa ko hamare aage prastut kar diya karo 🙄✍️",
  "Sunn {name}, teri maa ki kachhi me lund fasa kar bhag jauga 🤣👅 fevicol se bhi mazboot jod milega roj doodh jo pita hu 👅🙄",
  "{name}, teri maa ki chut likh raha hu bhag mat jaana 🤣✍️ tujhe teri budhi maa ka vaasta 😂",
  "{name}, teri behen ko ghodi bana kar chodunga uski gaand moti kar dunga chod chod kar 😂✍️",
  "Abey {name}, teri behen ke chuche daba daba kar nichod duga aur sara dudu pee jauga 👅✍️ yum yum",
  "{name}, teri maa chud chud kar aaj 🙄 mujh se behosh ho jaygi bhagna mat likhta ja varna usey kaun hospital le jayga utha kar randi ke beej 👅🤣",
  "{name}, teri maa ko chodu yahan dinge marega ab लिखना teri maa ki gaand se paad bahar aa gaya kya chhotu 👅✍️",
  "{name}, daya aa rahi hai tujh par ki randi ke tu asahay hai apni maa ko chudne se bachane ko 🤣✍️",
  "{name}, teri maa ko chodna facebook jagat me mera maksad ho chuka hai teri maa ko koi nahi bacha sakega likhta ja suar ke dahine aand 😂✍️",
  "{name}, ab chudega tu beta chal bhonk ab 🤣🤣👈"
];

async function translateText(text, lang) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURI(text)}`;
    request(url, (err, response, body) => {
      if (err) return reject("Fail");
      try {
        const res = JSON.parse(body);
        let translated = "";
        res[0].forEach(item => { if (item[0]) translated += item[0]; });
        resolve(translated);
      } catch { reject("Fail"); }
    });
  });
}

module.exports.handleEvent = async function({ api, event, Users }) {
  const { threadID, senderID, messageID } = event;
  
  if (global.warSystem.has(threadID)) {
    const config = global.warSystem.get(threadID);
    
    if (config.active && senderID === config.targetUID) {
      const name = await Users.getNameUser(senderID);
      const randomInsult = insults[Math.floor(Math.random() * insults.length)];
      const finalMsg = randomInsult.replace(/{name}/g, name);

      try {
        const translated = await translateText(finalMsg, config.lang);
        return api.sendMessage(translated, threadID, messageID);
      } catch (e) {
        return api.sendMessage(finalMsg, threadID, messageID);
      }
    }
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminUID = "100016828397863";

  if (senderID !== adminUID) {
    return api.sendMessage("Bhai, sirf Admin hi ye command chala sakta hai. Tumhari aukat nahi hai!", threadID, messageID);
  }

  const action = args[0]?.toLowerCase();

  if (action === "on") {
    const uid = args[1];
    const lang = args[2] || "en";
    if (!uid) return api.sendMessage("Abey UID to de kis ko pelna hai?", threadID, messageID);

    global.warSystem.set(threadID, {
      active: true,
      targetUID: uid,
      lang: lang
    });

    return api.sendMessage(`✅ War Mode ON!\nTarget UID: ${uid}\nAb maza ayega!`, threadID, messageID);
  }

  if (action === "off") {
    global.warSystem.delete(threadID);
    return api.sendMessage("❌ War Mode OFF kar diya gaya hai.", threadID, messageID);
  }

  return api.sendMessage("Istemal: war on [UID] [lang] ya war off", threadID, messageID);
};
