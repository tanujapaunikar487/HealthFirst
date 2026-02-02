/**
 * Share utility using Web Share API with clipboard fallback.
 */

export async function shareContent(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<{ method: 'share' | 'clipboard' }> {
  // Try native Web Share API first (mobile, some desktop browsers)
  if (navigator.share) {
    try {
      await navigator.share(data);
      return { method: 'share' };
    } catch (err) {
      // User cancelled or API failed — fall through to clipboard
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err; // User deliberately cancelled, don't fallback
      }
    }
  }

  // Fallback: copy text to clipboard
  const clipboardText = [data.title, data.text, data.url].filter(Boolean).join('\n');
  await navigator.clipboard.writeText(clipboardText);
  return { method: 'clipboard' };
}
