---
title: "SQL 視圖（Views）：虛擬表定義、實作原理、更新限制與存取控制"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "View", "虛擬表", "實體化視圖", "存取控制", "查詢修改"]
summary: "解析視圖作為虛擬表的概念，DBMS 的查詢修改與實體化實作、可更新視圖的嚴格限制（單表、無聚合、含 PK），以及作為資料存取控制的機制。"
---

# SQL 視圖（Views）：虛擬表定義、實作原理、更新限制與存取控制

> **主題摘要**  
> 視圖（View）是從一個或多個基底表（Base Tables）推導出的單一虛擬表（Virtual Table）。視圖本身預設不單獨儲存資料，而是由資料庫管理系統（DBMS）在查詢時動態對應。視圖可用於簡化複雜查詢、遮蔽敏感欄位實現存取控制，並提供資料獨立性。

---

## 1. 核心要點整理
- **為什麼使用視圖？**
  1. **簡化複雜查詢**：將多表合併與複雜條件封裝成單一視圖名稱。
  2. **存取控制（Access Control）**：授權使用者僅能查詢特定視圖（如 `DEPT5EMP` 僅限部門 5），隱藏其他部門或敏感薪資欄位。
  3. **資料結構隱蔽**：隱藏基底資料表（Base Tables）結構的更動。
- **DBMS 的兩種實作方式**：
  - **Query Modification（查詢修改）**：每次查詢 View 時，DBMS 動態將 View 定義合併改寫為針對基底表的查詢。不佔額外空間，但複雜視圖查詢成本較高。
  - **View Materialization（視圖實體化）**：實際將 View 的查詢結果儲存成實體快照。查詢速度極快，但在基底表變更時需要刷新（PostgreSQL 中使用 `REFRESH MATERIALIZED VIEW`）。
- **透過視圖更新（Update）的嚴格限制**：
  - **可更新條件**：通常只有**建立在單一基底表上、沒有聚合函數、且包含該表主鍵（Primary Key）**的視圖，才允許執行 UPDATE 或 INSERT。
  - **不可更新情況**：
    - 含有聚合函數的視圖（如 `SUM(Salary)` 是統計值，無法反推該修改哪位員工）。
    - **含有 JOIN 的視圖往往具有二義性（模糊不清），因此通常不可更新**。

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem; text-align: center; color: var(--text-primary);">視圖兩大實作方式：查詢修改 vs. 視圖實體化</h4>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
    <!-- 方式 A: 查詢修改 -->
    <div style="background: var(--bg-surface); padding: 1.2rem; border: 1.5px solid var(--border-color); border-radius: 8px;">
      <div style="font-weight: bold; color: var(--accent-primary); margin-bottom: 0.5rem;">1. Query Modification (查詢修改)</div>
      <p style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">「動態改寫，零額外空間」</p>
      <div style="font-size: 0.8rem; background: var(--bg-code); padding: 0.6rem; border-radius: 4px; font-family: monospace;">
        SELECT * FROM View<br>
        &nbsp;&nbsp;&darr; (DBMS 自動改寫)<br>
        SELECT ... FROM Base_Table WHERE ...
      </div>
      <div style="margin-top: 0.6rem; font-size: 0.75rem; color: var(--text-muted);">
        ✔ 資料永遠最新<br>
        ✖ 複雜視圖每次皆需重新計算
      </div>
    </div>
    <!-- 方式 B: 實體化 -->
    <div style="background: var(--bg-surface); padding: 1.2rem; border: 1.5px solid var(--border-color); border-radius: 8px;">
      <div style="font-weight: bold; color: #10b981; margin-bottom: 0.5rem;">2. View Materialization (視圖實體化)</div>
      <p style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">「儲存結果快照，讀取飛快」</p>
      <div style="font-size: 0.8rem; background: var(--bg-code); padding: 0.6rem; border-radius: 4px; font-family: monospace;">
        Materialized View (磁碟實際儲存)<br>
        &nbsp;&nbsp;&uarr; (更新方式)<br>
        Immediate / Lazy / Periodic Update
      </div>
      <div style="margin-top: 0.6rem; font-size: 0.75rem; color: var(--text-muted);">
        ✔ 大數據分析查詢速度極高<br>
        ✖ 需呼叫 REFRESH 同步更新
      </div>
    </div>
  </div>
</div>

---

## 2. 原始資料精華與引用
> 「View（視圖）是從其他表推導出的單一表。它是 virtual table（虛擬表）：它的列不一定被儲存。  
> 
> 建立在單一張表上、沒有聚合、且包含 primary key 的 view，通常可以更新；變更會寫到 base table。  
> 有聚合的 view 無法更新（如 UPDATE DEPT_INFO SET Total_sal = 100000 報錯）。  
> 有 joins 的 view 常常模稜兩可，所以通常不可更新。  
> 
> 以視圖做存取控制：View 可以對某些使用者隱藏屬性或列，授權使用者存取這個 view，而不是 base table。」

### 建立視圖範例 (V1, V2)
```sql
-- 沿用 Base Table 屬性名稱
CREATE VIEW WORKS_ON1 AS
SELECT Fname, Lname, Pname, Hours
FROM   EMPLOYEE, PROJECT, WORKS_ON
WHERE  Ssn = Essn AND Pno = Pnumber;

-- 明確自訂欄位名稱且含 GROUP BY
CREATE VIEW DEPT_INFO (Dept_name, No_of_emps, Total_sal) AS
SELECT   Dname, COUNT(*), SUM(Salary)
FROM     DEPARTMENT, EMPLOYEE
WHERE    Dnumber = Dno
GROUP BY Dname;
```

### 存取控制視圖 (DEPT5EMP)
```sql
CREATE VIEW DEPT5EMP AS
SELECT *
FROM   EMPLOYEE
WHERE  Dno = 5;
```

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 合併表與外部合併](2026-10-14-sql-joined-tables-and-outer-joins.md)、[SQL 聚合函數與 GROUP BY](2026-10-14-sql-aggregates-and-grouping.md)
- **標籤**：`#SQL` `#View` `#視圖` `#虛擬表` `#實體化視圖` `#存取控制`
