const sqlite = require("sqlite3").verbose()
const database = sqlite.Database("db.sqlite")

class db{
	constructor() {
		this.database = database
		this.database.serialize(() => {
			this.database.run(`CREATE TABLE IF NOT EXISTS users (
				ID INTEGER PRIMARY KEY,
				username VARCHAR(25) UNIQUE,
				password VARCHAR(100)
			)`)
			this.database.run(`CREATE TABLE IF NOT EXISTS chats (
				ID INTEGER PRIMARY KEY,
				userID INTEGER,
				sendFrom INTEGER,
				sendTo INTEGER,
				globalLevel INTEGER,
				message VARCHAR(1000),
				date VARCHAR(100)
			)`)
		})
	}
	addUser(res, obj){
		this.database.serialize(() => {
			this.database.run(`INSERT INTO users (username, password) values ($username, $password)`, obj, (e) => {
				if(e){
					res.send(JSON.stringify({
						"status": 500,
						"message": "Internal Error"
					}))
				}else{
					res.send(JSON.stringify({
						"status": 200,
						"message": "New data added successfully"
					}))
				}
			})
		})
	}
	addMessage(res, obj){
		this.database.serialize(() => {
			this.database.run(`INSERT INTO chats (userID, sendTo, message, date) VALUES ($userID, $sendTo, $msg, $date)`, obj, (e) => {
				if(e){
					res.send(JSON.stringify({
						"status": 500,
						"message": "Internal Error"
					}))
				}else{
					res.send(JSON.stringify({
						"status": 200,
						"message": "New data added successfully"
					}))
				}
			})
		})
	}
	getTotalUsers(res){
		this.database.serialize(() => {
			this.database.get(`SELECT COUNT(*) FROM users`, [], (e, r) => {
				if(e){
					res.send(JSON.stringify({
						"status": 500,
						"message": `Errpr ${e}`
					}))
				}else{
					res.send(JSON.stringify({
						"status": 200,
						"messaage": r
					}))
				}
			})
		})
	}
	getAllMessages(res, idF, idT = 0){
		if(idT == 0){
			this.database.serialize(() => {
				this.database.get(`SELECT * FROM chats WHERE sendTo = 0`, [], (e, r) => {
					if(e){
						res.send(JSON.stringify({
							"status": 500,
							"message": `Errpr ${e}`
						}))
					}else{
						res.send(JSON.stringify({
							"status": 200,
							"messaage": r
						}))
					}
				})
			})
		}else{
			this.database.serialize(() => {
				this.database.get(`SELECT * FROM chats WHERE sendTo = ? AND sendFrom = ?`, [idT, idF], (e, r) => {
					if(e){
						res.send(JSON.stringify({
							"status": 500,
							"message": `Errpr ${e}`
						}))
					}else{
						res.send(JSON.stringify({
							"status": 200,
							"messaage": r
						}))
					}
				})
			})
		}
	}
}

module.exports = db