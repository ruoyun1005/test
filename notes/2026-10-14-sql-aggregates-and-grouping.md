---
title: "SQL 聚合函數與資料分組：GROUP BY、HAVING 與執行順序"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "GROUP BY", "HAVING", "聚合函數", "WITH", "CASE", "執行順序"]
summary: "整理 COUNT/SUM/AVG 聚合計算、GROUP BY 分組規範、WHERE 與 HAVING 的關鍵差異，以及 SQL 概念上的 6 階段執行順序。"
---

# SQL 聚合函數與資料分組：GROUP BY、HAVING 與執行順序

> **主題摘要**  
> 聚合函數（Aggregate Functions）可將多列資料濃縮彙整為單一數值。配合 `GROUP BY` 與 `HAVING` 子句，可以將資料按屬性分組並進行群組統計與過濾。理解 SQL 的概念執行順序（Conceptual Order of Evaluation），是避免常見邏輯錯誤的關鍵。

---

## 1. 核心要點整理
- **常用聚合函數**：
  - `COUNT`、`SUM`、`MAX`、`MIN`、`AVG`。
  - **重要特性**：套用在欄位上的聚合函數會**自動忽略 NULL 值**。
  - `COUNT(*)` 計算總列數；`COUNT(DISTINCT 欄位)` 則計算不重複的數值個數。
- **GROUP BY 分組嚴格規則**：
  - 在 `SELECT` 清單中的屬性，**必須要麼是分組屬性（Grouping Attribute），要麼必須包在聚合函數內**。
  - 若分組欄位中含有 NULL，所有 NULL 的資料列會自動歸為同一個獨立分組。
- **WHERE 與 HAVING 的本質差異與常見陷阱**：
  - **`WHERE`**：在分組**前**先執行，用於過濾個別「資料列（Rows）」。
  - **`HAVING`**：在分組**後**才執行，用於過濾分組完成後的「群組（Groups）」。
  - **常見錯誤**：若要「找出總員工數 > 5 的部門中，高薪員工的人數」，切勿將薪資條件放在 WHERE 後直接接 HAVING COUNT(*) > 5，因為這樣 HAVING 只會計算到高薪者人數，而非部門全體總人數。
