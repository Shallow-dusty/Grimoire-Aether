import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { createGameSession, joinGameByCode, addParticipant } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Moon, Users, ArrowRight, Sparkles } from 'lucide-react';

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
            // 1. 查找房间
            const session = await joinGameByCode(joinCode);
            if (!session) throw new Error('房间不存在');

            // 2. 加入房间 (作为玩家)
            // TODO: 获取当前用户 ID (如果已登录)
            // 这里暂时假设是匿名/临时用户，不绑定 user_id
            await addParticipant(session.id, username, 999); // 999 表示未分配座位

            // 3. 跳转到游戏页面
            navigate(`/game/${session.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : '加入失败');
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
            // 1. 创建房间 (作为说书人)
            // TODO: 真正的说书人应该需要登录，这里暂时允许匿名创建用于测试
            // 实际生产中应该检查 user_id
            const userId = 'temp-storyteller-id'; // 临时 ID
            const session = await createGameSession(userId, roomName || `${username}的魔典`);

            // 2. 跳转到游戏页面
            navigate(`/game/${session.id}?role=storyteller`);
        } catch (err) {
            setError(err instanceof Error ? err.message : '创建失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center font-sans text-slate-200">
            <BackgroundEffect />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-6"
            >
                {/* 标题区域 */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="inline-block mb-4"
                    >
                        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-3">
                            <Moon className="w-8 h-8 text-white" />
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 font-serif">
                        Grimoire Aether
                    </h1>
                    <p className="mt-2 text-slate-400 text-sm tracking-wide uppercase">
                        血染钟楼 · 沉浸式魔典
                    </p>
                </div>

                {/* 主卡片 */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    {/* 选项卡切换 */}
                    <div className="flex border-b border-white/5">
                        <button
                            onClick={() => setMode('join')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mode === 'join' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            加入房间
                            {mode === 'join' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mode === 'create' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            创建魔典
                            {mode === 'create' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                                />
                            )}
                        </button>
                    </div>

                    {/* 表单区域 */}
                    <div className="p-6 min-h-[300px]">
                        <AnimatePresence mode="wait">
                            {mode === 'join' ? (
                                <motion.form
                                    key="join"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleJoin}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">你的名字</label>
                                        <div className="relative group">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="输入昵称..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">房间代码</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-500 font-mono text-xs border border-slate-600 rounded group-focus-within:border-purple-400 group-focus-within:text-purple-400 transition-colors">#</div>
                                            <input
                                                type="text"
                                                value={joinCode}
                                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                                placeholder="例如: AB12"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-mono uppercase tracking-widest"
                                                maxLength={4}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>进入房间 <ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="create"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleCreate}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">说书人昵称</label>
                                        <div className="relative group">
                                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="你的名字..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">房间名称 (可选)</label>
                                        <input
                                            type="text"
                                            value={roomName}
                                            onChange={(e) => setRoomName(e.target.value)}
                                            placeholder={`${username || '我'}的魔典`}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>创建魔典 <Sparkles className="w-4 h-4" /></>}
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* 底部信息 */}
                <div className="mt-8 text-center text-slate-500 text-xs">
                    <p>Powered by DeepSeek AI & Supabase Realtime</p>
                    <p className="mt-1">© 2025 Antigravity Team</p>
                </div>
            </motion.div>
        </div>
    );
}
