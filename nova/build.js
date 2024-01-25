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

function TableClose(reply)
{
	reply.push("</TABLE>")	
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
				const myType = GetDataType(myTabOptions[key])
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
					console.log("Updated " + GetDataType(elem) + " '" + g_selectedTabName + "." + key + "' to " + myType + " '" + myTabOptions[key] + "'")
				}
			}
		}
	}
}

function SetOptions()
{
	if (g_selectedTabName in g_currentOptions)
	{
		for (var [key, val] of Object.entries(g_currentOptions[g_selectedTabName]))
		{
			var elem = document.getElementById(g_selectedTabName + "." + key)
			if (elem)
			{
				console.log("Setting " + GetDataType(elem) + " '" + g_selectedTabName + "." + key + "' to " + GetDataType(val) + " '" + val + "'")

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

function OptionsCommon(id, funcName)
{
	var onChange = "UpdateOptions()"
	if (funcName)
	{
		if (g_selectedTabName == 'settings')
		{
			onChange += "; " + funcName
		}
		else
		{
			onChange = funcName + "; " + onChange
		}
	}

	return 'onChange="' + onChange + '" id="' + id + '"'
}

function OptionsMakeCheckbox(options, funcName, idIn, label, defaultVal)
{
	const id = OptionsMakeKey(g_selectedTabName, idIn, defaultVal ? true : false)
	options.push('<INPUT TYPE="checkbox" ' + OptionsCommon(id, funcName) + '><LABEL FOR="' + id + '"> ' + (label ?? idIn) + '</LABEL>')
}

function OptionsConcat(arr)
{
	return "<nobr>" + arr.join("&nbsp;</nobr> <nobr>") + "</nobr>"
}

function OptionsMakeSelect(toHere, funcName, heading, id, options, defaultVal)
{
	id = OptionsMakeKey(g_selectedTabName, id, defaultVal)
	var reply = [heading + ': <select ' + OptionsCommon(id, funcName) + '>']

	for (var [key, val] of Object.entries(options))
	{
		reply.push('<option value="' + key + '">' + val + '</option>')
	}

	toHere.push(reply.join('') + '</select>')
}

function OptionsMakeTextBox(toHere, funcName, heading, id)
{
	id = OptionsMakeKey(g_selectedTabName, id, "")
	toHere.push(heading + ': <input type=text ' + OptionsCommon(id, funcName) + '></input>')
}