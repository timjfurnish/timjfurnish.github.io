//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
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

	if (g_tweakableSettings.warningPopUp)
	{
		g_tweakableSettings.warningPopUp = confirm(message + "\n\n" + new Error().stack + "\n\nKeep showing errors?")
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
}

function Assert(condition, err)
{
	if (! condition)
	{
		err = err ? (typeof(err) == "function") ? err() : err : "No additional details provided"
		ShowError("Assert failed! " + err)
	}
}

function AssertSame(thingA, thingB)
{
	Assert(thingA == thingB, () => "Expected '" + thingA + "' to equal '" + thingB + "'")
}