const config = require('./config_loader');
const Zulip = require('zulip-js');
const get_handler = require('./get_handler');

let clients = [];

const whoami = async (client) => {
    const profile = await client.users.me.getProfile();
    console.log(
        `zulip-bridge: We're known as ${profile.full_name} on ${client.config.name}.`
    );
};

const watch = async (client) => {
    const event_handler = get_handler(client, clients);
    client.callOnEachEvent(event_handler, ['message']);
};

const init = async () => {
    for (const server of config.servers) {
        const client = Zulip(server);
        clients.push(client);
    }
    clients = await Promise.all(clients);
    for (const client of clients) {
        whoami(client);
        watch(client);
    }
    console.log('zulip-bridge: Ready');
};

init();
