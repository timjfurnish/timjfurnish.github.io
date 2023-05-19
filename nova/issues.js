var g_issues = {}
var g_issueHeading = 'Global'
var g_issueCount = 0

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
}

function IssueSetHeading(heading)
{
	g_issueHeading = heading
}

function IssueAdd(issue)
{
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