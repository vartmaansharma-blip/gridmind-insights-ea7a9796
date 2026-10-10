#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const ignored = new Set([".git", "node_modules", "dist", ".tanstack", "coverage"]);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(absolute);
  }
}
walk(root);
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const documents = new Map(files.map((file) => [relative(file), fs.readFileSync(file, "utf8")]));
const errors = [];
const anchorCache = new Map();
function stripCode(text) {
  const fence = String.fromCharCode(96).repeat(3);
  return text.replace(new RegExp("^" + fence + "[^\\n]*\\n[\\s\\S]*?^" + fence + "[^\\n]*$", "gm"), "")
    .replace(/^~~~[^\n]*\n[\s\S]*?^~~~[^\n]*$/gm, "");
}
function slugHeading(text) {
  return text.toLowerCase().trim().replace(/<[^>]*>/g, "")
    .replace(/\\/g, "").replace(/[\x60*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-").replace(/-+/g, "-");
}
function anchorsFor(filePath) {
  if (anchorCache.has(filePath)) return anchorCache.get(filePath);
  const anchors = new Set(), counts = new Map();
  for (const line of (documents.get(filePath) || "").split(/\r?\n/)) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const base = slugHeading(heading[1]), count = counts.get(base) || 0;
      counts.set(base, count + 1); anchors.add(count ? base + "-" + count : base);
    }
    for (const match of line.matchAll(/<a\s+(?:[^>]*?\s+)?id=["']([^"']+)["']/gi)) anchors.add(match[1]);
  }
  anchorCache.set(filePath, anchors); return anchors;
}
for (const [source, original] of documents) {
  const text = stripCode(original), linkPattern = /!?\[[^\]]*\]\((<[^>]+>|[^)]+)\)/g;
  for (const match of text.matchAll(linkPattern)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
    target = target.replace(/\s+["'][^"']*["']\s*$/, "").trim();
    if (!target || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) continue;
    const hashIndex = target.indexOf("#");
    const fragment = hashIndex >= 0 ? target.slice(hashIndex + 1) : "";
    const pathPart = (hashIndex >= 0 ? target.slice(0, hashIndex) : target).split("?", 1)[0];
    let destination = source;
    if (pathPart) {
      let decoded; try { decoded = decodeURIComponent(pathPart); } catch { decoded = pathPart; }
      destination = path.posix.normalize(path.posix.join(path.posix.dirname(source), decoded));
      if (destination.startsWith("../")) { errors.push(source + ": local link escapes repository: " + target); continue; }
      if (!documents.has(destination) && !fs.existsSync(path.join(root, destination))) {
        const indexCandidate = path.posix.join(destination, "README.md");
        if (documents.has(indexCandidate)) destination = indexCandidate;
        else { errors.push(source + ": missing local target: " + target); continue; }
      }
    }
    if (fragment && documents.has(destination)) {
      let decodedFragment; try { decodedFragment = decodeURIComponent(fragment); } catch { decodedFragment = fragment; }
      if (!anchorsFor(destination).has(decodedFragment)) errors.push(source + ": missing anchor #" + decodedFragment + " in " + destination);
    }
  }
}
if (errors.length) {
  console.error("Markdown link check failed: " + errors.length + " issue(s) across " + files.length + " Markdown files.");
  for (const error of errors) console.error("- " + error);
  process.exitCode = 1;
} else console.log("Markdown link check passed: scanned " + files.length + " Markdown files; all local file and heading links resolved.");
