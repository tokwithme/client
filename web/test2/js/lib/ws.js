
app.wsCreate = function(cfg, events) {

	var
		sm = app.stateCreate('ws', {
			initial: 'disconnected',
			events: [
				{name: 'connect', 		from: 'disconnected', 	to: 'connecting'},
				{name: 'connectOk', 	from: 'connecting', 	to: 'connected'},
				{name: 'disconnect', 	from: '*', 				to: 'disconnected'}
			]
		}),

		cnst = {
			WS_MESSAGE: 'wsMessage'
		},

		enabled = ("WebSocket" in window),

		// reconnect settings

		rc = {
			cur: 1,
			min: 2,
			max: 60,
			mul: 2
		},

		sock,
		ts
	;


	// State management

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

		console.log('ws connecting to '+cfg.url);

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
		console.log('ws close');

		sm.disconnect();

		// schedule reconnect
		if(!cfg.reconnectEnabled) return;

		console.log('ws reconnect in '+parseInt(rc.cur)+' sec');
		setTimeout(function(){
			sm.connect();
		}, parseInt(rc.cur*1000));

		// increase reconnect timeout
		rc.cur *= rc.mul;
		if(rc.cur > rc.max) rc.cur = rc.max;
	}

	function onMessage(e) {
		console.log(' <- '+e.data);

		var msg;

		try {
			msg = JSON.parse(e.data);
		} catch(ex) {
			console.error('ws error parsing json msg: '+e.data);
			return;
		}

		events.pub(cnst.WS_MESSAGE, msg);

	}

	function send(data) {
		if(!sm.is('connected')) {console.log('ws: not connected');return false;}

		if(typeof data != 'string') data = JSON.stringify(data);
		console.log(' -> '+data);
		sock.send(data);
	}




	return {
		sm: sm,
		cnst: cnst,

		send: send
	};
};
