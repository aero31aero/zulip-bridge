const config = require('./config_loader');

// https://chat.zulip.org/#narrow/stream/127-integrations/topic/async.20python-zulip-api/near/990230
const format_message = (message, client) => {
    const link = `${client.config.realm}/#narrow/stream/${message.stream_id}-${message.display_recipient}/near/${message.id}`;
    const header = `[${message.sender_full_name}:](${link})`;
    return `${header} ${message.content}`;
};

const get_recipients = (message, client) => {
    const name = client.config.name;
    const stream = message.display_recipient;
    const bridge = config.bridges.find((b) => {
        return b.pairs.find((p) => {
            return p[0] === name && p[1] === stream;
        });
    });
    if (!bridge) {
        return;
    }
    console.log(`zulip-bridge: Message matches bridge '${bridge.name}'`);
    const recipients = bridge.pairs.filter((p) => {
        return !(p[0] === name && p[1] === stream);
    });
    if (!recipients.length > 0) {
        return;
    }
    return recipients;
};

const handle_message = async (message, client, clients) => {
    if (message.sender_email === client.config.username) {
        return; // Do not handle own messages
    }
    if (message.type !== 'stream') {
        return; // Do not handle PMs
    }
    const recipients = get_recipients(message, client);
    if (!recipients) {
        return; // Do not handle messages we don't have any rules for.
    }
    console.log(
        `zulip-bridge: Sending message to ${recipients
            .map((e) => e.join('>'))
            .join(', ')}`
    );
    const messages = [];
    for (recipient of recipients) {
        const recipient_client = clients.find((c) => {
            return c.config.name === recipient[0];
        });
        const new_message_promise = recipient_client.messages
            .send({
                type: 'stream',
                to: recipient[1],
                topic: message.subject,
                content: format_message(message, client),
            })
            .then((e) => {
                if (e.result === 'error') {
                    // Zulip error
                    console.error(
                        `zulip-bridge: Error sending message to ${recipient[0]}>${recipient[1]}.`
                    );
                    console.error(e);
                    return Promise.reject(e);
                }
            });
        messages.push(new_message_promise);
    }
    Promise.all(messages)
        .then((e) => {
            // All messages were sent successfully.
            client.reactions.add({
                message_id: message.id,
                emoji_name: 'check',
            });
        })
        .catch((e) => {
            // Some messages couldn't be sent; Print the error and react to convey something went wrong.
            console.error(e);
            client.reactions.add({
                message_id: message.id,
                emoji_name: 'wrong',
            });
        });
};

const handle_edit = async (event, client) => {
    const messages = await client.messages.retrieve({
        anchor: event.message_id,
        num_before: 4,
        num_after: 4,
    });
    const message = messages.messages.find((m) => m.id === event.message_id);
    if (!message) {
        return;
    }
    const recipients = get_recipients(message, client);
    if (!recipients) {
        return;
    }
    let content = 'Hey! I just noticed you edited a message in a bridged';
    content += ' stream. I cannot mirror message edits and reactions.';
    content += ' If needed, please send the edits you made as a';
    content += ' new message instead. :smile:';
    client.messages.send({
        type: 'private',
        to: [event.user_id],
        content,
    });
    client.reactions.remove({
        message_id: event.message_id,
        emoji_name: 'check',
    });
    client.reactions.add({
        message_id: event.message_id,
        emoji_name: 'times_up',
    });
};

module.exports = (client, clients) => {
    return function (event) {
        if (event.type === 'heartbeat' || event.type === 'presence') {
            return; // Do not handle these events.
        }
        console.log(
            `zulip-bridge: Got event '${event.type}' on ${client.config.name}.`
        );
        if (event.type === 'message') {
            handle_message(event.message, client, clients);
        }
        if (event.type === 'update_message') {
            handle_edit(event, client);
        }
    };
};
