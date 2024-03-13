import { Context, Schema } from 'koishi'
import Mint from 'mint-filter'


export const name = 'filter-keywords'

export interface Config {
  过滤关键词: boolean,
  替换关键词: boolean,
  // 自定义替换文本: string,
  不响应消息: boolean,
  撤回消息: boolean,
  关键词: string,
  测试回复: boolean,
  自定义分隔符: string,
}

export const Config: Schema<Config> = Schema.object({
  过滤关键词: Schema.boolean().default(true).description('从消息中删除关键词。'),
  替换关键词: Schema.boolean().default(false).description('将关键词替换为“*”。'),
  // 自定义替换文本: Schema.string().default('*').description('支持字符串。'),
  不响应消息: Schema.boolean().default(false).description('触发关键词没有任何响应。'),
  撤回消息: Schema.boolean().default(true).description('需要管理员权限。'),
  关键词: Schema.string().role('textarea', { rows: [6, 100] }).description('用中/英文逗号分割。'),
  测试回复: Schema.boolean().default(true).description('机器人会重复过滤后的文本。'),
  自定义分隔符: Schema.string().default(', ').description('自定义处理后文本的分隔符。'),
})

export function apply(ctx: Context, config: Config) {


  function processKeywords(inputString: string) {
    // 按逗号分割
    const keywordsArray = inputString.split(/[,，]/);
    // 去除最外层空格
    const processedKeywords = keywordsArray.map(keyword => keyword.trim());
    return processedKeywords;
  }

// 过滤关键词
function filterKeywords(text: string, keywords: string[]) {
  const mint = new Mint(keywords);
  return mint.filter(text).text;
}

// 替换关键词
function replaceKeywords(text: string, keywords: string[]) {
  const mint = new Mint(keywords);
  return mint.filter(text, { replace: true }).text;//.replace(/\*+/g, replaceChar);
}

  const keywordsArray = processKeywords(config.关键词);

  ctx.middleware(
    async (session, next) => {
      const text = session.content;

      if (config.过滤关键词) {
        filterKeywords(text, keywordsArray)
      } else if (config.替换关键词) {
        replaceKeywords(text, keywordsArray)
      } else if (config.撤回消息) {
        
      } else if (config.不响应消息) {

      } return next();

      // 敏感词数组
      const mint = new Mint(['敏感词数组'])

      // 基本使用
      mint.filter('需要验证的文本')


    }, true)

}