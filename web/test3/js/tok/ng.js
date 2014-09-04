

app.ngCreate = function(events) {

	var
		ngApp = angular.module('tok', ['ngStorage'])
	;

	ngApp.config(['$compileProvider', function($compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|blob):/); // needed to allow <a href="blob:...">
	}]);

	ngApp.controller('test3Ctrl', ['$scope', '$sce', '$localStorage', function ($scope, $sce, $ls) {

		var
			a
		;

		$scope.ls = $ls;

		// load audio from ls on start
		if($ls.audio) {
			updAudioSrc(app.dataURLToBlob($ls.audio));
		}

		events.subAll({

			state_rec: function(sm) {
				$scope.recSm = sm;
				if(!$scope.$$phase) $scope.$apply();
			},

			recBlobSave: function(blob){
				var fr = new FileReader();
				fr.onload = function(e){
					$ls.audio = e.target.result;
					$scope.$apply();
				};
				fr.readAsDataURL(blob);
				updAudioSrc(blob);
			}


		});


		/*
		$scope.eventPub = function(en) {
			events.pub(en);
		};*/

		$scope.deleteAudio = function(){
			//if(confirm('Sure?'))
			delete $ls.audio;
		};

		function updAudioSrc(blob) {
			var localAudioSrc = URL.createObjectURL(blob);
			$scope.audioSrc = $sce.trustAsResourceUrl(localAudioSrc);
			if(!$scope.$$phase) $scope.$apply();
		}


	}]);

	angular.bootstrap(document, ['tok']);


	return {};
};
