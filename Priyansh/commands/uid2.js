module.exports.config = {
  name: "uid2",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "get user id with FCA mention fix.",
  commandCategory: "without prefix",
  cooldowns: 5
};

module.exports.run = async function({ event, api, args, Users }) {
  const fs = global.nodemodule["fs-extra"];
  const request = global.nodemodule["request"];
  const axios = global.nodemodule['axios'];
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  async function sendWithAvatar(id, name) {
    const path = __dirname + `/cache/${id}_avatar.png`;
    const callback = () => api.sendMessage({
      body: `━━━━[𝗨𝗜𝗗 𝗨𝗦𝗘𝗥]━━━━\n[➤]➜𝗡𝗔𝗠𝗘: ${name}\n[➤]➜𝗜𝗗: ${id}\n[➤]➜𝗠𝗘𝗦𝗦𝗘𝗡𝗚𝗘𝗥 𝗜𝗗: m.me/${id}\n[➤]➜𝗙𝗕 𝗟𝗜𝗡𝗞: https://www.facebook.com/profile.php?id=${id}`,
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);

    return request(encodeURI(`https://graph.facebook.com/${id}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`))
      .pipe(fs.createWriteStream(path))
      .on('close', () => callback());
  }

  // 1. Agar Message Reply hai
  if (type == "message_reply") {
    let name = await Users.getNameUser(messageReply.senderID);
    return await sendWithAvatar(messageReply.senderID, name);
  }

  // 2. Agar koi argument nahi hai (Apni ID)
  if (!args[0]) {
    let name = await Users.getNameUser(senderID);
    return await sendWithAvatar(senderID, name);
  }

  // 3. Agar Link diya gaya hai
  if (args[0].indexOf(".com/") !== -1) {
    const res_ID = await api.getUID(args[0]);
    const name = await Users.getNameUser(res_ID);
    return await sendWithAvatar(res_ID, name);
  }

  // 4. Mention Fix (FCA Workaround)
  let targetID;
  let targetName;

  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
    targetName = mentions[targetID].replace("@", "");
    return await sendWithAvatar(targetID, targetName);
  } else {
    // Manual search agar mention object khali ho
    const searchName = args.join(" ").replace("@", "").toLowerCase();
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs;

    for (let id of participantIDs) {
      let name = await Users.getNameUser(id);
      if (name.toLowerCase().includes(searchName)) {
        return await sendWithAvatar(id, name);
      }
    }
  }

  return api.sendMessage("❌ User nahi mila! Please reply karein ya sahi naam likhein.", threadID, messageID);
};
