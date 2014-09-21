var io = require('socket.io')(process.env.PORT || 8080)

var room = 0

io.sockets.on('connection', function(socket){
  // leaves auto generated room that a socket automatically connects to
  socket.leave(socket.rooms)
  socket.on('join:room', function(room){
    socket.join(room)
  })
  socket.on('host:room', function(room){
    rH.hostRoom(room)
  })
  socket.on('get:room', function(){
    var rooms = socket.rooms
    socket.emit('get:room', rooms)
  })
  socket.on("send:message:room",function(data){
    io.sockets.in(data.room).emit('send:message:room', data.message)
  })
  socket.on('disconnect', function(){
    room = socket.rooms[0]
    rH.leaveRoom(room)
  })

})


rH = {
  rooms: {},
  joinRoom: function(room){
    var roomNames = Object.keys(rH.rooms)
    if ($.inArray(room, roomNames) == 0){
      return socket.emit('join:room:error')
    } else {
      rH.rooms[room]+=1
      socket.join(room)
    }
  },
  hostRoom: function(room){
    // if the room is in the array of keys, stop
    var roomNames = Object.keys(rH.rooms)
    if ($.inArray(room, roomNames) != 0 ){
      return socket.emit('host:room:error')
    } else {
      rH.rooms[room] = 1
      socket.join(room)
    }
    checkRoomExistence(room)
  },
  leaveRoom: function(room){
    if ($.inArray(room, roomNames) != 0){
      rH.rooms[room]--
      if (rH.rooms[room] == 0){
        delete rH.rooms[room]
      }
    }
    socket.leave(socket.rooms)
  }
}

// host room vs join room.

// function Room(number){
//   this.name = "r"+number
//   this.roomNumber = number
//   this.inRoom = 0
//   this.add = function(){
//     if (this.inRoom <2){
//       this.inRoom++     
//     }
//   }
//   this.leave = function(){
//     this.inRoom--
//   }
// }

// rH = {
//   rooms: [],
//   num: 0,
//   getLowestUnoccupiedRoom: function(){
//     rooms = Object.keys(io.sockets.adapter.rooms)
//   },
//   clientsInRoom: function(room){
//     io.sockets.clients(room)
//   },
//   joinRoom: function(){
//     var newRoom = new Room(rH.num)
//     rH.rooms.push(newRoom)
//     newRoom.add()
//     rH.num+=1
//     return newRoom.name
//   },
//   leaveRoom: function(){
//     return 
//   }
// }

// worried about room numbers getting huge?

// assuming the server is always running -> joinRoomshould get all rooms w/ clients in it, and start from tehre.

// objective: give lowest possible room number available. 

// i can check if a key is in io.sockets.