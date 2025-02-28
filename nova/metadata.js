//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_metaDataCurrent
var g_metaDataInOrder
var g_metaDataAvailableColumns
var g_metaDataTally
var g_metaDataTotals
var g_everChangedPercentComplete
var g_metaDataCurrentCompleteness
var g_metaDataNextCompleteness
var g_metaDataGatherParagraphs
var g_metaDataGatherSummaries
var g_metaDataCurrentContainsToDo
var g_metaDataSeenValues
var g_hasSummaries
var g_stillLookingForTagText
var g_lastReportedWordCount = 0

const kMetaDataDefaultDisplay = MakeSet("Estimated final words", "Percent done")
const kMetaDataDefaultGroup = MakeSet("PART")
const kCanDisplayAsTimeToRead = MakeSet("Words", "Estimated final words")
const kTallyCheckboxes = ["Paragraphs", "Words", "Estimated final words", "Speech", "Percent done", "Percent speech"]

function MakeClearTally(createMentions)
{
	var reply =
	{
		Paragraphs:0,
		Words:0,
		["Estimated final words"]:0,
		["Speech"]:0
	}

	if (createMentions)
	{
		reply.Mentions = {}
	}

	return reply
}

function MetaDataCombine(container, name, addThisValue)
{
	const addThisType = GetDataType(addThisValue)

	if (! (name in container))
	{
		NovaLog("Adding " + name + " data '" + addThisValue + "' of type " + addThisType + " to container that only contains this data: [" + Object.keys(container).join(", ") + "]")
		container[name] = (addThisType == "number") ? 0 : {}
	}

	const toHereType = GetDataType(container[name])

	if (toHereType == addThisType)
	{
		if (toHereType == "number")
		{
			container[name] += addThisValue
		}
		else
		{
			for (var [objName, objVal] of Object.entries(addThisValue))
			{
				Tally(container[name], objName, objVal)
			}
		}
	}
	else
	{
		NovaWarn("Can't add " + name + " data [" + addThisValue + "] of type " + addThisType + " to member [" + container[name] + "] of type " + toHereType)
	}
}

function MetaDataMakeFragmentDescription(fromHere)
{
	const fromThis = fromHere ? fromHere.info : g_metaDataCurrent
	Assert(fromThis)
	var out = []
	for (var [key, val] of Object.entries(fromThis))
	{
		if (key != 'CHAPTER' && key != 'WORLD')
		{
			out.push(val)
		}
	}
	if (fromHere)
	{
		const numWords = fromHere.Words
		const numFinal = fromHere["Estimated final words"]
		if (numWords != numFinal)
		{
			out.push(100 * (numWords / numFinal) + "% complete")
		}
	}

	const addThis = out.length ? " &nbsp; <SMALL>(" + out.join(", ") + ")</SMALL>" : ""
	return "<BIG>" + fromThis.CHAPTER + "</BIG>" + addThis
}

function MetaDataDoneProcessing()
{
	for (var v of Object.keys(g_metaDataCurrent))
	{
		MetaDataSet(v)
	}
	MetaDataEndSection()

	const {Words} = g_metaDataTotals
	if (Words && g_lastReportedWordCount && g_tweakableSettings.showWordCountChanges)
	{
		if (Words != g_lastReportedWordCount)
		{
			alert("Word count has " + ((Words > g_lastReportedWordCount) ? "increased from " : "decreased from ") + g_lastReportedWordCount + " to " + Words + ".")
		}
		else
		{
//			alert("Word count has stayed at " + Words + ".")
		}
	}
	g_lastReportedWordCount = Words
}

