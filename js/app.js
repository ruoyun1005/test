/**
 * 個人筆記整理網站 - 核心腳本 (app.js)
 * 職責：筆記資料載入、卡片網格渲染、分類/搜尋篩選、深淺色切換、Markdown 渲染
 * 遵循 AGENTS.md 規範：零框架、相容 GitHub Pages 相對路徑
 */

document.addEventListener('DOMContentLoaded', () => {
  // 狀態管理
  let allNotes = [];
  let currentCategory = 'all';
  let searchQuery = '';

  // DOM 元素快取
  const brandHome = document.getElementById('brand-home');
  const themeToggle = document.getElementById('theme-toggle');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const categoryPills = document.getElementById('category-pills');
  
  const viewGrid = document.getElementById('view-grid');
  const viewReading = document.getElementById('view-reading');
  const notesGrid = document.getElementById('notes-grid');
  const gridCount = document.getElementById('grid-count');
  const emptyState = document.getElementById('empty-state');
  
  const btnBack = document.getElementById('btn-back');
  const artCategory = document.getElementById('art-category');
  const artDate = document.getElementById('art-date');
  const artTitle = document.getElementById('art-title');
  const artTags = document.getElementById('art-tags');
  const artBody = document.getElementById('art-body');

  // ==========================================
  // 1. 深淺色主題邏輯 (Theme Controller)
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('notes_theme') || 'system';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.body.setAttribute('data-theme', theme);
    }
    localStorage.setItem('notes_theme', theme);
  }

  themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  // 監聽系統主題切換
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('notes_theme') === 'system') {
      applyTheme('system');
    }
  });

  // ==========================================
  // 2. 筆記資料載入與索引初始化
  // ==========================================
  async function loadNotesData() {
    try {
      const res = await fetch('./data/notes.json');
      if (!res.ok) throw new Error(`載入 notes.json 失敗: ${res.status}`);
      allNotes = await res.json();
      buildCategoryPills();
      renderGrid();
      handleHashNavigation();
    } catch (err) {
      console.error(err);
      notesGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>⚠️ 無法載入筆記索引 (<code>data/notes.json</code>)。請確認靜態伺服器環境或檔案路徑。</p>
        </div>
      `;
    }
  }

  // ==========================================
  // 3. 分類藥丸按鈕 (Category Filter)
  // ==========================================
  function buildCategoryPills() {
    const categories = ['all', ...new Set(allNotes.map(n => n.category).filter(Boolean))];
    categoryPills.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `pill-btn ${cat === currentCategory ? 'active' : ''}`;
      btn.textContent = cat === 'all' ? '全部筆記' : cat;
      btn.dataset.category = cat;
      btn.addEventListener('click', () => {
        currentCategory = cat;
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGrid();
        if (!viewReading.classList.contains('hidden')) {
          showGridView();
        }
      });
      categoryPills.appendChild(btn);
    });
  }

  // ==========================================
  // 4. 卡片網格渲染 (Card Grid View)
  // ==========================================
  function renderGrid() {
    const filtered = allNotes.filter(note => {
      const matchCat = currentCategory === 'all' || note.category === currentCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        note.title.toLowerCase().includes(q) ||
        (note.summary && note.summary.toLowerCase().includes(q)) ||
        (note.tags && note.tags.some(t => t.toLowerCase().includes(q)))
      );
      return matchCat && matchSearch;
    });

    gridCount.textContent = `${filtered.length} 篇`;
    notesGrid.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    filtered.forEach(note => {
      const card = document.createElement('article');
      card.className = 'note-card';
      
      const tagsHtml = (note.tags || []).map(t => `<span class="tag-badge">#${t}</span>`).join('');

      card.innerHTML = `
        <div class="card-top">
          <div class="card-meta">
            <span class="badge-category">${note.category || '未分類'}</span>
            <span class="card-date">${note.date || ''}</span>
          </div>
          <h3 class="card-title">${note.title}</h3>
          <p class="card-summary">${note.summary || ''}</p>
        </div>
        <div class="card-bottom">
          ${tagsHtml}
        </div>
      `;

      card.addEventListener('click', () => {
        window.location.hash = `note=${encodeURIComponent(note.slug || note.path)}`;
      });

      notesGrid.appendChild(card);
    });
  }

  // ==========================================
  // 5. 搜尋功能 (Search Interaction)
  // ==========================================
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    searchClear.classList.toggle('hidden', !searchQuery);
    renderGrid();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.add('hidden');
    renderGrid();
  });

  // ==========================================
  // 6. 單篇筆記閱讀 (Reading View)
  // ==========================================
  async function openNote(noteIdentifier) {
    const note = allNotes.find(n => n.slug === noteIdentifier || n.path === noteIdentifier);
    if (!note) {
      showGridView();
      return;
    }

    // 更新閱讀頭部資訊
    artCategory.textContent = note.category || '未分類';
    artDate.textContent = note.date || '';
    artTitle.textContent = note.title;
    artTags.innerHTML = (note.tags || []).map(t => `<span class="tag-badge">#${t}</span>`).join('');
    artBody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">正在載入筆記內文...</div>';

    showReadingView();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch(`./notes/${note.path}`);
      if (!res.ok) throw new Error(`無法讀取筆記檔案: ${note.path}`);
      const rawMd = await res.text();
      
      // 剝除 YAML Frontmatter
      const cleanMd = rawMd.replace(/^---[\s\S]*?---\n*/, '');
      
      // 渲染 Markdown
      artBody.innerHTML = renderMarkdown(cleanMd);
    } catch (err) {
      console.error(err);
      artBody.innerHTML = `
        <div class="empty-state">
          <p>⚠️ 載入筆記內容失敗 (${err.message})。</p>
        </div>
      `;
    }
  }

  // Markdown 渲染器（具備圖解完全隔離保護機制）
  function renderMarkdown(md) {
    // 1. 抽取所有 concept-diagram 區塊，保證 SVG / HTML 原始結構不被 Markdown 解析器破壞
    const diagrams = [];
    let text = md.replace(/<div class="concept-diagram">[\s\S]*?<\/div>/gi, (match) => {
      const id = diagrams.length;
      diagrams.push(match);
      return `\n\n%%CONCEPT_DIAGRAM_${id}%%\n\n`;
    });

    let html = '';
    if (typeof marked !== 'undefined' && marked.parse) {
      html = marked.parse(text, { breaks: true, gfm: true });
    } else {
      html = fallbackMarkdownParser(text);
    }

    // 2. 將 HTML 圖解完整還原回 DOM，並清理外層可能被包裹的 <p>
    diagrams.forEach((diag, id) => {
      const token = `%%CONCEPT_DIAGRAM_${id}%%`;
      html = html.replace(new RegExp(`<p>\\s*${token}\\s*<\\/p>`, 'g'), diag)
                 .replace(new RegExp(token, 'g'), diag);
    });

    return html;
  }

  // 強化版輕量級 Markdown 備援解析器（支援表格、清單、引文、代碼與乾淨 HTML）
  function fallbackMarkdownParser(src) {
    let html = src;
    
    // 預處理 code blocks（以 token 隔離保護）
    const codeBlocks = [];
    html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
      const idx = codeBlocks.length;
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      codeBlocks.push(`<pre><code class="language-${lang}">${escaped}</code></pre>`);
      return `%%CODEBLOCK_${idx}%%`;
    });

    // 處理 Markdown 表格 (| a | b |)
    html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
      const rows = match.trim().split(/\r?\n/);
      if (rows.length < 2) return match;
      let tableHtml = '<table>';
      rows.forEach((row, idx) => {
        if (row.includes('---')) return; // 略過表格分隔線
        const cols = row.split('|').slice(1, -1).map(c => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        tableHtml += '<tr>' + cols.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
      });
      tableHtml += '</table>';
      return tableHtml;
    });

    // 處理 headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 處理 blockquote
    html = html.replace(/^\> (.*$)/gim, '<blockquote><p>$1</p></blockquote>');

    // 處理 images: ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // 處理 links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // 處理 inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 處理 bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 處理 lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // 還原 code blocks
    codeBlocks.forEach((block, idx) => {
      html = html.replace(`%%CODEBLOCK_${idx}%%`, block);
    });

    // 處理段落（跳過已知 HTML 區塊與圖解標記）
    const paragraphs = html.split(/\n{2,}/).map(chunk => {
      chunk = chunk.trim();
      if (!chunk) return '';
      if (chunk.startsWith('<h') || chunk.startsWith('<pre') || chunk.startsWith('<blockquote') ||
          chunk.startsWith('<ul') || chunk.startsWith('<ol') || chunk.startsWith('<div') ||
          chunk.startsWith('<table') || chunk.startsWith('%%CONCEPT_DIAGRAM')) {
        return chunk;
      }
      return `<p>${chunk.replace(/\n/g, '<br>')}</p>`;
    });

    return paragraphs.join('\n');
  }

  // 視圖切換助手
  function showGridView() {
    viewReading.classList.add('hidden');
    viewGrid.classList.remove('active');
    viewGrid.classList.remove('hidden');
    viewGrid.classList.add('active');
  }

  function showReadingView() {
    viewGrid.classList.remove('active');
    viewGrid.classList.add('hidden');
    viewReading.classList.remove('hidden');
    viewReading.classList.add('active');
  }

  // ==========================================
  // 7. 導航與事件監聽
  // ==========================================
  btnBack.addEventListener('click', () => {
    window.location.hash = '';
  });

  brandHome.addEventListener('click', () => {
    currentCategory = 'all';
    searchQuery = '';
    searchInput.value = '';
    searchClear.classList.add('hidden');
    document.querySelectorAll('.pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.category === 'all');
    });
    window.location.hash = '';
    renderGrid();
    showGridView();
  });

  function handleHashNavigation() {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const noteId = params.get('note');

    if (noteId) {
      openNote(noteId);
    } else {
      showGridView();
    }
  }

  window.addEventListener('hashchange', handleHashNavigation);

  // 初始化入口
  initTheme();
  loadNotesData();
});
