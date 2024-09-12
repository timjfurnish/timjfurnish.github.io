//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

const g_wordSortModes = {Alphabetical:"Alphabetical", WordLength:"Word length", Count:"Count", InSpeech:"In speech", InNarrative:"In narrative", Score:"Score"}
const g_displayUnique = {All:"Everything", Repeated:"Repeated words only", Unique:"Unique words only"}
const g_showNameModes = {All:"Everything", JustNames:"Just names", NoNames:"No names"}

var g_maxWordCountRows = 100
var g_calculatedScores = true

TabDefine("words", function(reply, thenCall)
{
	if (! g_calculatedScores)
	{
		NovaLog("Calculating word count scores!")

		for (var [key, data] of Object.entries(g_checkedWords))
		{
			if (key.length > 2)
			{
				const lenM1 = (key.length - 2)
				data.score = lenM1 * lenM1 * data.total
			}
			else
			{
				data.score = 0
			}
		}

		g_calculatedScores = true
	}

	var options = []
	OptionsMakeSelect(options, "ChangedWordCountSettings()", "Sort", "sortMode", g_wordSortModes, "Score")
	OptionsMakeSelect(options, "ChangedWordCountSettings()", "Show", "displayUnique", g_displayUnique, "Repeated")
	OptionsMakeSelect(options, "ChangedWordCountSettings()", "Include", "showNames", g_showNameModes, "NoNames")		

	reply.push(options.join('&nbsp;&nbsp;'))
	MakeUpdatingArea(reply, "wordTableHere")

	thenCall.push(ChangedWordCountSettings)
}, {icon:kIconAbacus, tooltipText:"Word counter"})

function ChangedWordCountSettings()
{
	g_maxWordCountRows = 100
	RedrawWordTable()
}

OnEvent("clear", false, () => g_calculatedScores = false)

function RedrawWordTable()
{
	var reply = []
	var wordsInOrder = Object.keys(g_checkedWords)

	NovaLog("wordsInOrder length=" + wordsInOrder.length)

	if (wordsInOrder.length)
	{
		var sortFunctions =
		{
			WordLength:(p1, p2) => (p2.length - p1.length),
			Count:(p1, p2) => (g_checkedWords[p2].total - g_checkedWords[p1].total),
			InSpeech:(p1, p2) => (g_checkedWords[p2].inSpeech - g_checkedWords[p1].inSpeech),
			InNarrative:(p1, p2) => (g_checkedWords[p2].inNarrative - g_checkedWords[p1].inNarrative),
			Score:(p1, p2) => (g_checkedWords[p2].score - g_checkedWords[p1].score),
		}
		
		TableOpen(reply)
		TableAddHeading(reply, "Word")
		TableAddHeading(reply, "Count")
		TableAddHeading(reply, "In speech")
		TableAddHeading(reply, "In narrative")
		TableAddHeading(reply, "Score")

		var limitFunctions =
		{
			All:num => true,
			Unique:num => num == 1,
			Repeated:num => num > 1,
		}

		const limitFunc = limitFunctions[document.getElementById("words.displayUnique").value]
		const nameMode = document.getElementById("words.showNames").value
		const sortMode = document.getElementById('words.sortMode').value
		const whichVar = "total"
		wordsInOrder.sort(sortFunctions[sortMode])

		var thereWasMore = false;
		var numRows = 0;
		
		for (var w of wordsInOrder)
		{
			const wordInfo = g_checkedWords[w]			
			if (limitFunc(wordInfo[whichVar]))
			{
				var isAName = false
				
				for (var each of g_nameLookup)
				{
					if (w.match(each.regex))
					{
						isAName = each.type
						break
					}
				}
				
				if (nameMode != (isAName ? "NoNames" : "JustNames"))
				{
					if (numRows >= g_maxWordCountRows)
					{
						thereWasMore = true;
						break;
					}

					TableNewRow(reply, kSettingsWhichProvideNames[isAName])
					TableAddCell(reply, MakeMentionLink(w))
					TableAddCell(reply, wordInfo.total)
					TableAddCell(reply, wordInfo.inSpeech)
					TableAddCell(reply, wordInfo.inNarrative)				
					TableAddCell(reply, wordInfo.score)

					++ numRows
				}
			}
		}
		TableClose(reply)
		
		if (thereWasMore)
		{
			reply.push('<P><BUTTON ONCLICK="g_maxWordCountRows += 100; RedrawWordTable()">Show more</BUTTON></P>')
		}
	}

	document.getElementById("wordTableHere").innerHTML = reply.join("")
}
