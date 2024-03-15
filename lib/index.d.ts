import { Context, Schema } from 'koishi';
export declare const name = "filter-keywords";
export declare const usage = "\u76EE\u524D\u53EA\u652F\u6301\u53C2\u6570\u5728\u672B\u5C3E\u7684\u60C5\u51B5\uFF0C\u6709\u7A7A\u518D\u6539\u3002";
export interface Config {
    关键词: string;
    过滤关键词: boolean;
    替换关键词: boolean;
    自定义替换文本: string;
    撤回消息: boolean;
    触发提示: boolean;
    自定义提示文本: string;
    回复调试信息: boolean;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
