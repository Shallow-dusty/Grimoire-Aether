import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGameSession } from '../hooks/useSupabase';
import { StageWrapper } from '../components/game/StageWrapper';
import { SeatingChart } from '../components/game/board/SeatingChart';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { Loader2, Skull, Crown, Users, Moon, Sun, Shield, Sword } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GrimoirePage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') as 'storyteller' | 'player' || 'player';
    
    const { session, participants, loading, error } = useGameSession(sessionId!);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    // 阶段图标
    const PhaseIcon = session?.phase === 'night' ? Moon : Sun;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-amber-500 font-serif">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="tracking-[0.5em] text-xs uppercase animate-pulse">正在打开魔典...</p>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-serif">
                <div className="flex flex-col items-center gap-4">
                    <Skull className="w-12 h-12" />
                    <p className="tracking-widest">魔典已破碎</p>
                    <p className="text-xs text-stone-500">{error?.message || '无法连接到虚空'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black font-serif text-stone-200 selection:bg-red-900/30">
            {/* 背景特效 (复用大厅的，但更暗) */}
            <div className="opacity-50 pointer-events-none">
                <BackgroundEffect />
            </div>

            {/* 顶部 HUD (悬浮玻璃) */}
            <motion.div 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-6 pointer-events-none"
            >
                {/* 左侧：房间信息 */}
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-linear-to-b from-amber-100 to-amber-600 drop-shadow-sm">
                        {session.name}
                    </h1>
                    <div className="flex items-center gap-3 text-xs tracking-[0.2em] text-stone-400 uppercase">
                        <span className="flex items-center gap-1 text-amber-500/80">
                            <Crown className="w-3 h-3" /> {role === 'storyteller' ? '说书人模式' : '玩家模式'}
                        </span>
                        <span className="w-px h-3 bg-stone-700" />
                        <span className="font-mono text-stone-500">CODE: {session.join_code}</span>
                    </div>
                </div>

                {/* 中间：阶段指示器 (日/月) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-auto">
                    <div className="relative flex items-center justify-center w-20 h-20 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <PhaseIcon className={`w-10 h-10 ${session.phase === 'night' ? 'text-blue-200 drop-shadow-[0_0_10px_rgba(191,219,254,0.5)]' : 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
                        <div className="absolute -bottom-8 text-[10px] tracking-[0.3em] uppercase text-stone-500">
                            第 {session.current_day} 天
                        </div>
                    </div>
                </div>

                {/* 右侧：玩家计数 */}
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 pointer-events-auto">
                    <Users className="w-4 h-4 text-stone-400" />
                    <span className="text-sm font-bold text-stone-200">{participants.length}</span>
                </div>
            </motion.div>

            {/* 核心游戏区 (Canvas) */}
            <div className="absolute inset-0 z-10">
                <StageWrapper>
                    <SeatingChart 
                        participants={participants}
                        onPlayerSelect={setSelectedPlayerId}
                        selectedPlayerId={selectedPlayerId}
                        width={window.innerWidth}
                        height={window.innerHeight}
                    />
                </StageWrapper>
            </div>

            {/* 底部控制台 (仅选中玩家时显示) */}
            <AnimatePresence>
                {selectedPlayerId && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="flex items-center gap-4 bg-black/80 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-stone-500 tracking-widest uppercase">已选中</span>
                                <span className="text-xl font-bold text-amber-100">
                                    {participants.find(p => p.id === selectedPlayerId)?.name}
                                </span>
                            </div>
                            
                            <div className="w-px h-10 bg-white/10" />

                            <div className="flex gap-2">
                                <button className="p-3 rounded-xl bg-stone-800/50 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors border border-white/5">
                                    <Shield className="w-5 h-5" />
                                </button>
                                <button className="p-3 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-200 transition-colors border border-red-500/20">
                                    <Sword className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
