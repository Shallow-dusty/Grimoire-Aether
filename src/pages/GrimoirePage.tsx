import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { useGameSession } from '../hooks/useSupabase';
import { gameMachine, type GameMachineEvent } from '../logic/machines/gameMachine';
import { StageWrapper } from '../components/game/StageWrapper';
import { SeatingChart } from '../components/game/board/SeatingChart';
import { BackgroundEffect } from '../components/ui/layout/BackgroundEffect';
import { Loader2, Moon, Sun, Shield, Sword, Skull, Crown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateParticipant, supabase, logGameAction, checkDailyNomination } from '../lib/supabase';
import { ArcaneMenu } from '../components/game/ui/ArcaneMenu';
import { PhaseIndicator } from '../components/ui/layout/PhaseIndicator';
import { RoleAssignment } from '../components/game/phases/RoleAssignment';
import { randomAssignRoles, balancedAssignRoles } from '../utils/roleAssignment';
import { NightPhase } from '../components/game/phases/NightPhase';
import { buildNightQueue } from '../logic/night/nightActions';
import { DayPhase } from '../components/game/phases/DayPhase';
import { ExecutionPhase } from '../components/game/phases/ExecutionPhase';
import { GameOver } from '../components/game/phases/GameOver';
import { GameInfo } from '../components/game/ui/GameInfo';
import { useUIStore } from '../logic/stores/uiStore';
import { PlayerRoleCard } from '../components/game/ui/PlayerRoleCard';
import { getExecutionThreshold } from '../types/game';

