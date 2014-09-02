
// main
(function(){

	var
		events = app.events,

		ng = app.ngCreate(),

		//ws = app.wsCreate(events),
		//view = app.viewCreate(events),
		//serverApi = app.serverApiCreate(events, ws),
		//clientApi = app.clientApiCreate(),
		//webrtc = app.webrtcCreate(events),

		client = app.clientCreate(events)
	;

	return;

	var resp = {
		join: {
			ok: true,
			id: '5405d1cef638eb2403a4c1bf1'
		}
	};

	var schema = app.valid.api;

	tv4.addSchema(app.valid.apiJoinResp);

	var res = tv4.validateResult(resp, schema);
	console.log(resp);
	console.log(res);
	//console.log(tv4.error);


})();