- **WITH 子句與 CASE 運算式**：
  - **`WITH`**：定義僅在該查詢中生效的暫存表（CTE），有助於將多步驟複雜查詢拆解得乾淨明瞭。
  - **`CASE ... WHEN ... THEN ... ELSE ... END`**：在查詢或更新（UPDATE）時依條件動態回傳不同值。

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem; text-align: center; color: var(--text-primary);">SQL 查詢的概念執行順序（Conceptual Order of Evaluation）</h4>
  <svg viewBox="0 0 760 110" width="100%" height="110" xmlns="http://www.w3.org/2000/svg">
    <style>
      .step-rect { rx: 6; stroke-width: 1.5; }
      .step-num { font-family: sans-serif; font-size: 11px; font-weight: bold; fill: #ffffff; text-anchor: middle; }
      .step-text { font-family: monospace; font-size: 12px; font-weight: bold; text-anchor: middle; }
      .step-desc { font-family: sans-serif; font-size: 10px; text-anchor: middle; fill: var(--text-muted, #64748b); }
      .arr { stroke: var(--text-muted, #94a3b8); stroke-width: 2; fill: none; marker-end: url(#arr); }
    </style>
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/>
      </marker>
    </defs>
    <!-- Step 1: FROM -->
    <g transform="translate(10, 10)">
      <rect x="0" y="0" width="100" height="75" class="step-rect" fill="var(--bg-surface, #fff)" stroke="#3b82f6"/>
      <circle cx="20" cy="18" r="10" fill="#3b82f6"/>
      <text x="20" y="22" class="step-num">1</text>
      <text x="50" y="42" class="step-text" fill="#2563eb">FROM</text>
      <text x="50" y="60" class="step-desc">鎖定資料表/合併</text>
    </g>
    <path d="M 115, 47 L 130, 47" class="arr"/>
    <!-- Step 2: WHERE -->
    <g transform="translate(135, 10)">
      <rect x="0" y="0" width="100" height="75" class="step-rect" fill="var(--bg-surface, #fff)" stroke="#3b82f6"/>
      <circle cx="20" cy="18" r="10" fill="#3b82f6"/>
      <text x="20" y="22" class="step-num">2</text>
      <text x="50" y="42" class="step-text" fill="#2563eb">WHERE</text>
      <text x="50" y="60" class="step-desc">初篩單一資料列</text>
    </g>
    <path d="M 240, 47 L 255, 47" class="arr"/>
    <!-- Step 3: GROUP BY -->
    <g transform="translate(260, 10)">
      <rect x="0" y="0" width="100" height="75" class="step-rect" fill="var(--bg-surface, #fff)" stroke="#10b981"/>
      <circle cx="20" cy="18" r="10" fill="#10b981"/>
      <text x="20" y="22" class="step-num">3</text>
      <text x="50" y="42" class="step-text" fill="#059669">GROUP BY</text>
      <text x="50" y="60" class="step-desc">按屬性劃分群組</text>
    </g>
    <path d="M 365, 47 L 380, 47" class="arr"/>
    <!-- Step 4: HAVING -->
    <g transform="translate(385, 10)">
      <rect x="0" y="0" width="100" height="75" class="step-rect" fill="var(--bg-surface, #fff)" stroke="#10b981"/>
      <circle cx="20" cy="18" r="10" fill="#10b981"/>
      <text x="20" y="22" class="step-num">4</text>
      <text x="50" y="42" class="step-text" fill="#059669">HAVING</text>
      <text x="50" y="60" class="step-desc">篩選彙整後分組</text>
    </g>
    <path d="M 490, 47 L 505, 47" class="arr"/>
    <!-- Step 5: SELECT -->
    <g transform="translate(510, 10)">
      <rect x="0" y="0" width="100" height="75" class="step-rect" fill="var(--bg-surface, #fff)" stroke="#f59e0b"/>
      <circle cx="20" cy="18" r="10" fill="#f59e0b"/>
      <text x="20" y="22" class="step-num">5</text>
      <text x="50" y="42" class="step-text" fill="#d97706">SELECT</text>
      <text x="50" y="60" class="step-desc">計算投影與聚合</text>
    </g>
    <path d="M 615, 47 L 630, 47" class="arr"/>
    <!-- Step 6: ORDER BY -->
    <g transform="translate(635, 10)">
      <rect x="0" y="0" width="105" height="75" class="step-rect" fill="var(--bg-surface, #fff)" stroke="#8b5cf6"/>
      <circle cx="20" cy="18" r="10" fill="#8b5cf6"/>
      <text x="20" y="22" class="step-num">6</text>
      <text x="52" y="42" class="step-text" fill="#7c3aed">ORDER BY</text>
      <text x="52" y="60" class="step-desc">最後排序輸出</text>
    </g>
  </svg>
</div>

---

## 2. 原始資料精華與引用
> 「WHERE 選取列；HAVING 選取分組。  
> 
> 常見錯誤示範：對每個超過五位員工的部門，計算薪資超過 $40,000 的員工人數
> 錯誤寫法：WHERE 先執行，所以 HAVING 計算的只有高薪者，而不是部門的所有員工。
> 
> 正確寫法 (Q28)：使用巢狀查詢先以全部員工找出大部門，再行過濾。亦可利用 WITH 子句 (Q28′) 簡化暫存表。」

### 正確查詢範例 (Q28)
```sql
SELECT   Dnumber, COUNT(*)
FROM     DEPARTMENT, EMPLOYEE
WHERE    Dnumber = Dno AND Salary > 40000 AND
         Dno IN (SELECT   Dno
                 FROM     EMPLOYEE
                 GROUP BY Dno
                 HAVING   COUNT(*) > 5)
GROUP BY Dnumber;
```

### WITH 子句範例 (Q28′)
```sql
WITH BIGDEPTS (Dno) AS
  (SELECT   Dno
   FROM     EMPLOYEE
   GROUP BY Dno
   HAVING   COUNT(*) > 5)
SELECT   Dno, COUNT(*)
FROM     EMPLOYEE
WHERE    Salary > 40000
         AND Dno IN (SELECT Dno FROM BIGDEPTS)
GROUP BY Dno;
```

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL NULL 值與三值邏輯](2026-10-14-sql-null-and-three-valued-logic.md)、[SQL 視圖（聚合函數與不可更新限制）](2026-10-14-sql-views-virtual-tables.md)
- **標籤**：`#SQL` `#GROUP_BY` `#HAVING` `#聚合函數` `#WITH` `#CASE` `#執行順序`
