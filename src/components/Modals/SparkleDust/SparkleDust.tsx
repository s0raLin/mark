import { motion } from "motion/react";
import React, { useMemo } from "react";

// 樱花瓣 SVG 路径，比文字更具真实感
const PetalSVG = ({ color }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 0C20 0 35 15 35 25C35 32 30 38 20 38C10 38 5 32 5 25C5 15 20 0 20 0Z"
      fill={color}
    />
    <path
      d="M20 0C22 8 28 12 35 15"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1"
    />
  </svg>
);

export function SparkleDust() {
  const petals = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      xStart: Math.random() * 100, // 初始水平位置 (vw)
      xEnd: Math.random() * 20 - 10, // 下落过程中的水平漂移量
      size: Math.random() * 15 + 10, // 随机大小
      duration: Math.random() * 6 + 6, // 下落时长 (6s - 12s)
      delay: Math.random() * 10, // 随机延迟
      // 樱花粉色系随机
      color: ["#fff5f7", "#ffd1dc", "#ffb7c5", "#f8bbd0"][Math.floor(Math.random() * 4)],
      rotationStart: Math.random() * 360,
      flipDuration: Math.random() * 2 + 2, // 翻转频率
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            opacity: 0, 
            y: "-10vh", 
            x: `${p.xStart}vw`, 
            rotate: p.rotationStart,
            scale: 0 
          }}
          animate={{
            opacity: [0, 1, 1, 0.7, 0],
            y: "110vh",
            // 模拟左右摆动
            x: [
              `${p.xStart}vw`, 
              `${p.xStart + p.xEnd}vw`, 
              `${p.xStart - p.xEnd}vw`, 
              `${p.xStart + p.xEnd * 1.5}vw`
            ],
            scale: [0, 1, 1, 0.8, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
          className="absolute"
          style={{ width: p.size, height: p.size }}
        >
          {/* 内部翻转动画：模拟3D翻滚 */}
          <motion.div
            animate={{
              rotateX: [0, 180, 360],
              rotateZ: [0, 45, 0, -45, 0],
            }}
            transition={{
              duration: p.flipDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full h-full"
          >
            <PetalSVG color={p.color} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}