class StropheBookRoster {

  constructor() {
    
    this.stale = true
    this.list = {} // id: { username, bid, subscription }
    this.externalList = [] // ["username", "username2"]
    this.xmppList = [] // ["username", "username2"]

  }

  add(user, updateRoster) {

    if(updateRoster){
      StropheBook.connection.sendIQ($iq({
        type: 'set'
      }).c('query', {
        xmlns: 'jabber:iq:roster'
      }).c('item', {
        jid: user.bid,
        name: user.name
      }))
    }

    if(user.sub !== "both"){
      StropheBook.connection.send($pres({
        to: user.bid,
        type: 'subscribe'
      }))
    }

    this.list[user.name] = { bid: user.bid, sub: user.sub }

  }

  remove(name) {

    delete this.list[name]

  }

  empty() {

    this.list = {}

  }

  sync() {

    let currentUserList = Object.keys(this.list) // state list
    this.externalList.forEach((username => {
      const userIndex = currentUserList.indexOf(username)
      if(userIndex < 0){
        this.add({
          name: username,
          bid: StropheBook.util.jidToBid(StropheBook.util.usernameToJid(username)),
          sub: false,
          online: false
        }, this.xmppList.indexOf(username) < 0)
      } else {
        currentUserList.splice(userIndex, 1)
      }
    }).bind(this))

    currentUserList.forEach(this.remove.bind(this))

    StropheBook.ui.updateRoster()

    this.stale = false

  }

  getByBid(bid) {
    return Object.keys(this.list).filter(key => this.list[key].bid === bid)[0]
  }

  isFriend(bid) {
    return this.getByBid(bid) ? true : false
  }

  setOnline(bid, status) {
    this.list[this.getByBid(bid)].online = status
    StropheBook.ui.updateRoster()
  }

  receiveRoster(iq) {

    const $iq = $(iq)
    const sender = $iq.attr('from')

    if (!this.stale || sender && sender !== StropheBook.bid) {
      return true
    }

    $iq.find('item').each(((index, elem) => {

      const $elem = $(elem)
      const jid = $elem.attr('jid')
      const name = $elem.attr('name')
      const bid = StropheBook.util.jidToBid(jid)
      const sub = $elem.attr('subscription')

      sub === 'remove' || this.externalList.indexOf(name) < 0 ? this.remove(name) : this.add({ name, bid, sub })

      if(this.xmppList.indexOf(name) < 0){
        this.xmppList.push(name)
      }

    }).bind(this))

    this.sync()

    return true

  }

}