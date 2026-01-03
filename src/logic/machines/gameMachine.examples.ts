/**
 * GameMachine 使用示例
 *
 * 展示如何使用更新后的游戏状态机
 */

import { createActor } from 'xstate';
import { gameMachine, type GameContext, type GameMachineEvent } from '../machines/gameMachine';
import { getCurrentAction } from '../night/nightActions';

// ============================================================
// 1. 初始化游戏
// ============================================================

export function initializeGame() {
    // 创建状态机实例
    const actor = createActor(gameMachine);

    // 订阅状态变化
    actor.subscribe((snapshot) => {
        console.log('Current State:', snapshot.value);
        console.log('Current Context:', snapshot.context);
    });

    // 启动状态机
    actor.start();

    return actor;
}

// ============================================================
// 2. 设置游戏 - 添加玩家和分配角色
// ============================================================

export function setupGameExample(actor: ReturnType<typeof createActor<typeof gameMachine>>) {
    // 添加玩家
    actor.send({ type: 'ADD_PLAYER', name: '玩家1' });
    actor.send({ type: 'ADD_PLAYER', name: '玩家2' });
    actor.send({ type: 'ADD_PLAYER', name: '玩家3' });
    actor.send({ type: 'ADD_PLAYER', name: '玩家4' });
    actor.send({ type: 'ADD_PLAYER', name: '玩家5' });
    actor.send({ type: 'ADD_PLAYER', name: '玩家6' });
    actor.send({ type: 'ADD_PLAYER', name: '玩家7' });

    // 获取玩家列表
    const context = actor.getSnapshot().context;
    const players = context.players;

    // 分配角色（Trouble Brewing 7人局配置：5镇民 + 0外来者 + 1爪牙 + 1恶魔）
    actor.send({ type: 'ASSIGN_ROLE', playerId: players[0].id, characterId: 'washerwoman' });
    actor.send({ type: 'ASSIGN_ROLE', playerId: players[1].id, characterId: 'empath' });
    actor.send({ type: 'ASSIGN_ROLE', playerId: players[2].id, characterId: 'monk' });
    actor.send({ type: 'ASSIGN_ROLE', playerId: players[3].id, characterId: 'slayer' });
    actor.send({ type: 'ASSIGN_ROLE', playerId: players[4].id, characterId: 'mayor' });
    actor.send({ type: 'ASSIGN_ROLE', playerId: players[5].id, characterId: 'poisoner' }); // 爪牙
    actor.send({ type: 'ASSIGN_ROLE', playerId: players[6].id, characterId: 'imp' }); // 恶魔

    // 开始游戏
    actor.send({ type: 'START_GAME' });

    console.log('Game started! Current state:', actor.getSnapshot().value);
}

// ============================================================
// 3. 夜晚阶段 - 使用夜晚行动队列
// ============================================================

export function nightPhaseExample(actor: ReturnType<typeof createActor<typeof gameMachine>>) {
    const context = actor.getSnapshot().context;

    console.log('=== 夜晚阶段开始 ===');
    console.log('是否首夜:', context.isFirstNight);
    console.log('夜晚行动队列:', context.nightQueue);

    // 获取当前待执行的行动
    if (context.nightQueue) {
        const currentAction = getCurrentAction(context.nightQueue);

        if (currentAction) {
            console.log('当前行动:');
            console.log('  - 角色:', currentAction.character.name);
            console.log('  - 行动者:', currentAction.playerIds);
            console.log('  - 顺序:', currentAction.order);

            // 说书人执行行动后，推进到下一个行动
            actor.send({ type: 'PROCEED_NIGHT_ACTION' });

            // 或者跳过当前行动
            // actor.send({ type: 'SKIP_NIGHT_ACTION' });
        } else {
            console.log('所有夜晚行动已完成');
            // 结束夜晚
            actor.send({ type: 'END_NIGHT' });
        }
    }
}

// ============================================================
// 4. 白天阶段 - 提名和投票
// ============================================================

export function dayPhaseExample(actor: ReturnType<typeof createActor<typeof gameMachine>>) {
    const context = actor.getSnapshot().context;
    const players = context.players;

    console.log('=== 白天阶段 ===');
    console.log('当前天数:', context.currentDay);

    // 玩家1提名玩家6
    actor.send({
        type: 'NOMINATE',
        nominatorId: players[0].id,
        nomineeId: players[5].id
    });

    // 开始投票
    actor.send({ type: 'START_VOTE' });

    // 所有玩家投票
    actor.send({ type: 'CAST_VOTE', voterId: players[0].id, vote: true });
    actor.send({ type: 'CAST_VOTE', voterId: players[1].id, vote: true });
    actor.send({ type: 'CAST_VOTE', voterId: players[2].id, vote: false });
    actor.send({ type: 'CAST_VOTE', voterId: players[3].id, vote: true });
    actor.send({ type: 'CAST_VOTE', voterId: players[4].id, vote: false });
    actor.send({ type: 'CAST_VOTE', voterId: players[5].id, vote: false });
    actor.send({ type: 'CAST_VOTE', voterId: players[6].id, vote: false });

    // 结束投票
    actor.send({ type: 'FINISH_VOTE' });

    console.log('投票结果:', context.executionTarget ? '通过' : '未通过');
}

