import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SkillNode {
  id: number;
  label: string;
  isAnchor: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface PhotonPulse {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

const COMPETENCY_SPEC: Array<{ label: string; isAnchor: boolean }> = [
  { label: 'DSA', isAnchor: true },
  { label: 'AI & ML', isAnchor: true },
  { label: 'SQL', isAnchor: true },
  { label: 'Cloud', isAnchor: true },
  { label: 'System Design', isAnchor: true },
  { label: 'Coding', isAnchor: true },
  { label: 'OOD', isAnchor: false },
  { label: 'SWE', isAnchor: false },
  { label: 'OS', isAnchor: false },
  { label: 'Networking', isAnchor: false },
  { label: 'Aptitude', isAnchor: false },
  { label: 'Communication', isAnchor: false },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const TalentNetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme, reducedMotion } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shouldReduceMotion = reducedMotion || mediaQuery.matches;

    let animationFrameId: number | null = null;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let isMobile = width < 768;
    let connectionThreshold = isMobile ? 165 : 240;

    // 1. Initialize Skill Nodes (12 domain competencies + subtle relay nodes on larger viewports)
    const relayCount = isMobile ? 2 : 6;
    const totalNodes = COMPETENCY_SPEC.length + relayCount;

    const nodes: SkillNode[] = Array.from({ length: totalNodes }, (_, idx) => {
      const spec = COMPETENCY_SPEC[idx];
      const isAnchor = spec ? spec.isAnchor : false;
      const label = spec ? spec.label : '';

      // Distribute nodes evenly across the canvas with slight bias toward right/center so hero text stays crisp
      const colCount = isMobile ? 3 : 4;
      const rowCount = Math.ceil(totalNodes / colCount);
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);

      const cellW = (width - 80) / colCount;
      const cellH = (height - 80) / rowCount;
      const x = 40 + col * cellW + Math.random() * Math.max(cellW - 20, 20);
      const y = 40 + row * cellH + Math.random() * Math.max(cellH - 20, 20);

      const baseVx = (Math.random() - 0.5) * 0.42;
      const baseVy = (Math.random() - 0.5) * 0.42;

      return {
        id: idx,
        label,
        isAnchor,
        x: Math.max(32, Math.min(width - 64, x)),
        y: Math.max(32, Math.min(height - 32, y)),
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        radius: isAnchor ? 4.8 : spec ? 3.3 : 2.4,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.025 + Math.random() * 0.015,
      };
    });

    // Helper to pick a connected neighbor within threshold
    const findConnectedNeighbor = (sourceIdx: number): number => {
      const s = nodes[sourceIdx];
      const candidates: number[] = [];
      let closestIdx = (sourceIdx + 1) % nodes.length;
      let closestDist = Infinity;

      for (let i = 0; i < nodes.length; i++) {
        if (i === sourceIdx) continue;
        const dx = nodes[i].x - s.x;
        const dy = nodes[i].y - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist < connectionThreshold) {
          candidates.push(i);
        }
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
      return closestIdx;
    };

    // 3. Initialize 6-10 Traveling Data Pulses / Photons
    const photonCount = isMobile ? 6 : 9;
    const photons: PhotonPulse[] = Array.from({ length: photonCount }, (_, idx) => {
      const fromIdx = idx % nodes.length;
      const toIdx = findConnectedNeighbor(fromIdx);
      return {
        fromIdx,
        toIdx,
        progress: Math.random(),
        speed: 0.007 + Math.random() * 0.007,
      };
    });

    // 4. Initialize 30-40 Ambient Floating Dust Particles
    const dustCount = isMobile ? 18 : 36;
    const dustParticles: DustParticle[] = Array.from({ length: dustCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18 - 0.05,
      radius: 1 + Math.random() * 1,
      alpha: 0.1 + Math.random() * 0.2,
    }));

    // 5. Cursor Tracking State
    const mouse = { x: -9999, y: -9999, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      if (localX >= 0 && localX <= rect.width && localY >= 0 && localY <= rect.height) {
        mouse.x = localX;
        mouse.y = localY;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        const nextWidth = canvas.parentElement?.clientWidth || window.innerWidth;
        const nextHeight = canvas.parentElement?.clientHeight || window.innerHeight;
        const scaleX = nextWidth / Math.max(width, 1);
        const scaleY = nextHeight / Math.max(height, 1);

        width = canvas.width = nextWidth;
        height = canvas.height = nextHeight;
        isMobile = width < 768;
        connectionThreshold = isMobile ? 165 : 240;

        for (let i = 0; i < nodes.length; i++) {
          nodes[i].x = Math.max(24, Math.min(width - 48, nodes[i].x * scaleX));
          nodes[i].y = Math.max(24, Math.min(height - 24, nodes[i].y * scaleY));
        }
        for (let i = 0; i < dustParticles.length; i++) {
          dustParticles[i].x = (dustParticles[i].x * scaleX) % width;
          dustParticles[i].y = (dustParticles[i].y * scaleY) % height;
        }

        if (shouldReduceMotion) {
          renderFrame();
        }
      }, 60);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = resolvedTheme === 'dark';

      // 5A. Cursor Radial Spotlight (rgba(99, 102, 241, 0.12) fading to 0 over 140px)
      if (mouse.active && !shouldReduceMotion) {
        const spotlight = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 140);
        spotlight.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.09)');
        spotlight.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = spotlight;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 140, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render Ambient Floating Dust Particles
      for (let i = 0; i < dustParticles.length; i++) {
        const p = dustParticles[i];
        if (!shouldReduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(199, 210, 254, ${p.alpha})`
          : `rgba(99, 102, 241, ${p.alpha * 0.85})`;
        ctx.fill();
      }

      // Update Node Physics & Cursor Repulsion
      if (!shouldReduceMotion) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.pulsePhase += n.pulseSpeed;

          // 5B. Physics Repulsion within 160px of cursor
          if (mouse.active) {
            const dx = n.x - mouse.x;
            const dy = n.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            const repulsionRadius = 160;

            if (dist > 0.1 && dist < repulsionRadius) {
              const force = ((repulsionRadius - dist) / repulsionRadius) * 0.085;
              n.vx += (dx / dist) * force;
              n.vy += (dy / dist) * force;
            }
          }

          // Smoothly damp velocity back toward natural base trajectory
          n.vx = lerp(n.vx, n.baseVx, 0.03);
          n.vy = lerp(n.vy, n.baseVy, 0.03);

          n.x += n.vx;
          n.y += n.vy;

          const padX = 36;
          const padY = 28;
          if (n.x < padX) {
            n.x = padX;
            n.vx = Math.abs(n.vx);
            n.baseVx = Math.abs(n.baseVx);
          } else if (n.x > width - padX * 2.2) {
            n.x = width - padX * 2.2;
            n.vx = -Math.abs(n.vx);
            n.baseVx = -Math.abs(n.baseVx);
          }

          if (n.y < padY) {
            n.y = padY;
            n.vy = Math.abs(n.vy);
            n.baseVy = Math.abs(n.baseVy);
          } else if (n.y > height - padY) {
            n.y = height - padY;
            n.vy = -Math.abs(n.vy);
            n.baseVy = -Math.abs(n.baseVy);
          }
        }
      }

      // 2. Interconnected Talent Network (Proximity Graph Edges)
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionThreshold) {
            const proximityRatio = 1 - dist / connectionThreshold;
            const alpha = proximityRatio * (isDark ? 0.28 : 0.2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha.toFixed(3)})`;
            ctx.stroke();
          }
        }
      }

      // 3. Traveling Data Pulses / Photons along active edges
      if (!shouldReduceMotion) {
        ctx.save();
        for (let i = 0; i < photons.length; i++) {
          const photon = photons[i];
          const fromNode = nodes[photon.fromIdx];
          const toNode = nodes[photon.toIdx];

          const edgeDist = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y);
          // Only render photon if edge is reasonably close; otherwise hop immediately
          if (edgeDist > connectionThreshold * 1.25) {
            photon.toIdx = findConnectedNeighbor(photon.fromIdx);
            photon.progress = 0;
            continue;
          }

          photon.progress += photon.speed;
          if (photon.progress >= 1) {
            photon.fromIdx = photon.toIdx;
            photon.toIdx = findConnectedNeighbor(photon.fromIdx);
            photon.progress = 0;
            continue;
          }

          const px = lerp(fromNode.x, toNode.x, photon.progress);
          const py = lerp(fromNode.y, toNode.y, photon.progress);

          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF8';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#38BDF8';
          ctx.fill();
        }
        ctx.restore();
      }

      // 1. Render Skill Nodes, Sinusoidal Anchor Halos & Monospaced Labels
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Anchor Node Pulsing Concentric Halo Ring
        if (n.isAnchor) {
          const wave = (Math.sin(n.pulsePhase) + 1) * 0.5; // 0 -> 1
          const haloRadius = n.radius + 4 + wave * 8;
          const haloAlpha = (1 - wave * 0.65) * (isDark ? 0.38 : 0.28);

          ctx.beginPath();
          ctx.arc(n.x, n.y, haloRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(129, 140, 248, ${haloAlpha.toFixed(3)})`;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }

        // Core Node Dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        if (n.isAnchor) {
          ctx.fillStyle = isDark ? '#818CF8' : '#6366F1';
        } else {
          ctx.fillStyle = isDark ? '#22D3EE' : '#0891B2';
        }
        ctx.fill();

        // Monospaced Competency Label
        if (n.label) {
          ctx.fillStyle = isDark
            ? 'rgba(199, 210, 254, 0.7)'
            : 'rgba(51, 65, 85, 0.78)';
          ctx.fillText(n.label, n.x + n.radius + 6, n.y + 0.5);
        }
      }

      if (!shouldReduceMotion) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [resolvedTheme, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-0"
      aria-hidden="true"
    />
  );
};
