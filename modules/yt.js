const axios = require("axios")
const fs = require("fs")
const YoutubeMusicApi = require('youtube-music-api')
const yt = new YoutubeMusicApi()
const ytdl = require('ytdl-core');
const ffmpeg = require('@ffmpeg-installer/ffmpeg')
const ffmpegs = require('fluent-ffmpeg')
ffmpegs.setFfmpegPath(ffmpeg.path)

module.exports = async (msg_id, user, date, title, oldM) => {
	try{
		await yt.initalize()
		let search = await yt.search(title.replace(/[^\w\s]/gi, ''))
		if(search.content.length <= 0){
			const json = JSON.parse(fs.readFileSync("data.json"))
			json.chats[msg_id - 1] = {
				"id": msg_id,
				"user": "Music",
				"rank": "bot",
				"txt": "Music not found, please check your query add some singer on your title",
				"time": date.getTime(),
				"reply": -1
			}
			return fs.writeFileSync("data.json", JSON.stringify(json), "utf-8")
		}
		if(search.content[0].videoId == undefined){
			const json = JSON.parse(fs.readFileSync("data.json"))
			json.chats[msg_id - 1] = {
				"id": msg_id,
				"user": "Music",
				"rank": "bot",
				"txt": "Music not found, please check your query add some singer on your title",
				"time": date.getTime(),
				"reply": -1
			}
			return fs.writeFileSync("data.json", JSON.stringify(json), "utf-8")
		}
		const url  = `https://www.youtube.com/watch?v=${search.content[0].videoId}`
		const strm =  ytdl(url, {
			"quality": "lowest"
		})
		const info = await ytdl.getInfo(url)
		fs.createWriteStream(`audio/${info.videoDetails.title.replace(/\s/gi, "_")}.mp3`)
		const name = `${__dirname}/../audio/${info.videoDetails.title.replace(/\s/gi, "_")}.mp3`
		ffmpegs(strm).audioBitrate(96).save(name).on("end", () => {
			const n2 = `${__dirname}/../audio/${oldM}.mp3`
			const json = JSON.parse(fs.readFileSync("data.json"))
			if(fs.existsSync(n2)){
				fs.unlink(n2, (e) => {})
			}
			json.chats[msg_id - 1] = {
				"id": msg_id,
				"user": "Music",
				"rank": "bot",
				"txt": `A music requested by ${user} was now updated to ${info.videoDetails.title} :reload:`,
				"time": date.getTime(),
				"reply": -1
			}
			json.music = info.videoDetails.title.replace(/\s/gi, "_")
			return fs.writeFileSync("data.json", JSON.stringify(json), "utf-8")
		})
	}catch(e){
		const json = JSON.parse(fs.readFileSync("data.json"))
		json.chats[msg_id - 1] = {
			"id": msg_id,
			"user": "Music",
			"rank": "bot",
			"txt": e.message,
			"time": date.getTime(),
			"reply": -1
		}
		console.error(e)
		return fs.writeFileSync("data.json", JSON.stringify(json), "utf-8")
	}
}