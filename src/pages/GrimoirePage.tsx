import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGameSession } from '../hooks/useSupabase';
import { StageWrapper } from '../components/game/StageWrapper';
import { SeatingChart } from '../components/game/board/SeatingChart';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { Loader2, Moon, Sun, Shield, Sword, Skull, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateParticipant } from '../lib/supabase';
import { ArcaneMenu } from '../components/game/ui/ArcaneMenu';

export default function GrimoirePage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') === 'storyteller' ? 'storyteller' : 'player';
    
    const { session, participants, loading, error } = useGameSession(sessionId!);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    // 右键菜单状态
    const [menuState, setMenuState] = useState<{
        visible: boolean;
        x: number;
        y: number;
        targetId: string | null;
    }>({ visible: false, x: 0, y: 0, targetId: null });

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-amber-500">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-cinzel">
                <Skull className="w-6 h-6 mr-2" />
                {error || '魔典未响应'}
            </div>
        );
    }

    const PhaseIcon = session.phase === 'night' ? Moon : Sun;

    // 处理座位变更
    const handleSeatChange = async (playerId: string, newSeatIndex: number) => {
        if (role !== 'storyteller') return;
        
        // 简单的逻辑：直接更新该玩家的座位号
        const targetPlayer = participants.find(p => p.seat_index === newSeatIndex);
        const sourcePlayer = participants.find(p => p.id === playerId);
        
        if (!sourcePlayer) return;

        try {
            if (targetPlayer) {
                // 交换位置
                await updateParticipant(targetPlayer.id, { seat_index: sourcePlayer.seat_index });
            }
            // 更新当前玩家位置
            await updateParticipant(playerId, { seat_index: newSeatIndex });
        } catch (err) {
            console.error('Failed to update seat:', err);
        }
    };

    // 处理右键菜单
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleContextMenu = (e: any, playerId: string) => {
        if (role !== 'storyteller') return;
        
        // 获取鼠标相对于窗口的位置
        const { clientX, clientY } = e.evt;
        
        setMenuState({
            visible: true,
            x: clientX,
            y: clientY,
            targetId: playerId
        });
    };

    // 处理菜单操作
    const handleMenuAction = async (action: string) => {
        if (!menuState.targetId) return;
        const player = participants.find(p => p.id === menuState.targetId);
        if (!player) return;

        try {
            switch (action) {
                case 'kill':
                    await updateParticipant(player.id, { is_dead: true });
                    break;
                case 'revive':
                    await updateParticipant(player.id, { is_dead: false });
                    break;
                // TODO: 处理状态标记 (poison, drunk, protect)
                default:
                    console.log('Action not implemented yet:', action);
            }
        } catch (err) {
            console.error('Failed to execute action:', err);
        }
    };

    return (
        <div className="relative min-h-screen bg-black overflow-hidden font-serif selection:bg-red-900/30"
            onClick={() => setMenuState(prev => ({ ...prev, visible: false }))} // 点击空白处关闭菜单
        >
            <BackgroundEffect />
            
            {/* 顶部 HUD */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-amber-600 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                        {session.name || '未命名魔典'}
                    </h1>
                    <div className="flex items-center gap-4 text-xs tracking-[0.2em] text-stone-400 uppercase">
                        <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-red-500" />
                            {role === 'storyteller' ? '说书人模式' : '玩家模式'}
                        </span>
                        <span className="w-px h-3 bg-white/20" />
                        <span>代码: <span className="text-amber-400 font-bold">{session.join_code}</span></span>
                        <span className="w-px h-3 bg-white/20" />
                        <span>玩家: {participants.length}</span>
                    </div>
                </div>

                {/* 阶段指示器 */}
                <div className="pointer-events-auto">
                    <div className="relative flex items-center justify-center w-20 h-20 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <PhaseIcon className={`w-10 h-10 ${session.phase === 'night' ? 'text-blue-200 drop-shadow-[0_0_10px_rgba(191,219,254,0.5)]' : 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
                        <div className="absolute -bottom-8 text-[10px] tracking-[0.3em] uppercase text-stone-500">
                            第 {session.current_day} 天
                        </div>
                    </div>
                </div>
            </div>

            {/* 核心游戏区域 */}
            <div className="absolute inset-0 z-10">
                <StageWrapper>
                    <SeatingChart 
                        participants={participants}
                        onPlayerSelect={setSelectedPlayerId}
                        selectedPlayerId={selectedPlayerId}
                        width={window.innerWidth}
                        height={window.innerHeight}
                        role={role}
                        onSeatChange={handleSeatChange}
                        onTokenContextMenu={handleContextMenu}
                    />
                </StageWrapper>
            </div>

            {/* 奥术菜单 */}
            <ArcaneMenu 
                visible={menuState.visible}
                x={menuState.x}
                y={menuState.y}
                onClose={() => setMenuState(prev => ({ ...prev, visible: false }))}
                onAction={handleMenuAction}
                isDead={participants.find(p => p.id === menuState.targetId)?.is_dead || false}
            />

            {/* 底部控制台 (选中玩家时显示) */}
            <AnimatePresence>
                {selectedPlayerId && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
                    >
                        <div className="flex items-center gap-6 px-8 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-stone-500 tracking-widest uppercase">已选中</span>
                                <span className="text-xl font-bold text-amber-100">
                                    {participants.find(p => p.id === selectedPlayerId)?.name}
                                </span>
                            </div>
                            
                            <div className="w-px h-8 bg-white/10" />

                            <div className="flex gap-2">
                                <button className="p-3 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors" title="标记">
                                    <Shield className="w-5 h-5" />
                                </button>
                                <button className="p-3 rounded-full hover:bg-red-900/30 text-stone-400 hover:text-red-400 transition-colors" title="处决">
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
