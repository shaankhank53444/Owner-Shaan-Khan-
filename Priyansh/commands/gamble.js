module.exports.config = {
  name: 'gamble',
  version: '1.0.0',
  hasPermssion: 0,
  credits: 'SHAAN Khan',
  description: 'Gamble your money with a chance to win or lose',
  commandCategory: 'economy',
  usages: '[amount/all]',
  cooldowns: 30
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    // Get amount from args
    if (args.length === 0) {
      return api.sendMessage(
        '❌ You must specify an amount to gamble.\n' +
        `Usage: ${global.config.PREFIX}gamble [amount/all]`,
        threadID,
        messageID
      );
    }

    // Get user's currency data
    let userCurrency = await global.Currency.findOne({ userID: senderID });
    if (!userCurrency) {
      return api.sendMessage('❌ Your currency data not found.', threadID, messageID);
    }

    // Parse amount
    let amount;
    if (args[0].toLowerCase() === 'all') {
      amount = userCurrency.money;
    } else {
      amount = parseInt(args[0]);
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage('❌ Amount must be a positive number.', threadID, messageID);
    }

    // Check minimum bet
    if (amount < 50) {
      return api.sendMessage('❌ Minimum bet is 50 coins.', threadID, messageID);
    }

    // Check if user has enough money
    if (userCurrency.money < amount) {
      return api.sendMessage(
        `❌ You don't have enough money to gamble ${amount} coins. You only have ${userCurrency.money} coins.`,
        threadID,
        messageID
      );
    }

    // Get user data
    let userName = "User";
    try {
      const userInfo = await api.getUserInfo(senderID);
      if (userInfo && userInfo[senderID]) {
        userName = userInfo[senderID].name;
      }
    } catch (e) {}

    // Check for lucky charm in inventory
    let luckBonus = 0;
    let hasLuckyCharm = false;

    if (userCurrency.inventory && Array.isArray(userCurrency.inventory)) {
      const now = new Date();

      // Check for active lucky charms
      const activeLuckyCharms = userCurrency.inventory.filter(item => 
        item.id === 'luckycharm' && 
        item.expiry && 
        new Date(item.expiry) > now
      );

      // Apply lucky charm effect (10% increase per charm, max 3 charms)
      if (activeLuckyCharms.length > 0) {
        hasLuckyCharm = true;
        const charmCount = Math.min(activeLuckyCharms.length, 3);
        luckBonus = charmCount * 10; // Each charm gives 10% bonus
      }
    }

    // Generate random number between 0 and 100
    const randomNum = Math.floor(Math.random() * 101);

    // Determine win or loss
    let resultMessage = '';

    // Base win probability: 45% + luck bonus from charms
    const winProbability = 45 + luckBonus;
    if (randomNum <= winProbability) {
      // Win - calculate winnings (50% to 150% of bet)
      const winMultiplier = 0.5 + (Math.random() * 1.0); // Between 0.5 and 1.5
      const winnings = Math.floor(amount * winMultiplier);

      // Update user's money
      userCurrency.money += winnings;

      resultMessage = `🎰 𝗚𝗔𝗠𝗕𝗟𝗘 𝗥𝗘𝗦𝗨𝗟𝗧\n\n` +
                      `🎉 Congratulations, @${userName}! You won ${winnings} coins!\n` +
                      `💵 Your new balance: ${userCurrency.money} coins\n\n`;

      // Add lucky charm info if active
      if (hasLuckyCharm) {
        resultMessage += `🍀 Lucky Charm active: +${luckBonus}% win chance\n`;
      }

      resultMessage += `🎲 Roll: ${randomNum}/${winProbability} (needed to win)\n\n` +
                      `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀`;
    } 
    // Loss probability: 55%
    else {
      // Lose - lose the bet amount
      userCurrency.money -= amount;

      resultMessage = `🎰 𝗚𝗔𝗠𝗕𝗟𝗘 𝗥𝗘𝗦𝗨𝗟𝗧\n\n` +
                      `😢 Sorry, @${userName}! You lost ${amount} coins.\n` +
                      `💵 Your new balance: ${userCurrency.money} coins\n\n`;

      // Add lucky charm info if active
      if (hasLuckyCharm) {
        resultMessage += `🍀 Lucky Charm active: +${luckBonus}% win chance\n`;
      }

      resultMessage += `🎲 Roll: ${randomNum}/${winProbability} (needed to win)\n\n` +
                      `»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀`;
    }

    // Save changes
    await userCurrency.save();

    // Send result message
    return api.sendMessage(
      {
        body: resultMessage,
        mentions: [{ tag: `@${userName}`, id: senderID }]
      },
      threadID,
      messageID
    );

  } catch (error) {
    console.error('Error in gamble command:', error);
    return api.sendMessage('❌ An error occurred while processing your request.', threadID, messageID);
  }
};
