

app.ngCreate = function(events) {

	var
		ngApp = angular.module('tok', ['ngStorage'])
	;

	ngApp.controller('test3Ctrl', ['$scope', '$sce', function ($scope, $sce) {

		//$scope.rec = rec;

		events.subAll({

			state_rec: function(sm) {
				$scope.recSm = sm;
				if(!$scope.$$phase) $scope.$apply();
			}
		});



		$scope.eventPub = function(en) {
			events.pub(en);
		};




	}]);


	angular.bootstrap(document, ['tok']);


	return {

	};
};
