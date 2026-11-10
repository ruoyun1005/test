---
title: "SQL 綱要修改（Schema Modification）：DROP 與 ALTER TABLE"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "DDL", "DROP", "ALTER TABLE", "CASCADE", "RESTRICT"]
summary: "說明資料庫運作中綱要的動態調整：DROP 的 CASCADE 與 RESTRICT 相依處理，以及 ALTER TABLE 的欄位增刪、預設值與約束修改。"
---

# SQL 綱要修改（Schema Modification）：DROP 與 ALTER TABLE

> **主題摘要**  
> 資料庫在線上運行與使用過程中，系統需求可能隨業務演進而改變。SQL 提供了 DDL（Data Definition Language）綱要修改指令，允許管理者在不中斷資料庫運作的前提下，安全地刪除結構（DROP）或調整資料表定義（ALTER TABLE）。

---

## 1. 核心要點整理
- **刪除指令 DROP 與相依性選項**：
  - `DROP` 用於移除 schema element（資料表 Table、視圖 View、限制條件 Constraint、綱要 Schema）。
  - **`CASCADE`（串聯刪除）**：連同所有相依於該物件的下游元素（例如參照的外鍵、基於此表的視圖）一併遞迴移除。
  - **`RESTRICT`（限制防護）**：只有在**完全沒有任何其他物件相依於它**時，才允許刪除；否則操作直接被拒絕。
  - **重要區分**：`DROP TABLE` 會徹底移除表定義與全部資料；`DELETE` 僅移除資料列但表定義依然存在。
- **資料表結構變更 ALTER TABLE 常用操作**：
  1. **新增欄位（ADD COLUMN）**：既有已存資料列之新欄位預設填入 `NULL`。
  2. **刪除欄位（DROP COLUMN）**：搭配 `CASCADE` 可自動清除關聯外鍵限制。
  3. **修改預設值（ALTER COLUMN SET/DROP DEFAULT）**：調整欄位未指定時的預設值。
  4. **刪除命名約束（DROP CONSTRAINT）**：移除具名之外鍵或檢查限制。

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem; text-align: center; color: var(--text-primary);">DROP 相依性行為對比：CASCADE vs. RESTRICT</h4>
  <svg viewBox="0 0 740 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
    <style>
      .node-rect { rx: 6; stroke-width: 1.5; }
      .node-txt { font-family: sans-serif; font-size: 12px; font-weight: bold; text-anchor: middle; }
      .link-line { stroke: var(--text-muted, #94a3b8); stroke-width: 1.5; stroke-dasharray: 4; }
    </style>
    <!-- CASCADE 分支 -->
    <g transform="translate(10, 10)">
      <text x="170" y="20" font-family="sans-serif" font-size="14px" font-weight="bold" fill="#dc2626" text-anchor="middle">DROP ... CASCADE (連帶清除)</text>
      <rect x="20" y="35" width="130" height="40" class="node-rect" fill="rgba(220, 38, 38, 0.15)" stroke="#dc2626"/>
      <text x="85" y="60" class="node-txt" fill="#dc2626">目標 Base Table</text>
      <line x1="150" y1="55" x2="200" y2="55" stroke="#dc2626" stroke-width="2"/>
      <rect x="200" y="35" width="130" height="40" class="node-rect" fill="rgba(220, 38, 38, 0.15)" stroke="#dc2626"/>
      <text x="265" y="60" class="node-txt" fill="#dc2626">相依 View / FK</text>
      <text x="175" y="105" font-family="sans-serif" font-size="11px" fill="var(--text-muted, #64748b)" text-anchor="middle">✔ 順利執行：目標與所有相依元件一併銷毀</text>
    </g>
    <line x1="370" y1="15" x2="370" y2="145" stroke="var(--border-color, #e2e8f0)" stroke-width="1.5"/>
    <!-- RESTRICT 分支 -->
    <g transform="translate(385, 10)">
      <text x="170" y="20" font-family="sans-serif" font-size="14px" font-weight="bold" fill="#2563eb" text-anchor="middle">DROP ... RESTRICT (安全防護)</text>
      <rect x="20" y="35" width="130" height="40" class="node-rect" fill="var(--bg-surface, #fff)" stroke="#2563eb"/>
      <text x="85" y="60" class="node-txt" fill="#2563eb">目標 Base Table</text>
      <line x1="150" y1="55" x2="200" y2="55" stroke="#ef4444" stroke-width="2" stroke-dasharray="3"/>
      <rect x="200" y="35" width="130" height="40" class="node-rect" fill="var(--bg-surface, #fff)" stroke="#64748b"/>
      <text x="265" y="60" class="node-txt" fill="#64748b">存在相依 View / FK</text>
      <text x="175" y="105" font-family="sans-serif" font-size="11px" fill="#dc2626" font-weight="bold" text-anchor="middle">✖ 拒絕執行：必須手動先解除下游相依</text>
    </g>
  </svg>
</div>

---

## 2. 原始資料精華與引用
> 「資料庫使用中時也可以修改 schema。  
> DROP 移除一個 schema element（table、view、constraint、schema）：
> - CASCADE：連同所有相依於它的東西一起移除
> - RESTRICT：只有在沒有東西相依於它時才移除
> 
> DROP TABLE 移除表與其資料；DELETE 只移除列。」

### DROP 範例
```sql
DROP TABLE DEPENDENT CASCADE;
DROP SCHEMA COMPANY CASCADE;
```

### ALTER TABLE 實務操作範例
```sql
-- 新增欄位（既有列取 NULL）
ALTER TABLE EMPLOYEE ADD COLUMN Job VARCHAR(12);

-- 刪除欄位
ALTER TABLE EMPLOYEE DROP COLUMN Address CASCADE;

-- 修改預設值
ALTER TABLE DEPARTMENT ALTER COLUMN Mgr_ssn DROP DEFAULT;
ALTER TABLE DEPARTMENT ALTER COLUMN Mgr_ssn SET DEFAULT '333445555';

-- 刪除具名限制
ALTER TABLE EMPLOYEE DROP CONSTRAINT EMPSUPERFK CASCADE;
```

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 視圖（Views）](2026-10-14-sql-views-virtual-tables.md)、[SQL 斷言與觸發器](2026-10-14-sql-assertions-and-triggers.md)
- **標籤**：`#SQL` `#DDL` `#DROP` `#ALTER_TABLE` `#CASCADE` `#RESTRICT`
