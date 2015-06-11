'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',

  'myApp.todoCtrl',
  'myApp.todoStorage',
  'myApp.todoEscape',
  'myApp.todoFocus',
  'myApp.socket',

  // 3rd party dependencies
  'btford.socket-io'
]).
config(function ($routeProvider) {
    $routeProvider.when('/', {
        controller: 'TodoCtrl',
        templateUrl: './partials/todomvc-index'
    }).when('/:status', {
        controller: 'TodoCtrl',
        templateUrl: './partials/todomvc-index'
    }).otherwise({
        redirectTo: '/'
    });

});
