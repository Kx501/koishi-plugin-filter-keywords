import { Context, Schema, h, Dict, Session, Logger, Argv, Time } from 'koishi'
import Mint from 'mint-filter'


export const name = 'filter-keywords'

export const usage = `
  只测试了QQ频道，有空再改。

  使用前确保填入关键词。

  过滤/替换，有些方案没写。
`

export interface Config {
  关键词: string,
  生效范围: any,
  过滤方案: any,
  // 私聊生效: boolean,
  删除关键词: boolean,
  替换关键词: boolean,
  自定义替换文本: string,
  // 不响应: boolean,
  触发提示: boolean,
  撤回消息: boolean,
  自定义提示文本: string,
  // 排除的指令: any,
  // 多位置支持: boolean,
  // 参数位置: any,
  回复调试信息: boolean,
}

export const Config: Schema<Config> = Schema.object({
  关键词: Schema.string().role('textarea', { rows: [3, 100] }).description('用中/英文逗号隔开。'),
  生效范围: Schema.array(String).role('table').description('可以是平台/群组/频道/用户(私聊=频道)id。').required(),
  过滤方案: Schema.union(['正则匹配','无']).default('正则匹配'), //, '数组处理', 'Aho-Corasick'
  // 私聊生效: Schema.boolean().default(false).description('私聊也过滤。'),
  删除关键词: Schema.boolean().default(true).description('从消息中删除关键词。'),
  替换关键词: Schema.boolean().default(false).description('将关键词替换为“*”。'),
  自定义替换文本: Schema.string().default('*').description('只支持字符串。'),
  // 不响应: Schema.boolean().default(false).description('触发关键词不响应消息。'),
  触发提示: Schema.boolean().default(false).description('触发后不执行指令，并且提示。'),
  撤回消息: Schema.boolean().default(false).description('需要管理员权限。'),
  自定义提示文本: Schema.string().default('触发敏感词了哦~').description('自定义提示消息。'),
  // 多位置支持: Schema.boolean().default(false).description('支持传入指令的参数有多个空格隔开的情况。'),
  // 参数位置: Schema.boolean().default(false).description('触发后提示。'),
  回复调试信息: Schema.boolean().default(false).description('机器人会回复触发的关键词，以及处理后的文本。'),
})

