//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_hyphenCheckWIP = null
var g_hyphenFoundWords = null
var g_hyphenCheckDataIsValid = false

function HuntFor(pattern, callback, doDbg)
{
	if (doDbg)
	{
		NovaLog("HuntFor " + pattern + " starting - " + GetDataType(pattern) + " using " + DescribeFunction("".matchAll))
	}

	for (var metadata of g_metaDataInOrder)
	{
		for (var para of metadata.myParagraphs)
		{
			if (! para.ignoreFragments)
			{
				const results = [...para.allOfIt.matchAll(pattern)]

				if (doDbg)
				{
					NovaLog("Checking in '" + para.allOfIt + "' - results=" + GetDataTypeVerbose(results))
				}
				
				results.forEach(elem => elem.forEach(callback))
			}
		}
	}
	
	if (doDbg)
	{
		NovaLog("HuntFor " + pattern + " done")
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
//	TableAddHeading(reply, "Highest")

	for (var phrase of Object.keys(g_hyphenCheckWIP).sort((p1, p2) => (g_hyphenCheckWIP[p2].total - g_hyphenCheckWIP[p1].total)))
	{
		const data = g_hyphenCheckWIP[phrase]
		const bDisc = (data.total != data.highest)
		
		if (g_currentOptions.hyphen_check.disc && !bDisc)
		{
			continue
		}

		TableNewRow(reply, bDisc ? 'BGCOLOR="#FFDDDD"' : undefined)
		const searchFor = phrase + "|" + phrase.replaceAll('-', '') + "|" + phrase.replaceAll('-', ' ')
		reply.push('<TD CLASS="cell">' + phrase + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(searchFor) + ")") + '</TD>')
		reply.push('<TD CLASS="cell">' + data.total + '</TD>')
		reply.push('<TD CLASS="cell">' + (data.countWithHyphens ?? "") + '</TD>')
		reply.push('<TD CLASS="cell">' + (data.countWithSpaces ?? "") + '</TD>')
		reply.push('<TD CLASS="cell">' + (data.countWithNeither ?? "") + '</TD>')
//		reply.push('<TD CLASS="cell">' + (data.highest ?? "") + '</TD>')
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
		HuntFor(new RegExp('\\b' + TurnNovaShorthandIntoRegex(key.replaceAll('-', '')) + '\\b', 'gi'), matched => (Tally(value, "countWithNeither"), SetMemberOfMember(g_hyphenFoundWords, key, matched, true)))
	}
	
	const isDone = TimeSlicedCallFuncForAllKeys(g_hyphenCheckWIP, "doneNoSpaceCheck", NoSpaceCallback, 12, 0.5, 0.5)
	QueueFunction(isDone ? HyphenCheckCalcTotals : HyphenCheckFindWithNeither)
}

function HyphenCheckFindWithSpaces()
{
	function SpaceCallback(key, value)
	{
		HuntFor(new RegExp('\\b' + TurnNovaShorthandIntoRegex(key.replaceAll('-', ' ')) + '\\b', 'gi'), matched => (Tally(value, "countWithSpaces"), SetMemberOfMember(g_hyphenFoundWords, key, matched, true)))
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

function SetMemberOfMember(container, outerName, innerName, value)
{
	if (outerName in container)
	{
		container[outerName][innerName] = value
	}
	else
	{
		container[outerName] = {[innerName]: value}
	}
}

function HyphenCheckFirstPass()
{
	NovaLog("HyphenCheckFirstPass A")
	UpdateAreaWithProgressBar('hyphenCheckOutput', 0)
	NovaLog("HyphenCheckFirstPass B")

	// Find things with hyphens in document
	var countEm = {}
	HuntFor(/\b\w+[\w'\-]*-[\w']\w+\b/g, matched => Tally(countEm, matched.toLowerCase()), true)
	NovaLog("HyphenCheckFirstPass C")

	// Build full data structure
	g_hyphenCheckWIP = {}
	g_hyphenFoundWords = {}
	var checksWithWildcard = {}
	NovaLog("HyphenCheckFirstPass D")

	for (var custom of g_tweakableSettings.hyphenCheckPairs)
	{
		HyphenCheckAddCustom(...custom.split('-', 2), checksWithWildcard)
	}
	
	NovaLog("g_hyphenCheckWIP contains " + Object.keys(g_hyphenCheckWIP).length + " entries")
	NovaLog("countEm contains " + Object.keys(countEm).length + " entries")

//	console.log(checksWithWildcard)
	
	for (var [key, value] of Object.entries(countEm))
	{
		// TODO: see if it matches a wildcard, if so, use that as the key
		g_hyphenCheckWIP[key] = {countWithHyphens:value}
		SetMemberOfMember(g_hyphenFoundWords, key, key, true)
	}
	
	QueueFunction(HyphenCheckFindWithSpaces)
	NovaLog("HyphenCheckFirstPass ending")
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
	OptionsMakeCheckbox(options, "HyphenCheckShowGoButton()", "disc", "Only show discrepancies", true, true)
	reply.push(OptionsConcat(options))
	MakeUpdatingArea(reply, "hyphenCheckOutput")
	thenCall.push(HyphenCheckShowGoButton)
}, kIconHyphen)
