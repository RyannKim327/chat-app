let setCookie = (__name__, __data__) => {
	const date = new Date()
	date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000))
	let xp = `expires=${date.toUTCString()}`
	document.cookie = `${__name__}=${__data__};${xp};path=/`
}
let	getCookie = (__name__) => {
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

export default { setCookie, getCookie }