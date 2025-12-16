const s_encodeDecodeString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0987654321_."

const kMaxHeight = 25
const kMinHeight = 5
const kMaxWidth = 25
const kMinWidth = 5

//====================================================================
// Pack 0s and 1s using enableDecodeString
//====================================================================

function NonoPackString(stringIn)
{
	const strOut = []
	const bitsUsed = stringIn.length
	var bitSwitch = 0
	
	while(stringIn.length % 6)
	{
		stringIn += "0"
	}

	for (var i = 0; i < stringIn.length; i += 6)
	{
		const myIndex = parseInt(stringIn.substr(i, 6), 2) ^ bitSwitch
		strOut.push(s_encodeDecodeString[myIndex])

		bitSwitch = (bitSwitch + myIndex + 1) & 63
//		console.log("PACK: myIndex=" + myIndex + " bitSwitch=" + bitSwitch)
	}
	
	return s_encodeDecodeString[bitsUsed & 63] + strOut.join('')
}

//====================================================================
// Unpack 0s and 1s using enableDecodeString
//====================================================================

function NonoUnpackStringForDecoding(stringIn)
{
	const strOut = []
	var bitSwitch = 0

	const bitsUsedMod64 = s_encodeDecodeString.indexOf(stringIn[0])
	if (bitsUsedMod64 < 0)
	{
		console.warn("Unexpected chr " + stringIn[0])
		return null
	}

	for (var eachChr of stringIn.substr(1))
	{
		const myIndex = s_encodeDecodeString.indexOf(eachChr)
		if (myIndex < 0)
		{
			console.warn("Unexpected chr " + eachChr)
			return null
		}
		strOut.push((myIndex ^ bitSwitch).toString(2).padStart(6, '0'))

		bitSwitch = (bitSwitch + myIndex + 1) & 63
//		console.log("UNPACK: myIndex=" + myIndex + " bitSwitch=" + bitSwitch)
	}

	return {fromString:strOut.join(''), offset:0, bitsUsedMod64:bitsUsedMod64}
}

//====================================================================
// Encode values to 0s and 1s
//====================================================================

function NonoEncodeBitsRecursive(value, range, workspace)
{
	if (range <= 1)
	{
		return
	}

	const cutOff = (range >> 1)

	if (value < cutOff)
	{
		workspace.buildString += "0"
		NonoEncodeBitsRecursive(value, cutOff, workspace)
	}
	else
	{
		workspace.buildString += "1"
		NonoEncodeBitsRecursive(value - cutOff, range - cutOff, workspace)
	}
}

function NonoEncodeValue(value, min, max, workspace)
{
	if (value < min || value > max)
	{
		console.warn("Can't encode " + value + " as it's outside of valid range " + min + "-" + max)
		return false
	}

	NonoEncodeBitsRecursive(value - min, (max - min) + 1, workspace)
	return true
}

//====================================================================
// Decode 0s and 1s to values
//====================================================================

function NonoDecodeBitsRecursive(decodeWorkspace, range)
{
	if (range <= 1)
	{
		return 0
	}

	const cutOff = (range >> 1)
	const chr = decodeWorkspace.fromString[decodeWorkspace.offset ++]

	if (chr === undefined)
	{
		decodeWorkspace.bad = true
	}

	return (chr == '1') ? cutOff + NonoDecodeBitsRecursive(decodeWorkspace, range - cutOff) : NonoDecodeBitsRecursive(decodeWorkspace, cutOff)
}

function NonoDecode(decodeWorkspace, min, max)
{
	return min + NonoDecodeBitsRecursive(decodeWorkspace, (max - min) + 1)
}

//====================================================================
// Encode a puzzle to a string
//====================================================================

function NonoEncodePuzzle(data)
{
	const width = data[0].length
	const height = data.length
	const workspace = {buildString:""}
	
	var bOk = NonoEncodeValue(0, 0, 1, workspace) && NonoEncodeValue(width, kMinWidth, kMaxWidth, workspace) && NonoEncodeValue(height, kMinHeight, kMaxHeight, workspace)
	
	if (bOk)
	{
		for (var eachRow of data)
		{
			for (var eachChr of eachRow)
			{
				bOk = bOk && NonoEncodeValue((eachChr == '1') ? 1 : 0, 0, 1, workspace)
			}
		}
	}

/*
	// Self test!
	if (bOk)
	{
		const decodeWorkspace = NonoUnpackStringForDecoding(NonoPackString(workspace.buildString))
		const checkVer = NonoDecode(decodeWorkspace, 0, 1)
		const checkWidth = NonoDecode(decodeWorkspace, kMinWidth, kMaxWidth)
		const checkHeight = NonoDecode(decodeWorkspace, kMinHeight, kMaxHeight)

		if (checkVer != 0 || checkWidth != width || checkHeight != height)
		{
			console.warn("Encode/decode error, version " + 0 + " != " + checkVer + " and/or width " + width + " != " + checkWidth + " and/or height " + height + " != " + checkHeight)
		}
	}
*/
	
	return bOk ? NonoPackString(workspace.buildString) : null
}

//====================================================================
// Create a puzzle from a string
//====================================================================

function NonoDecodePuzzleInner(stringIn)
{
	const decodeWorkspace = NonoUnpackStringForDecoding(stringIn)

	if (! decodeWorkspace)
	{
		console.warn("INVALID PUZZLE: Contains illegal character")
		return null
	}

	const ver = NonoDecode(decodeWorkspace, 0, 1)
	
	if (ver != 0)
	{
		console.warn("INVALID PUZZLE: Unexpected version number!")
		return null
	}
	
	const width = NonoDecode(decodeWorkspace, kMinWidth, kMaxWidth)
	const height = NonoDecode(decodeWorkspace, kMinHeight, kMaxHeight)
	var dataOut = []

	for (var y = 0; y < height; ++ y)
	{
		const row = []
		for (var x = 0; x < width; ++ x)
		{
			row.push(NonoDecode(decodeWorkspace, 0, 1) ? "1" : " ")
		}
		dataOut.push(row)
	}
	
	if (decodeWorkspace.bad)
	{
		console.warn("INVALID PUZZLE: Not enough data (read past end of string)")
		return null
	}

	if (decodeWorkspace.fromString.length - decodeWorkspace.offset > 5)
	{
		console.warn("INVALID PUZZLE: Too much data (" + (decodeWorkspace.fromString.length - decodeWorkspace.offset) + " bits unused)")
		return null
	}

	const bitsUsedMod64 = decodeWorkspace.offset & 63
	if (decodeWorkspace.bitsUsedMod64 != bitsUsedMod64)
	{
		console.warn("INVALID PUZZLE: Bits used mod 64 mismatch (" + decodeWorkspace.bitsUsedMod64 + " != " + bitsUsedMod64 + ")")
		return null
	}
	
	return dataOut
}

function NonoDecodePuzzle(stringIn)
{
	const reply = stringIn && NonoDecodePuzzleInner(stringIn)
	
	if (! reply)
	{
		alert("Invalid puzzle definition! Sorry!")
	}

	return reply
}