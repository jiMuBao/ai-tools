#!/usr/bin/env python3
"""
md2adf — Markdown → Atlassian Document Format (ADF) converter.

Reads GitHub-flavoured-ish Markdown from stdin, writes an ADF `doc` JSON to
stdout. Supports the subset used by the cb-jira-ops ticket templates:

  - ATX headings            `#`, `##`, ... `######`
  - Bullet lists            `- item` / `* item`  (consecutive items → one list)
  - Ordered lists           `1. item` (any digits; consecutive → one list)
  - Fenced code blocks      ``` ... ```
  - Inline marks            `**bold**`, `*italic*`, `` `code` ``
  - Paragraphs              consecutive non-blank, non-special lines join

Unsupported markdown (tables, blockquotes, nested lists, images) falls back to
plain paragraphs — intentionally minimal so the templates render cleanly and
predictably. Escapes nothing fancy; keep template text simple.
"""
import json
import re
import sys

# Inline token order matters: code spans first so `**` inside `` `..` `` isn't
# mis-parsed as bold.
_INLINE = re.compile(r"`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*")


def inline_runs(text: str) -> list:
    """Split a line into ADF text runs with code/strong/emphasis marks."""
    runs, pos = [], 0
    for m in _INLINE.finditer(text):
        if m.start() > pos:
            runs.append({"type": "text", "text": text[pos:m.start()]})
        if m.group(1) is not None:  # `code`
            runs.append({"type": "text", "text": m.group(1),
                         "marks": [{"type": "code"}]})
        elif m.group(2) is not None:  # **bold**
            runs.append({"type": "text", "text": m.group(2),
                         "marks": [{"type": "strong"}]})
        else:  # *italic*
            runs.append({"type": "text", "text": m.group(3),
                         "marks": [{"type": "em"}]})
        pos = m.end()
    if pos < len(text):
        runs.append({"type": "text", "text": text[pos:]})
    return runs or [{"type": "text", "text": text}]


def para(text: str) -> dict:
    return {"type": "paragraph", "content": inline_runs(text)}


def convert(md: str) -> dict:
    lines = md.split("\n")
    content = []
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        s = line.strip()

        # Fenced code block — toggle. Buffer lines until the closing fence.
        if s.startswith("```"):
            code_buf = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                code_buf.append(lines[i])
                i += 1
            i += 1  # consume closing fence (or EOF)
            content.append({
                "type": "codeBlock",
                "content": [{"type": "text", "text": "\n".join(code_buf)}],
            })
            continue

        if not s:  # blank line — paragraph separator
            i += 1
            continue

        # Heading: #..######  (ATX only; levels 1–6 map 1:1 to ADF)
        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            content.append({
                "type": "heading",
                "attrs": {"level": len(m.group(1))},
                "content": [{"type": "text", "text": m.group(2).strip()}],
            })
            i += 1
            continue

        # Bullet list: consecutive `- ` / `* ` lines.
        if re.match(r"^[-*]\s+", s):
            items = []
            while i < n and re.match(r"^[-*]\s+", lines[i].strip()):
                items.append({
                    "type": "listItem",
                    "content": [para(re.sub(r"^[-*]\s+", "", lines[i].strip()))],
                })
                i += 1
            content.append({"type": "bulletList", "content": items})
            continue

        # Ordered list: consecutive `\d+. ` lines.
        if re.match(r"^\d+\.\s+", s):
            items = []
            while i < n and re.match(r"^\d+\.\s+", lines[i].strip()):
                items.append({
                    "type": "listItem",
                    "content": [para(re.sub(r"^\d+\.\s+", "", lines[i].strip()))],
                })
                i += 1
            content.append({"type": "orderedList", "attrs": {"order": 1},
                            "content": items})
            continue

        # Paragraph: gather consecutive plain lines until a blank/special line.
        buf = [s]
        i += 1
        while i < n and lines[i].strip() and not re.match(
            r"^(#{1,6}\s|[-*]\s|\d+\.\s|```)", lines[i].strip()
        ):
            buf.append(lines[i].strip())
            i += 1
        content.append(para(" ".join(buf)))

    return {"type": "doc", "version": 1, "content": content}


if __name__ == "__main__":
    sys.stdout.write(json.dumps(convert(sys.stdin.read())))
