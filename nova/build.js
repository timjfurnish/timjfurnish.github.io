//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

const g_currentOptions = {}

//=======================
// ICONS
//=======================

const kIconSearch = "&#128269;"
const kIconPaste = "&#128203;"
const kIconFix = "&#128736;&#xFE0F;"
const kIconSpeech = "&#128172;"
const kIconPhrase = "&#128209;"
const kIconToTop = "&#9757;&#65039;"
const kIconRevert = "&#x21A9;&#xFE0F;"
const kIconSettings = "&#128736;&#65039;"
const kIconIssues = "&#9888;&#65039;"
const kIconEntities = "&#129333;"
const kIconHyphen = "&#127846;"
const kIconBooks = "&#128218;"
const kIconSpeaker = "&#x1F50A;"
const kIconOpenBook = "&#x1F4D6;"
const kIconMute = "&#x274C;"
const kIconOpen = "&#x1f53d;"
const kIconClosed = "&#x25B6;&#xFE0F;"
const kIconText = "&#128263;"
const kIconUnicorn = "&#x1F984;"
const kIconPair = "&#x1F46C;&#x1F3FC;"
const kIconNew = "&#x2795;" // "&#x1F195;"
const kIconTextAppears = "&#x1F4C3;"
const kIconDescending = "&#x1F53B;"
const kIconAscending = "&#x1F53A;"
const kIconGreenTick = "&#x2714;&#xFE0F;"
const kIconRedCross = "&#x274C;"
const kIconTrash = "&#x1F5D1;&#xFE0F;"
const kIconWrite = "&#x2712;&#xFE0F;"
const kIconGlobal = "&#x1F30D;"
const kIconJoin = "&#x1F9F7;"
const kIconCheckbox = "&#x2611;&#xFE0F;"
const kIconAbacus = "&#x1F9EE;"
const kIconUSA = "&#x1F985;"
const kIconMatch = "&#x2714;&#xFE0F;"
const kIconThesaurus = "&#x1F4D4;"
const kIconNumberSign = "&#x23;&#xFE0F;&#x20E3;"

const kCharacterElipsis = "\u2026"
const kCharacterEmDash = "\u2014"

//=======================
// TABLES
//=======================

function TableOpen(reply)
{
	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR>")
}

function TableNewRow(reply, colour, extra)
{
	var bits = ['tr', 'bgColor="' + (colour ?? "#FEFEFE") + '"']

	if (extra)
	{
		bits.push(extra)
	}

	reply.push("</TR><" + bits.join(' ') + ">")
}

function TableAddHeading(reply, txt)
{
	reply.push('<td bgcolor=#DDDDDD CLASS=cell><B>' + txt + '</B></td>')
}

function TableAddCell(reply, txt, canWrap)
{
	reply.push('<td CLASS="' + (canWrap ? 'cell' : 'cellNoWrap') + '">' + txt + '</td>')
}

function TableClose(reply)
{
	reply.push("</TABLE>")
}

