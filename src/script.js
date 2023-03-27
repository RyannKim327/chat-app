let id = (_name_) => {
	return document.getElementById(_name_)
}

let credentials = {
	id: -1,
	username: ""
}
let reply_id = -1
let refresh = 0
let _db = {}
let users_db
let loopAllowance = 5
let music = ""

if(getCookie("username") != ""){
	let _login = id("login")
	let _chat = id("chat")
	credentials.username = getCookie("username")
	credentials.id = parseInt(getCookie("id"))
	_login.style.display = "none"
	_login.innerHTML = ""
	_chat.style.display = "block"
	id("cform").style.display = "block"
	id("myname").textContent = `Welcome ${credentials.username}`
	input()
	startFetch()
	changeAudio()
}else{
	check()
}
function check(){
	let username = id("username")
	let password = id("password")
	let _login = id("_login")
	let user = username.value
	let pass = password.value
	if(user.length >= 5 && pass.length >= 8){
		_login.type = "submit"
	}else{
		_login.type = "hidden"
	}
}

async function login(){
	let username = id("username")
	let password = id("password")
	let _login = id("login")
	let _chat = id("chat")
	let user = username.value
	let pass = password.value

	if(user.length >= 5 && pass.length >= 8){
		let json = {
			"username": user,
			"password": pass
		}
		console.log(json)
		await fetch('login', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(json)
		}).then(async r => {
			let data = await r.json()
			if(data.exists){
				credentials.username = data.user
				credentials.id = data.id
				_login.style.display = "none"
				_login.innerHTML = ""
				_chat.style.display = "block"
				id("cform").style.display = "block"
				id("myname").textContent = `Welcome ${data.user}`
				setCookie("username", data.user)
				setCookie("id", data.id)
				input()
				startFetch()
				changeAudio()
			}else{
				alert("Wrong username or password.")
			}
		}).then(data => {
			console.log(data)
		}).catch(e => {})
	}
}
async function startFetch(){
	if(credentials.id == 0){
		let _login = id("login")
		let _chat = id("chat")
		_login.style.display = "none"
		_chat.style.display = "block"
	}
	try{
		await fetch('/check').then(r => r.json()).then(get => {
			let li = ""
			let l = get.lists.chats
			music = get.lists.music
			let usrRank = get.lists.users[credentials.username.toLowerCase()].rank
			users_db = get.lists.users
			_db = l
			let audio = id("audio")
			let dur = audio.currentTime
			let secs = Math.floor(dur % 60)
			let mins = Math.floor(dur / 60)
			dur %= 60
			let hrs = Math.floor(dur / 60)
			id("music_title").textContent = `Now Playing [${hrs} : ${mins} : ${secs}]: ${get.lists.music.replace(/_/gi, " ")}`
			setDur()
			let j = 0
			for(let i = l.length - 1; i >= 0 && j < 25; i--){
				let gex = /https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
				let msg = l[i].txt.replace("\<", "&lt;").replace("\>", "&gt;")
				let user = l[i].user
				let date = new Date(l[i].time)
				let time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
				let ranks = ""
				let odd = ((i % 2) == 0) ? "odd" : "even"
				if(get.lists.users[user.toLowerCase()] != undefined){
					ranks = `[${get.lists.users[user.toLowerCase()].rank}]`
				}
				if(l[i].rank != undefined){
					ranks = `[${l[i].rank}]`
				}
				if(gex.test(msg)){
					msg = msg.replace(msg.match(gex)[0] ,`<a href="${msg.match(gex)[0]}" target="_blank">${msg.match(gex)[0]}</a>`)
				}
				if(ranks.includes("bot")){
					msg = msg.replace(/:newline:/g, "<br>").replace(/:tab:/g, "&emsp;").replace(/:reload:/gi, "<label onclick='changeAudio()' class='rload'>Reload</label>")
				}
				if(l[i].reply < 0){
					if(credentials.username.toLowerCase() == user.toLowerCase()){
						li += `<p class="chats you" title="${time}" onclick="reply_it(${l[i].id})">${msg}</p>`
					}else{
						li += `<p class="name">${user} ${ranks}: <label class="time">[${time}]</labe></p><p class="chats" title="${time}" onclick="reply_it(${l[i].id})">${msg}</p>`
					}
				}else{
					let r_id = l[i].reply
					if(credentials.username.toLowerCase() == user.toLowerCase()){
						li += `<p class="name nreply">: <label class="time">[${time}]</label> ${user} ${ranks} replied to ${l[r_id - 1].user}</p><p class="reply ryou">${l[r_id - 1].txt.replace("\<", "&lt;").replace("\>", "&gt;").replace(/:newline:/g, "<br>").replace(/:tab:/g, "&emsp;").replace(/:reload:/gi, "<label onclick='changeAudio()' class='rload'>Reload</label>")}</p><p class="chats you _reply" title="${time}" onclick="reply_it(${l[i].id})">${msg}</p>`
					}else{
						li += `<p class="name">${user} ${ranks} replied to ${l[r_id - 1].user}: <label class="time">[${time}]</label></p><p class="reply">${l[r_id - 1].txt.replace("\<", "&lt;").replace("\>", "&gt;").replace(/:newline:/g, "<br>").replace(/:tab:/g, "&emsp;").replace(/:reload:/gi, "<label onclick='changeAudio()' class='rload'>Reload</label>")}</p><p class="chats _reply" title="${time}" onclick="reply_it(${l[i].id})">${msg}</p>`
					}
				}
				j++
			}
			if(l.length < 1){
				if((l[l.length - 2].user == credentials.username && l[l.length - 1].user == credentials.username) && (usrRank != "admin" && usrRank != "moderator")){
					id("chats").style.display = "none"
				}else{
					id("chats").style.display = "inline"
				}
			}
			li += ""
			id("lists").innerHTML = li
		}).catch(e => {
			console.log(`${e}`)
		})
	}catch(e){}
	if(_db == {}){
		id("chats").innerHTML = "<div id='loading'> </div>"
	}
}
function input(){
	let chat = id("chats")
	chat.addEventListener("keyup", (event) => {
		if(event.keyCode === 13){
			if(/!theme ([\w]+)/.test(chat.value)){
				setThemes(chat.value.match(/!theme ([\w]+)/)[1])
				chat.value = ""
			}else{
				send()
				chat.value = ""
			}
		}
	})
}
async function send(){
	let _id = credentials.id
	let txt = id("chats").value
	let username = credentials.username
	if(txt.length > 1){
		let json = {
			id: _id,
			username,
			txt,
			reply_id
		}
		await fetch("/send", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(json)
		}).then(async r => {
			let data = await r.json()
			if(!data.exists){
				setCookie("username", "")
				setCookie("id", -1)
				let _login = id("login")
				let _chat = id("chat")
				_login.style.display = "block"
				_chat.style.display = "none"
				id("cform").style.display = "none"
				credentials = {
					id: -1,
					username: ""
				}
			}
		}).catch(e => {})
	}
	txt.value = ""
	reply_id = -1
	id("reply").textContent = ""
	id("reply").style.display = "none"
}
function reply_it(_msg_id_){
	reply_id = _msg_id_
	id("reply").textContent = `${_db[reply_id - 1].user}: ${_db[reply_id - 1].txt.replace("\<", "&lt;").replace("\>", "&gt;").replace(/:newline:/g, "").replace(/:tab:/g, "").replace(/:reload:/gi, "").substring(0, 500)}`
	id("reply").style.display = "block"
	id("chats").focus()
}
function clearReply(){
	reply_id = -1
	id("reply").textContent = ""
	id("reply").style.display = "none"
	id("chats").focus()
}
function logout(){
	setCookie("username", "")
	setCookie("id", -1)
	credentials = {
		username: "",
		id: -1
	}
	id("audio").pause()
	id("audio").currentTime = 0
	location.reload()
}

