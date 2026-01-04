/**
 * ExecutionPhase 组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionPhase, type ExecutionPhaseProps } from './ExecutionPhase';

const mockCallbacks = {
    onConfirmExecution: vi.fn(),
    onContinue: vi.fn()
};

const baseProps: ExecutionPhaseProps = {
    nominee: {
        id: 'p1',
        name: '玩家1',
        characterId: 'fortune_teller'
    },
    nominator: {
        id: 'p2',
        name: '玩家2'
    },
    votesFor: 4,
    votesAgainst: 3,
    executionThreshold: 4,
    willExecute: true,
    isStoryteller: true,
    ...mockCallbacks
};

describe('ExecutionPhase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Execution Success - 处决成功', () => {
        it('should display execution success banner', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('处决通过')).toBeInTheDocument();
            expect(screen.getByText('玩家1 将被处决')).toBeInTheDocument();
        });

        it('should show confirm execution button for storyteller', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('确认处决，继续游戏')).toBeInTheDocument();
        });

        it('should call onConfirmExecution when clicking button', () => {
            render(<ExecutionPhase {...baseProps} />);

            const button = screen.getByText('确认处决，继续游戏');
            fireEvent.click(button);

            expect(mockCallbacks.onConfirmExecution).toHaveBeenCalled();
        });

        it('should display character reveal', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('角色揭示')).toBeInTheDocument();
            // 角色名称会出现在两个地方：提名信息和角色揭示，使用 getAllByText
            const fortuneTellerTexts = screen.getAllByText('占卜师');
            expect(fortuneTellerTexts.length).toBeGreaterThanOrEqual(1);
        });

        it('should display character ability text', () => {
            render(<ExecutionPhase {...baseProps} />);

            // 占卜师的能力描述包含"恶魔"
            expect(screen.getByText(/恶魔/)).toBeInTheDocument();
        });
    });

    describe('Execution Failed - 处决失败', () => {
        const failedProps: ExecutionPhaseProps = {
            ...baseProps,
            votesFor: 3,
            willExecute: false
        };

        it('should display execution failed banner', () => {
            render(<ExecutionPhase {...failedProps} />);

            expect(screen.getByText('处决失败')).toBeInTheDocument();
            expect(screen.getByText('玩家1 幸存')).toBeInTheDocument();
        });

        it('should show continue button for storyteller', () => {
            render(<ExecutionPhase {...failedProps} />);

            expect(screen.getByText('继续提名流程')).toBeInTheDocument();
        });

        it('should call onContinue when clicking button', () => {
            render(<ExecutionPhase {...failedProps} />);

            const button = screen.getByText('继续提名流程');
            fireEvent.click(button);

            expect(mockCallbacks.onContinue).toHaveBeenCalled();
        });

        it('should not display character reveal when failed', () => {
            render(<ExecutionPhase {...failedProps} />);

            expect(screen.queryByText('角色揭示')).not.toBeInTheDocument();
        });
    });

    describe('Nomination Info - 提名信息', () => {
        it('should display nominator name', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('提名者：')).toBeInTheDocument();
            expect(screen.getByText('玩家2')).toBeInTheDocument();
        });

        it('should display nominee name', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('被提名者：')).toBeInTheDocument();
            expect(screen.getByText('玩家1')).toBeInTheDocument();
        });

        it('should display real character when execution succeeds', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('真实角色：')).toBeInTheDocument();
        });
    });

    describe('Vote Statistics - 投票统计', () => {
        it('should display votes for count', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('赞成')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
        });

        it('should display votes against count', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('反对')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('should display execution threshold', () => {
            render(<ExecutionPhase {...baseProps} />);

            expect(screen.getByText('所需票数：')).toBeInTheDocument();
            expect(screen.getByText('4 / 4')).toBeInTheDocument();
        });

        it('should show threshold comparison when votes are below', () => {
            const props = {
                ...baseProps,
                votesFor: 3,
                willExecute: false
            };

            render(<ExecutionPhase {...props} />);

            expect(screen.getByText('3 / 4')).toBeInTheDocument();
        });
    });

    describe('Player View - 玩家视角', () => {
        it('should not show control buttons for players', () => {
            const playerProps = {
                ...baseProps,
                isStoryteller: false
            };

            render(<ExecutionPhase {...playerProps} />);

            expect(screen.queryByText('确认处决，继续游戏')).not.toBeInTheDocument();
        });

        it('should show waiting message for players', () => {
            const playerProps = {
                ...baseProps,
                isStoryteller: false
            };

            render(<ExecutionPhase {...playerProps} />);

            expect(screen.getByText(/等待说书人确认并继续游戏/)).toBeInTheDocument();
        });
    });

    describe('Edge Cases - 边缘案例', () => {
        it('should handle exact threshold votes', () => {
            const props = {
                ...baseProps,
                votesFor: 4,
                executionThreshold: 4,
                willExecute: true
            };

            render(<ExecutionPhase {...props} />);

            expect(screen.getByText('处决通过')).toBeInTheDocument();
        });

        it('should handle one vote below threshold', () => {
            const props = {
                ...baseProps,
                votesFor: 3,
                executionThreshold: 4,
                willExecute: false
            };

            render(<ExecutionPhase {...props} />);

            expect(screen.getByText('处决失败')).toBeInTheDocument();
        });

        it('should handle high vote counts', () => {
            const props = {
                ...baseProps,
                votesFor: 12,
                votesAgainst: 3,
                executionThreshold: 8,
                willExecute: true
            };

            render(<ExecutionPhase {...props} />);

            expect(screen.getByText('12')).toBeInTheDocument();
            expect(screen.getByText('12 / 8')).toBeInTheDocument();
        });

        it('should handle unanimous votes', () => {
            const props = {
                ...baseProps,
                votesFor: 7,
                votesAgainst: 0,
                executionThreshold: 4,
                willExecute: true
            };

            render(<ExecutionPhase {...props} />);

            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('should handle different characters', () => {
            const props = {
                ...baseProps,
                nominee: {
                    ...baseProps.nominee,
                    characterId: 'imp'
                }
            };

            render(<ExecutionPhase {...props} />);

            // 角色名称可能在多个地方出现
            const impTexts = screen.getAllByText('小恶魔');
            expect(impTexts.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Animation and Styling - 动画和样式', () => {
        it('should render with proper structure', () => {
            const { container } = render(<ExecutionPhase {...baseProps} />);

            // 检查主容器存在
            expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
        });

        it('should render vote statistics grid', () => {
            const { container } = render(<ExecutionPhase {...baseProps} />);

            // 检查网格布局存在
            expect(container.querySelector('.grid-cols-2')).toBeInTheDocument();
        });
    });
});
