const fs = require("fs")
const enc = require("./../utils/encrypt")
const database = require("./../database/db")

const num = (nth) => {
	let pos = ""
	if(nth >= 10 && nth < 20){
		pos = `${nth}th`
	}else{
		switch(nth){
			case 1:
				pos = `${nth}st`
			break
			case 2:
				pos = `${nth}nd`
			break
			case 3:
				pos = `${nth}rd`
			break
			default:
				pos = `${nth}th`
		}
	}
	return pos
}

module.exports = (app, body) => {	
	app.post("/login", body, (req, res) => {
		let date = new Date()
		let user = req.body.username.replace(/\s/gi, "_")
		let pass = enc(req.body.password)
		let json = {
			exists: false
		}
		let usr = user.toLowerCase()
		let db = new database()
		if(db.users[usr] == undefined){
			let id = db.getTotalUsers(res, {
				"$username": user,
				"$password": pass
			})
			db.addUser(res, )
			db.users[usr] = {
				id,
				username: user,
				password: pass,
				rank: "observant",
				pts: 0
			}
			db.chats.push({
				id: msg_id,
				user: "Welcome Bot",
				txt: `Welcome to Chatapp ${user}, you're the ${num(id == 1 ? 1 : (id + 1))} member here. Enjoy your staying here.`,
				time: date.getTime(),
				reply: reply_id
			})
			fs.writeFileSync('data.json', JSON.stringify(db), "utf-8")
			json = {
				exists: true,
				id,
				user
			}
		}else{
			let db2 = JSON.parse(fs.readFileSync("data.json", "utf-8"))
			if(db2.users[usr]['password'] == pass){
				let id = db2.users[usr]['id']
				let user = db2.users[usr]['username']
				json = {
					exists: true,
					id,
					user
				}
			}
		}
		res.send(JSON.stringify(json))
	})

}