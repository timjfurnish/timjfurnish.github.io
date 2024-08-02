//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_canShowError = true
var g_baseTime = Date.now()

function NovaLogWithCaller(message, caller, type)
{
	if (caller)
	{
		console[type]("[" + caller + "] " + message)
		message = '<NOBR class="issueType" style="background:#FFFFFF"><BIG>' + caller + '</BIG></NOBR> ' + AddEscapeChars(message)
	}
	else
	{
		console[type](message)
		message = AddEscapeChars(message)
	}
	
	if (type == "warn")
	{
		message = "<font color=#663300>" + message + "</font>"
	}
	
	const elem = document.getElementById("debugLog")

	if (elem)
	{
		elem.innerHTML += '<div><b>' + (Date.now() - g_baseTime) + '</b> ' + message + "</div>"
	}
}

function NovaLog(message)
{
	NovaLogWithCaller(message, NovaLog.caller?.name, "log")
}

function NovaWarn(message)
{
	NovaLogWithCaller(message, NovaWarn.caller?.name, "warn")
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
