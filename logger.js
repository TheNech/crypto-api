const log4js = require('log4js');

log4js.configure({
    appenders: {
        out: {
            type: 'stdout',
            layout: {
                type: 'pattern',
                pattern: '%[[%d{hh:mm:ss}][%p] %m%]'
            }
        }
    },
    categories: {
        default: {
            appenders: ['out'],
            level: 'all'
        }
    }
});

module.exports = log4js.getLogger();
