import { motion } from 'motion/react';

export function MnemosyneLogo() {
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Pulsing glow background */}
      <motion.div
        className="absolute inset-0 rounded-full bg-teal-200/30 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Logo SVG */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Tree trunk/neural stem */}
        <path
          d="M60 90 L60 50"
          stroke="url(#trunkGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Brain-leaf hybrid branches */}
        <motion.path
          d="M60 50 Q45 40, 35 35"
          stroke="url(#branchGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.path
          d="M60 50 Q75 40, 85 35"
          stroke="url(#branchGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
        <motion.path
          d="M60 50 Q50 30, 45 20"
          stroke="url(#branchGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
        />
        <motion.path
          d="M60 50 Q70 30, 75 20"
          stroke="url(#branchGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
        />
        
        {/* Memory nodes */}
        <motion.circle
          cx="35"
          cy="35"
          r="5"
          fill="#14B8A6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.5 }}
        />
        <motion.circle
          cx="85"
          cy="35"
          r="5"
          fill="#06B6D4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.7 }}
        />
        <motion.circle
          cx="45"
          cy="20"
          r="5"
          fill="#0D9488"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.9 }}
        />
        <motion.circle
          cx="75"
          cy="20"
          r="5"
          fill="#0891B2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.1 }}
        />
        
        {/* Smaller connecting nodes */}
        <motion.circle
          cx="50"
          cy="40"
          r="3"
          fill="#99F6E4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.3 }}
        />
        <motion.circle
          cx="70"
          cy="40"
          r="3"
          fill="#A5F3FC"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.5 }}
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
          <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
