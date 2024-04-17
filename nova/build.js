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
const kIconSpeech = "&#128172;" // "&#128266;"
const kIconPhrase = "&#128209;"
const kIconToTop = "&#8679;"
const kIconRevert = "&hookleftarrow;"
const kIconSettings = "&#128736;&#65039;"
const kIconIssues = "&#9888;&#65039;"
const kIconEntities = "&#129333;"
const kIconHyphen = "&#127846;"

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
	return '<B class="clicky" onClick="' + callThis + '">' + theText + '</B>'
}

function RenderBarFor(val, scale, dp, suffix)
{
	const num = val * scale
	const greenness = num * 2
	const col = "rgb(" + Math.floor(300 - greenness) + ", " + Math.floor(greenness) + ", " + Math.floor(255 - greenness) + ")"
	return '<DIV STYLE="width:' + Math.floor(num) + 'px;background:' + col + '" CLASS="colourBar"><B><SMALL>' + ((dp === undefined) ? val : val.toFixed(dp)) + (suffix ?? '') + '</SMALL></B></DIV>'
}

function MakeUpdatingArea(toHere, name, extra)
{
	toHere.push('<P ID="' + name + '"' + (extra ? " " + extra : "") + '></P>')
}

function UpdateArea(name, contents)
{
	const elem = document.getElementById(name)
	
	if (elem)
	{
		elem.innerHTML = Array.isArray(contents) ? contents.join('') : contents
	}
}

function UpdateAreaWithProgressBar(name, fraction)
{
	UpdateArea(name, "<TABLE CELLSPACING=0 BORDER=1><TR><TD WIDTH=200>" + RenderBarFor(fraction * 100, 2, 0, '%') + "</TD></TR></TABLE>")
}

//=======================
// Options
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
				myTabOptions[key] = ((typeof myTabOptions[key]) == "boolean") ? elem.checked : elem.value
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
	if (! tab)
	{
		console.warn("Current tab is " + tab)
	}

	if (tab in g_currentOptions)
	{
		// If overwrite is an array it means use default value should the current value not feature in the array
		if (Array.isArray(overwrite))
		{
			const checkThisArray = overwrite
			if (id in g_currentOptions[tab])
			{
				overwrite = !checkThisArray.includes(g_currentOptions[tab][id])
//				console.log("Should we reset " + tab + "." + id + ", currently '" + g_currentOptions[tab][id] + "', to '" + defVal + "'? " + (overwrite ? "Yes!" : "No!") + " Valid options=[" + checkThisArray + "]")
			}
		}
		
		if (overwrite || ! (id in g_currentOptions[tab]))
		{
			g_currentOptions[tab][id] = defVal

//			console.log ("[OPTIONS] Updated '" + tab + "' set:")
//			console.log (g_currentOptions[tab])
		}
	}
	else
	{
		g_currentOptions[tab] = {[id]:defVal}

//		console.log ("[OPTIONS] Created '" + tab + "' set:")
//		console.log (g_currentOptions[tab])
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

function OptionsMakeSelect(toHere, funcName, heading, id, options, defaultVal, callFuncLate)
{
	id = OptionsMakeKey(g_selectedTabName, id, defaultVal, Object.keys(options))
	var reply = [heading + ': <select ' + OptionsCommon(id, funcName, callFuncLate) + '>']

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