"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const MAX_EXPIRATION = 60 * 60 * 24 * 30;

// Create a single Redis client connection
const redisClient = redis.createClient({
  host: process.env.ENDPOINT,
  port: parseInt(process.env.PORT || "6379"),
});
const redisGetAsync = util.promisify(redisClient.get).bind(redisClient);
const redisDecrbyAsync = util.promisify(redisClient.decrby).bind(redisClient);

exports.chargeRequestRedis = async function (input) {
    var remainingBalance = await getBalanceRedis(KEY);
    var charges = getCharges();
    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    remainingBalance = await chargeRedis(KEY, charges);
    return {
        remainingBalance,
        charges,
        isAuthorized,
    };
};

exports.resetRedis = async function () {
    await setBalanceRedis(KEY, DEFAULT_BALANCE);
    return DEFAULT_BALANCE;
};

async function setBalanceRedis(key, balance) {
    return new Promise((resolve, reject) => {
        redisClient.set(key, String(balance), (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}

function getCharges() {
    return DEFAULT_BALANCE / 20;
}

async function getBalanceRedis(key) {
    const res = await redisGetAsync(key);
    return parseInt(res || "0");
}

async function chargeRedis(key, charges) {
    return redisDecrbyAsync(key, charges);
}
