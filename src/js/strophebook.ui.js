class StropheBookUI {

  constructor() {
    this.container = $("#strophebook-container")
    this.roster = $("#strophebook-roster")
    this.chat = $("#strophebook-chat")
    this.pickuser = $("#pickuser")
  }

  updateRoster() {
    this.roster.empty()
    this.pickuser.empty()
    const list = StropheBook.roster.list
    Object.keys(list).forEach(key => {
      const user = list[key]
      this.roster.append(`<p>${key}: ${user.online ? "Online" : "Offline"}</p>`)
      this.pickuser.append(`<option value=${key}>${key}</option>`)
    })
  }

}