

app.ngCreate = function() {

	var
		ngApp = angular.module('tok', ['ngStorage']),
		events = app.events
	;

	//ngApp.controller('mainCtrl', ['$scope', '$sce', '$http', '$localStorage', '$location', function ($scope, $sce, $http, $localStorage, $location) {
	ngApp.controller('mainCtrl', ['$scope', '$sce', function ($scope, $sce) {

		var
			localVideoSrc,
			remoteVideoSrc
		;


		events.subAll({

			state_client: function(sm) {
				$scope.clientSm = sm;
				if(!$scope.$$phase) $scope.$apply();
			},

			rtcGotLocalStream: function(stream){
				localVideoSrc = URL.createObjectURL(stream);
				$scope.localVideoSrc = $sce.trustAsResourceUrl(localVideoSrc); $scope.$apply();
			},

			rtcGotRemoteStream: function(stream){
				remoteVideoSrc = URL.createObjectURL(stream);
				$scope.remoteVideoSrc = $sce.trustAsResourceUrl(remoteVideoSrc); $scope.$apply();
			},

			state_rtc_idle: function() {
				//$scope.localVideoSrc = $sce.trustAsResourceUrl('//:0');
				//$scope.remoteVideoSrc = $sce.trustAsResourceUrl('//:0');
				//if(!$scope.$$phase) $scope.$apply();
				// jq workaround to set src="" (need for FF)
				if(localVideoSrc) {
					URL.revokeObjectURL(localVideoSrc);
					URL.revokeObjectURL(remoteVideoSrc);
					$('video').removeAttr('src');
				}
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
