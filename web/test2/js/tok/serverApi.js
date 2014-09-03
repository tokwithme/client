

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

	// Init

	tv4.addSchema(app.apiSchema);

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
			//console.log(d);

			/*
			if(Object.keys(d).length < 1) {
				console.error('empty/wrong server message'); return;
			}
			*/

			try {

				// validate incoming message with jsonSchema
				validateMessage(d);

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

	function validateMessage(d) {
		var res = tv4.validateResult(d, app.apiSchema);
		if(res.error) {
			console.error('ws msg validation error: '+res.error.message);
			console.log(res.error);
			console.log(d);
			throw new Error('Validation error');
		}
	}


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