import { io as Client } from "socket.io-client";
import { Server } from "socket.io";
import http from "http";
import express from "express";

let io, server, addr;

beforeAll((done) => {
  const app = express();
  server = http.createServer(app);
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("join", ({ roomId, userName }) => {
      socket.join(roomId);
      io.to(roomId).emit("userJoined", [userName]);
    });

    socket.on("codeChange", ({ roomId, code }) => {
      socket.to(roomId).emit("codeUpdate", code);
    });
  });

  server.listen(() => {
    addr = `http://localhost:${server.address().port}`;
    done();
  });
});

afterAll(() => {
  io.close();
  server.close();
});

test("user can join a room", (done) => {
  const client = Client(addr);

  client.on("connect", () => {
    client.emit("join", { roomId: "room1", userName: "Alice" });
  });

  client.on("userJoined", (users) => {
    expect(users).toContain("Alice");
    client.close();
    done();
  });
});

test("code change is broadcast to others", (done) => {
  const client1 = Client(addr);
  const client2 = Client(addr);

  let ready = 0;
  const checkReady = () => {
    if (ready++ === 2) {
      client1.emit("codeChange", { roomId: "room2", code: "print('hi')" });
    }
  };

  client1.on("connect", () => {
    client1.emit("join", { roomId: "room2", userName: "Alice" });
    checkReady();
  });

  client2.on("connect", () => {
    client2.emit("join", { roomId: "room2", userName: "Bob" });
    checkReady();
  });

  client2.on("codeUpdate", (code) => {
    expect(code).toBe("print('hi')");
    client1.close();
    client2.close();
    done();
  });
});
