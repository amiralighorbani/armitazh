const { setTimeout:sleep } = require('timers/promises')
async function customSetInterval(fn, delay) {
    while (true) {
        await fn()
        await sleep(delay)
    }
}

module.exports = {customSetInterval}
