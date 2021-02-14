const Log2gelf = require('winston-log2gelf')
const winston = require('winston')
const moment = require('moment')

const { combine, timestamp, prettyPrint } = winston.format
const transports = []
if (process.env.NODE_ENV !== 'test') {
  transports.push(new winston.transports.File({ filename: 'debug.log' }))
}
transports.push(new (winston.transports.Console)({ 'timestamp': true }))
if (process.env.LOG_PORT && process.env.LOG_HOST) {
  transports.push(new Log2gelf({
    hostname: process.env.LOG_HOSTNAME || 'labtool-backend',
    host: process.env.LOG_HOST,
    port: process.env.LOG_PORT,
    protocol: process.env.LOG_PROTOCOL || 'https',
    environment: process.env.NODE_ENV,
    protocolOptions: {
      path: process.env.LOG_PATH || '/gelf'
    }
  }))
}
const logger = winston.createLogger({
  format: combine(
    timestamp({
      format: () => moment().format('DD-MM-YYYY HH:mm:ss')
    }),
    prettyPrint({ depth: 5 })
  ),
  transports
})
module.exports = logger
