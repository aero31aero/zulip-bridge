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

const say_hello = (config, clients) => {
    if (!config.opts.say_hello) {
        return;
    }
    for (bridge of config.bridges) {
        let content =
            'Hey! The following places are now connected to each other:\n';
        for (pair of bridge.pairs) {
            const client = clients.find((c) => c.config.name === pair[0]);
            content += `- [${pair[0]} > ${pair[1]}](${client.config.realm}/#narrow/stream/${pair[1]})\n`;
        }
        content +=
            "When a message has been successfully mirrored, you'll see a :check: reaction on your message.\n\n";
        content +=
            'Please keep in mind that we cannot mirror message edits and reactions; please send a new message';
        content += ' instead of editing an existing one.';
        for (pair of bridge.pairs) {
            const client = clients.find((c) => c.config.name === pair[0]);
            client.messages.send({
                type: 'stream',
                to: pair[1],
                topic: 'hello',
                content,
            });
        }
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
    say_hello(config, clients);
    for (const client of clients) {
        whoami(client);
        watch(client);
    }
};

init();
