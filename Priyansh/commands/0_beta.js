const emojiResponses = {
  "golu beta": {
    "OWNER": [
      "Han papa, aajao mujhe ice cream khilao 🍨🥺",
      "Papa g ap kahan gay thay, main kab se wait kar raha tha 😀",
      "Papa main tum se bohat pyaar karta hoon 🙈❤️",
      "Han Papa mujhe batao, aaj kis ki class leni hai? 😊"
    ],
    "MALE": [
      "Are bhai kaho, sab theek thak? Kahan rehte ho aajkal?",
      "Han bhai ap kaise hain, scene on hai ya nahi?",
      "Bhai aaj ka kya mansoba hai, koi plan banayein?"
    ],
    "FEMALE": [
      "Lagta hai aap hi meri hone wali ami ho! 🤭",
      "Mere Shaan papa ki koi GF hai kya? Zara mujhe batao na",
      "Mere Shaan papa single hain, kya aap meri ami ban na pasand karogi? 🥺"
    ]
  },
  "beta": {
    "OWNER": [
      "Papa aapki wajah se main har roz sab se upar ki karkardagi mein hoon 😎",
      "Papa aap aa gaye! 😀",
      "G papa 🥺",
      "Papa g main aapko bohot yaad kar raha tha 😔"
    ]
  }
};

module.exports.config = {
  name: "auto-rply",
  version: "1.0.1",
  hasPermission: 0,
  credits: "SHAAN KHAN",
  description: "MADE BY SHAAN KHAN",
  commandCategory: "No command marks needed",
  cooldowns: 0
};

const botOwnerID = "100016828397863";

module.exports.handleEvent = async function({ api, event }) {
  try {
    const { threadID, messageID, senderID, body } = event;
    if (!body) return;

    const lowercaseBody = body.toLowerCase();
    const emojis = Object.keys(emojiResponses);

    for (const emoji of emojis) {
      if (lowercaseBody.includes(emoji)) {
        let responseArray;

        if (senderID === botOwnerID) {
          responseArray = emojiResponses[emoji]["OWNER"];
        } else {
          // Fallback mechanism to prevent crashing if thread info fails
          let isFemale = false;
          try {
            const threadInfo = await api.getThreadInfo(threadID);
            const user = threadInfo?.userInfo?.find(u => u.id === senderID);
            if (user && user.gender === 2) {
              isFemale = true;
            }
          } catch (err) {
            // Silently fallback if thread info fails
          }

          if (emojiResponses[emoji]["FEMALE"] && isFemale) {
            responseArray = emojiResponses[emoji]["FEMALE"];
          } else {
            responseArray = emojiResponses[emoji]["MALE"] || emojiResponses[emoji]["OWNER"];
          }
        }

        if (responseArray && responseArray.length > 0) {
          const randomResponse = responseArray[Math.floor(Math.random() * responseArray.length)];
          return api.sendMessage(randomResponse, threadID, messageID);
        }
      }
    }
  } catch (error) {
    console.error("Error in auto-rply module:", error);
  }
};

module.exports.run = function() {};
