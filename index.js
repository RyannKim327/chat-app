const express = require("express")
const fs = require("fs")
const parser = require("body-parser")
const path = require("path")
const enc = require("./utils/encrypt")

const app = express()
const body = parser.urlencoded({ extended: true })

const PORT = process.env.PORT | 5000 | 3000

const send = require("./modules/send")
const login = require("./modules/login")

app.use(parser.json())
app.use('/res', express.static(path.join(__dirname + "/audio")))
app.use('/externals', express.static(path.join(__dirname + "/src")))

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
login(app, body)
send(app, body)

app.listen(PORT, () => {
	console.log(`Currently listening to PORT: ${PORT}`)
})