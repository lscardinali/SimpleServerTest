const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: {
    origin: ["https://launch.playcanvas.com", "https://playcanv.as", "http://127.0.0.1:8000", "http://127.0.0.1:8000"],
    methods: ["GET", "POST"]
  }
});

const events = {
  CONNECTION: "connection",
  PLAYER_DATA: "playerData",
  PLAYER_JOINED: "playerJoined",
  CAUSE_DAMAGE: "causeDamage",
  POSITION_UPDATE: "positionUpdate",
  DISCONNECT: "disconnect",
  PLAYER_DISCONNECTED: "playerDisconnected",
  PLAYER_KILL: "playerKill"
};

let players = {};

function Player(id) {
  this.id = id;
  this.pos = { x: 0, y: 0, z: 0 };
  this.rot = { x: 0, y: 0, z: 0 };
  this.souls = 0;
  this.level = 1;
  this.entity = null;
  this.score = 0;
  this.health = 100;
}

io.sockets.on(events.CONNECTION, function(socket) {
  log("Client Connected");
  
  const initialize = () => {
    const id = socket.id;
    const newPlayer = new Player(id);

    players[id] = newPlayer;
    socket.emit(events.PLAYER_DATA, { id: id, players: players });

    socket.broadcast.emit(events.PLAYER_JOINED, newPlayer);

   // console.log("Online Players: " + players.Keys().length);
  };

  // When a new player joins
  socket.on("initialize", initialize);

  

  socket.on(events.CAUSE_DAMAGE, function(data) {
    /*
    socket
      .to(data.playerId)
      .emit("updateHealth", players[data.playerId].health);
      */
     if(players[data.playerId]) {
    players[data.playerId].health -= data.amount;

    console.log("Took " + data.amount);
    
    if (players[data.playerId].health <= 0) {
      io.emit("frag", { fragged: data.playerId, fragger: data.causer });
      players[data.playerId].health = 100;
      players[data.causer].score += 1;
      socket.broadcast.emit("updatedScore", players);
      socket.broadcast.emit("respawnPlayer", data.playerId);
      socket
        .to(data.playerId)
        .emit("updateHealth", players[data.playerId].health);
    }
  }
  });

  socket.on(events.POSITION_UPDATE, function(data) {
    if(players[data.id]) {
    players[data.id].rot = data.rot;
    players[data.id].pos = data.pos;
    socket.broadcast.emit("playerMoved", data);
  }
  });

  socket.on("disconnect", function() {
    console.log("Got disconnect!");
    console.log("players: " + playerCount);
  });
  

  //socket.on(events.DISCONNECT, disconnectPlayer);
});

const disconnectPlayer = socket => {
  console.log(`${socket.id} disconnected`);
  delete players[socket.id];
  socket.broadcast.emit(events.PLAYER_DISCONNECTED, socket.id);
};

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

log("Noth Server Started!");
server.listen(3000);
