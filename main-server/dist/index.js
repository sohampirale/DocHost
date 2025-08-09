import express from "express";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import path from 'path';
import pty from "node-pty";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server);
import { exec } from "child_process";
import { stdout } from "process";
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/public', 'index.html'));
});
io.on('connection', (socket) => {
    const { role, username } = socket.handshake.query;
    if (role === "backend") {
        console.log("A backend got connected adding it to room1");
        socket.join("room1");
        // socket.on("backend",(msg)=>{
        //   console.log('msg received from backend device : ',msg)
        // })
        // socket.on("start-command",(response:string)=>{
        //   console.log('response of start command from backend is : ',response);
        // })
        // socket.on('exec-cmd',(response)=>{
        //   console.log('response after execurting cmd : ',response);
        //   socket.to("room1").emit("client",response)
        // })
        socket.on('client', (response) => {
            console.log('response after execurting cmd : ', response);
            socket.to("room1").emit("client", response);
        });
    }
    else if (role === "client") {
        console.log("A client got connected adding to room1 username : ", username);
        socket.join("room1");
        // socket.on('client',(msg)=>{
        //   console.log("msg receievd from client : ",msg)
        //   console.log('sending it to backend');
        //   socket.to("room1").emit("backend",msg)
        // })
        socket.on("start-container", (command) => {
            console.log('start command receievd from client is : ', command);
            console.log('passing it to the backend');
            socket.to("room1").emit("start-container", command);
        });
        socket.on('resume-container', (name) => {
            console.log('---------Resume container request received at main server-----');
            console.log('name of the container : ', name);
            socket.to('room1').emit('resume-container', name);
        });
        // socket.on("start-terminal",()=>{
        //   console.log('----------start terminal request receievd from client---------')
        //   console.log('passing it to the backend');
        //   const data={
        //     username
        //   }
        //   socket.to("room1").emit("start-terminal",JSON.stringify(data))
        // })
        socket.on("exec-cmd", (cmd) => {
            console.log('----------execute command request receievd from client---------');
            console.log('passing it to the backend');
            socket.to("room1").emit("exec-cmd", cmd);
        });
    }
    else {
        console.log('invalid role : ', role);
    }
    socket.on('disconnect', () => {
        if (role === "backend") {
            console.log("backend disconnected");
        }
        else if (role === "client") {
            console.log("client disconnected");
        }
        else {
            console.log('invalid role disconnected : ', role);
        }
    });
});
server.listen(3000, () => {
    console.log('✅ Server listening on http://localhost:3000');
});
// exec(`docker exec ${containerId} ${command}`, (error, stdout, stderr) => {
//   if (error) {
//     console.log('error : ', error);
//     return;
//   }
//   if (stderr) {
//     console.log('stderror : ', stderr);
//     return;
//   }
//   console.log('output : ', stdout);
//   const result = {
//     result: stdout
//   }
//   socket.emit("start-command", JSON.stringify(result))
// });
//# sourceMappingURL=index.js.map