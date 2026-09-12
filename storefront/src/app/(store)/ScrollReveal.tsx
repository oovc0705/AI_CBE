'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

type AnimationDirection = 
  | 'up'           // 从下方滑入
  | 'down'         // 从上方滑入
  | 'left'         // 从左侧滑入
  | 'right'        // 从右侧滑入
  | 'fade'         // 淡入
  | 'scale'        // 缩放进入
  | 'bounce'       // 弹跳进入
  | 'flip'         // 翻转进入
  | 'rotate'       // 旋转进入
  | 'zoom-left'    // 从左缩放
  | 'zoom-right';  // 从右缩放

interface ScrollRevealProps {
  children: ReactNode;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Animation direction/preset */
  direction?: AnimationDirection;
  /** Animation duration (ms) */
  duration?: number;
  /** Whether to animate only once (default: false - animate in/out continuously) */
  once?: boolean;
  /** Animation easing curve */
  easing?: 'smooth' | 'bounce' | 'elastic';
  className?: string;
}

interface TransformState {
  opacity: number;
  transform: string;
}

/**
 * ScrollReveal — Enhanced IntersectionObserver-driven scroll animation.
 * Elements fade/slide in when they enter the viewport and fade/slide out when leaving.
 * Supports 11+ animation presets for engaging scroll experiences.
 * Uses GPU-accelerated transforms for smooth 60fps performance.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 700,
  once = false,
  easing = 'smooth',
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(([entry]: IntersectionObserverEntry[]) => {
    setVisible(entry.isIntersecting);
    
    // If once mode and element is visible, stop observing
    if (once && entry.isIntersecting && ref.current && observerRef.current) {
      observerRef.current.unobserve(ref.current);
    }
  }, [once]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      handleIntersection,
      { 
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '0px 0px -60px 0px'
      }
    );

    observerRef.current.observe(el);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection]);

  // Get easing curve
  const getEasing = () => {
    switch (easing) {
      case 'bounce':
        return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      case 'elastic':
        return 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      case 'smooth':
      default:
        return 'cubic-bezier(0.4, 0, 0.2, 1)';
    }
  };

  // Get transform state based on direction
  const getTransformState = (): TransformState => {
    const hiddenStates: Record<AnimationDirection, TransformState> = {
      'up': { opacity: 0, transform: 'translateY(40px) translateX(0) scale(0.98) rotate(0deg)' },
      'down': { opacity: 0, transform: 'translateY(-40px) translateX(0) scale(0.98) rotate(0deg)' },
      'left': { opacity: 0, transform: 'translateY(0) translateX(-40px) scale(0.98) rotate(0deg)' },
      'right': { opacity: 0, transform: 'translateY(0) translateX(40px) scale(0.98) rotate(0deg)' },
      'fade': { opacity: 0, transform: 'translateY(0) translateX(0) scale(0.98) rotate(0deg)' },
      'scale': { opacity: 0, transform: 'translateY(0) translateX(0) scale(0.8) rotate(0deg)' },
      'bounce': { opacity: 0, transform: 'translateY(60px) translateX(0) scale(0.9) rotate(0deg)' },
      'flip': { opacity: 0, transform: 'translateY(0) translateX(0) scale(1) rotateY(-90deg)' },
      'rotate': { opacity: 0, transform: 'translateY(0) translateX(0) scale(0.95) rotate(-10deg)' },
      'zoom-left': { opacity: 0, transform: 'translateY(0) translateX(-20px) scale(0.85) rotate(0deg)' },
      'zoom-right': { opacity: 0, transform: 'translateY(0) translateX(20px) scale(0.85) rotate(0deg)' },
    };

    const visibleState: TransformState = {
      opacity: 1,
      transform: 'translateY(0) translateX(0) scale(1) rotate(0deg)',
    };

    return visible ? visibleState : (hiddenStates[direction] || hiddenStates['up']);
  };

  const state = getTransformState();
  const durationSec = duration / 1000;
  const delaySec = delay / 1000;
  const easingCurve = getEasing();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: state.opacity,
        transform: state.transform,
        transition: `opacity ${durationSec}s ${easingCurve} ${delaySec}s, transform ${durationSec}s ${easingCurve} ${delaySec}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
