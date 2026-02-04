# Future Hacker News — Mini Spec

## 目标
让用户看到 AI 预测的 10 年后 Hacker News 首页 — 包括未来科技头条、评论数、点赞数，完整还原 HN 的风格。用户可以选择不同年份（2030-2040），生成对应年代的 HN 首页。

## 核心功能
- **生成未来 HN 首页**：用户选择年份（2030-2040），AI 生成 30 条未来科技头条，完整还原 HN 风格（标题、域名、分数、评论数、发帖人、时间）
- **HN 风格 UI**：1:1 复刻 Hacker News 经典界面（橙色顶栏、等宽字体、简约排版）
- **点击展开**：点击某条头条可以看到 AI 生成的"未来文章摘要"或"评论区精选"
- **分享功能**：一键分享截图到社交媒体

## 技术方案
- 前端：React + Vite (TypeScript)
- 后端：Python FastAPI
- AI 调用：通过 llm-proxy.densematrix.ai (gemini-2.5-flash)
- 部署：Docker → langsheng
- i18n：react-i18next，支持 7 种语言（en/zh/ja/de/fr/ko/es）

## API 设计

### POST /api/generate
```json
Request: { "year": 2035, "lang": "en" }
Response: {
  "year": 2035,
  "stories": [
    {
      "id": 1,
      "title": "Show HN: I trained a quantum LLM on the entire internet archive",
      "url": "https://quantumai.dev",
      "domain": "quantumai.dev",
      "score": 1847,
      "author": "neo_coder",
      "time": "3 hours ago",
      "comments": 423,
      "summary": "..."
    }
  ]
}
```

### GET /api/story/{id}/details
返回某条头条的详细摘要和评论区预览。

### GET /health
健康检查。

## 完成标准
- [ ] 核心功能可用：选年份 → 生成 HN 首页
- [ ] HN 风格 UI 高度还原
- [ ] 点击展开详情可用
- [ ] i18n 7 种语言完整
- [ ] 部署到 future-hacker-news.demo.densematrix.ai
- [ ] Health check 通过
- [ ] Unit test 覆盖率 ≥ 95%
- [ ] E2E test 覆盖核心流程
