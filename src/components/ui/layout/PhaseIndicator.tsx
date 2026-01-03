/**
 * PhaseIndicator - 游戏阶段指示器
 *
 * 显示当前游戏阶段、天数/夜晚数
 * 与 XState 状态机集成
 */

import { Moon, Sun, Skull, Crown, Swords, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GameMachineState } from '../../../logic/machines/gameMachine';

interface PhaseIndicatorProps {
    machineState: GameMachineState;
    currentDay: number;
    currentNight: number;
}

export function PhaseIndicator({ machineState, currentDay, currentNight }: PhaseIndicatorProps) {
    // 根据状态机状态确定阶段
    const getPhaseInfo = () => {
        const stateValue = machineState.value;

        if (stateValue === 'setup') {
            return {
                icon: Crown,
                label: '准备阶段',
                color: 'text-purple-400',
                glow: 'drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]',
                ring: 'ring-purple-400/20'
            };
        }

        if (typeof stateValue === 'object' && 'gameLoop' in stateValue) {
            const gameLoopState = (stateValue as { gameLoop: string }).gameLoop;

            if (gameLoopState === 'night') {
                return {
                    icon: Moon,
                    label: `第 ${currentNight} 夜`,
                    color: 'text-blue-200',
                    glow: 'drop-shadow-[0_0_10px_rgba(191,219,254,0.5)]',
                    ring: 'ring-blue-400/20'
                };
            }

            if (typeof gameLoopState === 'object' && 'day' in gameLoopState) {
                return {
                    icon: Sun,
                    label: `第 ${currentDay} 天`,
                    color: 'text-amber-400',
                    glow: 'drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]',
                    ring: 'ring-amber-400/20'
                };
            }

            if (gameLoopState === 'execution') {
                return {
                    icon: Gavel,
                    label: '处决阶段',
                    color: 'text-red-400',
                    glow: 'drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]',
                    ring: 'ring-red-400/20'
                };
            }
        }

        if (stateValue === 'gameOver') {
            return {
                icon: Skull,
                label: '游戏结束',
                color: 'text-stone-400',
                glow: 'drop-shadow-[0_0_10px_rgba(168,162,158,0.5)]',
                ring: 'ring-stone-400/20'
            };
        }

        // 默认
        return {
            icon: Swords,
            label: '游戏进行中',
            color: 'text-stone-400',
            glow: '',
            ring: 'ring-stone-400/20'
        };
    };

    const { icon: PhaseIcon, label, color, glow, ring } = getPhaseInfo();

    return (
        <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
            <div className={`relative flex flex-col items-center justify-center w-20 h-20 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-2 ${ring}`}>
                <motion.div
                    key={label} // 阶段变化时重新动画
                    initial={{ rotate: -30, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <PhaseIcon className={`w-10 h-10 ${color} ${glow}`} />
                </motion.div>
            </div>

            {/* 阶段标签 */}
            <motion.div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[0.3em] uppercase text-stone-500 font-bold"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {label}
            </motion.div>

            {/* 脉冲动画 (仅夜晚和处决阶段) */}
            {(machineState.matches('gameLoop.night') || machineState.matches('gameLoop.execution')) && (
                <motion.div
                    className={`absolute inset-0 rounded-full border-2 ${color.replace('text-', 'border-')}`}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            )}
        </motion.div>
    );
}
