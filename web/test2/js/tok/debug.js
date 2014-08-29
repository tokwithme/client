
app.debug = (function() {

	var
		o = {},
		sel = '#debug',
		$debug = $(sel)
	;

	function upd(kv) {
		for(var k in kv) {
			var v = kv[k];
			o[k] = v;
		}

		render();
	}

	function render() {
		if(!$debug.length) $debug = $(sel);
		if(!$debug.length) return; // nowhere to render

		var items = [];
		for(var k in o) {
			items.push('<b>'+k+'</b>: '+o[k]);
		}

		$debug.html(items.join('<br>'));
	}

	return upd;
})();