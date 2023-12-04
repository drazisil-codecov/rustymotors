import { Server } from "node:http";
import {
  gameServer,
  loginServer,
  mcotsServer,
  profileServer,
  webServer,
} from "./src/index.js";

let webServerProcess: Server;

let running = false;

/**
 * Start the servers
 */
function startServers() {
  /**
   * Start an express server on ports 80 and 3000
   */
  webServerProcess = webServer.listen(3000, () =>
    console.log("Listening on port 3000")
  );

  /**
   * Start a TCP server that listens on port 8226
   */
  loginServer.listen(8226, () => console.log("Listening on port 8226"));
  profileServer.listen(8227, () => console.log("Listening on port 8227"));
  gameServer.listen(8228, () => console.log("Listening on port 8228"));
  mcotsServer.listen(43300, () => console.log("Listening on port 43300"));

  console.log("Servers started");
}

/**
 * Stop the servers
 */
function stopServers() {
  console.log("Stopping servers");
  console.log("Stopping web server");
  webServerProcess.close();
  console.log("Stopping login server");
  loginServer.close();
  console.log("Stopping profile server");
  profileServer.close();
  console.log("Stopping game server");
  gameServer.close();
  console.log("Stopping mcots server");
  mcotsServer.close();

  console.log("Servers stopped");
  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.stdin.removeAllListeners();
}

/**
 * Handle keypresses
 */
function handleKeypress(keypress: Buffer) {
  // If x is pressed, stop the servers
  if (keypress[0] === 120) {
    running = false;
    stopServers();
  }
}

/**
 * Main program
 */
startServers();
running = true;

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.on("data", (keypress) => {
    // If this is a CTRL+C keypress, send SIGINT to the process
    if (keypress[0] === 3) {
      process.kill(process.pid, "SIGINT");
    }

    // Handle the keypress
    handleKeypress(keypress);
  });
}

/**
 * The main loop
 */
while (running) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

console.log("Program ended");
