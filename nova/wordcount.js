const g_wordSortModes = {Alphabetical:"Alphabetical", WordLength:"Word length", Count:"Count", Score:"Score"}
const g_whatToCount = {All:"All words", Adverbs:"Adverbs", First:"First word in each sentence"}

g_tabFunctions['word tally'] = function(reply, thenCall)
{
	var options = []
	OptionsMakeSelect(options, "RedrawWordTable()", "Sort", "sortMode", g_wordSortModes, "Score")
	OptionsMakeSelect(options, "RedrawWordTable()", "What to count", "whatToCount", g_whatToCount)
	OptionsMakeCheckbox(options, "RedrawWordTable()", "displayUnique", "Display words/phrases only used once")
	OptionsMakeCheckbox(options, "RedrawWordTable()", "stopAtApostrophe", "Trim words at an apostrophe")
	reply.push(options.join('&nbsp;&nbsp;'))
	reply.push('<P ID=wordTableHere></P>')

	thenCall.push(RedrawWordTable)
}

function RedrawWordTable()
{
	var reply = []
	var wordCounts = {}

	var g_selectFunctions =
	{
		All:list => list,
		First:list => list.slice(0, 1),
		Adverbs:list => list.filter(w => w.slice(-2) == "ly"),
	}

	const stopAtApostrophe = document.getElementById("stopAtApostrophe")?.checked
	const selectFunc = g_selectFunctions[document.getElementById("whatToCount").value]
	
	for (var s of g_sentences)
	{
		for (var w of selectFunc(s.listOfWords))
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