function MetaDataEndSection()
{
	if (g_metaDataGatherParagraphs.length)
	{
		if (g_metaDataCurrentContainsToDo)
		{
			if (g_metaDataCurrentCompleteness >= 100)
			{
				IssueAdd("Completeness is " + g_metaDataCurrentCompleteness + " but there's a TODO here", "TODO")// " + FixStringHTML(foundInText), "TODO")
			}
		}
		else if (g_metaDataCurrentCompleteness < 100)
		{
			IssueAdd("Completeness is " + g_metaDataCurrentCompleteness + " but there's no TODO in this section", "TODO")
		}
		for (var t of g_tagsExpectedInEverySection)
		{
			if (! (t in g_metaDataCurrent))
			{
				IssueAdd("There's no " + t + " tag set for this section", "MISSING TAG")
			}
		}

		var info = {}
		for (var [key, val] of Object.entries(g_metaDataCurrent))
		{
			g_metaDataAvailableColumns[key] = true
			info[key] = val

			MakeOrAddToObject(g_metaDataSeenValues, key, val, true)
		}

		var storeThis = {info:info, myParagraphs:g_metaDataGatherParagraphs, mySummaries:g_metaDataGatherSummaries}
		
		if (g_metaDataGatherSummaries.length)
		{
			g_hasSummaries = true
		}
		
		g_metaDataTally["Estimated final words"] = (g_metaDataTally.Words * 100) / g_metaDataCurrentCompleteness

		for (var [key, val] of Object.entries(g_metaDataTally))
		{
			if (typeof val == "number")
			{
				storeThis[key] = val
				g_metaDataTotals[key] += val
			}
			else
			{
				storeThis[key] = {}

				for (var [k, v] of Object.entries(val))
				{
					Tally(storeThis[key], k, v)
				}
			}
		}

		g_metaDataTally = MakeClearTally(true)
		g_metaDataInOrder.push(storeThis)
		g_metaDataGatherParagraphs = []
		g_metaDataGatherSummaries = []
	}
}

function MetaDataSet(key, val)
{
	MetaDataEndSection()
	key = key.toUpperCase()
	// TO DO: custom callback
	if (key == 'LOC' && val)
	{
		g_metaDataCurrent['WORLD'] = val.split('.', 1)[0]
	}
	if (g_stillLookingForTagText && (key in g_stillLookingForTagText))
	{
		IssueAdd("Didn't find the text " + FixStringHTML(g_stillLookingForTagText[key]) + " anywhere in this " + key.toLowerCase(), "TAG TEXT IN SECTION")
		delete g_stillLookingForTagText[key]
	}
	if (val === undefined)
	{
		delete g_metaDataCurrent[key]
	}
	else
	{
		g_metaDataCurrent[key] = val
	}
	g_metaDataCurrentContainsToDo = false
}

SetMarkupFunction('~', txt => g_metaDataGatherSummaries.push({fragments:[{text:txt, followedBy:""}]}))

SetMarkupFunction('#', txt =>
{
	for (var setter of txt.split(';'))
	{
		MetaDataSet(...setter.split(':', 2))
	}
})

SetMarkupFunction('%', valueTxt =>
{
	const value = parseInt(valueTxt)
	if (value + "" != valueTxt)
	{
		IssueAdd("Ignoring bad completeness value " + valueTxt + ", should be an integer", "IGNORED COMPLETENESS")
	}
	else if (value < 1 || value > 100)
	{
		IssueAdd("Ignoring bad completeness value " + value + ", should be between 1 and 100 inclusive", "IGNORED COMPLETENESS")
	}
	else if (g_metaDataGatherParagraphs.length)
	{
		g_metaDataNextCompleteness = value
	}
	else if (g_metaDataCurrentCompleteness == value)
	{
		IssueAdd("Completeness is already " + value + "%")
	}
	else
	{
		g_everChangedPercentComplete = true
		g_metaDataCurrentCompleteness = value
	}
})

function MetaDataClear()
{
	g_metaDataCurrent = {}
	g_metaDataInOrder = []
	g_metaDataAvailableColumns = {}
	g_metaDataTally = MakeClearTally(true)
	g_metaDataTotals = MakeClearTally()
	g_everChangedPercentComplete = false
	g_metaDataCurrentCompleteness = 100
	g_metaDataNextCompleteness = 100
	g_metaDataGatherParagraphs = []
	g_metaDataGatherSummaries = []
	g_metaDataCurrentContainsToDo = false
	g_metaDataSeenValues = {}
	g_hasSummaries = undefined
	g_stillLookingForTagText = null
}

OnEvent("processingDone", false, MetaDataDoneProcessing)
OnEvent("clear", false, MetaDataClear)

