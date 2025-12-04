import { Group, Circle } from 'react-konva';
import { PlayerToken } from '../tokens/PlayerToken';
import type { GameParticipant } from '../../../types/database';

interface SeatingChartProps {
    participants: GameParticipant[];
    width: number;
    height: number;
    onPlayerSelect: (playerId: string) => void;
    selectedPlayerId: string | null;
}

export function SeatingChart({
    participants,
    width,
    height,
    onPlayerSelect,
    selectedPlayerId
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
                        seatIndex={player.seat_index}
                        isDead={player.is_dead}
                        isSelected={selectedPlayerId === player.id}
                        onClick={() => onPlayerSelect(player.id)}
                    />
                );
            })}
        </Group>
    );
}