function TableShowTally(tally, options)
{
	var reply = []
	var total = 0
	var totalIgnored = 0

	const {colours, colourEntireLine, showTotal, keyHeading, valueHeading, custom, customHeading, addSearchIcon, matchMode, showMoreFunc} = options ?? {}
	const keysInOrder = Object.keys(tally).sort((p1, p2) => (tally[p2] - tally[p1]))
	const {length} = keysInOrder
	const addColourColumn = colours && !colourEntireLine
	const ignoreWhenThisLow = options?.ignoreWhenThisLow ?? 0

	TableOpen(reply)
	TableAddHeading(reply, keyHeading ?? "Text")
	TableAddHeading(reply, valueHeading ?? "Count")

	if (addColourColumn)
	{
		TableAddHeading(reply, "Colour")
	}

	if (custom)
	{
		TableAddHeading(reply, customHeading ?? "Custom")
	}

	for (var key of keysInOrder)
	{
		const value = tally[key]

		if (value > ignoreWhenThisLow)
		{
			TableNewRow(reply, colourEntireLine ? colours[key] : undefined)

			if (addSearchIcon && length > 1)
			{
				TableAddCell(reply, key + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(key) + ", '" + matchMode + "')"))
			}
			else
			{
				TableAddCell(reply, key)
			}

			reply.push('<td align=right class=cell>' + value + '</td>')

			if (addColourColumn)
			{
				reply.push('<td class=cell bgcolor="' + colours[key] + '" width=30></td>')
			}

			if (custom)
			{
				reply.push('<td class=cell>' + custom(key) + '</td>')
			}
		}
		else
		{
			totalIgnored += value
		}

		total += value
	}

	if (total)
	{
		const addExtraCell = addColourColumn ? '<td class=cellNoWrap></td>' : ''

		if (totalIgnored)
		{
			TableNewRow(reply)
			reply.push('<td class=cellNoWrap>Values <= ' + ignoreWhenThisLow)
			if (showMoreFunc)
			{
				reply.push('&nbsp;' + CreateClickableText(kIconNew, showMoreFunc))
			}
			reply.push('</td><td align=right class=cell>' + totalIgnored + '</td>' + addExtraCell)
		}

		if (length > 1 && totalIgnored != total && showTotal)
		{
			TableNewRow(reply)
			reply.push('<td class=cellNoWrap><b>TOTAL</b></td><td align=right class=cell>' + total + '</td>' + addExtraCell)
		}
	}

	TableClose(reply)
	return reply.join('')
}

//=======================
// HTML BITS
//=======================

function PutBitsSideBySide(bits, trOptions)
{
	return '<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0><TR' + (trOptions ? " " + trOptions : "") + '><TD>' + bits.join('</TD><TD>') + '</TD></TR></TABLE>'
}

function CreateClickableText(theText, callThis)
{
	return '<B class="clicky" onClick="' + callThis + '">' + theText + '</B>'
}

function RenderBarFor(val, scale, dp, suffix)
{
	const num = val * scale
	const greenness = num * 2
	const col = "rgb(" + Math.floor(300 - greenness) + ", " + Math.floor(greenness) + ", " + Math.floor(255 - greenness) + ")"

	return '<DIV STYLE="width:' + Math.floor(num) + 'px;background:' + col + '" CLASS="colourBar"><b>' + ((dp === undefined) ? val : val.toFixed(dp)) + "</b><small>" + (suffix ?? '') + '</small></DIV>'
}

function MakeUpdatingArea(toHere, name, extra, initialContents)
{
	toHere.push('<DIV ID="' + name + '"' + (extra ? " " + extra : "") + '>' + (initialContents ?? '') + '</DIV>')
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
// Scrolling/resizing
//=======================

var g_toTopElem = null
var g_toTopVisible = false

function AfterScroll()
{
	const showToTop = window.scrollY > 0

	if (showToTop != g_toTopVisible)
	{
		g_toTopElem.style.display = showToTop ? "block" : "none"
		g_toTopVisible = showToTop
	}
}

function RedoToTop()
{
	g_toTopElem = document.getElementById("toTop")
	g_toTopElem.innerHTML = '<BUTTON ONCLICK="window.scrollTo(0,0)">' + MakeIconWithTooltip(kIconToTop, -6, "Scroll to top", undefined, undefined, undefined, 80, "175%") + '</BUTTON>'
}

function InitToTop()
{
	RedoToTop()
	document.addEventListener("scroll", AfterScroll)
	window.addEventListener("resize", AfterScroll)
}

//=======================
// Options
//=======================

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
		NovaWarn("Can't make key '" + id + "' - current tab is " + tab)
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
			}
		}

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

function OptionsMakeLineHeading(options, txt)
{
	options.push('<B>' + txt + ':</B>&nbsp;')
}

function OptionsMakeCheckbox(options, funcName, idIn, label, defaultVal)
{
	const id = OptionsMakeKey(g_selectedTabName, idIn, defaultVal ? true : false)
	options.push('<INPUT TYPE="checkbox" ' + OptionsCommon(id, funcName, true) + '><LABEL FOR="' + id + '"> ' + (label ?? idIn) + '</LABEL>')
}

