module.exports.config = {
  name: "autoreact",
  version: "4.4.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Auto react on specific emojis and keywords",
  commandCategory: "system",
  usages: "",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { messageID, body, senderID, threadID } = event;

    // Direct message check aur self-react ignore
    if (!messageID || !body) return;
    if (senderID === api.getCurrentUserID()) return;

    // Cooldown management per thread (2.5 seconds)
    global.autoReactCooldown = global.autoReactCooldown || {};
    if (
      global.autoReactCooldown[threadID] &&
      Date.now() - global.autoReactCooldown[threadID] < 2500
    ) return;
    
    global.autoReactCooldown[threadID] = Date.now();

    const text = body.toLowerCase();
    let react = null;

    // Emoji matching categories
    const categories = [
      { e: ["😂", "🤣", "😆", "😄", "😁"], r: "😆" },
      { e: ["😭", "😢", "🥺", "💔"], r: "😢" },
      { e: ["❤️", "💖", "💘", "🥰", "😍"], r: "❤️" },
      { e: ["😡", "🤬"], r: "😡" },
      { e: ["😮", "😱", "😲"], r: "😮" },
      { e: ["😎", "🔥", "💯"], r: "😎" },
      { e: ["👍", "👌", "🙏"], r: "👍" },
      { e: ["🖕", "🥒", "👃"], r: "🖕" },
      { e: ["🎉", "🥳"], r: "🎉" }
    ];

    // Keyword matching categories
    const texts = [
      { k: ["haha", "lol", "moja", "xd", "bal"], r: "😆" },
      { k: ["shan", "Shaan", "shaan", "shaan khan", "SHAAN"], r: "😘" },
      { k: ["love", "valobasi", "miss", "alya", "hinata", "baby", "bot", "jan", "bby"], r: "🥹" },
      { k: ["rag", "angry", "rage"], r: "😡" },
      { k: ["wow", "omg"], r: "😮" },
      { k: ["prefix"], r: "🤖" },
      { k: ["ok", "yes", "okay", "hmm"], r: "✅" },
      { k: ["cmd"], r: "🔖" },
      { k: ["cdi", "fuck", "xdi", "fk", "chudi"], r: "🖕" },
      { k: ["hlw", "hellow", "hey"], r: "😸" },
      { k: ["fork", "repo", "repository"], r: "🍴" },
      { k: ["alhamdulillah", "valo", "sweet", "cute", "beautiful"], r: "🥰" },
      { k: ["birthday", "birth", "cake", "happy birthday"], r: "🎂" },
      { k: ["thanks", "tnx", "thank you", "wlc", "welcome"], r: "🦋" },
      { k: ["good night", "night", "gn"], r: "💤" },
      { k: ["good morning", "morning", "gm"], r: "🥱" }
    ];

    // Emoji check
    for (const c of categories) {
      if (c.e.some(x => text.includes(x))) {
        react = c.r;
        break;
      }
    }

    // Keyword check (agar emoji match na hua ho)
    if (!react) {
      for (const t of texts) {
        if (t.k.some(x => text.includes(x))) {
          react = t.r;
          break;
        }
      }
    }

    if (!react) return;

    // Delay reaction slightly to feel natural
    await new Promise(r => setTimeout(r, 800));

    // Mirai FCA reaction API call
    api.setMessageReaction(react, messageID, (err) => {}, true);
  } catch (e) {
    console.error(e);
  }
};

module.exports.run = async function ({ api, event, args }) {
  // Mirai requirement for commands/events
};
