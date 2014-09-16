var io = require('socket.io')(process.env.PORT || 8080)

var room = 0

io.sockets.on('connection', function(socket){
  socket.join(joinRoom(room))
  socket.on('echo', function (data){
    socket.emit('echo', data)
  })
  socket.on('get:room', function(){
    var rooms = socket.rooms
    socket.emit('get:room', rooms)
  })
  socket.on('change:color', function(data){
    io.sockets.emit('change:color', data)
  })
})

function joinRoom(room){
  // generate a room
  var roomToUse = room
  room += 1
  return roomToUse.toString()
}

roomHandler = {
  room: 0,
  joinRoom: function(){
    roomToJoin = roomHandler.room
    roomHandler.room+=1
    return roomToJoin
  }
}

// worried about room numbers getting huge?
