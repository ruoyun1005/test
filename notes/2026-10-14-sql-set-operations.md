---
title: "SQL 集合運算：UNION、INTERSECT 與 EXCEPT"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "集合運算", "UNION", "EXCEPT", "INTERSECT"]
summary: "探討 SQL 中的聯集、交集與差集運算機制，以及查詢結果必須滿足聯集相容性（union-compatible）與去重規則。"
---

# SQL 集合運算：UNION、INTERSECT 與 EXCEPT

> **主題摘要**  
> SQL 將各個查詢的結果視為「集合（Sets）」。當我們需要將多個 SELECT 查詢的結果加以合併或比對時，可以使用集合運算子（UNION、INTERSECT、EXCEPT）。進行集合運算的前提是兩個查詢結果必須具備「聯集相容性（Union-compatible）」。

---

## 1. 核心要點整理
- **三大集合運算定義**：
  - **UNION（聯集）**：出現在任一查詢結果中的所有列。
  - **INTERSECT（交集）**：同時出現在兩個查詢結果中的列。
  - **EXCEPT（差集）**：出現在第一個查詢結果、但**不在**第二個查詢結果中的列。
- **重複值處理機制**：
  - 集合運算預設會**自動移除重複的列**。
  - 若需要保留重複列，必須明確指定 `UNION ALL`、`INTERSECT ALL` 或 `EXCEPT ALL`。
- **聯集相容（Union-Compatible）嚴格條件**：
  - 兩個查詢結果必須具有**相同數量的屬性**。
  - 對應屬性的**資料型態必須相容**，且其**排列順序必須完全相同**（講義以紅字特別強調「the same attributes in the same order」）。

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <svg viewBox="0 0 760 220" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">
    <style>
      .venn-title { font-family: sans-serif; font-size: 15px; font-weight: bold; fill: var(--text-primary, #0f172a); text-anchor: middle; }
      .venn-sub { font-family: sans-serif; font-size: 12px; fill: var(--text-muted, #64748b); text-anchor: middle; }
      .venn-lbl { font-family: sans-serif; font-size: 12px; font-weight: 600; fill: var(--text-secondary, #475569); }
    </style>
    <!-- UNION -->
    <g transform="translate(10, 10)">
      <text x="110" y="20" class="venn-title">UNION (聯集)</text>
      <text x="110" y="38" class="venn-sub">兩邊任一出現皆保留</text>
      <circle cx="85" cy="115" r="55" fill="#3b82f6" fill-opacity="0.35" stroke="#2563eb" stroke-width="2"/>
      <circle cx="135" cy="115" r="55" fill="#3b82f6" fill-opacity="0.35" stroke="#2563eb" stroke-width="2"/>
      <text x="50" y="120" class="venn-lbl">Query A</text>
      <text x="150" y="120" class="venn-lbl">Query B</text>
      <rect x="20" y="185" width="180" height="24" rx="4" fill="var(--bg-surface-hover, #f1f5f9)" stroke="var(--border-color, #e2e8f0)"/>
      <text x="110" y="201" font-size="11" font-family="monospace" text-anchor="middle" fill="var(--accent-primary, #2563eb)">A ∪ B (自動去重)</text>
    </g>
    <!-- INTERSECT -->
    <g transform="translate(265, 10)">
      <text x="110" y="20" class="venn-title">INTERSECT (交集)</text>
      <text x="110" y="38" class="venn-sub">僅保留同時出現的列</text>
      <circle cx="85" cy="115" r="55" fill="none" stroke="#64748b" stroke-width="2"/>
      <circle cx="135" cy="115" r="55" fill="none" stroke="#64748b" stroke-width="2"/>
      <!-- Intersection area clip -->
      <path d="M 110,68 A 55 55 0 0 1 110,162 A 55 55 0 0 1 110,68" fill="#10b981" fill-opacity="0.5" stroke="#059669" stroke-width="2"/>
      <text x="50" y="120" class="venn-lbl">Query A</text>
      <text x="150" y="120" class="venn-lbl">Query B</text>
      <rect x="20" y="185" width="180" height="24" rx="4" fill="var(--bg-surface-hover, #f1f5f9)" stroke="var(--border-color, #e2e8f0)"/>
      <text x="110" y="201" font-size="11" font-family="monospace" text-anchor="middle" fill="#059669">A ∩ B (雙方共有)</text>
    </g>
    <!-- EXCEPT -->
    <g transform="translate(520, 10)">
      <text x="110" y="20" class="venn-title">EXCEPT (差集)</text>
      <text x="110" y="38" class="venn-sub">在 A 中但不在 B 中</text>
      <circle cx="85" cy="115" r="55" fill="#f59e0b" fill-opacity="0.4" stroke="#d97706" stroke-width="2"/>
      <circle cx="135" cy="115" r="55" fill="var(--bg-diagram, #ffffff)" stroke="#64748b" stroke-width="2"/>
      <text x="50" y="120" class="venn-lbl">Query A</text>
      <text x="150" y="120" class="venn-lbl">Query B</text>
      <rect x="20" y="185" width="180" height="24" rx="4" fill="var(--bg-surface-hover, #f1f5f9)" stroke="var(--border-color, #e2e8f0)"/>
      <text x="110" y="201" font-size="11" font-family="monospace" text-anchor="middle" fill="#d97706">A − B (扣除 B 所屬)</text>
    </g>
  </svg>
</div>

---

## 2. 原始資料精華與引用
> 「SQL 把查詢結果視為 sets（集合），因此兩個結果可以合併：
> - UNION（聯集）：出現在任一結果中的列
> - INTERSECT（交集）：同時出現在兩個結果中的列
> - EXCEPT（差集）：出現在第一個結果、但不在第二個結果中的列
> 
> 重複會被自動移除；要保留重複則使用 UNION ALL（等）
> Note：兩個結果必須有相同的屬性、且順序相同（講義以紅字標示「the same attributes in the same order」）——稱為 union-compatible（聯集相容）」

### 經典範例 (Q4A)
列出所有與名叫 'Smith' 的員工有關的專案編號（他是工作者或是該部門經理）：
```sql
(SELECT DISTINCT Pnumber
 FROM   PROJECT, DEPARTMENT, EMPLOYEE
 WHERE  Dnum = Dnumber AND Mgr_ssn = Ssn
        AND Lname = 'Smith')
UNION
(SELECT DISTINCT Pnumber
 FROM   PROJECT, WORKS_ON, EMPLOYEE
 WHERE  Pnumber = Pno AND Essn = Ssn
        AND Lname = 'Smith');
```
- **查詢結果**：`1, 2`

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 巢狀查詢與集合比對](2026-10-14-sql-nested-queries.md)、[相關巢狀查詢與 NOT EXISTS / EXCEPT](2026-10-14-sql-division-not-exists.md)
- **標籤**：`#SQL` `#集合運算` `#UNION` `#EXCEPT` `#INTERSECT`
