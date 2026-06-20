import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const io = new Server(server, {
    cors:{
        origin: "*",
    },
});

const rooms = new Map();
io.on("connection", (socket)=>{
    console.log("user connected", socket.id);

    let currentRoom = null;
    let currentUser = null;

    socket.on("join", ({roomId, userName})=>{
        if(currentRoom){
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
        }

        currentRoom = roomId;
        currentUser = userName;
        socket.join(roomId);

        if(!rooms.has(roomId)){
            rooms.set(roomId, new Set());
        }

        rooms.get(roomId).add(userName);
        io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)))
    });

    socket.on("codeChange", ({roomId, code}) => {
        socket.to(roomId).emit("codeUpdate", code);
        socket.emit("code-update-ack", { receivedAt: new Date().toISOString() });
    });

    socket.on("leaveRoom", ()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined",  Array.from(rooms.get(currentRoom)));
            socket.leave(currentRoom);
            currentRoom=null;
            currentUser=null;
        }
    });

    socket.on("typing", ({roomId, userName})=>{
        socket.to(roomId).emit("userTyping", userName);
    });

    socket.on("languageChange", ({roomId, language}) => {
        socket.to(roomId).emit("languageUpdate", language);
    });

 socket.on("compileCode", async ({code, roomId, language, version}) => {
    console.log("COMPILE BUTTON CLICKED");

    try {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);

            console.log("Calling Piston API...");

           const response = await axios.post(
  "https://judge029.p.rapidapi.com/submissions?base64_encoded=false&wait=true&fields=*",
  {
    source_code: code,
    language_id: 54,
    stdin: ""
  },
  {
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "judge029.p.rapidapi.com",
     "x-rapidapi-key": "YOUR_ACTUAL_RAPIDAPI_KEY"
    }
  }
);

            console.log("PISTON SUCCESS");
            console.log(response.data);

room.output = response.data.stdout;
            io.to(roomId).emit("codeResponse", response.data);
        }
    } catch (error) {
    console.log("PISTON ERROR:", error.message);
    console.log("PISTON RESPONSE:", error.response?.data);
}
});

    socket.on("disconnect", ()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined",  Array.from(rooms.get(currentRoom)));
        }
        console.log("User disconnected");
    })
});
server.listen(PORT, ()=>{
    console.log("server is working");
});


