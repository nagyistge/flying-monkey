const numerics = require('../numerics')();

module.exports =
{
  onConnection: function(socket)
  {
    console.log('a user connected');
    socket.on('drone-chan',function(from,msg,cb)
    {
      console.log('MSG', from, ' saying ', msg, typeof cb);
      cb('{"success": true}');
    });
  }
};
