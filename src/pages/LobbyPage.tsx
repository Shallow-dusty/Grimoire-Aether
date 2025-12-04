import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { createGameSession, joinGameByCode, addParticipant } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Flame, Skull, ChevronRight } from 'lucide-react';

export default function LobbyPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'join' | 'create'>('join');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表单状态
    const [username, setUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [roomName, setRoomName] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !joinCode) return;
        setLoading(true);
        setError(null);

        try {
            const session = await joinGameByCode(joinCode);
            if (!session) throw new Error('The Grimoire does not answer... (Room not found)');
            await addParticipant(session.id, username, 999);
            navigate(`/game/${session.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The ritual failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) return;
        setLoading(true);
        setError(null);

        try {
            const userId = 'temp-storyteller-id';
            const session = await createGameSession(userId, roomName || `${username}'s Grimoire`);
            navigate(`/game/${session.id}?role=storyteller`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The spell fizzled.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center font-sans text-slate-200 overflow-hidden">
            <BackgroundEffect />

            {/* 主容器：暗黑玻璃拟态 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl"
            >
                {/* 标题区域 */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="flex justify-center mb-4"
                    >
                        <Flame className="w-10 h-10 text-amber-500/80 animate-pulse" strokeWidth={1.5} />
                    </motion.div>
                    
                    <h1 className="text-4xl font-serif font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-2">
                        GRIMOIRE AETHER
                    </h1>
                    
                    <p className="text-white/40 font-sans text-xs tracking-[0.3em] uppercase">
                        Forbidden Ritual Interface
                    </p>
                </div>

                {/* 模式切换 */}
                <div className="flex mb-8 bg-black/30 rounded-lg p-1 border border-white/5">
                    <button
                        onClick={() => setMode('join')}
                        className={`flex-1 py-2 text-xs font-medium tracking-wider uppercase transition-all rounded-md ${
                            mode === 'join' 
                                ? 'bg-white/10 text-amber-100 shadow-sm' 
                                : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        Join Ritual
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        className={`flex-1 py-2 text-xs font-medium tracking-wider uppercase transition-all rounded-md ${
                            mode === 'create' 
                                ? 'bg-white/10 text-amber-100 shadow-sm' 
                                : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        Awaken
                    </button>
                </div>

                {/* 表单区域 */}
                <AnimatePresence mode="wait">
                    {mode === 'join' ? (
                        <motion.form
                            key="join"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleJoin}
                            className="space-y-5"
                        >
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest ml-1">Identity</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-amber-50 placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                                    placeholder="Enter your name..."
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest ml-1">Cipher</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-amber-50 placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono uppercase tracking-widest"
                                    placeholder="ABCD"
                                    maxLength={4}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-gradient-to-r from-red-900 to-red-950 border border-red-800/50 text-red-100 font-serif font-bold tracking-widest py-3 rounded-lg shadow-lg hover:from-red-800 hover:to-red-900 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:border-red-500/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        ENTER THE VOID
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="create"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleCreate}
                            className="space-y-5"
                        >
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest ml-1">Storyteller</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-amber-50 placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                                    placeholder="Your name..."
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest ml-1">Chronicle</label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-amber-50 placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                                    placeholder="Name of the session..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-gradient-to-r from-red-900 to-red-950 border border-red-800/50 text-red-100 font-serif font-bold tracking-widest py-3 rounded-lg shadow-lg hover:from-red-800 hover:to-red-900 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:border-red-500/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        BEGIN THE NIGHT
                                        <Flame className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 flex items-center justify-center gap-2 text-red-400/80 text-xs font-sans bg-red-950/30 p-2 rounded border border-red-900/50"
                    >
                        <Skull className="w-3 h-3" /> {error}
                    </motion.div>
                )}
            </motion.div>

            {/* 底部版权 */}
            <div className="absolute bottom-6 text-white/20 text-[10px] font-sans tracking-[0.2em] uppercase">
                Forged in the Aether • MMXXV
            </div>
        </div>
    );
}
