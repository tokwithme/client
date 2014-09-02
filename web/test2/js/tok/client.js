
app.clientCreate = function(events) {

	var
		sm = app.stateCreate('client', {
			initial: 'disconnected',
			events: [
				{name: 'connectStart', 	from: 'disconnected', 		to: 'connecting'},
				{name: 'connectOk', 	from: 'connecting', 		to: 'out'},
				{name: 'disconnect', 	from: '*', 					to: 'disconnected'},
				{name: 'joinStart', 	from: 'out', 				to: 'joining'},
				{name: 'joinOk', 		from: 'joining', 			to: 'ready'},
				{name: 'leave', 		from: 'ready', 				to: 'out'},
				{name: 'startCall', 	from: 'ready', 				to: 'calling'},
				{name: 'incomingCall', 	from: 'ready', 				to: 'calling'},
				{name: 'callOk', 		from: 'calling', 			to: 'call'},
				{name: 'endCall', 		from: ['call','calling'], 	to: 'ready'} // out
			]
		}),

		serverApi = app.serverApiCreate(app.cfg.serverApi, events),
		webrtc = app.webrtcCreate(app.cfg.webrtc, events),
		rtcChannel = app.rtcChannelCreate(events, webrtc, serverApi),

		p = {}

	;

	//events.domBind();


	// auto connect at start!
	//events.pub('connectServerStart');

	sm.ondisconnect = function(){
		if(webrtc.sm.can('stop')) webrtc.sm.stop();
		serverApi.sm.disconnect();
		p = {
			matching: []
		};
		app.debug({
			clientId: null,
			peerId: null,
			matching: null
		});
	};

	sm.onconnectStart = function(){
		serverApi.sm.connect();
	};

	sm.onout = function() {

	};

	sm.onjoining = function(){
		var
			self = 1,
			other = [1, 2]
		;
		serverApi.cmdJoin(self, other);
	};

	sm.onleave = function(){
		serverApi.cmdLeave();
		p.clientId = null;
		app.debug({clientId: null});
	};

	sm.onready = function(){
		app.debug({peerId: null});
	};

	sm.onstartCall = function(a,b,c, peerId){
		webrtc.sm.start(peerId);
	};

	sm.oncallOk = function() {
		// wait, we're not really fully connected at this step
		/*
		serverApi.cmdLeave();
		p.clientId = null;
		app.debug({clientId: null});
		*/
	};

	sm.onendCall = function(){
		if(webrtc.sm.can('stop')) webrtc.sm.stop();
		// auto join after end of the call
		//sm.joinStart();
	};


	events.subAll({

		state_serverApi_connected: function(){
			sm.connectOk();

			// auto-join after connect
			sm.joinStart();
		},

		state_serverApi_disconnected: function(){
			sm.disconnect();
		},

		state_rtc_idle: function() {
			if(sm.can('endCall')) sm.endCall();
		},

		state_rtc_call: function() {
			if(sm.can('incomingCall')) {
				sm.incomingCall();
			} else if(sm.current != 'calling') {
				console.error('Client cannot do incomingCall transition');
				//webrtc.sm.disconnect();
			}

		},

		state_rtc_connected: function() {
			if(sm.can('callOk')) sm.callOk();
		},

		findMatching: function() {
			serverApi.cmdMatching();
		},

		api_join: function(d) {
			if(sm.checkWrongState('joining', 'disconnect', 'api_join')) return;

			p.clientId = d.id;
			app.debug({clientId: p.clientId});

			sm.joinOk();

			// automatically do Matching!
			//events.pub('matchingStart');
		},


		api_matching: function(d) {
			p.matching = d.list;
			app.debug({matching: p.matching.length});

			if(!sm.is('ready')) return; // probably in a call?..

			if(!p.matching || !p.matching.length) {
				console.log('no matching');
				return;
			}
			// pick random
			var i = app.getRandomInt(0, p.matching.length);
			var peerId = p.matching[i];
			app.debug({peerId: peerId});

			sm.startCall(peerId);
		}

	});

	events.sub(webrtc.cnst.RTC_INCOMING_CALL, function(peerId) {
		p.peerId = peerId;
		app.debug({peerId: peerId});
	});


	// auto-connect on enter
	sm.connectStart();


	window.onbeforeunload = function(){
		if(sm.is('call')) {
			sm.endCall(); // will politely send 'bye' before closing
		}
	};


	return {
		p: p
	};
};