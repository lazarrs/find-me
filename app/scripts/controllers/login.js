'use strict';

angular.module('findMeApp')
  .controller('LoginCtrl', function ($scope, $cookieStore, $location) {
    $scope.nickname = $cookieStore.get('nickname');
    $scope.roomName = $cookieStore.get('roomName');
    $scope.submit = function() {
      $cookieStore.put('nickname', $scope.nickname);
      $location.path('/'+ $scope.roomName).replace();
    };
  });
