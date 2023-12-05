import express from "express";
import cors from "cors";
import router from "./routes.js";
import net from "node:net";
import { getConnectionIdForSocket } from "./connection.js";
import { parseDataWithConnection } from "./packet.js";

/**
 * Start an express server on ports 80 and 3000
 */
const webServer = express();
webServer.use(cors());
webServer.use(express.json());
webServer.use(router);

/**
 * Create TCP servers for login, profile, game, and mcots
 */
const loginServer = net.createServer();
const profileServer = net.createServer();
const gameServer = net.createServer();
const mcotsServer = net.createServer();

/**
 * All 3 servers have the same connection handler
 */
const connectionHandler = async (socket: net.Socket) => {
  console.log(`Connection from ${socket.remoteAddress}:${socket.remotePort}`);
  const { remoteAddress, remotePort } = socket;
  const connection = await getConnectionIdForSocket(
    remoteAddress ?? "unknownAddress",
    remotePort ?? -9999,
    socket
  );

  if (!connection) {
    console.error("Failed to create connection record");
    return;
  }

  console.log(`Connection ID: ${connection.id}`);

  socket.on("data", async (data) => {
    await parseDataWithConnection(data, connection);
  });
};

loginServer.on("connection", connectionHandler);
profileServer.on("connection", connectionHandler);
gameServer.on("connection", connectionHandler);
mcotsServer.on("connection", connectionHandler);

/**
 * Export all servers
 */
export { webServer, loginServer, profileServer, gameServer, mcotsServer };
