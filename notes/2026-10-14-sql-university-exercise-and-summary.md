---
title: "進階 SQL 實作練習與重點總結（UNIVERSITY 資料庫）"
date: "2026-10-14"
category: "實作練習"
tags: ["SQL", "實作練習", "UNIVERSITY", "練習題", "總結"]
summary: "UNIVERSITY 資料庫之 8 大進階 SQL 練習題目標準解析（含排序、外合併、NOT IN、GROUP BY、視圖與綱要修改）與重點歸納。"
---

# 進階 SQL 實作練習與重點總結（UNIVERSITY 資料庫）

> **主題摘要**  
> 本篇整理資料庫應用第 06 週「進階 SQL」的實作練習題目（UNIVERSITY 資料庫結構）與重點概念歸納。涵蓋基本檢索、外部合併、巢狀查詢、分組聚合、視圖定義與 ALTER TABLE 等核心能力的整合運用。

---

## 1. 核心要點整理
- **UNIVERSITY 資料庫已知關聯架構**：
  - `STUDENT(Name, Student_number, Class, Major)`
  - `COURSE(Course_name, Course_number, Credit_hours, Department)`
  - `SECTION(Section_identifier, Course_number, Semester, Year, Instructor)`
  - `GRADE_REPORT(Student_number, Section_identifier, Grade)`
  - `PREREQUISITE(Course_number, Prerequisite_number)`
- **8 大實作練習題解策略重點**：
  - **Q1（排序）**：`WHERE Major = 'CS' ORDER BY Name`
  - **Q2（修課合併）**：多表 JOIN（STUDENT, GRADE_REPORT, SECTION, COURSE），條件指定 `Semester = 'Fall' AND Year = '2008'`
  - **Q3（含未開課之課程）**：必須使用 **`LEFT OUTER JOIN`**（COURSE LEFT JOIN SECTION），避免無開課課程被漏掉
  - **Q4（從未拿過 A 的學生）**：使用 `NOT IN` 或 `NOT EXISTS` 排除拿過 Grade = 'A' 的學生
  - **Q5（每門課開設 section 數）**：`GROUP BY Course_number` 配合 `COUNT(*)`
  - **Q6（教過超過一個 section 的教師）**：`GROUP BY Instructor HAVING COUNT(*) > 1`
  - **Q7（建立視圖並查詢）**：`CREATE VIEW TRANSCRIPT ... AS` 結合多表查詢
  - **Q8（綱要與資料修改）**：先 `ALTER TABLE STUDENT ADD COLUMN Email VARCHAR(50);` 再執行 `UPDATE STUDENT SET Email = ...`

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem; text-align: center; color: var(--text-primary);">UNIVERSITY 資料庫核心實體關聯脈絡圖</h4>
  <svg viewBox="0 0 740 130" width="100%" height="130" xmlns="http://www.w3.org/2000/svg">
    <style>
      .u-box { rx: 6; stroke-width: 1.5; fill: var(--bg-surface, #fff); }
      .u-txt { font-family: monospace; font-size: 12px; font-weight: bold; text-anchor: middle; fill: var(--text-primary, #0f172a); }
      .u-sub { font-family: sans-serif; font-size: 10px; text-anchor: middle; fill: var(--text-muted, #64748b); }
      .u-rel { stroke: var(--accent-primary, #2563eb); stroke-width: 1.5; fill: none; }
    </style>
    <!-- STUDENT -->
    <g transform="translate(20, 35)">
      <rect x="0" y="0" width="130" height="55" class="u-box" stroke="#3b82f6"/>
      <text x="65" y="24" class="u-txt">STUDENT</text>
      <text x="65" y="42" class="u-sub">學生編號 / 主修</text>
    </g>
    <line x1="150" y1="62" x2="195" y2="62" class="u-rel"/>
    <!-- GRADE_REPORT -->
    <g transform="translate(195, 35)">
      <rect x="0" y="0" width="150" height="55" class="u-box" stroke="#10b981"/>
      <text x="75" y="24" class="u-txt">GRADE_REPORT</text>
      <text x="75" y="42" class="u-sub">成績登記 (關聯表)</text>
    </g>
    <line x1="345" y1="62" x2="390" y2="62" class="u-rel"/>
    <!-- SECTION -->
    <g transform="translate(390, 35)">
      <rect x="0" y="0" width="140" height="55" class="u-box" stroke="#f59e0b"/>
      <text x="70" y="24" class="u-txt">SECTION</text>
      <text x="70" y="42" class="u-sub">開課識別碼 / 授課教師</text>
    </g>
    <line x1="530" y1="62" x2="575" y2="62" class="u-rel"/>
    <!-- COURSE -->
    <g transform="translate(575, 35)">
      <rect x="0" y="0" width="140" height="55" class="u-box" stroke="#8b5cf6"/>
      <text x="70" y="24" class="u-txt">COURSE</text>
      <text x="70" y="42" class="u-sub">課號 / 學分 / 開課系所</text>
    </g>
  </svg>
</div>

---

## 2. 原始資料精華與引用
> 「8.1 Hands-on Exercise：SQL Queries (UNIVERSITY)  
> - 開始前：從 Moodle 下載 week06_university.sql，貼到 Supabase SQL Editor 並按 Run
> - Given（已知）：
>   - STUDENT(Name, Student_number, Class, Major)
>   - COURSE(Course_name, Course_number, Credit_hours, Department)
>   - SECTION(Section_identifier, Course_number, Semester, Year, Instructor)
>   - GRADE_REPORT(Student_number, Section_identifier, Grade)
>   - PREREQUISITE(Course_number, Prerequisite_number)
> 
> 8.2 Questions 題目：
> 1. 列出所有 CS 主修學生的姓名，依姓名排序
> 2. 列出每位學生的姓名，以及他在 Fall 2008 修過的課程名稱
> 3. 列出每門課程及其 section identifiers，包含沒有開 section 的課程
> 4. 列出從未拿過 'A' 的學生姓名
> 5. 對每門課程，顯示課號與開設的 section 數
> 6. 列出教過超過一個 section 的授課教師
> 7. 建立一個 view TRANSCRIPT(Student_name, Course_name, Semester, Year, Grade)，再對其中一位學生查詢它
> 8. 在 STUDENT 新增一個欄位 Email VARCHAR(50)，再更新某一位學生的 email」

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 合併表與外部合併](2026-10-14-sql-joined-tables-and-outer-joins.md)、[SQL 聚合函數與分組](2026-10-14-sql-aggregates-and-grouping.md)、[SQL 視圖](2026-10-14-sql-views-virtual-tables.md)
- **標籤**：`#SQL` `#實作練習` `#UNIVERSITY` `#練習題` `#總結`
