import { useState, useEffect } from 'react';
import type { DeviceType } from '../types';

/**
 * 检测设备类型的 Hook
 * @returns 当前设备类型： 'mobile' | 'tablet' | 'desktop'
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // 初始检测
    checkDeviceType();

    // 监听窗口大小变化
    window.addEventListener('resize', checkDeviceType);
    
    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  return deviceType;
}
