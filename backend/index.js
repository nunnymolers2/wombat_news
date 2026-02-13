import express from "express";
import cors from "cors";
import Parser from "rss-parser";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import puppeteer from "puppeteer-core";
import "dotenv/config";

const app = express();
const parser = new Parser();

app.use(cors());

const BROWSERLESS_ENDPOINT = `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`;

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
    // fall through to Browserless
  }

  // Slow path — connect to Browserless for this request
  let browser;
  let page;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: BROWSERLESS_ENDPOINT,
    });
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
      "Accept-Language": "en-US,en;q=0.5",
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    await page
      .waitForSelector(
        "article, main, [class*='content'], [class*='article'], p",
        { timeout: 5000 },
      )
      .catch(() => {});

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
    if (page) await page.close();
    if (browser) await browser.disconnect();
  }
});

app.get("/detect", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // 1. Look for RSS/Atom link tags in the <head>
    const feedLink = document.querySelector(
      'link[type="application/rss+xml"], link[type="application/atom+xml"]',
    );
    if (feedLink) {
      const feedUrl = new URL(feedLink.getAttribute("href"), url).toString();
      return res.json({ mode: "rss", feedUrl });
    }

    // 2. Try common feed paths as a fallback
    const commonPaths = [
      "/feed",
      "/rss",
      "/feed.xml",
      "/rss.xml",
      "/atom.xml",
      "/index.xml",
    ];
    for (const path of commonPaths) {
      const candidate = new URL(path, url).toString();
      try {
        const r = await fetch(candidate, { method: "HEAD" });
        const contentType = r.headers.get("content-type") || "";
        if (
          r.ok &&
          (contentType.includes("xml") || contentType.includes("rss"))
        ) {
          return res.json({ mode: "rss", feedUrl: candidate });
        }
      } catch {
        continue;
      }
    }

    // 3. Scrape mode — extract article links from homepage
    const links = [...document.querySelectorAll("a[href]")]
      .map((a) => {
        try {
          return new URL(a.getAttribute("href"), url).toString();
        } catch {
          return null;
        }
      })
      .filter((href) => {
        if (!href) return false;
        const u = new URL(href);
        if (u.hostname !== new URL(url).hostname) return false;
        const path = u.pathname;
        if (path === "/" || path === "") return false;
        if (/\.(css|js|png|jpg|svg|ico|xml)$/i.test(path)) return false;
        if (/^\/(tag|category|author|page|search|about|contact)/i.test(path))
          return false;
        return true;
      });

    const uniqueLinks = [...new Set(links)];

    const articles = await Promise.allSettled(
      uniqueLinks.slice(0, 20).map(async (articleUrl) => {
        const r = await fetch(articleUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        const html = await r.text();
        const dom = new JSDOM(html, { url: articleUrl });
        const title =
          dom.window.document.querySelector("h1")?.textContent?.trim() ||
          dom.window.document.title ||
          articleUrl;
        return { title, url: articleUrl };
      }),
    );

    return res.json({
      mode: "scrape",
      articles: articles
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
