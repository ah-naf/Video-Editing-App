const cluster = require("cluster");
const os = require("os");
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Replace the dead worker
  });
} else {
  require("./index"); // Worker processes
  console.log(`Worker ${process.pid} started`);
}
