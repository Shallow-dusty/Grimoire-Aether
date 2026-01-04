/**
 * NightPhase 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NightPhase } from './NightPhase';
import type { NightQueue } from '../../../logic/night/nightActions';

// Mock useUIStore
vi.mock('../../../logic/stores/uiStore', () => ({
    useUIStore: () => ({
        nightActionInProgress: false,
        setNightActionInProgress: vi.fn()
    })
}));

// 创建测试数据
const mockPlayers = [
    { id: 'p1', name: '玩家1', characterId: 'washerwoman', isDead: false },
    { id: 'p2', name: '玩家2', characterId: 'fortune_teller', isDead: false },
    { id: 'p3', name: '玩家3', characterId: 'empath', isDead: false },
    { id: 'p4', name: '玩家4', characterId: 'imp', isDead: false }
];

const createMockNightQueue = (currentIndex: number = 0, isFirstNight: boolean = true): NightQueue => ({
    night: 1,
    isFirstNight,
    currentIndex,
    actions: [
        { playerId: 'p1', characterId: 'washerwoman', order: 2 },
        { playerId: 'p2', characterId: 'fortune_teller', order: 5 },
        { playerId: 'p3', characterId: 'empath', order: 8 },
        { playerId: 'p4', characterId: 'imp', order: 10 }
    ]
});

const mockCallbacks = {
    onUseAbility: vi.fn(),
    onSkipAction: vi.fn(),
    onEndNight: vi.fn()
};

describe('NightPhase', () => {
    describe('Rendering - First Night', () => {
        it('should display first night title', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('首夜')).toBeInTheDocument();
        });

        it('should display progress information', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText(/进度: 0 \/ 4/)).toBeInTheDocument();
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should display current character and player', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            // 应该显示洗衣妇（当前行动角色）
            expect(screen.getByText('洗衣妇')).toBeInTheDocument();
            expect(screen.getByText('(玩家1)')).toBeInTheDocument();
        });

        it('should display character ability text', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            // 应该显示能力描述（洗衣妇的能力文本包含"镇民"）
            const abilityText = screen.getByText(/镇民/);
            expect(abilityText).toBeInTheDocument();
            expect(abilityText).toHaveClass('text-sm', 'text-blue-300/80');
        });

        it('should display action order', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('行动顺序')).toBeInTheDocument();
            // 检查行动顺序卡片中的数字（使用更精确的查询）
            const orderLabel = screen.getByText('行动顺序');
            const orderCard = orderLabel.closest('div');
            expect(orderCard).toHaveTextContent('2');
        });
    });

    describe('Rendering - Other Nights', () => {
        it('should display night number for non-first nights', () => {
            const nightQueue = createMockNightQueue(0, false);
            nightQueue.night = 3;

            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('第 3 夜')).toBeInTheDocument();
        });
    });

    describe('Storyteller Controls', () => {
        it('should show storyteller control buttons', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByRole('button', { name: /执行能力/ })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /跳过/ })).toBeInTheDocument();
        });

        it('should call onUseAbility when clicking execute button', async () => {
            const onUseAbility = vi.fn();
            const nightQueue = createMockNightQueue(0, true);

            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                    onUseAbility={onUseAbility}
                />
            );

            const executeButton = screen.getByRole('button', { name: /执行能力/ });
            fireEvent.click(executeButton);

            // washerwoman 是 targetType: 'none'，会自动在 100ms 后调用 onConfirm
            await waitFor(() => {
                expect(onUseAbility).toHaveBeenCalledWith('p1', []);
            }, { timeout: 200 });
        });

        it('should call onSkipAction when clicking skip button', () => {
            const onSkipAction = vi.fn();
            const nightQueue = createMockNightQueue(0, true);

            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                    onSkipAction={onSkipAction}
                />
            );

            const skipButton = screen.getByRole('button', { name: /跳过/ });
            fireEvent.click(skipButton);

            expect(onSkipAction).toHaveBeenCalled();
        });

        it('should not show storyteller controls for players', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={false}
                    {...mockCallbacks}
                />
            );

            expect(screen.queryByRole('button', { name: /执行能力/ })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /跳过/ })).not.toBeInTheDocument();
        });
    });

    describe('Player View', () => {
        it('should show waiting message for players', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={false}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText(/等待说书人执行夜晚行动.../)).toBeInTheDocument();
        });
    });

    describe('Progress Tracking', () => {
        it('should update progress when moving through actions', () => {
            const nightQueue = createMockNightQueue(2, true); // 第3个行动
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText(/进度: 2 \/ 4/)).toBeInTheDocument();
            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        it('should show correct character at different indices', () => {
            const nightQueue = createMockNightQueue(1, true); // 第2个行动
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            // 应该显示占卜师（第2个行动）
            expect(screen.getByText('占卜师')).toBeInTheDocument();
            expect(screen.getByText('(玩家2)')).toBeInTheDocument();
        });
    });

    describe('Completion State', () => {
        it('should show completion message when all actions done', () => {
            const nightQueue = createMockNightQueue(4, true); // 超过总数
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('夜晚行动完成')).toBeInTheDocument();
            expect(screen.getByText('所有角色能力已执行完毕')).toBeInTheDocument();
        });

        it('should show end night button for storyteller when complete', () => {
            const nightQueue = createMockNightQueue(4, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByRole('button', { name: /结束夜晚，进入白天/ })).toBeInTheDocument();
        });

        it('should call onEndNight when clicking end night button', () => {
            const onEndNight = vi.fn();
            const nightQueue = createMockNightQueue(4, true);

            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                    onEndNight={onEndNight}
                />
            );

            const endButton = screen.getByRole('button', { name: /结束夜晚，进入白天/ });
            fireEvent.click(endButton);

            expect(onEndNight).toHaveBeenCalled();
        });

        it('should not show end night button for players', () => {
            const nightQueue = createMockNightQueue(4, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={false}
                    {...mockCallbacks}
                />
            );

            expect(screen.queryByRole('button', { name: /结束夜晚/ })).not.toBeInTheDocument();
        });
    });

    describe('Action Queue Preview', () => {
        it('should show action queue toggle', () => {
            const nightQueue = createMockNightQueue(0, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('查看完整行动队列')).toBeInTheDocument();
        });

        it('should not show queue preview when all actions complete', () => {
            const nightQueue = createMockNightQueue(4, true);
            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.queryByText('查看完整行动队列')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty action queue', () => {
            const emptyQueue: NightQueue = {
                night: 1,
                isFirstNight: true,
                currentIndex: 0,
                actions: []
            };

            render(
                <NightPhase
                    nightQueue={emptyQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('夜晚行动完成')).toBeInTheDocument();
        });

        it('should handle high night numbers', () => {
            const nightQueue = createMockNightQueue(0, false);
            nightQueue.night = 15;

            render(
                <NightPhase
                    nightQueue={nightQueue}
                    players={mockPlayers}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('第 15 夜')).toBeInTheDocument();
        });
    });
});
