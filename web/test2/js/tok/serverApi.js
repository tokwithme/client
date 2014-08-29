

app.serverApiCreate = function(events, ws) {

	var
		reconnect = false
	;

	function connect(url) {
		ws.connect(url, reconnect);
	}

	function disconnect() {
		ws.sm.disconnect();
	}

	function cmd(cmd, data) {
		if(!data) data = {};
		var o = {};
		o[cmd] = data;
		ws.send(o);
	}

	events.sub('wsMessage', function(d){
		//app.log(d);

		if(Object.keys(d).length < 1) {
			app.log('empty/wrong server message'); return;
		}

		try {
			var cmdName = Object.keys(d)[0];
			var data = d[cmdName];

			if(!data.ok) {
				console.error('server returned error: '+data.reason); return;
			}

			events.pub('api_'+cmdName, data);

		} catch(ex) {
			app.log('Exception in wsMessage');
			app.log(ex);
		}
	});



	return {
		connect: connect,
		//disconnect: disconnect,
		cmd: cmd
	};
};