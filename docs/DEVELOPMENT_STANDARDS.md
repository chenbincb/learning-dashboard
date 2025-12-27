# 学情看板 开发规范文档 (Development Standards)

## 1. 架构概览

本项目采用 **Next.js App Router** 架构，API 层采用了 **Service Layer** 模式以分离业务逻辑和路由处理。

### 目录结构
```
src/
├── app/
│   ├── api/            # 路由处理程序 (Route Handlers) - 只负责 HTTP 请求/响应
│   ├── leaderboard/    # 排行榜页面
│   ├── pk/             # PK 场页面
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 首页 (仪表盘)
├── components/         # UI 组件
│   ├── StatCard.tsx
│   └── SubjectProgress.tsx
├── lib/
│   ├── api.ts          # 前端 API Client - 统一封装所有网络请求
│   └── db.ts           # 数据库连接单例
├── services/           # 业务逻辑层 (Service Layer) - 核心逻辑所在
│   ├── studentService.ts
│   ├── examService.ts
│   ├── scoreService.ts
│   └── importService.ts
├── styles/             # 样式定义 (如果是使用模块化 CSS)
├── lib/
│   ├── api.ts          # 前端 API Client - 统一封装所有网络请求
│   └── db.ts           # 数据库连接单例
├── tools/                  # 运维工具脚本
│   ├── scrape_scores.py    # Python 分数爬虫 (Excel 生成器)
│   └── import-data.js      # 本地 Excel 导入工具 (Node.js)
├── data/                   # 数据存储
│   ├── scores.db           # SQLite 数据库
│   └── backups/            # 数据库自动物理备份
├── docs/                   # 项目文档
│   ├── DEVELOPMENT_STANDARDS.md
│   └── deployment_guide.md  # 部署上线指南
```

## 2. 核心特性说明

### 交互图例与排名趋势 (Page Component)
首页的排名趋势图表采用了 **Recharts** 构建，具备以下逻辑：
- **状态同步**: 通过 `showGradeRank` 和 `showClassRank` 独立控制年级/班级排名的可见性。
- **模式切换**: `trendMultiSelect` 控制是「单科聚焦」（点击科目只看该科目）还是「多选对比」（点击科目进行叠加）。
- **样式规范**: 统一使用 `opacity-30` 表示未选中/隐藏状态，`opacity-100` 表示激活状态。

## 3. API 开发流程

在添加新功能时，请严格遵循以下流程，**严禁**在页面组件中直接写 SQL 或 fetch 字符串。

### 第一步：编写 Service
在 `src/services/` 下寻找合适的服务文件（或创建新的），编写纯 TypeScript 函数。
*   **原则**：Service 函数不应感知 `NextResponse` 或 `Request` 对象，只处理数据。
*   **示例**：
    ```typescript
    // src/services/studentService.ts
    export const StudentService = {
        getStudentById: (id: string) => {
            const db = getDb();
            return db.prepare('SELECT * FROM students WHERE id = ?').get(id);
        }
    };
    ```

### 第二步：创建 API Route
在 `src/app/api/` 下创建对应的路由文件。
*   **原则**：Route Handler 应该非常“薄”，只做参数解析、调用 Service、错误处理和 JSON 格式化。
*   **示例**：
    ```typescript
    // src/app/api/student/[id]/route.ts
    import { StudentService } from '@/services/studentService';
    export async function GET(req: Request, { params }: any) {
        const student = StudentService.getStudentById(params.id);
        return NextResponse.json(student);
    }
    ```

### 第三步：更新 API Client
在 `src/lib/api.ts` 中添加对应的类型定义和请求方法。
*   **原则**：必须定义返回值的 Interface，确保前端获得完整的类型提示。
*   **示例**：
    ```typescript
    // src/lib/api.ts
    export const API = {
        fetchStudentDetail: async (id: string): Promise<Student> => {
            const res = await fetch(`/api/student/${id}`);
            return res.json();
        }
    };
    ```

### 第四步：在组件中调用
在 React 组件中通过 `API` 对象调用。
*   **示例**：
    ```typescript
    import { API } from '@/lib/api';
    // ...
    const data = await API.fetchStudentDetail('123');
    ```

## 3. 命名规范

*   **文件名**：使用 kebab-case (如 `student-list`)。
*   **Service 类名**：使用 PascalCase (如 `StudentService`)。
*   **API Client 方法**：使用 camelCase，统一以 `fetch`, `create`, `update`, `delete` 等动词开头 (如 `fetchStudentScores`)。

## 4. 最佳实践

*   **类型安全**：前后端交互必须通过 Interface 定义数据结构。
*   **错误处理**：Service 层抛出错误，Route 层捕获并返回 HTTP 状态码，Client 层处理网络异常。
*   **避免重复**：通用的 SQL 查询逻辑必须提取到 Service 中，禁止在多个 Route 中复制粘贴 SQL。
