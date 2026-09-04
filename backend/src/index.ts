import { createApp } from "./app";
import { env } from "./config/env";
import { startCronJobs } from "./jobs/reminderCron";

const app = createApp();

app.listen(env.port, () => {
  console.log(`✅  الخادم يعمل على المنفذ ${env.port}`);
  console.log(`   http://localhost:${env.port}/health`);
  startCronJobs();
});
