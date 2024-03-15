import { Context, Schema } from 'koishi';
export declare const name = "filter-keywords";
export declare const usage = "\n  \u53EA\u6D4B\u8BD5\u4E86QQ\u9891\u9053\uFF0C\u6709\u7A7A\u518D\u6539\u3002\n  \u4F7F\u7528\u524D\u786E\u4FDD\u586B\u5165\u5173\u952E\u8BCD\u3002\n  \u57FA\u4E8EAho\u2013Corasick\u7B97\u6CD5\u5B9E\u73B0\u7684\u654F\u611F\u8BCD\u8FC7\u6EE4\u3002\n";
export interface Config {
    关键词: string;
    过滤关键词: boolean;
    替换关键词: boolean;
    自定义替换文本: string;
    触发提示: boolean;
    撤回消息: boolean;
    自定义提示文本: string;
    回复调试信息: boolean;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
