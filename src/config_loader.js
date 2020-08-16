const load_config = () => {
    let config = {};
    let user_config;
    try {
        user_config = require('../config');
    } catch (e) {
        user_config = {};
    }
    return Object.assign(config, user_config);
};

module.exports = load_config();
