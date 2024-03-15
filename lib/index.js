"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.usage = exports.name = void 0;
const koishi_1 = require("koishi");
const mint_filter_1 = __importDefault(require("mint-filter"));
exports.name = 'filter-keywords';
exports.usage = '目前只支持参数在末尾的情况，有空再改。';
exports.Config = koishi_1.Schema.object({
    关键词: koishi_1.Schema.string().role('textarea', { rows: [3, 100] }).description('用中/英文逗号隔开。'),
    过滤关键词: koishi_1.Schema.boolean().default(true).description('从消息中删除关键词。'),
    替换关键词: koishi_1.Schema.boolean().default(false).description('将关键词替换为“*”。'),
    自定义替换文本: koishi_1.Schema.string().default('*').description('只支持字符串。'),
    // 不响应: Schema.boolean().default(false).description('触发关键词不响应消息。'),
    撤回消息: koishi_1.Schema.boolean().default(false).description('需要管理员权限。'),
    触发提示: koishi_1.Schema.boolean().default(false).description('触发后不执行指令，并且提示。'),
    自定义提示文本: koishi_1.Schema.string().default('触发敏感词了哦~').description('自定义提示消息。'),
    // 多位置支持: Schema.boolean().default(false).description('支持传入指令的参数有多个空格隔开的情况。'),
    // 参数位置: Schema.boolean().default(false).description('触发后提示。'),
    回复调试信息: koishi_1.Schema.boolean().default(false).description('机器人会回复触发的关键词，以及处理后的文本。'),
});
function apply(ctx, config) {
    const logger = new koishi_1.Logger('filter-keywords');
    logger.debug('开启调试模式。');
    // 格式化关键词数组
    const keywords = processKeywords(config.关键词);
    function processKeywords(inputString) {
        if (inputString.length > 0) {
            // 按逗号分割
            const keywordsArray = inputString.split(/[,，]/);
            // 去除最外层空格
            const processedKeywords = keywordsArray.map(keyword => keyword.trim());
            return processedKeywords;
        }
        else {
            logger.error('过滤前确保填入关键词！');
        }
    }
    // 过滤关键词
    function filterKeywords(text, keywords) {
        const mint = new mint_filter_1.default(keywords, { customCharacter: '' });
        // logger.debug(mint)
        return mint.filter(text, { replace: true });
    }
    // 替换关键词
    function replaceKeywords(text, keywords) {
        const mint = new mint_filter_1.default(keywords, { customCharacter: `${config.自定义替换文本}` });
        return mint.filter(text, { replace: true }); //.replace(/\*+/g, replaceChar);
    }
    // 提示信息&撤回
    function prompt(result, session, content) {
        const triggerFlag = result.words.length;
        if (config.触发提示 && triggerFlag > 0) {
            logger.debug('不执行......');
            session.send((0, koishi_1.h)('at', { id: session.userId }) + config.自定义提示文本);
            content = '';
        }
        else {
            content = result.text;
        }
        if (config.撤回消息 && triggerFlag > 0) {
            session.bot.deleteMessage(session.channelId, session.messageId);
        }
        return content;
    }
    ctx.on('before-parse', (content, session) => {
        // const elements = h.select(content, 'text')
        // logger.debug('原始消息: ', elements)
        logger.debug('处理前: ', content);
        if (config.过滤关键词) {
            logger.debug('过滤......');
            const result = filterKeywords(content, keywords);
            content = prompt(result, session, content);
        }
        else if (config.替换关键词) {
            logger.debug('替换......');
            const result = replaceKeywords(content, keywords);
            content = prompt(result, session, content);
        }
        // if (quote?.content) {
        //   argv.tokens.push({
        //     content: quote.content,
        //     quoted: true,
        //     inters: [],
        //     terminator: '',
        //   })
        // }
        // 解析消息
        // const { quote, isDirect, stripped: { prefix, appel } } = session
        const argv = koishi_1.Argv.parse(content);
        logger.debug('处理后: ', argv);
        return argv;
    }, true);
}
exports.apply = apply;