export function apply(ctx: Context, config: Config) {
  const logger = new Logger('filter-keywords')
  logger.debug('开启调试模式。')
  const filterWords = config.删除关键词,
    filtering = config.过滤方案,
    replaceWords = config.替换关键词;
  let time1: any,
    time2: any;

  // 格式化关键词数组
  const keywords = processKeywords(config.关键词);
  function processKeywords(inputString: string) {
    if (inputString !== '') {
      // 正则去除所有空格并按逗号分割
      const keywordsArray = inputString.replace(/\s+/g, '').split(/[,，]/);
      return keywordsArray;
    } else {
      logger.error('错误：过滤前确保填入关键词！')
      return ['无关键词']
    }
  }

  // 提示信息&撤回
  function prompt(result: any, session: Session<never, never, Context>, content: string) {

    // const triggerLength = result.words.length
    time2 = new Date();
    const tempResult = result.text

    if (config.触发提示 && flag) {
      logger.debug('不执行指令......')
      session.send(h('at', { id: session.userId }) + config.自定义提示文本)
      content = ''
    } else
      content = tempResult

    if (config.撤回消息 && flag)
      session.bot.deleteMessage(session.channelId, session.messageId)

    // 调试开关
    if (config.回复调试信息 && flag) {
      logger.debug('提示......')
      const debugStr = `处理结果：${tempResult}\n耗时：${time2 - time1} ms`
      session.send(debugStr)
    }

    // 重置
    flag = false;
    return content
  }


  const table = new Set(config.生效范围);
  let flag = false;

  ctx.on('before-parse', (content, session,) => {

    // 遍历 session 中的属性值，如果在 table 中找到了匹配项，设置 flag 为 true
    if (table.has(session?.userId) || table.has(session?.channelId) || table.has(session?.guildId) || table.has(session?.platform)) {
      flag = true;
    }

    // logger.debug('原始消息: ', session)
    logger.debug('处理前: ', content)
    time1 = new Date();

    if (flag) {
      if (filterWords) {
        logger.debug('过滤......')


        if (filtering === 'Aho-Corasick') {
          const result = ahoFilt(content, keywords)
          content = prompt(result, session, content)
        } else if (filtering === '正则匹配') {
          const result = regFilt(content, keywords)
          // logger.info(result)
          content = prompt(result, session, content)
        } else if (filtering === '数组处理') {
          const result = arrFilt(content, keywords)
          content = prompt(result, session, content)
        }

      }
      else if (replaceWords) {
        logger.debug('替换......')

        if (filtering === 'Aho-Corasick') {
          const result = ahoRepl(content, keywords)
          content = prompt(result, session, content)
        } else if (filtering === '正则匹配') {
          const result = regRepl(content, keywords)
          content = prompt(result, session, content)
        }
      }
    }

    // 解析消息
    const argv = Argv.parse(content)
    logger.debug('处理后: ', argv)

    return argv;
  }, true)


  //// Aho–Corasick
  // 过滤
  function ahoFilt(text: string, keywords: string[]) {
    // 使用正则表达式分割文本为句子，保留符号
    const sentences = text.split(/([^\u4e00-\u9fa5a-zA-Z0-9]+)/).filter(Boolean); // 过滤空字符串

    // 每两个元素拼接
    const mergedSentences = sentences.reduce((acc, curr, index) => {
      if (index % 2 === 0) {
        const mergedSentence = curr + (sentences[index + 1] || ''); // 若奇数个元素，最后一个元素为空字符串
        acc.push(mergedSentence);
      }
      return acc;
    }, []);

    // 使用 Aho-Corasick 算法验证每个句子
    const mint = new Mint(keywords);
    const filteredSentences = mergedSentences.filter(sentence => {
      const status = mint.verify(sentence);
      return status; // 返回 true 表示句子通过验证
    });

    // 将过滤后的句子拼接为文本
    const filteredText = filteredSentences.join('');
    // 返回过滤后的文本
    return { text: filteredText };
  }

  // 替换
  function ahoRepl(text: string, keywords: string[]) {
    const mint = new Mint(keywords, { customCharacter: `${config.自定义替换文本}` });
    return mint.filter(text, { replace: true });
  }



  //// 正则
  function regFilt(text: string, keywords: string[]) {
    // 正则分割文本，保留符号
    const sentences = text.split(/([^\u4e00-\u9fa5a-zA-Z0-9]+)/).filter(Boolean);
    // 每两个元素拼接
    const mergedSentences = sentences.reduce((acc, curr, index) => {
      if (index % 2 === 0) {
        const mergedSentence = curr + (sentences[index + 1] || ''); // 若奇数个元素，最后一个元素为空字符串
        acc.push(mergedSentence);
      }
      return acc;
    }, []);
    // 过滤
    const filteredSentences = mergedSentences.filter(sentence => {
      return !keywords.some(keyword => new RegExp(keyword, 'gi').test(sentence));
    });
    // 拼接
    const filteredText = filteredSentences.join('');
    return { text: filteredText };
  }

  function regRepl(text: string, keywords: string[]) {
    // 替换关键词
    const filteredText = keywords.reduce((acc, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      return acc.replace(regex, '*'.repeat(keyword.length));
    }, text);
    // 返回替换后的文本
    return { text: filteredText };
  }



  //// 普通数组
  function arrFilt(text: string, keywords: string[]) {
    // 切片
    const sentences = text.split(' ');
    // 过滤
    const filteredSentences = sentences.filter(sentence => {
      // 判断句子是否包含关键词
      return !keywords.some(keyword => sentence.includes(keyword));
    });
    // 复原
    const filteredText = filteredSentences.join(' ');
    // 返回过滤后的文本
    return { text: filteredText };
  }
}