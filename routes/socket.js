
'use strict';

var r = require('rethinkdb');
var config = require('../config.js');

module.exports = function (socket) {

    r.connect(config.rethinkdb, function(err, conn){
        r.table('todos')
            .changes()
            .run(conn)
            .then(function (cursor) {
                cursor.each(function (err, todo) {
                    if (todo.new_val !== null) {
                        socket.emit('send:todos', todo.new_val);
                    } else {
                        socket.emit('send:todos', { "_deleted": true, "id": todo.old_val.id });
                    }
                });
            });
    });

};
