//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

//---------------------------
// Webpage things
//---------------------------

function SetUp_FixTitle()
{
	const location = document.location.href
	if (location.substr(0, 4) == "file")
	{
		document.title += " (LOCAL)"
	}
}

function TrySetElementClass(elemName, className, add)
{
	var elem = document.getElementById(elemName)

	if (elem)
	{
		add ? elem.classList.add(className) : elem.classList.remove(className)
	}

	return elem
}

function TrySetElementContents(elemName, contents)
{
	const elem = document.getElementById(elemName)

	if (elem)
	{
		elem.innerHTML = contents
	}
}

//---------------------------
// String things
//---------------------------

function MakeElementID(name, stringIn)
{
	for (var i in stringIn)
	{
		name += "_" + stringIn.charCodeAt(i)
	}

	return name
}

function UtilFormatTime(numSeconds)
{
	const numWholeSeconds = Math.ceil(numSeconds)
	const numWholeMinutes = Math.floor(numWholeSeconds / 60)
	const numWholeHours = Math.floor(numWholeMinutes / 60)

	if (numWholeHours || numWholeMinutes)
	{
		const prefix = numWholeHours ? numWholeHours + ":" + ("0" + numWholeMinutes % 60).substr(-2) : numWholeMinutes
		return prefix + ":" + ("0" + numWholeSeconds % 60).substr(-2)
	}
	return numWholeSeconds + " seconds"
}

function CapitaliseFirstLetter(name)
{
	return name.charAt(0).toUpperCase() + name.slice(1)
}

function EscapeRegExSpecialChars(txtIn)
{
	return txtIn.replace(/[.*+?^${}()|[\]\\\-]/g, "\\$&")
}