export default function GrimoirePage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') === 'storyteller' ? 'storyteller' : 'player';
    const currentPlayerId = searchParams.get('playerId'); // 玩家视角时的当前玩家 ID

    const { session, participants, loading, error } = useGameSession(sessionId!);

    // 数据过滤：玩家只能看到自己的角色，说书人能看到所有角色
    const visibleParticipants = role === 'storyteller'
        ? participants
        : participants.map(p => ({
            ...p,
            // 只保留当前玩家自己的 character_id，其他人的都隐藏
            character_id: p.id === currentPlayerId ? p.character_id : null
        }));
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    // 玩家角色卡片显示状态
    const [showRoleCard, setShowRoleCard] = useState(false);

    // UI Store
    const { isSidebarOpen, setSidebarOpen, showRoles, toggleShowRoles } = useUIStore();

    // XState 游戏状态机 (仅说书人激活)
    const [state, send] = useMachine(gameMachine, {
        context: {
            sessionId: sessionId || '',
            players: visibleParticipants.map(p => ({
                id: p.id,
                name: p.name,
                seatIndex: p.seat_index,
                characterId: p.character_id || null,
                isDead: p.is_dead,
                isGhost: p.is_dead, // 死亡的玩家成为幽灵
                hasUsedGhostVote: false, // 初始未使用幽灵投票
                statusFlags: {
                    poisoned: (p.status_flags as any)?.poisoned || false,
                    drunk: (p.status_flags as any)?.drunk || false,
                    protected: (p.status_flags as any)?.protected || false,
                    mad: (p.status_flags as any)?.mad || false,
                    custom: (p.status_flags as any)?.custom || []
                }
            })),
            currentDay: session?.current_day || 0,
            currentNight: session?.current_night || 0,
            isFirstNight: (session?.current_night || 0) === 0,
            history: [],
            nightQueue: null,
            currentNomineeId: null,
            currentNominatorId: null,
            currentVotes: {},
            nominatedToday: [],
            nominatorsToday: [],
            executionTarget: null,
            highestVoteCount: 0,
            executedToday: false,
            nominationHistory: [],
            winner: null,
            endReason: null
        }
    });

    // 同步状态机变化到 Supabase (仅说书人)
    useEffect(() => {
        if (role !== 'storyteller' || !sessionId) return;

        const syncToSupabase = async () => {
            try {
                // 同步核心状态
                await supabase
                    .from('game_sessions')
                    .update({
                        phase: state.matches('gameLoop.night') ? 'night' : 'day',
                        current_day: state.context.currentDay,
                        current_night: state.context.currentNight,
                        // 存储完整状态机上下文 (调试用)
                        metadata: {
                            ...session?.metadata,
                            machine_state: state.value,
                            machine_context: {
                                executedToday: state.context.executedToday,
                                executionTarget: state.context.executionTarget,
                                winner: state.context.winner,
                                endReason: state.context.endReason
                            }
                        }
                    })
                    .eq('id', sessionId);
            } catch (err) {
                console.error('Failed to sync state to Supabase:', err);
            }
        };

        syncToSupabase();
    }, [state, role, sessionId, session?.metadata]);

    // 右键菜单状态
    const [menuState, setMenuState] = useState<{
        visible: boolean;
        x: number;
        y: number;
        targetId: string | null;
    }>({ visible: false, x: 0, y: 0, targetId: null });

    // 角色分配模态框
    const [showRoleAssignment, setShowRoleAssignment] = useState(false);

    // 处理角色分配
    const handleAssignRole = async (playerId: string, characterId: string) => {
        if (role !== 'storyteller') return;

        try {
            // 发送状态机事件
            send({ type: 'ASSIGN_ROLE', playerId, characterId });

            // 同步到数据库
            await updateParticipant(playerId, { character_id: characterId });
        } catch (err) {
            console.error('Failed to assign role:', err);
        }
    };

    // 随机分配角色
    const handleRandomAssign = async () => {
        if (role !== 'storyteller') return;

        const playerIds = participants.map(p => p.id);
        const assignments = randomAssignRoles(playerIds);

        for (const [playerId, characterId] of Object.entries(assignments)) {
            await handleAssignRole(playerId, characterId);
        }
    };

    // 平衡分配角色
    const handleBalancedAssign = async () => {
        if (role !== 'storyteller') return;

        const playerIds = participants.map(p => p.id);
        const assignments = balancedAssignRoles(playerIds);

        for (const [playerId, characterId] of Object.entries(assignments)) {
            await handleAssignRole(playerId, characterId);
        }
    };

    // 夜晚行动处理
    const handleUseAbility = async (playerId: string, targets?: string[]) => {
        if (role !== 'storyteller') return;

        try {
            // 发送状态机事件
            send({ type: 'USE_ABILITY', playerId, targets });

            // 可以在这里添加能力执行逻辑（记录到历史等）
        } catch (err) {
            console.error('Failed to use ability:', err);
        }
    };

    const handleSkipNightAction = () => {
        if (role !== 'storyteller') return;
        send({ type: 'SKIP_NIGHT_ACTION' });
    };

    const handleEndNight = () => {
        if (role !== 'storyteller') return;
        send({ type: 'END_NIGHT' });
    };

    // 白天阶段处理
    const handleEnterNomination = () => {
        if (role !== 'storyteller') return;
        send({ type: 'ENTER_NOMINATION' });
    };

    const handleStartNomination = async (nominatorId: string, nomineeId: string) => {
        if (role !== 'storyteller') return;

        try {
            // 数据库级别验证：检查提名者今日是否已提名过
            const canNominate = await checkDailyNomination(
                sessionId!,
                nominatorId,
                state.context.currentDay
            );

            if (!canNominate) {
                console.warn('提名验证失败：该玩家今日已提名过');
                return;
            }

            // 发送状态机事件
            send({ type: 'NOMINATE', nominatorId, nomineeId });

            // 记录提名动作到数据库
            await logGameAction(
                sessionId!,
                'NOMINATE',
                {
                    day: state.context.currentDay,
                    nomineeId
                },
                nominatorId,
                nomineeId
            );
        } catch (err) {
            console.error('Failed to start nomination:', err);
        }
    };

    const handleCancelNomination = () => {
        if (role !== 'storyteller') return;
        send({ type: 'CANCEL_NOMINATION' });
    };

    const handleVote = (voterId: string, voteFor: boolean) => {
        if (role !== 'storyteller') return;
        send({ type: 'CAST_VOTE', voterId, vote: voteFor });
    };

    const handleEndVoting = () => {
        if (role !== 'storyteller') return;
        send({ type: 'FINISH_VOTE' });
    };

    const handleConfirmExecution = () => {
        if (role !== 'storyteller') return;
        send({ type: 'EXECUTE' });
    };

    const handleContinueAfterVote = () => {
        if (role !== 'storyteller') return;
        send({ type: 'SKIP_EXECUTION' });
    };

    const handleEndDay = () => {
        if (role !== 'storyteller') return;
        send({ type: 'END_DAY' });
    };

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
                {error instanceof Error ? error.message : error || '魔典未响应'}
            </div>
        );
    }

    // 处理玩家选择（点击令牌）
    const handlePlayerSelect = (playerId: string) => {
        setSelectedPlayerId(playerId);

        // 如果是玩家视角且点击的是自己的令牌，显示角色卡片
        if (role === 'player' && playerId === currentPlayerId) {
            setShowRoleCard(true);
        }
    };

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

    // 处理菜单操作 (说书人通过状态机)
    const handleMenuAction = async (action: string) => {
        if (!menuState.targetId) return;
        const player = participants.find(p => p.id === menuState.targetId);
        if (!player) return;

        try {
            // 解析当前状态
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentFlags = (player.status_flags as any) || {
                poisoned: false,
                drunk: false,
                protected: false,
                mad: false,
                custom: []
            };

            switch (action) {
                case 'kill':
                    // 发送状态机事件 (说书人)
                    if (role === 'storyteller') {
                        send({ type: 'KILL_PLAYER', playerId: player.id, cause: '说书人击杀' });
                    }
                    // 同步到数据库
                    await updateParticipant(player.id, { is_dead: true });
                    break;
                case 'revive':
                    // 发送状态机事件
                    if (role === 'storyteller') {
                        send({ type: 'REVIVE_PLAYER', playerId: player.id });
                    }
                    await updateParticipant(player.id, { is_dead: false });
                    break;
                case 'poison':
                    await updateParticipant(player.id, {
                        status_flags: { ...currentFlags, poisoned: !currentFlags.poisoned }
                    });
                    break;
                case 'drunk':
                    await updateParticipant(player.id, {
                        status_flags: { ...currentFlags, drunk: !currentFlags.drunk }
                    });
                    break;
                case 'protect':
                    await updateParticipant(player.id, {
                        status_flags: { ...currentFlags, protected: !currentFlags.protected }
                    });
                    break;
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
                <div className="flex items-start gap-4 pointer-events-auto">
                    {/* 侧边栏按钮 */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:bg-black/60 transition-all hover:scale-105"
                        title="打开游戏信息"
                    >
                        <Menu className="w-5 h-5 text-amber-400" />
                    </button>

                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
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
                </div>

                {/* 阶段指示器 */}
                <div className="pointer-events-auto">
                    <PhaseIndicator
                        machineState={state}
                        currentDay={state.context.currentDay}
                        currentNight={state.context.currentNight}
                    />

                    {/* 说书人：Setup 阶段显示分配按钮 */}
                    {role === 'storyteller' && state.matches('setup') && (
                        <button
                            onClick={() => setShowRoleAssignment(true)}
                            className="mt-4 px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-xl text-amber-300 font-medium transition-all hover:scale-105"
                        >
                            分配角色
                        </button>
                    )}
                </div>
            </div>

            {/* 核心游戏区域 */}
            <div className="absolute inset-0 z-10">
                <StageWrapper>
                    <SeatingChart
                        participants={visibleParticipants}
                        onPlayerSelect={handlePlayerSelect}
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
                                    {visibleParticipants.find(p => p.id === selectedPlayerId)?.name}
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

            {/* 角色分配模态框 */}
            <AnimatePresence>
                {showRoleAssignment && role === 'storyteller' && (
                    <RoleAssignment
                        players={participants.map(p => ({
                            id: p.id,
                            name: p.name,
                            characterId: p.character_id
                        }))}
                        onAssignRole={handleAssignRole}
                        onRandomAssign={handleRandomAssign}
                        onBalancedAssign={handleBalancedAssign}
                        onClose={() => setShowRoleAssignment(false)}
                    />
                )}
            </AnimatePresence>

            {/* 夜晚阶段面板 */}
            <AnimatePresence>
                {state.matches('gameLoop.night') && state.context.nightQueue && (
                    <NightPhase
                        nightQueue={state.context.nightQueue}
                        players={state.context.players}
                        onUseAbility={handleUseAbility}
                        onSkipAction={handleSkipNightAction}
                        onEndNight={handleEndNight}
                        isStoryteller={role === 'storyteller'}
                    />
                )}
            </AnimatePresence>

            {/* 白天阶段面板 */}
            <AnimatePresence>
                {typeof state.value === 'object' && 'gameLoop' in state.value &&
                 typeof state.value.gameLoop === 'object' && 'day' in state.value.gameLoop && (
                    <DayPhase
                        machineState={state}
                        players={state.context.players}
                        onEnterNomination={handleEnterNomination}
                        onStartNomination={handleStartNomination}
                        onCancelNomination={handleCancelNomination}
                        onVote={handleVote}
                        onEndVoting={handleEndVoting}
                        onEndDay={handleEndDay}
                        isStoryteller={role === 'storyteller'}
                        currentPlayerId={role === 'player' ? searchParams.get('playerId') || undefined : undefined}
                    />
                )}
            </AnimatePresence>

            {/* 处决阶段面板 */}
            <AnimatePresence>
                {state.matches('gameLoop.execution') && state.context.executionTarget && (
                    <ExecutionPhase
                        nominee={{
                            id: state.context.executionTarget,
                            name: state.context.players.find(p => p.id === state.context.executionTarget)?.name || '',
                            characterId: state.context.players.find(p => p.id === state.context.executionTarget)?.characterId || ''
                        }}
                        nominator={{
                            id: state.context.currentNominatorId || '',
                            name: state.context.players.find(p => p.id === state.context.currentNominatorId)?.name || ''
                        }}
                        votesFor={Object.values(state.context.currentVotes).filter(v => v === true).length}
                        votesAgainst={Object.values(state.context.currentVotes).filter(v => v === false).length}
                        executionThreshold={getExecutionThreshold(state.context.players)}
                        willExecute={
                            Object.values(state.context.currentVotes).filter(v => v === true).length >=
                            getExecutionThreshold(state.context.players)
                        }
                        onConfirmExecution={handleConfirmExecution}
                        onContinue={handleContinueAfterVote}
                        isStoryteller={role === 'storyteller'}
                    />
                )}
            </AnimatePresence>

            {/* 游戏结束面板 */}
            <AnimatePresence>
                {state.matches('gameOver') && (
                    <GameOver
                        winner={state.context.winner}
                        endReason={state.context.endReason}
                        players={state.context.players}
                        currentDay={state.context.currentDay}
                    />
                )}
            </AnimatePresence>

            {/* 游戏信息侧边栏 */}
            <GameInfo
                players={state.context.players}
                currentDay={state.context.currentDay}
                currentNight={state.context.currentNight}
                phase={
                    state.matches('setup') ? 'setup' :
                    state.matches('gameLoop.night') ? 'night' :
                    state.matches('gameLoop.execution') ? 'execution' :
                    state.matches('gameOver') ? 'gameOver' : 'day'
                }
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                showRoles={showRoles}
                onToggleRoles={toggleShowRoles}
                isStoryteller={role === 'storyteller'}
            />

            {/* 玩家角色卡片（仅玩家视角） */}
            {role === 'player' && currentPlayerId && (
                <PlayerRoleCard
                    visible={showRoleCard}
                    characterId={visibleParticipants.find(p => p.id === currentPlayerId)?.character_id || null}
                    playerName={visibleParticipants.find(p => p.id === currentPlayerId)?.name || ''}
                    onClose={() => setShowRoleCard(false)}
                />
            )}
        </div>
    );
}
