var io = require('socket.io')(process.env.PORT || 8080)

var room = 0

io.sockets.on('connection', function(socket){
  // leaves auto generated room that a socket automatically connects to
  socket.leave(socket.rooms)
  socket.on('join:room', function(room){
    if (rH.joinRoom(room, socket)){
      rH.syncGame(room, socket)      
    }
  })
  socket.on('host:room', function(data){
    rH.hostRoom(data, socket)
    rH.initializeGame(data)
  })
  socket.on('get:room', function(){
    var rooms = socket.rooms
    socket.emit('get:room', rooms)
  })
  socket.on("send:message:room",function(data){
    io.sockets.in(data.room).emit('send:message:room', data.message)  
  })
  socket.on('disconnect', function(){
    var room = socket.room
    rH.leaveRoom(room, socket)
  })
  socket.on('send:update:room', function(data){
    var room = socket.rooms[0]
    io.sockets.in(room).emit('update:room', data)
  })
  socket.on('attempt:set', function(){
    var room = socket.rooms[0]
    if (rH.rooms[room].free){
      rH.rooms[room].free = false
      var data = {}
      data.currentPlayer = socket.playerId
      socket.emit('attempt:set', data)
      io.sockets.in(room).emit('lock:players')
    }
    
  })
  socket.on('update:timer', function(data){
    var room = socket.rooms[0]
    io.sockets.in(room).emit('update:timer', data)
  })
  socket.on('subUpdate:timer', function(timer){
    var room = socket.rooms[0]
    io.sockets.in(room).emit('subUpdate:timer', timer)
  })
  socket.on('reset:timers', function(data){
    var room = socket.rooms[0]
    rH.rooms[room].free = true
    io.sockets.in(room).emit('reset:timers', data)
  })
  socket.on('update:points', function(data){
    var room = socket.rooms[0]
    io.sockets.in(room).emit('update:points', data)
  })
  socket.on('select:card', function(index){
    var room = socket.rooms[0]
    socket.broadcast.to(room).emit('select:card', index)
  })
  socket.on('update:board', function(data){
    var room = socket.rooms[0]
    socket.broadcast.to(room).emit('update:board', data)
  })
})


rH = {
  rooms: {},
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
      cRoom.players[cRoom.count].active = true
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
      rH.rooms[data.room] = data.game
      rH.rooms[data.room].count = 0
      rH.rooms[data.room].players[0].active = true
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