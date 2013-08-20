/**
 * Listener: listen for messages on some port
 *
 * @author		Aaron Bassett
 * @copyright	Aaron Bassett 2013
 */
var sys = require('util');
var net = require('net');

Plugin = exports.Plugin = function(ph) {
	this.ph = ph;
	this.name = this.ph.name;

	this.title = 'listener';
	this.version = '0.1';
	this.author = 'Aaron Bassett';

	this.irc = this.ph.irc;
	if(this.irc.config.pluginConfigs.listener) {
		this.options = this.irc.config.pluginConfigs.listener;
	} else {
		this.options = { '8011': [ '#bottest' ] };
	}


	var that = this;
	that.listener = {};
	that.get_server = function server(c) {
		var channels = that.options[this.address().port];
		c.on('data', function data_muncher(data){
			that.ph.irc.logger.info(c.remoteAddress, data.toString());
			var lines = data.toString().split("\n");
			if ( lines[0].search('HTTP') > -1 ) return;
			var max_lines = 5; //move to config
			var line_count = 0;
			for( var chan_index in channels) {
				var chan =  channels[chan_index];
				if( that.irc.channels[chan] ) {
					c.write("writing to " +  chan + "\n");
					for( var line in lines ){
						if( (++line_count) > max_lines ) break;
						that.irc.channels[chan].send(lines[line]);
					}
				}
				else {
					c.write("Sorry I'm not in " + chan + "\n");
				}
			}
			c.end();
		});
	};
	//this server listens for the clients heartbeats and logs them
	for ( var port in this.options ) {
		that.listener[port] = net.createServer({allowHalfOpen: true}, that.get_server);

		that.listener[port].listen(port);
	}

};



Plugin.prototype.unload = function() {
	console.log('unloading');
	for ( var port in this.options ) {
		this.listener[port].close();
	}
};

