function RenderBarFor(val, scale, dp, suffix)
{
	const num = val * scale
	const greenness = num * 2
	const col = "rgb(" + Math.floor(300 - greenness) + ", " + Math.floor(greenness) + ", " + Math.floor(255 - greenness) + ")"
	return '<DIV STYLE="width:' + Math.floor(num) + 'px;height:16px;background:' + col + '"><B><SMALL>' + ((dp === undefined) ? val : val.toFixed(dp)) + (suffix ?? '') + '</S<ALL></B></DIV>'
}

const kChapterColumns =
{
	Chapter:info=>info.txt.split(' [')[0],
	Complete:info=>parseInt(info.txt.split('[')[1]),
	Words:info=>info.numWords,
//	Sentences:info=>info.numSentences,
//	Paragraphs:info=>info.numPara,
//	["Sentences/paragraph"]:info=>(info.numSentences/info.numPara),
	["Words when done"]:info=>info.numWords * 100 / parseInt(info.txt.split('[')[1]),
	Mentions:info=>Object.keys(info.mentions).join(' ')
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

	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR>")

	for (var h of Object.keys(kChapterColumns))
	{		
		reply.push('<td bgcolor=#DDDDDD><B>' + h + '</B>')
		forSummary[h] = 0
	}

	for (var headingInfo of g_headingToSentence)
	{
		reply.push("<TR>")

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
		if (k in g_chapterSummaryFunc)
		{
			val = g_chapterSummaryFunc[k](forSummary[k])
		}
		reply.push('<td>' + val)
	}
	
	reply.push("</TABLE>")
}

g_tabFunctions.contents = function(reply, thenCall)
{
	for (var headingInfo of g_headingToSentence)
	{
		reply.push("<H3>" + headingInfo.txt + "</H3>")
	}
}

g_tabFunctions.entities = function(reply, thenCall)
{
	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR><TD BGCOLOR=lightGray>")

	var allMentions = {}

	for (var headingInfo of g_headingToSentence)
	{
		reply.push('<TD WIDTH=25 VALIGN=middle><DIV STYLE="transform:rotate(180deg); writing-mode:vertical-rl">' + headingInfo.txt.split(' [')[0]) + "</DIV>"
		
		for (var m of Object.keys(headingInfo.mentions))
		{
			allMentions[m] = headingInfo.txt
		}
	}

	const MakeCell = (bg, txt) => "<TD BGCOLOR=" + bg + "><FONT COLOR=white><B>" + txt + "</B></FONT>"

	for (var [m,lastFoundInChapter] of Object.entries(allMentions))
	{
		reply.push("<TR ALIGN=CENTER><TD>" + m)
		var empty = true
		
		for (var headingInfo of g_headingToSentence)
		{
			if (m in headingInfo.mentions)
			{
				const last = (headingInfo.txt == lastFoundInChapter)
				if (empty)
				{
					reply.push(MakeCell(last ? "purple" : "green", headingInfo.mentions[m]))
				}
				else
				{
					reply.push(MakeCell(last ? "red" : "blue", headingInfo.mentions[m]))
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
	}
}