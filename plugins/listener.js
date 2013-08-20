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


	var that = this;
	//this server listens for the clients heartbeats and logs them
    that.listener = net.createServer({allowHalfOpen: true}, function server(c) {
        c.on('data', function data_muncher(data){
			that.ph.irc.logger.info(c.remoteAddress, data.toString());
			c.write("You've been Analrapized!!\n");
            c.end();
			var lines = data.toString().split("\n");
			if ( lines[0].search('HTTP') > -1 ) return;
			var max_lines = 5; //move to config
			var line_count = 0;
			for( var chan in that.irc.channels) {
				for( var line in lines ){
					if( (++line_count) > max_lines ) break;
					that.irc.channels[chan].send(lines[line]);
				}
			}
        });
    });

	that.listener.listen(8012, function() {
        console.log('server bound');
    });

};

