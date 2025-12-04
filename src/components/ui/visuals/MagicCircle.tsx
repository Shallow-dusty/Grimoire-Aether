import { motion } from 'framer-motion';

export function MagicCircle() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* 外圈符文 */}
            <motion.div
                className="w-[800px] h-[800px] border border-white/5 rounded-full flex items-center justify-center opacity-20"
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute inset-0 border border-dashed border-white/10 rounded-full" />
                <svg viewBox="0 0 100 100" className="w-full h-full p-4">
                    <path id="curve" d="M 50, 50 m -45, 0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0" fill="transparent" />
                    <text className="text-[4px] fill-current text-amber-500/50 font-serif tracking-[2px] uppercase">
                        <textPath href="#curve">
                            In umbra igitur pugnabimus • Verilas vos liberabit • Sanguis et Anima • 
                            In umbra igitur pugnabimus • Verilas vos liberabit • Sanguis et Anima •
                        </textPath>
                    </text>
                </svg>
            </motion.div>

            {/* 内圈几何 */}
            <motion.div
                className="absolute w-[600px] h-[600px] border border-white/5 rounded-full opacity-30"
                animate={{ rotate: -360 }}
                transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[400px] h-[400px] border border-white/5 rotate-45" />
                    <div className="absolute w-[400px] h-[400px] border border-white/5" />
                </div>
            </motion.div>
        </div>
    );
}
