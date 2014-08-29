
app.serviceCreate = function(events, serverApi, webrtc) {

	var
		SERVER_URL = 'ws://192.168.0.153:8000/api',
		peerId,
		matching = []
	;

	SERVER_URL = 'ws://tokwithme-31z4.rhcloud.com:8000/api';


	events.subAll({

		'connectServerStart': function(){
			serverApi.connect(SERVER_URL);
		},

		'wsOpen': function(){
			var data = {
				self: 1,
				other: [1, 2]
			};
			serverApi.cmd('join', data);
		},

		'matchingStart': function(){
			serverApi.cmd('matching');
		},

		'connectPartnerStart': function(peerId1){
			peerId = peerId1;
			webrtc.start();
		},

		'rtcSendMsg': function(msg){

			serverApi.cmd('send', {
				id: peerId,
				data: JSON.stringify(msg)
			});
		},

		'rtcDisconnect': function() {

		},

		'api_join': function(d) {
			if(!d.ok) {console.error('join error'); return;}
			events.pub('joinDone', d.id);

			// automatically do Matching!
			events.pub('matchingStart');
		},

		'api_matching': function(d) {
			matching = d.list;
			if(!matching.length) {
				app.log('no matching'); return;
			}
			// pick random
			var i = app.getRandomInt(0, matching.length);

			events.pub('matchingDone', matching[i]);
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



	// auto connect at start!
	events.pub('connectServerStart');

	// todo:
	/*window.onbeforeunload = function()
	{
		sendMessage({type: 'bye'});
	}*/


	return {

	};
};