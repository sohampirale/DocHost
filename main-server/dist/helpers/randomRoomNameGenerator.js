export function roomNameGenerator(instanceUsername, clientUsername) {
    let roomName = "room_";
    roomName += instanceUsername ?? Math.random();
    roomName += "_" + (clientUsername ?? Math.random());
    return roomName;
}
//# sourceMappingURL=randomRoomNameGenerator.js.map