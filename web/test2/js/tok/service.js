
app.serviceCreate = function(events, ev, serverApi, webrtc) {

	var
		SERVER_URL = 'ws://192.168.0.154:8000/api',
		peerId,
		matching = []
	;

	SERVER_URL = 'ws://tokwithme-31z4.rhcloud.com:8000/api';


	events.sub(ev.connectServerStart, function(){
		serverApi.connect(SERVER_URL);
	});

	events.sub(ev.wsOpen, function(){
		var data = {
			self: 1,
			other: [0, 1]
		};
		serverApi.cmd('join', data);
	});

	events.sub(ev.matchingStart, function(){
		serverApi.cmd('matching');
	});

	/*events.sub(ev.wsClose, function(){
		app.log('+wsClose');
	});*/

	events.sub(ev.connectPartnerStart, function(peerId1){
		peerId = peerId1;
		webrtc.connect(true);
	});

	events.sub(ev.rtcSendMsg, function(msg){

		serverApi.cmd('data', {
			id: peerId,
			data: JSON.stringify(msg)
		});
	});


	// Receiving messages from server

	events.sub('api_join', function(d) {
		events.pub(ev.joinDone, d);
	});

	events.sub('api_matching', function(d) {
		matching = d;
		if(!d.length) {
			app.log('no matching'); return;
		}
		// pick random
		var i = app.getRandomInt(0, d.length);
		
		events.pub(ev.matchingDone, matching[i]);
	});

	events.sub('api_data', function(d) {

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

			events.pub(ev.rtcReceiveMsg, data);

		} catch(ex) {
			console.log('Exception in api_data: ', ex);
		}
	});



	return {

	};
};