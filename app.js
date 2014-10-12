var io = require('socket.io')(process.env.PORT || 8080)

io.sockets.on('connection', function(socket){
  // leaves auto generated room that a socket automatically connects to
  socket.emit('get:username')
  socket.on('recieve:username', recieveUsername)
  socket.on('make:match', makeMatch)
  socket.leave(socket.rooms)
  socket.on('join:room', joinRoom)
  socket.on('host:room', hostRoom)
  socket.on('attempt:set', attemptSet)
  socket.on('update:timer', updateTimer) 
  socket.on('subUpdate:timer', subUpdateTimer)
  socket.on('reset:timers', resetTimers)
  socket.on('update:points', updatePoints)
  socket.on('select:card', selectCard)
  socket.on('update:board', updateBoard)

  socket.on('androidPing', androidPing)

  function androidPing(message){
    socket.emit('returnPing', message+" of goo")
  }


  socket.on('disconnect', disconnect)
  function recieveUsername(username){
    socket.username = username
  }
  function makeMatch(){
    rH.enterWaiting(socket.id)
    if (!rH.atBat){
      rH.enterAtBat()
    }
    var pairData = rH.findPair()
    if (pairData){
      io.to(pairData.host).emit('pre:host:room', pairData)    
    }
  }
  function joinRoom(room){
    if (rH.joinRoom(room, socket)){
      rH.syncGame(room, socket)      
    }
  }
  function hostRoom(data){
    rH.hostRoom(data, socket)
    rH.initializeGame(data)
    io.to(data.guest).emit('pre:join:room', data.room)    
  }
  function attemptSet(){
    var room = socket.rooms[0]
    if (rH.rooms[room].free){
      rH.rooms[room].free = false
      var data = {}
      data.currentPlayer = socket.playerId
      socket.emit('attempt:set', data)
      io.sockets.in(room).emit('lock:players')
    }
  }
  function selectCard(index){
    var room = socket.rooms[0]
    socket.broadcast.to(room).emit('select:card', index)
  }
  function updateTimer(data){
    var room = socket.rooms[0]
    io.sockets.in(room).emit('update:timer', data)
  }
  function subUpdateTimer(timer){
    var room = socket.rooms[0]
    io.sockets.in(room).emit('subUpdate:timer', timer)
  }
  function updatePoints(data){
    var room = socket.rooms[0]
    rH.rooms[room].players[socket.playerId].points = data.points
    io.sockets.in(room).emit('update:points', data)
  }
  function updateBoard(data){
    var room = socket.rooms[0]
    socket.broadcast.to(room).emit('update:board', data)
  }
  function resetTimers(data){
    var room = socket.rooms[0]
    rH.rooms[room].free = true
    io.sockets.in(room).emit('reset:timers', data)
  }
  function disconnect(){
    var sroom = socket.room
    var pID = socket.playerId
    var roomNames = Object.keys(rH.rooms)
    if (inArray(sroom, roomNames)){
      rH.rooms[sroom].players[pID].active = false
    rH.rooms[sroom].players[pID].points = 0
    io.sockets.in(sroom).emit('room:left', rH.rooms[sroom])
    rH.leaveRoom(sroom, socket)
    }    
  }
})



rH = {
  rooms: {},
  atBat: false,
  waiting: [],
  enterWaiting: function(socketId){
    rH.waiting.push(socketId)
  },
  enterAtBat: function(){
    rH.atBat = rH.waiting.shift()
  },
  findPair: function(){
    if (rH.atBat && (rH.waiting.length >= 1)) {
      var data = {
        host: rH.atBat,
        guest: rH.waiting.shift()
      }
      rH.atBat = false
      return data
    } else {
      return false
    }
  },
  joinRoom: function(room, socket){
    var roomNames = Object.keys(rH.rooms)
    if (!inArray(room, roomNames)){
      socket.emit('join:room:error', room)
      return false
    } else if (rH.rooms[room].count >= 3){ 
      socket.emit('join:room:error', room)
      return false
    } else {
      var cRoom = rH.rooms[room]
      cRoom.count++
      cRoom.players[1].active = true
      cRoom.players[1].name = socket.username
      socket.room = room
      socket.playerId = cRoom.count
      socket.join(room)
      io.sockets.in(room).emit('room:joined', cRoom)
      return true
    }
  },
  hostRoom: function(data, socket){
    var roomNames = Object.keys(rH.rooms)
    if (inArray(data.room, roomNames)){
      return socket.emit('host:room:error', data.room)
    } else {
      //
      rH.rooms[data.room] = data.game
      rH.rooms[data.room].count = 0
      rH.rooms[data.room].players[0].active = true
      rH.rooms[data.room].players[0].name = socket.username
      socket.playerId = 0
      socket.room = data.room
      socket.join(data.room)
      socket.emit('room:hosted', rH.rooms[data.room])
    }
  },
  leaveRoom: function(room, socket){
    var roomNames =Object.keys(rH.rooms)
    if (inArray(room, roomNames)){
      rH.rooms[room].count--
      if (rH.rooms[room].count < 0){
        delete rH.rooms[room]
      }
    }
    socket.leave(socket.rooms)
  },
  initializeGame: function(data){
    rH.rooms[data.room] = data.game
    rH.rooms[data.room].free = true
  },
  syncGame: function(room, socket){
    socket.emit('sync:game', rH.rooms[room])
  }
}

function inArray(element, array){
  for (i=0; i<array.length; i++){
    if (array[i] == element){
      return true
    }
  }
  return false
}