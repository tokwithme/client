
app.userMedia = (function(){

	var
		cachedStream = {},
		enabled
	;

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	enabled = (typeof navigator.getUserMedia != 'undefined');
	if(!enabled) console.error('getUserMedia not supported');


	function get(constraints, cache) {
		var def = new $.Deferred();

		if(!enabled) {
			def.reject(new Error('getUserMedia not supported')); return def.promise();
		}

		if(cache) {
			var k = JSON.stringify(constraints);
			if(cachedStream[k]) {
				def.resolve(cachedStream[k]);
				return def.promise();
			}
		}

		navigator.getUserMedia(constraints, function(stream){

			if(cache) {
				var k = JSON.stringify(constraints);
				cachedStream[k] = stream;
			}

			def.resolve(stream);

		}, function(ex){
			def.reject(ex);
		});

		return def.promise();
	}



	return {
		get: get
	};

})();