import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

export function BackgroundEffect() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
            {/* 静态背景图 + Ken Burns 动画 */}
            <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(/assets/backgrounds/login-bg.jpg)',
                }}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
            >
                {/* 持续缓慢缩放效果 */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            {/* 暗角遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

            {/* 噪点纹理 */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />

            {/* 粒子特效 */}
            {init && (
                <Particles
                    id="tsparticles"
                    className="absolute inset-0"
                    options={{
                        fpsLimit: 120,
                        particles: {
                            color: { value: "#ffffff" },
                            move: {
                                direction: "top",
                                enable: true,
                                outModes: "out",
                                random: true,
                                speed: 0.5,
                                straight: false,
                            },
                            number: {
                                density: { enable: true, width: 800, height: 800 },
                                value: 30,
                            },
                            opacity: {
                                value: { min: 0.1, max: 0.5 },
                                animation: {
                                    enable: true,
                                    speed: 1,
                                    sync: false,
                                }
                            },
                            shape: { type: "circle" },
                            size: {
                                value: { min: 1, max: 3 },
                            },
                        },
                        detectRetina: true,
                    }}
                />
            )}
        </div>
    );
}
