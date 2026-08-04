const jwt = require("jsonwebtoken");
const fs = require("fs");
const env = fs.readFileSync(".env", "utf8");
console.log("ENV FILE CONTENTS:");
console.log(env.replace(/=[^\\n]+/g, '=***'));

const authJwtSecretLine = env.split('\\n').find(line => line.startsWith("AUTH_JWT_SECRET="));
const authJwtSecret = authJwtSecretLine ? authJwtSecretLine.split("=")[1].trim() : null;

const jwtSecretLine = env.split('\\n').find(line => line.startsWith("JWT_SECRET="));
const jwtSecret = jwtSecretLine ? jwtSecretLine.split("=")[1].trim() : null;

console.log("AUTH_JWT_SECRET length:", authJwtSecret ? authJwtSecret.length : 0);
console.log("JWT_SECRET length:", jwtSecret ? jwtSecret.length : 0);

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdmFuaWJhbmRhcnVwYWxsaTc2OUBnbWFpbC5jb20iLCJuYW1lIjoiYmFuZGFydXBhbGxpIHBhdmFuaSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKVl94YW1KY0VfS0VTZ05xaF9vREpOQXgyRlBnVWNKVXdNLW02QWh1N3d2aVprQjUxMD1zOTYtYyIsImZhbWlseV9uYW1lIjoicGF2YW5pIiwiaWF0IjoxNzg1ODQxOTYyLCJleHAiOjE3ODg0MzM5NjJ9.sZZYcsRQGbvv2hRAPZDnKtFvsu3YKRvT8v-y6DQPxF0";

try {
  jwt.verify(token, authJwtSecret);
  console.log("SUCCESSFULLY VERIFIED WITH AUTH_JWT_SECRET!");
} catch (e) {
  console.log("FAILED WITH AUTH_JWT_SECRET:", e.message);
}

try {
  jwt.verify(token, jwtSecret);
  console.log("SUCCESSFULLY VERIFIED WITH JWT_SECRET!");
} catch (e) {
  console.log("FAILED WITH JWT_SECRET:", e.message);
}
