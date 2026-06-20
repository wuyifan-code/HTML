// 为 public/ 下的预打包 IIFE 资源声明 ambient module
declare module "*/pptxgen.bundle.js" {
  import type { PptxGenJsLike } from "../utils/exportPptx";
  const value: { default: PptxGenJsLike };
  export default value;
}
declare module "*/pdf-lib.bundle.js" {
  import type { PdfLibLike } from "../utils/exportPdf";
  const value: { default: { PDFDocument: PdfLibLike["PDFDocument"] } };
  export default value;
}