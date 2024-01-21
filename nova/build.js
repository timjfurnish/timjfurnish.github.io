//==============================================
// Part of NOVA - NOVel Assistant
// Tim Furnish, 2023-2024
//==============================================

function RenderBarFor(val, scale, dp, suffix)
{
	const num = val * scale
	const greenness = num * 2
	const col = "rgb(" + Math.floor(300 - greenness) + ", " + Math.floor(greenness) + ", " + Math.floor(255 - greenness) + ")"
	return '<DIV STYLE="width:' + Math.floor(num) + 'px;height:16px;background:' + col + '"><B><SMALL>' + ((dp === undefined) ? val : val.toFixed(dp)) + (suffix ?? '') + '</S<ALL></B></DIV>'
}

function TableOpen(reply)
{
	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR>")
}

function TableNewRow(reply)
{
	reply.push("</TR><TR>")
}

function TableAddHeading(reply, h)
{
	reply.push('<td bgcolor=#DDDDDD><B>' + h + '</B>')
}

//=======================
// options
//=======================

const g_currentOptions =
{
}

function UpdateOptions()
{
	if (g_selectedTabName in g_currentOptions)
	{
		var myTabOptions = g_currentOptions[g_selectedTabName]
		for (var key of Object.keys(myTabOptions))
		{
			var elem = document.getElementById(g_selectedTabName + "." + key)
			if (elem)
			{
				const myType = typeof myTabOptions[key]
				const oldVal = myTabOptions[key]

				if (myType == "boolean")
				{
					myTabOptions[key] = elem.checked
				}
				else
				{
					myTabOptions[key] = elem.value
				}
				
				if (oldVal != myTabOptions[key])
				{
					console.log("Updated " + (typeof elem) + " '" + g_selectedTabName + "." + key + "' to " + myType + " '" + myTabOptions[key] + "'")
				}
			}
		}
	}
}

function SetOptions()
{
	if (g_selectedTabName in g_currentOptions)
	{
		console.log("Updating on-screen option controls for '" + g_selectedTabName + "'")
		for (var [key, val] of Object.entries(g_currentOptions[g_selectedTabName]))
		{
			var elem = document.getElementById(g_selectedTabName + "." + key)
			if (elem)
			{
				console.log("Setting " + (typeof elem) + " '" + g_selectedTabName + "." + key + "' to " + (typeof val) + " '" + val + "'")
				if (typeof val == "boolean")
				{
					elem.checked = val
				}
				else
				{
					elem.value = val
				}
			}
		}
	}
	else
	{
		console.log("There are no options for '" + g_selectedTabName + "'")
	}
}

function OptionsMakeKey(tab, id, defVal, overwrite)
{
	if (tab in g_currentOptions)
	{
		if (overwrite || ! (id in g_currentOptions[tab]))
		{
			g_currentOptions[tab][id] = defVal
		}
	}
	else
	{
		g_currentOptions[tab] = {[id]:defVal}
	}
	return tab + "." + id
}

function OptionsMakeCheckbox(options, funcName, idIn, label)
{
	const id = OptionsMakeKey(g_selectedTabName, idIn, false)
	options.push('<INPUT TYPE="checkbox" onChange="' + funcName + '; UpdateOptions()" id="' + id + '"><LABEL FOR="' + id + '"> ' + (label ?? idIn) + '</LABEL>')
}

function OptionsConcat(arr)
{
	return "<nobr>" + arr.join("&nbsp;</nobr> <nobr>") + "</nobr>"
}

function OptionsMakeSelect(toHere, funcName, heading, id, options, defaultVal)
{
	id = OptionsMakeKey(g_selectedTabName, id, defaultVal)
	var reply = [heading + ': <select id="' + id + '" onChange="' + funcName + '; UpdateOptions()">']

	for (var [key, val] of Object.entries(options))
	{
		reply.push('<option value="' + key + '">' + val + '</option>')
	}

	toHere.push(reply.join('') + '</select>')
}

function OptionsMakeTextBox(toHere, funcName, heading, id)
{
	id = OptionsMakeKey(g_selectedTabName, id, "")
	toHere.push(heading + ': <input type=text id="' + id + '" onChange="' + funcName + '; UpdateOptions()"></input>')
}