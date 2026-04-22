declare module "remark-gfm" {
  import type { Plugin } from "unified";

  const remarkGfm: Plugin<[], unknown>;
  export default remarkGfm;
}
