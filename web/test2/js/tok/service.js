
app.serviceCreate = function(events, ws, serverApi, webrtc) {

	var
		wsCfg = {
			url: 'ws://192.168.0.153:8000/api'
		},
		clientId,
		peerId,
		matching = [],
		sm = app.stateCreate('client', {
			initial: 'disconnected',
			events: [
				{name: 'connectStart', 	from: 'disconnected', 	to: 'connecting'},
				{name: 'connectOk', 	from: 'connecting', 	to: 'out'},
				{name: 'disconnect', 	from: '*', 				to: 'disconnected'},
				{name: 'joinStart', 	from: 'out', 			to: 'joining'},
				{name: 'joinOk', 		from: 'joining', 		to: 'ready'},
				{name: 'leave', 		from: 'ready', 			to: 'out'},
				{name: 'startCall', 	from: 'ready', 			to: 'calling'},
				{name: 'incomingCall', 	from: 'ready', 			to: 'calling'},
				{name: 'callOk', 		from: 'calling', 		to: 'call'},
				//{name: 'callFail', 		from: 'calling', 		to: 'out'},
				{name: 'endCall', 		from: ['call','calling'], 	to: 'out'}
			]
		})
	;

	wsCfg.url = 'ws://tokwithme-31z4.rhcloud.com:8000/api';

	ws.setCfg(wsCfg);

	//events.domBind();


	// auto connect at start!
	//events.pub('connectServerStart');

	sm.ondisconnect = function(){
		ws.sm.disconnect();
		if(webrtc.sm.can('stop')) webrtc.sm.stop();
		clientId = null;
		peerId = null;
		matching = [];
		app.debug({
			clientId: null,
			peerId: null,
			matching: null
		});
	};

	sm.onconnectStart = function(){
		ws.sm.connect();
	};

	sm.onout = function() {

	};

	sm.onjoining = function(){
		var
			self = 1,
			other = [1, 2]
		;
		serverApi.join(self, other);
	};

	sm.onleave = function(){
		serverApi.leave();
		clientId = null;
		app.debug({clientId: clientId});
	};

	sm.onready = function(){
		peerId = null;
		app.debug({peerId: null});
	};

	sm.onstartCall = function(){
		webrtc.sm.start(true);
	};

	sm.oncallOk = function() {
		serverApi.leave();
	};

	sm.onendCall = function(){
		if(webrtc.sm.can('stop')) webrtc.sm.stop();
		// auto join after end of the call
		//sm.joinStart();
	};


	events.subAll({

		state_ws_connected: function(){
			sm.connectOk();

			// auto-join after connect
			sm.joinStart();
		},

		state_ws_disconnected: function(){
			sm.disconnect();
		},

		rtcSendMsg: function(msg){
			if(!sm.is('calling')) {alert('state is not call on rtcSendMsg, skipping'); return;}
			if(!peerId) {alert('no peerId on rtcSendMsg, skipping'); return;}

			serverApi.send(peerId, msg);
		},

		'state_rtc_idle': function() {
			if(sm.can('endCall')) sm.endCall();
		},

		'state_rtc_call': function() {
			//if(sm.can('incomingCall')) sm.incomingCall();
			// this should be done earlier, at api_data
		},

		state_rtc_connected: function() {
			if(sm.can('callOk')) sm.callOk();
		},

		findMatching: function() {
			serverApi.matching();
		},

		'api_join': function(d) {
			if(sm.checkWrongState('joining', 'disconnect', 'api_join')) return;

			clientId = d.id;
			app.debug({clientId: clientId});

			sm.joinOk();

			// automatically do Matching!
			//events.pub('matchingStart');
		},

		api_leave: function(d) {
			clientId = null;
			app.debug({clientId: clientId});
		},

		'api_matching': function(d) {
			matching = d.list;
			app.debug({matching: matching.length});

			if(!sm.is('ready')) return; // probably in a call?..

			if(!matching || !matching.length) {
				app.log('no matching');
				return;
			}
			// pick random
			var i = app.getRandomInt(0, matching.length);
			peerId = matching[i];
			app.debug({peerId: peerId});

			sm.startCall();
		},

		'api_data': function(d) {

			try {
				if(!d || !d.data) {
					alert('error response for api_data'); return;
				}

				var
					id = d.id,
					data = JSON.parse(d.data),
					cmd = data.cmd,
					BUSY = 'busy',
					SDP = 'sdp'
					;

				if(sm.is('ready')) {
					if(cmd == SDP) {
						// incoming call proposal
						peerId = id;
						app.debug({peerId: peerId});
						sm.incomingCall();

					} else {
						app.log('wrong incoming msg at ready state: '+cmd); return;
					}

				} else if(sm.is('calling')) {
					if(peerId != id) {
						// incoming msg from different partner => reply "busy"
						serverApi.send(id, {
							cmd: BUSY
						});
						return;

					} else if(cmd == BUSY) {
						// incoming BUSY msg from the peerId that I wanted to call
						sm.endCall();
						return;
					}
					// otherwise - ok message

				} else {
					app.log('received data in wrong state: '+sm.current);
				}

				events.pub('rtcReceiveMsg', data);


			} catch(ex) {
				console.error('Exception in api_data: ', ex);
			}
		}
	});


	// auto-connect on enter
	sm.connectStart();


	window.onbeforeunload = function(){
		if(sm.is('call')) {
			//return 'Leave the active call?';
		}
	};


	return {

	};
};