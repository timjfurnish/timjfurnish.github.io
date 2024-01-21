//==============================================
// Part of NOVA - NOVel Assistant
// Tim Furnish, 2023-2024
//==============================================

var g_eventFuncs = {}

function GetDataType(data)
{
	return Array.isArray(data) ? "array" : typeof(data)
}

function MakeSet(...theBits)
{
	var set = {}
	for (var name of theBits)
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
	alert(message + "\n\n" + new Error().stack)
}

function Tally(toHere, key)
{
	(key in toHere) ? ++ toHere[key] : (toHere[key] = 1)
}

function Highlighter(matched)
{
	return "<span style=\"background-color:yellow\">" + matched + "</span>"
}

function CallTheseFunctions(list)
{
	for (const func of list)
	{
		try
		{
			func()
		}
		catch(err)
		{
			ShowError("While calling " + func.name + ":\n\n" + err.stack)
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
		console.log("Calling '" + g_eventFuncs[eventName].length + " '" + eventName + "' callbacks")
		CallTheseFunctions(g_eventFuncs[eventName])
	}
}