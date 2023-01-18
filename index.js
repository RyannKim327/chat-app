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
	console.log("Called " + JSON.stringify(req.body))
	let user = req.body.username
	let pass = req.body.password
	console.log(user + " " + pass)
	let json = {
		id: 0,
		user
	}
	res.send(JSON.stringify(json))
})

app.listen(PORT, () => {
	console.log(`Currently listening to PORT: ${PORT}`)
})