g_tabFunctions['word tally'] = function(reply, thenCall)
{
	reply.push('Sort: <select id=sortMode onChange="RedrawWordTable()">')
	reply.push('<option value=Alphabetical>Alphabetical</option>')
	reply.push('<option value=WordLength>Word length</option>')
	reply.push('<option value=Count>Count</option>')
	reply.push('<option value=Score selected>Score</option>')
	reply.push('</select>')
	reply.push('&nbsp;&nbsp;')
	OptionsMakeCheckbox(reply, "RedrawWordTable", "displayUnique", "Display words/phrases only used once")
	reply.push('&nbsp;&nbsp;')
	OptionsMakeCheckbox(reply, "RedrawWordTable", "stopAtApostrophe", "Trim words at an apostrophe")
	reply.push('<BR>')
	reply.push('<P ID=wordTableHere></P>')

	thenCall.push(RedrawWordTable)
}

function RedrawWordTable()
{
	var reply = []
	var wordCounts = {}

	var g_selectFunctions =
	{
		All:(s) => (s.listOfWords),
		FirstWord:(s) => (s.listOfWords.length ? [s.listOfWords[0]] : []),
	}

	var stopAtApostrophe = document.getElementById("stopAtApostrophe")?.checked

	for (var s of g_sentences)
	{
		const listOfWords = g_selectFunctions['FirstWord'](s)

		for (var w of listOfWords)
		{
			if (stopAtApostrophe)
			{
				w = w.split("'")[0]
			}
		
			const length = w.length
			const myScore = (length * (length + 1)) / 2
			
			if (w in wordCounts)
			{
				++ wordCounts[w].count
				wordCounts[w].score += myScore
			}
			else
			{
				wordCounts[w] = {count:1, score:myScore}
			}
		}
	}

	if (wordCounts)
	{
		var wordsInOrder = Object.keys(wordCounts)

		if (wordsInOrder.length)
		{
			reply.push("<TABLE BORDER=1 CELLPADDING=2 CELLSPACING=0>")
			reply.push("<TR><TD BGCOLOR=#DDDDDD>Word<TD ALIGN=Center BGCOLOR=#DDDDDD>Count<TD ALIGN=Center BGCOLOR=#DDDDDD>Score")

			var g_sortFunctions =
			{
				WordLength:(p1, p2) => (p2.length - p1.length),
				Count:(p1, p2) => (wordCounts[p2].count - wordCounts[p1].count),
				Score:(p1, p2) => (wordCounts[p2].score - wordCounts[p1].score),
			}
			
			var minCount = document.getElementById("displayUnique")?.checked ? 1 : 2
			const sortMode = document.getElementById('sortMode').value
			wordsInOrder.sort(g_sortFunctions[sortMode])
			
			for (var w of wordsInOrder)
			{
				const wordInfo = wordCounts[w]			
				if (wordInfo.count >= minCount)
				{
					reply.push("<TR><TD><NOBR>" + w + "</NOBR><TD ALIGN=Center>" + wordInfo.count + "<TD ALIGN=Center>" + wordInfo.score)
				}
			}
			reply.push('</TABLE>')	
		}
	}

	document.getElementById("wordTableHere").innerHTML = reply.join("")
}

