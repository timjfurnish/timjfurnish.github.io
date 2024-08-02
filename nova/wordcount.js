//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

/* TODO: word count 2.0
const g_wordSortModes = {Alphabetical:"Alphabetical", WordLength:"Word length", Count:"Count", Score:"Score"}
const g_whatToCount = {All:"All words", Adverbs:"Adverbs", First:"First word in each sentence"}
const g_displayUnique = {All:"Everything", Repeated:"Repeated words only", Unique:"Unique words only"}

TabDefine("words", function(reply, thenCall)
{
	var options = []
	OptionsMakeSelect(options, "RedrawWordTable()", "Sort", "sortMode", g_wordSortModes, "Score")
	OptionsMakeSelect(options, "RedrawWordTable()", "What to count", "whatToCount", g_whatToCount, "All")
	OptionsMakeSelect(options, "RedrawWordTable()", "Show one-offs", "displayUnique", g_displayUnique, "Unique")
	OptionsMakeCheckbox(options, "RedrawWordTable()", "stopAtApostrophe", "Trim words at apostrophes/hyphens")
	reply.push(options.join('&nbsp;&nbsp;'))
	MakeUpdatingArea(reply, "wordTableHere")

	thenCall.push(RedrawWordTable)
}, {})

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

	const stopAtApostrophe = document.getElementById("words.stopAtApostrophe")?.checked
	const selectFunc = g_selectFunctions[document.getElementById("words.whatToCount").value]
	
	for (var metadata of g_metaDataInOrder)
	{			
		for (var para of metadata.myParagraphs)
		{
			for (var fragment of para.fragments)
			{
				for (var ww of selectFunc(fragment.split(' '))
				{
					for (var w of stopAtApostrophe ? ww.split(/[\-']/) : [ww])
					{
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

			var sortFunctions =
			{
				WordLength:(p1, p2) => (p2.length - p1.length),
				Count:(p1, p2) => (wordCounts[p2].count - wordCounts[p1].count),
				Score:(p1, p2) => (wordCounts[p2].score - wordCounts[p1].score),
			}
			
			var limitFunctions =
			{
				All:num => true,
				Unique:num => num == 1,
				Repeated:num => num > 1,
			}

			const limitFunc = limitFunctions[document.getElementById("words.displayUnique").value]
			const sortMode = document.getElementById('words.sortMode').value
			wordsInOrder.sort(sortFunctions[sortMode])
			
			for (var w of wordsInOrder)
			{
				const wordInfo = wordCounts[w]			
				if (limitFunc(wordInfo.count))
				{
					reply.push("<TR><TD>" + MakeMentionLink(w) + "<TD ALIGN=Center>" + wordInfo.count + "<TD ALIGN=Center>" + wordInfo.score)
				}
			}
			reply.push('</TABLE>')	
		}
	}

	document.getElementById("wordTableHere").innerHTML = reply.join("")
}
*/