function MetaDataDrawTable()
{
	var sort = document.getElementById("stats.sort").value
	var consolidate = sort ? {} : undefined
	var selectedColumns = []
	var selectedDisplay = []
	var reply = []
	var seenThings = {}
	var maximums = MakeClearTally(false)

	// Order here determines (in reverse) the order in which the columns will appear...
	maximums["Mentions"] = maximums["Percent speech"] = maximums["Percent done"] = undefined
	const estimatedSize = g_metaDataTotals["Estimated final words"]

	if (estimatedSize)
	{
		reply.push("<H4>Complete: " + (100 * g_metaDataTotals.Words / estimatedSize).toFixed(2) + "<SMALL>%</SMALL></H4>")
	}

	for (var colName of Object.keys(g_metaDataAvailableColumns))
	{
		if (g_currentOptions.stats["process_" + colName])
		{
			selectedColumns.push(colName)
			seenThings[colName] = {}
		}
	}

	for (var name of Object.keys(maximums))
	{
		if (g_currentOptions.stats["display_" + name])
		{
			selectedDisplay.push(name)
		}
	}

	if (selectedColumns.length || selectedDisplay.length)
	{
		var lastDeets = ""
		var lastTally = MakeClearTally(true)
		var dataToDisplay = []
		var lastMetaData = ""
		function AddLastDeets()
		{
			if (lastTally.Paragraphs)
			{
//				NovaLog(lastTally.Paragraphs + " paragraphs, lastDeets = '" + lastDeets + "'")
				if (consolidate && lastDeets in consolidate)
				{
					var addLastTallyToHere = consolidate[lastDeets]
					for (var [name, val] of Object.entries(lastTally))
					{
						if (typeof val == "number")
						{
							addLastTallyToHere[name] += val
						}
						else
						{
							for (var [objName, objVal] of Object.entries(val))
							{
								Tally(addLastTallyToHere[name], objName, objVal)
							}
						}
					}
					lastTally = addLastTallyToHere
	//				console.log("    Reusing entry for " + lastDeets)
				}
				else
				{
	//				console.log("   Creating entry for '" + Object.entries(lastMetaData).join(" ") + "' i.e. '" + lastDeets + "'")
					var newData = {deets:lastDeets, tally:lastTally, metaData:lastMetaData}
					if(lastDeets !== undefined)
					{
						dataToDisplay.push(newData)
					}

					if (consolidate)
					{
						consolidate[lastDeets] = lastTally
					}
				}
			}
		}

		for (var elem of g_metaDataInOrder)
		{
			var deets = ''
			var ignoreMe = false

			for (var colName of selectedColumns)
			{
				if (colName in elem.info)
				{
					const linkTxt = CreateClickableText(kIconOpenBook, "SwitchToReadToMe(" + MakeParamsString(colName) + ", " + MakeParamsString(elem.info[colName]) + ")")
					deets += "<TD CLASS=cellNoWrap>" + linkTxt + " <B>" + elem.info[colName] + "</B></TD>"
				}
				else
				{
					deets += "<TD></TD>"
					ignoreMe = true
				}

				seenThings[colName][elem.info[colName]] = true
			}
	//		console.log("[D] " + Object.entries(elem.Mentions).join(' '))
			if (ignoreMe)
			{
				deets = undefined
			}

			if (deets != lastDeets)
			{
				AddLastDeets()
				lastTally = MakeClearTally(true)
				lastDeets = deets
				lastMetaData = {}

				for (var colName of selectedColumns)
				{
					lastMetaData[colName] = elem.info[colName]
				}
				for (var name of Object.keys(lastTally))
				{
					var val = elem[name]
					if (typeof val == "number")
					{
						lastTally[name] = val
					}
					else
					{
						lastTally[name] = {}

						for (var [k, v] of Object.entries(val))
						{
	//						console.log(name + ": " + k + "=" + v)
							Tally(lastTally[name], k, v)
						}
					}
				}
			}
			else
			{
				for (var name of Object.keys(lastTally))
				{
					MetaDataCombine(lastTally, name, elem[name])
				}
			}
		}

		AddLastDeets()

		// Now work out which of the visible metadata types has the fewest entries
		var colourBasedOn
		var lowestSize

		// TO DO: update this to use number of different values for each metadata tag VISIBLE, not ALL of them
		for (var [key,val] of Object.entries(seenThings))
		{
			var total = Object.keys(val).length
			if (!colourBasedOn || total < lowestSize)
			{
				lowestSize = total
				colourBasedOn = key
			}
		}

		const colourLookUp = colourBasedOn ? MakeColourLookUpTable(Object.keys(seenThings[colourBasedOn])) : null
		const kSecondsPerWord = (60 / g_tweakableSettings.wordsPerMinute)

		// Calculate derived values (e.g. percentages) and max values
		for (var data of dataToDisplay)
		{
			data.tally["Percent speech"] = 100 * (data.tally.Speech / data.tally.Words)
			data.tally["Percent done"] = 100 * (data.tally.Words / data.tally["Estimated final words"])

			for (var [name, val] of Object.entries(data.tally))
			{
				if (maximums[name] === undefined || val > maximums[name])
				{
					maximums[name] = val
				}
			}
		}

		// Sort
		if (sort in maximums)
		{
			dataToDisplay.sort((a,b) => b.tally[sort] - a.tally[sort])
		}

		//----------------------
		// Now draw the table!
		//----------------------

		NovaLog("Redrawing stats table [" + selectedColumns + "] (" + selectedDisplay + ")" + (sort ? " sort='" + sort + "'" : "") + (colourBasedOn ? " colours='" + colourBasedOn + "'" : ""))
		TableOpen(reply)

		for (var colNameToDisplay of selectedColumns)
		{
			TableAddHeading(reply, colNameToDisplay)
		}

		for (var statNameToDisplay of selectedDisplay)
		{
			TableAddHeading(reply, statNameToDisplay)
		}

		function ExtraDeets(num, name)
		{
			if (name in kCanDisplayAsTimeToRead)
			{
				return ' &#x2022; ' + UtilFormatTime(num * kSecondsPerWord)
			}

			return ""
		}

		const totalise = g_currentOptions.stats.totalise && {}
		var showTotal = false

		for (var data of dataToDisplay)
		{
			if (colourBasedOn)
			{
				TableNewRow(reply, colourLookUp[data.metaData[colourBasedOn]])
			}
			else
			{
				TableNewRow(reply)
			}
			reply.push(data.deets)
			for (var name of selectedDisplay)
			{
				var value = data.tally[name]
				var contents = ""
				if (typeof value == "object")
				{
					var listEm = []
					for (var n of Object.keys(value))
					{
						listEm.push('<NOBR class="issueType" style="background:#FFFFFF">' + n + '</nobr>')
					}
					contents = listEm.join("<wbr>")
				}
				else if (name.startsWith("Percent"))
				{
					contents = RenderBarFor(value, 100.0 / maximums[name], 2, '%')
				}
				else if (totalise)
				{
					Tally(totalise, name, value)
					var extra = totalise[name] ? ' <B>(' + (100 * totalise[name] / g_metaDataTotals[name]).toFixed(2) + '<SMALL>%</SMALL>)</B>' : ''
					contents = RenderBarFor(totalise[name], 200.0 / g_metaDataTotals[name], 0, extra + ExtraDeets(totalise[name], name))
				}
				else
				{
					var extra = value ? ' <B>(' + (100 * value / g_metaDataTotals[name]).toFixed(2) + '<SMALL>%</SMALL>)</B>' : ''
					contents = RenderBarFor(value, 200.0 / maximums[name], 0, extra + ExtraDeets(value, name))
					showTotal = true
				}
				reply.push("<TD CLASS=cell>" + contents + "</TD>")
			}
		}

		if (showTotal && selectedColumns.length)
		{
			TableNewRow(reply)
			reply.push('<TD COLSPAN="' + selectedColumns.length + '" CLASS="cellNoWrap"><B><SMALL>TOTAL:</SMALL></B></TD>')
			for (var name of selectedDisplay)
			{
				const value = g_metaDataTotals[name]
				if (value)
				{
					reply.push('<TD CLASS="cell"><B>' + Math.round(value) + "</B><SMALL>" + ExtraDeets(value, name) + '</SMALL></TD>')
				}
				else
				{
					reply.push('<TD CLASS="cell"></TD>')
				}
			}
		}

		TableClose(reply)
	}

	document.getElementById("metaDataOutput").innerHTML = reply.join("")
}

