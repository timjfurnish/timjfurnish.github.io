//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_issues = {}
var g_disabledWarnings = {}
var g_issueCount = 0
var g_issueStats = {}

function BuildWarningNamesList()
{
	const list =
	[
		'SCRIPT', 'NUMBERS', 'TODO', 'DISALLOWED WORD', 'ILLEGAL CHARACTERS',
		'INVALID FINAL NARRATIVE CHARACTER', 'LEADING OR TRAILING SPACE',
		'INVALID FINAL SPEECH CHARACTER', 'IGNORED COMPLETENESS',
		'SPLIT INFINITIVE', 'CHAPTER NAME IN CHAPTER', 'ILLEGAL MOVE BETWEEN LOCATIONS',
		'UNFINISHED QUOTE', 'CAPITALS', 'SPACE BEFORE PUNCTUATION',
		'MARKUP ERROR', 'SPACE IN SPEECH', 'EMPTY SPEECH', 'EMPTY PARAGRAPH', 'EMPTY SENTENCE',
		'PUNCTUATION WITHOUT SPACE', 'ILLEGAL START CHARACTER', 'EMPTY WORD'
	]

	for (var [autoErrName] of kIllegalSubstrings)
	{
		list.push(autoErrName.toUpperCase())
	}
	
	return MakeSet(...list)
}

var g_warningNames = BuildWarningNamesList()

TabDefine("issues", function(reply, thenCall)
{
	if (g_issueCount)
	{
		for (var [heading, issueList] of Object.entries(g_issues))
		{
			reply.push("<B>" + heading + "</B><UL><LI>" + issueList.join("<LI>") + "</UL>")
		}
	}
	else
	{
		reply.push("No issues found")
	}
})

OnEvent("clear", () =>
{
	g_issueCount = 0
	g_issues = {}
	g_disabledWarnings = {}
	g_issueStats = {}

	Object.keys(g_warningNames).forEach(theName => g_issueStats[theName] = 0)

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
})

function IssueGetTotal()
{
	return g_issueCount
}

function IssueAdd(addThis, theType)
{
	if (theType)
	{
		if (!g_warningNames[theType])
		{
			ShowError("Please add " + theType + " to list of warning names")
			g_warningNames[theType] = true
		}
		
		if (g_disabledWarnings[theType])
		{
			return
		}
		
		addThis = '<NOBR id="issueType">' + theType + '</NOBR> ' + addThis
	}

	Tally(g_issueStats, theType ?? "NO TYPE")

	++ g_issueCount

	const issueHeading = MetaDataMakeFragmentDescription()

	if (issueHeading in g_issues)
	{
		g_issues[issueHeading].push(addThis)
	}
	else
	{
		g_issues[issueHeading] = [addThis]
	}
}

OnEvent("processingDone", () =>
{
	SetTabTitle('issues', g_issueCount || undefined)
})

function WarningEnableDisable(strIn)
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
}