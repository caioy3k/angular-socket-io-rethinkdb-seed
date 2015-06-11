'use strict';

/* Todo Controller */

angular.module('myApp.todoCtrl', []).controller('TodoCtrl', function TodoCtrl($scope, $routeParams, todoStorage, filterFilter, socket) {


    $scope.todos = [];
    $scope.todosPush = [];

    Array.prototype.getIndexBy = function (name, value) {
        for (var i = 0; i < this.length; i++) {
            if (this[i][name] == value) {
                return i;
            }
        }
        return null;
    }

    var deleteTodoView = function(id){
        var deleteKey = $scope.todos.getIndexBy("id", id);
        if(deleteKey !== 'null') {
            $scope.todos.splice(deleteKey, 1);
        }
    };

    var updateTodoView = function(obj){
        var key = $scope.todos.getIndexBy("id", obj.id);
        if(angular.isNumber(key) && isFinite(key)){
            $scope.todos[key] = obj;
        } else {
            $scope.todos.push(obj);
        }
    };

    socket.on('send:todos', function (data) {
        $scope.todosPush.push(data);
        if(angular.isDefined(data._deleted)) {
            deleteTodoView(data.id);
        } else {
            updateTodoView(data);
        }
    });

    todoStorage.get().success(function(todos) {
        $scope.todos = todos;
    }).error(function(error) {
        alert('Failed to load TODOs');
    });

    $scope.newTodo = '';
    $scope.editedTodo = null;

    $scope.$watch('todos', function (newValue, oldValue) {
        $scope.remainingCount = filterFilter($scope.todos, { completed: false }).length;
        $scope.completedCount = $scope.todos.length - $scope.remainingCount;
        $scope.allChecked = !$scope.remainingCount;
    }, true);

    // Monitor the current route for changes and adjust the filter accordingly.
    $scope.$on('$routeChangeSuccess', function () {
        var status = $scope.status = $routeParams.status || '';

        $scope.statusFilter = (status === 'active') ?
        { completed: false } : (status === 'completed') ?
        { completed: true } : null;
    });

    $scope.addTodo = function () {
        var newTitle = $scope.newTodo.trim();
        if (!newTitle.length) {
            return;
        }
        var newTodo = {
            title: newTitle,
            completed: false
        }
        todoStorage.create(newTodo).success(function(savedTodo) {
            //$scope.todos.push(savedTodo);
        }).error(function(error) {
            alert('Failed to save the new TODO');
        });
        $scope.newTodo = '';
    };

    $scope.toggleTodo = function (todo) {
        var copyTodo = angular.extend({}, todo);
        copyTodo.completed = !copyTodo.completed;
        todoStorage.update(copyTodo).success(function(newTodo) {
            if (newTodo === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
                $scope.todos.splice($scope.todos.indexOf(todo), 1);
            }
            else {
                $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
                $scope.editedTodo = null;
            }
        }).error(function() {
            console.log('fds');
            alert('Failed to update the status of this TODO');
        });

    };
    $scope.editTodo = function (todo) {
        $scope.editedTodo = todo;
        // Clone the original todo to restore it on demand.
        $scope.originalTodo = angular.extend({}, todo);
    };

    $scope.doneEditing = function (todo, $event) {
        todo.title = todo.title.trim();
        if ((todo._saving !== true) && ($scope.originalTodo.title !== todo.title)) {
            todo._saving = true; // submit and blur trigger this method. Let's save the document just once
            todoStorage.update(todo).success(function(newTodo) {
                if (newTodo === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
                    console.log('hum');
                    $scope.todos.splice($scope.todos.indexOf(todo), 1);
                }
                else {
                    $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
                    $scope.editedTodo = null;
                }
            }).error(function() {
                todo._saving = false;
                alert('Failed to update this TODO');
            });
        }
        else {
            $scope.editedTodo = null;
        }
    };

    $scope.revertEditing = function (todo) {
        $scope.todos[$scope.todos.indexOf(todo)] = $scope.originalTodo;
        $scope.doneEditing($scope.originalTodo);
    };

    $scope.removeTodo = function (todo) {
        todoStorage.delete(todo.id).success(function() {
            //$scope.todos.splice($scope.todos.indexOf(todo), 1);
        }).error(function() {
            alert('Failed to delete this TODO');
        });
    };

    $scope.clearCompletedTodos = function () {
        $scope.todos.forEach(function (todo) {
            if(todo.completed) {
                $scope.removeTodo(todo);
            }
        });
    };

    $scope.markAll = function (completed) {
        $scope.todos.forEach(function (todo) {
            if (todo.completed !== !completed) {
                $scope.toggleTodo(todo);
            }
            //todo.completed = !completed;
        });
    };
});
