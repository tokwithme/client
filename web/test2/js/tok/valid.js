
app.valid = (function(){
	return {
		api: {
			id: "apiSchema#",
			"$schema": "http://json-schema.org/draft-04/schema#",
			//"title": "API",
			//"description": "abc",

			"type": "object",

			"patternProperties": {
				"^join$": {"$ref": "joinReqSchema#"},
				"^leave$": {"$ref": "leaveReqSchema#"}
			},

			"definitions": {
				"mongoId": {
					"type": "string",
					"pattern": "^[0-9a-f]{24}$"
				}
			},

			"required": []


		},

		apiJoinResp: {
			"id": "joinReqSchema#",
			"$schema": "http://json-schema.org/draft-04/schema#",
			//"description": "abc",

			"type": "object",

			"properties": {
				"id": {"$ref": "apiSchema#/definitions/mongoId"},
				/*"id": {
					"type": "string",
					"pattern": "^[0-9a-f]{24}$"
				},*/
				"ok": {
					"type": "boolean"
				}
			},

			"definitions2": {
				"mongoId": {
					"type": "string",
					"pattern": "^[0-9a-f]{24}$"
				}
			},

			"required": ["ok", "id"]
		},

		apiLeaveResp: {
			"id": "leaveReqSchema#",
			"$schema": "http://json-schema.org/draft-04/schema#",
			"description": "abc",

			"type": "object",

			"properties": {
				"ok": {
					"type": "boolean"
				}
			},

			"required": ["ok"]
		}


	};
})();