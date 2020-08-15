require('dotenv').config();
const fs = require('fs');
const { FetchStream } = require('fetch');
const Logger = require('simple-node-logger');
const messages = require('./messages');

const LOG_INTERVAL = 5000;
const startTime = Date.now();
const today = new Date(startTime).toLocaleString('en').split(',')[0].replace(/\//g, '-')

const name = `online-${today}-${startTime}.mp3`;
log = Logger.createSimpleLogger(`project-${today}.log`);

const logStat = () => fs.stat(name, function (err, stats) {
    if (err) throw err;
    log.info(`size: ${Math.round(stats.size / 1024)} KB`);
});

(async () => {
    try {
        const stream = new FetchStream(process.env.STREAM_URL);
        const interval = setInterval(logStat, LOG_INTERVAL)

        stream.on('meta', (meta) => {
            if (meta.status === 404) {
                log.info('Stream responded 404');
                clearInterval(interval);
                return;
            }

            process.send(messages.CONNECTION_ESTABLISHED);
            log.info(`Status: ${meta.status}; connection: ${meta.responseHeaders.connection}`);
            const writableStream = fs.createWriteStream(name);
            stream.pipe(writableStream);
        });

        stream.on('end', () => {
            log.info('There will be no more data.');
            clearInterval(interval);
        });

        stream.on('error', (e) => {
            log.error('Error in fetch stream:', e);
            clearInterval(interval);
        });
    } catch (e) {
        log.error(e.toJSON());
        if (e.statusCode === 404) {
            console.log('💦');
        }
    }
})()



