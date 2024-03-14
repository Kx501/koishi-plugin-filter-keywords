import { Context, Schema } from 'koishi';
export declare const name = "filter-keywords";
export interface Config {
    过滤关键词: boolean;
    替换关键词: boolean;
    不响应消息: boolean;
    撤回消息: boolean;
    关键词: string;
    测试回复: boolean;
    自定义分隔符: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
