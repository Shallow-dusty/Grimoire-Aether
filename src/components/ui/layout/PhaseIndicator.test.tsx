/**
 * PhaseIndicator 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseIndicator } from './PhaseIndicator';
import type { GameMachineState } from '../../../logic/machines/gameMachine';

// 创建模拟状态机状态的辅助函数
function createMockState(value: string | object, matchesFn?: (path: string) => boolean): GameMachineState {
    return {
        value,
        context: {} as any,
        matches: matchesFn || ((path: string) => {
            if (typeof value === 'string') {
                return path === value;
            }
            // 对于嵌套状态，简单匹配
            return path.split('.').every((segment, index, segments) => {
                let current: any = value;
                for (let i = 0; i <= index; i++) {
                    if (current && typeof current === 'object') {
                        current = current[segments[i]];
                    } else {
                        return false;
                    }
                }
                return current !== undefined;
            });
        }),
        hasTag: () => false,
        can: () => false,
        toStrings: () => [],
        children: new Map(),
        getMeta: () => ({}),
        toJSON: () => ({})
    } as GameMachineState;
}

describe('PhaseIndicator', () => {
    describe('Setup Phase', () => {
        it('should display setup phase with Crown icon', () => {
            const state = createMockState('setup');
            render(<PhaseIndicator machineState={state} currentDay={0} currentNight={0} />);

            expect(screen.getByText('准备阶段')).toBeInTheDocument();
        });
    });

    describe('Night Phase', () => {
        it('should display night phase with correct night number', () => {
            const state = createMockState(
                { gameLoop: 'night' },
                (path) => path === 'gameLoop.night'
            );
            render(<PhaseIndicator machineState={state} currentDay={1} currentNight={1} />);

            expect(screen.getByText('第 1 夜')).toBeInTheDocument();
        });

        it('should display correct night number for multiple nights', () => {
            const state = createMockState(
                { gameLoop: 'night' },
                (path) => path === 'gameLoop.night'
            );
            render(<PhaseIndicator machineState={state} currentDay={3} currentNight={3} />);

            expect(screen.getByText('第 3 夜')).toBeInTheDocument();
        });
    });

    describe('Day Phase', () => {
        it('should display day phase with correct day number', () => {
            const state = createMockState(
                { gameLoop: { day: 'discussion' } },
                (path) => {
                    if (path === 'gameLoop.day') return true;
                    if (path === 'gameLoop.day.discussion') return true;
                    return false;
                }
            );
            render(<PhaseIndicator machineState={state} currentDay={1} currentNight={1} />);

            expect(screen.getByText('第 1 天')).toBeInTheDocument();
        });

        it('should display correct day number for multiple days', () => {
            const state = createMockState(
                { gameLoop: { day: 'discussion' } },
                (path) => {
                    if (path === 'gameLoop.day') return true;
                    if (path === 'gameLoop.day.discussion') return true;
                    return false;
                }
            );
            render(<PhaseIndicator machineState={state} currentDay={5} currentNight={5} />);

            expect(screen.getByText('第 5 天')).toBeInTheDocument();
        });
    });

    describe('Execution Phase', () => {
        it('should display execution phase', () => {
            const state = createMockState(
                { gameLoop: 'execution' },
                (path) => path === 'gameLoop.execution'
            );
            render(<PhaseIndicator machineState={state} currentDay={2} currentNight={2} />);

            expect(screen.getByText('处决阶段')).toBeInTheDocument();
        });
    });

    describe('Game Over Phase', () => {
        it('should display game over phase', () => {
            const state = createMockState('gameOver');
            render(<PhaseIndicator machineState={state} currentDay={3} currentNight={3} />);

            expect(screen.getByText('游戏结束')).toBeInTheDocument();
        });
    });

    describe('Default/Unknown Phase', () => {
        it('should display default phase for unknown state', () => {
            const state = createMockState('unknownState');
            render(<PhaseIndicator machineState={state} currentDay={1} currentNight={1} />);

            expect(screen.getByText('游戏进行中')).toBeInTheDocument();
        });
    });

    describe('Phase Transitions', () => {
        it('should update when transitioning from setup to night', () => {
            const setupState = createMockState('setup');
            const { rerender } = render(
                <PhaseIndicator machineState={setupState} currentDay={0} currentNight={0} />
            );

            expect(screen.getByText('准备阶段')).toBeInTheDocument();

            const nightState = createMockState(
                { gameLoop: 'night' },
                (path) => path === 'gameLoop.night'
            );
            rerender(
                <PhaseIndicator machineState={nightState} currentDay={1} currentNight={1} />
            );

            expect(screen.getByText('第 1 夜')).toBeInTheDocument();
        });

        it('should update when transitioning from night to day', () => {
            const nightState = createMockState(
                { gameLoop: 'night' },
                (path) => path === 'gameLoop.night'
            );
            const { rerender } = render(
                <PhaseIndicator machineState={nightState} currentDay={1} currentNight={1} />
            );

            expect(screen.getByText('第 1 夜')).toBeInTheDocument();

            const dayState = createMockState(
                { gameLoop: { day: 'discussion' } },
                (path) => path === 'gameLoop.day' || path === 'gameLoop.day.discussion'
            );
            rerender(
                <PhaseIndicator machineState={dayState} currentDay={1} currentNight={1} />
            );

            expect(screen.getByText('第 1 天')).toBeInTheDocument();
        });

        it('should update when transitioning to game over', () => {
            const dayState = createMockState(
                { gameLoop: { day: 'discussion' } },
                (path) => path === 'gameLoop.day' || path === 'gameLoop.day.discussion'
            );
            const { rerender } = render(
                <PhaseIndicator machineState={dayState} currentDay={3} currentNight={3} />
            );

            expect(screen.getByText('第 3 天')).toBeInTheDocument();

            const gameOverState = createMockState('gameOver');
            rerender(
                <PhaseIndicator machineState={gameOverState} currentDay={3} currentNight={3} />
            );

            expect(screen.getByText('游戏结束')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle day 0 correctly (setup phase)', () => {
            const state = createMockState('setup');
            render(<PhaseIndicator machineState={state} currentDay={0} currentNight={0} />);

            expect(screen.getByText('准备阶段')).toBeInTheDocument();
        });

        it('should handle high day numbers correctly', () => {
            const state = createMockState(
                { gameLoop: { day: 'discussion' } },
                (path) => path === 'gameLoop.day' || path === 'gameLoop.day.discussion'
            );
            render(<PhaseIndicator machineState={state} currentDay={15} currentNight={15} />);

            expect(screen.getByText('第 15 天')).toBeInTheDocument();
        });

        it('should handle high night numbers correctly', () => {
            const state = createMockState(
                { gameLoop: 'night' },
                (path) => path === 'gameLoop.night'
            );
            render(<PhaseIndicator machineState={state} currentDay={10} currentNight={10} />);

            expect(screen.getByText('第 10 夜')).toBeInTheDocument();
        });
    });
});
