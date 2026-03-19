import { motion } from "motion/react";


export function SparkleDust() {
  const sparkles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 15 + 10,
    duration: Math.random() * 5 + 5,
    delay: Math.random() * 5,
    type: Math.random() > 0.5 ? 'star' : 'heart'
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
      {sparkles.map(s => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: '100vh', x: `${s.x}vw` }}
          animate={{ 
            opacity: [0, 0.6, 0],
            y: '-10vh',
            x: [`${s.x}vw`, `${s.x + (Math.random() * 10 - 5)}vw`]
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "linear"
          }}
          className="absolute text-primary/30"
          style={{ fontSize: s.size }}
        >
          {s.type === 'star' ? '✦' : '❤'}
        </motion.div>
      ))}
    </div>
  );
}
