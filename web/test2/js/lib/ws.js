
app.wsCreate = function(events) {

	var
		enabled = ("WebSocket" in window),

		cfg = {
			url: null,
			reconnectEnabled: false
		},
		// reconnect settings

		rc = {
			cur: 1,
			min: 2,
			max: 60,
			mul: 2
		},

		sock,
		ts,

		sm = app.stateCreate('ws', {
			initial: 'disconnected',
			events: [
				{name: 'connect', 		from: 'disconnected', 	to: 'connecting'},
				{name: 'connectOk', 	from: 'connecting', 	to: 'connected'},
				{name: 'disconnect', 	from: '*', 				to: 'disconnected'}
			]
		})
	;


	sm.ondisconnected = function() {

		ts = new Date().getTime();

		if(sock) {
			try {
				sock.onclose = null;
				sock.close();
			} catch(ign){}
			sock = null;
		}
	};


	sm.onconnecting = function() {
		if(!enabled) {console.log('WebSocket not supported'); return false;}

		app.log('ws connecting to '+cfg.url);

		sock = new WebSocket(cfg.url);
		sock.onopen = onOpen;
		sock.onclose = onClose;
		sock.onmessage = onMessage;
	};

	sm.onconnected = function() {
		ts = new Date().getTime();

		// reset reconnect
		rc.cur = rc.min;
	};


	function onOpen() {
		sm.connectOk();
	}

	function onClose() {
		app.log('ws close');

		sm.disconnect();

		// schedule reconnect
		if(!cfg.reconnectEnabled) return;

		app.log('ws reconnect in '+parseInt(rc.cur)+' sec');
		setTimeout(function(){
			sm.connect();
		}, parseInt(rc.cur*1000));

		// increase reconnect timeout
		rc.cur *= rc.mul;
		if(rc.cur > rc.max) rc.cur = rc.max;
	}

	function onMessage(e) {
		app.log(' <- '+e.data);

		var msg;

		try {
			msg = JSON.parse(e.data);
		} catch(ex) {
			app.log('ws error parsing json msg: '+e.data);
			return;
		}

		events.pub('wsMessage', msg);

	}

	function send(data) {
		if(!sm.is('connected')) {app.log('ws: not connected');return false;}

		if(typeof data != 'string') data = JSON.stringify(data);
		app.log(' -> '+data);
		sock.send(data);
	}




	return {
		setCfg: function(_cfg) {
			cfg = _cfg;
		},
		sm: sm,
		/*
		connect: function() {
			sm.connect.apply(sm, arguments);
		},
		disconnect: function(){
			sm.disconnect();
		},
		*/
		send: send
	};
};
