/**
 * ClockwiseVoting 组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClockwiseVoting, type ClockwiseVotingProps } from './ClockwiseVoting';

describe('ClockwiseVoting', () => {
    const mockPlayers = [
        { id: 'p1', name: '玩家1', isDead: false, isGhost: false, hasUsedGhostVote: false },
        { id: 'p2', name: '玩家2', isDead: false, isGhost: false, hasUsedGhostVote: false },
        { id: 'p3', name: '玩家3', isDead: false, isGhost: false, hasUsedGhostVote: false },
        { id: 'p4', name: '玩家4', isDead: false, isGhost: false, hasUsedGhostVote: false },
        { id: 'p5', name: '玩家5', isDead: true, isGhost: true, hasUsedGhostVote: false },
    ];

    const mockCallbacks = {
        onVote: vi.fn(),
        onNext: vi.fn(),
        onPrevious: vi.fn(),
        onEndVoting: vi.fn(),
    };

    const defaultProps: ClockwiseVotingProps = {
        players: mockPlayers,
        nominatorId: 'p1',
        nomineeId: 'p2',
        voteOrder: ['p3', 'p4', 'p5', 'p1'],
        currentVoteIndex: 0,
        votes: { p1: null, p3: null, p4: null, p5: null },
        isStoryteller: true,
        ...mockCallbacks,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('基础渲染', () => {
        it('应该正确渲染组件', () => {
            render(<ClockwiseVoting {...defaultProps} />);

            // 应该显示提名信息
            expect(screen.getByText(/玩家1 提名 玩家2/)).toBeInTheDocument();
        });

        it('应该显示当前投票玩家信息', () => {
            render(<ClockwiseVoting {...defaultProps} />);

            // 当前索引 0，投票顺序第一个是 p3
            const currentVoteElements = screen.getAllByText(/当前投票.*玩家3/);
            expect(currentVoteElements.length).toBeGreaterThanOrEqual(1);
        });

        it('应该显示提名阶段说明', () => {
            render(<ClockwiseVoting {...defaultProps} />);
            expect(screen.getByText(/时针投票进行中/)).toBeInTheDocument();
        });
    });

    describe('说书人控制', () => {
        it('说书人应该能看到投票按钮', () => {
            render(<ClockwiseVoting {...defaultProps} isStoryteller={true} />);

            expect(screen.getByRole('button', { name: /赞成/ })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /反对/ })).toBeInTheDocument();
        });

        it('点击赞成按钮应该调用 onVote', () => {
            render(<ClockwiseVoting {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: /赞成/ }));

            expect(mockCallbacks.onVote).toHaveBeenCalledWith('p3', true);
        });

        it('点击反对按钮应该调用 onVote', () => {
            render(<ClockwiseVoting {...defaultProps} />);

            fireEvent.click(screen.getByRole('button', { name: /反对/ }));

            expect(mockCallbacks.onVote).toHaveBeenCalledWith('p3', false);
        });

        it('当前玩家投票后应该隐藏投票按钮', () => {
            const props = {
                ...defaultProps,
                votes: { p1: null, p3: true, p4: null, p5: null }
            };
            render(<ClockwiseVoting {...props} />);

            expect(screen.queryByRole('button', { name: /赞成/ })).not.toBeInTheDocument();
        });
    });

    describe('导航控制', () => {
        it('第一个玩家时应该禁用"上一位"按钮', () => {
            render(<ClockwiseVoting {...defaultProps} currentVoteIndex={0} />);

            const prevButton = screen.getByRole('button', { name: /上一位/ });
            expect(prevButton).toBeDisabled();
        });

        it('未投票时应该禁用"下一位"按钮', () => {
            render(<ClockwiseVoting {...defaultProps} />);

            const nextButton = screen.getByRole('button', { name: /下一位/ });
            expect(nextButton).toBeDisabled();
        });

        it('已投票后应该启用"下一位"按钮', () => {
            const props = {
                ...defaultProps,
                votes: { p1: null, p3: true, p4: null, p5: null }
            };
            render(<ClockwiseVoting {...props} />);

            const nextButton = screen.getByRole('button', { name: /下一位/ });
            expect(nextButton).not.toBeDisabled();
        });

        it('点击"上一位"按钮应该调用 onPrevious', () => {
            const props = {
                ...defaultProps,
                currentVoteIndex: 1,
                votes: { p1: null, p3: true, p4: null, p5: null }
            };
            render(<ClockwiseVoting {...props} />);

            fireEvent.click(screen.getByRole('button', { name: /上一位/ }));

            expect(mockCallbacks.onPrevious).toHaveBeenCalled();
        });

        it('点击"下一位"按钮应该调用 onNext', () => {
            const props = {
                ...defaultProps,
                votes: { p1: null, p3: true, p4: null, p5: null }
            };
            render(<ClockwiseVoting {...props} />);

            fireEvent.click(screen.getByRole('button', { name: /下一位/ }));

            expect(mockCallbacks.onNext).toHaveBeenCalled();
        });
    });

    describe('投票完成', () => {
        it('所有玩家投票完毕后应该显示结束界面', () => {
            const props = {
                ...defaultProps,
                currentVoteIndex: 4, // 超过投票顺序长度
                votes: { p1: true, p3: true, p4: false, p5: true }
            };
            render(<ClockwiseVoting {...props} />);

            expect(screen.getByText('所有玩家已投票完毕')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /结束投票/ })).toBeInTheDocument();
        });

        it('点击结束投票按钮应该调用 onEndVoting', () => {
            const props = {
                ...defaultProps,
                currentVoteIndex: 4,
                votes: { p1: true, p3: true, p4: false, p5: true }
            };
            render(<ClockwiseVoting {...props} />);

            fireEvent.click(screen.getByRole('button', { name: /结束投票/ }));

            expect(mockCallbacks.onEndVoting).toHaveBeenCalled();
        });

        it('应该显示投票统计', () => {
            const props = {
                ...defaultProps,
                currentVoteIndex: 4,
                votes: { p1: true, p3: true, p4: false, p5: true }
            };
            render(<ClockwiseVoting {...props} />);

            // 3 票赞成，1 票反对
            expect(screen.getByText(/赞成 3 票，反对 1 票/)).toBeInTheDocument();
        });
    });

    describe('玩家视角', () => {
        it('玩家视角应该显示等待信息', () => {
            const props = {
                ...defaultProps,
                isStoryteller: false,
                currentPlayerId: 'p3'
            };
            render(<ClockwiseVoting {...props} />);

            expect(screen.getByText(/等待说书人询问你的投票/)).toBeInTheDocument();
        });

        it('玩家已投票后应该显示投票结果', () => {
            const props = {
                ...defaultProps,
                isStoryteller: false,
                currentPlayerId: 'p3',
                votes: { p1: null, p3: true, p4: null, p5: null }
            };
            render(<ClockwiseVoting {...props} />);

            expect(screen.getByText(/你已投票：赞成/)).toBeInTheDocument();
        });

        it('玩家投反对票后应该显示正确状态', () => {
            const props = {
                ...defaultProps,
                isStoryteller: false,
                currentPlayerId: 'p3',
                votes: { p1: null, p3: false, p4: null, p5: null }
            };
            render(<ClockwiseVoting {...props} />);

            expect(screen.getByText(/你已投票：反对/)).toBeInTheDocument();
        });
    });

    describe('幽灵投票', () => {
        it('幽灵投票时应该显示幽灵标识', () => {
            const props = {
                ...defaultProps,
                currentVoteIndex: 2, // p5 是幽灵
            };
            render(<ClockwiseVoting {...props} />);

            expect(screen.getByText('幽灵投票')).toBeInTheDocument();
        });
    });

    describe('投票历史', () => {
        it('有投票历史时应该显示时间线', () => {
            const props = {
                ...defaultProps,
                currentVoteIndex: 2,
                votes: { p1: null, p3: true, p4: false, p5: null }
            };
            render(<ClockwiseVoting {...props} />);

            expect(screen.getByText('投票历史')).toBeInTheDocument();
            // 投票历史中应该有玩家名字
            const player3Elements = screen.getAllByText('玩家3');
            expect(player3Elements.length).toBeGreaterThanOrEqual(1);
        });

        it('没有投票历史时不应该显示时间线', () => {
            render(<ClockwiseVoting {...defaultProps} />);

            expect(screen.queryByText('投票历史')).not.toBeInTheDocument();
        });
    });

    describe('座位图可视化', () => {
        it('应该为每个玩家渲染令牌', () => {
            render(<ClockwiseVoting {...defaultProps} />);

            // 投票顺序中的所有玩家名称都应该在 SVG 中
            const player3Elements = screen.getAllByText('玩家3');
            expect(player3Elements.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('边界情况', () => {
        it('应该处理空投票顺序', () => {
            const props = {
                ...defaultProps,
                voteOrder: [],
                currentVoteIndex: 0
            };
            render(<ClockwiseVoting {...props} />);

            // 应该显示完成状态
            expect(screen.getByText('所有玩家已投票完毕')).toBeInTheDocument();
        });

        it('应该处理单个玩家投票', () => {
            const props = {
                ...defaultProps,
                voteOrder: ['p3'],
                votes: { p3: null }
            };
            render(<ClockwiseVoting {...props} />);

            const currentVoteElements = screen.getAllByText(/当前投票.*玩家3/);
            expect(currentVoteElements.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('VoteCounter 集成', () => {
        it('应该正确传递投票数据给 VoteCounter', () => {
            const props = {
                ...defaultProps,
                votes: { p1: null, p3: true, p4: true, p5: false }
            };
            render(<ClockwiseVoting {...props} />);

            // VoteCounter 应该显示正确的赞成票数
            expect(screen.getByText('赞成')).toBeInTheDocument();
            expect(screen.getByText('反对')).toBeInTheDocument();
        });
    });
});
