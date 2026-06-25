require("dotenv").config();
const fs = require("fs");

// TLS options for managed PostgreSQL (Aiven) used by sequelize-cli migrations.
//   DB_SSL=true        → encrypt.
//   DB_CA_CERT=<path>  → STRICT verification against that CA (production-correct).
//   (no CA cert)       → fall back to REJECT_UNAUTHORIZED (encrypt-without-verify, dev).
function dbSslOptions() {
  if (process.env.DB_SSL !== "true") return false;
  if (process.env.DB_CA_CERT) {
    return {
      require: true,
      rejectUnauthorized: true,
      ca: fs.readFileSync(process.env.DB_CA_CERT, "utf8"),
    };
  }
  return {
    require: true,
    rejectUnauthorized: process.env.REJECT_UNAUTHORIZED === "true",
  };
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    schema: "verifywise",
    migrationStorageTableSchema: "verifywise",
    ...(process.env.DB_SSL === "true"
      ? { dialectOptions: { ssl: dbSslOptions() } }
      : {}),
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    schema: "verifywise",
    migrationStorageTableSchema: "verifywise",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    schema: "verifywise",
    migrationStorageTableSchema: "verifywise",
    ...(process.env.DB_SSL === "true"
      ? { dialectOptions: { ssl: dbSslOptions() } }
      : { dialectOptions: { ssl: false } }),
  },
};
