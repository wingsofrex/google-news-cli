#!/usr/bin/env node

const https = require("https");
const { parseStringPromise } = require("xml2js");
const chalk = require("chalk");

// ─── Google News RSS Category Map ────────────────────────────────────────────
const CATEGORIES = {
  top: { label: "Top Stories", path: "/rss" },
  world: {
    label: "World",
    path: "/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB",
  },
  nation: {
    label: "Nation",
    path: "/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNRGxqTjNjU0FtVnVLQUFQAQ",
  },
  business: {
    label: "Business",
    path: "/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB",
  },
  technology: {
    label: "Technology",
    path: "/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
  },
  entertainment: {
    label: "Entertainment",
    path: "/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB",
  },
  sports: {
    label: "Sports",
    path: "/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB",
  },
  science: {
    label: "Science",
    path: "/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB",
  },
  health: {
    label: "Health",
    path: "/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch content from a URL via HTTPS.
 * @param {string} url
 * @returns {Promise<string>}
 */
function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "GoogleNewsCLI/1.0" } }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Format a date string into a human-readable relative time.
 */
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Truncate a string to maxLen characters, appending "…" if truncated.
 */
function truncate(str, maxLen = 100) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * Fetch and parse Google News RSS for the given category.
 * @param {string} category - Key from CATEGORIES
 * @param {number} count - Number of articles to display
 * @returns {Promise<void>}
 */
async function fetchNews(category, count) {
  const cat = CATEGORIES[category];
  if (!cat) {
    console.error(chalk.red(`Unknown category: "${category}"`));
    console.log(
      chalk.yellow("Available categories:"),
      Object.keys(CATEGORIES).join(", ")
    );
    process.exit(1);
  }

  const url = `https://news.google.com${cat.path}?hl=en-US&gl=US&ceid=US:en`;

  const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let frame = 0;
  const interval = setInterval(() => {
    process.stdout.write(
      `\r${chalk.cyan(spinner[frame++ % spinner.length])} Fetching ${cat.label}...`
    );
  }, 80);

  try {
    const xml = await fetch(url);
    clearInterval(interval);
    process.stdout.write("\r" + " ".repeat(50) + "\r"); // clear spinner line

    const result = await parseStringPromise(xml, { explicitArray: false });
    const channel = result.rss.channel;
    let items = channel.item;

    if (!items) {
      console.log(chalk.yellow("No articles found."));
      return;
    }

    // Ensure items is always an array
    if (!Array.isArray(items)) items = [items];

    // Limit to requested count
    items = items.slice(0, count);

    // ─── Header ────────────────────────────────────────────────────────
    const headerLine = "─".repeat(60);
    console.log(chalk.cyan(headerLine));
    console.log(
      chalk.bold.cyan("  📰 Google News"),
      chalk.dim("—"),
      chalk.bold.white(cat.label)
    );
    console.log(
      chalk.dim(`  ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`)
    );
    console.log(chalk.cyan(headerLine));
    console.log();

    // ─── Articles ──────────────────────────────────────────────────────
    items.forEach((item, i) => {
      const num = chalk.bold.cyan(`  ${String(i + 1).padStart(2)}.`);
      const title = chalk.bold.white(item.title || "Untitled");
      const source = item.source && item.source._ ? item.source._ : "";
      const pubDate = item.pubDate ? timeAgo(item.pubDate) : "";
      const link = item.link || "";

      // Extract description text (Google News wraps related articles in HTML)
      let desc = "";
      if (item.description) {
        desc = stripHtml(item.description);
        desc = truncate(desc, 120);
      }

      console.log(`${num} ${title}`);
      if (source || pubDate) {
        const parts = [];
        if (source) parts.push(chalk.yellow(source));
        if (pubDate) parts.push(chalk.dim(pubDate));
        console.log(`      ${parts.join(chalk.dim("  •  "))}`);
      }
      if (desc) {
        console.log(`      ${chalk.dim(desc)}`);
      }
      console.log(`      ${chalk.blue.underline(link)}`);
      console.log();
    });

    // ─── Footer ────────────────────────────────────────────────────────
    console.log(chalk.dim(`  Showing ${items.length} of ${Array.isArray(channel.item) ? channel.item.length : 1} articles`));
    console.log(chalk.cyan(headerLine));
  } catch (err) {
    clearInterval(interval);
    process.stdout.write("\r" + " ".repeat(50) + "\r");
    console.error(chalk.red(`\n  ✖ Error fetching news: ${err.message}`));
    process.exit(1);
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
${chalk.bold.cyan("📰 Google News CLI")}

${chalk.bold("Usage:")}
  ${chalk.green("node index.js")} ${chalk.yellow("[category]")} ${chalk.dim("[options]")}

${chalk.bold("Categories:")}
  ${Object.entries(CATEGORIES)
    .map(([key, val]) => `${chalk.yellow(key.padEnd(15))} ${chalk.dim(val.label)}`)
    .join("\n  ")}

${chalk.bold("Options:")}
  ${chalk.yellow("-n, --count <N>")}    Number of articles to show (default: 10)
  ${chalk.yellow("-l, --list")}          List available categories
  ${chalk.yellow("-h, --help")}          Show this help message

${chalk.bold("Examples:")}
  ${chalk.dim("$")} node index.js                  ${chalk.dim("# Top stories")}
  ${chalk.dim("$")} node index.js technology        ${chalk.dim("# Tech news")}
  ${chalk.dim("$")} node index.js sports -n 5       ${chalk.dim("# 5 sports headlines")}
  ${chalk.dim("$")} node index.js world --count 20  ${chalk.dim("# 20 world news articles")}
`);
}

function main() {
  const args = process.argv.slice(2);
  let category = "top";
  let count = 10;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      showHelp();
      return;
    }
    if (arg === "-l" || arg === "--list") {
      console.log(chalk.bold.cyan("\n  Available categories:\n"));
      Object.entries(CATEGORIES).forEach(([key, val]) => {
        console.log(`    ${chalk.yellow(key.padEnd(15))} ${chalk.dim(val.label)}`);
      });
      console.log();
      return;
    }
    if (arg === "-n" || arg === "--count") {
      const next = args[++i];
      count = parseInt(next, 10);
      if (isNaN(count) || count < 1) {
        console.error(chalk.red("Invalid count. Must be a positive integer."));
        process.exit(1);
      }
      continue;
    }

    // Treat as category if it's not a flag
    if (!arg.startsWith("-")) {
      category = arg.toLowerCase();
    }
  }

  fetchNews(category, count);
}

main();
