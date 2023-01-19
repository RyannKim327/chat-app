module.exports = (str="") => {
	let offset = str.length
	let output = ""
	for(let i = 0; i < offset; i++){
		output += parseInt(str.charCodeAt(i) * offset, 16)
	}
	return output
}