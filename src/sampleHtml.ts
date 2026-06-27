export const sampleHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Canvas Demo · HTML FineTune</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --accent: #14b8a6;
        --accent-soft: #e8faf8;
        --accent-deep: #0d9488;
        --text-main: #1a1a2e;
        --text-soft: #5e6670;
        --text-muted: #949aa4;
        --bg: #fafbfc;
        --surface: #ffffff;
        --border: #e8edf2;
        --border-light: #f0f3f6;
        --radius: 12px;
        --radius-sm: 8px;
        --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04);
        --font: "SF Pro Text", "Inter", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        --font-mono: "SF Mono", "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
      }

      body {
        font-family: var(--font);
        color: var(--text-main);
        background: var(--bg);
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
      }

      /* ---- Nav ---- */
      nav {
        position: sticky;
        top: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 64px;
        padding: 0 40px;
        background: rgba(255,255,255,.88);
        backdrop-filter: saturate(180%) blur(16px);
        border-bottom: 1px solid var(--border);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 17px;
        font-weight: 650;
        color: var(--text-main);
      }

      .logo-mark {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--accent), var(--accent-deep));
        color: #fff;
        font-size: 13px;
        font-weight: 700;
      }

      .nav-links {
        display: flex;
        gap: 28px;
        list-style: none;
      }

      .nav-links a {
        color: var(--text-soft);
        text-decoration: none;
        font-size: 14px;
        font-weight: 480;
        transition: color .14s;
      }

      .nav-links a:hover { color: var(--accent-deep); }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 38px;
        padding: 0 18px;
        border: none;
        border-radius: 10px;
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background .14s, box-shadow .14s, transform .1s;
      }

      .btn:active { transform: translateY(.5px); }

      .btn-primary {
        background: var(--accent);
        color: #fff;
        box-shadow: 0 2px 8px rgba(20,184,166,.22);
      }

      .btn-primary:hover {
        background: var(--accent-deep);
        box-shadow: 0 4px 16px rgba(20,184,166,.28);
      }

      .btn-ghost {
        background: transparent;
        color: var(--text-soft);
        border: 1px solid var(--border);
      }

      .btn-ghost:hover {
        background: var(--border-light);
        color: var(--text-main);
      }

      /* ---- Hero ---- */
      .hero {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 48px;
        max-width: 1200px;
        margin: 0 auto;
        padding: 72px 40px 56px;
        align-items: center;
      }

      .hero-tag {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        background: var(--accent-soft);
        color: var(--accent-deep);
        font-size: 12px;
        font-weight: 650;
        margin-bottom: 18px;
      }

      .hero h1 {
        margin: 0 0 18px;
        font-size: clamp(38px, 5.5vw, 64px);
        font-weight: 750;
        line-height: 1.06;
        letter-spacing: -.02em;
      }

      .hero p {
        max-width: 480px;
        margin: 0 0 26px;
        color: var(--text-soft);
        font-size: 17px;
        line-height: 1.68;
      }

      .hero-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .hero-visual {
        position: relative;
        border-radius: 16px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        padding: 28px;
        min-height: 340px;
        display: grid;
        place-items: center;
        overflow: hidden;
        box-shadow: 0 24px 64px rgba(0,0,0,.08);
      }

      .hero-visual::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 20% 20%, rgba(20,184,166,.14) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(20,184,166,.08) 0%, transparent 40%);
      }

      .hero-visual-content {
        position: relative;
        text-align: center;
        color: #e2e8f0;
      }

      .hero-visual-content .code-block {
        display: inline-block;
        padding: 16px 24px;
        border-radius: 10px;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.08);
        font-family: var(--font-mono);
        font-size: 13px;
        line-height: 1.7;
        color: #a5d6a7;
        text-align: left;
        box-shadow: 0 8px 24px rgba(0,0,0,.12);
      }

      .hero-visual-content .code-block .key  { color: #82b1ff; }
      .hero-visual-content .code-block .val  { color: #a5d6a7; }
      .hero-visual-content .code-block .tag  { color: #ffab40; }

      /* ---- Features Grid ---- */
      .section-title {
        text-align: center;
        max-width: 600px;
        margin: 0 auto 48px;
      }

      .section-title h2 {
        font-size: 36px;
        font-weight: 720;
        margin: 0 0 10px;
      }

      .section-title p {
        color: var(--text-soft);
        font-size: 16px;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 40px 64px;
      }

      .card {
        padding: 28px 24px;
        border-radius: var(--radius);
        background: var(--surface);
        border: 1px solid var(--border-light);
        box-shadow: var(--shadow-card);
        transition: box-shadow .18s, transform .14s;
      }

      .card:hover {
        box-shadow: 0 4px 20px rgba(0,0,0,.06);
        transform: translateY(-1px);
      }

      .card-icon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: var(--accent-soft);
        margin-bottom: 16px;
        font-size: 22px;
      }

      .card h3 {
        margin: 0 0 8px;
        font-size: 17px;
        font-weight: 660;
      }

      .card p {
        margin: 0;
        color: var(--text-soft);
        font-size: 14px;
        line-height: 1.62;
      }

      /* ---- Stats ---- */
      .stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        max-width: 1100px;
        margin: 0 auto;
        padding: 48px 40px 56px;
        gap: 20px;
      }

      .stat {
        text-align: center;
        padding: 24px 12px;
        border-radius: var(--radius);
        background: var(--surface);
        border: 1px solid var(--border-light);
      }

      .stat strong {
        display: block;
        font-size: 36px;
        font-weight: 720;
        color: var(--accent-deep);
        margin-bottom: 4px;
      }

      .stat span {
        color: var(--text-muted);
        font-size: 13px;
      }

      /* ---- CTA ---- */
      .cta {
        text-align: center;
        max-width: 640px;
        margin: 0 auto;
        padding: 56px 40px 64px;
      }

      .cta h2 {
        font-size: 32px;
        font-weight: 720;
        margin: 0 0 12px;
      }

      .cta p {
        color: var(--text-soft);
        margin: 0 0 24px;
        font-size: 16px;
      }

      /* ---- Footer ---- */
      footer {
        text-align: center;
        padding: 24px 40px 32px;
        border-top: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 13px;
      }

      footer a {
        color: var(--text-soft);
        text-decoration: none;
      }

      /* ---- Modal ---- */
      dialog {
        width: min(480px, 92vw);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 32px;
        background: var(--surface);
        box-shadow: 0 24px 80px rgba(0,0,0,.14);
      }

      dialog::backdrop {
        background: rgba(15,23,42,.28);
        backdrop-filter: blur(4px);
      }

      dialog h2 {
        font-size: 24px;
        font-weight: 680;
        margin: 0 0 12px;
      }

      dialog p {
        color: var(--text-soft);
        line-height: 1.62;
      }

      @media (max-width: 860px) {
        .hero { grid-template-columns: 1fr; padding: 48px 24px 36px; }
        .features { grid-template-columns: 1fr; padding: 0 24px 48px; }
        .stats { grid-template-columns: 1fr 1fr; padding: 36px 24px 44px; }
        nav { padding: 0 20px; }
        .nav-links { display: none; }
      }
    </style>
  </head>
  <body>
    <nav>
      <div class="logo">
        <div class="logo-mark">&lt;/&gt;</div>
        HTML FineTune
      </div>
      <ul class="nav-links">
        <li><a href="#features">功能</a></li>
        <li><a href="#stats">数据</a></li>
        <li><a href="#start">开始</a></li>
      </ul>
      <button class="btn btn-ghost" data-hft-open-modal>了解更多</button>
    </nav>

    <main>
      <section class="hero">
        <div>
          <span class="hero-tag">v2.0 · 全新升级</span>
          <h1>所见即所得<br />精准微调 HTML</h1>
          <p>把生成后的 HTML 放进真实预览环境，直接选择文字、按钮、图片和区块，快速修正内容、样式与发布前细节。无需刷新，无需编辑源码。</p>
          <div class="hero-actions">
            <button class="btn btn-primary" id="cta-start">开始使用</button>
            <button class="btn btn-ghost" data-hft-open-modal>查看演示</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-visual-content">
            <div class="code-block">
              <span class="key">selector</span> → <span class="val">h1</span><br>
              <span class="key">font-size</span> → <span class="val">64px</span><br>
              <span class="key">color</span> → <span class="val">#1a1a2e</span><br>
              <span class="key">margin</span> → <span class="val">0 auto</span><br>
              <span class="tag">&lt;export /&gt;</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div class="section-title">
          <h2>三步完成发布前调整</h2>
          <p>无需回到代码编辑器，直接在画布中操作。</p>
        </div>
        <div class="features">
          <article class="card">
            <div class="card-icon">🎯</div>
            <h3>点击选择元素</h3>
            <p>在预览里直接点击文字、按钮或图片，右侧面板立即显示对应的可调属性。</p>
          </article>
          <article class="card">
            <div class="card-icon">⚡</div>
            <h3>实时编辑样式</h3>
            <p>修改字号、颜色、间距、圆角或字重，画布同步响应，所见即所得。</p>
          </article>
          <article class="card">
            <div class="card-icon">📦</div>
            <h3>一键干净导出</h3>
            <p>复制或下载前自动移除编辑器标记，得到可以直接发布的生产级 HTML。</p>
          </article>
        </div>
      </section>

      <section id="stats">
        <div class="stats">
          <div class="stat"><strong>32</strong><span>可编辑节点</span></div>
          <div class="stat"><strong>0ms</strong><span>整页重载</span></div>
          <div class="stat"><strong>1次</strong><span>干净导出</span></div>
          <div class="stat"><strong>100%</strong><span>浏览器本地运行</span></div>
        </div>
      </section>

      <section id="start">
        <div class="cta">
          <h2>把每一个细节调准再发布</h2>
          <p>不用重做页面。选中 → 调整 → 导出，三步完成。</p>
          <button class="btn btn-primary">开始免费试用</button>
        </div>
      </section>
    </main>

    <footer>
      HTML FineTune · 浏览器端 HTML 可视化微调工具
      <br>
      <a href="#features">功能</a> · <a href="#stats">数据</a> · <a href="#start">开始</a>
    </footer>

    <dialog data-hft-modal>
      <h2>准备好发布了吗？</h2>
      <p>这个弹窗用于验证 HTML FineTune 对模态内容的处理能力。选中标题或正文，在右侧检查器中调整文字、字号和间距，然后点击按钮关闭。</p>
      <p style="margin-top:12px">一切就绪后，点击导出按钮即可得到干净 HTML。</p>
      <div style="margin-top:20px;text-align:right">
        <button class="btn btn-primary" data-hft-close-modal>关闭弹窗</button>
      </div>
    </dialog>
  </body>
</html>`;