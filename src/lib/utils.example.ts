/**
 * 工具函数使用示例
 */

import { cn } from './utils';

// 示例 1: 基础类名合并
const basicExample = cn('text-white', 'bg-blue-500', 'p-4');
console.log('基础示例:', basicExample);
// 输出: "text-white bg-blue-500 p-4"

// 示例 2: 条件类名
const isActive = true;
const buttonClasses = cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500 text-white',
  !isActive && 'bg-gray-200 text-gray-700'
);
console.log('条件示例:', buttonClasses);
// 输出: "px-4 py-2 rounded bg-blue-500 text-white"

// 示例 3: 覆盖冲突的类（tailwind-merge 的作用）
const conflictExample = cn('p-4', 'p-6'); // p-6 会覆盖 p-4
console.log('冲突解决:', conflictExample);
// 输出: "p-6"

// 示例 4: 数组和对象混合
const complexExample = cn(
  'base-class',
  ['array-class-1', 'array-class-2'],
  {
    'conditional-class-1': true,
    'conditional-class-2': false,
  },
  'final-class'
);
console.log('复杂示例:', complexExample);
// 输出: "base-class array-class-1 array-class-2 conditional-class-1 final-class"

export { basicExample, buttonClasses, conflictExample, complexExample };
