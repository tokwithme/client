
app.viewCreate = function(events) {

	var
		selBtnConnectServer = '#btnConnect1',
		selBtnDisconnectServer = '#btnDisconnect',
		selBtnConnectPartner = '#btnConnect2',
		selInputYourId = '#clientId',
		selInputPartnerId = '#partnerId',
		$videoLocal = $('#video1'),
		$videoRemote = $('#video2')
	;

	events.subAll({

		'state_ws_connected': function() {
			$(selBtnConnectServer).attr('disabled', 1);
			$(selBtnConnectServer).attr('disabled', 1);
		},

		'joinDone': function(cid){
			$(selInputYourId).val(cid);
			$(selBtnConnectServer).attr('disabled', 1);
		},

		'matchingDone': function(pid){
			$(selInputPartnerId).val(pid);
		},

		'rtcGotLocalStream': function(stream){
			$videoLocal.attr('src', URL.createObjectURL(stream));
		},

		'rtcGotRemoteStream': function(stream){
			$videoRemote.attr('src', URL.createObjectURL(stream));
		},

		'state_rtc_idle': function() {
			$videoLocal.removeAttr('src');
			$videoRemote.removeAttr('src');
		}

	});



	$(document)
		/*.on('click', selBtnConnectServer, function(){
			events.pub('connectServerStart');
		})*/
		.on('click', selBtnConnectPartner, function(){
			var pid = $(selInputPartnerId).val();
			if(!pid) {alert('Enter partner id'); return;}
			events.pub('connectPartnerStart', pid);
		})
		.on('click', '#btnMatching', function(){
			events.pub('matchingStart');
		})
	;

	$(selInputYourId).val('');
	$(selInputPartnerId).val('');
	$(selBtnConnectServer).removeAttr('disabled');

	return {

	};
};