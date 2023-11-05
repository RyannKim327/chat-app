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
	res.sendFile(`${__dirname}/src/index2.html`)
})

app.get("/sitemap", (req, res) => {
	res.sendFile(`${__dirname}/sitemap.xml`)
})

app.get("/googled6414eb05fe0d88f.html", (req, res) => {
	res.send(process.env.seo)
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