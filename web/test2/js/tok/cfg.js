
app.cfg = (function(){

	var
		iceServersGoogle = [
			{"url": "stun:stun.l.google.com:19302"},
			{
				"urls":[
					"turn:23.251.129.26:3478?transport=udp",
					"turn:23.251.129.26:3478?transport=tcp",
					"turn:23.251.129.26:3479?transport=udp",
					"turn:23.251.129.26:3479?transport=tcp"
				],
				"credential":"/D+eNYu7YDEKk6cLCeAx0pxZj7o=",
				"username":"1409228251:72418302"
			}
		],

		webrtc = {
			connectTimeoutSec: 15,
			constraints: {
				video: true
			},
			pcConfig: {
				iceServers: iceServersGoogle
			},
			pcConfigOptional: {
				optional: [{
					DtlsSrtpKeyAgreement: true
				}]
			}
		},

		serverApi = {
			ws: {
				url: 'ws://tokwithme-31z4.rhcloud.com:8000/api',
				reconnectEnabled: false
			}
		}


	;




	return {
		webrtc: webrtc,
		serverApi: serverApi
	};
})();