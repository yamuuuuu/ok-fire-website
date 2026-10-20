export type TextLinkPart = { text: string; href?: string };

/** Keep stored text intact; only explicit HTTP(S) addresses become links. */
export function textLinks(text: string): TextLinkPart[] {
  const parts: TextLinkPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`]+/gi)) {
    let candidate = match[0].replace(/[.,!?;:。！？、]+$/u, '');
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      while (candidate.endsWith(close) && candidate.split(close).length > candidate.split(open).length) {
        candidate = candidate.slice(0, -1);
      }
    }
    try {
      const url = new URL(candidate);
      if (!url.hostname || url.username || url.password) continue;
      const start = match.index!;
      parts.push({ text: text.slice(cursor, start) });
      parts.push({ text: candidate, href: url.href });
      cursor = start + candidate.length;
    } catch {
      // Invalid addresses remain ordinary text.
    }
  }
  parts.push({ text: text.slice(cursor) });
  return parts;
}
