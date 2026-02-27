module.exports.config = {
  name: "uidall",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Group ke sabhi members ki UIDs aur names nikalne ke liye.",
  commandCategory: "utility",
  usages: "uidall",
  cooldowns: 5,
  dependencies: {}
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // Thread details lena
    const threadInfo = await api.getThreadInfo(threadID);
    const members = threadInfo.participantIDs || [];

    let msg = `✨ GROUP MEMBER UIDs (${members.length}) ✨\n───────────────────\n`;

    // Zyada members hone par bot crash na ho, isliye limit zaroori hai
    const MAX_MEMBERS = 30;
    const displayMembers = members.slice(0, MAX_MEMBERS);

    // Users ki details lena (Names ke liye)
    const usersInfo = await api.getUserInfo(displayMembers);

    for (let i = 0; i < displayMembers.length; i++) {
      const uid = displayMembers[i];
      let name = "Facebook User";
      
      if (usersInfo[uid]) {
        name = usersInfo[uid].name || usersInfo[uid].firstName || "Member";
      }
      
      msg += `${i + 1}. ${name}\nID: ${uid}\n\n`;
    }

    if (members.length > MAX_MEMBERS) {
      msg += `... aur ${members.length - MAX_MEMBERS} aur members hain.`;
    }

    return api.sendMessage(msg, threadID, messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage("Error: Group members ki list nikalne mein nakam raha.", threadID, messageID);
  }
};
