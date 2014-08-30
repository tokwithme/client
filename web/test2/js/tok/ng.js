

app.ngCreate = function() {

	var
		ngApp = angular.module('tok', ['ngStorage']),
		events = app.events
	;

	ngApp.controller('mainCtrl', ['$scope', '$sce', '$http', '$localStorage', '$location', function ($scope, $sce, $http, $localStorage, $location) {


		/*events.sub('state_ws', function(sm) {
			$scope.wsSm = sm;
			if(!$scope.$$phase) $scope.$apply();
		});*/

		events.subAll({

			state_client: function(sm) {
				$scope.clientSm = sm;
				if(!$scope.$$phase) $scope.$apply();
			},

			rtcGotLocalStream: function(stream){
				$scope.localVideoSrc = $sce.trustAsResourceUrl(URL.createObjectURL(stream)); $scope.$apply();
			},

			rtcGotRemoteStream: function(stream){
				$scope.remoteVideoSrc = $sce.trustAsResourceUrl(URL.createObjectURL(stream)); $scope.$apply();
			},

			state_rtc_idle: function() {
				$scope.localVideoSrc = $sce.trustAsResourceUrl('//:0');
				$scope.remoteVideoSrc = $sce.trustAsResourceUrl('//:0');
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
