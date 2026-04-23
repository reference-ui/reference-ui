import type { CssFunction, CssRawFunction, CssStyles } from '../../types';
declare function css(styles: CssStyles): string;
declare namespace css {
    var raw: CssRawFunction;
}
export declare const publicCss: CssFunction;
export { publicCss as css };
