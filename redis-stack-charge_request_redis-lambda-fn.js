"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");

const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;

const redisClient = redis.createClient({
  host: process.env.ENDPOINT,
  port: parseInt(process.env.PORT || "6379"),
});

exports.chargeRequestRedis = async function (input) {
  const remainingBalance = await getBalanceRedis(KEY);
  const charges = getCharges();
  const isAuthorized = authorizeRequest(remainingBalance, charges);

  if (!isAuthorized) {
    return {
      remainingBalance,
      isAuthorized,
      charges: 0,
    };
  }

  await chargeRedis(KEY, charges);

  return {
    remainingBalance: remainingBalance - charges,
    charges,
    isAuthorized,
  };
};

exports.resetRedis = async function () {
  return new Promise((resolve, reject) => {
    redisClient.set(KEY, String(DEFAULT_BALANCE), (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(DEFAULT_BALANCE);
      }
    });
  });
};

async function getBalanceRedis(key) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(parseInt(res || "0"));
      }
    });
  });
}

async function chargeRedis(key, charges) {
  return new Promise((resolve, reject) => {
    redisClient.decrby(key, charges, (err, res) => {
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
