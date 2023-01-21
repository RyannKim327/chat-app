const express = require("express")
const fs = require("fs")
const parser = require("body-parser")
const path = require("path")
const enc = require("./utils/encrypt")
const e = require("express")

const app = express()
const body = parser.urlencoded({ extended: true })

const PORT = process.env.PORT | 5000 | 3000

app.use(parser.json())
app.use('/static', express.static(path.join(__dirname + "/audio")))
app.use('/ext', express.static(path.join(__dirname + "/src")))

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

app.get("/", (req, res) => {
	res.sendFile(`${__dirname}/src/index.html`)
})

app.get("/check", (req, res) => {
	let db = JSON.parse(fs.readFileSync("data.json", "utf-8"))
	let lists = db
	let json = {
		"lists": lists
	}
	res.send(JSON.stringify(json))
})

app.post("/login", body, (req, res) => {
	let db = JSON.parse(fs.readFileSync("data.json", "utf-8"))
	let user = req.body.username.replace(/\s/gi, "_")
	let pass = enc(req.body.password)
	let json = {
		exists: false
	}
	let usr = user.toLowerCase()
	if(db.users[usr] == undefined){
		let id = Object.keys(db.users).length || 1
		db.users[usr] = {
			id,
			username: user,
			password: pass,
			rank: "observant",
			pts: 0
		}
		db.chats.push({
			user: "Welcome Bot",
			txt: `Welcome to Chatapp ${user}`
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

app.post("/send", body, (req, res) => {
	let db = JSON.parse(fs.readFileSync("data.json", "utf-8"))
	let id = parseInt(req.body.id)
	let user = req.body.username
	let txt = req.body.txt
	let bad = /(tanga|bobo|gago|ulol|olol|ulul|olul|tangina)\b/i
	let json = {}
	if(db.users[user.toLowerCase()] == undefined){
		json = {
			exists: false
		}
	}else{
		if(txt.startsWith("!") && id == 0){
			let ban = /!ban ([\w]+)/i
			let unban = /!unban ([\w]+)/i
			if(txt == "!clear"){
				_json = [
					{
						"user": "Welcome",
						"rank": "bot",
						"txt":"Hello Guys!!!"
					},{
						"user": "Welcome",
						"rank": "bot",
						"txt": "So first of all, thank you for visiting this nonsense platform, but still I'm hoping that one of these days, I will going to improve this. BTW, please avoid some spams, for those also who wanted to see the chats of others, I only gather the last 25 latest messages from different people, so that, expect that this message will be gone soon."
					}
				]
				db.chats = _json
			}else if(ban.test(txt)){
				let usr = txt.match(ban)[1]
				db.ban += `${usr.toLowerCase()}, `
			}else if(unban.test(txt)){
				let usr = txt.match(unban)[1]
				db.ban = db.ban.replace(`${usr.toLowerCase()}, `, "")
				let data = {
					"user": "Rule Regulator",
					"rank": "bot",
					"txt": `User ${usr} is now unbanned, you may now chat again with us.`
				}
				db.chats.push(data)
			}
			json = {
				exists: true
			}
		}else{
			if(bad.test(txt) && id != 0){
				let data = {
					"user": "Rule Regulator",
					"rank": "bot",
					"txt": `User ${user} is automatically muted for the moment, please watch your words to avoid this issue.`
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
							"user": "Ranker",
							"rank": "bot",
							"txt": `Congrats ${user} you are now promoted as ${db.users[user.toLowerCase()].rank} user`
						}
						db.chats.push(data)
					}
				}
				json = {
					exists: true
				}
				let data = {
					user,
					txt
				}
				db.chats.push(data)
			}
		}
	}
	fs.writeFileSync("data.json", JSON.stringify(db), "utf-8")
	res.send(JSON.stringify(json))
})

app.listen(PORT, () => {
	console.log(`Currently listening to PORT: ${PORT}`)
})