// ============================================================
// 5. 处决阶段 - 自动游戏结束检测
// ============================================================

export function executionPhaseExample(actor: ReturnType<typeof createActor<typeof gameMachine>>) {
    const context = actor.getSnapshot().context;

    console.log('=== 处决阶段 ===');

    if (context.executionTarget) {
        const target = context.players.find(p => p.id === context.executionTarget);
        console.log('处决目标:', target?.name);

        // 执行处决（状态机会自动检查游戏结束条件）
        actor.send({ type: 'EXECUTE' });

        // 检查游戏是否结束
        const snapshot = actor.getSnapshot();
        if (snapshot.value === 'gameOver') {
            console.log('游戏结束！');
            console.log('获胜阵营:', snapshot.context.winner);
            console.log('结束原因:', snapshot.context.endReason);
        }
    } else {
        console.log('今日无处决');
        actor.send({ type: 'SKIP_EXECUTION' });
    }
}

// ============================================================
// 6. 完整游戏流程示例
// ============================================================

export function completeGameExample() {
    console.log('========================================');
    console.log('完整游戏流程示例');
    console.log('========================================');

    // 1. 初始化
    const game = initializeGame();

    // 2. 设置
    setupGameExample(game);

    // 3. 首夜
    nightPhaseExample(game);

    // 4. 第一天
    dayPhaseExample(game);

    // 5. 处决
    executionPhaseExample(game);

    // 6. 第二夜
    // ...继续游戏循环

    return game;
}

// ============================================================
// 7. 使用夜晚行动系统
// ============================================================

export function nightActionSystemExample(actor: ReturnType<typeof createActor<typeof gameMachine>>) {
    const context = actor.getSnapshot().context;

    if (!context.nightQueue) {
        console.log('没有夜晚行动队列');
        return;
    }

    console.log('=== 夜晚行动队列示例 ===');
    console.log('夜晚序号:', context.nightQueue.night);
    console.log('是否首夜:', context.nightQueue.isFirstNight);
    console.log('行动总数:', context.nightQueue.actions.length);
    console.log('当前索引:', context.nightQueue.currentIndex);

    // 遍历所有行动
    context.nightQueue.actions.forEach((action, index) => {
        console.log(`\n行动 ${index + 1}:`);
        console.log('  角色:', action.character.name);
        console.log('  能力:', action.character.abilityText);
        console.log('  行动者数量:', action.playerIds.length);
        console.log('  是否完成:', action.completed);
    });

    // 手动推进夜晚行动
    const currentAction = getCurrentAction(context.nightQueue);
    if (currentAction) {
        console.log('\n当前待执行的行动:');
        console.log('  角色:', currentAction.character.name);

        // 执行能力（通过 UI 或说书人操作）
        // 然后推进到下一个行动
        actor.send({ type: 'PROCEED_NIGHT_ACTION' });
    }
}

// ============================================================
// 8. 游戏结束检测示例
// ============================================================

export function gameEndDetectionExample(actor: ReturnType<typeof createActor<typeof gameMachine>>) {
    const context = actor.getSnapshot().context;

    console.log('=== 游戏结束检测 ===');

    // 状态机会在以下情况自动检测游戏结束：
    // 1. 恶魔被处决
    // 2. 善良阵营全灭
    // 3. 圣徒被处决
    // 4. 市长胜利条件（3人且无处决）

    // 手动触发检测
    actor.send({ type: 'CHECK_GAME_END' });

    const snapshot = actor.getSnapshot();
    if (snapshot.value === 'gameOver') {
        console.log('检测到游戏结束！');
        console.log('获胜阵营:', snapshot.context.winner);
        console.log('结束原因:', snapshot.context.endReason);
    } else {
        console.log('游戏继续进行');
        console.log('当前状态:', snapshot.value);
    }
}

// ============================================================
// 9. 导出示例
// ============================================================

export default {
    initializeGame,
    setupGameExample,
    nightPhaseExample,
    dayPhaseExample,
    executionPhaseExample,
    completeGameExample,
    nightActionSystemExample,
    gameEndDetectionExample
};
