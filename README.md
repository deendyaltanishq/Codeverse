# Codeverse

Codeverse is a simple real-time collaborative code editor. It allows multiple users to join a shared room, write and edit code together, switch programming languages, and run the code instantly. The app uses WebSockets for live updates and integrates with the Piston API to execute programs.

## Features
- Join or create a coding room with a unique ID  
- See who else is in the room in real time  
- Collaborative editing powered by Monaco Editor  
- Typing indicators for better coordination  
- Supports C++, Java, Python, and JavaScript  
- Run code directly from the editor and view output  

## Tech Stack
- **Frontend**: React, Monaco Editor, Socket.IO Client  
- **Backend**: Node.js, Express, Socket.IO, Axios  
- **Execution**: Piston API