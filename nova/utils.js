//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

//---------------------------
// Web browser things
//---------------------------

var g_canShowError = true

function SetUp_FixTitle()
{
	const location = document.location.href

	if (location.substr(0, 4) == "file")
	{
		document.title += " (LOCAL)"
	}
}

function ShowError(message)
{
	console.error(message)

	if (g_canShowError)
	{
		g_canShowError = confirm(message + "\n\n" + new Error().stack + "\n\nKeep showing errors?")
	}
}

function Assert(condition, err)
{
	if (! condition)
	{
		ShowError("Assert failed!")
	}
}

//---------------------------
// String things
//---------------------------

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
	return "<B ID=issueText>" + AddEscapeChars(stringIn) + "</B>"
}

function AddEscapeChars(stringIn)
{
	return stringIn.replace(/\&/g, '&amp;').replace(/\[/g, '&lt;').replace(/\]/g, '&gt;')
}

function Highlighter(matched)
{
	return '<span class="highlighter">' + matched + '</span>'
}

function HighlighterWithDots(matched)
{
	return '<span class="highlighterWithDots">' + matched + '</span>'
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

//---------------------------
// Data management
//---------------------------

function GetDataType(data)
{
	return (data === null) ? "null" : (data === undefined) ? "undefined" : Array.isArray(data) ? "array" : data.tagName ? data.tagName + " (" + data.type + ")" : typeof(data)
}

// This should only be used for display purposes, not comparing result - for that use GetDataType
// Could well revisit this periodically and change the output!
function GetDataTypeVerbose(data)
{
	return (data === null) ? "null" : (data === undefined) ? "undefined" : Array.isArray(data) ? "array of length " + data.length : data.tagName ? data.tagName + " (" + data.type + ")" : typeof(data)
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

function MakeColourLookUpTable(names)
{
	var reply = {}
	var count = 0
	var total = names.length

	for (var each of names)
	{
		var colourWheelAngle = Math.PI * 2 * count / total
		++ count
		reply[each] = rgbToHex(0.9 + Math.sin(colourWheelAngle) * 0.1, 0.9 + Math.sin(colourWheelAngle + 2) * 0.1, 0.9 + Math.sin(colourWheelAngle + 4) * 0.1)
	}
	
	return reply
}

//---------------------------
// Array/object utils
//---------------------------

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
}

//---------------------------
// Function-calling fun
//---------------------------

var g_functionsStillToCall = []

function DescribeFunction(func)
{
	return GetDataTypeVerbose(func) + " '" + (func?.name ?? '(no name)') + "'"
}

function UpdateDebugListOfRunningFunctions()
{
	if (g_functionsStillToCall.length == 0)
	{
		document.getElementById("debugOut").style.display = "none"
	}
	else
	{
		var info = []
		for (var f of g_functionsStillToCall)
		{
			info.push(DescribeFunction(f))
		}
		document.getElementById("debugOut").innerHTML = info.join("<BR>")
	}
}

function CallNextQueuedFunction()
{
	const func = g_functionsStillToCall.shift()

//	console.log("Calling queued " + DescribeFunction(func))

	UpdateDebugListOfRunningFunctions()

	if (g_functionsStillToCall.length > 0)
	{
		setTimeout(CallNextQueuedFunction, 0)
	}

	try
	{
		func()
	}
	catch(err)
	{
		ShowError("While calling " + DescribeFunction(func) + ":\n\n" + err.stack)
	}
}

function QueueFunction(func)
{
	if (g_functionsStillToCall.length == 0)
	{
		setTimeout(CallNextQueuedFunction, 0)
		
		if (g_tweakableSettings.debugListQueuedFunctions)
		{
			document.getElementById("debugOut").style.display = "block"
		}
	}
	else if (g_functionsStillToCall.includes(func))
	{
//		console.log("Not queueing " + DescribeFunction(func) + " at it's already in the queue")
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

//---------------------------
// Event stuff
//---------------------------

var g_eventFuncs = {}

function OnEvent(eventName, late, call)
{
	(eventName in g_eventFuncs) ? late ? g_eventFuncs[eventName].push(call) : g_eventFuncs[eventName].unshift(call) : (g_eventFuncs[eventName] = [call])
	
	console.log("On " + eventName + " (late=" + late + ") call " + DescribeFunction(call))
}

function DoEvent(eventName)
{
	if (eventName in g_eventFuncs)
	{
		console.log("Calling " + g_eventFuncs[eventName].length + " '" + eventName + "' callbacks")
		CallTheseFunctionsNow(...g_eventFuncs[eventName])
	}
}