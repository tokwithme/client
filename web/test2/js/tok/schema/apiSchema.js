
app.apiSchema = {

	id: "apiSchema#",
	$schema: "http://json-schema.org/draft-04/schema#",

	//type: "object",

	/*
	 "patternProperties": {
	 "^join$": {"$ref": "joinReqSchema#"},
	 "^leave$": {"$ref": "leaveReqSchema#"}
	 },*/


	properties: {
		join: {
			properties: {
				ok: {type: "boolean"},
				id: {$ref: "#/definitions/mongoId"}
			},
			required: ["ok", "id"]
		},

		leave: {
			properties: {
				ok: {type: "boolean"}
			},
			required: ["ok"]
		},

		matching: {
			properties: {
				ok: {type: "boolean"},
				list: {
					type: 'array'
				}
			},
			required: ["ok", "list"]
		},

		send: {
			properties: {
				ok: {type: "boolean"}
			},
			required: ["ok"]
		},

		data: {
			properties: {

			},
			required: []
		}


	},

	oneOf: [
		{required: ["join"]},
		{required: ["leave"]},
		{required: ["matching"]},
		{required: ["send"]},
		{required: ["data"]}
	],

	additionalProperties: false,

	definitions: {
		mongoId: {
			type: "string",
			pattern: "^[0-9a-f]{24}$"
		}
	}

};
