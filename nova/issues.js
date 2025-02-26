//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_issues = {}
var g_disabledWarnings = {}
var g_issueCount = 0
var g_issueStats = {}

function BuildWarningNamesList()
{
	const list =
	[
		// Start off
		'SCRIPT', 'ISSUE SUMMARY', 'UNSEEN NAMES',

		// Start on
		'NUMBERS', 'TODO', 'DISALLOWED WORD', 'ILLEGAL CHARACTERS', 'UNIQUE', 'ORDER',
		'LEADING OR TRAILING SPACE', 'PUNCTUATION COMBO', 'BRACKETS',
		'INVALID FINAL SPEECH CHARACTER', 'INVALID FIRST SPEECH CHARACTER', 'INVALID FINAL CHARACTER', 'IGNORED COMPLETENESS',
		'SPLIT INFINITIVE', 'ADVERB WITH HYPHEN', 'TAG TEXT IN SECTION', 'COMPLEX PUNCTUATION',
		'UNFINISHED QUOTE', 'CAPITALS', 'SPACE BEFORE PUNCTUATION', 'MISSING TAG',
		'MARKUP ERROR', 'SPACE IN SPEECH', 'EMPTY SPEECH', 'SETTINGS', 'LONG TEXT', "PUNCTUATION: MID-PHRASE",
 		'PUNCTUATION WITHOUT SPACE', 'ILLEGAL START CHARACTER', 'EMPTY WORD'
	]

	for (var [autoErrName] of kIllegalSubstrings)
	{
		list.push(autoErrName.toUpperCase())
	}

	return MakeColourLookUpTable(list)
}

var g_autoFixIssues = {}
var g_warningNames = BuildWarningNamesList()

function IssueAutoFixDefine(type, msg, func)
{
	Assert(type in g_warningNames, type + " is not in warning name list")
	Assert(! (type in g_autoFixIssues), type + " already has an auto-fix function")
	g_autoFixIssues[type] = {func:func, msg:msg}
}

TabDefine("issues", function(reply, thenCall)
{
	if (g_issueCount)
	{
		for (var [heading, issueList] of Object.entries(g_issues))
		{
			reply.push("<H3>" + heading + "</H3>" + issueList.join(""))
		}
		if (! g_disabledWarnings["ISSUE SUMMARY"])
		{
			reply.push("<CENTER><HR>" + TableShowTally(g_issueStats, {colours:g_warningNames, colourEntireLine:true, showTotal:true}) + "</CENTER>")
		}
	}
	else
	{
		reply.push("<CENTER>No issues found</CENTER>")
	}
}, {icon:kIconIssues, canSelect:true, alignment:"left"})

function ClearEarlyIssues()
{
	g_issueCount = 0
	g_issues = {}
	g_disabledWarnings = {}
	g_issueStats = {}
//	console.log("Reset issue count to " + g_issueCount)
	function InitOneStat(theName)
	{
		(theName in kOptionCustomNames) || (g_issueStats[theName] = 0)
	}
	Object.keys(g_warningNames).forEach(InitOneStat)
	if (g_currentOptions.settings)
	{
		for (var [key, val] of Object.entries(g_currentOptions.settings))
		{
			if (!val)
			{
				g_disabledWarnings[key] = true
			}
		}
	}
//	NovaLog("Reset disabled warnings to defaults: " + Object.keys(g_disabledWarnings))
}

OnEvent("clear", false, ClearEarlyIssues)

function AutoFix(theType, param)
{
	NovaLog("Auto-fixing " + theType + " issue, param=" + param + " by calling " + (g_autoFixIssues[theType]?.func?.name ?? "???"))
	g_autoFixIssues[theType]?.func?.(param)
}

function IssueAdd(addThis, theType, fixMeParam, overrideIssueHeading)
{
	var storeThis = []
	if (theType)
	{
		var col = g_warningNames[theType]
		if (! col)
		{
			ShowError("Please add " + theType + " to list of warning types")
			col = g_warningNames[theType] = "#FF2222"
		}

		if (g_disabledWarnings[theType])
		{
			return
		}

		storeThis.push(MakeIconWithTooltip(kIconRedCross, 0, "Disable " + theType + " check", "DisableIssueCheck('" + theType + "')", undefined, undefined, 10), '&nbsp;')
		addThis = '<NOBR class="issueType" style="background:' + col + '">' + theType + '</NOBR> ' + addThis

		if (fixMeParam)
		{
			const autoFix = g_autoFixIssues[theType]
			if (autoFix)
			{
				const callThis = 'AutoFix(\'' + theType + '\', \'' + AddEscapeChars(fixMeParam.replace("'", "\\'")) + '\')'
				addThis += ' <NOBR class="fixMe" onClick="' + callThis + '">' + autoFix.msg + '</NOBR>'
			}
		}
	}
	storeThis.push(addThis)

	// Turn array into a single string...
	storeThis = PutBitsSideBySide(storeThis, "valign=top")
	Tally(g_issueStats, theType ?? "NO TYPE")
	++ g_issueCount
	const issueHeading = overrideIssueHeading ?? MetaDataMakeFragmentDescription()
	if (issueHeading in g_issues)
	{
		g_issues[issueHeading].push(storeThis)
	}
	else
	{
		g_issues[issueHeading] = [storeThis]
	}
}

function DisableIssueCheck(theType)
{
	Assert(g_currentOptions.settings[theType])
	g_currentOptions.settings[theType] = false
	CallTheseFunctions(ProcessInput)
}
OnEvent("processingDone", false, () =>
{
	if (! g_disabledWarnings["UNSEEN NAMES"])
	{
		for (var data of g_nameLookup)
		{
			if (data.grandTotal == 0)
			{
				IssueAdd("Name " + FixStringHTML(data.means) + " not present in text", "UNSEEN NAMES", undefined, "Entire text")
			}
		}
	}
})
OnEvent("processingDone", true, () => SetTabTitle('issues', g_issueCount || undefined))
SetMarkupFunction('@', strIn =>
{
	var [key, val] = strIn.split(':', 2)
	key = key.toUpperCase()
	val = val.toUpperCase()
	if (key in g_warningNames)
	{
		if (val == "ON")
		{
			delete g_disabledWarnings[key]
		}
		else if (val == "OFF")
		{
			g_disabledWarnings[key] = true
		}
		else
		{
			IssueAdd("To turn a warning on/off say " + FixStringHTML(key + ":ON") + " or " + FixStringHTML(key + ":OFF") + " - you said " + FixStringHTML(strIn), "MARKUP ERROR")
		}
	}
	else
	{
		IssueAdd("Parsing instruction " + FixStringHTML(strIn) + " - " + FixStringHTML(key) + " is not a known issue type", "MARKUP ERROR")
	}
})