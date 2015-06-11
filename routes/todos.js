'use strict';

var r = require("rethinkdb");
/*
 * Retrieve all todo items.
 */
exports.listTodoItems = function(req, res, next) {
    r.table('todos').orderBy({index: 'createdAt'}).run(req.app._rdbConn, function (err, cursor) {
        if (err) {
            return next(err);
        }

        //Retrieve all the todos in an array.
        cursor.toArray(function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });
};

/*
 * Insert a new todo item.
 */
exports.createTodoItem = function(req, res, next) {
    var todoItem = req.body;
    todoItem.createdAt = r.now();

    r.table('todos').insert(todoItem, {returnChanges: true}).run(req.app._rdbConn, function (err, result) {
        if (err) {
            return next(err);
        }

        res.json(result.changes[0].new_val);
    });

};

/*
 * Get a specific todo item.
 */
exports.getTodoItem = function(req, res, next) {
    var todoItemID = req.params.id;

    r.table('todos').get(todoItemID).run(req.app._rdbConn, function (err, result) {
        if (err) {
            return next(err);
        }

        res.json(result);
    });

};

/*
 * Update a todo item.
 */
exports.updateTodoItem = function(req, res, next) {
    var todoItem = req.body;
    var todoItemID = req.params.id;

    r.table('todos').get(todoItemID).update(todoItem, {returnChanges: false}).run(req.app._rdbConn, function (err, result) {
        if (err) {
            return next(err);
        }

        /**
         * Retorna o objeto alterado
         * r...update(.., {returnChanges: true}).run(...
         * res.json(result.changes[0].new_val);
         */
        res.json({success: true});
    });

};

/*
 * Delete a todo item.
 */
exports.deleteTodoItem = function(req, res, next) {
    var todoItemID = req.params.id;

    r.table('todos').get(todoItemID).delete().run(req.app._rdbConn, function (err, result) {
        if (err) {
            return next(err);
        }

        res.json({success: true});
    });
};