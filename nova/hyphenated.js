//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_hyphenCheckWIP = null
var g_hyphenFoundWords = null
var g_hyphenCheckDataIsValid = false

function HuntFor(pattern, callback)
{
	for (var metadata of g_metaDataInOrder)
	{
		for (var para of metadata.myParagraphs)
		{
			if (! para.ignoreFragments)
			{
				[...para.allOfIt.matchAll(pattern)].forEach(elem => elem.forEach(callback))
			}
		}
	}
}

function ClearHyphenCheck()
{
	g_hyphenCheckWIP = null
	g_hyphenFoundWords = null
	g_hyphenCheckDataIsValid = false
}

OnEvent("clear", false, ClearHyphenCheck)

function HyphenCheckDrawTable()
{
	var reply = []

	TableOpen(reply)
	TableAddHeading(reply, "Text")
	TableAddHeading(reply, "Total")
	TableAddHeading(reply, "With hyphens<br>(ice-cream)")
	TableAddHeading(reply, "With spaces<br>(ice cream)")
	TableAddHeading(reply, "With neither<br>(icecream)")

	for (var phrase of Object.keys(g_hyphenCheckWIP).sort((p1, p2) => (g_hyphenCheckWIP[p2].total - g_hyphenCheckWIP[p1].total)))
	{
		const {total, highest, countWithHyphens, countWithNeither, countWithSpaces} = g_hyphenCheckWIP[phrase]
		var colour = undefined

		if (total != highest)
		{
			const badness = highest / total
			colour = rgbToHex(1, badness, badness)
		}
		else if (g_currentOptions.hyphen_check.disc)
		{
			continue
		}

		TableNewRow(reply, colour)

		const searchFor = phrase + "|" + phrase.replaceAll('-', '') + "|" + phrase.replaceAll('-', ' ')

		reply.push('<TD CLASS="cell">' + phrase + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(searchFor) + ")") + '</TD>')
		reply.push('<TD CLASS="cell">' + total + '</TD>')
		reply.push('<TD CLASS="cell">' + (countWithHyphens ?? "") + '</TD>')
		reply.push('<TD CLASS="cell">' + (countWithSpaces ?? "") + '</TD>')
		reply.push('<TD CLASS="cell">' + (countWithNeither ?? "") + '</TD>')
	}

	TableClose(reply)
	g_hyphenCheckDataIsValid = true
	UpdateArea('hyphenCheckOutput', reply)
}

function HyphenCheckCalcTotals()
{
	for (var [phrase, data] of Object.entries(g_hyphenCheckWIP))
	{
		var total = 0

		for (var each of Object.values(data))
		{
			if (typeof each == "number")
			{
				total += each
			}
		}

		if (total > 1)
		{
			var highest = 0
			for (var each of Object.values(data))
			{
				(each > highest) && (highest = each)
			}
			data.total = total
			data.highest = highest
		}
		else
		{
			delete g_hyphenCheckWIP[phrase]
		}
	}
	QueueFunction(HyphenCheckDrawTable)
}

// Return true when done
function TimeSlicedCallFuncForAllKeys(container, markerName, thisFunction, numPerTick, startFrac, scaleFrac)
{
	var countDone = 0
	var entries = Object.entries(container)

	for (var [key, value] of entries)
	{
		++ countDone

		if (value[markerName])
		{
			continue
		}

		thisFunction(key, value)
		value[markerName] = true

		if (-- numPerTick <= 0)
		{
			break
		}
	}

	UpdateAreaWithProgressBar('hyphenCheckOutput', startFrac + (countDone / entries.length) * scaleFrac)

	if (countDone >= entries.length)
	{
		NovaLog("Finished " + countDone + " calls to " + DescribeFunction(thisFunction) + " (" + markerName + ")")
		return true
	}

	return false
}

