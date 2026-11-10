---
title: "SQL 中的 NULL 值與三值邏輯（Three-Valued Logic）"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "NULL", "三值邏輯", "UNKNOWN", "IS NULL"]
summary: "解析 SQL 中 NULL 的三種語義、三值邏輯真值表（AND/OR/NOT），以及為何不能使用 = NULL 而必須使用 IS NULL。"
---

# SQL 中的 NULL 值與三值邏輯（Three-Valued Logic）

> **主題摘要**  
> 在關聯式資料庫中，NULL 代表缺失或不存在的值。當比較運算式牽涉到 NULL 時，結果不是 TRUE 也不是 FALSE，而是「UNKNOWN（未知）」。因此 SQL 必須採用三值邏輯（Three-Valued Logic），且查詢只會回傳 WHERE 條件為 TRUE 的列。

---

## 1. 核心要點整理
- **NULL 的三種可能意義**（SQL 在底層並不區分這些意義）：
  1. **Unknown value（未知值）**：例如一個人的出生日期未知。
  2. **Unavailable or withheld value（無法取得或保留不公開的值）**：例如某人有電話號碼但未登記。
  3. **Not applicable（不適用）**：例如該欄位屬性對特定列無意義（如未婚者的配偶姓名）。
- **NULL 的比較本質**：
  - 每個 NULL 都被視為與其他所有 NULL **不同（different）**。
  - **絕對不要寫 `= NULL`**：任何與 NULL 使用 `=` 的比較都會永遠得到 `UNKNOWN`，導致條件永遠不成立、永遠不回傳任何列。
  - 必須改用 **`IS NULL`** 或 **`IS NOT NULL`** 進行判斷。
- **三值邏輯（Three-Valued Logic）運算規則**：
  - 查詢只會回傳條件評估結果為 **`TRUE`** 的列；`FALSE` 與 `UNKNOWN` 均會被過濾排除。

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
    <!-- AND 真值表 -->
    <div>
      <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; text-align: center; color: var(--text-primary);">AND 三值邏輯真值表</h4>
      <table style="width: 100%; font-size: 0.8rem; margin: 0;">
        <thead>
          <tr><th>AND</th><th>TRUE</th><th>FALSE</th><th>UNKNOWN</th></tr>
        </thead>
        <tbody>
          <tr><th>TRUE</th><td>TRUE</td><td>FALSE</td><td style="color: #ea580c; font-weight: bold;">UNKNOWN</td></tr>
          <tr><th>FALSE</th><td>FALSE</td><td>FALSE</td><td>FALSE</td></tr>
          <tr><th>UNKNOWN</th><td style="color: #ea580c; font-weight: bold;">UNKNOWN</td><td style="color: #dc2626; font-weight: bold;">FALSE</td><td style="color: #ea580c; font-weight: bold;">UNKNOWN</td></tr>
        </tbody>
      </table>
    </div>
    <!-- OR 真值表 -->
    <div>
      <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; text-align: center; color: var(--text-primary);">OR 三值邏輯真值表</h4>
      <table style="width: 100%; font-size: 0.8rem; margin: 0;">
        <thead>
          <tr><th>OR</th><th>TRUE</th><th>FALSE</th><th>UNKNOWN</th></tr>
        </thead>
        <tbody>
          <tr><th>TRUE</th><td>TRUE</td><td>TRUE</td><td>TRUE</td></tr>
          <tr><th>FALSE</th><td>TRUE</td><td>FALSE</td><td style="color: #ea580c; font-weight: bold;">UNKNOWN</td></tr>
          <tr><th>UNKNOWN</th><td style="color: #16a34a; font-weight: bold;">TRUE</td><td style="color: #ea580c; font-weight: bold;">UNKNOWN</td><td style="color: #ea580c; font-weight: bold;">UNKNOWN</td></tr>
        </tbody>
      </table>
    </div>
    <!-- NOT 邏輯與重要提醒 -->
    <div style="background: var(--bg-surface); padding: 1rem; border: 1px solid var(--border-color); border-radius: 6px;">
      <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--text-primary);">NOT 運算與判斷規則</h4>
      <ul style="font-size: 0.825rem; padding-left: 1.2rem; margin-bottom: 0.75rem;">
        <li><code>NOT TRUE = FALSE</code></li>
        <li><code>NOT FALSE = TRUE</code></li>
        <li><code>NOT UNKNOWN = UNKNOWN</code></li>
      </ul>
      <div style="padding: 0.5rem; background: rgba(220, 38, 38, 0.1); border-left: 3px solid #dc2626; font-size: 0.8rem; color: var(--text-primary);">
        <strong>🔴 警語</strong>：<code>Col = NULL</code> 永遠回傳 UNKNOWN！過濾時必須使用 <code>Col IS NULL</code>。
      </div>
    </div>
  </div>
</div>

---

## 2. 原始資料精華與引用
> 「NULL 有三種可能的意義：
> - Unknown value（未知值）：一個人的出生日期不知道
> - Unavailable or withheld value（無法取得或保留不公開的值）：一個人有電話但沒有列出
> - Not applicable（不適用）：該屬性不適用於這一列
>
> SQL 不區分這些意義。每個 NULL 都被視為與其他所有 NULL 不同（different）。
> 牽涉 NULL 的比較會回傳 UNKNOWN，而不是 TRUE 或 FALSE。所以 SQL 使用三個真值：TRUE、FALSE、UNKNOWN。
> 查詢只回傳 WHERE 條件為 TRUE 的列。
> 
> 不要寫 = NULL。它永遠得到 UNKNOWN，所以不會回傳任何列。改用 IS NULL 或 IS NOT NULL。」

### 實務查詢範例 (Q18)
取出所有沒有主管（`Super_ssn` 為 NULL）的員工姓名：
```sql
SELECT Fname, Lname
FROM   EMPLOYEE
WHERE  Super_ssn IS NULL;
```
- **查詢結果**：`James Borg`

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 合併表與外部合併（處理保留 NULL）](2026-10-14-sql-joined-tables-and-outer-joins.md)、[SQL 聚合函數（忽略 NULL 特性）](2026-10-14-sql-aggregates-and-grouping.md)
- **標籤**：`#SQL` `#NULL` `#三值邏輯` `#UNKNOWN` `#IS_NULL`
