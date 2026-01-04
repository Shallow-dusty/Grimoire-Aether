/**
 * GameOver 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOver } from './GameOver';
import { Team } from '../../../types/game';

// 创建测试数据
const mockPlayers = [
    { id: 'p1', name: '玩家1', characterId: 'washerwoman', isDead: false },
    { id: 'p2', name: '玩家2', characterId: 'fortune_teller', isDead: true },
    { id: 'p3', name: '玩家3', characterId: 'butler', isDead: false },
    { id: 'p4', name: '玩家4', characterId: 'poisoner', isDead: true },
    { id: 'p5', name: '玩家5', characterId: 'imp', isDead: true }
];

describe('GameOver', () => {
    describe('Good Team Victory', () => {
        it('should display good team victory message', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText('善良阵营胜利！')).toBeInTheDocument();
        });

        it('should display end reason', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText('恶魔已被处决')).toBeInTheDocument();
        });

        it('should show emerald/blue gradient for good victory', () => {
            const { container } = render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            const banner = container.querySelector('.from-emerald-900');
            expect(banner).toBeInTheDocument();
        });
    });

    describe('Evil Team Victory', () => {
        it('should display evil team victory message', () => {
            render(
                <GameOver
                    winner={Team.DEMON}
                    endReason="镇民数量不足"
                    players={mockPlayers}
                    currentDay={5}
                />
            );

            expect(screen.getByText('邪恶阵营胜利！')).toBeInTheDocument();
        });

        it('should show red/purple gradient for evil victory', () => {
            const { container } = render(
                <GameOver
                    winner={Team.DEMON}
                    endReason="镇民数量不足"
                    players={mockPlayers}
                    currentDay={5}
                />
            );

            const banner = container.querySelector('.from-red-900');
            expect(banner).toBeInTheDocument();
        });
    });

    describe('Game Statistics', () => {
        it('should display game duration in days', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={7}
                />
            );

            expect(screen.getByText(/存活 7 天/)).toBeInTheDocument();
        });

        it('should display total player count', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText(/5 名玩家/)).toBeInTheDocument();
        });

        it('should display death count', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            // 3人死亡 (fortune_teller, poisoner, imp)
            expect(screen.getByText(/3 人死亡/)).toBeInTheDocument();
        });
    });

    describe('Role Revelation', () => {
        it('should display role revelation title', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText('角色揭示')).toBeInTheDocument();
        });

        it('should display good team section', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText('善良阵营')).toBeInTheDocument();
        });

        it('should display evil team section', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText('邪恶阵营')).toBeInTheDocument();
        });

        it('should display all player names', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            mockPlayers.forEach(player => {
                expect(screen.getByText(player.name)).toBeInTheDocument();
            });
        });

        it('should display all character names', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText('洗衣妇')).toBeInTheDocument();
            expect(screen.getByText('占卜师')).toBeInTheDocument();
            expect(screen.getByText('管家')).toBeInTheDocument();
            expect(screen.getByText('投毒者')).toBeInTheDocument();
            expect(screen.getByText('小恶魔')).toBeInTheDocument();
        });

        it('should display team labels', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText('镇民')).toBeInTheDocument();
            expect(screen.getByText('外来者')).toBeInTheDocument();
            expect(screen.getByText('爪牙')).toBeInTheDocument();
            expect(screen.getByText('恶魔')).toBeInTheDocument();
        });

        it('should indicate dead players with skull icon', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            // 检查角色揭示区域的骷髅图标（不包括顶部统计的骷髅）
            const roleRevelationSection = screen.getByText('角色揭示').closest('div');
            const skullIcons = roleRevelationSection?.querySelectorAll('.lucide-skull');
            expect(skullIcons?.length).toBe(3); // 3个死亡玩家
        });
    });

    describe('Restart Button', () => {
        it('should display restart button when onRestart provided', () => {
            const onRestart = vi.fn();
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                    onRestart={onRestart}
                />
            );

            expect(screen.getByRole('button', { name: /返回大厅/ })).toBeInTheDocument();
        });

        it('should not display restart button when onRestart not provided', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            expect(screen.queryByRole('button', { name: /返回大厅/ })).not.toBeInTheDocument();
        });

        it('should call onRestart when clicking restart button', () => {
            const onRestart = vi.fn();
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="恶魔已被处决"
                    players={mockPlayers}
                    currentDay={3}
                    onRestart={onRestart}
                />
            );

            const restartButton = screen.getByRole('button', { name: /返回大厅/ });
            fireEvent.click(restartButton);

            expect(onRestart).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle null winner', () => {
            render(
                <GameOver
                    winner={null}
                    endReason="游戏强制结束"
                    players={mockPlayers}
                    currentDay={1}
                />
            );

            // 应该默认显示邪恶阵营胜利（因为 null 不是 TOWNSFOLK 或 OUTSIDER）
            expect(screen.getByText('邪恶阵营胜利！')).toBeInTheDocument();
        });

        it('should handle null end reason', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason={null}
                    players={mockPlayers}
                    currentDay={3}
                />
            );

            // 应该不崩溃，只是不显示结束原因
            expect(screen.queryByText('null')).not.toBeInTheDocument();
        });

        it('should handle day 0', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="测试"
                    players={mockPlayers}
                    currentDay={0}
                />
            );

            expect(screen.getByText(/存活 0 天/)).toBeInTheDocument();
        });

        it('should handle high day numbers', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="漫长的游戏"
                    players={mockPlayers}
                    currentDay={50}
                />
            );

            expect(screen.getByText(/存活 50 天/)).toBeInTheDocument();
        });

        it('should handle all players alive', () => {
            const alivePlayers = mockPlayers.map(p => ({ ...p, isDead: false }));
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="完美游戏"
                    players={alivePlayers}
                    currentDay={3}
                />
            );

            expect(screen.getByText(/0 人死亡/)).toBeInTheDocument();
        });

        it('should handle all players dead', () => {
            const deadPlayers = mockPlayers.map(p => ({ ...p, isDead: true }));
            render(
                <GameOver
                    winner={Team.DEMON}
                    endReason="全灭"
                    players={deadPlayers}
                    currentDay={5}
                />
            );

            expect(screen.getByText(/5 人死亡/)).toBeInTheDocument();
        });

        it('should handle empty player list', () => {
            render(
                <GameOver
                    winner={Team.TOWNSFOLK}
                    endReason="无玩家"
                    players={[]}
                    currentDay={1}
                />
            );

            expect(screen.getByText(/0 名玩家/)).toBeInTheDocument();
            expect(screen.getByText(/0 人死亡/)).toBeInTheDocument();
        });
    });
});
