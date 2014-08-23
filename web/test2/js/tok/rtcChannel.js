

app.rtcChannelCreate = function(serverApi) {

	var
		peerId
	;

	function send(cmd, data) {
		var packet = {
			cmd: cmd,
			data: data
		};
		serverApi.cmd('data', {
			id: peerId,
			data: JSON.stringify(packet)
		});
	}


	return {
		setPeerId: function(peerId1) {
			peerId = peerId1;
		},
		sendDescr1: function(descr) {
			send('descr1', descr);
		},
		sendDescr2: function(descr) {
			send('descr2', descr);
		}
	};
};