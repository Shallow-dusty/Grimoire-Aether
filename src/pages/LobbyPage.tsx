import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { createGameSession, joinGameByCode, addParticipant } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Flame, Skull, Crown, Sparkles } from 'lucide-react';

export default function LobbyPage() {
    const navigate = useNavigate();
    const [isStoryteller, setIsStoryteller] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表单状态
    const [username, setUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [roomName, setRoomName] = useState('');

    // 视差效果 (鼠标移动时，文字会有轻微的反向移动，产生悬浮感)
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const contentX = useSpring(useTransform(mouseX, [-0.5, 0.5], [15, -15]), { stiffness: 100, damping: 30 });
    const contentY = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { stiffness: 100, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set((clientX / innerWidth) - 0.5);
        mouseY.set((clientY / innerHeight) - 0.5);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) return;
        if (!isStoryteller && !joinCode) return;

        setLoading(true);
        setError(null);

        try {
            if (isStoryteller) {
                // 传入 null 作为 storytellerId，因为我们没有 Auth
                const session = await createGameSession(null, roomName || `${username}的魔典`);
                navigate(`/game/${session.id}?role=storyteller`);
            } else {
                const session = await joinGameByCode(joinCode);
                if (!session) throw new Error('虚空未响应... (房间不存在)');
                await addParticipant(session.id, username, 999);
                navigate(`/game/${session.id}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '仪式失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black font-serif selection:bg-red-900/30"
            onMouseMove={handleMouseMove}
        >
            {/* 1. 环境层 (The Environment) */}
            <BackgroundEffect />
            
            {/* 额外氛围层：暗角与噪点 */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] z-0" />
            
            {/* 2. 内容层 (The HUD) - 无框设计 */}
            <motion.div 
                style={{ x: contentX, y: contentY }}
                className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md px-6"
            >
                {/* 顶部图标 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="mb-8 relative"
                >
                    {isStoryteller ? (
                        <div className="relative">
                            <Crown className="w-16 h-16 text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] animate-pulse" strokeWidth={1} />
                            <Sparkles className="absolute -top-2 -right-4 w-6 h-6 text-red-400 animate-bounce" strokeWidth={1} />
                        </div>
                    ) : (
                        <Flame className="w-16 h-16 text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.8)] animate-pulse" strokeWidth={1} />
                    )}
                </motion.div>

                {/* 3. 标题 (Typography) */}
                <motion.h1 
                    className={`text-5xl md:text-6xl font-bold tracking-[0.2em] mb-2 text-transparent bg-clip-text bg-gradient-to-b transition-all duration-700 ${
                        isStoryteller 
                            ? 'from-red-400 via-red-600 to-red-900 drop-shadow-[0_0_35px_rgba(220,38,38,0.6)]' 
                            : 'from-amber-200 via-amber-400 to-amber-700 drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]'
                    }`}
                >
                    GRIMOIRE AETHER
                </motion.h1>
                <motion.h2
                    className={`text-xl md:text-2xl font-serif tracking-[0.5em] mb-8 uppercase transition-colors duration-700 ${
                        isStoryteller ? 'text-red-900/80' : 'text-stone-500'
                    }`}
                >
                    禁忌仪式 · 魔典界面
                </motion.h2>

                {/* 分隔符 */}
                <div className="flex items-center justify-center gap-4 w-full mb-12 opacity-50">
                    <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${isStoryteller ? 'to-red-900' : 'to-amber-900'}`} />
                    <div className={`text-xs transform rotate-45 w-2 h-2 border ${isStoryteller ? 'border-red-800 bg-red-950' : 'border-amber-800 bg-amber-950'}`} />
                    <div className={`h-px flex-1 bg-gradient-to-l from-transparent ${isStoryteller ? 'to-red-900' : 'to-amber-900'}`} />
                </div>

                {/* 身份切换 (极简文本按钮) */}
                <div className="flex gap-12 mb-12 text-sm tracking-[0.2em] font-bold font-serif">
                    <button
                        onClick={() => setIsStoryteller(false)}
                        className={`transition-all duration-500 relative group ${!isStoryteller ? 'text-amber-400 scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'text-stone-600 hover:text-stone-400'}`}
                    >
                        <span className="relative z-10">玩家 (PLAYER)</span>
                        {!isStoryteller && (
                            <motion.div layoutId="activeTab" className="absolute -bottom-2 left-0 right-0 h-px bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsStoryteller(true)}
                        className={`transition-all duration-500 relative group ${isStoryteller ? 'text-red-500 scale-110 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'text-stone-600 hover:text-stone-400'}`}
                    >
                        <span className="relative z-10">说书人 (STORYTELLER)</span>
                        {isStoryteller && (
                            <motion.div layoutId="activeTab" className="absolute -bottom-2 left-0 right-0 h-px bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                        )}
                    </button>
                </div>

                {/* 4. 输入区域 (Floating Underlines) */}
                <form onSubmit={handleSubmit} className="w-full space-y-12">
                    <div className="group relative w-full">
                        <label className={`block text-[10px] tracking-[0.3em] uppercase mb-2 transition-colors duration-500 font-serif ${isStoryteller ? 'text-red-400/80' : 'text-amber-500/80'}`}>
                            {isStoryteller ? '尊名 (YOUR NAME)' : '你的名字 (IDENTITY)'}
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full bg-transparent border-b py-2 text-center text-2xl font-serif focus:outline-none transition-all duration-500 placeholder:text-white/10 ${
                                isStoryteller 
                                    ? 'border-red-900/50 focus:border-red-500 text-red-100 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                                    : 'border-white/20 focus:border-amber-500 text-amber-50 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            }`}
                            placeholder="输入名字..."
                            autoComplete="off"
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {isStoryteller ? (
                            <motion.div
                                key="room"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="group relative w-full"
                            >
                                <label className="block text-[10px] tracking-[0.3em] uppercase mb-2 text-red-400/80 font-serif">
                                    剧本标题 (CHRONICLE)
                                </label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full bg-transparent border-b border-red-900/50 py-2 text-center text-2xl font-serif text-red-100 focus:outline-none focus:border-red-500 transition-all duration-500 placeholder:text-white/10 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                    placeholder="可选..."
                                    autoComplete="off"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="code"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="group relative w-full"
                            >
                                <label className="block text-[10px] tracking-[0.3em] uppercase mb-2 text-amber-500/80 font-serif">
                                    房间代码 (CODE)
                                </label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="w-full bg-transparent border-b border-white/20 py-2 text-center text-2xl font-serif text-amber-50 focus:outline-none focus:border-amber-500 transition-all duration-500 placeholder:text-white/10 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                    placeholder="XXXX"
                                    maxLength={4}
                                    autoComplete="off"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 6. 仪式按钮 (The Ritual Button) */}
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-5 mt-8 border transition-all duration-500 group relative overflow-hidden ${
                            isStoryteller
                                ? 'bg-gradient-to-r from-red-950 to-black border-red-900/50 text-red-100 hover:shadow-[0_0_40px_rgba(220,38,38,0.4)]'
                                : 'bg-gradient-to-r from-stone-900 to-black border-stone-800/50 text-amber-50 hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                        }`}
                    >
                        <span className="relative z-10 text-sm tracking-[0.4em] font-bold flex items-center justify-center gap-4 font-serif">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <span className={`h-px w-8 ${isStoryteller ? 'bg-red-500' : 'bg-amber-500'} transition-all group-hover:w-12`} />
                                    {isStoryteller ? '唤醒恶魔 (AWAKEN)' : '进入虚空 (ENTER)'}
                                    <span className={`h-px w-8 ${isStoryteller ? 'bg-red-500' : 'bg-amber-500'} transition-all group-hover:w-12`} />
                                </>
                            )}
                        </span>
                        
                        {/* 按钮内部流光 */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r ${isStoryteller ? 'from-red-600 via-transparent to-red-600' : 'from-amber-500 via-transparent to-amber-500'}`} />
                    </motion.button>
                </form>

                {/* 错误提示 */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-6 text-red-500 text-xs tracking-widest flex items-center gap-2"
                        >
                            <Skull className="w-3 h-3" /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* 底部版权 */}
            <div className="absolute bottom-8 text-stone-700 text-[10px] tracking-[0.5em] uppercase mix-blend-difference opacity-50">
                Forged in Aether
            </div>
        </div>
    );
}
