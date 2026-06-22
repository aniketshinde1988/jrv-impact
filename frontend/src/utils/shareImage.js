import html2canvas from 'html2canvas';

async function captureToBlob(element) {
  const canvas = await html2canvas(element, { backgroundColor: '#f5f0e8', scale: 2 });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function openWhatsApp(mobile, text) {
  const digits = (mobile || '').replace(/\D/g, '');
  const phone = digits.length === 10 ? `91${digits}` : digits; // assume Indian numbers unless already prefixed
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/**
 * Captures the share card to a PNG and sends it to WhatsApp.
 * On supported mobile browsers, the Web Share API attaches the image directly
 * to the native share sheet (pick WhatsApp there). On desktop / unsupported
 * browsers, it downloads the image and opens a wa.me chat for manual attach.
 */
export async function shareJobSheetToWhatsApp(element, { code, mobile }) {
  const blob = await captureToBlob(element);
  const filename = `${code || 'job-sheet'}.png`;
  const text = `JRV Impact Job Sheet ${code}`;

  if (navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'JRV Impact Job Sheet', text });
        return { method: 'share' };
      } catch (err) {
        if (err?.name === 'AbortError') return { method: 'cancelled' };
        // fall through to manual fallback below
      }
    }
  }

  downloadBlob(blob, filename);
  openWhatsApp(mobile, text);
  return { method: 'manual' };
}