function HyphenCheckFindWithNeither()
{
	function NoSpaceCallback(key, value)
	{
		HuntFor(new RegExp('\\b' + TurnNovaShorthandIntoRegex(key.replaceAll('-', '')) + '\\b', 'gi'), matched => (Tally(value, "countWithNeither"), MakeOrAddToObject(g_hyphenFoundWords, key, matched, true)))
	}

	const isDone = TimeSlicedCallFuncForAllKeys(g_hyphenCheckWIP, "doneNoSpaceCheck", NoSpaceCallback, 12, 0.5, 0.5)

	QueueFunction(isDone ? HyphenCheckCalcTotals : HyphenCheckFindWithNeither)
}

function HyphenCheckFindWithSpaces()
{
	function SpaceCallback(key, value)
	{
		HuntFor(new RegExp('\\b' + TurnNovaShorthandIntoRegex(key.replaceAll('-', ' ')) + '\\b', 'gi'), matched => (Tally(value, "countWithSpaces"), MakeOrAddToObject(g_hyphenFoundWords, key, matched, true)))
	}

	const isDone = TimeSlicedCallFuncForAllKeys(g_hyphenCheckWIP, "doneSpaceCheck", SpaceCallback, 12, 0, 0.5)

	QueueFunction(isDone ? HyphenCheckFindWithNeither : HyphenCheckFindWithSpaces)
}

function HyphenCheckAddCustom(beforeHyphen, afterHyphen, wildcardCollection)
{
	if (beforeHyphen && afterHyphen)
	{
		const beforeHyphenSplit = beforeHyphen.split(' ')
		const afterHyphenSplit = afterHyphen.split(' ')

		for (var splitBefore of beforeHyphenSplit)
		{
			for (var splitAfter of afterHyphenSplit)
			{
				const key = splitBefore + "-" + splitAfter
//				NovaLog("Adding '" + key + "'")
				g_hyphenCheckWIP[key] = {}
				if (key.includes("*"))
				{
					wildcardCollection[key] = true
				}
			}
		}
	}
}

function HyphenCheckFirstPass()
{
	UpdateAreaWithProgressBar('hyphenCheckOutput', 0)

	// Find things with hyphens in document
	var countEm = {}

	HuntFor(/\b\w+[\w'\-]*-[\w']\w+\b/g, matched => Tally(countEm, matched.toLowerCase()), true)

	// Build full data structure
	g_hyphenCheckWIP = {}
	g_hyphenFoundWords = {}
	var checksWithWildcard = {}

	for (var custom of g_tweakableSettings.hyphenCheckPairs)
	{
		HyphenCheckAddCustom(...custom.split('-', 2), checksWithWildcard)
	}

	for (var [key, value] of Object.entries(countEm))
	{
		// TO DO: see if it matches a wildcard, if so, use that as the key
		g_hyphenCheckWIP[key] = {countWithHyphens:value}
		MakeOrAddToObject(g_hyphenFoundWords, key, key, true)
	}

	NovaLog("Found " + Object.keys(countEm).length + " words with hyphens in; adding in data from settings gives us " + Object.keys(g_hyphenCheckWIP).length + " hyphen check jobs")
	QueueFunction(HyphenCheckFindWithSpaces)
}

function HyphenCheckShowGoButton()
{
	if (g_hyphenCheckDataIsValid)
	{
		HyphenCheckDrawTable()
	}
	else if (g_hyphenCheckWIP == null)
	{
		UpdateArea('hyphenCheckOutput', '<button onClick="HyphenCheckFirstPass()">GO</button>')
	}
}

TabDefine("hyphen_check", function(reply, thenCall)
{
	var options = []
	OptionsMakeCheckbox(options, "HyphenCheckShowGoButton()", "disc", "Only show discrepancies", true)
	reply.push(OptionsConcat(options))
	reply.push("<BR>")
	MakeUpdatingArea(reply, "hyphenCheckOutput")
	thenCall.push(HyphenCheckShowGoButton)
}, {icon:kIconHyphen})
