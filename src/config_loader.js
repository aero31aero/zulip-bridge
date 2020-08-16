const load_config = () => {
    let config = {};
    let user_config;
    try {
        user_config = require('../config');
    } catch (e) {
        user_config = {};
    }
    // Convert objects of zulip-js config objects to an array with 'name'.
    const server_array = [];
    for (const [key, value] of Object.entries(user_config.servers)) {
        value.name = key;
        server_array.push(value);
    }
    user_config.servers = server_array;
    return Object.assign(config, user_config);
};

module.exports = load_config();
