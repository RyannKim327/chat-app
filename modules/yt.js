const { info } = require("console")
const e = require("express")
const fs = require("fs")
const yt = require("youtubei.js")

module.exports = async (msg_id, user, date, title) => {
	let db = JSON.parse(fs.readFileSync("data.json", "utf-8"))
	let youtube = await new yt()
	let result = await youtube.search(title)
	if(result.videos.length > 0){
		if(result.videos[0].id == undefined){
			_json = {
				"id": msg_id,
				"user": "Music",
				"rank": "bot",
				"txt": "Music undefined",
				"time": date.getTime(),
				"reply": -1
			}
			db.chats.push(_json)
		}else{
			const info = result.videos[0]
			if(info.title == undefined){
				_json = {
					"id": msg_id,
					"user": "Music",
					"rank": "bot",
					"txt": "Unknown title",
					"time": date.getTime(),
					"reply": -1
				}
				db.chats.push(_json)
			}else{
				if(fs.existsSync(`${__dirname}/../audio/audio.mp3`)){
					fs.unlink(`${__dirname}/../audio/audio.mp3`, (e) => {})
				}
				let file = fs.createWriteStream('audio/audio.mp3')
				let data = await youtube.download(info.id, {
					format: "mp4",
					quality: "tiny",
					type: "audio",
					audioQuality: "lowest",
					audioBitrate: "550"
				})
				data.pipe(file)
				data.on("end", () => {
					_json = {
						"id": msg_id,
						"user": "Music",
						"rank": "bot",
						"txt": `${info.title}:newline:Requested by ${user}:newline: :reload:`,
						"time": date.getTime(),
						"reply": -1
					}
					db.chats.push(_json)
					db.music = info.title
					fs.writeFileSync("data.json", JSON.stringify(db), "utf-8")
				})
			}
		}
	}
	fs.writeFileSync("data.json", JSON.stringify(db), "utf-8")
}