function audio(){
	let au = id("audio")
	if(au.style.display == "none"){
		au.style.display = "block"
	}else{
		au.style.display = "none"
	}
}

let setColors = (theme_name) => {
	theme_name = theme_name.toLowerCase()	
	if(colors[theme_name] != undefined){
		const root = document.querySelector(":root").style
		root.setProperty("--body-background", `${colors[theme_name]["body-background"]}`)
		root.setProperty("--body-color", `${colors[theme_name]["body-color"]}`)
		root.setProperty("--base-background", `${colors[theme_name]["base-background"]}`)
		root.setProperty("--reply-background", `${colors[theme_name]["reply-background"]}`)
		root.setProperty("--reply-color", `${colors[theme_name]["reply-color"]}`)
		root.setProperty("--input-background", `${colors[theme_name]["input-background"]}`)
		root.setProperty("--input-color", `${colors[theme_name]["input-color"]}`)
		root.setProperty("--chat-color", `${colors[theme_name]["chat-color"]}`)
		root.setProperty("--you-background", `${colors[theme_name]["you-background"]}`)
		root.setProperty("--you-color", `${colors[theme_name]["you-color"]}`)
	}
}

function setThemes(theme_name){
	setCookie("theme", theme_name)
	setColors(theme_name)
}

window.onload = () => {
	setColors(getCookie("theme"))
	let audio = document.getElementById("audio")
	let isLooping = false
	audio.src = `/res/${music}.mp3`
	audio.load()
	let dur = audio.currentTime
	let secs = Math.floor(dur % 60)
	let mins = Math.floor(dur / 60)
	dur %= 60
	let hrs = Math.floor(dur / 60)
	id("music_title").textContent = `Now Playing [${hrs} : ${mins} : ${secs}]: ${music.replace(/_/gi, " ")}`
	setDur()
	id("play").innerHTML = (audio.paused) ? "<i class='fa-solid fa-play fa-2xs'></i>" : "<i class='fa-solid fa-pause fa-2xs'></i>"
	id("play").onclick = () => {
		if(audio.paused){
			audio.play()
			id("play").innerHTML = "<i class='fa-solid fa-pause fa-2xs'></i>"
		}else{
			audio.pause()
			id("play").innerHTML = "<i class='fa-solid fa-play fa-2xs'></i>"
		}
		if(isLooping && loopAllowance <= 0){
			loopAllowance = 5
		}
	}
	id("loop").onclick = () => {
		isLooping = !isLooping
		id("loop").innerHTML = isLooping ? "<i class='fa-solid fa-arrows-spin fa-2xs'></i>" : "<i class='fa-solid fa-arrows-right fa-2xs'></i>"
		loopAllowance = 5
	}
	audio.ontimeupdate = () => {
		let dur = audio.currentTime
		let secs = Math.floor(dur % 60)
		let mins = Math.floor(dur / 60)
		dur %= 60
		let hrs = Math.floor(dur / 60)
		id("music_title").textContent = `Now Playing [${hrs} : ${mins} : ${secs}]: ${music.replace(/_/gi, " ")}`
		if((audio.duration <= audio.currentTime) && isLooping && loopAllowance > 1){
			setTimeout(() => {
				audio.play()
				loopAllowance--
			}, 500)
		}
		if(audio.paused){
			id("play").innerHTML = "<i class='fa-solid fa-play fa-2xs'></i>"
		}else{
			id("play").innerHTML = "<i class='fa-solid fa-pause fa-2xs'></i>"
		}
		setDur()
	}
	audio.addEventListener("ended", () => {
		id("play").innerHTML = "<i class='fa-solid fa-play fa-2xs'></i>"
	})
}

