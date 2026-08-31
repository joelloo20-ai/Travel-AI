import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;
const MAX_PULL = 110;

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void> | void; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pulling = useRef(false);
  const startY = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0 && !refreshing) {
        pulling.current = true;
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      e.preventDefault();
      setPull(Math.min(delta * 0.5, MAX_PULL));
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pull >= THRESHOLD) {
        setRefreshing(true);
        await controls.start({ height: 56 });
        await onRefresh();
        setRefreshing(false);
      }
      setPull(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pull, refreshing]);

  const indicatorHeight = refreshing ? 56 : pull;
  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div ref={containerRef} className="h-[calc(100svh-65px)] overflow-y-auto overscroll-contain">
      <motion.div
        animate={controls}
        style={{ height: indicatorHeight }}
        className="flex items-center justify-center overflow-hidden text-coral-500"
      >
        <RefreshCw
          size={20}
          className={refreshing ? "animate-spin" : ""}
          style={!refreshing ? { transform: `rotate(${progress * 360}deg)`, opacity: progress } : undefined}
        />
      </motion.div>
      {children}
    </div>
  );
}
