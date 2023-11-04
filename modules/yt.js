const axios = require("axios")
const fs = require("fs")
const YoutubeMusicApi = require('youtube-music-api')
const yt = new YoutubeMusicApi()
const ytdl = require('ytdl-core');
const ffmpeg = require('@ffmpeg-installer/ffmpeg')
const ffmpegs = require('fluent-ffmpeg')
ffmpegs.setFfmpegPath(ffmpeg.path)

module.exports = async (msg_id, user, date, title, oldM) => {
	const json = JSON.parse(fs.readFileSync("data.json"))
	const name = `${__dirname}/../audio/${title}.mp3`
	try{
		const file = fs.createWriteStream(`audio/${title}.mp3`)
		await yt.initalize()
		let search = await yt.search(title.replace(/[^\w\s]/gi, ''))
		if(search.content.length <= 0){
			return json.chats.append({
				"id": msg_id,
				"user": "Music",
				"rank": "bot",
				"txt": "Music not found, please check your query add some singer on your title",
				"time": date.getTime(),
				"reply": -1
			})
		}
		if(search.content[0].videoID == undefined){
			return json.chats.append({
				"id": msg_id,
				"user": "Music",
				"rank": "bot",
				"txt": "Music not found, please check your query add some singer on your title",
				"time": date.getTime(),
				"reply": -1
			})
		}
		const url  = `https://www.youtube.com/watch?v=${music.content[0].videoId}`
		const strm = await ytdl(url, {
			"quality"
		})
	}catch(e){
		return json.chats.append({
			"id": msg_id,
			"user": "Music",
			"rank": "bot",
            "txt": e.message,
            "time": date.getTime(),
            "reply": -1
		})
	}
}