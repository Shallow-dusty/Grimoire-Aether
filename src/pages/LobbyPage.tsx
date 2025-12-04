import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { createGameSession, joinGameByCode, addParticipant } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Flame, Skull, ChevronRight, Crown, Sword } from 'lucide-react';

export default function LobbyPage() {
    const navigate = useNavigate();
    const [isStoryteller, setIsStoryteller] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表单状态
    const [username, setUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [roomName, setRoomName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) return;
        
        // 如果是玩家加入，必须有房间码
        if (!isStoryteller && !joinCode) return;

        setLoading(true);
        setError(null);

        try {
            if (isStoryteller) {
                // 创建房间
                const userId = 'temp-storyteller-id';
                const session = await createGameSession(userId, roomName || `${username}'s Grimoire`);
                navigate(`/game/${session.id}?role=storyteller`);
            } else {
                // 加入房间
                const session = await joinGameByCode(joinCode);
                if (!session) throw new Error('The Grimoire does not answer... (Room not found)');
                await addParticipant(session.id, username, 999);
                navigate(`/game/${session.id}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The ritual failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center font-sans text-slate-200 overflow-hidden">
            <BackgroundEffect />

            {/* 主容器：黑曜石镜面 (Obsidian Mirror) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`relative z-10 w-full max-w-[480px] p-10 
                    bg-black/40 backdrop-blur-xl 
                    border border-white/10 rounded-2xl 
                    shadow-[0_0_50px_rgba(0,0,0,0.8)]
                    transition-colors duration-500
                    ${isStoryteller ? 'border-red-900/30 shadow-[0_0_50px_rgba(70,10,10,0.5)]' : ''}
                `}
            >
                {/* 标题区域 */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="flex justify-center mb-5"
                    >
                        {isStoryteller ? (
                            <Crown className="w-12 h-12 text-red-600/80 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" strokeWidth={1} />
                        ) : (
                            <Flame className="w-12 h-12 text-amber-500/80 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" strokeWidth={1} />
                        )}
                    </motion.div>
                    
                    <h1 className="text-5xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-3 drop-shadow-sm">
                        GRIMOIRE AETHER
                    </h1>
                    
                    <p className="text-stone-500 font-sans text-[10px] tracking-[0.3em] uppercase">
                        Forbidden Ritual Interface
                    </p>
                </div>

                {/* 身份切换 (Storyteller Toggle) */}
                <div className="flex justify-center mb-10">
                    <div className="flex bg-black/50 rounded-full p-1 border border-white/5">
                        <button
                            onClick={() => setIsStoryteller(false)}
                            className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-300 flex items-center gap-2 ${
                                !isStoryteller 
                                    ? 'bg-white/10 text-amber-100 shadow-sm' 
                                    : 'text-stone-500 hover:text-stone-300'
                            }`}
                        >
                            <Sword className="w-3 h-3" /> PLAYER
                        </button>
                        <button
                            onClick={() => setIsStoryteller(true)}
                            className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-300 flex items-center gap-2 ${
                                isStoryteller 
                                    ? 'bg-red-950/40 text-red-400 shadow-[0_0_15px_rgba(220,38,38,0.2)] border border-red-900/30' 
                                    : 'text-stone-500 hover:text-stone-300'
                            }`}
                        >
                            <Crown className="w-3 h-3" /> STORYTELLER
                        </button>
                    </div>
                </div>

                {/* 表单区域 */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
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
                            />
                            <label 
                                htmlFor="username"
                                className="absolute left-0 -top-3.5 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-stone-500 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[10px] peer-focus:text-amber-500/70"
                            >
                                {isStoryteller ? 'Storyteller Name' : 'Your Identity'}
                            </label>
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
                                    />
                                    <label 
                                        htmlFor="roomName"
                                        className="absolute left-0 -top-3.5 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-stone-500 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[10px] peer-focus:text-amber-500/70"
                                    >
                                        Chronicle Title (Optional)
                                    </label>
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
                                    />
                                    <label 
                                        htmlFor="joinCode"
                                        className="absolute left-0 -top-3.5 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-stone-500 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[10px] peer-focus:text-amber-500/70"
                                    >
                                        Grimoire Code
                                    </label>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-6 bg-gradient-to-r border font-serif font-bold tracking-[0.2em] py-4 rounded-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group
                            ${isStoryteller 
                                ? 'from-red-900 to-red-950 border-red-800/50 text-red-100 hover:from-red-800 hover:to-red-900 hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]' 
                                : 'from-stone-800 to-stone-900 border-stone-700/50 text-stone-200 hover:from-stone-700 hover:to-stone-800 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                            }
                        `}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                {isStoryteller ? 'AWAKEN THE DEMON' : 'ENTER THE VOID'}
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
                        className="mt-6 flex items-center justify-center gap-2 text-red-400/80 text-xs font-sans bg-red-950/30 p-3 rounded border border-red-900/50"
                    >
                        <Skull className="w-4 h-4" /> {error}
                    </motion.div>
                )}
            </motion.div>

            {/* 底部版权 */}
            <div className="absolute bottom-6 text-white/10 text-[10px] font-sans tracking-[0.3em] uppercase mix-blend-overlay">
                Forged in the Aether • MMXXV
            </div>
        </div>
    );
}
