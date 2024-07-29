const fs = require("node:fs/promises");

const util = {};

// Delete a file it it exist;
util.deleteFile = async (path) => {
  try {
    await fs.unlink(path);
  } catch (error) {}
};

// Delete a folder if it exist or do nothing
util.deleteFolder = async (path) => {
  try {
    await fs.rm(path, { recursive: true });
  } catch (error) {
    // do nothing
    console.log(error);
  }
};

module.exports = util;
