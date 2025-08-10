import dotenv from "dotenv"
dotenv.config();

import express from "express"
import http from "http"
import { Server } from "socket.io"
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from "./lib/connectDB.js";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
})

import cors from "cors"
import cookie from "cookie"

//routers
import userRouter from "./routes/user.routes.js";
import { verifyInstanceAccessToken, verifyUserAccessToken } from "./helpers/verifyToken.js";
import ApiError from "./helpers/ApiError.js";
import instanceRouter from "./routes/instance.routes.js";
import { roomNameGenerator } from "./helpers/randomRoomNameGenerator.js";
import { getAllInstancesOfUserWithId, getUserWithId } from "./services/user.services.js";

connectDB().then(() => {
  server.listen(3000, () => {
    console.log('✅ Server listening on http://localhost:3000');
  });
}).catch((err) => {
  console.log('Failed to connectDB temrinating process gracefully');
  process.exit(1)
})

const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

const activeUsers: Map<string, any> = new Map();
const activeInstances: Map<string, any> = new Map();
const activeRooms: Map<string, any> = new Map();

const userIdToSocketId:Map<string,string>=new Map();
const instanceIdToSocketId:Map<string,string>=new Map();
let allInstances:any=[];

app.use(express.json());

app.use("/user", userRouter)
app.use('/instance', instanceRouter)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/public', 'index.html'));
});

io.use((socket, next) => {
  console.log('inside socket/io middleware');
  
  const role = socket.handshake.query.role;

  try {
    if (role == 'client') {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        console.log('Client needs to signin first');
        return next(new Error("No auth token found"))
      }
      const cookies = cookie.parse(cookieHeader)
      const accessToken = cookies.accessToken;
      if(!accessToken){
        return next(new Error("accessToken not found"))
      }

      console.log('accessToken : ', accessToken);
      const userInfo = verifyUserAccessToken(accessToken)
      const _id=userInfo._id;
      if(userIdToSocketId.has(_id)){
        const sid=userIdToSocketId.get(_id);
        if(activeUsers.has(sid)){
          activeUsers.get(sid).socket.disconnect()
          activeUsers.delete(sid)
        }
        userIdToSocketId.delete(_id)
      }

      console.log('client conncted');
      activeUsers.set(socket.id,{
        socket,
        room:undefined,
        userInfo
      })
      userIdToSocketId.set(userInfo._id,socket.id)
      printActiveUsers()
      
    } else if (role == "backend") {
      const DOCKHOST_API_KEY = socket.handshake.auth.DOCKHOST_API_KEY;
      console.log('Backend connected : API_KEY : ', DOCKHOST_API_KEY);
      const instanceInfo = verifyInstanceAccessToken(DOCKHOST_API_KEY)
      const _id=instanceInfo._id;
      console.log('_id of instance : ',_id);

      //:TODO disconnect another temirnlan if with same insatcneId if active
      //:TODO push into the allInstances array only if does not exists there

      allInstances.push({
        _id,
        username:instanceInfo.username
      })

      io.emit("all-instances",allInstances)

      activeInstances.set(socket.id,{
        socket,
        instanceInfo,
        rooms:[]
      })

      instanceIdToSocketId.set(instanceInfo._id,socket.id)

      printActiveInstances()
    } else if (!role) {
      console.log('No role found');
      next(new Error("Invalid query param"))
    }
    next()
  } catch (error) {
    if(error instanceof Error){
      return next(error)
    }
    next(new Error("Something went wrong"))
    return;
  }
});

