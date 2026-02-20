const { createApp } = require('./app');
const { connectDb } = require('./config/db');
const { env } = require('./config/env');

async function start() {
  await connectDb(env.mongodbUri);

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
