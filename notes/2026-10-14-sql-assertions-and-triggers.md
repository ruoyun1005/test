---
title: "SQL 完整性限制超越關聯模型：斷言（Assertions）與觸發器（Triggers）"
date: "2026-10-14"
category: "進階 SQL"
tags: ["SQL", "斷言", "觸發器", "ECA", "主動式資料庫", "CHECK"]
summary: "探討複雜業務規則的宣告方式：CREATE ASSERTION 違規查詢防護，以及 CREATE TRIGGER 的事件—條件—動作（ECA）主動式資料庫架構。"
---

# SQL 完整性限制超越關聯模型：斷言（Assertions）與觸發器（Triggers）

> **主題摘要**  
> 資料庫內建的傳統限制（PRIMARY KEY、FOREIGN KEY、NOT NULL、CHECK）主要作用於單一資料表或欄位，無法表達牽涉多資料表或全局的複雜「業務規則（Business Rule）」。SQL 提供斷言（CREATE ASSERTION）與觸發器（CREATE TRIGGER）兩種機制來實現進階約束與主動控制。

---

## 1. 核心要點整理
- **超出關聯模型的業務規則**：
  - 典型範例：「員工的薪資不得超過其所屬部門經理的薪資」。
  - 這類跨表、動態比較的限制條件，單靠單表的 `CHECK` 無法直接表達。
- **斷言（Assertions）概念與語法**：
  - **語法哲學**：先撰寫一個「選出所有**違反規則**之列」的查詢，再以 **`NOT EXISTS`** 包裹起來。
  - 當任何操作導致違規查詢結果「存在列」時，資料庫會拒絕該操作。
  - **資料庫支援注意**：PostgreSQL（包含 Supabase）原生不支援 `CREATE ASSERTION`，實務上須改用觸發器（Triggers）來實現。
- **觸發器（Triggers）：Event–Condition–Action（ECA 規則）**：
  - 擁有這類主動執行規則的資料庫稱為**主動式資料庫（Active Database）**。
  - **三大組成要素**：
    1. **Event（事件）**：啟動觸發器的資料變更（`INSERT`、`UPDATE`、`DELETE`），可指定 `BEFORE` 或 `AFTER`。
    2. **Condition（條件）**：選擇性的條件檢查（`WHEN (...)`），只有評估為 TRUE 時才會執行動作。
    3. **Action（動作）**：條件成立時執行的程序或指令（如通知、拋出錯誤、自動補償）。
  - **關鍵字 `NEW` 與 `OLD`**：`NEW` 指變更後的新列值，`OLD` 指變更前的舊列值。

### 概念圖解說明（純 HTML / SVG 繪製）
<div class="concept-diagram">
  <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem; text-align: center; color: var(--text-primary);">觸發器（Trigger）的 ECA 生命週期流程架構</h4>
  <svg viewBox="0 0 740 140" width="100%" height="140" xmlns="http://www.w3.org/2000/svg">
    <style>
      .eca-box { rx: 8; stroke-width: 1.5; }
      .eca-title { font-family: sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; }
      .eca-sub { font-family: monospace; font-size: 11px; text-anchor: middle; }
      .eca-arrow { stroke: var(--text-muted, #94a3b8); stroke-width: 2; fill: none; marker-end: url(#arr2); }
    </style>
    <defs>
      <marker id="arr2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/>
      </marker>
    </defs>
    <!-- 1. Event -->
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="200" height="95" class="eca-box" fill="var(--bg-surface, #fff)" stroke="#3b82f6"/>
      <text x="100" y="32" class="eca-title" fill="#2563eb">1. Event（事件）</text>
      <text x="100" y="55" class="eca-sub" fill="var(--text-primary, #0f172a)">BEFORE / AFTER</text>
      <text x="100" y="75" class="eca-sub" fill="var(--text-muted, #64748b)">INSERT / UPDATE / DELETE</text>
    </g>
    <path d="M 225, 67 L 260, 67" class="eca-arrow"/>
    <!-- 2. Condition -->
    <g transform="translate(265, 20)">
      <rect x="0" y="0" width="210" height="95" class="eca-box" fill="var(--bg-surface, #fff)" stroke="#f59e0b"/>
      <text x="105" y="32" class="eca-title" fill="#d97706">2. Condition（條件）</text>
      <text x="105" y="55" class="eca-sub" fill="var(--text-primary, #0f172a)">WHEN (NEW.Salary &gt; ...)</text>
      <text x="105" y="75" class="eca-sub" fill="var(--text-muted, #64748b)">評估是否滿足執行門檻</text>
    </g>
    <path d="M 480, 67 L 515, 67" class="eca-arrow"/>
    <!-- 3. Action -->
    <g transform="translate(520, 20)">
      <rect x="0" y="0" width="200" height="95" class="eca-box" fill="var(--bg-surface, #fff)" stroke="#10b981"/>
      <text x="100" y="32" class="eca-title" fill="#059669">3. Action（動作）</text>
      <text x="100" y="55" class="eca-sub" fill="var(--text-primary, #0f172a)">執行特定 Procedure</text>
      <text x="100" y="75" class="eca-sub" fill="var(--text-muted, #64748b)">通知、拋錯或同步更新</text>
    </g>
  </svg>
</div>

---

## 2. 原始資料精華與引用
> 「SQL 提供兩種機制：  
> - CREATE ASSERTION：宣告一個一般性的限制
> - CREATE TRIGGER：指定在特定事件發生時自動執行的動作
>
> 斷言做法：寫一個選出違反規則之列的查詢，再用 NOT EXISTS 包起來。  
> 只有在單一表上的簡單 CHECK 不夠時才使用 assertion。  
> Note：PostgreSQL（Supabase）不支援 CREATE ASSERTION，改用 triggers。」

### 斷言宣告範例 (SALARY_CONSTRAINT)
```sql
CREATE ASSERTION SALARY_CONSTRAINT
CHECK (NOT EXISTS
        (SELECT *
         FROM   EMPLOYEE E, EMPLOYEE M, DEPARTMENT D
         WHERE  E.Salary > M.Salary AND E.Dno = D.Dnumber
                AND D.Mgr_ssn = M.Ssn));
```

### 觸發器宣告範例 (R5, Standard SQL)
當員工薪資高於其主管薪資時觸發：
```sql
CREATE TRIGGER SALARY_VIOLATION
BEFORE INSERT OR UPDATE OF Salary, Super_ssn
       ON EMPLOYEE
FOR EACH ROW
WHEN (NEW.Salary > (SELECT Salary FROM EMPLOYEE
                    WHERE  Ssn = NEW.Super_ssn))
  INFORM_SUPERVISOR(NEW.Super_ssn, NEW.Ssn);
```

---

## 3. 補充說明與關聯標籤
- **關聯主題**：[SQL 綱要修改（ALTER TABLE 約束增刪）](2026-10-14-sql-schema-modification.md)、[SQL 巢狀查詢與 NOT EXISTS](2026-10-14-sql-division-not-exists.md)
- **標籤**：`#SQL` `#斷言` `#ASSERTION` `#觸發器` `#TRIGGER` `#ECA` `#主動式資料庫`