TabDefine("stats", TabFunctionStats, {icon:"&#128202;"})

function TabFunctionStats(reply, thenCall)
{
	TabBuildButtonsBar(reply, ["SECTIONS", "BOOKS"])

	if (g_currentOptions.stats.page == "SECTIONS")
	{
		var options = []
		var optionsDisplay = []

		const selectedColumns = Object.keys(g_metaDataAvailableColumns)

		for (var colName of selectedColumns)
		{
			OptionsMakeCheckbox(options, "MetaDataDrawTable()", "process_" + colName, colName + " (" + Object.keys(g_metaDataSeenValues[colName]).length + ")", kMetaDataDefaultGroup[colName], true)
		}

		var sortData = {"":"Do not consolidate", none:"Chronological"}

		for (var name of kTallyCheckboxes)
		{
			sortData[name] = name
			OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "display_" + name, name, (name == "Words") || (g_everChangedPercentComplete && kMetaDataDefaultDisplay[name]), true)
		}

		OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "display_Mentions", "Mentions", false, true)
		optionsDisplay.push("|")
		OptionsMakeSelect(optionsDisplay, "MetaDataDrawTable()", "Sort", "sort", sortData, "none")
		OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "totalise", "Show running totals", false, true)

		reply.push("<B>Split into rows using:</B><BR>")
		reply.push(OptionsConcat(options) + "<BR>")
		reply.push("<B>Show data columns:</B><BR>")
		reply.push(OptionsConcat(optionsDisplay))

		MakeUpdatingArea(reply, "metaDataOutput")
		thenCall.push(MetaDataDrawTable)
	}
	else
	{
		var wordsInDoc = 0
		g_metaDataInOrder.forEach(metaData => wordsInDoc += metaData.Words)
		var bookList = {["War and Peace"]:561304, ["Les Miserables"]:530982, ["David Copperfield"]:358000, ["Moby Dick"]:206052, ["Jane Eyre"]:183858, ["Great Expectations"]:183349, ["Dracula"]:160363, ["Emma"]:160376, ["Oliver Twist"]:155960, ["The Night Watch"]:146965, ["The Da Vinci Code"]:144330, ["A Tale of Two Cities"]:135420, ["Pride and Prejudice"]:120697, ["Sense and Sensibility"]:126194, ["Wuthering Heights"]:107945, ["To Kill A Mockingbird"]:100388, ["The Picture of Dorian Gray"]:78462, ["Frankenstein"]:74800, ["The Catcher in the Rye"]:73404, ["Treasure Island"]:66950, ["The War of the Worlds"]:59796, ["The Jungle Book"]:54178, ["Peter Pan"]:50844, ["The Great Gatsby"]:47094, ["Beowulf"]:43092, ["The Wonderful Wizard of Oz"]:42636, ["Pygmalion"]:36718, ["A Christmas Carol"]:31650, ["Alice’s Adventures in Wonderland"]:29610, ["The Importance of Being Earnest"]:23760}
		bookList["THIS BOOK"] = wordsInDoc
		reply.push(TableShowTally(bookList, {colours:{["THIS BOOK"]:"#DDFFDD"}, colourEntireLine:true, keyHeading:"Book name", valueHeading:"Words", customHeading:"Ratio", custom:line =>
			{
				const num = bookList[line]
				const ratio = (num > wordsInDoc) ? (wordsInDoc / num) : (num / wordsInDoc)
				return RenderBarFor(ratio * 100, 1.5, 2, '%')
			}
		}))
	}
}

