const express = require("express")
const fs = require("fs")
const parser = require("body-parser")

const app = express()
const body = parser.urlencoded({ extended: true })

const PORT = process.env.PORT | 5000 | 3000

app.use(parser.json())

app.get("/", (req, res) => {
	res.sendFile(`${__dirname}/index.html`)
})

app.post("/login", body, (req, res) => {
	let db = JSON.parse(fs.readFileSync("data.json", "utf-8"))
	let user = req.body.username
	let pass = req.body.password
	let json = {
		exists: false
	}
	if(db.users[user.toLowerCase()] == undefined){
		let id = Object.keys(db.users).length || 1
		db.users[user.toLowerCase()] = {
			id,
			username: user,
			password: pass
		}
		fs.writeFileSync('data.json', JSON.stringify(db), "utf-8")
		json = {
			exists: true,
			id,
			user
		}
	}else{
		let db2 = JSON.parse(fs.readFileSync("data.json", "utf-8"))
		let usr = user.toLowerCase()
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

app.listen(PORT, () => {
	console.log(`Currently listening to PORT: ${PORT}`)
})