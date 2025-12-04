import { useParams } from 'react-router-dom';
import { StageWrapper } from '../components/game/StageWrapper';
import { SeatingChart } from '../components/game/board/SeatingChart';
import { useGameSession } from '../hooks/useSupabase';
import { useUIStore } from '../logic/stores/uiStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function GrimoirePage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { session, participants, loading, error } = useGameSession(sessionId || null);

    // UI 状态
    const selectedPlayerId = useUIStore(state => state.selectedPlayerId);
    const selectPlayer = useUIStore(state => state.selectPlayer);

    // 窗口尺寸 (用于传递给 Canvas)
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-3 text-lg">正在打开魔典...</span>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">无法加载游戏</h1>
                <p className="text-slate-400">{error?.message || '房间不存在或已关闭'}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-950">
            {/* 游戏画布 */}
            <StageWrapper>
                <SeatingChart
                    participants={participants}
                    width={dimensions.width}
                    height={dimensions.height}
                    onPlayerSelect={selectPlayer}
                    selectedPlayerId={selectedPlayerId}
                />
            </StageWrapper>

            {/* 顶部信息栏 (HUD) */}
            <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl pointer-events-auto">
                        <h1 className="text-xl font-bold text-white font-serif tracking-wide">
                            {session.name || '未命名魔典'}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                {session.phase}
                            </span>
                            <span>第 {session.current_day} 天</span>
                            <span className="font-mono">#{session.join_code}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部控制栏 (Dock) - 仅选中玩家时显示 */}
            {selectedPlayerId && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                            查看详情
                        </button>
                        <button className="px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-200 rounded-lg text-sm font-medium transition-colors">
                            标记死亡
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
