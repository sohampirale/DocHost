export function roomNameGenerator(instanceUsername:string,clientUsername:string){
  let roomName="room_";
  roomName+=instanceUsername??Math.random()
  roomName+="_"+(clientUsername??Math.random())
  return roomName
}