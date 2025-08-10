import dotenv from "dotenv"
dotenv.config()
import { io } from "socket.io-client"
import pty from "node-pty"

import fs from "fs";
import path from "path";

function folderExistsInDirectory(directoryPath: string, folderName: string) {
  const fullPath = path.join(directoryPath, folderName);
  return fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory();
}

function createFolderAtDirectory(directoryPath: string, folderName: string) {
  const fullPath = path.join(directoryPath, folderName);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`✅ Folder "${folderName}" created at "${directoryPath}"`);
}

const usersMap: Map<string, any> = new Map();


function start_container_cmd(username: string) {
  return `docket run -it --name ${username} ubuntu`
}

function resume_container_cmd(username:string){
  return `docker start -ai ${username}`
}

const socket = io(process.env.MAIN_SERVER_BACKEND_URL, {
  query: {
    role: "backend"
  },
  auth: {
    DOCKHOST_API_KEY: process.env.DOCKHOST_API_KEY
  },
});

socket.on("connect", () => {
  console.log("Connected to Main Server:", socket.id);

  const shell = "bash"

  socket.on('start-container', (data: { username: string, roomName: string }) => {

    if (!data.username) {
      console.log('username not found no starting container retunring...');
      return;
    }

    const args = start_container_cmd(data.username).split(" ")
    console.log('start container command at backend is : ', args);

    const terminal = pty.spawn(args[0], args.slice(1), {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: "/workspaces/DocHost",
      env: process.env
    })

    if(!terminal){
      socket.emit("client-notification", {
        roomName: data.roomName,
        notification:'Failed to start your container'
      })
      return;
    }else {
      socket.emit("client-notification", {
        roomName: data.roomName,
        notification:'Container started successfully'
      })
      if(usersMap.has(data.username)){
        usersMap.delete(data.username)
      }
      usersMap.set(data.username,{
        roomName:data.roomName,
        terminal
      })
    }

    terminal.on("data", (output: string) => {
      console.log('output reveieved from new terminal  is : ', output);
      if(!usersMap.has(data.username)){
        console.log('output receievd from terminla but user not found,returning...');
        return;
      }

      const roomName=usersMap.get(data.username).roomName

      socket.emit("client-output",{
        roomName,
        output
      })
    })

  })

  socket.on('resume-container', (data: { username: string, roomName: string }) => {
    if(!data.username){
      console.log('username not receievd to start container,returning...');
      return
    }

    const args = resume_container_cmd(data.username).split(" ")
    console.log('resume container command at backend is : ', args);

    const terminal = pty.spawn(args[0], args.slice(1), {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: "/workspaces/DocHost",
      env: process.env
    })

    if(!terminal){
      socket.emit("client-notification", {
        roomName: data.roomName,
        notification:'Failed to resume your container'
      })
      return;
    }else {
      socket.emit("client-notification", {
        roomName: data.roomName,
        notification:'Container resumed successfully'
      })

      if(usersMap.has(data.username)){
        usersMap.get(data.username).terminal.kill()
        usersMap.delete(data.username)
        console.log('deleted old terminal instance of the same user');
      }
      usersMap.set(data.username,{
        roomName:data.roomName,
        terminal
      })
    }

    terminal.on("data", (output: string) => {
      console.log('output reveieved from reseumed terminal is : ', output);

      socket.emit("client-output",{
        roomName:data.roomName,
        output
      })
    })
  
  })

  socket.on("exec-cmd",(data: { username: string, roomName: string ,command:string})=>{
    const username=data.username
    const command=data.command
    if(!username){
      console.log('username not provided,returning');
      return 
    } else if(!usersMap.has(username)){
      console.log('termianl not found for username : ',username,',returning...');
      return
    }

    const terminal=usersMap.get(username).terminal
    if(terminal){
      terminal.write(command+'\n')
    } else {
      console.log('terminal not found for username : ',username);
      socket.emit("client-notification","Terminal not found")
    }
  })

  socket.on("disconnect", () => {
    console.log('disconnected from main-server via WS');
    
    for(const[username:string,value:any]=>{
        if(value.terminal){
          value.terminal.kill()
          console.log('killed terminal of ',username)
        }
    })

    usersMap.clear()
  });
});
