
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
				{name: 'connect', 		from: 'disconnected', 	to: 'out'},
				{name: 'disconnect', 	from: '*', 				to: 'disconnected'},
				{name: 'joinStart', 	from: 'out', 			to: 'joining'},
				{name: 'joinOk', 		from: 'joining', 		to: 'ready'},
				{name: 'leave', 		from: 'ready', 			to: 'out'},
				{name: 'findMatch', 	from: 'ready', 			to: 'matching'},
				{name: 'findMatchFail', from: 'matching', 		to: 'ready'},
				{name: 'startCall', 	from: 'matching', 		to: 'call'},
				{name: 'endCall', 		from: 'call', 			to: 'ready'}
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
		clientId = null;
		peerId = null;
		matching = [];
		app.debug({
			clientId: null,
			peerId: null,
			matching: null
		});
	};

	sm.onconnect = function(){
		ws.sm.connect();
	};

	sm.onjoining = function(){

		var data = {
			self: 1,
			other: [1, 2]
		};
		serverApi.cmd('join', data);
	};

	sm.onleave = function(){
		serverApi.cmd('leave');
		clientId = null;
		app.debug({clientId: clientId});
	};

	sm.onfindMatch = function(){
		serverApi.cmd('matching');
	};

	sm.onstartCall = function(){
		webrtc.sm.start();
	};


	events.subAll({

		'state_ws_disconnected': function(){
			sm.disconnect();
		},

		'rtcSendMsg': function(msg){

			serverApi.cmd('send', {
				id: peerId,
				data: JSON.stringify(msg)
			});
		},

		'state_rtc_idle': function() {

		},

		'api_join': function(d) {
			if(sm.checkWrongState('joining', 'disconnect', 'api_join')) return;

			clientId = d.id;
			app.debug({clientId: clientId});

			sm.joinOk();

			// automatically do Matching!
			//events.pub('matchingStart');
		},

		'api_matching': function(d) {
			//if(sm.checkWrongState('matching', 'disconnect', 'api_matching')) return;
			matching = d.list;
			app.debug({matching: matching.length});

			if(!sm.is('matching')) return; // probably in a call?..

			if(!matching || !matching.length) {
				app.log('no matching');
				sm.findMatchFail();
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
					data = JSON.parse(d.data)
					;

				// save peer
				if(!peerId) peerId = id;

				//app.log('id: '+id);
				//app.log(data);

				events.pub('rtcReceiveMsg', data);

			} catch(ex) {
				console.log('Exception in api_data: ', ex);
			}
		}
	});






	// todo:
	/*window.onbeforeunload = function()
	{
		sendMessage({type: 'bye'});
	}*/


	return {

	};
};