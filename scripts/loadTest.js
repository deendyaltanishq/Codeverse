import { io } from "socket.io-client";
import { faker } from "@faker-js/faker";

const SERVER_URL = "https://codeverse-21r5.onrender.com";
const ROOM_ID = "stress-room";
const USER_STEP = 10;  
const MAX_ATTEMPT = 1000;

let connectedUsers = 0;
let failedConnections = 0;
let liveConnections = new Map();
let totalAttempts = 0;

let totalEventsSent = 0;

const connectBatch = (count) => {
  for (let i = 0; i < count; i++) {
    totalAttempts++;
    const userNum = totalAttempts;
    const userName = faker.person.firstName() + Math.floor(Math.random() * 1000);
    const socket = io(SERVER_URL, { transports: ["websocket"], reconnection: false, timeout: 5000 });

    socket.on("connect", () => {
      connectedUsers++;
      liveConnections.set(socket.id, socket);

      const interval = setInterval(() => {
        totalEventsSent++;
        socket.emit("codeChange", {
          roomId: ROOM_ID,
          code: `User ${userNum} dummy code at ${new Date().toISOString()}`,
        });
      }, 500 + Math.random() * 500);

      socket.on("disconnect", () => clearInterval(interval));
    });

    socket.on("connect_error", () => {
      failedConnections++;
    });
  }
};

const interval = setInterval(() => {
  if (totalAttempts >= MAX_ATTEMPT) {
    clearInterval(interval);
    finishTest();
    return;
  }
  connectBatch(USER_STEP);
}, 500);

const finishTest = () => {
  setTimeout(() => {
    const testDurationSeconds = 60;
    const eventsPerSecond = (totalEventsSent / testDurationSeconds).toFixed(2);

    console.log(`Max attempted users: ${MAX_ATTEMPT}`);
    console.log(`Successfully connected users: ${connectedUsers}`);
    console.log(`Failed connections: ${failedConnections}`);
    console.log(`Total live connections: ${liveConnections.size}`);
    console.log(`Total codeChange events sent: ${totalEventsSent}`);
    console.log(`Average events per second: ${eventsPerSecond}`);

    liveConnections.forEach(socket => socket.disconnect());
    process.exit();
  }, 10000);
};
