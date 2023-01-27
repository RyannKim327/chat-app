const fs = require("fs")
const yt = require("./yt")

let ranks = (score) => {
	if(score < 100){
		return "observant"
	}else if(score < 250){
		return "shy"
	}else if(score < 500){
		return "lowkey"
	}else if(score < 1000){
		return "talkative"
	}else{
		return "sociative"
	}
}


module.exports = (app, body) => {
	app.post("/send", body, async (req, res) => {
		let date = new Date()
		let db = JSON.parse(fs.readFileSync("data.json", "utf-8"))
		let id = parseInt(req.body.id)
		let user = req.body.username
		let txt = req.body.txt
		let reply_id = -1
		let bad = /(tanga|bobo|gago|ulol|olol|ulul|olul|tangina)\b/i
		let msg_id = db.chats.length + 1
		let json = {}
		if(req.body.reply_id != undefined)
			reply_id = req.body.reply_id
		if(db.users[user.toLowerCase()] == undefined){
			json = {
				exists: false
			}
		}else{
			if(txt.startsWith("!")){
				let play = /!play ([\w\W]+)/i
				if(play.test(txt)){
					let music = await yt(txt.match(play)[1])
					if(music != undefined){
						_json = {
							"id": msg_id,
							"user": "Music",
							"rank": "bot",
							"txt": music,
							"time": date.getTime(),
							"reply": -1
						}
						db.chats.push(_json)
					}
				}
			}
			if(txt.startsWith("!") && id == 0){
				let ban = /!ban ([\w]+)/i
				let unban = /!unban ([\w]+)/i
				let mods = /!mod ([\w]+)/i
				if(/!clear/i.test(txt)){
					_json = [
						{
							"id": 1,
							"user": "Welcome",
							"rank": "bot",
							"txt": "Greetings!!!:newline::tab:So first of all, thank you for visiting this nonsense platform, but still I'm hoping that one of these days, I will going to improve this. BTW, please avoid some spams, for those also who wanted to see the chats of others, I only gather the last 25 latest messages from different people, so that, expect that this message will be gone soon.",
							"time": date.getTime(),
							"reply": -1
						}
					]
					db.chats = _json
				}else if(ban.test(txt)){
					let usr = txt.match(ban)[1]
					if(!db.ban.includes(usr)){
						db.ban += `${usr.toLowerCase()}, `
					}
				}else if(unban.test(txt)){
					let usr = txt.match(unban)[1]
					if(db.ban.includes(usr)){
						db.ban = db.ban.replace(`${usr.toLowerCase()}, `, "")
						let data = {
							"id": msg_id,
							"user": "Rule Regulator",
							"rank": "bot",
							"txt": `User ${usr} is now unbanned, you may now chat again with us.`,
							"time": date.getTime(),
							"reply": -1
						}
						db.chats.push(data)
					}
				}else if(mods.test(txt)){
					let usr = txt.match(mods)[1]
					let _usr = db.users[usr.toLowerCase()]
					if(_usr == undefined){
						let data = {
							"id": msg_id,
							"user": "Ranker",
							"rank": "bot",
							"txt": `User doesn't exists to the database`,
							"time": date.getTime(),
							"reply": -1
						}
						db.chats.push(data)
					}else{
						if(_usr.rank != "admin" && _usr.rank != "moderator"){
							_usr.rank = "moderator"
							_usr.pts = -18
							let data = {
								"id": msg_id,
								"user": "Ranker",
								"rank": "bot",
								"txt": `User ${usr} is now promoted as a moderator.`,
								"time": date.getTime(),
								"reply": -1
							}
							db.chats.push(data)
						}else{
							let data = {
								"id": msg_id,
								"user": "Ranker",
								"rank": "bot",
								"txt": `The user can't be promoted.`,
								"time": date.getTime(),
								"reply": -1
							}
							db.chats.push(data)
						}
					}
				}
				json = {
					exists: true
				}
			}else{
				if(bad.test(txt) && id != 0){
					let data = {
						"id": msg_id,
						"user": "Rule Regulator",
						"rank": "bot",
						"txt": `User ${user} is automatically muted for the moment, please watch your words to avoid this issue.`,
						"time": date.getTime(),
						"reply": -1
					}
					db.ban += `${user.toLowerCase()}, `
					db.chats.push(data)
				}else if(!db.ban.includes(user.toLowerCase())){
					if(db.users[user.toLowerCase()].rank != "admin" && db.users[user.toLowerCase()].rank != "moderator"){
						let r = db.users[user.toLowerCase()].rank
						db.users[user.toLowerCase()].pts += 1
						db.users[user.toLowerCase()].rank = ranks(db.users[user.toLowerCase()].pts)
						if(r != db.users[user.toLowerCase()].rank){
							let data = {
								"id": msg_id,
								"user": "Ranker",
								"rank": "bot",
								"txt": `Congrats ${user} you are now promoted as ${db.users[user.toLowerCase()].rank} user`,
								"time": date.getTime(),
								"reply": -1
							}
							db.chats.push(data)
						}
					}
					json = {
						exists: true
					}
					let data = {
						"id": msg_id,
						user,
						txt,
						"time": date.getTime(),
						"reply": reply_id
					}
					db.chats.push(data)
				}
			}
		}
		fs.writeFileSync("data.json", JSON.stringify(db), "utf-8")
		res.send(JSON.stringify(json))
	})
	
}