import React, { useEffect, useState } from 'react';

/**
 * InteractiveHoverEffects
 * Implements full-site dynamic color hue shifting on mouse hover and movement,
 * unique area-triggered animations, and vibrant text color highlights on hover and click.
 * Seamless across dark/light mode and desktop/tablet/mobile versions.
 */
export const InteractiveHoverEffects: React.FC = () => {
  const [isPointerActive, setIsPointerActive] = useState(false);
  const [activeArea, setActiveArea] = useState<string>('default');

  useEffect(() => {
    let idleTimer: any = null;
    let targetHue = 160; // Starting emerald hue
    let currentHue = 160;
    let animationFrameId: number;

    const root = document.documentElement;

    const handlePointerMove = (e: PointerEvent) => {
      setIsPointerActive(true);
      const x = e.clientX;
      const y = e.clientY;

      // Calculate dynamic vibrant hue based on screen coordinates
      const width = window.innerWidth || 1200;
      const height = window.innerHeight || 800;
      targetHue = Math.round(((x / width) * 260 + (y / height) * 100) % 360);

      // Check which section the cursor is currently over
      const element = document.elementFromPoint(x, y);
      if (element) {
        if (element.closest('header')) {
          setActiveArea('header');
        } else if (element.closest('aside') || element.closest('nav')) {
          setActiveArea('nav');
        } else if (element.closest('table') || element.closest('tbody')) {
          setActiveArea('table');
        } else if (element.closest('.grid') || element.closest('[class*="grid-cols"]')) {
          setActiveArea('grid');
        } else if (element.closest('button') || element.closest('a')) {
          setActiveArea('action');
        } else {
          setActiveArea('content');
        }
      }

      root.style.setProperty('--mouse-x', `${x}px`);
      root.style.setProperty('--mouse-y', `${y}px`);

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsPointerActive(false);
      }, 2500);
    };

    const handlePointerLeave = () => {
      setIsPointerActive(false);
    };

    // Smooth hue animation loop with lerp
    const updateHueLoop = () => {
      currentHue += (targetHue - currentHue) * 0.15;
      const roundedHue = Math.round(currentHue);

      root.style.setProperty('--dynamic-hue', `${roundedHue}`);
      root.style.setProperty('--dynamic-color', `hsl(${roundedHue}, 90%, 50%)`);
      root.style.setProperty('--dynamic-color-vibrant', `hsl(${roundedHue}, 95%, 45%)`);
      root.style.setProperty('--dynamic-glow', `hsla(${roundedHue}, 90%, 55%, 0.14)`);

      animationFrameId = requestAnimationFrame(updateHueLoop);
    };

    // Global click ripple & vibrant text splash handler
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.add('text-color-clicked');
        setTimeout(() => {
          target.classList.remove('text-color-clicked');
        }, 600);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('click', handleClick);
    animationFrameId = requestAnimationFrame(updateHueLoop);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <>
      {/* Ambient Mouse Radial Glow Spotlight */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 ease-out ${
          isPointerActive ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `radial-gradient(550px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--dynamic-glow, hsla(160, 90%, 55%, 0.1)), transparent 75%)`,
        }}
      />

      {/* Floating subtle cursor indicator glow */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed z-50 w-6 h-6 -ml-3 -mt-3 rounded-full border border-white/40 shadow-sm mix-blend-difference transition-transform duration-75 ease-out sm:block hidden ${
          isPointerActive ? 'opacity-80 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{
          left: 'var(--mouse-x, -100px)',
          top: 'var(--mouse-y, -100px)',
          borderColor: 'var(--dynamic-color, #10b981)',
          boxShadow: '0 0 15px var(--dynamic-color, #10b981)',
        }}
      />
    </>
  );
};
