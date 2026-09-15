const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const transport = new DailyRotateFile({
    // 日志文件名称，%DATE%会被替换成当前日期
    filename: 'application-%DATE%.log',
    // 日志文件的目录
    dirname: './logs',
    // 日志文件的日期格式和轮转时间间隔
    datePattern: 'YYYY-MM-DD',
    // 是否压缩旧的日志文件
    zippedArchive: true,
    // 最大文件大小（单位：字节）
    maxSize: '20m',
    // 保留日志文件的最大天数
    maxFiles: '1d',
    // 格式化日志
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
      winston.format.errors({ stack: true })
    )
  });

module.exports = {
    // 定义日志级别
    level: 'info',
    // 定义日志传输方式
    transports: [
        // 记录到文件
        transport
    ]
};