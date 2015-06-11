
/**
 * Module dependencies
 */
var async = require('async');
var r = require('rethinkdb');
var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  todos = require('./routes/todos'),
  http = require('http'),
  path = require('path');

var config = require(__dirname + '/config.js');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
};


/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/name', api.name);

//The REST routes for "todos".
app.get('/todos', todos.listTodoItems);
app.post('/todos', todos.createTodoItem);

app.get('/todos/:id', todos.getTodoItem);
app.put('/todos/:id', todos.updateTodoItem);
app.delete('/todos/:id', todos.deleteTodoItem);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * Boot Server
 */

function startExpress(connection) {

    // RethinkDB Connection
    app._rdbConn = connection;

    // Socket.io Communication
    io.sockets.on('connection', require('./routes/socket'));

    // Start Server
    server.listen(config.express.port);
    console.log('Listening on port ' + config.express.port);
}

/*
 * Connect to rethinkdb, create the needed tables/indexes and then start express.
 * Create tables/indexes then start express
 */
async.waterfall([
    function connect(callback) {
        r.connect(config.rethinkdb, callback);
    },
    function createDatabase(connection, callback) {
        //Create the database if needed.
        r.dbList().contains(config.rethinkdb.db).do(function(containsDb) {
            return r.branch(
                containsDb,
                {created: 0},
                r.dbCreate(config.rethinkdb.db)
            );
        }).run(connection, function(err) {
            callback(err, connection);
        });
    },
    function createTable(connection, callback) {
        //Create the table if needed.
        r.tableList().contains('todos').do(function(containsTable) {
            return r.branch(
                containsTable,
                {created: 0},
                r.tableCreate('todos')
            );
        }).run(connection, function(err) {
            callback(err, connection);
        });
    },
    function createIndex(connection, callback) {
        //Create the index if needed.
        r.table('todos').indexList().contains('createdAt').do(function(hasIndex) {
            return r.branch(
                hasIndex,
                {created: 0},
                r.table('todos').indexCreate('createdAt')
            );
        }).run(connection, function(err) {
            callback(err, connection);
        });
    },
    function waitForIndex(connection, callback) {
        //Wait for the index to be ready.
        r.table('todos').indexWait('createdAt').run(connection, function(err, result) {
            callback(err, connection);
        });
    }
], function(err, connection) {
    if(err) {
        console.error(err);
        process.exit(1);
        return;
    }

    startExpress(connection);
});
