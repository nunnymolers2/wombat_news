import express from "express";
import cors from "cors";
import Parser from "rss-parser";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import puppeteer from "puppeteer";

const app = express();
const parser = new Parser();

app.use(cors());

// Launch once on startup, reuse for all requests
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
});

function normalizeFeedUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return url;
  }

  if (u.hostname.endsWith(".substack.com")) {
    u.pathname = "/feed";
    return u.toString();
  }

  if (u.hostname === "medium.com" && !u.pathname.startsWith("/feed")) {
    u.pathname = "/feed" + u.pathname;
    return u.toString();
  }

  return url;
}

app.get("/feed", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });

  const normalized = normalizeFeedUrl(url);

  try {
    const feed = await parser.parseURL(normalized);
    const articles = feed.items.map((item) => ({
      title: item.title,
      url: item.link,
      date: item.pubDate,
      excerpt: item.contentSnippet,
    }));
    res.json({ title: feed.title, articles, resolvedUrl: normalized });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/extract", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });

  // Fast path — plain fetch + Readability
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();

    if (article) {
      return res.json({
        title: article.title,
        byline: article.byline,
        content: article.content,
        excerpt: article.excerpt,
      });
    }
  } catch {
    // fall through to Puppeteer
  }

  // Slow path — reuse the shared browser instance
  let page;
  try {
    page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["stylesheet", "font", "media"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.5",
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Wait for something that looks like article body content
    await page
      .waitForSelector(
        "article, main, [class*='content'], [class*='article'], p",
        {
          timeout: 5000,
        },
      )
      .catch(() => {}); // if it times out just proceed anyway

    const html = await page.content();

    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();

    if (!article)
      return res.status(422).json({ error: "Could not extract article" });

    res.json({
      title: article.title,
      byline: article.byline,
      content: article.content,
      excerpt: article.excerpt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (page) await page.close(); // close the tab, not the browser
  }
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
