import dotenv from "dotenv"
dotenv.config();

import express from "express"
import http from "http"
import { Server } from "socket.io"
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from "./lib/connectDB.js";

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
import { verifyUserAccessToken } from "./lib/verifyToken.js";
import ApiError from "./helpers/ApiError.js";
import instanceRouter from "./routes/instance.routes.js";

connectDB().then(() => {
  server.listen(3000, () => {
    console.log('✅ Server listening on http://localhost:3000');
  });
}).catch((err) => {
  console.log('Failed to connectDB temrinating process gracefully');
  process.exit(1)
})

const allowedOrigin = "https://friendly-spork-wrvgj6vpp69rcgr99-3000.app.github.dev";

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

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
      console.log('accessToken : ', accessToken);
      //verify userAccessToken
      console.log('client connected');
    } else if (role == "backend") {
      const DOCKHOST_API_KEY = socket.handshake.auth.DOCKHOST_API_KEY;
      console.log('Backend connected API_KEY : ', DOCKHOST_API_KEY);
      //verify instanceAccessToken
    } else if (!role) {
      console.log('No role found');
      next(new Error("Invalid query param"))
    }
    next()
  } catch (error) {
    next(error)
  }
});


io.on('connection', (socket) => {
  console.log('socket connected successfully!');

  socket.on('disconnect', () => {
    console.log('socket disconnected');
  });

});

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