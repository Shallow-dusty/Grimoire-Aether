import { Group, Circle, Text } from 'react-konva';
import { Html } from 'react-konva-utils';

interface PlayerTokenProps {
    x: number;
    y: number;
    name: string;
    seatIndex: number;
    isDead?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
}

export function PlayerToken({ x, y, name, seatIndex, isDead, isSelected, onClick }: PlayerTokenProps) {
    return (
        <Group x={x} y={y} onClick={onClick} onTap={onClick}>
            {/* 选中光环 */}
            {isSelected && (
                <Circle
                    radius={45}
                    stroke="#a855f7" // purple-500
                    strokeWidth={3}
                    shadowColor="#a855f7"
                    shadowBlur={15}
                    listening={false}
                />
            )}

            {/* Token 主体 */}
            <Circle
                radius={40}
                fill={isDead ? "#334155" : "#f8fafc"} // slate-700 : slate-50
                stroke={isDead ? "#94a3b8" : "#cbd5e1"}
                strokeWidth={2}
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.3}
                shadowOffset={{ x: 5, y: 5 }}
            />

            {/* 角色图标占位 */}
            <Text
                text={seatIndex.toString()}
                fontSize={24}
                fontStyle="bold"
                fill={isDead ? "#94a3b8" : "#475569"}
                align="center"
                verticalAlign="middle"
                width={80}
                height={80}
                offsetX={40}
                offsetY={40}
            />

            {/* 玩家名字标签 (HTML 覆盖层，为了更好的文字渲染) */}
            <Html divProps={{ style: { pointerEvents: 'none' } }}>
                <div className="absolute -translate-x-1/2 translate-y-[45px] w-32 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-sm ${isDead
                            ? 'bg-slate-800/80 text-slate-400'
                            : 'bg-white/90 text-slate-900'
                        }`}>
                        {name}
                    </span>
                </div>
            </Html>
        </Group>
    );
}
