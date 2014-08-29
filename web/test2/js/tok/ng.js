

app.ngCreate = function() {

	var
		ngApp = angular.module('tok', ['ngStorage']),
		events = app.events
	;

	ngApp.controller('mainCtrl', ['$scope', '$http', '$localStorage', '$location', function ($scope, $http, $localStorage, $location) {


		events.sub('state_ws', function(sm) {
			$scope.wsSm = sm;
			if(!$scope.$$phase) $scope.$apply();
		});

		events.sub('state_client', function(sm) {
			$scope.clientSm = sm;
			if(!$scope.$$phase) $scope.$apply();
		});




	}]);


	angular.bootstrap(document, ['tok']);


	return {

	};
};
