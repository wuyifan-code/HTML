export const sampleHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FineTune Studio</title>
    <style>
      :root {
        color: #17202a;
        background: #f7faf9;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f7faf9;
      }

      .page {
        min-height: 100vh;
        color: #17202a;
      }

      .nav {
        height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 44px;
        border-bottom: 1px solid #e4ebe8;
        background: rgba(255, 255, 255, 0.86);
        backdrop-filter: blur(12px);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 19px;
        font-weight: 750;
      }

      .brand-mark {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: #12b8a6;
        color: #ffffff;
        font-size: 14px;
      }

      .links {
        display: flex;
        gap: 24px;
      }

      .links a {
        color: #64706d;
        text-decoration: none;
        font-size: 14px;
      }

      .links a:hover {
        color: #0f766e;
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
        color: #0f766e;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      h1 {
        margin: 0 0 20px;
        font-size: clamp(42px, 6vw, 72px);
        font-weight: 760;
        line-height: 0.98;
        letter-spacing: 0;
      }

      .subtitle {
        max-width: 560px;
        margin: 0 0 26px;
        color: #53615e;
        font-size: 19px;
        line-height: 1.65;
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
        border-radius: 8px;
        background: #12b8a6;
        color: #ffffff;
        padding: 13px 18px;
        font: inherit;
        font-weight: 700;
      }

      .button-link {
        display: inline-flex;
        text-decoration: none;
      }

      .quiet-button {
        border: 1px solid #d9e4e1;
        background: #ffffff;
        color: #34413e;
      }

      .preview-card {
        align-self: stretch;
        min-height: 372px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 20px;
        padding: 22px;
        border: 1px solid #dfe8e5;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 22px 52px rgba(18, 32, 43, 0.09);
      }

      .preview-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #66736f;
        font-size: 13px;
      }

      .status-pill {
        border-radius: 999px;
        background: #e8f8f5;
        color: #0f766e;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
      }

      .preview-image {
        width: 100%;
        min-height: 150px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #e1e8e6;
        display: block;
      }

      .metric-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .metric {
        border: 1px solid #e5ece9;
        border-radius: 8px;
        padding: 14px;
        background: #fbfdfc;
      }

      .metric strong {
        display: block;
        margin-bottom: 6px;
        color: #16242a;
        font-size: 21px;
      }

      .metric span {
        color: #66736f;
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
        border: 1px solid #e2ebe8;
        border-radius: 8px;
        background: #ffffff;
      }

      .feature h2 {
        margin: 0 0 9px;
        font-size: 18px;
        font-weight: 740;
      }

      .feature p {
        margin: 0;
        color: #65716e;
        font-size: 14px;
        line-height: 1.58;
      }

      .note {
        margin: 0 44px 48px;
        padding: 24px 28px;
        border-left: 4px solid #ff6f4f;
        border-radius: 8px;
        background: #fffefe;
        color: #34413e;
        font-size: 22px;
        line-height: 1.46;
        box-shadow: 0 18px 40px rgba(18, 32, 43, 0.06);
      }

      .note small {
        display: block;
        margin-top: 12px;
        color: #697672;
        font-size: 13px;
      }

      dialog.modal-card {
        width: min(520px, calc(100% - 40px));
        border: 1px solid #dbe6e3;
        border-radius: 8px;
        padding: 0;
        background: #ffffff;
        color: #17202a;
        box-shadow: 0 24px 80px rgba(17, 24, 39, 0.2);
      }

      dialog.modal-card::backdrop {
        background: rgba(17, 24, 39, 0.24);
      }

      .modal-inner {
        padding: 30px;
      }

      .modal-kicker {
        margin: 0 0 12px;
        color: #0f766e;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .modal-card h2 {
        margin: 0 0 14px;
        font-size: 30px;
        font-weight: 760;
        line-height: 1.15;
      }

      .modal-card p {
        color: #5e6a67;
        line-height: 1.62;
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
            src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=960&q=80"
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
