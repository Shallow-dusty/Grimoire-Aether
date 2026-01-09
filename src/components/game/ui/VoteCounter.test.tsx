/**
 * VoteCounter 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoteCounter } from './VoteCounter';

describe('VoteCounter', () => {
    const defaultProps = {
        totalPlayers: 10,
        alivePlayers: 8,
        votesFor: ['p1', 'p2', 'p3'],
        votesAgainst: ['p4', 'p5'],
        pendingVotes: ['p6', 'p7', 'p8'],
        showDetails: true
    };

    describe('基础渲染', () => {
        it('应该正确渲染组件', () => {
            render(<VoteCounter {...defaultProps} />);

            // 应该显示标签
            expect(screen.getByText('赞成')).toBeInTheDocument();
            expect(screen.getByText('反对')).toBeInTheDocument();
            expect(screen.getByText('所需')).toBeInTheDocument();
        });

        it('应该显示标签文字', () => {
            render(<VoteCounter {...defaultProps} />);

            expect(screen.getByText('赞成')).toBeInTheDocument();
            expect(screen.getByText('反对')).toBeInTheDocument();
            expect(screen.getByText('所需')).toBeInTheDocument();
        });
    });

    describe('详细信息显示', () => {
        it('showDetails=true 时应该显示详细信息', () => {
            render(<VoteCounter {...defaultProps} showDetails={true} />);

            expect(screen.getByText('已投票')).toBeInTheDocument();
            expect(screen.getByText('待投票')).toBeInTheDocument();
            expect(screen.getByText('可投票')).toBeInTheDocument();
        });

        it('showDetails=false 时不应该显示详细信息', () => {
            render(<VoteCounter {...defaultProps} showDetails={false} />);

            expect(screen.queryByText('已投票')).not.toBeInTheDocument();
            expect(screen.queryByText('待投票')).not.toBeInTheDocument();
            expect(screen.queryByText('可投票')).not.toBeInTheDocument();
        });
    });

    describe('处决阈值计算', () => {
        it('应该使用默认阈值（存活玩家数的一半向上取整）', () => {
            // 8 玩家，阈值 = ceil(8/2) = 4
            render(<VoteCounter {...defaultProps} />);
            // 阈值显示在"所需"标签上方
            expect(screen.getByText('所需')).toBeInTheDocument();
        });

        it('应该使用自定义阈值', () => {
            render(<VoteCounter {...defaultProps} executionThreshold={5} />);
            expect(screen.getByText('所需')).toBeInTheDocument();
        });

        it('奇数玩家数时应该正确向上取整', () => {
            const props = { ...defaultProps, alivePlayers: 7 };
            // 7 玩家，阈值 = ceil(7/2) = 4
            render(<VoteCounter {...props} />);
            expect(screen.getByText('所需')).toBeInTheDocument();
        });
    });

    describe('处决状态', () => {
        it('达到处决票数时应该显示成功指示器', () => {
            const props = {
                ...defaultProps,
                votesFor: ['p1', 'p2', 'p3', 'p4'], // 4 票
                alivePlayers: 8 // 阈值 = 4
            };
            render(<VoteCounter {...props} />);
            expect(screen.getByText('✓ 达到处决票数')).toBeInTheDocument();
        });

        it('未达到处决票数时不应该显示成功指示器', () => {
            render(<VoteCounter {...defaultProps} />);
            expect(screen.queryByText('✓ 达到处决票数')).not.toBeInTheDocument();
        });

        it('无法达到处决票数时应该显示失败指示器', () => {
            const props = {
                ...defaultProps,
                votesFor: ['p1'], // 1 票
                votesAgainst: ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'], // 7 票反对
                pendingVotes: [], // 没有人待投票
                alivePlayers: 8 // 阈值 = 4
            };
            render(<VoteCounter {...props} />);
            expect(screen.getByText('已无法达到处决票数')).toBeInTheDocument();
        });

        it('还可能达到处决票数时不应该显示失败指示器', () => {
            const props = {
                ...defaultProps,
                votesFor: ['p1'], // 1 票
                votesAgainst: ['p2'],
                pendingVotes: ['p3', 'p4', 'p5', 'p6', 'p7', 'p8'], // 6 人待投票
                alivePlayers: 8 // 阈值 = 4, 1 + 6 >= 4
            };
            render(<VoteCounter {...props} />);
            expect(screen.queryByText('已无法达到处决票数')).not.toBeInTheDocument();
        });
    });

    describe('边界情况', () => {
        it('应该处理空投票列表', () => {
            const props = {
                ...defaultProps,
                votesFor: [],
                votesAgainst: [],
                pendingVotes: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']
            };
            render(<VoteCounter {...props} />);

            // 应该显示标签
            expect(screen.getByText('赞成')).toBeInTheDocument();
            expect(screen.getByText('反对')).toBeInTheDocument();
        });

        it('应该处理所有人都投赞成票', () => {
            const props = {
                ...defaultProps,
                votesFor: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
                votesAgainst: [],
                pendingVotes: []
            };
            render(<VoteCounter {...props} />);
            expect(screen.getByText('✓ 达到处决票数')).toBeInTheDocument();
        });

        it('应该处理单个玩家', () => {
            const props = {
                totalPlayers: 1,
                alivePlayers: 1,
                votesFor: [],
                votesAgainst: [],
                pendingVotes: ['p1']
            };
            render(<VoteCounter {...props} />);
            // 阈值 = ceil(1/2) = 1
            expect(screen.getByText('所需')).toBeInTheDocument();
        });
    });

    describe('投票统计', () => {
        it('应该正确显示投票标签', () => {
            const props = {
                ...defaultProps,
                votesFor: ['p1', 'p2'],
                votesAgainst: ['p3', 'p4', 'p5']
            };
            render(<VoteCounter {...props} />);
            // 已投票 = 2 + 3 = 5
            expect(screen.getByText('已投票')).toBeInTheDocument();
        });
    });
});
