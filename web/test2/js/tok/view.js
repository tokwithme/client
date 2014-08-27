
app.viewCreate = function(events, ev) {

	var
		selBtnConnectServer = '#btnConnect1',
		selBtnConnectPartner = '#btnConnect2',
		selInputYourId = '#clientId',
		selInputPartnerId = '#partnerId',
		$videoLocal = $('#video1'),
		$videoRemote = $('#video2')
	;

	events.sub(ev.joinDone, function(cid){
		$(selInputYourId).val(cid);
		$(selBtnConnectServer).attr('disabled', 1);
	});

	events.sub(ev.matchingDone, function(pid){
		$(selInputPartnerId).val(pid);
	});

	events.sub(ev.rtcGotLocalStream, function(stream){
		$videoLocal.attr('src', URL.createObjectURL(stream));
	});

	events.sub(ev.rtcGotRemoteStream, function(stream){
		$videoRemote.attr('src', URL.createObjectURL(stream));
	});

	$(document)
		.on('click', selBtnConnectServer, function(){
			events.pub(ev.connectServerStart)
		})
		.on('click', selBtnConnectPartner, function(){
			var pid = $(selInputPartnerId).val();
			if(!pid) {alert('Enter partner id'); return;}
			events.pub(ev.connectPartnerStart, pid)
		})
		.on('click', '#btnMatching', function(){
			events.pub(ev.matchingStart);
		})
	;

	$(selInputYourId).val('');
	$(selBtnConnectServer).removeAttr('disabled');

	return {

	};
};