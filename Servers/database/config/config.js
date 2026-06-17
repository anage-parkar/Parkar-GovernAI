require("dotenv").config();

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
    // TLS for managed PostgreSQL (Aiven). DB_SSL=true enables SSL for sequelize-cli
    // migrations; REJECT_UNAUTHORIZED=false skips CA verification (no ca.pem needed).
    ...(process.env.DB_SSL === "true"
      ? {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: process.env.REJECT_UNAUTHORIZED === "true",
            },
          },
        }
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
      ? {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: process.env.REJECT_UNAUTHORIZED === "true",
            },
          },
        }
      : {
          dialectOptions: {
            ssl: false,
          },
        }),
  },
};
