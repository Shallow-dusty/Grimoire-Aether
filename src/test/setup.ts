/**
 * Vitest 测试环境配置
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 Vitest 的 expect 以支持 jest-dom 匹配器
expect.extend(matchers);

// 每次测试后清理 DOM
afterEach(() => {
    cleanup();
});
