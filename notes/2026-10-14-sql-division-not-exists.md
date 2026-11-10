---
title: "相關巢狀查詢與「對所有（For All）」條件：NOT EXISTS 與 EXCEPT"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "EXISTS", "NOT EXISTS", "EXCEPT", "集合除法", "全稱量化"]
summary: "探討使用 correlated query 逐列比對，並透過雙重否定（NOT EXISTS 搭配 EXCEPT 差集為空）實現全稱量化（For All / 集合除法）查詢。"
---

# 相關巢狀查詢與「對所有（For All）」條件：NOT EXISTS 與 EXCEPT

> **主題摘要**  
> 在關聯式代數中，「選取參與所有指定專案的員工」屬於經典的集合除法（Division）問題。SQL 本身沒有直接的「FOR ALL」關鍵字，但可以透過**雙重否定邏輯**——即「不存在任何一個指定專案是該員工沒有參與的」，藉由 `NOT EXISTS` 與 `EXCEPT` 的組合精確表達。

---

## 1. 核心要點整理
- **EXISTS 與 NOT EXISTS 運算子**：
  - **`EXISTS (Q)`**：只要子查詢 `Q` 的結果中**至少存在一列**，即回傳 `TRUE`。
  - **`NOT EXISTS (Q)`**：只有當子查詢 `Q` 的結果是**完全為空（Empty）**時，才回傳 `TRUE`。
  - 運算只關心列是否存在，因此子查詢通常使用 `SELECT *`。
- **「For All（對所有）」的邏輯構建想法**：
  - 目標：找出參與了特定部門「所有」控管專案的員工。
  - 核心邏輯：計算差集：**`{該部門控管的專案集合} − {該員工實際參與的專案集合}`**。
  - **判定標準**：如果兩者相減的差集結果為**空集合（`{}`）**，代表該員工「沒有遺漏任何專案」，即參與了全部專案！

---

### 圖解與範例數據對照（講義精確數據）

#### 情況一：部門 5 控管專案 `{1, 2, 3}`（無人參與全部）
當查詢條件為部門 5（專案包含 1, 2, 3）時，計算每位員工的相減差集，沒有任何員工的差集為空，因此查詢結果為空（empty）：

![部門 5 控管專案差集比對表](./images/2026-10-14-sql-division-p29-dept5.png)

#### 情況二：部門 4 控管專案 `{10, 30}`（Zelaya 與 Jabbar 滿足全體條件）
若改為查詢部門 4（專案包含 10, 30），Zelaya 與 Jabbar 參與的專案正好包含 `{10, 30}`，相減差集為 `{}`（Nothing missing? 為 Yes），成功取出結果：

![部門 4 控管專案差集比對表](./images/2026-10-14-sql-division-p30-dept4.jpg)

---

## 2. 原始資料精華與引用
> 「EXISTS (Q)：若巢狀查詢 Q 的結果至少有一列，則為 TRUE  
> NOT EXISTS (Q)：若 Q 的結果是空的，則為 TRUE  
> 通常與 correlated nested query 一起使用；只在乎列是否存在，所以巢狀查詢常用 SELECT *
> 
> 以 NOT EXISTS 與 EXCEPT 表達「對所有」 (Q3A)：
> Idea（想法）：`{部門 5 的專案} − {這位員工的專案} = 空` → 這位員工參與了全部專案」

### 經典 SQL 查詢語法 (Q3A)
列出參與部門 5 所控管的所有專案的員工姓名：
```sql
SELECT Fname, Lname
FROM   EMPLOYEE
WHERE  NOT EXISTS (
         (SELECT Pnumber FROM PROJECT
          WHERE  Dnum = 5)
         EXCEPT
         (SELECT Pno FROM WORKS_ON
          WHERE  Ssn = Essn));
```

### EXISTS 判斷經理是否有眷屬範例 (Q7)
列出至少有一位眷屬的經理姓名：
```sql
SELECT Fname, Lname
FROM   EMPLOYEE
WHERE  EXISTS (SELECT * FROM DEPENDENT
               WHERE  Ssn = Essn)
  AND  EXISTS (SELECT * FROM DEPARTMENT
               WHERE  Ssn = Mgr_ssn);
```
- **查詢結果**：`Franklin Wong, Jennifer Wallace`

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 巢狀查詢與集合比對](2026-10-14-sql-nested-queries.md)、[SQL 集合運算](2026-10-14-sql-set-operations.md)
- **標籤**：`#SQL` `#EXISTS` `#NOT_EXISTS` `#EXCEPT` `#集合除法` `#全稱量化`
