import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Heart, Droplets, Wine, Shield, X } from 'lucide-react';

interface ArcaneMenuProps {
    visible: boolean;
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
    isDead: boolean;
}

export function ArcaneMenu({ visible, x, y, onClose, onAction, isDead }: ArcaneMenuProps) {
    if (!visible) return null;

    // 菜单项配置
    const menuItems = [
        { 
            id: isDead ? 'revive' : 'kill', 
            icon: isDead ? Heart : Skull, 
            label: isDead ? '复活' : '处决',
            color: isDead ? 'text-green-400' : 'text-red-500',
            bg: isDead ? 'hover:bg-green-900/50' : 'hover:bg-red-900/50'
        },
        { 
            id: 'poison', 
            icon: Droplets, 
            label: '中毒',
            color: 'text-purple-400',
            bg: 'hover:bg-purple-900/50'
        },
        { 
            id: 'drunk', 
            icon: Wine, 
            label: '醉酒',
            color: 'text-amber-400',
            bg: 'hover:bg-amber-900/50'
        },
        { 
            id: 'protect', 
            icon: Shield, 
            label: '保护',
            color: 'text-blue-400',
            bg: 'hover:bg-blue-900/50'
        },
    ];

    // 计算环形布局
    const radius = 60;
    const startAngle = -90 * (Math.PI / 180); // 从正上方开始

    return (
        <AnimatePresence>
            {visible && (
                <div 
                    className="fixed inset-0 z-50" 
                    onClick={onClose}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* 菜单容器 */}
                    <motion.div
                        className="absolute"
                        style={{ left: x, top: y }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* 中心关闭按钮 */}
                        <button 
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={onClose}
                        >
                            <X size={16} />
                        </button>

                        {/* 环形菜单项 */}
                        {menuItems.map((item, index) => {
                            const angle = startAngle + (index / menuItems.length) * 2 * Math.PI;
                            const itemX = Math.cos(angle) * radius;
                            const itemY = Math.sin(angle) * radius;

                            return (
                                <motion.button
                                    key={item.id}
                                    className={`absolute w-12 h-12 rounded-full bg-black/80 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-200 ${item.color} ${item.bg} group`}
                                    style={{ 
                                        left: itemX, 
                                        top: itemY,
                                        x: '-50%',
                                        y: '-50%'
                                    }}
                                    initial={{ scale: 0, x: 0, y: 0 }}
                                    animate={{ scale: 1, x: '-50%', y: '-50%' }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAction(item.id);
                                        onClose();
                                    }}
                                >
                                    <item.icon size={20} />
                                    
                                    {/* Tooltip */}
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 px-2 py-1 rounded text-white pointer-events-none">
                                        {item.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
