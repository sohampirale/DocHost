import dotenv from "dotenv";
dotenv.config();
import { io } from "socket.io-client";
import pty from "node-pty";
import fs from "fs";
import path from "path";
function folderExistsInDirectory(directoryPath, folderName) {
    const fullPath = path.join(directoryPath, folderName);
    return fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory();
}
function createFolderAtDirectory(directoryPath, folderName) {
    const fullPath = path.join(directoryPath, folderName);
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Folder "${folderName}" created at "${directoryPath}"`);
}
let terminal;
const socket = io("https://congenial-dollop-wrvgj6vppj45cv45-3000.app.github.dev", {
    query: {
        role: "backend"
    },
    auth: {
        DOCKHOST_API_KEY: process.env.DOCKHOST_API_KEY
    },
});
socket.on("connect", () => {
    console.log("Connected to Main Server:", socket.id);
    socket.on("backend", (command) => {
        console.log("msg received from main-server is : ", command);
    });
    const shell = "bash";
    socket.on('start-container', (command) => {
        const args = command.split(" ");
        console.log('start command received at backend is : ', args);
        terminal = pty.spawn(args[0], args.slice(1), {
            name: "xterm-color",
            cols: 80,
            rows: 30,
            cwd: "/workspaces/DocHost",
            env: process.env
        });
        terminal.on("data", (data) => {
            console.log('data reveieved from terminal : ', data);
            socket.emit("client", data);
        });
    });
    socket.on('start-terminal', (data) => {
        // const jsonData=JSON.parse(data)
        // if(!jsonData.username){
        //   console.log('username not provided!!');
        //   socket.emit("")
        //   return;
        // }
        // console.log('start terminal request receievd at the backend  jsonData : ',jsonData);
        // if(folderExistsInDirectory("/workspaces/DocHost",jsonData.username)){
        //   console.log('folder exists');
        // } else {
        //   console.log('New user first time on this instance');
        //   createFolderAtDirectory('/workspaces/DocHost',jsonData.username)
        // }
        // terminal = pty.spawn("sudo", ["chroot", "/workspaces/DocHost/user1", "/bin/bash"], {
        //   name: "xterm-color",
        //   cols: 80,
        //   rows: 30,
        //   env: process.env
        // })
        // terminal.on("data", (data: string) => {
        //   console.log('data reveieved from terminal : ', data);
        //   socket.emit("client", data)
        // })
    });
    socket.on('exec-cmd', (cmd) => {
        if (cmd == 'stop') {
            if (terminal) {
                terminal.write('\x03'); // Sends SIGINT (Ctrl+C) to stop the running process
                return;
            }
        }
        console.log('cmd receievd at backend to execute : ', cmd);
        terminal.write(cmd + '\n');
    });
    socket.on('resume-container', (name) => {
        console.log('-------Resuem container request receievd at backend -----');
        console.log('name of the container : ', name);
        const shell = "docker";
        const args = ["start", "-ai", name];
        terminal = pty.spawn(shell, args, {
            name: "xterm-color",
            cols: 80,
            rows: 24,
            env: process.env,
        });
        terminal.on("data", (data) => {
            console.log('on data 1' + data);
            socket.emit("client", data);
        });
    });
    socket.on("disconnect", () => {
        console.log('disconnected from main-server via WS');
        if (terminal)
            terminal.kill();
    });
});
//# sourceMappingURL=backend.js.map