function MakeParamsString(...theParams)
{
	var out = []
	for (var param of theParams)
	{
		out.push("'" + param.replace(/'/g, "\\'") + "'")
	}
	return out.join(", ")
}

function FixStringHTML(stringIn)
{
	return "<B ID=issueText>" + AddEscapeChars(stringIn + "") + "</B>"
}

function AddEscapeChars(stringIn)
{
	return stringIn.replace(/\&/g, '&amp;').replace(/\[/g, '&lt;').replace(/\]/g, '&gt;').replace(/\'/g, '&apos;').replace(/\"/g, '&quot;')
}

function Highlighter(matched, colour, extra)
{
	var bits = ["span", 'class=highlighter']

	if (colour)
	{
		bits.push('style="background-color:' + colour + '"')
	}
	if (extra)
	{
		bits.push(extra)
	}

	return '<' + bits.join(' ') + '>' + matched + '</span>'
}

function HighlighterWithDots(matched)
{
	return '<span class=highlighterWithDots>' + matched + '</span>'
}

function TurnNovaShorthandIntoRegex(txt)
{
	return txt.replaceAll('*', '\\w*')
}

//---------------------------
// Data management
//---------------------------

function GetDataTypeShared(data)
{
	if (data instanceof RegExp)
	{
		return "regex"
	}
	return (data === null) ? "null" : (data === undefined) ? "undefined" : data.tagName ? data.tagName + " (" + data.type + ")" : null
}

function GetDataType(data)
{
	return GetDataTypeShared(data) ?? (Array.isArray(data) ? "array" : typeof(data))
}

// This should only be used for display purposes, not comparing result - for that use GetDataType
// Could well revisit this periodically and change the output!
function GetDataTypeVerbose(data)
{
	return GetDataTypeShared(data) ?? (Array.isArray(data) ? "array of length " + data.length : typeof(data))
}

//---------------------------
// Colours
//---------------------------

function rgbToHex(rIn, gIn, bIn)
{
	const r = Math.round(rIn * 255)
	const g = Math.round(gIn * 255)
	const b = Math.round(bIn * 255)
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function PickColourOffsetForString(str)
{
	var total = 0

	for (var t in str)
	{
		total += str.charCodeAt(t)
	}

	return total
}

function MakeColourLookUpTable(arr, forceMult, offset, scale)
{
	var reply = {}
	var count = 0
	var total = arr.length

	offset = offset ?? 0

	if (scale === undefined)
	{
		scale = 1
	}

	for (var each of arr)
	{
		var colourWheelAngle = Math.PI * 2 * count / total + offset
		++ count
		var mult = (forceMult ?? ((count & 1) ? (count & 2) ? 0.05 : 0.08 : 0.15))
		var add = (1 - mult)
		reply[each] = rgbToHex(
			scale * Math.sqrt(add + Math.sin(colourWheelAngle) * mult),
			scale *          (add + Math.sin(colourWheelAngle + 2) * mult),
			scale * Math.sqrt(add + Math.sin(colourWheelAngle + 4) * mult))
	}

	return reply
}

//---------------------------
// Array/object utils
//---------------------------

function MakeOrAddToObject(container, objectName, theKey, theVal)
{
	if (container[objectName])
	{
//		console.log("Container has a member called '" + objectName + "' already, adding " + theKey + " to it (" + theVal + ")")
		container[objectName][theKey] = theVal
	}
	else
	{
//		console.log("Container has no member called '" + objectName + "', creating it and adding " + theKey + " to it (" + theVal + ")")
		container[objectName] = {[theKey]:theVal}
	}
}

function MakeSet(...theBits)
{
	var set = {}
	for (var name of theBits.sort())
	{
		set[name] = true
	}
	return set
}

function OnlyKeepValid(arr)
{
	var reply = []
	for (var a of arr)
	{
		if (a)
		{
			reply.push(a)
		}
	}

	return reply
}

function Tally(toHere, key, num)
{
	if (typeof num != "number")
	{
		num = 1
	}
	(key in toHere) ? toHere[key] += num : (toHere[key] = num)

	return toHere[key]
}

function SetBit(toHere, key, bit)
{
	(key in toHere) ? toHere[key] |= bit : (toHere[key] = bit)
}

//---------------------------
// Sorting
//---------------------------

function SortCharactersAndRemoveDupes(inText)
{
	var set = {}
	for (var each of inText)
	{
		set[each] = true
	}
	return Object.keys(set).sort().join('')
}

const SortArray = inArray => inArray.sort()

//---------------------------
// Function-calling fun
//---------------------------

var g_functionsStillToCall = []
var g_onQueueEmpty = []
var g_debugInfo = []

function DescribeFunction(func)
{
	return GetDataTypeVerbose(func) + " '" + (func?.name ?? '(no name)') + "'"
}

function UpdateDebugListOfRunningFunctions()
{
	if (g_functionsStillToCall.length == 0)
	{
		document.getElementById("debugOut").innerHTML = "No queued functions"
	}
	else
	{
		for (var f of g_functionsStillToCall)
		{
			g_debugInfo.push(DescribeFunction(f))
		}
		const newList = g_debugInfo.join("<BR>")
		g_debugInfo = []
		if (document.getElementById("debugOut").innerHTML != newList)
		{
			document.getElementById("debugOut").innerHTML = newList
		}
	}
}

function DescribeFunctions(arr)
{
	var out = []

	for (var f of arr)
	{
		if (typeof f == "function")
		{
			out.push((f.name == "") ? "[anon]" : f.name)
		}
		else
		{
			out.push("[" + GetDataTypeVerbose(f) + "]")
		}
	}

	return out.join(", ")
}

function CallNextQueuedFunction()
{
	const queue = DescribeFunctions(g_functionsStillToCall)
	const func = g_functionsStillToCall.shift()

	UpdateDebugListOfRunningFunctions()

	if (g_functionsStillToCall.length > 0)
	{
		setTimeout(CallNextQueuedFunction, 1)
	}

	try
	{
		func()
	}
	catch(err)
	{
		ShowError("While calling " + DescribeFunction(func) + ":\n\n" + err.stack)
	}

	if (g_functionsStillToCall.length == 0)
	{
		CallTheseFunctionsNow(...g_onQueueEmpty)
		g_onQueueEmpty = []
	}
}

function QueueFunction(func)
{
	if (g_functionsStillToCall.length == 0)
	{
		setTimeout(CallNextQueuedFunction, 1)
	}
	else if (g_functionsStillToCall.includes(func))
	{
		return
	}

	g_functionsStillToCall.push(func)
	UpdateDebugListOfRunningFunctions()
}

function CallTheseFunctions(...list)
{
	list.forEach(QueueFunction)
}

function CallTheseFunctionsNow(...list)
{
	if (list?.length)
	{
//		NovaLog("Calling these functions immediately: " + DescribeFunctions(list))

		for (var func of list)
		{
			try
			{
				func()
			}
			catch(err)
			{
				ShowError("While calling " + DescribeFunction(func) + ":\n\n" + err.stack)
			}
		}
	}
}

//---------------------------
// Event stuff
//---------------------------

var g_eventFuncs = {}

function OnEvent(eventName, late, call)
{
	(eventName in g_eventFuncs) ? late ? g_eventFuncs[eventName].push(call) : g_eventFuncs[eventName].unshift(call) : (g_eventFuncs[eventName] = [call])
}

function DoEvent(eventName)
{
	if (eventName in g_eventFuncs)
	{
//		NovaLog("Calling " + g_eventFuncs[eventName].length + " '" + eventName + "' callbacks")
		CallTheseFunctionsNow(...g_eventFuncs[eventName])
	}
}