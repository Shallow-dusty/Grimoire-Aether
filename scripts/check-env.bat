@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo     Grimoire Aether - 环境变量检查
echo ============================================================
echo.

REM 检查 .env 文件是否存在
if not exist ".env" (
    echo [错误] .env 文件不存在！
    echo.
    echo 请执行以下步骤：
    echo   1. 复制 .env.example 到 .env
    echo   2. 编辑 .env 并填入您的配置
    echo.
    echo 示例命令:
    echo   copy .env.example .env
    echo.
    exit /b 1
)

echo [OK] .env 文件存在
echo.

REM 检查必需的环境变量
set ERROR_COUNT=0
set WARNING_COUNT=0

REM VITE_SUPABASE_URL
findstr /C:"VITE_SUPABASE_URL=" .env >nul
if errorlevel 1 (
    echo [错误] VITE_SUPABASE_URL 未配置
    set /a ERROR_COUNT+=1
) else (
    findstr /C:"VITE_SUPABASE_URL=your_" .env >nul
    if not errorlevel 1 (
        echo [错误] VITE_SUPABASE_URL 使用占位符，请填入实际值
        echo   描述: Supabase 项目 URL
        echo   示例: https://your-project.supabase.co
        set /a ERROR_COUNT+=1
    ) else (
        echo [OK] VITE_SUPABASE_URL 已配置
        echo   描述: Supabase 项目 URL
    )
)
echo.

REM VITE_SUPABASE_ANON_KEY
findstr /C:"VITE_SUPABASE_ANON_KEY=" .env >nul
if errorlevel 1 (
    echo [错误] VITE_SUPABASE_ANON_KEY 未配置
    set /a ERROR_COUNT+=1
) else (
    findstr /C:"VITE_SUPABASE_ANON_KEY=your_" .env >nul
    if not errorlevel 1 (
        echo [错误] VITE_SUPABASE_ANON_KEY 使用占位符，请填入实际值
        echo   描述: Supabase 匿名密钥
        echo   示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        set /a ERROR_COUNT+=1
    ) else (
        echo [OK] VITE_SUPABASE_ANON_KEY 已配置
        echo   描述: Supabase 匿名密钥
    )
)
echo.

REM VITE_AI_API_URL (可选)
findstr /C:"VITE_AI_API_URL=" .env >nul
if errorlevel 1 (
    echo [警告] VITE_AI_API_URL 未配置 (可选)
    set /a WARNING_COUNT+=1
) else (
    findstr /C:"VITE_AI_API_URL=your_" .env >nul
    if not errorlevel 1 (
        echo [警告] VITE_AI_API_URL 使用占位符 (可选)
        echo   描述: AI API 端点
        echo   示例: https://api.your-ai-service.com
        set /a WARNING_COUNT+=1
    ) else (
        echo [OK] VITE_AI_API_URL 已配置
        echo   描述: AI API 端点
    )
)
echo.

REM 打印结果
echo ============================================================

if %ERROR_COUNT% GTR 0 (
    echo [失败] 环境检查失败！发现 %ERROR_COUNT% 个错误
    echo.
    echo 请在 .env 文件中配置所有必需的环境变量。
    echo 配置完成后重新运行此脚本。
    echo.
    exit /b 1
) else if %WARNING_COUNT% GTR 0 (
    echo [警告] 环境检查通过，但有 %WARNING_COUNT% 个警告
    echo.
    echo 一些可选的环境变量未配置，这可能会影响某些功能。
    echo 您可以继续开发，但建议配置所有环境变量。
    echo.
    exit /b 0
) else (
    echo [成功] 环境检查通过！所有配置正确
    echo.
    echo 您可以开始开发了！
    echo 运行命令: npm run dev
    echo.
    exit /b 0
)
