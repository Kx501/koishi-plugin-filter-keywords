import { Context, Schema, h, Dict, Session, Logger, Argv } from 'koishi'
import Mint from 'mint-filter'


export const name = 'filter-keywords'

export const usage = '目前只支持参数在末尾的情况，有空再改。'

export interface Config {
  关键词: string,
  过滤关键词: boolean,
  替换关键词: boolean,
  自定义替换文本: string,
  // 不响应: boolean,
  撤回消息: boolean,
  触发提示: boolean,
  自定义提示文本: string,
  // 排除的指令: any,
  // 多位置支持: boolean,
  // 参数位置: any,
  回复调试信息: boolean,
}

export const Config: Schema<Config> = Schema.object({
  关键词: Schema.string().role('textarea', { rows: [3, 100] }).description('用中/英文逗号隔开。'),
  过滤关键词: Schema.boolean().default(true).description('从消息中删除关键词。'),
  替换关键词: Schema.boolean().default(false).description('将关键词替换为“*”。'),
  自定义替换文本: Schema.string().default('*').description('只支持字符串。'),
  // 不响应: Schema.boolean().default(false).description('触发关键词不响应消息。'),
  撤回消息: Schema.boolean().default(false).description('需要管理员权限。'),
  触发提示: Schema.boolean().default(false).description('触发后不执行指令，并且提示。'),
  自定义提示文本: Schema.string().default('触发敏感词了哦~').description('自定义提示消息。'),
  // 多位置支持: Schema.boolean().default(false).description('支持传入指令的参数有多个空格隔开的情况。'),
  // 参数位置: Schema.boolean().default(false).description('触发后提示。'),
  回复调试信息: Schema.boolean().default(false).description('机器人会回复触发的关键词，以及处理后的文本。'),
})

export function apply(ctx: Context, config: Config) {
  const logger = new Logger('filter-keywords')
  logger.debug('开启调试模式。')


  // 格式化关键词数组
  const keywords = processKeywords(config.关键词);

  function processKeywords(inputString: string) {
    if (inputString.length > 0) {
      // 按逗号分割
      const keywordsArray = inputString.split(/[,，]/);
      // 去除最外层空格
      const processedKeywords = keywordsArray.map(keyword => keyword.trim());
      return processedKeywords;
    } else {
      logger.error('过滤前确保填入关键词！')
    }
  }

  // 过滤关键词
  function filterKeywords(text: string, keywords: string[]) {
    const mint = new Mint(keywords, { customCharacter: '' });
    // logger.debug(mint)
    return mint.filter(text, { replace: true });
  }

  // 替换关键词
  function replaceKeywords(text: string, keywords: string[]) {
    const mint = new Mint(keywords, { customCharacter: `${config.自定义替换文本}` });
    return mint.filter(text, { replace: true });//.replace(/\*+/g, replaceChar);
  }

  // 提示信息&撤回
  function prompt(result: any, session: Session<never, never, Context>, content: string) {
    const triggerFlag = result.words.length
    if (config.触发提示 && triggerFlag > 0) {
      logger.debug('不执行......')
      session.send(h('at', { id: session.userId }) + config.自定义提示文本)
      content = ''
    } else {
      content = result.text
    }

    if (config.撤回消息 && triggerFlag > 0) {
      session.bot.deleteMessage(session.channelId, session.messageId)
    }
    return content
  }


  ctx.on('before-parse', (content, session,) => {
    // const elements = h.select(content, 'text')
    // logger.debug('原始消息: ', elements)


    logger.debug('处理前: ', content)


    if (config.过滤关键词) {
      logger.debug('过滤......')
      const result = filterKeywords(content, keywords)
      content = prompt(result, session, content)

    } else if (config.替换关键词) {
      logger.debug('替换......')
      const result = replaceKeywords(content, keywords)
      content = prompt(result, session, content)
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
    const argv = Argv.parse(content)
    logger.debug('处理后: ', argv)
    return argv;
  }, true)
}