# mes-admin

MES 制造执行系统 PC 管理后台，基于 Vue 3 + Element Plus 开发。

## 技术栈

| 名称 | 版本 |
|------|------|
| Vue | ^3.5 |
| Element Plus | ^2.14 |
| TypeScript | ~6.0 |
| Vite | ^8.1 |
| Pinia | ^4.0 |
| Vue Router | ^4.6 |
| Axios | ^1.18 |

## 功能列表

- [ ] 系统管理：用户 / 角色 / 菜单 / 字典 / 日志
- [ ] 生产管理：工单 / 报工 / 进度看板
- [ ] 工艺管理：工序 / 工艺路线
- [ ] 质量管理：来料检 / 过程检 / 不合格品处理
- [ ] 设备管理：台账 / 点检 / 保养 / 维修
- [ ] 物料管理：档案 / 库存 / 批次追溯
- [ ] 报表统计：生产 / 质量 / 设备 OEE

## 快速开始

```bash
# 环境要求
# Node.js 18+

# 安装依赖
npm install

# 启动开发服务
npm run dev

# 访问地址
http://localhost:5173
```

## 目录结构

```
src/
├── api/            # API 请求层（按模块拆分）
├── views/          # 页面
│   ├── dashboard/
│   ├── system/
│   ├── production/
│   ├── quality/
│   ├── equipment/
│   ├── material/
│   ├── process/
│   └── report/
├── components/     # 公共组件
├── composables/    # 组合式函数
├── layouts/        # 布局
├── router/         # 路由配置
├── stores/         # Pinia（仅跨组件共享状态）
├── types/          # TS 类型声明
└── utils/          # 工具函数
```

## 相关项目

- [mes-api](https://github.com/jiujiezongheti/mes-api) — 后端 API 服务
- [mes-mobile](https://github.com/jiujiezongheti/mes-mobile) — 移动端

## 截图

> TODO

## 开源协议

MIT