window.onkeydown = (e) => {
	let audio = document.getElementById("audio")
	let chat = id("chats")
	if(e.keyCode === 32 && chat != document.activeElement){
		if(audio.paused){
			audio.play()
			id("play").innerHTML = "<i class='fa-solid fa-play fa-2xs'></i>"
		}else{
			audio.pause()
			id("play").innerHTML = "<i class='fa-solid fa-pause fa-2xs'></i>"
		}
		if(isLooping && loopAllowance <= 0){
			loopAllowance = 5
		}
	}
}

function changeAudio(){
	let audio = document.getElementById("audio")
	audio.src = `/res/${music}.mp3`
	loopAllowance = 5
	audio.load()
	let dur = audio.currentTime
	let secs = Math.floor(dur % 60)
	let mins = Math.floor(dur / 60)
	dur %= 60
	let hrs = Math.floor(dur / 60)
	id("music_title").textContent = `Now Playing [${hrs} : ${mins} : ${secs}]: ${music.replace(/_/gi, " ")}`
	audio.play()
	setTimeout(() => {
		clearReply()
	}, 100)
	setDur()
}

function setDur(){
	let audio = document.getElementById("audio")
	let formula = (audio.currentTime / audio.duration) * 100
	let progess = id("audio_progress")
	if(formula < 3){
		progess.style.width = "3%"
	}else{
		progess.style.width = `${formula}%`
	}
	progess.innerHTML = Math.round((audio.currentTime / audio.duration) * 10000) / 100 + "%"
}

setInterval(startFetch, 1000)