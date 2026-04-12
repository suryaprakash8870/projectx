import toast from 'react-hot-toast';

/**
 * Copy text to clipboard with a fallback for environments where
 * navigator.clipboard is unavailable (e.g. non-secure contexts, older browsers).
 * Shows a toast on success or failure.
 */
export async function copyToClipboard(text: string, successMessage = 'Copied!') {
  if (!text) {
    toast.error('Nothing to copy');
    return false;
  }

  // Modern API
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    } catch {
      // fall through to legacy
    }
  }

  // Legacy fallback using a temporary textarea + execCommand
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) {
      toast.success(successMessage);
      return true;
    }
  } catch {
    /* ignore */
  }

  toast.error('Could not copy — please copy manually');
  return false;
}
