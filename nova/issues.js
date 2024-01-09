var g_issues = {}
var g_disabledWarnings = {}
var g_issueHeading = 'Global'
var g_issueCount = 0
var g_warningNames = MakeSet('NUMBERS', 'SPLIT INFINITIVE', 'CHAPTER NAME IN CHAPTER', 'LEADING SPACE', 'TRAILING SPACE', 'UNFINISHED QUOTE')

function MakeSet(...theBits)
{
	var set = {}
	for (var name of theBits)
	{
		set[name] = true
	}
	return set
}

for (var [autoErrName] of kIllegalSubstrings)
{
	g_warningNames[autoErrName.toUpperCase()] = true
}

console.log(g_warningNames)

g_tabFunctions.issues = function(reply, thenCall)
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
}

function IssueClear()
{
	g_issueCount = 0
	g_issues = {}
	g_issueHeading = 'Global'
	g_disabledWarnings = {}
}

function IssueSetHeading(heading)
{
	g_issueHeading = heading
}

function IssueAdd(issue, theType)
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
		
		issue = theType + ": " + issue
	}

	++ g_issueCount

	if (g_issueHeading in g_issues)
	{
		g_issues[g_issueHeading].push(issue)
	}
	else
	{
		g_issues[g_issueHeading] = [issue]
	}
}

function IssuesUpdateTabText()
{
	SetTabTitle('issues', g_issueCount)
}

function WarningEnableDisable(strIn)
{
	var [key, val] = strIn.split(':')
	key = key.toUpperCase()
	val = val.toUpperCase()

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
		IssueAdd("To turn a warning on/off say '" + key + ":ON' or '" + key + ":OFF' - you said '" + strIn + "'")
	}
}