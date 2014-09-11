var u = require('util')
  , irc = require('irc');

var clients = [];
var games = {
  '1v1': {
    name: '1v1',
    players: [],
    maxplayers: 2
  },
  '2v2': {
    name: '2v2',
    players: [],
    maxplayers: 4
  },
  'tdm': {
    name: 'tdm',
    players: [],
    maxplayers: 8
  },
  'ctf': {
    name: 'ctf',
    players: [],
    maxplayers: 8
  },
  'ffa': {
    name: 'ffa',
    players: [],
    minplayers: 3,
    maxplayers: 32
  }
};

var config = {
  channels: ['#promode.ru'],
  server: 'irc.quakenet.org',
  botname: 'wintermute-bot'
};

function getWaitingGames() {
  var _games = {};
  for (var mode in games) {
    if (games[mode].players.length) {
      _games[mode] = games[mode];
    }
  }
  return _games;
}

function hasPlayer(name, mode) {
  return games[mode].players.indexOf(name) > -1;
}

function addPlayer(to, name, mode) {
  var say
    , game = games[mode];

  game.players.push(name);

  if (game.players.length == 1) {
    say = u.format('Added %s in the %s queue. %d player needed.',
      name, mode, game.maxplayers - game.players.length
    );
    console.log(say);
    bot.say(to, say);
  } else if (game.players.length == 2) {
    var playerNames = game.players.join(', ');
    say = u.format('%s pickup complete. %s please join free server.',
      mode, playerNames
    );
    game.players.length = 0;
    console.log(say);
    bot.say(to, say);
  }
}

function removePlayer(to, name, mode) {
  var say
    , game = games[mode]
    , _players = [];

  for (var i in game.players) {
    if (game.players[i] !== name) {
      _players.push(game.players[i])
    }
  }

  if (_players.length == 1) {
    say = u.format('Removed %s from the %s queue. %d players needed.',
      name, game.name, game.maxplayers - _players.length
    );
    console.log(say);
    bot.say(to, say);
  }

  if (_players.length == 0) {
    say = u.format('Removed all players from the %s queue.', mode);
    console.log(say);
    bot.say(to, say);
  }

  games[mode].players = _players;
}

function removeClient(name) {
  var _clients = [];
  var numclients = clients.length;
  for (var i = 0; i < numclients; i++) {
    if (clients[i] != name) {
      _clients.push(clients[i]);
    }
  }
  clients = _clients;
}

var bot = new irc.Client(config.server, config.botname, {
  debug: true,
  channels: config.channels
});

bot.addListener('message', function(from, to, message) {
  console.log('%s => %s: %s', from, to, message);

  var say;

  if (to.match(/^[#&]/)) {

    // hello
    if (message.match(/hello/i)) {
      say = u.format('Hi, %s! How are you?', from);
      console.log(say);
      bot.say(to, say);
    }

    // what games are exist
    if (message.match(/\?\?/)) {
      var _games = getWaitingGames();
      say = u.format('There are %s games waiting for players', Object.keys(_games).length);
      console.log(say);
      bot.say(to, say);

      for (var mode in _games) {
        var game = _games[mode];
        console.log('game', game);
        say = u.format('%s: %s - need %d more players!',
          game.name, game.players.join(', '), game.maxplayers - game.players.length
        );
        console.log(say);
        bot.say(to, say);
      }
    }

    // add into 1v1
    if (message.match(/\+1v1/i)) {
      if (!hasPlayer(from, '1v1')) {
        addPlayer(to, from, '1v1');
      } else {
        say = u.format('%s, you are already into 1v1 game', from);
        console.log(say);
        bot.say(to, say);
      }
    }

    // add into 2v2
    if (message.match(/\+2v2/i)) {
      if (!hasPlayer(from, '2v2')) {
        addPlayer(to, from, '2v2');
      } else {
        say = u.format('%s, you are already into 2v2 game', from);
        console.log(say);
        bot.say(to, say);
      }
    }

    // remove from all games
    if (message.match(/\-\-/)) {
      console.log('Removing %s from all games.', from)
      for (var mode in games) {
        var game = games[mode];
        removePlayer(to, from, game.name);
      }
    }

    // remove from 1v1
    if (message.match(/\-1v1/i)) {
      removePlayer(to, from, '1v1');
    }

    // remove from 2v2
    if (message.match(/\-2v2/i)) {
      removePlayer(to, from, '2v2');
    }
  }
});

bot.addListener('pm', function(nick, message) {
  console.log('Got private message from %s: %s', nick, message);
});

bot.addListener('join', function(channel, who) {
  console.log('%s has joined %s', who, channel);
  clients.push(who);
});

bot.addListener('part', function(channel, who, reason) {
  console.log('%s has left %s: %s', who, channel, reason);
  removeClient(who);
});

bot.addListener('kick', function(channel, who, by, reason) {
  console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
  removeClient(who);
});

bot.addListener('error', function(message) {
  console.error('ERROR: %s: %s', message.command, message.args.join(' '));
});
