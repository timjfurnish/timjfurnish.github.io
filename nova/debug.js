//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_canShowError = true
var g_baseTime = Date.now()

function NovaLog(message)
{
	const caller = NovaLog.caller?.name
	
	if (caller)
	{
		console.log(caller + " - " + message)
		message = '<NOBR class="issueType" style="background:#FFFFFF"><BIG>' + caller + '</BIG></NOBR> ' + AddEscapeChars(message)
	}
	else
	{
		console.log(message)
		message = AddEscapeChars(message)
	}
	
	const elem = document.getElementById("debugLog")

	if (elem)
	{
		elem.innerHTML += '<div><b>' + (Date.now() - g_baseTime) + '</b> ' + message + "</div>"
	}
}

function NovaWarn(message)
{
	console.warn(message)
	const elem = document.getElementById("debugLog")

	if (elem)
	{
		elem.innerHTML += "<br><font color=#663300>" + message + "</font>"
	}
}

function Assert(condition, msg)
{
	if (! condition)
	{
		NovaWarn((typeof(msg) == "function") ? msg() : msg)
	}
}

function NovaLogClear(message)
{
	g_baseTime = Date.now()
	document.getElementById("debugLog").innerHTML = "<b>" + message + "</b>"
}

function ShowError(message)
{
	NovaWarn("ERROR: " + message)

	if (g_canShowError)
	{
		g_canShowError = confirm(message + "\n\n" + new Error().stack + "\n\nKeep showing errors?")
	}
}

function Assert(condition, err)
{
	if (! condition)
	{
		ShowError("Assert failed! " + (err ?? "No additional details provided"))
	}
}
