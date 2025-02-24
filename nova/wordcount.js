//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

const g_wordSortModes = {Alphabetical:"Alphabetical", WordLength:"Word length (descending)", WordLengthUp:"Word length (ascending)", Count:"Count", InSpeech:"In speech", InNarrative:"In narrative", Score:"Score"}
const g_displayUnique = {All:"Everything", Repeated:"Repeated words only", Unique:"Unique words only"}
const g_showNameModes = {All:"Everything", JustNames:"Just names", NoNames:"No names"}
const g_counterFunctions = {WORDS:Counter_Words, PHRASES:Counter_Phrases}

var g_maxWordCountRows = 100
var g_calculatedScores = true

function Counter_Words(reply, thenCall)
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

	OptionsMakeSelect(options, "ChangedWordCountSettings()", "Sort", "sortMode", g_wordSortModes, "Score", true)
	OptionsMakeSelect(options, "ChangedWordCountSettings()", "Show", "displayUnique", g_displayUnique, "Repeated", true)
	OptionsMakeSelect(options, "ChangedWordCountSettings()", "Include", "showNames", g_showNameModes, "NoNames", true)
	OptionsMakeCheckbox(options, "ChangedWordCountSettings()", "includeHyphens", "Include words containing hyphens", true, true)

	reply.push(OptionsConcat(options))
	MakeUpdatingArea(reply, "wordTableHere")
	thenCall.push(ChangedWordCountSettings)
}

TabDefine("counters", function(reply, thenCall)
{
	TabBuildButtonsBar(reply, Object.keys(g_counterFunctions))
	g_counterFunctions[g_currentOptions.counters.page](reply, thenCall)
}, {icon:kIconAbacus, tooltipText:"Counters"})

function ChangedWordCountSettings()
{
	g_maxWordCountRows = 100
	RedrawWordTable()
}

OnEvent("clear", false, () => g_calculatedScores = false)

function RedrawWordTable()
{
	var reply = []
	var wordsInOrder = Object.keys(g_checkedWords).filter(word => word.length > 1)
	NovaLog("wordsInOrder length=" + wordsInOrder.length)
	if (wordsInOrder.length)
	{
		var sortFunctions =
		{
			Alphabetical:(p1, p2) => (p1.localeCompare(p2)),
			WordLength:(p1, p2) => (p2.length - p1.length),
			WordLengthUp:(p1, p2) => (p1.length - p2.length),
			Count:(p1, p2) => ((g_checkedWords[p2].total - g_checkedWords[p1].total) ?? (p2.length - p1.length)),
			InSpeech:(p1, p2) => ((g_checkedWords[p2].inSpeech - g_checkedWords[p1].inSpeech) ?? (p2.length - p1.length)),
			InNarrative:(p1, p2) => ((g_checkedWords[p2].inNarrative - g_checkedWords[p1].inNarrative) ?? (p2.length - p1.length)),
			Score:(p1, p2) => ((g_checkedWords[p2].score - g_checkedWords[p1].score) ?? (p2.length - p1.length)),
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
		const limitFunc = limitFunctions[document.getElementById("counters.displayUnique").value]
		const {showNames, includeHyphens, sortMode} = g_currentOptions.counters

		wordsInOrder.sort(sortFunctions[sortMode])

		var thereWasMore = false;
		var numRows = 0;

		for (var w of wordsInOrder)
		{
			const wordInfo = g_checkedWords[w]
			if (limitFunc(wordInfo.total))
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

				if (showNames != (isAName ? "NoNames" : "JustNames"))
				{
					if (includeHyphens || !w.includes('-'))
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
		}
		TableClose(reply)

		if (thereWasMore)
		{
			reply.push('<P><BUTTON ONCLICK="g_maxWordCountRows += 100; RedrawWordTable()">Show more</BUTTON></P>')
		}
	}
	document.getElementById("wordTableHere").innerHTML = reply.join("")
}
