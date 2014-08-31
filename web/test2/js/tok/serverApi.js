

app.serverApiCreate = function(cfg, events) {

	var
		sm = app.stateCreate('serverApi', {
			initial: 'disconnected',
			events: [
				{name: 'connect', 		from: 'disconnected', 	to: 'connecting'},
				{name: 'connectOk', 	from: 'connecting', 	to: 'connected'},
				{name: 'disconnect', 	from: '*', 				to: 'disconnected'}
			]
		}),

		ws = app.wsCreate(cfg.ws, events)

	;

	// State management

	sm.onconnect = function() {
		ws.sm.connect();
	};

	sm.ondisconnected = function() {
		ws.sm.disconnect();
	};


	// Events

	events.subAll({

		state_ws_connected: function(){
			sm.connectOk();
		},

		state_ws_disconnected: function(){
			sm.disconnect();
		},

		wsMessage: function(d){
			//app.log(d);

			// TODO: validate incoming message via jsonSchema

			if(Object.keys(d).length < 1) {
				app.log('empty/wrong server message'); return;
			}

			try {
				var
					cmdName = Object.keys(d)[0],
					data = d[cmdName]
				;

				if(!data.ok && !data.data) {
					console.error('server returned error: '+data.reason); return;
				}

				events.pub('api_'+cmdName, data);

			} catch(ex) {
				console.error('Exception in wsMessage: ', ex);
			}
		}
	});


	// API

	function cmd(cmd, data) {
		if(!data) data = {};
		var o = {};
		o[cmd] = data;
		ws.send(o);
	}

	function send(peerId, msg) {
		cmd('send', {
			id: peerId,
			data: JSON.stringify(msg)
		});
	}

	function join(self, other) {
		cmd('join', {
			self: self,
			other: other
		});
	}

	function leave() {
		cmd('leave');
	}

	function matching() {
		cmd('matching');
	}





	return {
		sm: sm,

		cmd: cmd,
		cmdSend: send,
		cmdJoin: join,
		cmdLeave: leave,
		cmdMatching: matching
	};
};