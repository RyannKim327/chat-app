const bodyParser = require("body-parser")
const body_parser = require("body-parser")
const express = require("express")
const fs = require("fs")

const body = bodyParser.urlencoded({ extended: false })

const app = express()
const PORT = process.env.PORT || 5000 || 3000
const database = JSON.parse(fs.readFileSync("data.json", "utf-8"))

let pos = (num) => {
	let t = num % 100
	let o = num % 10
	let a = num
	if(t >= 10 && t < 20){
		a += `th`
	}else{
		switch(o){
			case 1:
				a += `st`
			break
			case 2:
				a += `nd`
			break
			case 3:
				a += `rd`
			break
			default:
				a += `th`
			break
		}
	}
	return a
}

app.get("/", (req, res) => {
	res.sendFile(`${__dirname}/index.html`)
})

app.post("/send", body, (req, res) => {
	let data = req.body

	if(data.studentid == "")
		return res.send("The student ID is missing")

	let grading = "1"
	let exam = 0
	
	if(data.grading != "")
		grading = data.grading
	
	if(data.exam != "")
		exam = parseInt(data.exam)
	
	let quizes = []
	let qtotal = []
	let acts = []
	let atotal = []
	let quiz = parseInt(data.quiz)
	let activity = parseInt(data.activity)
	for(let i = 0; i < quiz; i++){

		let q = parseInt(data[`quiz${i}`])
		let qt = data[`qtotal${i}`]
		quizes.push(q)
		if(qt == undefined || qt == null){
			qtotal.push(10)
		}else{
			qtotal.push(parseInt(qt))
		}
	}
	
	for(let i = 0; i < activity; i++){
		let a = parseInt(data[`act${i}`])
		let at = parseInt(data[`atotal${i}`])

		acts.push(a)
		if(at == undefined || at == null){
			atotal.push(10)
		}else{
			atotal.push(at)
		}

	}

	if(database[data.studentid] == undefined){
		database[data.studentid] = {}
	}
	database[data.studentid][`${pos(grading)}_grading`] = {
		quiz:{
			score: quizes,
			total: qtotal
		},
		activity: {
			score: acts,
			total: atotal
		},
		exam
	}
	fs.writeFileSync("data.json", JSON.stringify(database), "utf-8")
	res.json({
		resultCode: 200,
		message: "Data is now stored to the server. Thank you",
		redirect: "/index"
	})
})

app.listen(PORT, () => {
	console.log(`Listening to PORT ${PORT}`)
})

module.exports = app