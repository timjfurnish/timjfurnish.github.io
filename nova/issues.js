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
		// Start off
		'SCRIPT', 'ISSUE SUMMARY',
		
		// Start on
		'NUMBERS', 'TODO', 'DISALLOWED WORD', 'ILLEGAL CHARACTERS',
		'LEADING OR TRAILING SPACE', 'PUNCTUATION COMBO',
		'INVALID SPEECH CHARACTER', 'INVALID FINAL CHARACTER', 'IGNORED COMPLETENESS',
		'SPLIT INFINITIVE', 'CHAPTER NAME IN CHAPTER', 'ILLEGAL MOVE BETWEEN LOCATIONS',
		'UNFINISHED QUOTE', 'CAPITALS', 'SPACE BEFORE PUNCTUATION',
		'MARKUP ERROR', 'SPACE IN SPEECH', 'EMPTY SPEECH', 'SETTINGS',
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
			reply.push("<H3 align=left>" + heading + "</H3><UL align=left><LI>" + issueList.join("</LI><LI>") + "</LI></UL>")
		}

		if (! g_disabledWarnings["ISSUE SUMMARY"])
		{
			TableOpen(reply)
			TableAddHeading(reply, "Issue type")
			TableAddHeading(reply, "Count")
			
			for (var [k, v] of Object.entries(g_issueStats))
			{
				TableNewRow(reply)
				reply.push("<TD CLASS=cell>" + k + "</TD><TD CLASS=cell>" + v + "</TD>")
			}
			
			TableClose(reply)
		}
	}
	else
	{
		reply.push("No issues found")
	}
})

OnEvent("clearEarly", () =>
{
	g_issueCount = 0
	g_issues = {}
	g_disabledWarnings = {}
	g_issueStats = {}

	function InitOneStat(theName)
	{
		if (! (theName in kOptionCustomNames))
		{
			g_issueStats[theName] = 0
		}
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

	console.log("Reset disabled warnings to defaults: " + Object.keys(g_disabledWarnings))
})

function IssueGetTotal()
{
	return g_issueCount
}

function IssueAdd(addThis, theType)
{
	//	console.warn(issueHeading + " - " + addThis)

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
		
		addThis = '<NOBR class="issueType">' + theType + '</NOBR> ' + addThis
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