import { textLinks } from '@/lib/text-links';

export function LinkedText({ text }: { text: string }) {
  return textLinks(text).map((part, index) => part.href
    ? <a key={index} href={part.href} className="break-words underline decoration-2 underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4">{part.text}</a>
    : part.text);
}
