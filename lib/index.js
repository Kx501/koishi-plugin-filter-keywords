"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.name = void 0;
const koishi_1 = require("koishi");
const mint_filter_1 = __importDefault(require("mint-filter"));
exports.name = 'filter-keywords';
exports.Config = koishi_1.Schema.object({
    过滤关键词: koishi_1.Schema.boolean().default(true).description('从消息中删除关键词。'),
    替换关键词: koishi_1.Schema.boolean().default(false).description('将关键词替换为“*”。'),
    // 自定义替换文本: Schema.string().default('*').description('支持字符串。'),
    不响应消息: koishi_1.Schema.boolean().default(false).description('触发关键词没有任何响应。'),
    撤回消息: koishi_1.Schema.boolean().default(true).description('需要管理员权限。'),
    关键词: koishi_1.Schema.string().role('textarea', { rows: [6, 100] }).description('用中/英文逗号分割。'),
    测试回复: koishi_1.Schema.boolean().default(true).description('机器人会重复过滤后的文本。'),
    自定义分隔符: koishi_1.Schema.string().default(', ').description('自定义处理后文本的分隔符。'),
});
function apply(ctx, config) {
    const logger = new koishi_1.Logger('filter-keywords');
    function processKeywords(inputString) {
        // 按逗号分割
        const keywordsArray = inputString.split(/[,，]/);
        // 去除最外层空格
        const processedKeywords = keywordsArray.map(keyword => keyword.trim());
        return processedKeywords;
    }
    // 过滤关键词
    function filterKeywords(text, keywords) {
        const mint = new mint_filter_1.default(keywords);
        return mint.filter(text).text;
    }
    // 替换关键词
    function replaceKeywords(text, keywords) {
        const mint = new mint_filter_1.default(keywords);
        return mint.filter(text, { replace: true }).text; //.replace(/\*+/g, replaceChar);
    }
    const keywordsArray = processKeywords(config.关键词);
    ctx.on('before-parse', (content, session) => {
        let result;
        let rules;
        const text = session.content;
        logger.info(ctx);
        if (config.过滤关键词) {
            const result = filterKeywords(text, keywordsArray);
        }
        else if (config.替换关键词) {
            // h.transform(replaceKeywords(text, keywordsArray), rules){
            // };
        }
        else if (config.撤回消息) {
        }
        else if (config.不响应消息) {
        }
        // 敏感词数组
        const mint = new mint_filter_1.default(['敏感词数组']);
        // 基本使用
        mint.filter('需要验证的文本');
        return result;
    }, true);
    // ctx.middleware(
    //   async (session, next) => {
    //     const text = session.content;
    //     if (config.过滤关键词) {
    //       filterKeywords(text, keywordsArray)
    //     } else if (config.替换关键词) {
    //       replaceKeywords(text, keywordsArray)
    //     } else if (config.撤回消息) {
    //     } else if (config.不响应消息) {
    //     } return next();
    //     // 敏感词数组
    //     const mint = new Mint(['敏感词数组'])
    //     // 基本使用
    //     mint.filter('需要验证的文本')
    //   }, true)
}
exports.apply = apply;
