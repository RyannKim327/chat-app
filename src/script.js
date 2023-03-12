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
let Scookie = (__name__) => {
	let cook = document.cookie
	let name = `${__name__}=`	
	let decode = decodeURIComponent(cook)
	let spl = decode.split(";")
	for(let i in spl){
		let kie = spl[i]
		while(kie[0] == " "){
			kie = kie.substring(1)
		}
		if(kie.indexOf(name) == 0){
			return kie.substring(name.length, kie.length)
		}
	}
	return ""
}
if(Scookie("username") != ""){
	let username = id("username")
	let password = id("password")
	let _login = id("login")
	let _chat = id("chat")
	
	credentials.username = Scookie("username")
	credentials.id = parseInt(Scookie("id"))
	_login.style.display = "none"
	_login.innerHTML = ""
	_chat.style.display = "block"
	id("cform").style.display = "block"
	id("myname").textContent = `Welcome ${credentials.username}`
	input()
	startFetch()
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
				let cookie = (__name__, __data__) => {
					const date = new Date()
					date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000))
					let xp = `expires=${date.toUTCString()}`
					document.cookie = `${__name__}=${__data__};${xp};path=/`
				}
				credentials.username = data.user
				credentials.id = data.id
				_login.style.display = "none"
				_login.innerHTML = ""
				_chat.style.display = "block"
				id("cform").style.display = "block"
				id("myname").textContent = `Welcome ${data.user}`
				cookie("username", data.user)
				cookie("id", data.id)
				input()
				startFetch()
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
			let usrRank = get.lists.users[credentials.username.toLowerCase()].rank
			users_db = get.lists.users
			_db = l
			id("music_title").textContent = `Now Playing: ${get.lists.music}`
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
					msg = msg.replace(/:newline:/g, "<br>").replace(/:tab:/g, "&emsp;").replace(/:reload:/gi, "<label onclick='location.reload(true)'>Reload</label>")
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
						li += `<p class="name nreply">: <label class="time">[${time}]</label> ${user} ${ranks} replied to ${l[r_id - 1].user}</p><p class="reply ryou">${l[r_id - 1].txt.replace("\<", "&lt;").replace("\>", "&gt;").replace(/:newline:/g, "<br>").replace(/:tab:/g, "&emsp;").replace(/:reload:/gi, "<label onclick='location.reload(true)'>Reload</label>")}</p><p class="chats you _reply" title="${time}" onclick="reply_it(${l[i].id})">${msg}</p>`
					}else{
						li += `<p class="name">${user} ${ranks} replied to ${l[r_id - 1].user}: <label class="time">[${time}]</label></p><p class="reply">${l[r_id - 1].txt.replace("\<", "&lt;").replace("\>", "&gt;").replace(/:newline:/g, "<br>").replace(/:tab:/g, "&emsp;").replace(/:reload:/gi, "<label onclick='location.reload(true)'>Reload</label>")}</p><p class="chats _reply" title="${time}" onclick="reply_it(${l[i].id})">${msg}</p>`
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
			send()
			chat.value = ""
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
				let cookie = (__name__, __data__) => {
					const date = new Date()
					date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000))
					let xp = `expires=${date.toUTCString()}`
					document.cookie = `${__name__}=${__data__};${xp};path=/`
				}
				cookie("username", "")
				cookie("id", -1)
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
	id("reply").textContent = `${_db[reply_id - 1].user}: ${_db[reply_id - 1].txt}`
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
	let cookie = (__name__, __data__) => {
		const date = new Date()
		date.setTime(date.getTime())
		let xp = `expires=${date.toUTCString()}`
		document.cookie = `${__name__}=${__data__};${xp};path=/`
	}
	cookie("username", "")
	cookie("id", -1)
	credentials = {
		username: "",
		id: -1
	}
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
		root.setProperty("--base-background", `${colors[theme_name]["base-background"]}`)
		root.setProperty("--reply-background", `${colors[theme_name]["reply-background"]}`)
		root.setProperty("--reply-color", `${colors[theme_name]["reply-color"]}`)
		root.setProperty("--input-background", `${colors[theme_name]["input-background"]}`)
		root.setProperty("--input-color", `${colors[theme_name]["input-color"]}`)
	}
}

setColors("default")

setInterval(startFetch, 1000)