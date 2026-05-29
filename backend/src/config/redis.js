const { createClient } = require('redis');

const redisclient = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || 'QlQXcs2jfWzBl6wx0nxSBLSj5cEl2snW',
    socket: {
        host: process.env.REDIS_HOST || 'redis-14911.c100.us-east-1-4.ec2.cloud.redislabs.com',
        port: Number(process.env.REDIS_PORT || 14911),
        reconnectStrategy: (retries) => {
            if (retries >= 3) {
                return false;
            }

            return Math.min((retries + 1) * 200, 1000);
        }
    }
});

redisclient.on('error', err => {
    console.log('Redis Client Error', err.message);
});

redisclient.connect().catch(err => {
    console.error('Redis connection failed. Continuing without token blocklist.', err.message);
});

module.exports = redisclient;
