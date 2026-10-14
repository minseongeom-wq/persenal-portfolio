// Velocity-driven displacement: no permanent parallax offset or layout changes.
export function initScrollTitles() {
  const titles = [...document.querySelectorAll('.ghost-title')];
  for (const heading of document.querySelectorAll('[data-name="Contribution / Heading Lockup"]')) {
    titles.push(...[...heading.querySelectorAll('p')].slice(-2));
  }
  titles.push(...document.querySelectorAll('[data-node-id="924:2236"] p'));
  const unique = [...new Set(titles)];
  unique.forEach(title => title.classList.add('scroll-title'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let previousY = window.scrollY;
  let previousEvent = performance.now();
  let lastEvent = -Infinity;
  let velocity = 0;
  let offset = 0;
  let frame = 0;
  let lastFrame = 0;
  const draw = value => {
    const formatted = value.toFixed(3) + 'px';
    unique.forEach(title => title.style.setProperty('--scroll-title-y', formatted));
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    velocity = offset = 0;
    previousY = window.scrollY;
    previousEvent = performance.now();
    lastEvent = -Infinity;
    draw(0);
  };
  const animate = now => {
    const dt = Math.min(48, Math.max(1, now - lastFrame));
    lastFrame = now;
    const target = now - lastEvent < 80 ? Math.tanh(velocity / 2) * 18 : 0;
    offset += (target - offset) * (1 - Math.exp(-dt / 95));
    if (target === 0 && Math.abs(offset) < .025) {
      draw(0);
      frame = 0;
      return;
    }
    draw(offset);
    frame = requestAnimationFrame(animate);
  };
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const delta = window.scrollY - previousY;
    const dt = Math.max(12, Math.min(100, now - previousEvent));
    previousY = window.scrollY;
    previousEvent = now;
    if (reducedMotion.matches || document.hidden || delta === 0) return;
    // Clamp jumps from anchor navigation; sustained fast scrolling remains bounded.
    velocity = Math.max(-6, Math.min(6, delta / dt));
    lastEvent = now;
    if (!frame) {
      lastFrame = now;
      frame = requestAnimationFrame(animate);
    }
  }, {passive: true});
  reducedMotion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('resize', reset);
}
