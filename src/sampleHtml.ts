export const sampleHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FineTune Studio</title>
    <style>
      :root {
        --color-primary: #141413;
        --color-body: #3d3d3a;
        --color-subtext: #504e49;
        --color-metadata: #6b6a64;
        --color-vermilion: #A33A2A;
        --color-vermilion-soft: #DDBBB2;
        --color-bg-paper: #f5f4ed;
        --color-bg-card: #faf9f5;
        --color-border: #e8e6dc;
        --color-grid: #e5e3d8;

        color: var(--color-body);
        background: var(--color-bg-paper);
        font-family: TsangerJinKai02, "Source Han Serif SC", "Source Han Serif CN", "Noto Serif CJK SC", "Songti SC", STSong, "AR PL New Sung", "SimSun", Charter, Georgia, serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--color-bg-paper);
        color: var(--color-body);
      }

      .page {
        min-height: 100vh;
        color: var(--color-primary);
      }

      .nav {
        height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 44px;
        border-bottom: 1px solid var(--color-border);
        background: rgba(245, 244, 237, 0.9);
        backdrop-filter: blur(12px);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 19px;
        font-weight: 600;
        color: var(--color-primary);
      }

      .brand-mark {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 6px;
        background: var(--color-vermilion);
        color: var(--color-bg-card);
        font-size: 14px;
        font-weight: 500;
      }

      .links {
        display: flex;
        gap: 24px;
      }

      .links a {
        color: var(--color-metadata);
        text-decoration: none;
        font-size: 14px;
      }

      .links a:hover {
        color: var(--color-vermilion);
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.78fr);
        gap: 36px;
        padding: 62px 44px 42px;
      }

      .hero-copy {
        max-width: 640px;
      }

      .kicker {
        margin: 0 0 14px;
        color: var(--color-vermilion);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-family: Charter, Georgia, serif;
      }

      h1 {
        margin: 0 0 20px;
        font-size: clamp(36px, 5.5vw, 64px);
        font-weight: 600;
        line-height: 1.12;
        letter-spacing: -0.5px;
        color: var(--color-primary);
      }

      .subtitle {
        max-width: 560px;
        margin: 0 0 26px;
        color: var(--color-subtext);
        font-size: 18px;
        line-height: 1.55;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      button,
      .button-link {
        width: fit-content;
        border: 0;
        border-radius: 6px;
        background: var(--color-vermilion);
        color: var(--color-bg-card);
        padding: 13px 20px;
        font: inherit;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
      }

      button:hover,
      .button-link:hover {
        background: #8b3124;
      }

      .quiet-button {
        border: 1px solid var(--color-border);
        background: var(--color-bg-card);
        color: var(--color-body);
      }

      .quiet-button:hover {
        background: var(--color-bg-paper);
        border-color: var(--color-vermilion-soft);
        color: var(--color-vermilion);
      }

      .preview-card {
        align-self: stretch;
        min-height: 372px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 20px;
        padding: 22px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background: var(--color-bg-card);
        box-shadow: 0 8px 24px rgba(20, 20, 19, 0.04);
      }

      .preview-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--color-metadata);
        font-size: 13px;
        font-family: Charter, Georgia, serif;
      }

      .status-pill {
        border-radius: 4px;
        background: var(--color-bg-paper);
        border: 1px solid var(--color-vermilion-soft);
        color: var(--color-vermilion);
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
      }

      .preview-image {
        width: 100%;
        min-height: 150px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid var(--color-border);
        display: block;
      }

      .metric-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .metric {
        border: 1px solid var(--color-border);
        border-radius: 6px;
        padding: 14px;
        background: var(--color-bg-paper);
      }

      .metric strong {
        display: block;
        margin-bottom: 6px;
        color: var(--color-vermilion);
        font-size: 20px;
        font-weight: 600;
      }

      .metric span {
        color: var(--color-metadata);
        font-size: 12px;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        padding: 6px 44px 40px;
      }

      .feature {
        padding: 22px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background: var(--color-bg-card);
      }

      .feature h2 {
        margin: 0 0 10px;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-primary);
        border-left: 2px solid var(--color-vermilion);
        padding-left: 8px;
      }

      .feature p {
        margin: 0;
        color: var(--color-body);
        font-size: 13.5px;
        line-height: 1.5;
      }

      .note {
        margin: 0 44px 48px;
        padding: 24px 28px;
        border-left: 4px solid var(--color-vermilion);
        border-radius: 6px;
        background: var(--color-bg-card);
        color: var(--color-body);
        font-size: 20px;
        line-height: 1.48;
        border-top: 1px solid var(--color-border);
        border-right: 1px solid var(--color-border);
        border-bottom: 1px solid var(--color-border);
      }

      .note small {
        display: block;
        margin-top: 12px;
        color: var(--color-metadata);
        font-size: 13px;
        font-family: Charter, Georgia, serif;
      }

      dialog.modal-card {
        width: min(520px, calc(100% - 40px));
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 0;
        background: var(--color-bg-card);
        color: var(--color-primary);
        box-shadow: 0 16px 48px rgba(20, 20, 19, 0.08);
      }

      dialog.modal-card::backdrop {
        background: rgba(20, 20, 19, 0.3);
      }

      .modal-inner {
        padding: 30px;
      }

      .modal-kicker {
        margin: 0 0 12px;
        color: var(--color-vermilion);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-family: Charter, Georgia, serif;
      }

      .modal-card h2 {
        margin: 0 0 14px;
        font-size: 26px;
        font-weight: 600;
        line-height: 1.18;
      }

      .modal-card p {
        color: var(--color-body);
        line-height: 1.55;
        font-size: 14px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 22px;
      }

      @media (max-width: 760px) {
        .nav,
        .links,
        .hero,
        .features,
        .metric-row {
          display: block;
        }

        .nav,
        .hero,
        .features {
          padding-left: 24px;
          padding-right: 24px;
        }

        .links {
          display: none;
        }

        .preview-card {
          margin-top: 28px;
        }

        .feature,
        .metric {
          margin-bottom: 14px;
        }

        .note {
          margin-left: 24px;
          margin-right: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <nav class="nav">
        <div class="brand"><span class="brand-mark">&lt;/&gt;</span> FineTune</div>
        <div class="links">
          <a href="#workflow">流程</a>
          <a href="#preview">预览</a>
          <a href="#export">导出</a>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-copy">
          <p class="kicker">Visual HTML Editing</p>
          <h1>所见即所得，精准微调</h1>
          <p class="subtitle">把生成后的 HTML 放进一个真实预览环境，直接选择文字、按钮、图片和区块，快速修正内容、样式与发布前细节。</p>
          <div class="hero-actions">
            <a class="button-link" href="#workflow">查看工作流</a>
            <button class="quiet-button" data-hft-open-modal>打开说明弹窗</button>
          </div>
        </div>

        <aside class="preview-card" id="preview">
          <div class="preview-card-header">
            <span>Live Preview</span>
            <span class="status-pill">Connected</span>
          </div>
          <img
            class="preview-image"
            src="/danshu_preview.jpg"
            alt="带有设计稿和代码界面的工作台"
          />
          <div class="metric-row">
            <div class="metric"><strong>32</strong><span>可编辑节点</span></div>
            <div class="metric"><strong>0ms</strong><span>整页重载</span></div>
            <div class="metric"><strong>1</strong><span>干净导出</span></div>
          </div>
        </aside>
      </section>

      <section class="features" id="workflow">
        <article class="feature">
          <h2>选择元素</h2>
          <p>在预览里点击文字或图片，右侧立即显示当前元素的可调属性。</p>
        </article>
        <article class="feature">
          <h2>即时更新</h2>
          <p>修改文字、颜色、字号、间距或圆角时，画布会同步响应。</p>
        </article>
        <article class="feature" id="export">
          <h2>干净交付</h2>
          <p>复制或下载前移除编辑器标记，保留可以直接发布的 HTML。</p>
        </article>
      </section>

      <blockquote class="note">
        发布前最重要的不是重做页面，而是把每一个会被看见的细节调准。
        <small>FineTune Studio</small>
      </blockquote>

      <dialog class="modal-card" aria-labelledby="modal-title" data-hft-modal>
        <div class="modal-inner">
          <p class="modal-kicker">Publish Check</p>
          <h2 id="modal-title">先把页面调到可以交付的状态</h2>
          <p>这个弹窗用于测试 HTML FineTune 对模态内容的处理。打开后，你可以点击标题或正文，并在右侧检查器中调整内容、字号、颜色和间距。</p>
          <div class="modal-actions">
            <button class="quiet-button" data-hft-close-modal>关闭</button>
          </div>
        </div>
      </dialog>
    </main>
  </body>
</html>`;
