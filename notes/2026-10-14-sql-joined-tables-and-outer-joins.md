---
title: "SQL 合併表與外部合併：INNER、LEFT、RIGHT 與 FULL OUTER JOIN"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "JOIN", "INNER JOIN", "OUTER JOIN", "LEFT JOIN", "自我合併"]
summary: "全面剖析在 FROM 子句中宣告合併條件、NATURAL JOIN 的風險、四種 JOIN 保留哪一側與 NULL 填補，以及自我合併處理層級主管。"
---

# SQL 合併表與外部合併：INNER、LEFT、RIGHT 與 FULL OUTER JOIN

> **主題摘要**  
> 透過在 FROM 子句中宣告合併表（Joined Table），可以將資料表間的「合併條件（Join Condition）」與資料列的「篩選條件（Selection Condition）」清楚解耦。根據未配對資料的保留方式，SQL 提供內部合併（INNER JOIN）與三種外部合併（LEFT, RIGHT, FULL OUTER JOIN）。

---

## 1. 核心要點整理
- **JOIN ... ON 語法架構**：
  - 格式：`FROM (TABLE_A JOIN TABLE_B ON A.key = B.key)`。
  - 預設的 `JOIN` 即為 **`INNER JOIN`（內部合併）**。
- **NATURAL JOIN（自然合併）與風險注意**：
  - 不必手寫 join condition，系統會自動在**所有同名屬性**上做等值合併。
  - **🔴 注意事項**：若兩張表剛好有語意無關的同名屬性（如皆有 `Name` 或 `Date`），NATURAL JOIN 也會強制比對，容易引發錯誤，實務上應謹慎使用。
- **內部合併 vs. 三種外部合併**：
  - **INNER JOIN**：只有在兩張表**皆有對應配對**時，該列才會出現在結果中。
  - **LEFT OUTER JOIN**：左表的每一列都會保留；右側若無對應則**補 NULL**。
  - **RIGHT OUTER JOIN**：右表的每一列都會保留；左側若無對應則**補 NULL**。
  - **FULL OUTER JOIN**：兩張表的每一列皆會保留；缺漏側皆以 **NULL** 填補。
  - 關鍵字 `OUTER` 可省略（即直接寫 `LEFT JOIN`、`RIGHT JOIN`、`FULL JOIN`）。
- **自我合併（Self-Join）與層級資料**：
  - 當查詢同一張表內的階層關係（如員工與其主管都在 `EMPLOYEE` 表）時，必須給予別名（如 `E` 與 `S`）。
  - 若使用 INNER JOIN，沒有主管的頂層主管（如 Borg）會被漏掉；因此必須改用 **`LEFT OUTER JOIN`** 才能完整列出所有員工。

---

### 圖解與範例資料對照（講義精確數據）

#### 範例資料與配對情況（以 EMPLOYEE 與 DEPARTMENT 為例）
左表 Lee 的部門為 NULL（新員工無部門）；右表部門 7 Marketing 剛成立無員工：

![四種 JOIN 的範例資料與匹配情況](./images/2026-10-14-sql-joins-p35-data.png)

#### 四種 JOIN 的結果比對（2 列、3 列、3 列、4 列）
展示不同 JOIN 方式產生的結果列數與差異：

![四種 JOIN 的查詢結果對比](./images/2026-10-14-sql-joins-p36-results.png)

#### 保留哪一側與 NULL 填補規則
歸納未匹配列的保留方式：

![四種 JOIN 保留哪一邊的規則歸納表](./images/2026-10-14-sql-joins-p37-rules.png)

#### LEFT OUTER JOIN 自我合併逐步分析 (Q8B)
員工 Borg 的 `Super_ssn` 為 NULL。若用 INNER JOIN 僅有 7 列（遺失 Borg）；改用 LEFT OUTER JOIN 則完整回傳 8 列，Borg 的主管顯示為 NULL：

![LEFT OUTER JOIN 逐步比對流程圖](./images/2026-10-14-sql-joins-p39-left-join-step.png)

---

## 2. 原始資料精華與引用
> 「INNER JOIN（預設）：只有在另一張表有對應時，該列才會出現  
> LEFT OUTER JOIN：左表的每一列都會出現；沒有對應時，右側以 NULL 填入  
> RIGHT OUTER JOIN：右表的每一列都會出現  
> FULL OUTER JOIN：兩張表的每一列都會出現  
> 關鍵字 OUTER 可以省略：LEFT JOIN、RIGHT JOIN、FULL JOIN」

### 查詢每位員工與其主管姓名 (Q8B)
包含沒有主管的員工：
```sql
SELECT E.Lname AS Employee_name,
       S.Lname AS Supervisor_name
FROM   (EMPLOYEE AS E LEFT OUTER JOIN EMPLOYEE AS S
        ON E.Super_ssn = S.Ssn);
```

### 多重合併（Multiway JOIN）範例 (Q2A)
合併表可以多層巢狀，將 join conditions 完全集中於 FROM：
```sql
SELECT Pnumber, Dnum, Lname, Address, Bdate
FROM   ((PROJECT JOIN DEPARTMENT ON Dnum = Dnumber)
         JOIN EMPLOYEE ON Mgr_ssn = Ssn)
WHERE  Plocation = 'Stafford';
```

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL NULL 值與三值邏輯](2026-10-14-sql-null-and-three-valued-logic.md)、[SQL 視圖（含 JOIN 之可更新限制）](2026-10-14-sql-views-virtual-tables.md)
- **標籤**：`#SQL` `#JOIN` `#INNER_JOIN` `#OUTER_JOIN` `#LEFT_JOIN` `#自我合併`