TabDefine("graph", TabFunctionGraph, {icon:"&#x1F4C8;"})

function AddColourUsingData(graphThis, name, brightness)
{
	if (name in g_metaDataSeenValues)
	{
		graphThis.backgroundBlocks = []
		graphThis.bgColours = MakeColourLookUpTable(Object.keys(g_metaDataSeenValues[name]), 0.4, undefined, brightness)

		for (var elem of g_metaDataInOrder)
		{
			GraphAddBackgroundBlock(graphThis, elem.Paragraphs, elem.info[name])
		}
	}
	else if (name)
	{
		NovaWarn("name='" + name + "' isn't in [" + Object.keys(g_metaDataSeenValues) + "]")
	}
}

function MetaDataDrawGraph()
{
	const whichGraphType = g_currentOptions.graph.page

	if (whichGraphType in g_metaDataAvailableColumns)
	{
		// TO DO: this is all very TMINUS-centric!
		const highestVal = 10000
		const divideBy = 8
		const data = Array(highestVal / divideBy + 1)
		const seenLocations = {}
		for (var metaData of g_metaDataInOrder)
		{
			if (whichGraphType in metaData.info)
			{
				const index = Math.floor(parseInt(metaData.info[whichGraphType]) / divideBy)
				if (index >= 0 && index < data.length)
				{
					if (! data[index])
					{
						data[index] = {}
					}
					Tally (data[index], metaData.info.LOC, metaData.Words)
					seenLocations[metaData.info.LOC] = true
				}
			}
		}
		DrawSmoothedGraph({data:data, colours:MakeColourLookUpTable(Object.keys(seenLocations), 0.5)})
	}
	else if (g_currentOptions.graph.data == "SPEECH")
	{
		const graphThis = {colours:{SPEECH:"rgba(255,255,255,0.3)", NARRATIVE:"rgba(0,0,0,0.6)"}, data:[]}
		
		for (var elem of g_metaDataInOrder)
		{
			for (var para of elem.myParagraphs)
			{
				if (! para.ignoreFragments)
				{
					var speech = 0
					var narrative = 0
					for (var frag of para.fragments)
					{
						if (frag.isSpeech)
						{
							speech += frag.text.length
						}
						else
						{
							narrative += frag.text.length
						}
					}

					graphThis.data.push({SPEECH:speech, NARRATIVE:narrative})
				}
			}
		}
		
		AddColourUsingData(graphThis, g_currentOptions.graph.colourUsing)
		DrawSmoothedGraph(graphThis)
	}
	else if (g_currentOptions.graph.data == "SPEECHFRAC")
	{
		const graphThis = {colours:{SPEECH:"rgba(255,255,255,0.6)"}, data:[]}

		for (var elem of g_metaDataInOrder)
		{
			for (var para of elem.myParagraphs)
			{
				if (! para.ignoreFragments)
				{
					var speech = 0
					var total = 0
					for (var frag of para.fragments)
					{
						total += frag.text.length
						if (frag.isSpeech)
						{
							speech += frag.text.length
						}
					}

					graphThis.data.push({SPEECH:speech / total})
				}
			}
		}

		AddColourUsingData(graphThis, g_currentOptions.graph.colourUsing)
		DrawSmoothedGraph(graphThis)
	}
	else if (g_currentOptions.graph.data)
	{
		const graphThis = {colours:MakeColourLookUpTable(Object.keys(g_metaDataSeenValues[g_currentOptions.graph.data]), 0.4), data:[]}

		for (var elem of g_metaDataInOrder)
		{
			const tagText = elem.info[g_currentOptions.graph.data]
			for (var para of elem.myParagraphs)
			{
				if (! para.ignoreFragments)
				{
					if (tagText === undefined)
					{
						graphThis.data.push({})
					}
					else
					{
						graphThis.data.push({[tagText]:para.allOfIt.length})
					}
				}
			}
		}

		AddColourUsingData(graphThis, g_currentOptions.graph.colourUsing, 0.4)
		DrawSmoothedGraph(graphThis)
	}
}

function TabFunctionGraph(reply, thenCall)
{
	const pageNames = ["TAGS"]

	// TO DO build this array programatically
	if (g_metaDataAvailableColumns.TMINUS)
	{
		pageNames.push("TMINUS")
	}

	TabBuildButtonsBar(reply, pageNames)
	var options = []

	if (g_currentOptions.graph.page in g_metaDataAvailableColumns)
	{
		GraphCreateStandardOptions(options, "MetaDataDrawGraph", false)
	}
	else
	{
		GraphCreateStandardOptions(options, "MetaDataDrawGraph", true)
		var nameData = {SPEECH:"Speech vs. narrative", SPEECHFRAC:"Speech fraction"}

		for (var eachCol of Object.keys(g_metaDataAvailableColumns))
		{
			nameData[eachCol] = eachCol
		}

		OptionsMakeSelect(options, "MetaDataDrawGraph()", "Data", "data", nameData, "SPEECH", true)
	}

	reply.push(OptionsConcat(options))
	GraphAddCanvas(reply, 300, thenCall, true)
	thenCall.push(MetaDataDrawGraph)
}
