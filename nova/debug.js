//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_canShowError = true

function NovaLog(message)
{
	console.log(message)
	const elem = document.getElementById("debugLog")

	if (elem)
	{
		elem.innerHTML += "<br>" + message
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
