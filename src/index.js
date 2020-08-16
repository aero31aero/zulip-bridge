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

const print_bridges = (config) => {
    for (bridge of config.bridges) {
        const bridge_pair_string = bridge.pairs
            .map((e) => e.join('>'))
            .join(', ');
        console.log(
            `zulip-bridge: Creating '${bridge.name}' between ${bridge_pair_string}.`
        );
    }
};

const watch = async (client) => {
    const event_handler = get_handler(client, clients);
    client.callOnEachEvent(event_handler, ['message']);
};

const init = async () => {
    for (const server of config.servers) {
        const client = await Zulip(server);
        client.config.name = server.name;
        clients.push(client);
    }
    console.log('zulip-bridge: Ready.');
    print_bridges(config);
    for (const client of clients) {
        whoami(client);
        watch(client);
    }
};

init();
