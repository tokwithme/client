

app.serverApiCreate = function(events, ev, ws) {

	var
		reconnect = false
	;

	function connect(url) {
		ws.connect(url, reconnect);
	}

	function cmd(cmd, data) {
		var o = {};
		o[cmd] = data;
		ws.send(o);
	}

	events.sub(ev.wsMessage, function(d){
		app.log(d);

		if(Object.keys(d).length < 1) {
			app.log('empty/wrong server message'); return;
		}

		try {
			var cmdName = Object.keys(d)[0];
			var data = d[cmdName];
			events.pub('api_'+cmdName, data);

		} catch(ex) {
			app.log('Exception in wsMessage');
			app.log(ex);
		}
	});



	return {
		connected: ws.connected,
		connect: connect,
		cmd: cmd
	};
};