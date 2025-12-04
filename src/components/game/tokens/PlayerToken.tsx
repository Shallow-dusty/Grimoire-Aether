import { Group, Circle, Text, Path } from 'react-konva';
import { Html } from 'react-konva-utils';
import type { StatusFlags } from '../../../types/database';

interface PlayerTokenProps {
    x: number;
    y: number;
    name: string;
    isDead: boolean;
    isSelected: boolean;
    role?: 'storyteller' | 'player'; // 当前用户的角色
    characterName?: string; // 玩家的实际角色（仅说书人可见）
    statusFlags?: StatusFlags; // 状态标记
    onClick: () => void;
    draggable?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDragStart?: (e: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDragEnd?: (e: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onContextMenu?: (e: any) => void;
}

export function PlayerToken({
    x,
    y,
    name,
    isDead,
    isSelected,
    role = 'player',
    characterName,
    statusFlags,
    onClick,
    draggable,
    onDragStart,
    onDragEnd,
    onContextMenu
}: PlayerTokenProps) {
    // 颜色定义
    const colors = {
        ring: isSelected ? '#f59e0b' : '#78716c', // 选中金色，默认石色
        fill: isDead ? '#1c1917' : '#292524', // 死亡深黑，存活深褐
        text: isDead ? '#78716c' : '#e7e5e4',
        glow: isSelected ? '#f59e0b' : 'transparent'
    };

    // 裂纹路径 (死亡时显示)
    const crackPath = "M -15 -15 L 0 0 L 15 -5 M -5 5 L 5 15";

    // 名字首字母 (玩家视角默认显示)
    const initial = name.charAt(0).toUpperCase();

    return (
        <Group 
            x={x} 
            y={y} 
            onClick={onClick} 
            onTap={onClick}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onContextMenu={onContextMenu}
        >
            {/* 选中光晕 */}
            {isSelected && (
                <Circle
                    radius={32}
                    fill={colors.glow}
                    opacity={0.3}
                    shadowColor={colors.glow}
                    shadowBlur={20}
                />
            )}

            {/* Token 主体背景 */}
            <Circle
                radius={28}
                fill={colors.fill}
                stroke={colors.ring}
                strokeWidth={isSelected ? 3 : 2}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.5}
            />

            {/* 内部装饰环 */}
            <Circle
                radius={24}
                stroke={colors.ring}
                strokeWidth={1}
                opacity={0.3}
                dash={[4, 4]}
            />

            {/* 核心内容 */}
            {role === 'storyteller' && characterName ? (
                // 说书人视角：显示角色名 (后续替换为图标)
                <Text
                    text={characterName.substring(0, 2).toUpperCase()}
                    fontSize={14}
                    fontFamily="Cinzel"
                    fontStyle="bold"
                    fill={colors.text}
                    align="center"
                    verticalAlign="middle"
                    offsetX={10}
                    offsetY={7}
                />
            ) : (
                // 玩家视角：显示首字母/符文
                <Text
                    text={initial}
                    fontSize={20}
                    fontFamily="Cinzel"
                    fontStyle="bold"
                    fill={colors.text}
                    align="center"
                    verticalAlign="middle"
                    offsetX={7}
                    offsetY={10}
                    opacity={isDead ? 0.3 : 0.8}
                />
            )}

            {/* 死亡裂纹 */}
            {isDead && (
                <Path
                    data={crackPath}
                    stroke="#000"
                    strokeWidth={2}
                    opacity={0.6}
                />
            )}

            {/* 死亡遮罩 (血迹/灰暗) */}
            {isDead && (
                <Circle
                    radius={28}
                    fill="#000"
                    opacity={0.4}
                />
            )}

            {/* 状态图标 (仅说书人可见，或者根据规则可见) */}
            {/* 这里简化为都可见，实际逻辑可调整 */}
            {statusFlags?.poisoned && (
                <Circle x={-20} y={-20} radius={8} fill="#a855f7" stroke="#fff" strokeWidth={1} />
            )}
            {statusFlags?.drunk && (
                <Circle x={20} y={-20} radius={8} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
            )}
            {statusFlags?.protected && (
                <Circle x={0} y={-32} radius={6} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
            )}

            {/* 外部 HTML 文本 (名字) */}
            <Html divProps={{ style: { pointerEvents: 'none' } }}>
                <div
                    style={{
                        position: 'absolute',
                        top: '35px',
                        left: '-50px',
                        width: '100px',
                        textAlign: 'center',
                        color: colors.text,
                        fontFamily: '"Noto Serif SC", serif',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px black',
                        opacity: isDead ? 0.6 : 1,
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                >
                    {name}
                </div>
            </Html>
        </Group>
    );
}
