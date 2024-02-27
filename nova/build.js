//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

//=======================
// ICONS
//=======================

const kIconSearch = "&#128269;"
const kIconPaste = "&#128203;"
const kIconFix = "&#128736;"
const kIconSpeech = "&#128172;"
const kIconRevert = "&hookleftarrow;"

const kCharacterElipsis = "\u2026"
const kCharacterEmDash = "\u2014"

//=======================
// TABLES
//=======================

function TableOpen(reply)
{
	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR>")
}

function TableNewRow(reply, extra)
{
	if (extra)
	{
		reply.push("</TR><TR " + extra + ">")
	}
	else
	{
		reply.push("</TR><TR>")
	}
}

function TableAddHeading(reply, h)
{
	reply.push('<td bgcolor=#DDDDDD CLASS=cellNoWrap><B>' + h + '</B>')
}

function TableClose(reply)
{
	reply.push("</TABLE>")	
}

//=======================
// HTML BITS
//=======================

function CreateClickableText(theText, callThis)
{
	return '<B id=clicky onClick="' + callThis + '">' + theText + '</B>'
}

function RenderBarFor(val, scale, dp, suffix)
{
	const num = val * scale
	const greenness = num * 2
	const col = "rgb(" + Math.floor(300 - greenness) + ", " + Math.floor(greenness) + ", " + Math.floor(255 - greenness) + ")"
	return '<DIV STYLE="width:' + Math.floor(num) + 'px;height:16px;background:' + col + '"><B><SMALL>' + ((dp === undefined) ? val : val.toFixed(dp)) + (suffix ?? '') + '</S<ALL></B></DIV>'
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

				if (myType == "boolean")
				{
					myTabOptions[key] = elem.checked
				}
				else
				{
					myTabOptions[key] = elem.value
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

function OptionsCommon(id, funcName, callFuncLate)
{
	var onChange = "UpdateOptions()"
	if (funcName)
	{
		if (callFuncLate)
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

function OptionsMakeCheckbox(options, funcName, idIn, label, defaultVal, callFuncLate)
{
	const id = OptionsMakeKey(g_selectedTabName, idIn, defaultVal ? true : false)
	options.push('<INPUT TYPE="checkbox" ' + OptionsCommon(id, funcName, callFuncLate) + '><LABEL FOR="' + id + '"> ' + (label ?? idIn) + '</LABEL>')
}

function OptionsConcat(arr)
{
	return "<nobr>" + arr.join("&nbsp;</nobr> <nobr>") + "</nobr><br>"
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