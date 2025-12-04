import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { createGameSession, joinGameByCode, addParticipant } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Scroll, Skull, Sword, Crown } from 'lucide-react';

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
        <div className="relative min-h-screen flex items-center justify-center font-sans text-parchment-200 overflow-hidden">
            <BackgroundEffect />

            {/* 魔法书容器 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-10 w-full max-w-lg p-12"
            >
                {/* 书本背景纹理 */}
                <div className="absolute inset-0 bg-parchment-400 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] transform rotate-1">
                    {/* 纹理叠加 */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 mix-blend-multiply"></div>
                    {/* 边缘磨损效果 */}
                    <div className="absolute inset-0 border-[12px] border-double border-gold-700/30 rounded-sm"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/30"></div>
                </div>

                {/* 内容区域 */}
                <div className="relative z-20 text-charcoal-900">
                    {/* 标题 */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="flex justify-center mb-4"
                        >
                            <Crown className="w-12 h-12 text-blood-900 drop-shadow-sm" strokeWidth={1.5} />
                        </motion.div>
                        <h1 className="text-5xl font-serif font-bold text-blood-900 tracking-widest drop-shadow-sm mb-2">
                            Grimoire Aether
                        </h1>
                        <div className="h-px w-32 mx-auto bg-blood-900/50 my-4"></div>
                        <p className="text-charcoal-800 font-serif italic text-sm tracking-widest uppercase">
                            Where Lies and Logic Entwine
                        </p>
                    </div>

                    {/* 模式切换 (墨水标签) */}
                    <div className="flex justify-center gap-8 mb-8 font-serif text-lg border-b border-charcoal-900/20 pb-2">
                        <button
                            onClick={() => setMode('join')}
                            className={`relative px-4 py-2 transition-all duration-300 ${mode === 'join'
                                    ? 'text-blood-900 font-bold scale-110'
                                    : 'text-charcoal-600 hover:text-blood-700'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Sword className="w-4 h-4" /> Join Ritual
                            </span>
                            {mode === 'join' && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blood-900" />
                            )}
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`relative px-4 py-2 transition-all duration-300 ${mode === 'create'
                                    ? 'text-blood-900 font-bold scale-110'
                                    : 'text-charcoal-600 hover:text-blood-700'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Scroll className="w-4 h-4" /> Open Grimoire
                            </span>
                            {mode === 'create' && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blood-900" />
                            )}
                        </button>
                    </div>

                    {/* 表单 */}
                    <AnimatePresence mode="wait">
                        {mode === 'join' ? (
                            <motion.form
                                key="join"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleJoin}
                                className="space-y-6 px-4"
                            >
                                <div className="group">
                                    <label className="block font-serif text-blood-900 text-sm mb-1">Your True Name</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-charcoal-400 text-charcoal-900 font-serif text-xl py-2 focus:outline-none focus:border-blood-700 transition-colors placeholder:text-charcoal-400/50"
                                        placeholder="Enter name..."
                                        required
                                    />
                                </div>
                                <div className="group">
                                    <label className="block font-serif text-blood-900 text-sm mb-1">Grimoire Code</label>
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        className="w-full bg-transparent border-b-2 border-charcoal-400 text-charcoal-900 font-serif text-xl py-2 focus:outline-none focus:border-blood-700 transition-colors placeholder:text-charcoal-400/50 uppercase tracking-[0.2em]"
                                        placeholder="ABCD"
                                        maxLength={4}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-8 bg-blood-900 text-parchment-200 font-serif font-bold py-3 px-6 rounded-sm shadow-md hover:bg-blood-800 hover:shadow-lg active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gold-600"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Enter the Circle'}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="create"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onSubmit={handleCreate}
                                className="space-y-6 px-4"
                            >
                                <div className="group">
                                    <label className="block font-serif text-blood-900 text-sm mb-1">Storyteller Name</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-charcoal-400 text-charcoal-900 font-serif text-xl py-2 focus:outline-none focus:border-blood-700 transition-colors placeholder:text-charcoal-400/50"
                                        placeholder="Enter name..."
                                        required
                                    />
                                </div>
                                <div className="group">
                                    <label className="block font-serif text-blood-900 text-sm mb-1">Chronicle Title</label>
                                    <input
                                        type="text"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-charcoal-400 text-charcoal-900 font-serif text-xl py-2 focus:outline-none focus:border-blood-700 transition-colors placeholder:text-charcoal-400/50"
                                        placeholder="The Village of..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-8 bg-blood-900 text-parchment-200 font-serif font-bold py-3 px-6 rounded-sm shadow-md hover:bg-blood-800 hover:shadow-lg active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gold-600"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Awaken the Demon'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 text-center text-blood-700 font-serif text-sm flex items-center justify-center gap-2"
                        >
                            <Skull className="w-4 h-4" /> {error}
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* 底部版权 */}
            <div className="absolute bottom-4 text-parchment-400/50 text-xs font-serif tracking-widest mix-blend-overlay">
                FORGED IN THE AETHER • MMXXV
            </div>
        </div>
    );
}
