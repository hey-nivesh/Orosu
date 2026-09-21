const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer so it's stored inside the project directory which is preserved across Render build & runtime.
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
