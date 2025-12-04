import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { createGameSession, joinGameByCode, addParticipant } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Flame, Skull, ChevronRight, Crown, Sword, Sparkles } from 'lucide-react';

// 角落装饰组件
const CornerDecor = ({ className }: { className: string }) => (
    <svg className={className} width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1V10H2V2H10V1H1Z" fill="currentColor" />
        <path d="M5 5V12H6V6H12V5H5Z" fill="currentColor" fillOpacity="0.4" />
    </svg>
);

export default function LobbyPage() {
    const navigate = useNavigate();
    const [isStoryteller, setIsStoryteller] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表单状态
    const [username, setUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [roomName, setRoomName] = useState('');

    // 3D 视差效果
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 100, damping: 30 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 100, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const x = (e.clientX - rect.left) / width - 0.5;
        const y = (e.clientY - rect.top) / height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) return;
        if (!isStoryteller && !joinCode) return;

        setLoading(true);
        setError(null);

        try {
            if (isStoryteller) {
                const userId = 'temp-storyteller-id';
                const session = await createGameSession(userId, roomName || `${username}的魔典`);
                navigate(`/game/${session.id}?role=storyteller`);
            } else {
                const session = await joinGameByCode(joinCode);
                if (!session) throw new Error('魔典未响应... (房间不存在)');
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
            className="relative min-h-screen flex items-center justify-center font-sans text-slate-200 overflow-hidden perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <BackgroundEffect />

            {/* 主容器：3D 悬浮卡片 */}
            <motion.div
                ref={containerRef}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[500px]"
            >
                {/* 流光边框容器 */}
                <div className={`relative p-px rounded-sm overflow-hidden transition-all duration-500 ${isStoryteller ? 'shadow-[0_0_80px_rgba(153,27,27,0.4)]' : 'shadow-[0_0_80px_rgba(0,0,0,0.8)]'}`}>
                    {/* 动态流光背景 */}
                    <div className={`absolute inset-0 bg-linear-to-br transition-colors duration-1000 ${
                        isStoryteller 
                            ? 'from-red-900 via-black to-red-900' 
                            : 'from-amber-500 via-black to-amber-500'
                    }`} />
                    
                    {/* 内部卡片 (增加通透感) */}
                    <div className="relative bg-black/60 backdrop-blur-xl p-12 rounded-sm overflow-hidden border border-white/5">
                        
                        {/* 内部光效 */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-linear-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />
                        
                        {/* 角落装饰 */}
                        <CornerDecor className={`absolute top-3 left-3 text-amber-500/60 transition-colors duration-500 ${isStoryteller ? 'text-red-500/60' : ''}`} />
                        <CornerDecor className={`absolute top-3 right-3 rotate-90 text-amber-500/60 transition-colors duration-500 ${isStoryteller ? 'text-red-500/60' : ''}`} />
                        <CornerDecor className={`absolute bottom-3 left-3 -rotate-90 text-amber-500/60 transition-colors duration-500 ${isStoryteller ? 'text-red-500/60' : ''}`} />
                        <CornerDecor className={`absolute bottom-3 right-3 rotate-180 text-amber-500/60 transition-colors duration-500 ${isStoryteller ? 'text-red-500/60' : ''}`} />

                        {/* 标题区域 */}
                        <div className="text-center mb-12 relative transform translate-z-10">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className="flex justify-center mb-6"
                            >
                                {isStoryteller ? (
                                    <div className="relative">
                                        <Crown className="w-16 h-16 text-red-600 animate-pulse drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" strokeWidth={1} />
                                        <Sparkles className="absolute -top-2 -right-4 w-6 h-6 text-red-400 animate-bounce" strokeWidth={1} />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Flame className="w-16 h-16 text-amber-500 animate-pulse drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" strokeWidth={1} />
                                    </div>
                                )}
                            </motion.div>
                            
                            <h1 className="text-5xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-linear-to-b from-amber-100 via-amber-300 to-amber-600 mb-4 drop-shadow-sm">
                                GRIMOIRE AETHER
                            </h1>
                            
                            <div className="flex items-center justify-center gap-4 opacity-60">
                                <div className="h-px w-12 bg-linear-to-r from-transparent to-stone-500"></div>
                                <p className="text-stone-400 font-serif text-[10px] tracking-[0.4em] uppercase">
                                    禁忌仪式 · 魔典界面
                                </p>
                                <div className="h-px w-12 bg-linear-to-l from-transparent to-stone-500"></div>
                            </div>
                        </div>

                        {/* 身份切换 */}
                        <div className="flex justify-center mb-12 transform translate-z-5">
                            <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner backdrop-blur-sm">
                                <button
                                    onClick={() => setIsStoryteller(false)}
                                    className={`px-8 py-2.5 rounded-full text-xs font-bold tracking-widest transition-all duration-500 flex items-center gap-2 font-serif ${
                                        !isStoryteller 
                                            ? 'bg-linear-to-b from-stone-700 to-stone-800 text-amber-100 shadow-lg border border-white/20 scale-105' 
                                            : 'text-stone-500 hover:text-stone-300'
                                    }`}
                                >
                                    <Sword className="w-3 h-3" /> 玩家
                                </button>
                                <button
                                    onClick={() => setIsStoryteller(true)}
                                    className={`px-8 py-2.5 rounded-full text-xs font-bold tracking-widest transition-all duration-500 flex items-center gap-2 font-serif ${
                                        isStoryteller 
                                            ? 'bg-linear-to-b from-red-900 to-red-950 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-500/30 scale-105' 
                                            : 'text-stone-500 hover:text-stone-300'
                                    }`}
                                >
                                    <Crown className="w-3 h-3" /> 说书人
                                </button>
                            </div>
                        </div>

                        {/* 表单区域 */}
                        <form onSubmit={handleSubmit} className="space-y-10 transform translate-z-5">
                            <div className="space-y-8">
                                {/* 名字输入 */}
                                <div className="group relative">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="peer w-full bg-transparent border-b border-white/20 py-3 text-amber-50 font-serif text-xl placeholder-transparent focus:outline-none focus:border-amber-500/50 transition-all"
                                        placeholder="Name"
                                        id="username"
                                        required
                                        autoComplete="off"
                                    />
                                    <label 
                                        htmlFor="username"
                                        className="absolute left-0 -top-4 text-stone-500 text-xs font-serif tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-stone-600 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500/70"
                                    >
                                        {isStoryteller ? '尊名 (Storyteller)' : '你的名字 (Identity)'}
                                    </label>
                                    <div className="absolute bottom-0 left-0 w-0 h-px bg-amber-500/50 transition-all duration-700 peer-focus:w-full shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                                </div>

                                {/* 房间码 / 房间名 */}
                                <AnimatePresence mode="wait">
                                    {isStoryteller ? (
                                        <motion.div 
                                            key="room-name"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="group relative"
                                        >
                                            <input
                                                type="text"
                                                value={roomName}
                                                onChange={(e) => setRoomName(e.target.value)}
                                                className="peer w-full bg-transparent border-b border-white/20 py-3 text-amber-50 font-serif text-xl placeholder-transparent focus:outline-none focus:border-amber-500/50 transition-all"
                                                placeholder="Chronicle"
                                                id="roomName"
                                                autoComplete="off"
                                            />
                                            <label 
                                                htmlFor="roomName"
                                                className="absolute left-0 -top-4 text-stone-500 text-xs font-serif tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-stone-600 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500/70"
                                            >
                                                剧本标题 (可选)
                                            </label>
                                            <div className="absolute bottom-0 left-0 w-0 h-px bg-amber-500/50 transition-all duration-700 peer-focus:w-full shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="join-code"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="group relative"
                                        >
                                            <input
                                                type="text"
                                                value={joinCode}
                                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                                className="peer w-full bg-transparent border-b border-white/20 py-3 text-amber-50 font-serif text-xl placeholder-transparent focus:outline-none focus:border-amber-500/50 transition-all uppercase tracking-[0.2em]"
                                                placeholder="Code"
                                                id="joinCode"
                                                maxLength={4}
                                                required={!isStoryteller}
                                                autoComplete="off"
                                            />
                                            <label 
                                                htmlFor="joinCode"
                                                className="absolute left-0 -top-4 text-stone-500 text-xs font-serif tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-stone-600 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500/70"
                                            >
                                                房间代码 (Code)
                                            </label>
                                            <div className="absolute bottom-0 left-0 w-0 h-px bg-amber-500/50 transition-all duration-700 peer-focus:w-full shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 提交按钮 */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full mt-8 bg-linear-to-r border font-serif font-bold tracking-[0.2em] py-4 rounded-sm shadow-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden
                                    ${isStoryteller 
                                        ? 'from-red-900 to-red-950 border-red-800/50 text-red-100 hover:from-red-800 hover:to-red-900 hover:shadow-[0_0_40px_rgba(220,38,38,0.6)]' 
                                        : 'from-stone-800 to-stone-900 border-stone-700/50 text-stone-200 hover:from-stone-700 hover:to-stone-800 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                    }
                                `}
                            >
                                {/* 按钮光效 */}
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                                
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {isStoryteller ? '唤醒恶魔 (AWAKEN)' : '进入虚空 (ENTER)'}
                                        {isStoryteller ? (
                                            <Flame className="w-5 h-5 group-hover:scale-110 transition-transform text-red-500" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        )}
                                    </>
                                )}
                            </button>
                        </form>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-6 flex items-center justify-center gap-2 text-red-400/80 text-xs font-serif bg-red-950/30 p-3 rounded border border-red-900/50"
                            >
                                <Skull className="w-4 h-4" /> {error}
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* 底部版权 */}
            <div className="absolute bottom-6 text-white/10 text-[10px] font-serif tracking-[0.3em] uppercase mix-blend-overlay">
                Forged in the Aether • MMXXV
            </div>
        </div>
    );
}