function OptionsConcat(arr)
{
	var out = ""
	var before = ""

	for (var each of arr)
	{
		if (each != "|")
		{
			out += before + "<nobr>&nbsp;" + each + "&nbsp;</nobr>"
			before = " "
		}
		else if (before != "")
		{
			before = "<BR>"
		}
	}

	return out + "<br>"
}

function OptionsMakeButtons(toHere, info)
{
	var reply = []

	for (var [label, callThis] of Object.entries(info))
	{
		reply.push('<button onClick="' + callThis + '">' + label + '</button>')
	}

	toHere.push('<small>' + reply.join('') + '</small>')
}

function OptionsMakeSelect(toHere, funcName, heading, id, options, defaultVal, callFuncLate)
{
	const isArray = Array.isArray(options)

	if (defaultVal === undefined)
	{
		if (isArray)
		{
			defaultVal = options[0]
		}
		else
		{
			defaultVal = Object.keys(options)[0]
		}
	}

	id = OptionsMakeKey(g_selectedTabName, id, defaultVal)

	if (heading)
	{
		heading += ": "
	}

	var reply = [heading + '<select ' + OptionsCommon(id, funcName, callFuncLate) + '>']

	if (isArray)
	{
		for (var keyAndVal of options)
		{
			reply.push('<option value="' + keyAndVal + '">' + keyAndVal + '</option>')
		}
	}
	else
	{
		for (var [key, val] of Object.entries(options))
		{
			reply.push('<option value="' + key + '">' + val + '</option>')
		}
	}

	toHere.push(reply.join('') + '</select>')
}

function OptionsMakeTextBox(toHere, funcName, heading, id, defVal)
{
	id = OptionsMakeKey(g_selectedTabName, id, defVal ?? "")

	if (heading)
	{
		heading += ": "
	}

	toHere.push(heading + '<input type=text ' + OptionsCommon(id, funcName) + ' class="mediumTextBox"></input>')
}

function OptionsMakeNumberBox(toHere, funcName, heading, id, defVal)
{
	const muchSmallerButton = '<button onClick="OptionModifyNumber(\'' + id + '\', -5, ' + funcName + ')">&lt;&lt;</button>'
	const smallerButton = '<button onClick="OptionModifyNumber(\'' + id + '\', -1, ' + funcName + ')">&lt;</button>'
	const biggerButton = '<button onClick="OptionModifyNumber(\'' + id + '\', 1, ' + funcName + ')">&gt;</button>'
	const muchBiggerButton = '<button onClick="OptionModifyNumber(\'' + id + '\', 5, ' + funcName + ')">&gt;&gt;</button>'

	id = OptionsMakeKey(g_selectedTabName, id, defVal ?? "")
	toHere.push(heading + ': <SMALL>' + muchSmallerButton + smallerButton + '</SMALL><input id="' + id + '" style="text-align:center;" readOnly=true size=3 type=text></input><SMALL>' + biggerButton + muchBiggerButton + '</SMALL>')
}

function OptionModifyNumber(myId, change, func)
{
	const oldValue = +g_currentOptions[g_selectedTabName][myId]
	const newValue = Math.max(1, oldValue + change)

	if (newValue != oldValue)
	{
		document.getElementById(g_selectedTabName + "." + myId).value = newValue
		g_currentOptions[g_selectedTabName][myId] = newValue
		func()
	}
}

//=======================
// Formatting paragraphs
//=======================

function FormatParagraphForDisplay(paragraph, customFunc)
{
	var paraContents = []
	var wasSpeech = undefined
	var joiner = ''

	for (var eachFrag of paragraph)
	{
		if (wasSpeech != eachFrag.isSpeech)
		{
			if (wasSpeech)
			{
				joiner = '”' + joiner
			}
			else
			{
				joiner += '“'
			}

			wasSpeech = eachFrag.isSpeech
		}

		paraContents.push(joiner + customFunc(eachFrag))
		joiner = eachFrag.followedBy.endsWith('(') ? '' : ' '
	}

	if (wasSpeech)
	{
		paraContents.push('”')
	}

	return paraContents.join('')
}
