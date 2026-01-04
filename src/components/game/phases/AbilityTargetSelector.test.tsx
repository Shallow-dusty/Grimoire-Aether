/**
 * AbilityTargetSelector 组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AbilityTargetSelector, getAbilityMetadata } from './AbilityTargetSelector';

const mockCallbacks = {
    onConfirm: vi.fn(),
    onCancel: vi.fn()
};

const mockPlayers = [
    { id: 'p1', name: '玩家1', isDead: false },
    { id: 'p2', name: '玩家2', isDead: false },
    { id: 'p3', name: '玩家3', isDead: false },
    { id: 'p4', name: '玩家4', isDead: true },
    { id: 'p5', name: '玩家5', isDead: false }
];

describe('AbilityTargetSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAbilityMetadata - 能力元数据', () => {
        it('should return correct metadata for imp', () => {
            const metadata = getAbilityMetadata('imp');

            expect(metadata.targetType).toBe('single');
            expect(metadata.hint).toBe('选择一名玩家进行击杀');
            expect(metadata.targetFilter).toBeDefined();
        });

        it('should return correct metadata for fortune_teller', () => {
            const metadata = getAbilityMetadata('fortune_teller');

            expect(metadata.targetType).toBe('double');
            expect(metadata.hint).toBe('选择两名玩家，查看其中是否有恶魔');
        });

        it('should return correct metadata for empath', () => {
            const metadata = getAbilityMetadata('empath');

            expect(metadata.targetType).toBe('none');
            expect(metadata.hint).toBe('自动查看邻居中的邪恶玩家数量');
        });

        it('should return default metadata for unknown character', () => {
            const metadata = getAbilityMetadata('unknown_char' as any);

            expect(metadata.targetType).toBe('none');
            expect(metadata.hint).toBe('该角色能力尚未配置');
        });

        it('should return correct metadata for monk', () => {
            const metadata = getAbilityMetadata('monk');

            expect(metadata.targetType).toBe('single');
            expect(metadata.hint).toContain('不能选择自己');
        });
    });

    describe('Visibility - 显示/隐藏', () => {
        it('should not render when visible is false', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={false}
                    {...mockCallbacks}
                />
            );

            expect(screen.queryByText('小恶魔 - 选择目标')).not.toBeInTheDocument();
        });

        it('should render when visible is true for single target type', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('小恶魔 - 选择目标')).toBeInTheDocument();
        });

        it('should not render for none target type (auto confirm)', () => {
            render(
                <AbilityTargetSelector
                    characterId="empath"
                    characterName="共情者"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // none 类型不会渲染选择器
            expect(screen.queryByText('共情者 - 选择目标')).not.toBeInTheDocument();
        });
    });

    describe('Target Type: none - 自动确认', () => {
        it('should auto confirm for empath after short delay', async () => {
            render(
                <AbilityTargetSelector
                    characterId="empath"
                    characterName="共情者"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            await waitFor(() => {
                expect(mockCallbacks.onConfirm).toHaveBeenCalledWith([]);
            }, { timeout: 200 });
        });

        it('should auto confirm for investigator', async () => {
            render(
                <AbilityTargetSelector
                    characterId="investigator"
                    characterName="调查员"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            await waitFor(() => {
                expect(mockCallbacks.onConfirm).toHaveBeenCalledWith([]);
            }, { timeout: 200 });
        });
    });

    describe('Target Type: single - 单目标选择', () => {
        it('should display hint text for imp', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('选择一名玩家进行击杀')).toBeInTheDocument();
        });

        it('should display all available players', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // 小恶魔可以选择所有存活玩家（过滤掉 p4 已死亡）
            expect(screen.getByText('玩家1')).toBeInTheDocument();
            expect(screen.getByText('玩家2')).toBeInTheDocument();
            expect(screen.getByText('玩家3')).toBeInTheDocument();
            expect(screen.queryByText('玩家4')).not.toBeInTheDocument(); // 已死亡，被过滤
            expect(screen.getByText('玩家5')).toBeInTheDocument();
        });

        it('should select player on click', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const player2Button = screen.getByText('玩家2').closest('button');
            fireEvent.click(player2Button!);

            // 应该显示选择计数器
            expect(screen.getByText('已选择: 1 / 1')).toBeInTheDocument();
        });

        it('should deselect player on second click', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const player2Button = screen.getByText('玩家2').closest('button');

            // 第一次点击选择
            fireEvent.click(player2Button!);
            expect(screen.getByText('已选择: 1 / 1')).toBeInTheDocument();

            // 第二次点击取消选择
            fireEvent.click(player2Button!);
            expect(screen.getByText('已选择: 0 / 1')).toBeInTheDocument();
        });

        it('should enable confirm button when 1 player selected', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const confirmButton = screen.getByText('确认').closest('button');
            expect(confirmButton).toBeDisabled();

            const player2Button = screen.getByText('玩家2').closest('button');
            fireEvent.click(player2Button!);

            expect(confirmButton).not.toBeDisabled();
        });

        it('should call onConfirm with selected player', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const player2Button = screen.getByText('玩家2').closest('button');
            fireEvent.click(player2Button!);

            const confirmButton = screen.getByText('确认').closest('button');
            fireEvent.click(confirmButton!);

            expect(mockCallbacks.onConfirm).toHaveBeenCalledWith(['p2']);
        });
    });

    describe('Target Type: double - 双目标选择', () => {
        it('should display hint text for fortune_teller', () => {
            render(
                <AbilityTargetSelector
                    characterId="fortune_teller"
                    characterName="占卜师"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('选择两名玩家，查看其中是否有恶魔')).toBeInTheDocument();
        });

        it('should require 2 players to enable confirm', () => {
            render(
                <AbilityTargetSelector
                    characterId="fortune_teller"
                    characterName="占卜师"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const confirmButton = screen.getByText('确认').closest('button');
            expect(confirmButton).toBeDisabled();

            // 选择第一个玩家
            const player1Button = screen.getByText('玩家1').closest('button');
            fireEvent.click(player1Button!);
            expect(screen.getByText('已选择: 1 / 2')).toBeInTheDocument();
            expect(confirmButton).toBeDisabled();

            // 选择第二个玩家
            const player2Button = screen.getByText('玩家2').closest('button');
            fireEvent.click(player2Button!);
            expect(screen.getByText('已选择: 2 / 2')).toBeInTheDocument();
            expect(confirmButton).not.toBeDisabled();
        });

        it('should display selection order', () => {
            render(
                <AbilityTargetSelector
                    characterId="fortune_teller"
                    characterName="占卜师"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // 选择两个玩家
            const player1Button = screen.getByText('玩家1').closest('button');
            const player2Button = screen.getByText('玩家2').closest('button');

            fireEvent.click(player1Button!);
            fireEvent.click(player2Button!);

            // 应该显示选择顺序 1 和 2
            const selectionIndicators = screen.getAllByText(/^[12]$/);
            expect(selectionIndicators.length).toBe(2);
        });

        it('should replace oldest selection when selecting 3rd player', () => {
            render(
                <AbilityTargetSelector
                    characterId="fortune_teller"
                    characterName="占卜师"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const player1Button = screen.getByText('玩家1').closest('button');
            const player2Button = screen.getByText('玩家2').closest('button');
            const player3Button = screen.getByText('玩家3').closest('button');

            // 选择 p1, p2
            fireEvent.click(player1Button!);
            fireEvent.click(player2Button!);

            // 选择 p3 应该替换 p1
            fireEvent.click(player3Button!);

            // 确认应该包含 p2 和 p3
            const confirmButton = screen.getByText('确认').closest('button');
            fireEvent.click(confirmButton!);

            expect(mockCallbacks.onConfirm).toHaveBeenCalledWith(['p2', 'p3']);
        });

        it('should call onConfirm with 2 selected players', () => {
            render(
                <AbilityTargetSelector
                    characterId="fortune_teller"
                    characterName="占卜师"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const player1Button = screen.getByText('玩家1').closest('button');
            const player2Button = screen.getByText('玩家2').closest('button');

            fireEvent.click(player1Button!);
            fireEvent.click(player2Button!);

            const confirmButton = screen.getByText('确认').closest('button');
            fireEvent.click(confirmButton!);

            expect(mockCallbacks.onConfirm).toHaveBeenCalledWith(['p1', 'p2']);
        });
    });

    describe('Target Filters - 目标过滤', () => {
        it('should filter out actor for monk ability', () => {
            render(
                <AbilityTargetSelector
                    characterId="monk"
                    characterName="僧侣"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // 僧侣不能选择自己（p1）
            expect(screen.queryByText('玩家1')).not.toBeInTheDocument();
            expect(screen.getByText('玩家2')).toBeInTheDocument();
            expect(screen.getByText('玩家3')).toBeInTheDocument();
        });

        it('should filter out dead players for imp', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // p4 已死亡，不应该显示
            expect(screen.queryByText('玩家4')).not.toBeInTheDocument();
        });

        it('should show no targets message when all filtered out', () => {
            const allDeadPlayers = mockPlayers.map(p => ({ ...p, isDead: true }));

            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={allDeadPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('没有可选择的目标')).toBeInTheDocument();
        });
    });

    describe('Cancel Actions - 取消操作', () => {
        it('should call onCancel when clicking cancel button', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            const cancelButtons = screen.getAllByText('取消');
            fireEvent.click(cancelButtons[0]);

            expect(mockCallbacks.onCancel).toHaveBeenCalled();
        });

        it('should call onCancel when clicking X button', () => {
            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // X 按钮在标题栏
            const closeButton = screen.getByRole('button', { name: '' });
            fireEvent.click(closeButton);

            expect(mockCallbacks.onCancel).toHaveBeenCalled();
        });

        it('should call onCancel when clicking backdrop', () => {
            const { container } = render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // 背景遮罩是第一个固定定位的 div
            const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/60');
            fireEvent.click(backdrop!);

            expect(mockCallbacks.onCancel).toHaveBeenCalled();
        });
    });

    describe('Edge Cases - 边缘案例', () => {
        it('should handle single alive player scenario', () => {
            const singlePlayer = [{ id: 'p1', name: '玩家1', isDead: false }];

            render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={singlePlayer}
                    actorId="p2"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('玩家1')).toBeInTheDocument();
        });

        it('should reset selections when visibility changes', () => {
            const { rerender } = render(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // 选择一个玩家
            const player2Button = screen.getByText('玩家2').closest('button');
            fireEvent.click(player2Button!);
            expect(screen.getByText('已选择: 1 / 1')).toBeInTheDocument();

            // 隐藏然后重新显示
            rerender(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={false}
                    {...mockCallbacks}
                />
            );

            rerender(
                <AbilityTargetSelector
                    characterId="imp"
                    characterName="小恶魔"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            // 选择应该被重置
            expect(screen.getByText('已选择: 0 / 1')).toBeInTheDocument();
        });

        it('should handle different character abilities correctly', () => {
            // 测试僧侣（单选，不能选择自己）
            const { rerender } = render(
                <AbilityTargetSelector
                    characterId="monk"
                    characterName="僧侣"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.queryByText('玩家1')).not.toBeInTheDocument();

            // 切换到管家（单选，可以选择任何存活玩家）
            rerender(
                <AbilityTargetSelector
                    characterId="butler"
                    characterName="管家"
                    players={mockPlayers}
                    actorId="p1"
                    visible={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('玩家1')).toBeInTheDocument();
        });
    });
});
