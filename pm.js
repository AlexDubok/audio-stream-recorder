const { fork } = require('child_process');
const { createSimpleLogger } = require('simple-node-logger');
const messages = require('./messages');

log = createSimpleLogger({
    logFilePath: 'process-manager.log',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss'
});

const MAX_RETRY_COUNT = 20;
const INITIAL_RECONNECT_TIMEOUT = 1000;

let count = 0;
let reconnectTimeout = INITIAL_RECONNECT_TIMEOUT;

const start = () => {
    const child = fork('./index.js', [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('message', (message) => {
        if (message === messages.CONNECTION_ESTABLISHED) {
            log.info(messages.CONNECTION_ESTABLISHED);
            count = 0;
            reconnectTimeout = INITIAL_RECONNECT_TIMEOUT;
        }
    });

    child.on('close', (code) => {
        log.info(`child process exited with code ${code}`);
        count += 1;

        if (count < MAX_RETRY_COUNT) {
            setTimeout(start, reconnectTimeout);
            reconnectTimeout = reconnectTimeout * 2;
        }
    });
}
start()