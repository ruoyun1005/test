---
title: "SQL 巢狀查詢與集合成員比對（IN, ANY, ALL）"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "巢狀查詢", "子查詢", "IN", "ANY", "ALL", "相關子查詢"]
summary: "說明外層查詢與子查詢的嵌套結構，值組比較語法，以及使用 IN、= ANY、> ALL 與相關子查詢進行多值比對。"
---

# SQL 巢狀查詢與集合成員比對（IN, ANY, ALL）

> **主題摘要**  
> 巢狀查詢（Nested Query / Subquery）是指將一個完整的 SELECT-FROM-WHERE 區塊嵌入在另一個查詢（稱為 Outer Query，外層查詢）的條件式中。透過集合成員運算子（IN、ANY、ALL）或相關子查詢（Correlated Query），可以完成跨層次的複雜過濾。

---

## 1. 核心要點整理
- **巢狀查詢基本概念**：
  - 巢狀子查詢通常出現在外層查詢的 `WHERE` 或 `HAVING` 子句中。
  - **`v IN V`**：若值 `v` 存在於集合 `V` 中，則回傳 `TRUE`；`v NOT IN V` 則代表不存在於集合中。
- **值組（Tuple）多欄位比較**：
  - SQL 允許將多個屬性以括號包裝成值組同時比較，例如：`(Pno, Hours) IN (SELECT Pno, Hours FROM ...)`。
- **ANY 與 ALL 運算子**：
  - **`= ANY`（或 `= SOME`）**：等同於 `IN`（只要集合中有任一個值吻合即為 TRUE）。ANY 亦可搭配 `>`、`>=`、`<`、`<=`、`<>`。
  - **`> ALL`**：只有當值大於子查詢集合中的**每一個值**時，才為 TRUE。
- **相關巢狀查詢（Correlated Nested Query）**：
  - 當子查詢的 `WHERE` 子句中**參照了外層查詢的屬性**時，稱為相關子查詢。
  - **執行機制**：系統會針對外層查詢的**每一列（Each row）分別執行一次子查詢**。
  - 通常可以使用別名（Aliases）改寫為單一區塊查詢（Single-block query）以增進可讀性。

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <svg viewBox="0 0 740 210" width="100%" height="210" xmlns="http://www.w3.org/2000/svg">
    <style>
      .box-title { font-family: sans-serif; font-size: 13px; font-weight: bold; fill: var(--text-primary, #0f172a); }
      .box-desc { font-family: monospace; font-size: 11px; fill: var(--text-secondary, #475569); }
      .flow-arrow { stroke: var(--accent-primary, #2563eb); stroke-width: 2; fill: none; marker-end: url(#arrow); }
    </style>
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"/>
      </marker>
    </defs>
    <!-- 外層查詢容器 -->
    <rect x="20" y="15" width="700" height="180" rx="10" fill="var(--bg-surface, #ffffff)" stroke="var(--border-color, #e2e8f0)" stroke-width="2"/>
    <text x="40" y="42" class="box-title">外層查詢 (Outer Query)：SELECT ... FROM EMPLOYEE AS E WHERE ...</text>
    <!-- 子查詢容器 -->
    <rect x="220" y="65" width="480" height="110" rx="8" fill="var(--bg-page, #f8fafc)" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4"/>
    <text x="240" y="90" class="box-title" fill="#2563eb">巢狀子查詢 (Subquery / Inner Query)</text>
    <text x="240" y="112" class="box-desc">SELECT Salary FROM EMPLOYEE WHERE Dno = 5</text>
    <text x="240" y="132" class="box-desc">回傳結果集合：V = { 30000, 40000, 25000, ... }</text>
    <!-- 比較運算判斷 -->
    <rect x="40" y="75" width="140" height="85" rx="6" fill="var(--accent-surface, #eff6ff)" stroke="var(--accent-border, #bfdbfe)"/>
    <text x="110" y="100" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="var(--accent-primary, #2563eb)">條件評估</text>
    <text x="110" y="122" font-size="11" font-family="monospace" text-anchor="middle" fill="var(--text-primary, #0f172a)">E.Salary &gt; ALL (V)</text>
    <text x="110" y="142" font-size="10" font-family="sans-serif" text-anchor="middle" fill="var(--text-muted, #64748b)">逐列比對子集合</text>
    <!-- 流程箭頭 -->
    <path d="M 220,120 L 185,120" class="flow-arrow"/>
  </svg>
</div>

---

## 2. 原始資料精華與引用
> 「Nested query（巢狀查詢）(subquery，子查詢)：放在另一個查詢裡面的完整 SELECT-FROM-WHERE 區塊。外層的查詢稱為 outer query（外層查詢）。巢狀查詢通常出現在 WHERE 子句中。
> - v IN V：若值 v 是集合 V 中的某個值，則為 TRUE
> - v NOT IN V：若 v 不在 V 中，則為 TRUE
> - 把數個值放在括號裡，就能一次比較：`(Pno, Hours) IN (SELECT Pno, Hours ...)`
> - IN 可以換成『= ANY』（或 = SOME）
> - v > ALL V：若 v 大於 V 中的每一個值，則為 TRUE」

### 與 ALL 比較範例
找出薪資比部門 5 每一位員工都高的員工：
```sql
SELECT Lname, Fname
FROM   EMPLOYEE
WHERE  Salary > ALL (SELECT Salary
                     FROM   EMPLOYEE
                     WHERE  Dno = 5);
```
- **查詢結果**：`Wallace, Borg`

### 相關巢狀查詢範例 (Q16)
取出有眷屬與自己同名、同性別的員工姓名（子查詢內部參照外層 `E.Fname` 與 `E.Sex`）：
```sql
SELECT E.Fname, E.Lname
FROM   EMPLOYEE AS E
WHERE  E.Ssn IN (SELECT D.Essn
                 FROM   DEPENDENT AS D
                 WHERE  E.Fname = D.Dependent_name
                        AND E.Sex = D.Sex);
```
*(亦可透過 Q16A 改寫為單一區塊 JOIN 查詢)*

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 集合運算](2026-10-14-sql-set-operations.md)、[相關巢狀查詢與 NOT EXISTS / EXCEPT](2026-10-14-sql-division-not-exists.md)
- **標籤**：`#SQL` `#巢狀查詢` `#子查詢` `#IN` `#ANY` `#ALL` `#相關子查詢`
