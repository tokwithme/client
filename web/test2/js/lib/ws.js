
app.wsCreate = function(events) {

	var
		enabled = ("WebSocket" in window),
		ev = {
			wsMessage: 'wsMessage',
			wsOpen: 'wsOpen',
			wsClose: 'wsClose'
		},

		// reconnect settings
		reconnectEnabled = false,
		rc = {
			cur: 1,
			min: 2,
			max: 60,
			mul: 2
		},

		sock,
		url,
		connected = false,
		ts
	;

	function connect(url1, reconnectEnabled1) {
		if(!enabled) {
			alert('WebSocket not supported'); return false;
		}

		if(connected) return false;

		url = url1;
		reconnectEnabled = reconnectEnabled1;
		connected = false;

		reconnect();
	}

	function reconnect() {
		if(connected) return false;

		if(typeof Visibility != 'undefined' && Visibility.hidden()) {
			app.log('ws visibility hidden: skipping reconnect');
			setTimeout(reconnect, parseInt(rc.cur*1000));
			return false;
		}

		app.log('ws connecting to '+url);

		sock = new WebSocket(url);
		sock.onopen = onOpen;
		sock.onclose = onClose;
		sock.onmessage = onMessage;
	}

	function disconnect() {
		if(!connected) return false;
		connected = false;
		app.log('ws disconnecting');
		sock.close();
		sock = null;
	}

	function onOpen() {
		app.log('ws open');
		connected = true;
		ts = new Date().getTime();

		events.pub(ev.wsOpen);

		// reset reconnect
		rc.cur = rc.min;
	}

	function onClose() {
		app.log('ws close');
		connected = false;
		ts = new Date().getTime();

		events.pub(ev.wsClose);

		if(!reconnectEnabled) return;
		// schedule reconnect
		app.log('ws reconnect in '+parseInt(rc.cur)+' sec');
		setTimeout(function(){
			reconnect();
		}, parseInt(rc.cur*1000));

		// increase reconnect timeout
		rc.cur *= rc.mul;
		if(rc.cur > rc.max) rc.cur = rc.max;
	}

	function onMessage(e) {
		app.log('ws msg: '+e.data);

		var msg;

		try {
			msg = JSON.parse(e.data);
		} catch(ex) {
			app.log('ws error parsing json msg: '+e.data);
			return;
		}

		events.pub(ev.wsMessage, msg);

	}

	function send(data) {
		if(!connected) {
			app.log('ws: not connected');
			return false;
		}
		if(typeof data != 'string') data = JSON.stringify(data);
		app.log('ws sending: '+data);
		sock.send(data);
	}




	return {
		connected: connected,
		connect: connect,
		disconnect: disconnect,
		send: send
	};
};
