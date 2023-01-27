const { info } = require("console")
const e = require("express")
const fs = require("fs")
const yt = require("youtubei.js")

module.exports = async (title) => {
	let youtube = await new yt()
	let result = await youtube.search(title)
	let msg = "Something went wrong"
	if(result.videos.length > 0){
		if(result.videos[0].id == undefined){
			msg = "Can't find music"
		}else{
			const info = result.videos[0]
			if(info.title == undefined){
				msg = "No title"
			}else{
				if(fs.existsSync(`${__dirname}/../audio.audio.mp3`)){
					fs.unlink(`${__dirname}/../audio.audio.mp3`, (e) => {})
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
				file.on("end", () => {
					console.log("Done")
					msg = info.title
				})
			}
		}
	}
	return msg
}