io.on('connection', (socket) => {
  console.log('socket connected successfully!');

  const role=socket.handshake.query.role;
  if(role=='client'){
    socket.emit("all-instances",allInstances)

    const _id=activeUsers.get(socket.id).userInfo._id;

    getAllInstancesOfUserWithId(_id).then((allMyInstances)=>{
      socket.emit('all-my-instances',allMyInstances)
    });

    socket.on("start-container",async(data:{instanceId:string})=>{
      
      const instanceId=data.instanceId;
      const instanceSID=instanceIdToSocketId.get(instanceId)

      if(!instanceSID || !activeInstances.has(instanceSID)){
        console.log('Requested instance is not online at the moment');
        return;
      }      

      const user=activeUsers.get(socket.id)
      
      const userDB=await getUserWithId(user.userInfo._id)

      if(!userDB){
        console.log('user does not exists in the DB');
        return;
      }

      const instance = activeInstances.get(instanceSID)

      // const roomName=roomNameGenerator(instance.instanceInfo.username,user.userInfo.username)
      const roomName=user.userInfo.username;

      if(activeRooms.has(roomName)){
        const existingConnectedInstanceSID=activeRooms.get(roomName)?.instanceSID;
        const existingInstanceSocket = activeInstances.get(existingConnectedInstanceSID)?.socket
        //sending notificaiton to existing instances socket to temrinate that container/terminal
        existingInstanceSocket.leave(roomName)
        console.log('removed old instance socket from room : ',roomName);
      }

      console.log('adding ',user.userInfo.username,' to room : ',roomName);

      user.socket.join(roomName)
      instance.socket.join(roomName)

      activeRooms.set(roomName,{
        clientSID:socket.id,
        instanceSID:instanceSID
      })

      console.log('added client : ',user.userInfo.username,' to room : ',roomName);
      console.log('added backend : ',instance.instanceInfo.username,' to room : ',roomName);      

      const userInstances=userDB.instances;

      if(userInstances.includes(new mongoose.Types.ObjectId(instanceId))){
        console.log('User already has one container in this instance');
        socket.to(user.userInfo.username).emit("resume-container",{
          username:user.userInfo.username,
          roomName
        })
        //resume-instance request this is
        return
      }

      userDB.instances.push(new mongoose.Types.ObjectId(instanceId));

      await userDB.save()

      socket.to(roomName).emit("start-container",{
        username:user.userInfo.username,
        roomName
      })
    })

    socket.on("resume-container",async(data:{instanceId:string})=>{
      console.log('inside resume-container');
      
      const instanceId=data.instanceId;
      if(!instanceId){
        socket.emit("client-notification",'instanceId not mentioned in the request')
        return;
      }

      const instanceSID=instanceIdToSocketId.get(instanceId)

      if(!instanceSID || !activeInstances.has(instanceSID)){
        socket.emit("client-notification",'Requested instance is not currently active')
        return;
      }

      const user=activeUsers.get(socket.id);

      const userDB=await getUserWithId(user.userInfo._id)

      if(!userDB){
        socket.emit("client-notification",'User no longer exist in the DB')
        return;
      }

      const roomName=user.userInfo.username;
      if(activeRooms.has(roomName)){
        const existingConnectedInstanceSID=activeRooms.get(roomName).instanceSID
        const existingInstanceSocket=activeInstances.get(existingConnectedInstanceSID)?.socket;
        existingInstanceSocket.leave(roomName)
        console.log('Removed existing instance from room : ',roomName);
      }

      const instance=activeInstances.get(instanceSID)?.socket

      console.log('adding ',user.userInfo.username,' to room : ',roomName);
      socket.join(roomName)
      instance.join(roomName)

      activeRooms.set(roomName,{
        clientSID:socket.id,
        instanceSID:instanceSID
      })

      const userInstances=userDB.instances;

      if(!userInstances.includes(new mongoose.Types.ObjectId(instanceId))){
        userDB.instances.push(new mongoose.Types.ObjectId(instanceId))
        await userDB.save()
        //start-container
        socket.to(roomName).emit('start-container',{
          username:user.userInfo.username,
          roomName
        })
        return;
      }

      socket.to(roomName).emit('resume-container',{
        username:user.userInfo.username,
        roomName
      })
    })

    //exec-cmd
    /**
     * 1.get command from user
     * 2.check if instance is online and find out roomName form userInfo
     * 3.send that command to socket.to(roomName).emit("exec-cmd")
     */

    socket.on("exec-cmd",(data:{command:string})=>{
      console.log('inside exec-cmd');
      
      const {command} = data;
      if(!command){
        socket.emit("client-notification",'field command is not provided to execute the command')
        return;
      }

      const user=activeUsers.get(socket.id)
      const roomName=user?.userInfo?.username;

      const room=activeRooms.get(roomName)
      console.log('room : ',room);
      
      if(!room){
        socket.emit('client-notification','You are not coonected with any instance so you cannot execute any command')
        return;
      }
      
      const instanceSID=room.instanceSID;
      if(!activeInstances.has(instanceSID)){
        socket.emit('client-notification','Instance is not active at the moment')
        return;
      }

      console.log('emitting to roomName : ',roomName);
      
      socket.to(roomName).emit('exec-cmd',{
        username:user.userInfo.username,
        command
      })
    })

  } else if(role=='backend'){

    // socket.removeAllListeners("client-notification");
    socket.on("client-notification",(data:{roomName:string,notification:string})=>{
      console.log('inside client-notification main server')
      const roomName=data.roomName
      socket.to(roomName).emit('client-notification',data.notification)
    })

    // socket.removeAllListeners("client-output");
    socket.on("client-output",(data:{roomName:string,output:string})=>{
      console.log('inside client-output main server');
      
      const roomName=data.roomName;
      socket.to(roomName).emit("client-output",data.output)
    })

  }

  socket.on('disconnect', () => {
    console.log('socket disconnected');
    const role=socket.handshake.query.role;
    if(role=='client'){
      console.log('client disconnected')
      if(activeUsers.has(socket.id)){
        const userInfo=activeUsers.get(socket.id).userInfo
        const _id=userInfo._id
        console.log(userInfo.username,' removed from active users');
        if(userIdToSocketId.has(_id)){
          userIdToSocketId.delete(_id)
        }
        activeUsers.delete(socket.id)
      }
    } else if(role=='backend'){
      if(activeInstances.has(socket.id)){
        const instanceInfo=activeInstances.get(socket.id).instanceInfo
        const _id=instanceInfo._id;
        const index=allInstances.findIndex(obj=>obj._id===_id)
        if(index!=-1){
          allInstances.splice(index,1)
          io.emit("all-instances",allInstances)
        }
        console.log(instanceInfo.username,' removed from active instances');
        if(instanceIdToSocketId.has(_id)){
          instanceIdToSocketId.delete(_id)
        }
        activeUsers.delete(socket.id)
      }
    }
  });

});


















