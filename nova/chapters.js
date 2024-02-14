//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

const kChapterColumns =
{
	Chapter:info=>info.txt.split(' [')[0],
	Complete:info=>parseInt(info.txt.split('[')[1]),
	Words:info=>info.numWords,
//	Sentences:info=>info.numSentences,
//	Paragraphs:info=>info.numPara,
//	["Sentences/paragraph"]:info=>(info.numSentences/info.numPara),
	["Words when done"]:info=>info.numWords * 100 / parseInt(info.txt.split('[')[1]),
	Mentions:info=>Object.keys(info.mentionedInThisChapter).join(' ')
}

const kChapterValueDecorator =
{
	Words:n=>RenderBarFor(n, 0.03),
//	Sentences:n=>RenderBarFor(n, 0.3),
//	Paragraphs:n=>RenderBarFor(n, 0.75),
	Complete:n=>RenderBarFor(n, 0.75, 0, '%'),
	["Words when done"]:n=>RenderBarFor(n, 0.03, 0),
	Sentences:n=>RenderBarFor(n, 0.3),
}

var g_chapterSummaryFunc = []

g_chapterSummaryFunc.Words = g_chapterSummaryFunc.Sentences = g_chapterSummaryFunc.Paragraphs = g_chapterSummaryFunc["Words when done"] = n=>n
g_chapterSummaryFunc.Complete = n=>(n/g_headingToSentence.length).toFixed(2)

g_tabFunctions.chapters = function(reply, thenCall)
{
	var forSummary = []

	TableOpen(reply)

	for (var h of Object.keys(kChapterColumns))
	{
		TableAddHeading(reply, h)
		forSummary[h] = 0
	}

	for (var headingInfo of g_headingToSentence)
	{
		TableNewRow(reply)
		for (var [k,f] of Object.entries(kChapterColumns))
		{
			var val = f(headingInfo)
			if (k in g_chapterSummaryFunc)
			{
				forSummary[k] += val
			}
			if (k in kChapterValueDecorator)
			{
				val = kChapterValueDecorator[k](val)
			}
			reply.push('<td>' + val)
		}
	}

	reply.push("<TR>")

	for (var k of Object.keys(kChapterColumns))
	{
		var val = ""

		if (k == "Complete")
		{
			val = RenderBarFor(100 * forSummary.Words / forSummary["Words when done"], 0.75, 2, '%')
		}
		else if (k == "Chapter")
		{
			val = "<b>TOTAL</b>"
		}
		else if (k in g_chapterSummaryFunc)
		{
			val = Math.round(g_chapterSummaryFunc[k](forSummary[k]))
		}
		reply.push('<td>' + val)
	}
	
	reply.push("</TABLE>")
}

/*
g_tabFunctions.contents = function(reply, thenCall)
{
	for (var headingInfo of g_headingToSentence)
	{
		reply.push("<H3>" + headingInfo.txt + "</H3>")
	}
}
*/

g_tabFunctions.entities = function(reply, thenCall)
{
	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR><TD BGCOLOR=lightGray>")

	var allMentions = {}

	for (var headingInfo of g_headingToSentence)
	{
		reply.push('<TD WIDTH=25 VALIGN=bottom><DIV STYLE="transform:rotate(180deg); writing-mode:vertical-rl"><NOBR>' + headingInfo.txt.split(' [')[0]) + "</NOBR></DIV>"
		
		for (var m of Object.keys(headingInfo.mentionedInThisChapter))
		{
			allMentions[m] = headingInfo.txt
		}
	}

	reply.push("<TD BGCOLOR=lightGray>")

	const MakeCell = (bg, txt) => "<TD BGCOLOR=" + bg + "><FONT COLOR=white><B>" + txt + "</B></FONT>"

	for (var [m,lastFoundInChapter] of Object.entries(allMentions))
	{
		reply.push("<TR ALIGN=CENTER><TD>" + m)
		var empty = true
		var totaliser = 0

		for (var headingInfo of g_headingToSentence)
		{
			if (m in headingInfo.mentionedInThisChapter)
			{
				var num = headingInfo.mentionedInThisChapter[m]
				totaliser += num
				const last = (headingInfo.txt == lastFoundInChapter)
				if (empty)
				{
					reply.push(MakeCell(last ? "purple" : "green", num))
				}
				else
				{
					reply.push(MakeCell(last ? "red" : "blue", num))
				}
				empty = last
			}
			else if (empty)
			{
				reply.push("<TD>")
			}
			else
			{
				reply.push("<TD BGCOLOR=lightGray>-")
			}
		}
		reply.push("<TD><B>" + totaliser + "</B>")
	}
}