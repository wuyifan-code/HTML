const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/HistoryPanel-Bg4pXNI8.js","assets/rolldown-runtime-Bh1tDfsg.js","assets/vendor-icons-CVtwCv21.js","assets/vendor-react-CAD8J_Q_.js","assets/ExportPreviewDialog-SoTD0Y-6.js"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-Bh1tDfsg.js";import{A as t,C as n,D as r,E as i,M as a,N as o,O as s,S as c,T as l,_ as u,a as d,b as f,d as p,f as m,g as h,h as g,i as _,k as v,m as y,n as b,o as x,p as S,r as C,s as w,t as T,u as E,v as D,w as O,x as k,y as A}from"./vendor-icons-CVtwCv21.js";import{n as ee,t as te}from"./vendor-react-CAD8J_Q_.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var j=e(o(),1),ne=e(ee(),1),M=te();function re({canUndo:e,canRedo:n,hasModal:i,isModalOpen:a,onUndo:o,onRedo:s,onToggleHistory:c,onOpenModal:u,onCloseModal:d,onImport:p,onCopy:m,onExport:h}){return(0,M.jsxs)(`div`,{className:`toolbar`,"aria-label":`编辑器工具栏`,children:[(0,M.jsxs)(`div`,{className:`toolbar-group`,"aria-label":`历史操作`,children:[(0,M.jsxs)(`button`,{className:`ghost-button toolbar-button`,type:`button`,onClick:o,disabled:!e,title:`撤销 · Ctrl+Z / Cmd+Z`,children:[(0,M.jsx)(b,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`撤销`})]}),(0,M.jsxs)(`button`,{className:`ghost-button toolbar-button`,type:`button`,onClick:s,disabled:!n,title:`重做 · Ctrl+Y / Shift+Cmd+Z`,children:[(0,M.jsx)(E,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`重做`})]}),(0,M.jsxs)(`button`,{className:`ghost-button toolbar-button`,type:`button`,onClick:c,title:`查看编辑历史`,children:[(0,M.jsx)(O,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`历史`})]})]}),(0,M.jsx)(`div`,{className:`toolbar-separator`,"aria-hidden":`true`}),(0,M.jsxs)(`div`,{className:`toolbar-group`,"aria-label":`页面功能`,children:[(0,M.jsxs)(`button`,{className:`ghost-button toolbar-button compact-toolbar-button`,type:`button`,onClick:u,disabled:!i||a,title:`打开预览中的弹窗`,children:[(0,M.jsx)(f,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`打开弹窗`})]}),(0,M.jsxs)(`button`,{className:`ghost-button toolbar-button compact-toolbar-button`,type:`button`,onClick:d,disabled:!i||!a,title:`关闭预览中的弹窗`,children:[(0,M.jsx)(T,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`关闭弹窗`})]}),(0,M.jsxs)(`label`,{className:`ghost-button toolbar-button compact-toolbar-button file-button`,title:`导入 .html 文件`,children:[(0,M.jsx)(l,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`导入 HTML`}),(0,M.jsx)(`input`,{type:`file`,accept:`.html,.htm,text/html`,onChange:e=>{let t=e.target.files?.[0];t&&p(t),e.currentTarget.value=``}})]}),(0,M.jsxs)(`button`,{className:`ghost-button toolbar-button compact-toolbar-button`,type:`button`,onClick:m,children:[(0,M.jsx)(t,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`复制 HTML`})]})]}),(0,M.jsx)(`div`,{className:`toolbar-separator`,"aria-hidden":`true`}),(0,M.jsxs)(`button`,{className:`primary-button toolbar-button export-toolbar-button`,type:`button`,onClick:h,children:[(0,M.jsx)(r,{size:17,strokeWidth:1.75}),(0,M.jsx)(`span`,{className:`button-label`,children:`导出 HTML`})]})]})}function ie({canUndo:e,canRedo:t,hasModal:n,isModalOpen:r,onUndo:i,onRedo:a,onToggleHistory:o,onOpenModal:s,onCloseModal:c,onImport:l,onCopy:u,onExport:d}){return(0,M.jsxs)(`header`,{className:`app-header`,children:[(0,M.jsxs)(`div`,{className:`brand-block`,children:[(0,M.jsx)(`div`,{className:`brand-mark`,"aria-hidden":`true`,children:`</>`}),(0,M.jsxs)(`div`,{className:`brand-copy`,children:[(0,M.jsx)(`h1`,{children:`HTML FineTune`}),(0,M.jsx)(`p`,{className:`brand-subtitle`,children:`实时页面微调工作台`})]})]}),(0,M.jsx)(re,{canUndo:e,canRedo:t,hasModal:n,isModalOpen:r,onUndo:i,onRedo:a,onToggleHistory:o,onOpenModal:s,onCloseModal:c,onImport:l,onCopy:u,onExport:d})]})}function ae({value:e,domTree:t,selectedId:r,onChange:i,onImport:a,onSelectElement:o,isCollapsed:s,onToggleCollapse:c,placement:u,onTogglePlacement:d,showImportDropzone:f,sourceView:p,onSourceViewChange:m}){let _=p,b=m,[x,C]=(0,j.useState)(!1),[w,T]=(0,j.useState)(``),E=u===`bottom`,D=(0,j.useMemo)(()=>{let e=w.trim().toLowerCase();return e?t.filter(t=>[t.tagName,t.text,t.label].some(t=>(t||``).toLowerCase().includes(e))):t},[t,w]),O=(0,j.useMemo)(()=>(e.match(/\r\n|\r|\n/g)?.length??0)+1,[e]),k=e=>{let t=e?.[0];t&&a(t)};return s?(0,M.jsx)(`section`,{className:`panel collapsed-panel collapsed-source-panel`,"aria-label":`HTML 源码已收起`,children:(0,M.jsxs)(`button`,{className:`collapse-rail-button`,type:`button`,onClick:c,"aria-label":`展开 HTML 源码`,title:`展开 HTML 源码`,children:[(0,M.jsx)(y,{size:18,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:`展开源码`})]})}):(0,M.jsxs)(`section`,{className:`panel source-panel${E?` source-panel-bottom`:``}`,"aria-label":`HTML 源码编辑器`,children:[(0,M.jsxs)(`div`,{className:`panel-header`,children:[(0,M.jsxs)(`div`,{className:`panel-title`,children:[_===`source`?(0,M.jsx)(v,{size:18,strokeWidth:1.75}):(0,M.jsx)(n,{size:18,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:_===`source`?`源码`:`结构导航`})]}),(0,M.jsxs)(`div`,{className:`source-header-actions`,children:[(0,M.jsxs)(`div`,{className:`segmented-control compact-segmented`,"aria-label":`左侧视图`,children:[(0,M.jsxs)(`button`,{className:`segmented-button${_===`source`?` segmented-button-active`:``}`,type:`button`,"aria-pressed":_===`source`,onClick:()=>b(`source`),children:[(0,M.jsx)(v,{size:14,strokeWidth:1.75}),`源码`]}),(0,M.jsxs)(`button`,{className:`segmented-button${_===`tree`?` segmented-button-active`:``}`,type:`button`,"aria-pressed":_===`tree`,onClick:()=>b(`tree`),children:[(0,M.jsx)(n,{size:14,strokeWidth:1.75}),`结构`]})]}),(0,M.jsx)(`button`,{className:`icon-button`,type:`button`,onClick:d,"aria-label":E?`将源码区移回左侧`:`将源码区移到底部`,title:E?`源码区移回左侧`:`源码区移到底部`,children:E?(0,M.jsx)(S,{size:18,strokeWidth:1.75}):(0,M.jsx)(h,{size:18,strokeWidth:1.75})}),(0,M.jsx)(`button`,{className:`icon-button`,type:`button`,onClick:c,"aria-label":`收起 HTML 源码`,title:`收起 HTML 源码`,children:(0,M.jsx)(g,{size:18,strokeWidth:1.75})})]})]}),(0,M.jsx)(`div`,{className:`source-panel-shell`,children:(0,M.jsx)(`div`,{className:`source-panel-main`,children:_===`source`?(0,M.jsxs)(M.Fragment,{children:[f?(0,M.jsxs)(`label`,{className:`source-dropzone${x?` source-dropzone-active`:``}`,onDragEnter:e=>{e.preventDefault(),C(!0)},onDragOver:e=>{e.preventDefault(),C(!0)},onDragLeave:()=>C(!1),onDrop:e=>{e.preventDefault(),C(!1),k(e.dataTransfer.files)},children:[(0,M.jsx)(l,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:`拖拽 HTML 文件到此处`}),(0,M.jsx)(`small`,{children:`或点击导入 .html`}),(0,M.jsx)(`input`,{type:`file`,accept:`.html,.htm,text/html`,onChange:e=>{k(e.target.files),e.currentTarget.value=``}})]}):null,(0,M.jsxs)(`div`,{className:`source-editor-shell`,children:[(0,M.jsxs)(`div`,{className:`source-editor-meta`,children:[(0,M.jsxs)(`span`,{className:`source-editor-language`,children:[(0,M.jsx)(v,{size:13,strokeWidth:1.75}),`HTML`]}),(0,M.jsxs)(`span`,{children:[O.toLocaleString(),` 行`]})]}),(0,M.jsx)(`textarea`,{className:`source-textarea`,spellCheck:!1,value:e,onChange:e=>i(e.target.value),"aria-label":`可编辑 HTML 源码`})]})]}):(0,M.jsxs)(M.Fragment,{children:[f?(0,M.jsxs)(`label`,{className:`source-dropzone source-dropzone-compact${x?` source-dropzone-active`:``}`,onDragEnter:e=>{e.preventDefault(),C(!0)},onDragOver:e=>{e.preventDefault(),C(!0)},onDragLeave:()=>C(!1),onDrop:e=>{e.preventDefault(),C(!1),k(e.dataTransfer.files)},children:[(0,M.jsx)(l,{size:16,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:`导入 HTML`}),(0,M.jsx)(`small`,{children:`拖入文件或点击选择`}),(0,M.jsx)(`input`,{type:`file`,accept:`.html,.htm,text/html`,onChange:e=>{k(e.target.files),e.currentTarget.value=``}})]}):null,(0,M.jsxs)(`div`,{className:`source-outline-header`,children:[(0,M.jsx)(`span`,{children:`可编辑元素`}),(0,M.jsxs)(`small`,{children:[D.length,` / `,t.length]})]}),(0,M.jsx)(N,{value:w,onChange:T}),(0,M.jsx)(P,{nodes:D,selectedId:r,onSelectElement:o,emptyText:w?`没有匹配的元素`:`没有可编辑文本元素`})]})})}),(0,M.jsxs)(`div`,{className:`panel-footer`,children:[(0,M.jsx)(`span`,{children:_===`source`?`源码直改`:`点击元素定位到预览`}),(0,M.jsxs)(`span`,{children:[e.length.toLocaleString(),` 字符`]})]})]})}var oe=(0,j.memo)(ae);function N({value:e,onChange:t}){return(0,M.jsxs)(`label`,{className:`tree-search`,children:[(0,M.jsx)(w,{size:14,strokeWidth:1.75}),(0,M.jsx)(`input`,{type:`search`,value:e,placeholder:`查找标签、文本或类名`,onChange:e=>t(e.target.value)})]})}function P({nodes:e,selectedId:t,onSelectElement:n,emptyText:r,compact:i=!1}){let a=e[0]?.depth??0;return(0,M.jsx)(`div`,{className:`dom-tree${i?` dom-tree-compact`:``}`,role:`tree`,"aria-label":`可编辑元素结构`,children:e.length===0?(0,M.jsx)(`div`,{className:`dom-tree-empty`,children:r}):e.map(e=>{let r=Math.min(Math.max(e.depth-a,0),i?3:8);return(0,M.jsxs)(`button`,{className:`dom-tree-node${e.hftId===t?` dom-tree-node-active`:``}`,type:`button`,role:`treeitem`,"aria-selected":e.hftId===t,"aria-level":r+1,"data-depth":r,style:{"--tree-indent":`${r*12}px`},title:e.label,onClick:()=>n(e.hftId),children:[(0,M.jsx)(`span`,{className:`dom-tree-tag`,children:e.tagName}),(0,M.jsx)(`span`,{className:`dom-tree-label`,children:e.text||e.label})]},e.hftId)})})}function F(e,t,n,r){let i=(0,j.useRef)(null),a=(0,j.useRef)(t),o=(0,j.useRef)(n),s=(0,j.useRef)(r),[c,l]=(0,j.useState)(!1);(0,j.useEffect)(()=>{a.current=t,o.current=n,s.current=r},[r,t,n]);let u=(0,j.useCallback)(()=>{l(!1)},[]),d=(0,j.useCallback)(()=>{l(!0)},[]);return(0,j.useEffect)(()=>{let t=t=>{t.data?.type?.startsWith(`HTML_FINETUNE_`)&&t.data?.token===e&&(t.data?.type===`HTML_FINETUNE_ELEMENT_SELECTED`&&a.current(t.data.payload),t.data?.type===`HTML_FINETUNE_ELEMENT_ACTION`&&s.current?.(t.data.payload.hftId,t.data.payload.action),t.data?.type===`HTML_FINETUNE_PREVIEW_READY`&&l(!0),t.data?.type===`HTML_FINETUNE_MODAL_STATE`&&o.current?.(t.data.payload))};return window.addEventListener(`message`,t),()=>window.removeEventListener(`message`,t)},[e]),{iframeRef:i,isReady:c,markReady:d,markRendering:u}}var I=`data-hft-id`,se=`data-html-finetune-editable`,L=`data-html-finetune-hovered`,ce=`data-html-finetune-selected`,R=[`h1`,`h2`,`h3`,`h4`,`h5`,`h6`,`p`,`span`,`a`,`button`,`li`,`blockquote`,`small`,`strong`,`em`],le=[`section`,`article`,`aside`,`div`,`blockquote`],ue=[`img`],de=[`html`,`body`,`head`,`script`,`style`,`meta`,`link`,`title`,`svg`,`path`,`video`,`canvas`,`audio`,`source`,`picture`,`iframe`,`noscript`,`template`,`br`,`hr`],fe=new Set(R),pe=new Set(le),me=new Set(ue),he=new Set(de);function ge(e){if(!(e instanceof HTMLElement))return!1;let t=e.tagName.toLowerCase();return he.has(t)?!1:me.has(t)?!0:_e(e).trim()?fe.has(t)?!0:pe.has(t)?ve(e):!1:!1}function _e(e){return e.textContent??``}function ve(e){return Array.from(e.childNodes).some(e=>e.nodeType===Node.TEXT_NODE&&(e.textContent??``).trim().length>0)}function ye(){return{editableTags:R,editableBlockTags:le,editableMediaTags:ue,nonEditableTags:de,hftIdAttribute:I,editableAttribute:se,hoverAttribute:L,selectedAttribute:ce}}function be({html:e,selectedId:t,reloadNonce:n,patchCommand:r,modalCommand:a,selectCommand:o,viewportMode:s,isFocusPreview:l,onViewportModeChange:u,onToggleFocusPreview:f,onElementSelected:p,onModalStateChange:m,onElementAction:h,onReadyChange:g}){let v=(0,j.useRef)(V()),y=(0,j.useRef)(`*`),{iframeRef:b,isReady:x,markReady:S,markRendering:C}=F(v.current,p,m,h),w=(0,j.useMemo)(()=>Ce(e,v.current),[n]),T=Se[s];return(0,j.useEffect)(()=>{C(),g(!1)},[C,g,w]),(0,j.useEffect)(()=>{g(x)},[x,g]),(0,j.useEffect)(()=>{!r||!x||b.current?.contentWindow?.postMessage({type:`HTML_FINETUNE_PATCH_ELEMENT`,hftId:r.hftId,patch:r.patch,token:v.current},y.current)},[b,x,r]),(0,j.useEffect)(()=>{!a||!x||b.current?.contentWindow?.postMessage({type:`HTML_FINETUNE_MODAL_COMMAND`,action:a.action,token:v.current},y.current)},[b,x,a]),(0,j.useEffect)(()=>{let e=o?.hftId||t;!e||!x||b.current?.contentWindow?.postMessage({type:`HTML_FINETUNE_SELECT_ELEMENT`,hftId:e,token:v.current},y.current)},[b,x,o,t]),(0,M.jsxs)(`section`,{className:`panel preview-panel`,"aria-label":`HTML 实时预览`,children:[(0,M.jsxs)(`div`,{className:`panel-header`,children:[(0,M.jsxs)(`div`,{className:`panel-title`,children:[(0,M.jsx)(i,{size:18,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:`Canvas`})]}),(0,M.jsxs)(`div`,{className:`preview-header-actions`,children:[(0,M.jsx)(`div`,{className:`preview-control-cluster`,children:(0,M.jsxs)(`div`,{className:`segmented-control preview-mode-control`,"aria-label":`预览宽度`,children:[(0,M.jsx)(z,{mode:`desktop`,activeMode:s,label:`桌面`,onClick:u,icon:(0,M.jsx)(D,{size:15,strokeWidth:1.75})}),(0,M.jsx)(z,{mode:`tablet`,activeMode:s,label:`平板`,onClick:u,icon:(0,M.jsx)(_,{size:15,strokeWidth:1.75})}),(0,M.jsx)(z,{mode:`mobile`,activeMode:s,label:`手机`,onClick:u,icon:(0,M.jsx)(d,{size:15,strokeWidth:1.75})})]})}),(0,M.jsxs)(`div`,{className:`preview-readouts`,"aria-label":`画布读数`,children:[(0,M.jsxs)(`div`,{className:`canvas-size-control`,"aria-label":`当前画布尺寸`,children:[(0,M.jsx)(`span`,{children:T.width}),(0,M.jsx)(`small`,{children:`x`}),(0,M.jsx)(`span`,{children:T.height}),(0,M.jsx)(c,{size:13,strokeWidth:1.75})]}),(0,M.jsx)(`span`,{className:`canvas-zoom-pill`,children:`100%`})]}),(0,M.jsxs)(`button`,{className:`ghost-button compact-action preview-focus-button`,type:`button`,onClick:f,title:l?`恢复三栏编辑器`:`隐藏编辑器，全屏预览`,children:[l?(0,M.jsx)(A,{size:15,strokeWidth:1.75}):(0,M.jsx)(k,{size:15,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:l?`恢复`:`全屏`})]})]})]}),(0,M.jsx)(`div`,{className:`iframe-shell iframe-shell-${s}`,children:(0,M.jsx)(`div`,{className:`preview-viewport preview-viewport-${s}`,children:(0,M.jsx)(`iframe`,{ref:b,title:`HTML FineTune 实时预览`,sandbox:`allow-scripts`,srcDoc:w,onLoad:S})})})]})}var xe=(0,j.memo)(be),Se={desktop:{width:1280,height:800},tablet:{width:820,height:1180},mobile:{width:390,height:844}};function z({mode:e,activeMode:t,label:n,icon:r,onClick:i}){let a=e===t;return(0,M.jsxs)(`button`,{className:`segmented-button${a?` segmented-button-active`:``}`,type:`button`,"aria-pressed":a,title:`${n}预览`,onClick:()=>i(e),children:[r,(0,M.jsx)(`span`,{children:n})]})}function Ce(e,t){let n=B(t);return Te(Te(/<html[\s>]/i.test(e)?e:we(e),`head`,`<style id="html-finetune-bridge-style">
    [data-html-finetune-editable="true"] {
      cursor: text !important;
    }
    [data-html-finetune-hovered="true"]:not([data-html-finetune-selected="true"]) {
      outline: 1.5px dashed #19a997 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 5px rgba(25, 169, 151, 0.11) !important;
      border-radius: 6px !important;
    }
    [data-html-finetune-selected="true"] {
      outline: 2px solid #19a997 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(25, 169, 151, 0.14) !important;
      border-radius: 6px !important;
    }
    #html-finetune-floating-toolbar {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center !important;
      gap: 6px !important;
      min-height: 44px !important;
      padding: 5px !important;
      border: 1px solid rgba(148, 163, 184, 0.28) !important;
      border-radius: 11px !important;
      background: rgba(255, 255, 255, 0.96) !important;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.8) inset,
        0 2px 4px rgba(15, 23, 42, 0.04),
        0 8px 18px rgba(15, 23, 42, 0.10),
        0 28px 56px rgba(15, 23, 42, 0.18) !important;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      backdrop-filter: blur(18px) !important;
      -webkit-backdrop-filter: blur(18px) !important;
      transform-origin: center bottom !important;
      isolation: isolate !important;
      animation: hft-toolbar-enter 220ms cubic-bezier(0.16, 1, 0.3, 1) both !important;
    }

    @keyframes hft-toolbar-enter {
      0% {
        opacity: 0 !important;
        transform: translateY(8px) scale(0.94) !important;
      }
      100% {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }
    }
    #html-finetune-floating-toolbar::after {
      content: "" !important;
      position: absolute !important;
      left: 50% !important;
      bottom: -6px !important;
      width: 10px !important;
      height: 10px !important;
      transform: translateX(-50%) rotate(45deg) !important;
      border-right: 1px solid rgba(148, 163, 184, 0.34) !important;
      border-bottom: 1px solid rgba(148, 163, 184, 0.34) !important;
      background: rgba(255, 255, 255, 0.98) !important;
    }
    #html-finetune-floating-toolbar[data-placement="below"] {
      transform-origin: center top !important;
    }
    #html-finetune-floating-toolbar[data-placement="below"]::after {
      top: -6px !important;
      bottom: auto !important;
      border: 0 !important;
      border-left: 1px solid rgba(148, 163, 184, 0.34) !important;
      border-top: 1px solid rgba(148, 163, 184, 0.34) !important;
    }
    #html-finetune-floating-toolbar .hft-toolbar-meta {
      height: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 7px !important;
      padding: 0 10px !important;
      border-radius: 7px !important;
      background: #f3fbf9 !important;
      color: #0f766e !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
    }
    #html-finetune-floating-toolbar .hft-toolbar-dot {
      width: 7px !important;
      height: 7px !important;
      border-radius: 999px !important;
      background: #19a997 !important;
      box-shadow: 0 0 0 3px rgba(25, 169, 151, 0.16) !important;
    }
    #html-finetune-floating-toolbar .hft-toolbar-divider {
      width: 1px !important;
      height: 24px !important;
      border-radius: 999px !important;
      background: linear-gradient(180deg, transparent 0%, #cfdad7 40%, #cfdad7 60%, transparent 100%) !important;
    }
    #html-finetune-floating-toolbar button {
      position: relative !important;
      min-width: 38px !important;
      height: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 7px !important;
      padding: 0 10px !important;
      border: 1px solid transparent !important;
      border-radius: 7px !important;
      background: transparent !important;
      color: #334155 !important;
      font: inherit !important;
      font-size: 12px !important;
      font-weight: 650 !important;
      cursor: pointer !important;
      transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease !important;
    }
    #html-finetune-floating-toolbar button svg {
      width: 15px !important;
      height: 15px !important;
      flex: 0 0 auto !important;
      stroke: currentColor !important;
      stroke-width: 1.75 !important;
      fill: none !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }
    #html-finetune-floating-toolbar button:hover {
      color: #0f766e !important;
      background: rgba(25, 169, 151, 0.1) !important;
      border-color: rgba(25, 169, 151, 0.18) !important;
      box-shadow: 0 6px 14px rgba(15, 118, 110, 0.12) !important;
      transform: translateY(-1px) scale(1.04) !important;
    }
    #html-finetune-floating-toolbar button:active {
      transform: translateY(1px) scale(0.97) !important;
      transition-duration: 60ms !important;
    }
    #html-finetune-floating-toolbar button[data-action="delete"] {
      color: #b42318 !important;
    }
    #html-finetune-floating-toolbar button[data-action="delete"]:hover {
      color: #ffffff !important;
      background: #e5483f !important;
      border-color: #e5483f !important;
      box-shadow: 0 6px 18px rgba(229, 72, 63, 0.28) !important;
      transform: translateY(-1px) scale(1.04) !important;
    }
  </style>`),`body`,n)}function we(e){return`<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${e}</body></html>`}function Te(e,t,n){let r=RegExp(`</${t}>`,`i`);return r.test(e)?e.replace(r,`${n}</${t}>`):`${e}${n}`}function B(e){let t=ye();return`<script>
    (() => {
      const bridgeToken = ${JSON.stringify(e)};
      const config = ${JSON.stringify(t)};
      const editableTags = new Set(config.editableTags.map((tag) => tag.toUpperCase()));
      const editableBlockTags = new Set(config.editableBlockTags.map((tag) => tag.toUpperCase()));
      const editableMediaTags = new Set(config.editableMediaTags.map((tag) => tag.toUpperCase()));
      const nonEditableTags = new Set(config.nonEditableTags.map((tag) => tag.toUpperCase()));
      const modalSelectors = [
        "dialog",
        "[role='dialog']",
        "[aria-modal='true']",
        "[data-hft-modal]",
        "[data-modal]",
        ".modal",
        ".dialog",
        ".popup"
      ];

      function hasDirectText(element) {
        return Array.from(element.childNodes).some((node) => {
          return node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim().length > 0;
        });
      }

      function isEditableElement(element) {
        if (!element || !(element instanceof HTMLElement)) return false;
        if (element.closest("[data-html-finetune-ui='true']")) return false;
        if (nonEditableTags.has(element.tagName)) return false;
        if (editableMediaTags.has(element.tagName)) return true;
        const text = (element.textContent || "").trim();
        if (!text) return false;
        if (editableTags.has(element.tagName)) return true;
        if (editableBlockTags.has(element.tagName)) return hasDirectText(element);
        return false;
      }

      function findEditableElement(start) {
        let current = start;
        while (current && current !== document.body) {
          if (isEditableElement(current)) return current;
          current = current.parentElement;
        }
        return null;
      }

      function getElementIndex(element) {
        let index = 1;
        let sibling = element.previousElementSibling;
        while (sibling) {
          if (sibling.tagName === element.tagName) index += 1;
          sibling = sibling.previousElementSibling;
        }
        return index;
      }

      function getDomPath(element) {
        const segments = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          const tag = current.tagName.toLowerCase();
          if (tag === "html") {
            segments.unshift("html");
            break;
          }
          segments.unshift(tag + ":nth-of-type(" + getElementIndex(current) + ")");
          current = current.parentElement;
        }
        return segments.join(" > ");
      }

      function colorToHex(color) {
        const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
        if (match) {
          return "#" + [match[1], match[2], match[3]]
            .map((part) => Number(part).toString(16).padStart(2, "0"))
            .join("");
        }
        if (/^#[0-9a-f]{6}$/i.test(color)) return color;
        return "#141413";
      }

      function describeLocation(element) {
        const classes = element.className && typeof element.className === "string"
          ? "." + element.className.trim().split(/\\s+/).filter(Boolean).join(".")
          : "";
        const id = element.id ? "#" + element.id : "";
        return element.tagName.toLowerCase() + id + classes;
      }

      function clearSelection() {
        document.querySelectorAll("[" + config.selectedAttribute + "='true']").forEach((element) => {
          element.removeAttribute(config.selectedAttribute);
        });
      }

      function clearHover() {
        document.querySelectorAll("[" + config.hoverAttribute + "='true']").forEach((element) => {
          element.removeAttribute(config.hoverAttribute);
        });
      }

      function markEditableElements() {
        document.querySelectorAll("body *").forEach((element) => {
          if (isEditableElement(element)) {
            element.setAttribute(config.editableAttribute, "true");
          }
        });
      }

      function makePayload(element) {
        const computed = window.getComputedStyle(element);
        return {
          hftId: element.getAttribute(config.hftIdAttribute) || "",
          path: getDomPath(element),
          tagName: element.tagName.toLowerCase(),
          id: element.id || "",
          className: typeof element.className === "string" ? element.className : "",
          text: element.textContent || "",
          styles: {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            color: colorToHex(computed.color),
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing === "normal" ? "0px" : computed.letterSpacing,
            textAlign: computed.textAlign,
            backgroundColor: colorToHex(computed.backgroundColor),
            borderColor: colorToHex(computed.borderColor),
            borderWidth: computed.borderWidth,
            borderStyle: computed.borderStyle,
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow === "none" ? "" : computed.boxShadow,
            width: computed.width,
            height: computed.height,
            maxWidth: computed.maxWidth === "none" ? "" : computed.maxWidth,
            objectFit: computed.objectFit,
            marginTop: computed.marginTop,
            marginBottom: computed.marginBottom,
            paddingTop: computed.paddingTop,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight
          },
          effects: {
            hoverBackgroundColor: ""
          },
          attributes: {
            src: element instanceof HTMLImageElement ? element.getAttribute("src") || "" : "",
            alt: element instanceof HTMLImageElement ? element.getAttribute("alt") || "" : ""
          },
          location: describeLocation(element),
          hasInlineStyle: Boolean(element.getAttribute("style")),
          canEditText: !(element instanceof HTMLImageElement) && !element.querySelector("*")
        };
      }

      function selectElement(element, shouldNotify = true) {
        clearSelection();
        clearHover();
        element.setAttribute(config.selectedAttribute, "true");
        positionFloatingToolbar(element);
        if (shouldNotify) {
          window.parent.postMessage({
            type: "HTML_FINETUNE_ELEMENT_SELECTED",
            token: bridgeToken,
            payload: makePayload(element)
          }, "*");
        }
      }

      function ensureFloatingToolbar() {
        const existing = document.getElementById("html-finetune-floating-toolbar");
        if (existing) return existing;

        const toolbar = document.createElement("div");
        toolbar.id = "html-finetune-floating-toolbar";
        toolbar.setAttribute("data-html-finetune-ui", "true");
        toolbar.setAttribute("role", "toolbar");
        toolbar.setAttribute("aria-label", "HTML FineTune 快捷工具");
        toolbar.innerHTML = [
          '<div class="hft-toolbar-meta" aria-hidden="true"><span class="hft-toolbar-dot"></span><strong data-role="tag">element</strong></div>',
          '<span class="hft-toolbar-divider" aria-hidden="true"></span>',
          '<button type="button" data-action="duplicate" title="复制元素" aria-label="复制元素"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M4 16V6a2 2 0 0 1 2-2h10"></path></svg><span>复制</span></button>',
          '<button type="button" data-action="delete" title="删除元素" aria-label="删除元素"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg><span>删除</span></button>'
        ].join("");

        toolbar.addEventListener("mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        }, true);

        toolbar.addEventListener("click", (event) => {
          const button = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
          if (!button) return;
          event.preventDefault();
          event.stopPropagation();
          const hftId = toolbar.getAttribute("data-hft-id") || "";
          const action = button.getAttribute("data-action") || "";
          if (!hftId || !action) return;

          window.parent.postMessage({
            type: "HTML_FINETUNE_ELEMENT_ACTION",
            token: bridgeToken,
            payload: { hftId, action }
          }, "*");
        }, true);

        document.body.appendChild(toolbar);
        return toolbar;
      }

      function hideFloatingToolbar() {
        const toolbar = document.getElementById("html-finetune-floating-toolbar");
        if (!toolbar) return;
        toolbar.style.display = "none";
        toolbar.removeAttribute("data-hft-id");
      }

      function positionFloatingToolbar(element) {
        const toolbar = ensureFloatingToolbar();
        const rect = element.getBoundingClientRect();
        const tagLabel = toolbar.querySelector("[data-role='tag']");
        if (tagLabel) tagLabel.textContent = element.tagName.toLowerCase();
        toolbar.setAttribute("data-hft-id", element.getAttribute(config.hftIdAttribute) || "");
        toolbar.style.display = "flex";

        const toolbarWidth = toolbar.offsetWidth || 188;
        const toolbarHeight = toolbar.offsetHeight || 42;
        const visibleBounds = getVisibleFrameBounds();
        const hasRoomAbove = rect.top >= toolbarHeight + 12;
        toolbar.setAttribute("data-placement", hasRoomAbove ? "above" : "below");
        const preferredTop = hasRoomAbove ? rect.top - toolbarHeight - 12 : rect.bottom + 12;
        const maxTop = Math.max(8, visibleBounds.height - toolbarHeight - 8);
        const top = Math.max(8, Math.min(preferredTop, maxTop));
        const maxLeft = Math.max(8, visibleBounds.width - toolbarWidth - 8);
        const preferredLeft = rect.left + rect.width / 2 - toolbarWidth / 2;
        const left = Math.max(8, Math.min(preferredLeft, maxLeft));

        toolbar.style.top = top + "px";
        toolbar.style.left = left + "px";
      }

      let cachedFrameBounds = null;
      let pendingReposition = false;
      function invalidateFrameBounds() {
        cachedFrameBounds = null;
      }

      function getVisibleFrameBounds() {
        if (cachedFrameBounds) return cachedFrameBounds;
        const fallback = { width: window.innerWidth, height: window.innerHeight };
        try {
          if (!window.frameElement || !window.parent) return fallback;
          const frameRect = window.frameElement.getBoundingClientRect();
          const parentWidth = window.parent.innerWidth || fallback.width;
          const parentHeight = window.parent.innerHeight || fallback.height;
          const bounds = {
            width: Math.max(120, Math.min(fallback.width, parentWidth - frameRect.left - 8)),
            height: Math.max(80, Math.min(fallback.height, parentHeight - frameRect.top - 8))
          };
          cachedFrameBounds = bounds;
          return bounds;
        } catch {
          return fallback;
        }
      }

      function repositionFloatingToolbar() {
        const selected = document.querySelector("[" + config.selectedAttribute + "='true']");
        if (selected && selected instanceof HTMLElement) {
          positionFloatingToolbar(selected);
        } else {
          hideFloatingToolbar();
        }
      }

      function queryByHftId(hftId) {
        if (!hftId) return null;
        return Array.from(document.querySelectorAll("[" + config.hftIdAttribute + "]")).find((element) => {
          return element.getAttribute(config.hftIdAttribute) === hftId;
        }) || null;
      }

      function getModalElements() {
        return Array.from(document.querySelectorAll(modalSelectors.join(","))).filter((element) => {
          return element instanceof HTMLElement;
        });
      }

      // 增量补丁:文本/样式/属性就地应用,避免整文档重建。
      function patchElement(hftId, patch) {
        const element = queryByHftId(hftId);
        if (!element || !(element instanceof HTMLElement)) return;

        if (typeof patch.text === "string" && element.children.length === 0) {
          element.textContent = patch.text;
        }

        if (patch.attributes) {
          Object.keys(patch.attributes).forEach((attribute) => {
            const value = patch.attributes[attribute];
            if (typeof value !== "string") return;
            if (attribute === "alt") {
              element.setAttribute(attribute, value);
              return;
            }
            if (value.trim()) {
              element.setAttribute(attribute, value);
            } else {
              element.removeAttribute(attribute);
            }
          });
        }

        if (patch.styles) {
          Object.keys(patch.styles).forEach((property) => {
            const value = patch.styles[property];
            if (typeof value !== "string") return;
            const kebab = property.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
            if (value.trim()) {
              element.style.setProperty(kebab, value);
            } else {
              element.style.removeProperty(kebab);
            }
          });
        }

        if (patch.effects && typeof patch.effects.hoverBackgroundColor !== "undefined") {
          updateHoverBackgroundRule(element, patch.effects.hoverBackgroundColor);
        }

        if (element.getAttribute(config.selectedAttribute) === "true") {
          positionFloatingToolbar(element);
        }
      }

      function updateHoverBackgroundRule(element, color) {
        const styleId = "html-finetune-hover-rules";
        let styleElement = document.getElementById(styleId);
        const rules = [];
        if (styleElement && styleElement.textContent) {
          const pattern = new RegExp(
            "\\[" + config.hftIdAttribute + "=\\\"([^\\\"]+)\\\"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}",
            "gi"
          );
          for (const match of styleElement.textContent.matchAll(pattern)) {
            rules.push({ hftId: match[1], color: match[2].trim() });
          }
        }

        const hftId = element.getAttribute(config.hftIdAttribute) || "";
        const filtered = rules.filter((rule) => rule.hftId !== hftId);
        if (color.trim()) {
          filtered.push({ hftId, color: color.trim() });
        }

        if (filtered.length === 0) {
          if (styleElement) styleElement.remove();
          return;
        }

        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = "\\n" + filtered
          .map((rule) => "[" + config.hftIdAttribute + "=\\\"" + rule.hftId + "\\\"]:hover { background-color: " + rule.color + "; }")
          .join("\\n") + "\\n";
      }

      function isNativeDialog(element) {
        return typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement;
      }

      function isModalOpen(element) {
        if (isNativeDialog(element)) return element.open;
        if (element.hasAttribute("hidden")) return false;
        if (element.getAttribute("aria-hidden") === "true") return false;
        if (element.getAttribute("data-html-finetune-modal-open") === "true") return true;

        const computed = window.getComputedStyle(element);
        if (computed.display === "none" || computed.visibility === "hidden") return false;

        return element.classList.contains("open") ||
          element.classList.contains("is-open") ||
          element.classList.contains("active") ||
          element.classList.contains("show") ||
          element.hasAttribute("open");
      }

      function getModalLabel(element) {
        const ariaLabel = element.getAttribute("aria-label");
        if (ariaLabel) return ariaLabel;

        const labelledBy = element.getAttribute("aria-labelledby");
        if (labelledBy) {
          const labelElement = document.getElementById(labelledBy);
          if (labelElement?.textContent?.trim()) return labelElement.textContent.trim();
        }

        if (element.id) return "#" + element.id;
        if (typeof element.className === "string" && element.className.trim()) {
          return "." + element.className.trim().split(/\\s+/).join(".");
        }

        return element.tagName.toLowerCase();
      }

      function findPrimaryModal() {
        const modals = getModalElements();
        return modals.find(isModalOpen) || modals[0] || null;
      }

      function postModalState() {
        const modal = findPrimaryModal();
        window.parent.postMessage({
          type: "HTML_FINETUNE_MODAL_STATE",
          token: bridgeToken,
          payload: {
            found: Boolean(modal),
            open: modal ? isModalOpen(modal) : false,
            label: modal ? getModalLabel(modal) : ""
          }
        }, "*");
      }

      function postPreviewReady() {
        window.parent.postMessage({ type: "HTML_FINETUNE_PREVIEW_READY", token: bridgeToken }, "*");
      }

      function openModal() {
        const modal = findPrimaryModal();
        if (!modal) {
          postModalState();
          return;
        }

        if (isNativeDialog(modal)) {
          try {
            if (!modal.open) modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.setAttribute("data-html-finetune-modal-open", "true");
          const computed = window.getComputedStyle(modal);
          if (computed.display === "none") modal.style.display = "block";
          if (computed.visibility === "hidden") modal.style.visibility = "visible";
          modal.style.pointerEvents = "auto";
        }

        postModalState();
      }

      function closeModal() {
        const modal = getModalElements().find(isModalOpen) || findPrimaryModal();
        if (!modal) {
          postModalState();
          return;
        }

        if (isNativeDialog(modal)) {
          if (modal.open) modal.close();
          modal.removeAttribute("open");
        } else {
          modal.setAttribute("hidden", "");
          modal.setAttribute("aria-hidden", "true");
          modal.setAttribute("data-html-finetune-modal-open", "false");
          modal.style.display = "none";
        }

        postModalState();
      }

      function openContainingModal(element) {
        const modal = element.closest(modalSelectors.join(","));
        if (!modal || isModalOpen(modal)) return;

        if (isNativeDialog(modal)) {
          try {
            modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.setAttribute("data-html-finetune-modal-open", "true");
          if (window.getComputedStyle(modal).display === "none") modal.style.display = "block";
          modal.style.pointerEvents = "auto";
        }

        postModalState();
      }

      function selectElementByHftId(hftId) {
        if (!hftId) return;
        const element = queryByHftId(hftId);
        if (!element || !isEditableElement(element)) return;

        openContainingModal(element);
        element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        selectElement(element, true);
      }

      document.addEventListener("mouseover", (event) => {
        const target = event.target;
        const element = target instanceof Element ? findEditableElement(target) : null;
        clearHover();
        if (element && element.getAttribute(config.selectedAttribute) !== "true") {
          element.setAttribute(config.hoverAttribute, "true");
        }
      }, true);

      document.addEventListener("mouseout", (event) => {
        const target = event.target;
        const element = target instanceof Element ? findEditableElement(target) : null;
        if (element) {
          element.removeAttribute(config.hoverAttribute);
        }
      }, true);

      document.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("[data-html-finetune-ui='true']")) {
          return;
        }

        const element = target instanceof Element ? findEditableElement(target) : null;

        if (element) {
          event.preventDefault();
          event.stopPropagation();
          selectElement(element, true);
          return;
        }

        const actionElement = target instanceof Element
          ? target.closest("[data-hft-open-modal], [data-open-modal], [data-modal-open], [data-hft-close-modal], [data-close-modal], [data-modal-close], .modal-close")
          : null;

        if (actionElement) {
          event.preventDefault();
          event.stopPropagation();
          if (
            actionElement.matches("[data-hft-close-modal], [data-close-modal], [data-modal-close], .modal-close")
          ) {
            closeModal();
          } else {
            openModal();
          }
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      }, true);

      document.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, true);

      window.addEventListener("message", (event) => {
        const data = event.data || {};
        if (data.token !== bridgeToken) return;
        if (data.type === "HTML_FINETUNE_SELECT_ELEMENT") {
          selectElementByHftId(data.hftId);
          return;
        }

        if (data.type === "HTML_FINETUNE_PATCH_ELEMENT") {
          patchElement(data.hftId, data.patch || {});
          return;
        }

        if (data.type !== "HTML_FINETUNE_MODAL_COMMAND") return;

        if (data.action === "open") openModal();
        if (data.action === "close") closeModal();
      });

      window.addEventListener("scroll", () => {
        invalidateFrameBounds();
        if (!pendingReposition) {
          pendingReposition = true;
          requestAnimationFrame(() => {
            pendingReposition = false;
            repositionFloatingToolbar();
          });
        }
      }, true);
      window.addEventListener("resize", () => {
        invalidateFrameBounds();
        if (!pendingReposition) {
          pendingReposition = true;
          requestAnimationFrame(() => {
            pendingReposition = false;
            repositionFloatingToolbar();
          });
        }
      });

      markEditableElements();
      postModalState();
      postPreviewReady();
      window.setTimeout(() => {
        postModalState();
        postPreviewReady();
      }, 50);
      window.setTimeout(() => {
        postModalState();
        postPreviewReady();
      }, 250);
    })();
  <\/script>`}function V(){return globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`hft-${Date.now()}-${Math.random().toString(36).slice(2)}`}function H({value:e,options:t,onChange:n,matchValue:r}){let[i,o]=(0,j.useState)(!1),s=(0,j.useRef)(null),c=(0,j.useRef)(null),l=(0,j.useRef)(-1),u=t.findIndex(t=>r?r(t,e):t.value===e),d=u>=0?t[u].label:e,f=(0,j.useCallback)(()=>{o(e=>!e)},[]),p=(0,j.useCallback)(e=>{n(e.value),o(!1)},[n]);(0,j.useEffect)(()=>{if(!i)return;let e=e=>{s.current&&!s.current.contains(e.target)&&o(!1)},t=setTimeout(()=>document.addEventListener(`click`,e,!0),0);return()=>{clearTimeout(t),document.removeEventListener(`click`,e,!0)}},[i]);let m=(0,j.useCallback)(e=>{if(!i){(e.key===`Enter`||e.key===` `||e.key===`ArrowDown`)&&(e.preventDefault(),o(!0),l.current=u>=0?u:0);return}switch(e.key){case`ArrowDown`:e.preventDefault(),l.current=Math.min(l.current+1,t.length-1),h(l.current);break;case`ArrowUp`:e.preventDefault(),l.current=Math.max(l.current-1,0),h(l.current);break;case`Enter`:case` `:e.preventDefault(),l.current>=0&&l.current<t.length&&p(t[l.current]);break;case`Escape`:e.preventDefault(),o(!1);break}},[i,t,p,u]);function h(e){let t=c.current;if(!t)return;let n=t.children[e];n&&n.scrollIntoView({block:`nearest`})}return(0,M.jsxs)(`div`,{className:`custom-select`,ref:s,onKeyDown:m,children:[(0,M.jsxs)(`button`,{className:`custom-select-trigger`,type:`button`,role:`combobox`,"aria-expanded":i,"aria-haspopup":`listbox`,onClick:f,children:[(0,M.jsx)(`span`,{className:`custom-select-value`,children:d}),(0,M.jsx)(a,{size:14,strokeWidth:1.75,className:`custom-select-chevron${i?` custom-select-chevron-open`:``}`})]}),i&&(0,M.jsx)(`div`,{className:`custom-select-dropdown`,role:`listbox`,ref:c,children:t.map((t,n)=>{let i=n===l.current,a=r?r(t,e):t.value===e;return(0,M.jsx)(`button`,{className:`custom-select-option${a?` custom-select-option-selected`:``}${i?` custom-select-option-active`:``}`,type:`button`,role:`option`,"aria-selected":a,onMouseEnter:()=>{l.current=n},onMouseDown:()=>p(t),children:t.label},t.value)})})]})}var U=[`Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,`Georgia, "Times New Roman", serif`,`"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`,`Arial, Helvetica, sans-serif`,`"Times New Roman", Times, serif`],Ee=[`系统无衬线`,`编辑感衬线`,`等宽字体`,`Arial`,`Times New Roman`],De=U.map((e,t)=>({value:e,label:Ee[t]})),W=[`300`,`400`,`500`,`600`,`700`,`800`].map(e=>({value:e,label:e})),Oe=[`left`,`center`,`right`,`justify`,`start`],ke=Oe.map(e=>({value:e,label:Ge(e)})),G=[`solid`,`dashed`,`none`].map(e=>({value:e,label:e})),Ae=[`cover`,`contain`,`fill`,`none`,`scale-down`].map(e=>({value:e,label:e}));function je({selectedElement:e,onTextChange:t,onStyleChange:n,onEffectChange:r,onAttributeChange:i,isCollapsed:a,onToggleCollapse:o}){let[c,l]=(0,j.useState)(`style`);return a?(0,M.jsx)(`aside`,{className:`panel collapsed-panel collapsed-inspector-panel`,"aria-label":`样式检查器已收起`,children:(0,M.jsxs)(`button`,{className:`collapse-rail-button`,type:`button`,onClick:o,"aria-label":`展开样式检查器`,title:`展开样式检查器`,children:[(0,M.jsx)(p,{size:18,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:`展开检查器`})]})}):(0,M.jsxs)(`aside`,{className:`panel inspector-panel`,"aria-label":`样式检查器`,children:[(0,M.jsxs)(`div`,{className:`panel-header`,children:[(0,M.jsxs)(`div`,{className:`panel-title`,children:[(0,M.jsx)(x,{size:18,strokeWidth:1.75}),(0,M.jsx)(`span`,{children:`Inspector`})]}),(0,M.jsx)(`button`,{className:`icon-button`,type:`button`,onClick:o,"aria-label":`收起样式检查器`,title:`收起样式检查器`,children:(0,M.jsx)(m,{size:18,strokeWidth:1.75})})]}),(0,M.jsxs)(`div`,{className:`inspector-tabs`,role:`tablist`,"aria-label":`检查器视图`,children:[(0,M.jsx)(`button`,{className:c===`style`?`inspector-tab-active`:``,type:`button`,role:`tab`,"aria-selected":c===`style`,onClick:()=>l(`style`),children:`样式`}),(0,M.jsx)(`button`,{className:c===`computed`?`inspector-tab-active`:``,type:`button`,role:`tab`,"aria-selected":c===`computed`,onClick:()=>l(`computed`),children:`计算样式`}),(0,M.jsx)(`button`,{className:c===`events`?`inspector-tab-active`:``,type:`button`,role:`tab`,"aria-selected":c===`events`,onClick:()=>l(`events`),children:`事件`})]}),e?c===`computed`?(0,M.jsx)(Ne,{selectedElement:e}):c===`events`?(0,M.jsx)(Pe,{selectedElement:e}):(0,M.jsxs)(`div`,{className:`inspector-content`,children:[(0,M.jsxs)(`div`,{className:`selected-element-bar`,children:[(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`small`,{children:`Selected`}),(0,M.jsx)(`span`,{children:e.location||e.tagName})]}),(0,M.jsx)(`button`,{className:`icon-button subtle-icon-button`,type:`button`,title:`复制选择器`,"aria-label":`复制选择器`,onClick:()=>{navigator.clipboard?.writeText(e.location||e.tagName)},children:(0,M.jsx)(s,{size:15,strokeWidth:1.75})})]}),e.canEditText?(0,M.jsxs)(`fieldset`,{className:`inspector-group`,children:[(0,M.jsx)(`legend`,{children:`内容`}),(0,M.jsxs)(`label`,{className:`field field-full`,children:[(0,M.jsx)(`span`,{children:`文本`}),(0,M.jsx)(`textarea`,{className:`text-field compact-textarea`,value:e.text,placeholder:`输入文本内容`,onChange:e=>t(e.target.value)})]})]}):null,Ue(e)?null:(0,M.jsxs)(`fieldset`,{className:`inspector-group`,children:[(0,M.jsx)(`legend`,{children:`排版`}),(0,M.jsxs)(`label`,{className:`field field-full`,children:[(0,M.jsx)(`span`,{children:`字体`}),(0,M.jsx)(H,{value:e.styles.fontFamily,options:De,matchValue:(e,t)=>Ie(t)===e.value,onChange:e=>n(`fontFamily`,e)})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`字号`,value:e.styles.fontSize,min:8,max:180,onChange:e=>n(`fontSize`,Y(e))}),(0,M.jsxs)(`label`,{className:`field`,children:[(0,M.jsx)(`span`,{children:`字重`}),(0,M.jsx)(H,{value:e.styles.fontWeight||`400`,options:W,onChange:e=>n(`fontWeight`,e)})]})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsxs)(`label`,{className:`field`,children:[(0,M.jsx)(`span`,{children:`行高`}),(0,M.jsx)(`input`,{type:`text`,placeholder:`normal 或 1.5`,value:e.styles.lineHeight||``,onChange:e=>n(`lineHeight`,e.target.value)})]}),(0,M.jsx)(K,{label:`字间距`,value:e.styles.letterSpacing,step:.1,onChange:e=>n(`letterSpacing`,Y(e))})]}),(0,M.jsxs)(`label`,{className:`field field-full`,children:[(0,M.jsx)(`span`,{children:`文本对齐`}),(0,M.jsx)(H,{value:e.styles.textAlign,options:ke,matchValue:(e,t)=>Re(t)===e.value,onChange:e=>n(`textAlign`,e)})]}),(0,M.jsxs)(`label`,{className:`field field-full`,children:[(0,M.jsx)(`span`,{children:`颜色`}),(0,M.jsxs)(`div`,{className:`color-row`,children:[(0,M.jsx)(`input`,{type:`color`,value:Le(e.styles.color),onChange:e=>n(`color`,e.target.value)}),(0,M.jsx)(`input`,{type:`text`,placeholder:`#141413`,value:e.styles.color||``,onChange:e=>n(`color`,e.target.value)})]})]})]}),Ue(e)?(0,M.jsxs)(`fieldset`,{className:`inspector-group`,children:[(0,M.jsx)(`legend`,{children:`图片`}),(0,M.jsxs)(`label`,{className:`field field-full`,children:[(0,M.jsx)(`span`,{children:`图片链接`}),(0,M.jsx)(`input`,{type:`text`,placeholder:`https://example.com/image.jpg`,value:e.attributes.src,onChange:e=>i(`src`,e.target.value)})]}),(0,M.jsxs)(`label`,{className:`field field-full`,children:[(0,M.jsx)(`span`,{children:`替代文本`}),(0,M.jsx)(`input`,{type:`text`,placeholder:`描述这张图片`,value:e.attributes.alt,onChange:e=>i(`alt`,e.target.value)})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`宽度`,value:e.styles.width,min:0,onChange:e=>n(`width`,Y(e))}),(0,M.jsx)(K,{label:`高度`,value:e.styles.height,min:0,onChange:e=>n(`height`,Y(e))})]}),(0,M.jsxs)(`label`,{className:`field field-full`,children:[(0,M.jsx)(`span`,{children:`填充方式`}),(0,M.jsx)(H,{value:e.styles.objectFit,options:Ae,matchValue:(e,t)=>Be(t)===e.value,onChange:e=>n(`objectFit`,e)})]})]}):null,(0,M.jsxs)(`fieldset`,{className:`inspector-group`,children:[(0,M.jsx)(`legend`,{children:`盒模型 / 间距`}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`上外边距`,value:e.styles.marginTop,onChange:e=>n(`marginTop`,Y(e))}),(0,M.jsx)(K,{label:`下外边距`,value:e.styles.marginBottom,onChange:e=>n(`marginBottom`,Y(e))})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`上内边距`,value:e.styles.paddingTop,onChange:e=>n(`paddingTop`,Y(e))}),(0,M.jsx)(K,{label:`下内边距`,value:e.styles.paddingBottom,onChange:e=>n(`paddingBottom`,Y(e))})]})]}),Ve(e)?(0,M.jsxs)(`fieldset`,{className:`inspector-group`,children:[(0,M.jsx)(`legend`,{children:`按钮样式`}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(J,{label:`背景色`,value:e.styles.backgroundColor,onChange:e=>n(`backgroundColor`,e)}),(0,M.jsx)(J,{label:`Hover 色`,value:e.effects.hoverBackgroundColor||e.styles.backgroundColor,onChange:e=>r(`hoverBackgroundColor`,e)})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(J,{label:`边框色`,value:e.styles.borderColor,onChange:e=>n(`borderColor`,e)}),(0,M.jsx)(K,{label:`边框宽度`,value:e.styles.borderWidth,min:0,onChange:e=>n(`borderWidth`,Y(e))})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`圆角`,value:e.styles.borderRadius,min:0,onChange:e=>n(`borderRadius`,Y(e))}),(0,M.jsxs)(`label`,{className:`field`,children:[(0,M.jsx)(`span`,{children:`边框样式`}),(0,M.jsx)(H,{value:e.styles.borderStyle,options:G,matchValue:(e,t)=>ze(t)===e.value,onChange:e=>n(`borderStyle`,e)})]})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`左内边距`,value:e.styles.paddingLeft,min:0,onChange:e=>n(`paddingLeft`,Y(e))}),(0,M.jsx)(K,{label:`右内边距`,value:e.styles.paddingRight,min:0,onChange:e=>n(`paddingRight`,Y(e))})]})]}):null,He(e)?(0,M.jsxs)(`fieldset`,{className:`inspector-group`,children:[(0,M.jsx)(`legend`,{children:`卡片 / 区块`}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(J,{label:`背景色`,value:e.styles.backgroundColor,onChange:e=>n(`backgroundColor`,e)}),(0,M.jsx)(J,{label:`边框色`,value:e.styles.borderColor,onChange:e=>n(`borderColor`,e)})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`边框宽度`,value:e.styles.borderWidth,min:0,onChange:e=>n(`borderWidth`,Y(e))}),(0,M.jsx)(K,{label:`圆角`,value:e.styles.borderRadius,min:0,onChange:e=>n(`borderRadius`,Y(e))})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsxs)(`label`,{className:`field`,children:[(0,M.jsx)(`span`,{children:`边框样式`}),(0,M.jsx)(H,{value:e.styles.borderStyle,options:G,matchValue:(e,t)=>ze(t)===e.value,onChange:e=>n(`borderStyle`,e)})]}),(0,M.jsxs)(`label`,{className:`field`,children:[(0,M.jsx)(`span`,{children:`阴影`}),(0,M.jsx)(`input`,{type:`text`,placeholder:`0 18px 50px rgba(67,55,42,.12)`,value:e.styles.boxShadow||``,onChange:e=>n(`boxShadow`,e.target.value)})]})]}),(0,M.jsxs)(`div`,{className:`field-grid two-col`,children:[(0,M.jsx)(K,{label:`宽度`,value:e.styles.width,min:0,onChange:e=>n(`width`,Y(e))}),(0,M.jsx)(K,{label:`最大宽度`,value:e.styles.maxWidth,min:0,onChange:e=>n(`maxWidth`,Y(e))})]})]}):null,(0,M.jsxs)(`fieldset`,{className:`inspector-group info-group`,children:[(0,M.jsx)(`legend`,{children:`元素信息`}),(0,M.jsxs)(`dl`,{children:[(0,M.jsx)(q,{label:`标签`,value:e.tagName}),(0,M.jsx)(q,{label:`HFT ID`,value:e.hftId}),(0,M.jsx)(q,{label:`类名`,value:e.className||`无`}),(0,M.jsx)(q,{label:`行内`,value:e.hasInlineStyle?`是`:`否`})]})]})]}):(0,M.jsxs)(`div`,{className:`empty-state`,children:[(0,M.jsxs)(`div`,{className:`empty-state-illustration`,"aria-hidden":`true`,children:[(0,M.jsxs)(`div`,{className:`empty-doc`,children:[(0,M.jsx)(C,{size:20,strokeWidth:1.75}),(0,M.jsx)(`span`,{}),(0,M.jsx)(`span`,{})]}),(0,M.jsx)(`div`,{className:`empty-arrow`}),(0,M.jsxs)(`div`,{className:`empty-controls`,children:[(0,M.jsx)(u,{size:18,strokeWidth:1.75}),(0,M.jsx)(`span`,{}),(0,M.jsx)(`span`,{})]})]}),(0,M.jsx)(`h2`,{children:`请选择一个元素`}),(0,M.jsxs)(`ol`,{children:[(0,M.jsx)(`li`,{children:`在预览区点击任意文字元素`}),(0,M.jsx)(`li`,{children:`在右侧面板调整内容和样式`}),(0,M.jsx)(`li`,{children:`实时查看修改效果`})]})]})]})}var Me=(0,j.memo)(je);function Ne({selectedElement:e}){return(0,M.jsxs)(`div`,{className:`inspector-content inspector-readout`,children:[(0,M.jsx)(`div`,{className:`selected-element-bar`,children:(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`small`,{children:`Computed`}),(0,M.jsx)(`span`,{children:e.location||e.tagName})]})}),(0,M.jsxs)(`fieldset`,{className:`inspector-group info-group`,children:[(0,M.jsx)(`legend`,{children:`Typography`}),(0,M.jsxs)(`dl`,{children:[(0,M.jsx)(q,{label:`字体`,value:e.styles.fontFamily||`inherit`}),(0,M.jsx)(q,{label:`字号`,value:e.styles.fontSize||`inherit`}),(0,M.jsx)(q,{label:`字重`,value:e.styles.fontWeight||`normal`}),(0,M.jsx)(q,{label:`行高`,value:e.styles.lineHeight||`normal`}),(0,M.jsx)(q,{label:`对齐`,value:e.styles.textAlign||`start`})]})]}),(0,M.jsxs)(`fieldset`,{className:`inspector-group info-group`,children:[(0,M.jsx)(`legend`,{children:`Box`}),(0,M.jsxs)(`dl`,{children:[(0,M.jsx)(q,{label:`宽度`,value:e.styles.width||`auto`}),(0,M.jsx)(q,{label:`高度`,value:e.styles.height||`auto`}),(0,M.jsx)(q,{label:`上外边距`,value:e.styles.marginTop||`0px`}),(0,M.jsx)(q,{label:`下外边距`,value:e.styles.marginBottom||`0px`}),(0,M.jsx)(q,{label:`圆角`,value:e.styles.borderRadius||`0px`})]})]}),(0,M.jsxs)(`fieldset`,{className:`inspector-group info-group`,children:[(0,M.jsx)(`legend`,{children:`Paint`}),(0,M.jsxs)(`dl`,{children:[(0,M.jsx)(q,{label:`文字色`,value:e.styles.color||`inherit`}),(0,M.jsx)(q,{label:`背景色`,value:e.styles.backgroundColor||`transparent`}),(0,M.jsx)(q,{label:`边框色`,value:e.styles.borderColor||`transparent`}),(0,M.jsx)(q,{label:`阴影`,value:e.styles.boxShadow||`none`})]})]})]})}function Pe({selectedElement:e}){return(0,M.jsxs)(`div`,{className:`inspector-content inspector-readout`,children:[(0,M.jsx)(`div`,{className:`selected-element-bar`,children:(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`small`,{children:`Events`}),(0,M.jsx)(`span`,{children:e.location||e.tagName})]})}),(0,M.jsxs)(`fieldset`,{className:`inspector-group info-group`,children:[(0,M.jsx)(`legend`,{children:`Element State`}),(0,M.jsxs)(`dl`,{children:[(0,M.jsx)(q,{label:`点击语义`,value:We(e)}),(0,M.jsx)(q,{label:`文本编辑`,value:e.canEditText?`可编辑`:`继承子元素`}),(0,M.jsx)(q,{label:`Hover 背景`,value:e.effects.hoverBackgroundColor||`未设置`}),(0,M.jsx)(q,{label:`行内样式`,value:e.hasInlineStyle?`已设置`:`未设置`})]})]}),(0,M.jsxs)(`fieldset`,{className:`inspector-group info-group`,children:[(0,M.jsx)(`legend`,{children:`Attributes`}),(0,M.jsxs)(`dl`,{children:[(0,M.jsx)(q,{label:`标签`,value:e.tagName}),(0,M.jsx)(q,{label:`类名`,value:e.className||`无`}),(0,M.jsx)(q,{label:`HFT ID`,value:e.hftId})]})]})]})}function K({label:e,value:t,min:n,max:r,step:i=1,onChange:a}){return(0,M.jsxs)(`label`,{className:`field`,children:[(0,M.jsx)(`span`,{children:e}),(0,M.jsxs)(`div`,{className:`unit-input`,children:[(0,M.jsx)(`input`,{type:`number`,min:n,max:r,step:i,placeholder:`0`,value:Fe(t),onChange:e=>a(e.target.value)}),(0,M.jsx)(`small`,{children:`px`})]})]})}function q({label:e,value:t}){return(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`dt`,{children:e}),(0,M.jsx)(`dd`,{title:t,children:t})]})}function J({label:e,value:t,onChange:n}){let r=Le(t);return(0,M.jsxs)(`label`,{className:`field`,children:[(0,M.jsx)(`span`,{children:e}),(0,M.jsxs)(`div`,{className:`color-row`,children:[(0,M.jsx)(`input`,{type:`color`,value:r,onChange:e=>n(e.target.value)}),(0,M.jsx)(`input`,{type:`text`,placeholder:`#c96442`,value:t||``,onChange:e=>n(e.target.value)})]})]})}function Fe(e){let t=Number.parseFloat(e);return Number.isFinite(t)?String(t):``}function Y(e){return e.trim()?`${e}px`:``}function Ie(e){let t=e.toLowerCase();return t.includes(`georgia`)||t.includes(`times`)?U[1]:t.includes(`consolas`)||t.includes(`monospace`)||t.includes(`menlo`)?U[2]:t.includes(`arial`)?U[3]:U[0]}function Le(e){return/^#[0-9a-f]{6}$/i.test(e)?e:`#141413`}function Re(e){return Oe.includes(e)?e:`left`}function ze(e){return[`solid`,`dashed`,`none`].includes(e)?e:`solid`}function Be(e){return[`cover`,`contain`,`fill`,`none`,`scale-down`].includes(e)?e:`cover`}function Ve(e){return!!(e.tagName===`button`||e.tagName===`a`&&/button|btn|cta|action/i.test(e.className))}function He(e){return[`section`,`article`,`aside`,`div`,`blockquote`].includes(e.tagName)}function Ue(e){return e.tagName===`img`}function We(e){return e.tagName===`button`?`button`:e.tagName===`a`?`link`:e.tagName===`dialog`?`dialog`:/modal|dialog|popup/i.test(e.className)?`modal`:`none`}function Ge(e){return{left:`左对齐`,center:`居中`,right:`右对齐`,justify:`两端对齐`,start:`起始对齐`}[e]??e}var Ke=`data-html-finetune-hover-rules`;function qe(e){let t=[],n=e;for(;n&&n.nodeType===Node.ELEMENT_NODE;){let e=n.tagName.toLowerCase();if(e===`html`){t.unshift(`html`);break}let r=et(n);t.unshift(`${e}:nth-of-type(${r})`),n=n.parentElement}return t.join(` > `)}function Je(e,t){let n=e.querySelector(`[${I}="${ct(t)}"]`);return n instanceof HTMLElement?n:null}function Ye(e,t){let n=ct(t);return RegExp(`${I}="${n}"`).test(e)}function Xe(e,t,n){let r=new DOMParser().parseFromString(e,`text/html`),i=Je(r,t);return i?(typeof n.text==`string`&&rt(i,n.text),n.attributes&&nt(i,n.attributes),n.styles&&Object.entries(n.styles).forEach(([e,t])=>{typeof t==`string`&&(t.trim()?i.style.setProperty(tt(e),t):i.style.removeProperty(tt(e)))}),n.effects?.hoverBackgroundColor!==void 0&&it(r,t,n.effects.hoverBackgroundColor),X(r)):e}function Ze(e,t){let n=new DOMParser().parseFromString(e,`text/html`),r=Je(n,t);if(!r||!r.parentElement)return e;let i=r.cloneNode(!0);return i instanceof HTMLElement&&(i.removeAttribute(I),i.querySelectorAll(`[${I}]`).forEach(e=>e.removeAttribute(I))),r.insertAdjacentElement(`afterend`,i),X(n)}function Qe(e,t){let n=new DOMParser().parseFromString(e,`text/html`),r=Je(n,t);return r?(r.remove(),X(n)):e}function $e(e,t){let n=st(t),r=RegExp(`\\[${I}="${n}"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}`,`i`);return e.match(r)?.[1]?.trim()??``}function X(e){return`<!doctype html>\n${e.documentElement.outerHTML}`}function et(e){let t=1,n=e.previousElementSibling;for(;n;)n.tagName===e.tagName&&(t+=1),n=n.previousElementSibling;return t}function tt(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}function nt(e,t){Object.entries(t).forEach(([t,n])=>{if(typeof n==`string`){if(t===`alt`){e.setAttribute(t,n);return}n.trim()?e.setAttribute(t,n):e.removeAttribute(t)}})}function rt(e,t){e.children.length>0||(e.textContent=t)}function it(e,t,n){let r=at(e,n.trim().length>0);if(!r)return;let i=ot(r.textContent??``).filter(e=>e.hftId!==t);if(n.trim()&&i.push({hftId:t,color:n.trim()}),i.length===0){r.remove();return}r.textContent=`\n${i.map(e=>`[${I}="${e.hftId}"]:hover { background-color: ${e.color}; }`).join(`
`)}\n`}function at(e,t){let n=e.querySelector(`style[${Ke}]`);if(n instanceof HTMLStyleElement)return n;if(!t)return null;let r=e.createElement(`style`);return r.setAttribute(Ke,`true`),e.head.appendChild(r),r}function ot(e){let t=[],n=RegExp(`\\[${I}="([^"]+)"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}`,`gi`);for(let r of e.matchAll(n))t.push({hftId:r[1],color:r[2].trim()});return t}function st(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function ct(e){return typeof CSS<`u`&&CSS.escape?CSS.escape(e):e.replace(/"/g,`\\"`)}function lt(e){let t=ut(e),n=new Set,r=[],i=1;return t.body.querySelectorAll(`*`).forEach(e=>{if(!ge(e))return;let t=e.getAttribute(I),a=t&&!n.has(t)?t:ht(n,i);i+=1,e.setAttribute(I,a),n.add(a),r.push(a)}),{html:X(t),ids:r}}function ut(e){let t=new DOMParser,n=/<html[\s>]/i.test(e)?e:gt(e);return t.parseFromString(n,`text/html`)}var dt=null,ft=null;function pt(e){return dt===e&&ft?ft.cloneNode(!0):(dt=e,ft=ut(e),ft.cloneNode(!0))}function mt(e){return`hft-${String(e).padStart(4,`0`)}`}function ht(e,t){let n=t,r=mt(n);for(;e.has(r);)n+=1,r=mt(n);return r}function gt(e){return`<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${e}</body></html>`}var Z={initialTitle:`初始版本`,initialDetail:`载入当前 HTML`,added:`新增`,removed:`删除`,elementCount:`个元素`,changedText:`修改`,text:`文本`,updated:`更新`,attributes:`属性`,adjusted:`调整`,style:`样式`,changedDocumentText:`修改文本`,updatedHtml:`更新 HTML`,contentChanged:`内容已改变`,chars:`字符`,unknownElement:`未知元素`,clearedText:`文本已清空`};function _t(e,t){return e.map((e,n)=>({index:n,title:e?.title??Z.initialTitle,detail:e?.detail??Z.initialDetail,isCurrent:n===t}))}function vt(e,t){let n=pt(e.html),r=pt(t.html),i=yt(n),a=yt(r),o=[...a.keys()].filter(e=>!i.has(e)),s=[...i.keys()].filter(e=>!a.has(e));if(o.length>0&&s.length===0)return{title:`${Z.added} ${o.length} ${Z.elementCount}`,detail:Q(a.get(o[0]))};if(s.length>0&&o.length===0)return{title:`${Z.removed} ${s.length} ${Z.elementCount}`,detail:Q(i.get(s[0]))};let c=(t.selectedId&&i.has(t.selectedId)&&a.has(t.selectedId)?t.selectedId:null)||bt(i,a),l=c?i.get(c):null,u=c?a.get(c):null;if(l&&u){let e=$(l.textContent??``),t=$(u.textContent??``),n=(l.getAttribute(`style`)||``)!==(u.getAttribute(`style`)||``),r=l.getAttribute(`src`)!==u.getAttribute(`src`)||l.getAttribute(`alt`)!==u.getAttribute(`alt`);if(e!==t)return{title:`${Z.changedText} ${u.tagName.toLowerCase()} ${Z.text}`,detail:xt(t||Q(u),54)};if(r)return{title:`${Z.updated} ${u.tagName.toLowerCase()} ${Z.attributes}`,detail:Q(u)};if(n)return{title:`${Z.adjusted} ${u.tagName.toLowerCase()} ${Z.style}`,detail:Q(u)}}let d=$(n.body.textContent??``),f=$(r.body.textContent??``);if(d!==f)return{title:Z.changedDocumentText,detail:St(d,f)};let p=t.html.length-e.html.length;return{title:Z.updatedHtml,detail:p===0?Z.contentChanged:`${p>0?`+`:``}${p.toLocaleString()} ${Z.chars}`}}function yt(e){let t=new Map;return e.querySelectorAll(`[${I}]`).forEach(e=>{let n=e.getAttribute(I);n&&t.set(n,e)}),t}function bt(e,t){for(let[n,r]of t){let t=e.get(n);if(t&&t.outerHTML!==r.outerHTML)return n}return null}function Q(e){if(!e)return Z.unknownElement;let t=e.tagName.toLowerCase(),n=e.id?`#${e.id}`:``,r=typeof e.className==`string`&&e.className.trim()?`.${e.className.trim().split(/\s+/).slice(0,2).join(`.`)}`:``,i=$(e.textContent??``);return xt(`${t}${n}${r}${i?` - ${i}`:``}`,72)}function $(e){return e.replace(/\s+/g,` `).trim()}function xt(e,t){return e.length<=t?e:`${e.slice(0,t-1)}...`}function St(e,t){if(!t)return Z.clearedText;let n=0;for(;n<e.length&&n<t.length&&e[n]===t[n];)n+=1;let r=e.length-1,i=t.length-1;for(;r>=n&&i>=n&&e[r]===t[i];)--r,--i;let a=Math.max(0,n-12),o=Math.min(t.length,i+13);return xt(t.slice(a,o).trim()||t,72)}var Ct=450;function wt(e){let[t,n]=(0,j.useState)({state:e,summary:null}),[r,i]=(0,j.useState)([]),[a,o]=(0,j.useState)([]),[s,c]=(0,j.useState)(!1),l=(0,j.useRef)(null),u=(0,j.useRef)(null),d=(0,j.useRef)(t),f=(0,j.useRef)(r),p=(0,j.useRef)(a);(0,j.useEffect)(()=>{d.current=t},[t]),(0,j.useEffect)(()=>{f.current=r},[r]),(0,j.useEffect)(()=>{p.current=a},[a]);let m=(0,j.useCallback)(()=>{u.current&&=(window.clearTimeout(u.current),null)},[]),h=(0,j.useCallback)(()=>{m();let e=l.current;if(!e){c(!1);return}let t=d.current;if(e.state.html!==t.state.html){let n=vt(e.state,t.state),r={state:e.state,summary:n},a=[...f.current,r];f.current=a,p.current=[],i(a),o([])}l.current=null,c(!1)},[m]),g=(0,j.useCallback)((e,t={})=>{let{record:r=!0,debounce:a=!1}=t,s=d.current;if(e.html===s.state.html&&e.selectedId===s.state.selectedId)return;let g={state:e,summary:null};if(!r){h(),n(g),d.current=g;return}if(a){l.current||(l.current=s,c(!0)),n(g),d.current=g,m(),u.current=window.setTimeout(()=>{h()},Ct);return}h();let _=vt(s.state,e),v={state:s.state,summary:_},y=[...f.current,v];f.current=y,p.current=[],i(y),o([]),n(g),d.current=g},[m,h]),_=(0,j.useCallback)(e=>{m(),l.current=null,c(!1);let t={state:e,summary:null};n(t),d.current=t,f.current=[],p.current=[],i([]),o([])},[m]),v=(0,j.useCallback)(()=>{h();let e=f.current;if(!e.length)return;let t=e[e.length-1],r=e.slice(0,-1),a=[d.current,...p.current];f.current=r,p.current=a,i(r),o(a),n(t),d.current=t},[h]),y=(0,j.useCallback)(()=>{h();let e=p.current;if(!e.length)return;let t=e[0],r=e.slice(1),a=d.current,s=[...f.current,a];f.current=s,p.current=r,i(s),o(r),n(t),d.current=t},[h]),b=(0,j.useCallback)(e=>{h();let t=[...f.current,d.current,...p.current];if(e<0||e>=t.length)return;let r=t[e],a=t.slice(0,e),s=t.slice(e+1);f.current=a,p.current=s,i(a),n(r),d.current=r,o(s)},[h]),x=(0,j.useMemo)(()=>[...r,t,...a].map(e=>e.state),[a,r,t]),S=(0,j.useMemo)(()=>[...r,t,...a].map(e=>e.summary),[a,r,t]),C=r.length,w=r.length>0||s,T=a.length>0;return(0,j.useMemo)(()=>({state:t.state,commit:g,reset:_,undo:v,redo:y,jumpToHistoryIndex:b,timeline:x,summaries:S,currentIndex:C,canUndo:w,canRedo:T,flushDebouncedHistory:h}),[T,w,g,C,h,b,t.state,y,_,S,x,v])}var Tt=`<!doctype html>
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
</html>`,Et=[I,se,L,ce,`data-html-finetune-clickable`,`data-html-finetune-modal-open`],Dt=[`#html-finetune-bridge-style`],Ot=`style[data-html-finetune-hover-rules]`;function kt(e){let t=ut(e);return At(t),Dt.forEach(e=>{t.querySelectorAll(e).forEach(e=>e.remove())}),t.querySelectorAll(`*`).forEach(e=>{Et.forEach(t=>e.removeAttribute(t))}),X(t)}function At(e){let t=e.querySelector(Ot);if(!(t instanceof HTMLStyleElement)||!t.textContent)return;let n=jt(t.textContent);if(n.length===0){t.remove();return}let r=[];if(n.forEach(t=>{let n=e.querySelector(`[${I}="${Mt(t.hftId)}"]`);if(!(n instanceof HTMLElement))return;let i=`hft-hover-${t.hftId}`;n.classList.add(i),r.push(`.${i}:hover { background-color: ${t.color}; }`)}),r.length===0){t.remove();return}t.removeAttribute(`data-html-finetune-hover-rules`),t.textContent=`\n${r.join(`
`)}\n`}function jt(e){let t=[],n=RegExp(`\\[${I}="([^"]+)"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}`,`gi`);for(let r of e.matchAll(n))t.push({hftId:r[1],color:r[2].trim()});return t}function Mt(e){return typeof CSS<`u`&&CSS.escape?CSS.escape(e):e.replace(/"/g,`\\"`)}async function Nt(e){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(e);return}let t=document.createElement(`textarea`);t.value=e,t.setAttribute(`readonly`,`true`),t.style.position=`fixed`,t.style.opacity=`0`,document.body.appendChild(t),t.select();let n=document.execCommand(`copy`);if(t.remove(),!n)throw Error(`execCommand copy failed`)}catch{throw Error(`剪贴板写入失败`)}}var Pt=48;function Ft(e){let t=pt(e),n=[];return It(t.body,0,n),n}function It(e,t,n){if(ge(e)){let r=e.getAttribute(I);if(r){let i=Rt(e);n.push({hftId:r,tagName:e.tagName.toLowerCase(),label:Lt(e,i),text:i,depth:t,className:typeof e.className==`string`?e.className:``,id:e.id||``})}}Array.from(e.children).forEach(e=>{It(e,t+1,n)})}function Lt(e,t){return`${e.tagName.toLowerCase()}${e.id?`#${e.id}`:``}${typeof e.className==`string`&&e.className.trim()?`.${e.className.trim().split(/\s+/).slice(0,2).join(`.`)}`:``}${t?` ${Bt(t,Pt)}`:``}`}function Rt(e){return e instanceof HTMLImageElement?zt(e.getAttribute(`alt`)||e.getAttribute(`src`)||`图片`):zt(e.textContent??``)}function zt(e){return e.replace(/\s+/g,` `).trim()}function Bt(e,t){return e.length<=t?e:`${e.slice(0,t-1)}…`}function Vt(e,t=`edited-page.html`){let n=new Blob([e],{type:`text/html;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(r)}var Ht=`modulepreload`,Ut=function(e){return`/HTML/`+e},Wt={},Gt=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=Ut(t,n),t in Wt)return;Wt[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:Ht,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Kt=(0,j.lazy)(()=>Gt(()=>import(`./HistoryPanel-Bg4pXNI8.js`).then(e=>({default:e.HistoryPanel})),__vite__mapDeps([0,1,2,3]))),qt=(0,j.lazy)(()=>Gt(()=>import(`./ExportPreviewDialog-SoTD0Y-6.js`).then(e=>({default:e.ExportPreviewDialog})),__vite__mapDeps([4,1,2,3]))),Jt=lt(Tt).html,Yt=280,Xt=286,Zt=520,Qt=292,$t=318,en=12;function tn(){let{state:e,commit:t,reset:n,undo:r,redo:i,jumpToHistoryIndex:a,timeline:o,summaries:s,currentIndex:c,canUndo:l,canRedo:u,flushDebouncedHistory:d}=wt({html:Jt,selectedId:null}),f=(0,j.useRef)(e.html),[p,m]=(0,j.useState)(null),[h,g]=(0,j.useState)(`仅本地运行 · iframe srcDoc · postMessage 通信`),[_,v]=(0,j.useState)(!1),[y,b]=(0,j.useState)(!1),[x,S]=(0,j.useState)({found:!1,open:!1,label:``}),[C,w]=(0,j.useState)(null),[T,E]=(0,j.useState)(null),[D,O]=(0,j.useState)(null),[k,A]=(0,j.useState)(0),[ee,te]=(0,j.useState)(`tree`),[ne,re]=(0,j.useState)(`desktop`),[ae,N]=(0,j.useState)(!1),[P,F]=(0,j.useState)(null),[I,se]=(0,j.useState)(`side`),[L,ce]=(0,j.useState)(Qt),[R,le]=(0,j.useState)($t),[ue,de]=(0,j.useState)(!1),[fe,pe]=(0,j.useState)(!1),me=(0,j.useRef)(null);(0,j.useEffect)(()=>{f.current=e.html},[e.html]);let he=(0,j.useCallback)(n=>{let r=f.current,i=on(n,r);if(n.hftId===e.selectedId&&p?.hftId===n.hftId){d(),m(i);return}d(),m(i),t({html:r,selectedId:n.hftId},{record:!1})},[t,d,p?.hftId,e.selectedId]),ge=(0,j.useCallback)(e=>{if(!p?.canEditText)return;let n=Xe(f.current,p.hftId,{text:e});f.current=n,t({html:n,selectedId:p.hftId},{debounce:!0}),m({...p,text:e}),O({id:Date.now(),hftId:p.hftId,patch:{text:e}})},[t,p]),_e=(0,j.useCallback)((e,n)=>{if(!p)return;let r=sn(e,n,p),i=Xe(f.current,p.hftId,{styles:r});f.current=i,t({html:i,selectedId:p.hftId},{debounce:!0}),m({...p,styles:{...p.styles,...r},hasInlineStyle:!0}),O({id:Date.now(),hftId:p.hftId,patch:{styles:r}})},[t,p]),ve=(0,j.useCallback)((e,n)=>{if(!p)return;let r=Xe(f.current,p.hftId,{effects:{[e]:n}});f.current=r,t({html:r,selectedId:p.hftId},{debounce:!0}),m({...p,effects:{...p.effects,[e]:n}}),O({id:Date.now(),hftId:p.hftId,patch:{effects:{[e]:n}}})},[t,p]),ye=(0,j.useCallback)((e,n)=>{if(!p)return;let r=Xe(f.current,p.hftId,{attributes:{[e]:n}});f.current=r,t({html:r,selectedId:p.hftId}),m({...p,attributes:{...p.attributes,[e]:n}}),O({id:Date.now(),hftId:p.hftId,patch:{attributes:{[e]:n}}})},[t,p]),be=(0,j.useCallback)(e=>{let n=lt(e).html;f.current=n,t({html:n,selectedId:null},{debounce:!0}),m(null),S({found:!1,open:!1,label:``}),w(null),A(e=>e+1)},[t]),Se=(0,j.useCallback)(e=>{let t=new FileReader;t.onload=()=>{let r=lt(String(t.result??``)).html;f.current=r,n({html:r,selectedId:null}),m(null),S({found:!1,open:!1,label:``}),w(null),pe(!0),g(`已导入 ${e.name}`),A(e=>e+1)},t.readAsText(e)},[n]),z=(0,j.useCallback)(async()=>{try{await Nt(kt(f.current)),g(`已复制干净 HTML 到剪贴板`)}catch{g(`复制失败，请检查浏览器剪贴板权限`)}},[]),Ce=(0,j.useCallback)(()=>{F(kt(f.current)),g(`已生成导出前预览`)},[]),we=(0,j.useCallback)(()=>{P&&(Vt(P),F(null),g(`已导出干净 HTML`))},[P]),Te=(0,j.useCallback)(async()=>{if(P)try{await Nt(P),g(`已复制导出预览中的干净 HTML`)}catch{g(`复制失败，请检查浏览器剪贴板权限`)}},[P]),B=(0,j.useCallback)(()=>{r(),A(e=>e+1),g(`已撤销上一步编辑`)},[r]),V=(0,j.useCallback)(()=>{i(),A(e=>e+1),g(`已重做编辑`)},[i]),H=(0,j.useCallback)(e=>{a(e),A(e=>e+1),g(`已跳转到历史第 ${e+1} 步`)},[a]),U=(0,j.useCallback)(e=>{S(e)},[]),Ee=(0,j.useCallback)(()=>{w({id:Date.now(),action:`open`}),g(`正在打开预览中的弹窗`)},[]),De=(0,j.useCallback)(()=>{w({id:Date.now(),action:`close`}),g(`正在关闭预览中的弹窗`)},[]),W=_&&y,Oe=(0,j.useCallback)(()=>{_&&y?(v(!1),b(!1),g(`已恢复三栏编辑视图`)):(v(!0),b(!0),N(!1),g(`已进入专注预览`))},[y,_]),ke=(0,j.useCallback)(()=>{se(e=>e===`side`?`bottom`:`side`),v(!1),g(I===`side`?`源码区已移到底部`:`源码区已回到左侧`)},[I]),G=(0,j.useCallback)(e=>t=>{if(I!==`side`)return;let n=me.current;if(!n)return;t.preventDefault();let r=n.getBoundingClientRect(),i=L,a=R,o=t=>{let n=r.width-en*2;if(e===`source`){ce(cn(t.clientX-r.left,Yt,Math.max(Yt,n-a-Zt)));return}le(cn(r.right-t.clientX,Xt,Math.max(Xt,n-i-Zt)))},s=()=>{document.body.classList.remove(`is-resizing-panels`),window.removeEventListener(`pointermove`,o),window.removeEventListener(`pointerup`,s)};document.body.classList.add(`is-resizing-panels`),window.addEventListener(`pointermove`,o),window.addEventListener(`pointerup`,s)},[R,I,L]),Ae=(0,j.useCallback)(e=>{let n=nn(f.current,e);n&&m(n),E({id:Date.now(),hftId:e}),d(),t({html:f.current,selectedId:e},{record:!1}),g(`已从结构面板定位 ${e}`)},[t,d]),je=(0,j.useCallback)((e,n)=>{let r=n===`duplicate`?Ze(f.current,e):Qe(f.current,e),i=n===`duplicate`?lt(r).html:r;f.current=i,t({html:i,selectedId:null}),m(null),A(e=>e+1),g(n===`duplicate`?`已复制选中元素`:`已删除选中元素`)},[t]);(0,j.useEffect)(()=>{let e=e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();t!==`z`&&t!==`y`||(e.preventDefault(),t===`z`&&e.shiftKey||t===`y`?V():B())};return window.addEventListener(`keydown`,e,!0),()=>window.removeEventListener(`keydown`,e,!0)},[V,B]),(0,j.useEffect)(()=>{if(!e.selectedId){m(null);return}Ye(e.html,e.selectedId)||(t({html:e.html,selectedId:null},{record:!1}),m(null))},[t,e.html,e.selectedId]);let Ne=(0,j.useMemo)(()=>p?{label:`已选择`,detail:`${p.tagName.toUpperCase()} · ${p.hftId}`}:{label:`未选择`,detail:`从结构树或 Canvas 选择元素`},[p]),Pe=(0,j.useMemo)(()=>Ft(e.html),[e.html]),K=(0,j.useMemo)(()=>_t(s,c),[c,s]),q=(0,j.useMemo)(()=>({"--source-col":_?`44px`:`${L}px`,"--inspector-col":y?`44px`:`${R}px`}),[R,y,_,L]),J=ue?{label:`实时预览`,detail:`已就绪`,tone:`ready`}:{label:`实时预览`,detail:`渲染中`,tone:`busy`},Fe=`${e.html.length.toLocaleString()} 字符`;return(0,M.jsxs)(`div`,{className:`app-shell${W?` app-shell-focus-preview`:``}`,children:[(0,M.jsx)(ie,{canUndo:l,canRedo:u,hasModal:x.found,isModalOpen:x.open,onUndo:B,onRedo:V,onToggleHistory:()=>N(e=>!e),onOpenModal:Ee,onCloseModal:De,onImport:Se,onCopy:z,onExport:Ce}),ae&&!W?(0,M.jsx)(j.Suspense,{fallback:null,children:(0,M.jsx)(Kt,{items:K,canUndo:l,canRedo:u,onUndo:B,onRedo:V,onJumpTo:H,onClose:()=>N(!1)})}):null,P?(0,M.jsx)(j.Suspense,{fallback:null,children:(0,M.jsx)(qt,{html:P,onClose:()=>F(null),onCopy:Te,onDownload:we})}):null,(0,M.jsxs)(`main`,{ref:me,style:q,className:[`workspace`,_?`workspace-source-collapsed`:``,y?`workspace-inspector-collapsed`:``,I===`bottom`?`workspace-source-bottom`:``].filter(Boolean).join(` `),"aria-label":`HTML FineTune 编辑工作区`,children:[(0,M.jsx)(oe,{value:e.html,domTree:Pe,selectedId:e.selectedId,onChange:be,onImport:Se,onSelectElement:Ae,isCollapsed:_,onToggleCollapse:()=>v(e=>!e),placement:I,onTogglePlacement:ke,showImportDropzone:!fe,sourceView:ee,onSourceViewChange:te}),(0,M.jsx)(`button`,{className:`workspace-resizer workspace-resizer-source`,type:`button`,"aria-label":`拖拽调整源码区宽度`,onPointerDown:G(`source`)}),(0,M.jsx)(xe,{html:e.html,selectedId:e.selectedId,reloadNonce:k,patchCommand:D,modalCommand:C,selectCommand:T,viewportMode:ne,isFocusPreview:W,onViewportModeChange:re,onToggleFocusPreview:Oe,onElementSelected:he,onModalStateChange:U,onElementAction:je,onReadyChange:de}),(0,M.jsx)(`button`,{className:`workspace-resizer workspace-resizer-inspector`,type:`button`,"aria-label":`拖拽调整检查器宽度`,onPointerDown:G(`inspector`)}),(0,M.jsx)(Me,{selectedElement:p,onTextChange:ge,onStyleChange:_e,onEffectChange:ve,onAttributeChange:ye,isCollapsed:y,onToggleCollapse:()=>b(e=>!e)})]}),(0,M.jsxs)(`footer`,{className:`status-bar`,"aria-live":`polite`,children:[(0,M.jsxs)(`div`,{className:`status-item status-selection${p?` status-item-active`:``}`,children:[(0,M.jsx)(`span`,{className:`status-dot`,"aria-hidden":`true`}),(0,M.jsxs)(`span`,{className:`status-copy`,children:[(0,M.jsx)(`strong`,{children:Ne.label}),(0,M.jsx)(`small`,{children:Ne.detail})]})]}),(0,M.jsxs)(`div`,{className:`status-item status-count`,children:[(0,M.jsx)(`span`,{className:`status-dot status-dot-muted`,"aria-hidden":`true`}),(0,M.jsx)(`span`,{children:Fe})]}),(0,M.jsxs)(`div`,{className:`status-item status-preview status-preview-${J.tone}`,children:[(0,M.jsx)(`span`,{className:`status-dot`,"aria-hidden":`true`}),(0,M.jsxs)(`span`,{className:`status-copy`,children:[(0,M.jsx)(`strong`,{children:J.label}),(0,M.jsx)(`small`,{children:J.detail})]})]}),(0,M.jsx)(`div`,{className:`status-item status-message`,children:(0,M.jsx)(`span`,{children:h})})]})]})}function nn(e,t){let n=Je(new DOMParser().parseFromString(e,`text/html`),t);return n?{hftId:t,path:qe(n),tagName:n.tagName.toLowerCase(),id:n.id||``,className:typeof n.className==`string`?n.className:``,text:n.textContent||``,styles:rn(n),effects:{hoverBackgroundColor:$e(e,t)},attributes:{src:n instanceof HTMLImageElement&&n.getAttribute(`src`)||``,alt:n instanceof HTMLImageElement&&n.getAttribute(`alt`)||``},location:an(n),hasInlineStyle:!!n.getAttribute(`style`),canEditText:!(n instanceof HTMLImageElement)&&n.children.length===0}:null}function rn(e){let t=e.style;return{fontFamily:t.fontFamily,fontSize:t.fontSize,color:t.color,fontWeight:t.fontWeight,lineHeight:t.lineHeight,letterSpacing:t.letterSpacing,textAlign:t.textAlign,backgroundColor:t.backgroundColor,borderColor:t.borderColor,borderWidth:t.borderWidth,borderStyle:t.borderStyle,borderRadius:t.borderRadius,boxShadow:t.boxShadow,width:t.width,height:t.height,maxWidth:t.maxWidth,objectFit:t.objectFit,marginTop:t.marginTop,marginBottom:t.marginBottom,paddingTop:t.paddingTop,paddingBottom:t.paddingBottom,paddingLeft:t.paddingLeft,paddingRight:t.paddingRight}}function an(e){let t=typeof e.className==`string`&&e.className.trim()?`.${e.className.trim().split(/\s+/).filter(Boolean).join(`.`)}`:``,n=e.id?`#${e.id}`:``;return`${e.tagName.toLowerCase()}${n}${t}`}function on(e,t){return{...e,effects:{...e.effects,hoverBackgroundColor:$e(t,e.hftId)}}}function sn(e,t,n){let r={[e]:t};return(e===`borderWidth`||e===`borderColor`)&&t.trim()&&(r.borderStyle=n.styles.borderStyle&&n.styles.borderStyle!==`none`?n.styles.borderStyle:`solid`),r}function cn(e,t,n){return Math.min(Math.max(e,t),n)}ne.createRoot(document.getElementById(`root`)).render((0,M.jsx)(j.StrictMode,{children:(0,M.jsx)(tn,{})}));