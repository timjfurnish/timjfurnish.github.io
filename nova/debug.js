//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_canShowError = true
var g_baseTime = Date.now()

function NovaLog(type, message)
{
	console.log(type + ": " + message)
	const elem = document.getElementById("debugLog")

	if (elem)
	{
		elem.innerHTML += '<div><b>' + (Date.now() - g_baseTime) + '&nbsp;</b><NOBR class="issueType" style="background:#FFFFFF"><BIG>' + type + '</BIG></NOBR> ' + message + "</div>"
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
		ShowError("Assert failed!")
	}
}
