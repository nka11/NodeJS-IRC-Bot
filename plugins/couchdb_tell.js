/**
 * CouchDB Seen Plugin
 *
 * @author		Karl Tiedt
 * @website		http://twitter.com/ktiedt
 * @copyright	Karl Tiedt 2011
 *
 */

var sys = require('util');

Plugin = exports.Plugin = function(ph) {
    this.ph = ph;
	this.name = this.ph.name;

	this.title = 'CouchDB Tell';
	this.version = '0.1';
	this.author = 'Nicolas Karageuzian';

	this.irc = this.ph.irc;
    if (this.irc.config.plugins.indexOf("couchdb_log") === -1) {
        throw(this.name + ": requires couchdb_log plugin to be installed as well");
    }

    // document fields saved from the couchdb_log plugin
    this.fields = ['nick', 'channel', 'host', 'date', 'message', 'type'];

    this.db = this.irc.couchdb;
    this.irc.addTrigger( this, 'tell', this.tell );
};

// Trigger for seen behavior
Plugin.prototype.tell = function(msg) {
	var irc = this.irc, // irc object
        db = irc.couchdb, // database object
	    user = irc.user(msg.prefix), // user
        args = msg.arguments,
		target = (args[0] === irc.nick ? user : args[0]), // target
		message = args[1], // message
		params = message.split(' '),
		plugin = this;

	params.shift();
	if (typeof params[0] == 'undefined') {
		irc.send(target, user + ':', this.processTell({}, 'USAGE'));
	} else if (typeof params[1] == 'undefined') {
    irc.send(target, user + ':', this.processTell({}, 'USAGE'));
  } else {
    var date = Date();
      var nick = params.shift();
    irc.on('message', function tellTrigger(mesg) {
      if (nick == irc.user(mesg.prefix)) {
        irc.send(target, nick + ":" , " [" + user + "]" + " has left a message for you at " + date);
        irc.send(target, nick + ":" , params.join(" "));
        irc.removeListener('message',tellTrigger);

      }
    });
    irc.send(target, user + ':', "I have registered your query for " + nick);
	}
};

// Processes a document object and returns a formatted string based on those values and optional type passed
//      If doc.type is not set, type is used instead -- see USAGE and NEGATIVE uses above for examples
Plugin.prototype.processTell = function(doc, type) {
    var irc = this.irc,
        formats = {
            'USAGE': 'Usage: ' + irc.command + 'seen <nick> <message>',
            'NEGATIVE': 'I have never seen ${nick}, my apologies.',
            'PRIVMSG': '${nick} was last seen chatting in ${channel} at ${date}.',
            'JOIN': '${nick} was last seen joining ${channel} at ${date}.',
            'PART': '${nick} was last seen leaving ${channel} at ${date}.',
            'QUIT': '${nick} was last seen quiting IRC at ${date}.',
            'NICK': '${nick} was last seen changing nicks to ${message} at ${date}.'
        },
        response = formats[type || doc.type];

    this.fields.forEach(function(field) {
        var regex = new RegExp('\\${' + field + '}', 'g');
        response = response.replace(regex, doc[field] || "");
    });
    return response;
};