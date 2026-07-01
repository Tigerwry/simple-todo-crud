// ============================================================
//  Reusable modal + confirm dialog (component)
//  Handles open/close, backdrop click, Escape key, focus return.
// ============================================================

let activeOverlay = null;

function onKeydown(e) {
  if (e.key === 'Escape') closeModal();
}

export function openModal(overlay) {
  activeOverlay = overlay;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.addEventListener('keydown', onKeydown);
  // Focus the first field for keyboard users.
  const focusable = overlay.querySelector('input, textarea, select, button');
  if (focusable) setTimeout(() => focusable.focus(), 50);
}

export function closeModal() {
  if (!activeOverlay) return;
  activeOverlay.classList.remove('open');
  activeOverlay.setAttribute('aria-hidden', 'true');
  document.removeEventListener('keydown', onKeydown);
  activeOverlay = null;
}

/** Wire an overlay so clicking the backdrop or a [data-close] element closes it. */
export function wireOverlay(overlay) {
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) {
      closeModal();
    }
  });
}

/**
 * Promise-based confirm dialog rendered in the maximalist style.
 * Returns true if confirmed, false otherwise.
 */
export function confirmDialog({ title, message, confirmText = 'Yes, do it', emoji = '⚠️' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="modal modal-sm">
        <div class="confirm-emoji" aria-hidden="true">${emoji}</div>
        <h2 class="modal-title" style="text-align:center">${title}</h2>
        <p class="muted-text">${message}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" data-role="cancel">Cancel</button>
          <button class="btn btn-danger" data-role="confirm">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const cleanup = (result) => {
      document.removeEventListener('keydown', escHandler);
      overlay.remove();
      resolve(result);
    };
    const escHandler = (e) => {
      if (e.key === 'Escape') cleanup(false);
    };
    document.addEventListener('keydown', escHandler);

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) cleanup(false);
    });
    overlay.querySelector('[data-role="cancel"]').addEventListener('click', () => cleanup(false));
    overlay.querySelector('[data-role="confirm"]').addEventListener('click', () => cleanup(true));
    overlay.querySelector('[data-role="confirm"]').focus();
  });
}
