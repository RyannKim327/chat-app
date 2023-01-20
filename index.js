const express = require("express")
const fs = require("fs")
const parser = require("body-parser")

const enc = require("./utils/encrypt")

const app = express()
const body = parser.urlencoded({ extended: true })

const PORT = process.env.PORT | 5000 | 3000

app.use(parser.json())

app.get("/", (req, res) => {
	res.sendFile(`${__dirname}/index.html`)
})

app.get("/check", (req, res) => {
	let db = JSON.parse(fs.readFileSync("data.json", "utf-8"))
	let lists = db.chats
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
			password: pass
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
	let user = req.body.username
	let txt = req.body.txt
	let json = {
		result: true
	}
	let data = {
		user,
		txt
	}
	db.chats.push(data)
	fs.writeFileSync("data.json", JSON.stringify(db), "utf-8")
	return json
})

app.listen(PORT, () => {
	console.log(`Currently listening to PORT: ${PORT}`)
})