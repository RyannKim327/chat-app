let id = (_name_) => {
	return document.getElementById(_name_)
}
let credentials = {
	id: -1,
	username: ""
}
let refresh = 0
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
		let get = await fetch('/check').then(r => { return r.json() }).catch(e => {})
		let li = "<table>"
		let l = get.lists.chats
		let usrRank = get.lists.users[credentials.username.toLowerCase()].rank
		let j = 0
		for(let i = l.length - 1; i >= 0 && j < 25; i--){
			let gex = /https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
			let msg = l[i].txt.replace("\<", "&lt;").replace("\>", "&gt;")
			let user = l[i].user
			let ranks = ""
			if(get.lists.users[user.toLowerCase()] != undefined){
				ranks = `[${get.lists.users[user.toLowerCase()].rank}]`
			}
			if(l[i].rank != undefined){
				ranks = `[${l[i].rank}]`
			}
			if(gex.test(msg)){
				msg = msg.replace(msg.match(gex)[0] ,`<a href="${msg.match(gex)[0]}" target="_blank">${msg.match(gex)[0]}</a>`)
			}
			li += `<tr><th class="chats top">${user} ${ranks}</th><td>:</td> <td class="chats msg">${msg}</td></tr>`
			j++
		}
		if((l[l.length - 2].user == credentials.username && l[l.length - 1].user == credentials.username) && (usrRank != "admin" && usrRank != "moderator")){
			id("chats").style.display = "none"
		}else{
			id("chats").style.display = "inline"
		}
		li += "</table>"
		id("lists").innerHTML = li
	}catch(e){}
	if(refresh <= 10){
		refresh++
		setTimeout(startFetch(), 1000)
	}else{
		refresh = 0
		setTimeout(startFetch(), 10000)
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
	if(txt.length > 2){
		let json = {
			id: _id,
			username,
			txt
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
}