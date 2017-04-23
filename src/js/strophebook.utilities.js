window.StropheBookUtilities = {
  
  usernameToJid: ({ username, host, resource }) => `${username}@${host}/${resource}`,

  jidToBid: (jid) => Strophe.unescapeNode(Strophe.getBareJidFromJid(jid).toLowerCase())

}