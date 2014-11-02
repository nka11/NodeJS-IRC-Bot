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


	var plugin = this;
	plugin.listener = {};
	plugin.get_server = function server(c) {
		var channels = plugin.options[this.address().port];
    var trigger = function(msg){
      c.write(msg.arguments[0] + ' ' + msg.arguments[1] + '\n');
    }
    plugin.irc.on('message',trigger);
    c.on('timeout', function(){plugin.irc.removeListener('message',trigger)});
    c.on('end', function(){plugin.irc.removeListener('message',trigger)});
    c.on('close', function(){plugin.irc.removeListener('message',trigger)});
    c.on('error', function(){plugin.irc.removeListener('message',trigger)});
		c.on('data', function data_muncher(data){
			plugin.ph.irc.logger.info(c.remoteAddress, data.toString());
			var lines = data.toString().split("\n");
			if ( lines[0].search('HTTP') > -1 ) return;
			var max_lines = 5; //move to config
			var line_count = 0;
			for( var chan_index in channels) {
				var chan =  channels[chan_index];
				if( plugin.irc.channels[chan] ) {
					//c.write("writing to " +  chan + "\n");
					for( var line in lines ){
						if( (++line_count) > max_lines ) break;
						plugin.irc.channels[chan].send(lines[line]);
					}
				}
				else {
					c.write("Sorry I'm not in " + chan + "\n");
				}
			}
			//c.end();
		});
	};
	//this server listens for the clients heartbeats and logs them
	for ( var port in this.options ) {



		plugin.listener[port] = net.createServer({allowHalfOpen: true}, plugin.get_server);

		plugin.listener[port].listen(port);
	}

};



Plugin.prototype.unload = function() {
	console.log('unloading');
	for ( var port in this.options ) {
		this.listener[port].close();
	}
};