function printActiveUsers(){
  console.log('-----------ACTIVE-USERS------------------');
  console.log(activeUsers);
  console.log('-----------userIdToSocketId------------------');
  console.log(userIdToSocketId);
}

function printActiveInstances(){
  console.log('-----------ACTIVE-INSTANCES--------------');
  console.log(activeInstances);
  console.log('-----------instanceIdToSocketId------------------');
  console.log(instanceIdToSocketId);
}

// setInterval(()=>{
//   console.log('-----------ACTIVE-USERS------------------');
//   console.log(activeUsers);
// },5000)

/*
  if(role==="backend"){

    console.log("A backend got connected adding it to room1")

    socket.join("room1")
    
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

    socket.on('client',(response)=>{
      console.log('response after execurting cmd : ',response);
      socket.to("room1").emit("client",response)
    })

  } else  if(role==="client"){

    console.log("A client got connected adding to room1 username : ",username)
    socket.join("room1")

    // socket.on('client',(msg)=>{
    //   console.log("msg receievd from client : ",msg)
    //   console.log('sending it to backend');
    //   socket.to("room1").emit("backend",msg)
    // })

    socket.on("start-container",(command)=>{
      console.log('start command receievd from client is : ',command)
      console.log('passing it to the backend');
      socket.to("room1").emit("start-container",command)
    })

    socket.on('resume-container',(name)=>{
      console.log('---------Resume container request received at main server-----');
      console.log('name of the container : ',name);
      socket.to('room1').emit('resume-container',name)
    })

    // socket.on("start-terminal",()=>{
    //   console.log('----------start terminal request receievd from client---------')
    //   console.log('passing it to the backend');
    //   const data={
    //     username
    //   }
    //   socket.to("room1").emit("start-terminal",JSON.stringify(data))
    // })

    socket.on("exec-cmd",(cmd)=>{
      console.log('----------execute command request receievd from client---------')
      console.log('passing it to the backend');
      socket.to("room1").emit("exec-cmd",cmd)
    })
    
  } else {
    console.log('invalid role : ',role);
  }*/