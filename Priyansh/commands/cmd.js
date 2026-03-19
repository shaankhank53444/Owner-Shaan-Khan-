module.exports.config = {
    name: "cmd",
    version: "1.0.5",
    hasPermssion: 2,
    credits: "Shaan Khan",
    description: "Manage/Control all bot modules",
    commandCategory: "System",
    usages: "[load/unload/reload/loadAll] [name module]",
    cooldowns: 2,
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

const loadCommand = function ({ moduleList, threadID, messageID }) {
    const { execSync } = global.nodemodule['child_process'];
    const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule['fs-extra'];
    const { join, resolve } = global.nodemodule['path'];
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + '/utils/log');

    var errorList = [];
    var configValue = require(configPath);
    
    for (const nameModule of moduleList) {
        try {
            const dirModule = resolve(__dirname, `${nameModule}.js`);
            
            // 1. Pehle purana cache clear karo
            if (require.cache[require.resolve(dirModule)]) {
                delete require.cache[require.resolve(dirModule)];
            }
            
            // 2. Command ko naye siray se require karo
            const command = require(dirModule);
            
            if (!command.config || !command.run) 
                throw new Error('[ 𝗖𝗠𝗗 ] - Module is missing config or run function!');

            // 3. Purani command ko delete karke nayi set karo
            global.client.commands.delete(command.config.name);
            global.client.commands.set(command.config.name, command);
            
            // 4. Events check karo
            if (command.handleEvent) {
                global.client.eventRegistered = global.client.eventRegistered.filter(i => i != command.config.name);
                global.client.eventRegistered.push(command.config.name);
            }

            logger.loader(`Loaded command ${command.config.name} successfully!`);
        } catch (error) {
            errorList.push(`- ${nameModule}: ${error.message}`);
        }
    }

    if (errorList.length != 0) {
        return api.sendMessage(`[ 𝗖𝗠𝗗 ] » Failed to load some modules:\n${errorList.join('\n')}`, threadID, messageID);
    }

    return api.sendMessage(`[ 𝗖𝗠𝗗 ] » Shaan Bot system ne ${moduleList.length} commands ko successfully reload/load kar diya hai. ✅`, threadID, messageID);
}

const unloadModule = function ({ moduleList, threadID, messageID }) {
    const { api } = global.client;
    for (const nameModule of moduleList) {
        global.client.commands.delete(nameModule);
        global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);
    }
    return api.sendMessage(`[ 𝗖𝗠𝗗 ] » Successfully unloaded ${moduleList.length} commands.`, threadID, messageID);
}

module.exports.run = function ({ event, args, api }) {
    // Apka specific ID check
    if (event.senderID != 100016828397863) return api.sendMessage(`[ 𝗖𝗠𝗗 ] » Access denied! Sirf Shaan Khan hi yeh command chala sakte hain.`, event.threadID, event.messageID);

    const { readdirSync } = global.nodemodule["fs-extra"];
    const { threadID, messageID } = event;
    var moduleList = args.slice(1);

    switch (args[0]?.toLowerCase()) {
        case "load":
        case "reload": {
            if (moduleList.length == 0) return api.sendMessage("[ 𝗖𝗠𝗗 ] » Module name likhna zaroori hai!", threadID, messageID);
            return loadCommand({ moduleList, threadID, messageID });
        }
        case "unload": {
            if (moduleList.length == 0) return api.sendMessage("[ 𝗖𝗠𝗗 ] » Module name likhna zaroori hai!", threadID, messageID);
            return unloadModule({ moduleList, threadID, messageID });
        }
        case "loadall": {
            moduleList = readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes('example'));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return loadCommand({ moduleList, threadID, messageID });
        }
        case "info": {
            const command = global.client.commands.get(moduleList[0]);
            if (!command) return api.sendMessage("[ 𝗖𝗠𝗗 ] » Module nahi mila.", threadID, messageID);
            return api.sendMessage(`Command: ${command.config.name}\nAuthor: ${command.config.credits}\nVersion: ${command.config.version}`, threadID, messageID);
        }
        default: {
            return api.sendMessage("Invalid syntax! Use: load, unload, reload, or loadAll.", threadID, messageID);
        }
    }
}
