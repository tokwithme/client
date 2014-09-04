
app.storage = (function() {

	var
		enabled = false
	;

	try {
		if('localStorage' in window && window.localStorage !== null) enabled = true;
	} catch(e) {}


	return {

		enabled: enabled,

		put: function(k, v, jsonEncode) {
			if(!enabled) return false;

			if(jsonEncode) v = JSON.stringify(v);

			try {
				localStorage.setItem(k, v);
			} catch(e) {
				console.error('localStorage error: ', e);
				console.log(k);
				console.log(v);
			}
		},

		get: function(k, jsonDecode) {
			if(!enabled) return false;

			var d = localStorage.getItem(k);
			if(d && jsonDecode) {
				try {
					return JSON.parse(d);
				} catch(e) {
					console.error('json parse error: '+d);
					return null;
				}
			}

			return d;
		},

		remove: function(k) {
			if(!enabled) return false;

			localStorage.removeItem(k);
			return true;
		},


		clear: function() {
			if(!enabled) return false;

			localStorage.clear();
			return true;
		}
	};
})();