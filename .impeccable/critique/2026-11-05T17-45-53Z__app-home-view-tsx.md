---
target: 公开站首页与指南页
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\Administrator\\Documents\\code\\nesta\\app\\home-view.tsx"
target_fingerprint: "sha256:b5286497700092bf96a9577e30d8d8b1a08b8dc65be62af1cd86c4118f81adf0"
target_path: "C:\\Users\\Administrator\\Documents\\code\\nesta\\app\\home-view.tsx"
timestamp: 2026-11-05T17-45-53Z
slug: app-home-view-tsx
---
Method: dual-agent (A: 8a0fcdaa-61ac-4d45-bddc-eab513a15d26 · B: 053a79c7-87f4-4513-9433-bc1069839570)

# 公开站专业度评审

总分 21/32（启发式 7、10 为 n/a）。约 66%，Acceptable。

## 启发式

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 指南页有面包屑；首页长滚动无位置感 |
| 2 | Match System / Real World | 3 | 联系邮箱域名与 Nesta 品牌脱节 |
| 3 | User Control and Freedom | 2 | /privacy 脱离公开导航 |
| 4 | Consistency and Standards | 2 | privacy 仍是 PRIVATE PILOT 页，币种口径与首页相反 |
| 5 | Error Prevention | 3 | 免责声明在，但人民币/美元混用靠长文补救 |
| 6 | Recognition Rather Than Recall | 3 | 套餐与流程可扫读 |
| 7 | Flexibility and Efficiency | n/a | Persuade 首页无重复任务路径 |
| 8 | Aesthetic and Minimalist Design | 3 | 分区清楚；套餐与诊所首屏过密/重复 |
| 9 | Error Recovery | 2 | 公开站几乎无表单错误态与缺页引导 |
| 10 | Help and Documentation | n/a | 靠 FAQ 与 CTA，不是操作型帮助系统 |

## 设计专属度

偏为本品牌撰写，仍带高端辅助生育模板感。暖纸、墨绿、Fraunces、LeaderMed、人民币套餐是 Nesta 自己的；缺主体资质、统一联系身份、桌面与手机同一张峰值家庭图。

## 优先问题

P0 /privacy 与公开站漂移：PRIVATE PILOT、美元为主的价格说明、无主导航。
P0 页脚联系身份：rui@huarenmedia.com 与 Nesta 并置，缺少公司法定名称。
P1 宽屏套餐第三列易被裁切；推荐档视觉与三个同等 CTA 不匹配。
P1 834–1024px「客户登录」被截断。
P2 标题跳级 H1→H3；编号/品牌副标对比度约 2.5:1–4.4:1。
P2 诊所页首屏文案重复；首页与 /fees 套餐模块重复。
P3 移动菜单用 details/summary，角色不是 button。

检测器：指定 TSX 静态扫描 0 条。渲染首页 9 条（low-contrast 5、side-tab 2、skipped-heading 1、cream-palette 1）。cream-palette 与 side-tab 倾向误报（设计系统暖纸色与推荐套餐强调条）。未注入可视 overlay。

## 认知负荷

失败项：单一焦点、分块、一次一事、选项≤4。顶栏约 7 个入口，底部 CTA 约 5 条路径，三档套餐同等权重。高认知负荷。

## 优势

编辑色与字体在公开页一致。Hero care note 与深色三格把协调能力说清楚。诊所页对证书与过期认证的表述克制。
