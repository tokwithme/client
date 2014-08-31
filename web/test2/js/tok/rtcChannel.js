
app.rtcChannelCreate = function(events, webrtc, serverApi) {

	var
		a
	;

	events.sub(webrtc.cnst.RTC_SEND_MSG, function(msg){
		serverApi.cmdSend(msg.peerId, msg.data);
	});

	events.subAll({

		api_data: function(d) {

			// TODO: validate d.data against "clientCmd" schema

			try {
				if(!d || !d.data) {console.error('error response for api_data'); return;}

				events.pub(webrtc.cnst.RTC_RECEIVE_MSG, {
					id: d.id,
					data: JSON.parse(d.data)
				});


			} catch(ex) {
				console.error('Exception in api_data: ', ex);
			}
		}
	});


	return {

	};
};