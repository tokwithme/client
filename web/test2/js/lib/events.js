
// based on:
// http://davidwalsh.name/pubsub-javascript
app.eventsCreate = function(){
	var topics = {};

	return {
		sub: function(topic, listener) {
			// Create the topic's object if not yet created
			if(!topics[topic]) topics[topic] = { queue: [] };

			// Add the listener to queue
			var index = topics[topic].queue.push(listener) -1;

			// Provide handle back for removal of topic
			return (function(topic, index) {
				return {
					remove: function() {
						delete topics[topic].queue[index];
					}
				};
			})(topic, index);
		},
		pub: function(topic, info) {
			// If the topic doesn't exist, or there's no listeners in queue, just leave
			if(!topic || !topics[topic] || !topics[topic].queue.length) return;

			// Cycle through topics queue, fire!
			var items = topics[topic].queue;
			for(var i=0; i<items.length; i++) {
				items[i](info);
			}
		}
	};
};
