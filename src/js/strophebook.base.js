class StropheBookBase {

  constructor({ host, port, resource }) {
    
    Strophe.addNamespace("CHATSTATES", "http://jabber.org/protocol/chatstates")
    Strophe.addNamespace('VERSION', 'jabber:iq:version')
    Strophe.SASLPlain.priority = 100

    this.host = host
    this.port = port
    this.resource = resource

    this.roster = new StropheBookRoster()
    this.ui = new StropheBookUI()
    this.util = StropheBookUtilities

    this.connection = new Strophe.Connection(`wss://${host}:${port}/websocket`, {
      mechanisms: [Strophe.SASLPlain]
    })

  }

  connect({ username, password }) {

    return new Promise((accept, reject) => {
      this.username = username
      this.password = password

      this.jid = this.util.usernameToJid({ username, host: this.host, resource: this.resource })
      this.bid = this.util.jidToBid(this.jid)

      this.connection.nextValidRid = rid => this.rid = rid

      this.connection.connect(this.jid, password, (status => this.attach(status).then(accept).catch(reject)).bind(this))
    })

  }

  reconnect() {
    return new Promise((accept, reject) => {
      this.connect({ username: this.username, password: this.password }).then(accept).catch(reject)
    })
  }

  attach(status) {

    return new Promise((accept, reject) => {
      switch(status){
        case Strophe.Status.CONNECTED:

          this.connected = true
          this.sid = this.connection._proto.sid

          this.connection.addHandler(this.onRoster.bind(this), 'jabber:iq:roster', 'iq')
          this.connection.addHandler(this.onChatMessage.bind(this), null, 'message', 'chat')
          this.connection.addHandler(this.onReceived.bind(this), null, 'message')
          this.connection.addHandler(this.onPresence.bind(this), null, 'presence')

          this.connection.sendIQ($iq({
            type: 'get'
          }).c('query', {
            xmlns: 'jabber:iq:roster'
          }))

          this.connection.send($pres())

          accept()
          break
        case Strophe.Status.CONNFAIL:
          reject("Connection failed to establish")
          break
        case Strophe.Status.AUTHFAIL:
          reject("Failed to authenticate")
          break

      }
    })

  }

  login(){

    return new Promise((accept, reject) => {

      if (this.connected && this.connection.authenticated) {
        accept()
        return
      }

      if(this.jid && this.sid && this.rid){
        jsxc.reconnect = true
        jsxc.xmpp.conn.attach(this.jid, this.sid, this.rid, status => this.attach(status).then(accept).catch(reject))
        return
      }

      reject()

    })

  }

  send(message) {
    this.login().then(() => this.connection.send(message)).catch(err => {
      console.log(err)
      this.reconnect().then(() => this.send(message)).catch(console.log)
    })
  }

  sendChat(username, message) {
    const user = this.roster.list[username]
    this.send($msg({
      to: user.bid,
      type: 'chat',
      body: message
    }))
  }

  onRoster(iq) {
    this.roster.receiveRoster(iq)
    return true
  }

  onChatMessage() {
    debugger
  }

  onReceived() {

  }

  onPresence(presence) {

    const $presence = $(presence)
    const ptype = $presence.attr('type')
    const from = $presence.attr('from')
    const jid = Strophe.getBareJidFromJid(from).toLowerCase()
    const bid = this.util.jidToBid(jid)

    if (bid === this.bid || ptype === 'error') {
      return true
    }

    if (ptype === 'subscribe') {

      const approve = this.roster.isFriend(bid)
      this.connection.send($pres({
        to: from,
        type: approve ? 'subscribed' : 'unsubscribed'
      }))
      this.roster.setOnline(bid, true)

    } else if (ptype === 'unavailable' || ptype === 'unsubscribed') {
      this.roster.setOnline(bid, false)
    } else {
      this.roster.setOnline(bid, true)
    }

    return true
  }

}