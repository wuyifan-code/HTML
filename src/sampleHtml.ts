export const sampleHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>静态系统工作室</title>
    <style>
      :root {
        color: #2f2a25;
        background: #faf7f1;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #faf7f1;
      }

      .page {
        min-height: 100vh;
        color: #2f2a25;
      }

      .nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 28px 44px;
        border-bottom: 1px solid #e9dfd2;
      }

      .brand {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 25px;
        font-weight: 500;
        color: #2f2a25;
      }

      .links {
        display: flex;
        gap: 22px;
      }

      .links a {
        color: #5f574d;
        text-decoration: none;
        font-size: 14px;
      }

      .hero {
        display: grid;
        grid-template-columns: 1fr 0.86fr;
        gap: 34px;
        padding: 58px 44px 36px;
      }

      .hero-copy {
        max-width: 640px;
      }

      .kicker {
        margin: 0 0 14px;
        color: #9a7b66;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0 0 22px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 60px;
        font-weight: 500;
        line-height: 1.02;
      }

      .subtitle {
        max-width: 520px;
        margin: 0 0 24px;
        color: #6f665d;
        font-size: 19px;
        line-height: 1.65;
      }

      .body-copy {
        max-width: 560px;
        margin: 0 0 30px;
        color: #5e564d;
        font-size: 16px;
        line-height: 1.72;
      }

      button {
        width: fit-content;
        border: 0;
        border-radius: 0;
        background: #c96f4a;
        color: #fffaf5;
        padding: 13px 20px;
        font: inherit;
        font-weight: 600;
      }

      .note-card {
        align-self: stretch;
        min-height: 360px;
        border: 1px solid #e4d9ca;
        border-radius: 0;
        background: #fffdf8;
        box-shadow: 0 18px 60px rgba(69, 52, 34, 0.12);
        padding: 28px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .note-card span {
        color: #8a7b68;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .note-card strong {
        display: block;
        max-width: 260px;
        margin-top: 12px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 36px;
        font-weight: 500;
        line-height: 1.08;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
        padding: 24px 44px 34px;
      }

      .feature {
        padding: 24px;
        border: 1px solid #eadfce;
        border-radius: 0;
        background: rgba(255, 253, 248, 0.78);
      }

      .feature h2 {
        margin: 0 0 9px;
        font-size: 18px;
        font-weight: 600;
      }

      .feature p {
        margin: 0;
        color: #6f665d;
        font-size: 14px;
        line-height: 1.58;
      }

      blockquote {
        margin: 14px 44px 48px;
        padding: 26px 30px;
        border-left: 4px solid #c96f4a;
        border-radius: 0;
        background: #fffdf8;
        color: #453d35;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 26px;
        line-height: 1.38;
      }

      blockquote small {
        display: block;
        margin-top: 14px;
        color: #7a7368;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        font-size: 13px;
      }

      @media (max-width: 760px) {
        .nav,
        .links,
        .hero,
        .features {
          display: block;
        }

        .nav,
        .hero,
        .features {
          padding-left: 24px;
          padding-right: 24px;
        }

        h1 {
          font-size: 44px;
        }

        .note-card {
          margin-top: 28px;
        }

        .feature {
          margin-bottom: 14px;
        }

        blockquote {
          margin-left: 24px;
          margin-right: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <nav class="nav">
        <div class="brand">静态系统工作室</div>
        <div class="links">
          <a href="#method">方法</a>
          <a href="#work">作品</a>
          <a href="#notes">札记</a>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-copy">
          <p class="kicker">编辑式生产力设计</p>
          <h1>让生成的页面更像精心完成的作品</h1>
          <p class="subtitle">这是一个用于微调语言、节奏和视觉层级的小型页面系统，适合在第一版 HTML 已经生成之后继续打磨。</p>
          <p class="body-copy">你可以用这个示例测试标题修改、段落间距、按钮文字、小卡片列表和引用区块。每一处内容都故意保持克制，方便你直接调整而不必和设计对抗。</p>
          <button>查看方法</button>
        </div>

        <aside class="note-card">
          <div>
            <span>实时编辑界面</span>
            <strong>小改动，也应该立刻被看见</strong>
          </div>
          <p>点击预览中的文字，再用右侧安静的检查器调整细节。</p>
        </aside>
      </section>

      <section class="features" id="method">
        <article class="feature">
          <h2>塑造层级</h2>
          <p>调整字号、字重和对齐方式，让页面按照正确顺序被阅读。</p>
        </article>
        <article class="feature">
          <h2>打磨语言</h2>
          <p>改写标签、标题和辅助说明，不需要重新处理整份文件。</p>
        </article>
        <article class="feature">
          <h2>导出干净 HTML</h2>
          <p>复制或下载前，会自动移除编辑器内部标记。</p>
        </article>
      </section>

      <blockquote id="notes">
        “最后一公里通常不是重写，而是一连串谨慎的小决定。”
        <small>静态系统工作室札记</small>
      </blockquote>
    </main>
  </body>
</html>`;
