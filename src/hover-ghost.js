// A browser-native hover treatment inspired by the Figma chrome/refraction layers.
// The original Figma shader sources remain in lib/custom-effects.
export function initHoverGhosts() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.innerHTML = '<defs><filter id="hover-ghost-refraction" x="-15%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed="6" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
  document.body.append(svg);

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const selectors = [
    '[data-node-id="919:872"] p',
    '[data-node-id="919:892"] p',
    '[data-node-id="919:1338"] p',
    '[data-node-id="919:966"] p',
  ];
  for (const text of document.querySelectorAll(selectors.join(','))) {
    if (text.classList.contains('ghost-title')) continue;
    const words = text.innerText.trim();
    text.classList.add('ghost-title');
    // aria-hidden prevents decorative copies from being read as duplicate text.
    for (const type of ['chrome', 'trail']) {
      const layer = document.createElement('span');
      layer.className = 'ghost-layer ghost-layer--' + type;
      layer.setAttribute('aria-hidden', 'true');
      layer.textContent = words;
      text.append(layer);
    }
    let pending = 0;
    let latest;
    const reset = () => {
      cancelAnimationFrame(pending);
      pending = 0;
      text.classList.remove('is-ghost-hover');
      text.style.removeProperty('--ghost-x');
      text.style.removeProperty('--ghost-y');
    };
    text.addEventListener('pointerenter', event => {
      if (!finePointer.matches || event.pointerType === 'touch') return;
      text.classList.add('is-ghost-hover');
    });
    text.addEventListener('pointermove', event => {
      if (!text.classList.contains('is-ghost-hover')) return;
      latest = {x: event.clientX, y: event.clientY};
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        const bounds = text.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (latest.x - bounds.left) / bounds.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (latest.y - bounds.top) / bounds.height * 2 - 1));
        text.style.setProperty('--ghost-x', (14 + x * 7) + 'px');
        text.style.setProperty('--ghost-y', (2 + y * 3) + 'px');
      });
    });
    text.addEventListener('pointerleave', reset);
    text.addEventListener('pointercancel', reset);
    finePointer.addEventListener('change', reset);
    window.addEventListener('blur', reset);
    // Scrolling can move the title away from a stationary mouse without a leave event.
    window.addEventListener('scroll', reset, {passive: true});
  }
}
