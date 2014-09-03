
// main
(function(){

	var
		events = app.events,

		ng = app.ngCreate(),

		client = app.clientCreate(events)
	;



	// Server API validation test

	/*
	var
		resps = [
			{
				join: {
					ok: true,
					id: '5405d1cef638eb2403a4c1bf'
				}
			},

			{
				leave: {
					ok: true
				}
			},

			{
				matching: {
					ok: true,
					list: []
				}
			},

			{
				send: {
					ok: true
				}
			},

			{
				data: {
					ok: true,
					id: '1234'
				}
			}
		]
	;



	var schema = app.apiSchema;
	tv4.addSchema(app.apiSchema);

	for(var i=0; i<resps.length; i++) {
		var res = tv4.validateResult(resps[i], schema);
		console.log(res);
		if(res.error) {
			console.log(resps[i]);
			console.error(res.error.message);
		}
	}
*/






})();

