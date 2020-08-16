// Copy this file to config.js and edit as needed.

const czo = {
    zuliprc: '/path/to/zuliprc',
};
const nightly = {
    username: 'botone-bot@nightly.zulipdev.org',
    apiKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    realm: 'https://nightly.zulipdev.org',
};
const programmers = {
    username: 'one-bot@zulipchat.com',
    apiKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    realm: 'https://programmers.zulipchat.com',
};

const testing_bridge = {
    name: 'Testing Bridge',
    pairs: [
        ['czo', 'test here'],
        ['nightly', 'testing'],
        ['programmers', 'test'],
    ],
};

const coffee_bridge = {
    name: 'Coffee Bridge',
    pairs: [
        ['czo', 'coffee cooler'],
        ['nightly', 'core team'],
    ],
};

module.exports = {
    servers: { czo, nightly, programmers },
    bridges: [testing_bridge, coffee_bridge],
};
