/**
 * DayPhase 组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayPhase } from './DayPhase';
import { createActor } from 'xstate';
import { gameMachine } from '../../../logic/machines/gameMachine';

// Mock 子组件
vi.mock('../ui/NominationPanel', () => ({
    NominationPanel: ({ onStartNomination, onCancelNomination }: any) => (
        <div data-testid="nomination-panel">
            <button onClick={() => onStartNomination('nom1', 'nom2')}>开始提名</button>
            <button onClick={onCancelNomination}>取消提名</button>
        </div>
    )
}));

vi.mock('../ui/VotingPanel', () => ({
    VotingPanel: ({ onVote, onEndVoting }: any) => (
        <div data-testid="voting-panel">
            <button onClick={() => onVote('voter1', true)}>投票赞成</button>
            <button onClick={onEndVoting}>结束投票</button>
        </div>
    )
}));

const mockCallbacks = {
    onEnterNomination: vi.fn(),
    onStartNomination: vi.fn(),
    onCancelNomination: vi.fn(),
    onVote: vi.fn(),
    onEndVoting: vi.fn(),
    onEndDay: vi.fn()
};

describe('DayPhase', () => {
    let actor: ReturnType<typeof createActor<typeof gameMachine>>;

    // 辅助函数：获取玩家列表
    const getPlayers = (state: any) => state.context.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        characterId: p.characterId || '',
        isDead: p.isDead,
        isGhost: p.isGhost,
        hasUsedGhostVote: p.hasUsedGhostVote
    }));

    // 辅助函数：进入白天阶段
    const enterDayPhase = () => {
        actor.send({ type: 'START_GAME' });
        actor.send({ type: 'END_NIGHT' });
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // 创建游戏状态机
        actor = createActor(gameMachine);
        actor.start();

        // 添加 7 名玩家
        for (let i = 1; i <= 7; i++) {
            actor.send({ type: 'ADD_PLAYER', name: `玩家${i}` });
        }

        // 分配角色
        const snapshot = actor.getSnapshot();
        const roles = ['washerwoman', 'fortune_teller', 'empath', 'monk', 'mayor', 'poisoner', 'imp'];
        snapshot.context.players.forEach((p, i) => {
            actor.send({ type: 'ASSIGN_ROLE', playerId: p.id, characterId: roles[i] });
        });
    });

    describe('Discussion Phase - 讨论阶段', () => {
        it('should display day number', () => {
            enterDayPhase();
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText(/第 1 天/)).toBeInTheDocument();
        });

        it('should display alive player count', () => {
            enterDayPhase();
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('7 存活')).toBeInTheDocument();
        });

        it('should show discussion phase text', () => {
            enterDayPhase();
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('自由讨论阶段')).toBeInTheDocument();
            expect(screen.getByText('自由讨论时间')).toBeInTheDocument();
        });

        it('should show "not executed today" status', () => {
            enterDayPhase();
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('今天尚未处决')).toBeInTheDocument();
        });

        it('should show enter nomination button for storyteller', () => {
            enterDayPhase();
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('进入提名阶段')).toBeInTheDocument();
        });

        it('should call onEnterNomination when clicking button', () => {
            enterDayPhase();
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            fireEvent.click(screen.getByText('进入提名阶段'));
            expect(mockCallbacks.onEnterNomination).toHaveBeenCalled();
        });

        it('should not show enter nomination button for players', () => {
            enterDayPhase();
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={false}
                    currentPlayerId="p1"
                    {...mockCallbacks}
                />
            );

            expect(screen.queryByText('进入提名阶段')).not.toBeInTheDocument();
        });
    });

    describe('Nomination Phase - 提名阶段', () => {
        it('should render NominationPanel in nomination state', () => {
            enterDayPhase();
            actor.send({ type: 'ENTER_NOMINATION' });
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByTestId('nomination-panel')).toBeInTheDocument();
        });

        it('should show nomination phase text in header', () => {
            enterDayPhase();
            actor.send({ type: 'ENTER_NOMINATION' });
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('提名投票阶段')).toBeInTheDocument();
        });
    });

    describe('Edge Cases - 边缘案例', () => {
        it('should handle dead players correctly', () => {
            enterDayPhase();
            const state1 = actor.getSnapshot();

            // 杀死一名玩家
            actor.send({ type: 'KILL_PLAYER', playerId: state1.context.players[0].id, cause: '测试' });
            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText('6 存活')).toBeInTheDocument();
            expect(screen.getByText('1 死亡')).toBeInTheDocument();
        });

        it('should handle high day number', () => {
            enterDayPhase();
            const state = actor.getSnapshot();
            state.context.currentDay = 10;

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            expect(screen.getByText(/第 10 天/)).toBeInTheDocument();
        });
    });

    describe('Voting Phase - 投票阶段', () => {
        it('should handle votes correctly', () => {
            enterDayPhase();
            actor.send({ type: 'ENTER_NOMINATION' });
            const stateAfterNom = actor.getSnapshot();
            const players = stateAfterNom.context.players;

            // 进行提名
            actor.send({ type: 'NOMINATE', nominatorId: players[0].id, nomineeId: players[1].id });

            // 投票
            actor.send({ type: 'CAST_VOTE', voterId: players[0].id, vote: true });
            actor.send({ type: 'CAST_VOTE', voterId: players[2].id, vote: true });
            actor.send({ type: 'CAST_VOTE', voterId: players[3].id, vote: false });

            const state = actor.getSnapshot();

            render(
                <DayPhase
                    machineState={state}
                    players={getPlayers(state)}
                    isStoryteller={true}
                    {...mockCallbacks}
                />
            );

            // 应该显示投票面板
            expect(screen.getByTestId('voting-panel')).toBeInTheDocument();
        });

        it('should count votes for and against', () => {
            enterDayPhase();
            actor.send({ type: 'ENTER_NOMINATION' });
            const stateAfterNom = actor.getSnapshot();
            const players = stateAfterNom.context.players;

            // 进行提名和投票
            actor.send({ type: 'NOMINATE', nominatorId: players[0].id, nomineeId: players[1].id });
            actor.send({ type: 'CAST_VOTE', voterId: players[0].id, vote: true });
            actor.send({ type: 'CAST_VOTE', voterId: players[2].id, vote: true });
            actor.send({ type: 'CAST_VOTE', voterId: players[3].id, vote: false });
            actor.send({ type: 'CAST_VOTE', voterId: players[4].id, vote: false });

            const state = actor.getSnapshot();

            // 验证投票数据
            const currentVotes = state.context.currentVotes || {};
            const votesFor = Object.entries(currentVotes)
                .filter(([_, vote]) => vote === true)
                .map(([voterId]) => voterId);
            const votesAgainst = Object.entries(currentVotes)
                .filter(([_, vote]) => vote === false)
                .map(([voterId]) => voterId);

            expect(votesFor.length).toBe(2);
            expect(votesAgainst.length).toBe(2);
        });
    });
});
