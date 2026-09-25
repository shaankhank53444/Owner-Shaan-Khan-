const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit2",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "AI Image Editor",
  commandCategory: "image",
  usages: "edit [reply to image] <prompt>",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  let imageUrl = null;

  try {
    // ==========================================
    // IMAGE FROM REPLIED MESSAGE
    // ==========================================
    if (
      event.messageReply &&
      Array.isArray(event.messageReply.attachments) &&
      event.messageReply.attachments.length > 0
    ) {
      const attachment = event.messageReply.attachments.find(
        item =>
          item &&
          (
            item.type === "photo" ||
            item.type === "image"
          )
      );

      if (attachment) {
        imageUrl =
          attachment.url ||
          attachment.image_data?.url ||
          attachment.large_preview_url ||
          null;
      }
    }

    // ==========================================
    // IMAGE FROM CURRENT MESSAGE
    // ==========================================
    if (
      !imageUrl &&
      Array.isArray(event.attachments) &&
      event.attachments.length > 0
    ) {
      const attachment = event.attachments.find(
        item =>
          item &&
          (
            item.type === "photo" ||
            item.type === "image"
          )
      );

      if (attachment) {
        imageUrl =
          attachment.url ||
          attachment.image_data?.url ||
          attachment.large_preview_url ||
          null;
      }
    }

    // ==========================================
    // NO IMAGE
    // ==========================================
    if (!imageUrl) {
      return api.sendMessage(
        "❌ Please reply to an image.\n\n" +
        "Example:\n" +
        "edit make the background beautiful",
        threadID,
        messageID
      );
    }

    // ==========================================
    // PROMPT
    // ==========================================
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage(
        "❌ Please enter an editing prompt.\n\n" +
        "Example:\n" +
        "edit make the background beautiful",
        threadID,
        messageID
      );
    }

    // ==========================================
    // CACHE DIRECTORY
    // ==========================================
    const cacheDir = path.join(__dirname, "cache");

    await fs.ensureDir(cacheDir);

    const uniqueID = `${Date.now()}_${Math.floor(
      Math.random() * 999999
    )}`;

    const inputPath = path.join(
      cacheDir,
      `edit_input_${uniqueID}.jpg`
    );

    const outputPath = path.join(
      cacheDir,
      `edit_output_${uniqueID}.jpg`
    );

    // ==========================================
    // WAIT MESSAGE
    // ==========================================
    await api.sendMessage(
      "⏳ Please wait...",
      threadID,
      messageID
    );

    // ==========================================
    // DOWNLOAD ORIGINAL IMAGE
    // ==========================================
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (
      !imageResponse.data ||
      imageResponse.data.length === 0
    ) {
      throw new Error("Original image download failed.");
    }

    await fs.writeFile(inputPath, imageResponse.data);

    // ==========================================
    // CREATE FORM DATA
    // ==========================================
    const form = new FormData();

    form.append(
      "image",
      fs.createReadStream(inputPath),
      {
        filename: "image.jpg",
        contentType: "image/jpeg"
      }
    );

    form.append("prompt", prompt);
    form.append("resolution", "2K");
    form.append("ratio", "match_input_image");

    // ==========================================
    // SEND TO AI EDIT API
    // ==========================================
    const apiResponse = await axios.post(
      "https://xrahat-image-edit.vercel.app/api/edit",
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        timeout: 180000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const data = apiResponse.data || {};

    // ==========================================
    // CHECK API RESPONSE
    // ==========================================
    if (!data.success) {
      throw new Error(
        data.error ||
        data.message ||
        "AI image editing failed."
      );
    }

    const generatedImageUrl =
      data.imageUrl ||
      data.image_url ||
      data.url ||
      data.result?.imageUrl ||
      data.result?.url;

    if (!generatedImageUrl) {
      console.log("API RESPONSE:", data);

      throw new Error(
        "API did not return a generated image."
      );
    }

    // ==========================================
    // DOWNLOAD GENERATED IMAGE
    // ==========================================
    const outputResponse = await axios.get(
      generatedImageUrl,
      {
        responseType: "arraybuffer",
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (
      !outputResponse.data ||
      outputResponse.data.length === 0
    ) {
      throw new Error(
        "Generated image download failed."
      );
    }

    await fs.writeFile(
      outputPath,
      outputResponse.data
    );

    // ==========================================
    // CHECK FILE
    // ==========================================
    if (!(await fs.pathExists(outputPath))) {
      throw new Error(
        "Edited image file was not created."
      );
    }

    // ==========================================
    // SEND EDITED IMAGE
    // ==========================================
    await api.sendMessage(
      {
        body:
          "" +
          `` +
          "",
        attachment: fs.createReadStream(outputPath)
      },
      threadID,
      messageID
    );

    // ==========================================
    // CLEANUP
    // ==========================================
    setTimeout(async () => {
      try {
        if (await fs.pathExists(inputPath)) {
          await fs.remove(inputPath);
        }

        if (await fs.pathExists(outputPath)) {
          await fs.remove(outputPath);
        }
      } catch (cleanupError) {
        console.error(
          "Cleanup error:",
          cleanupError.message
        );
      }
    }, 10000);

  } catch (error) {
    console.error(
      "================================="
    );
    console.error("EDIT COMMAND ERROR:");
    console.error(error);
    console.error(
      "================================="
    );

    let errorMessage =
      "❌ Image edit failed.";

    // ==========================================
    // API ERROR
    // ==========================================
    if (error.response) {
      const responseData =
        error.response.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        errorMessage +=
          "\n\n" +
          (
            responseData.error ||
            responseData.message ||
            `API Error: ${error.response.status}`
          );
      } else {
        errorMessage +=
          `\n\nAPI Error: ${error.response.status}`;
      }
    }

    // ==========================================
    // NORMAL ERROR
    // ==========================================
    else if (error.message) {
      errorMessage +=
        "\n\n" + error.message;
    }

    return api.sendMessage(
      errorMessage,
      threadID,
      messageID
    );
  }
};