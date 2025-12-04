import { Group, Circle } from 'react-konva';
import { PlayerToken } from '../tokens/PlayerToken';
import type { GameParticipant } from '../../../types/database';

interface SeatingChartProps {
    participants: GameParticipant[];
    width: number;
    height: number;
    onPlayerSelect: (playerId: string) => void;
    selectedPlayerId: string | null;
    role?: 'storyteller' | 'player';
    onSeatChange?: (playerId: string, newSeatIndex: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTokenContextMenu?: (e: any, playerId: string) => void;
}

export function SeatingChart({
    participants,
    width,
    height,
    onPlayerSelect,
    selectedPlayerId,
    role = 'player',
    onSeatChange,
    onTokenContextMenu
}: SeatingChartProps) {
    // 计算布局参数
    const centerX = width / 2;
    const centerY = height / 2;
    // 半径根据屏幕大小自适应，留出边距
    const radius = Math.min(width, height) * 0.35;

    // 如果没有玩家，显示一个空的占位圆
    if (participants.length === 0) {
        return (
            <Group>
                <Circle
                    x={centerX}
                    y={centerY}
                    radius={radius}
                    stroke="#334155"
                    strokeWidth={2}
                    dash={[10, 10]}
                />
            </Group>
        );
    }

    // 按座位号排序
    const sortedParticipants = [...participants].sort((a, b) => a.seat_index - b.seat_index);

    return (
        <Group>
            {/* 中央装饰圆环 */}
            <Circle
                x={centerX}
                y={centerY}
                radius={radius}
                stroke="#334155"
                strokeWidth={1}
                opacity={0.5}
            />

            {/* 渲染玩家 Token */}
            {sortedParticipants.map((player, index) => {
                const total = sortedParticipants.length;
                // 计算角度：从正上方 (-90度) 开始，顺时针排列
                const angle = (index / total) * 2 * Math.PI - Math.PI / 2;

                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                return (
                    <PlayerToken
                        key={player.id}
                        x={x}
                        y={y}
                        name={player.name}
                        isDead={player.is_dead}
                        isSelected={selectedPlayerId === player.id}
                        role={role}
                        // TODO: 从数据库获取真实角色名
                        characterName={player.character_id || undefined}
                        // 传递状态标记
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        statusFlags={player.status_flags as any}
                        onClick={() => onPlayerSelect(player.id)}
                        
                        // 拖拽逻辑 (仅说书人)
                        draggable={role === 'storyteller'}
                        onDragEnd={(e) => {
                            if (role !== 'storyteller' || !onSeatChange) return;
                            
                            // 获取拖拽结束时的位置 (相对于 Stage)
                            const node = e.target;
                            const stage = node.getStage();
                            if (!stage) return;
                            
                            const pointerPos = stage.getPointerPosition();
                            if (!pointerPos) return;

                            // 计算相对于中心的角度
                            const dx = pointerPos.x - centerX;
                            const dy = pointerPos.y - centerY;
                            const newAngle = Math.atan2(dy, dx); // -PI 到 PI
                            
                            // 转换为 0 到 2PI，且从 -PI/2 (正上方) 开始算
                            // atan2 的 0 度是正右方。我们需要让正上方对应 index 0
                            // 正上方是 -PI/2。
                            // 我们可以把坐标系旋转 90 度来计算
                            
                            // 简单算法：计算角度对应的比例
                            // 0度(右) -> PI/2(下) -> PI(左) -> -PI/2(上)
                            
                            // 归一化角度到 0 - 2PI，以正上方为起点
                            // 原始 atan2: 右=0, 下=PI/2, 左=PI, 上=-PI/2
                            // 目标: 上=0, 右=PI/2, 下=PI, 左=3PI/2
                            
                            let normalizedAngle = newAngle + Math.PI / 2; 
                            if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
                            
                            // 计算新的索引
                            const totalSeats = Math.max(participants.length, 1);
                            const seatAngle = (2 * Math.PI) / totalSeats;
                            const newIndex = Math.round(normalizedAngle / seatAngle) % totalSeats;
                            
                            // 恢复位置（让它吸附回去，数据更新后会重绘）
                            node.position({ x, y });
                            
                            // 触发变更
                            // 注意：这里我们只计算了相对顺序，实际上可能需要更复杂的逻辑来插入
                            // 简单起见，我们交换位置或者直接设置新索引
                            // 这里我们传递目标索引，由父组件处理具体的重排逻辑
                            onSeatChange(player.id, newIndex);
                        }}
                        
                        // 右键菜单
                        onContextMenu={(e) => {
                            e.evt.preventDefault(); // 阻止浏览器默认菜单
                            if (onTokenContextMenu) {
                                onTokenContextMenu(e, player.id);
                            }
                        }}
                    />
                );
            })}
        </Group>
    );
}
