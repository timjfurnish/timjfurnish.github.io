//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

// String things

function CapitaliseFirstLetter(name)
{
	return name.charAt(0).toUpperCase() + name.slice(1)
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
	return "<span style=\"background-color:yellow\">" + matched + "</span>"
}

var g_eventFuncs = {}
var g_canShowError = true

function GetDataType(data)
{
	return (data === null) ? "null" : (data === undefined) ? "undefined" : Array.isArray(data) ? "array" : data.tagName ? data.tagName + " (" + data.type + ")" : typeof(data)
}

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

//	console.log("Making colour look up table for " + names)

	for (var each of names)
	{
		var colourWheelAngle = Math.PI * 2 * count / total
		++ count
		reply[each] = rgbToHex(0.9 + Math.sin(colourWheelAngle) * 0.1, 0.9 + Math.sin(colourWheelAngle + 2) * 0.1, 0.9 + Math.sin(colourWheelAngle + 4) * 0.1)
//		console.log("name=" + each + " angle=" + colourWheelAngle + " col=" + reply[each])
	}
	
	return reply
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

function ShowError(message)
{
	if (g_canShowError)
	{
		console.warn(message)
		g_canShowError = confirm(message + "\n\n" + new Error().stack + "\n\nKeep showing errors?")
	}
}

function Tally(toHere, key)
{
	(key in toHere) ? ++ toHere[key] : (toHere[key] = 1)
}

//=========================
// Function-calling fun
//=========================

var g_functionsStillToCall = []

function DescribeFunction(func)
{
	return GetDataType(func) + " " + (func?.name ?? '(no name)')
}

function CallNextQueuedFunction()
{
	const func = g_functionsStillToCall.shift()

	console.log("Calling queued " + DescribeFunction(func))

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
	}

	console.log("Queued " + DescribeFunction(func))
	g_functionsStillToCall.push(func)
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

function OnEvent(eventName, call)
{
	(eventName in g_eventFuncs) ? g_eventFuncs[eventName].push(call) : (g_eventFuncs[eventName] = [call])
}

function DoEvent(eventName)
{
	if (eventName in g_eventFuncs)
	{
		console.log("Calling " + g_eventFuncs[eventName].length + " '" + eventName + "' callbacks")
		CallTheseFunctionsNow(...g_eventFuncs[eventName])
	}
}