//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_metaDataCurrent
var g_metaDataInOrder
var g_metaDataAvailableColumns
var g_metaDataTally
var g_metaDataTotals
var g_metaDataCurrentCompleteness
var g_metaDataNextCompleteness
var g_metaDataGatherParagraphs
var g_metaDataGatherSummaries
var g_metaDataCurrentContainsToDo
var g_metaDataSeenValues
var g_hasSummaries
var g_stillLookingForTagText

const kMetaDataDefaultDisplay = MakeSet("Words", "Estimated final words", "Percent done")
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
	
	return "<BIG>" + fromThis.CHAPTER + "</BIG> &nbsp; <SMALL>(" + out.join(", ") + ")</SMALL>"
}

function MetaDataDoneProcessing()
{
	for (var v of Object.keys(g_metaDataCurrent))
	{
		MetaDataSet(v)
	}

	MetaDataEndProcess()
}

function MetaDataEndProcess()
{
	if (g_metaDataGatherParagraphs.length)
	{
//		g_metaDataTally.Paragraphs = g_metaDataGatherParagraphs.length

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
	MetaDataEndProcess()

	key = key.toUpperCase()

	// TO DO: custom callback
	if (key == 'LOC' && val)
	{
		const world = val.split('.', 1)[0]

		if (key in g_metaDataCurrent)
		{
			const old = g_metaDataCurrent[key]
			if (old.split('.', 1)[0] != world && old != 'sparks' && val != 'sparks' && old != 'movie' && val != 'movie' && old != 'log' && val != 'log')
			{
				IssueAdd("Moving from " + old + " to " + val, "ILLEGAL MOVE BETWEEN LOCATIONS")
			}
		}

		g_metaDataCurrent['WORLD'] = world
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

SetMarkupFunction('~', txt => g_metaDataGatherSummaries.push({allOfIt:txt}))

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
	
	const estimatedSize = g_metaDataTotals["Estimated final words"]
	if (estimatedSize)
	{
		reply.push("<H4>Complete: " + (100 * g_metaDataTotals.Words / estimatedSize).toFixed(2) + "<SMALL>%</SMALL></H4>")
	}

	TableOpen(reply)

	for (var colName of Object.keys(g_metaDataAvailableColumns))
	{
		if (g_currentOptions.stats["process_" + colName])
		{
			TableAddHeading(reply, colName)
			selectedColumns.push(colName)
			seenThings[colName] = {}
		}
	}
	
	var lastDeets = ""
	var lastTally = MakeClearTally(true)
	var dataToDisplay = []
	var lastMetaData = ""

	function AddLastDeets()
	{
		if (lastTally.Paragraphs && lastDeets)
		{
//			console.log("  > " + lastDeets + ": " + Object.entries(lastTally.Mentions).join(' '))

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

				dataToDisplay.push(newData)
				
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
				deets += "<TD CLASS=cellNoWrap><B>" + elem.info[colName] + "</B></TD>"
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
	const kSecondsPerWord = (60 / 210) // Average WPM apparently 183 out loud, 238 in head

	var maximums = MakeClearTally(false)

	// Calculate derived values (e.g. percentages) and max values
	for (var data of dataToDisplay)
	{
		data.tally["Percent speech"] = 100 * (data.tally.Speech / data.tally.Words)
		data.tally["Percent done"] = 100 * (data.tally.Words / data.tally["Estimated final words"])
		
		for (var [name, val] of Object.entries(data.tally))
		{
			if (! (name in maximums) || val > maximums[name])
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

	for (var name of Object.keys(maximums))
	{
		if (g_currentOptions.stats["display_" + name])
		{
			TableAddHeading(reply, name)
			selectedDisplay.push(name)
		}
	}

	NovaLog("Redrawing stats table [" + selectedColumns + "] <" + selectedDisplay + ">" + (sort ? " sort='" + sort + "'" : "") + (colourBasedOn ? " colours='" + colourBasedOn + "'" : ""))
	
	function ExtraDeets(num, name)
	{
		if (name in kCanDisplayAsTimeToRead)
		{
			return ' &#x2022; ' + UtilFormatTime(num * kSecondsPerWord)
		}
		
		return ""
	}

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
			else
			{
				var extra = value ? ' <B>(' + (100 * value / g_metaDataTotals[name]).toFixed(2) + '<SMALL>%</SMALL>)</B>' : ''
				contents = RenderBarFor(value, 200.0 / maximums[name], 0, extra + ExtraDeets(value, name))
			}

			reply.push("<TD CLASS=cell>" + contents + "</TD>")
		}
	}

	// Only need to display total if we had any columns selected...
	if (selectedColumns.length)
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
	
	reply.push("</TABLE>")
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
		var optionsTextRow = []

		const selectedColumns = Object.keys(g_metaDataAvailableColumns)

		for (var colName of selectedColumns)
		{
			OptionsMakeCheckbox(options, "MetaDataDrawTable()", "process_" + colName, colName + " (" + Object.keys(g_metaDataSeenValues[colName]).length + ")", kMetaDataDefaultGroup[colName], true)
		}

		var sortData = {"":"Do not consolidate", none:"Chronological"}

		for (var name of kTallyCheckboxes)
		{
			sortData[name] = name
			OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "display_" + name, name, kMetaDataDefaultDisplay[name], true)
		}

		OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "display_Mentions", "Mentions", kMetaDataDefaultDisplay["Mentions"], true)
		OptionsMakeSelect(optionsTextRow, "MetaDataDrawTable()", "Sort", "sort", sortData, "none")

		reply.push("<B>Split into rows using:</B><BR>")
		reply.push(OptionsConcat(options) + "<BR>")
		reply.push("<B>Show data columns:</B><BR>")
		reply.push(OptionsConcat(optionsDisplay) + "<BR>")
		reply.push(OptionsConcat(optionsTextRow))
		
		MakeUpdatingArea(reply, "metaDataOutput")
		thenCall.push(MetaDataDrawTable)
	}
	else
	{
		var wordsInDoc = 0
		g_metaDataInOrder.forEach(metaData => wordsInDoc += metaData.Words)

		var bookList = {["Les Miserables"]:568751, ["War and Peace"]:567246, ["David Copperfield"]:360231, ["Moby Dick"]:215839, ["Jane Eyre"]:190339, ["Great Expectations"]:187596, ["Dracula"]:165453, ["Emma"]:163514, ["Oliver Twist"]:161712, ["The Night Watch"]:146965, ["The Da Vinci Code"]:144330, ["A Tale of Two Cities"]:139605, ["Pride and Prejudice"]:124713, ["Sense and Sensibility"]:122646, ["Wuthering Heights"]:119572, ["To Kill A Mockingbird"]:99121, ["The Picture of Dorian Gray"]:82222, ["Frankenstein"]:78100, ["The Catcher in the Rye"]:74144, ["Treasure Island"]:72036, ["The War of the Worlds"]:63194, ["The Hound of the Baskervilles"]:62297, ["The Jungle Book"]:54178, ["Peter Pan"]:50844, ["The Great Gatsby"]:47094, ["Beowulf"]:43092, ["The Wonderful Wizard of Oz"]:42636, ["Pygmalion"]:36718, ["A Christmas Carol"]:31650, ["Alice’s Adventures in Wonderland"]:29610, ["The Strange Case of Dr. Jekyll and Mr. Hyde"]:28668, ["The Importance of Being Earnest"]:23760}
		bookList["THIS BOOK"] = wordsInDoc
		reply.push(TableShowTally(bookList, {colours:{["THIS BOOK"]:"#DDFFDD"}, colourEntireLine:true, keyHeading:"Book name", valueHeading:"Words"}))
	}
}

TabDefine("graph", TabFunctionGraph, {icon:"&#x1F4C8;"})

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

		DrawSmoothedGraph({data:data, colours:MakeColourLookUpTable(Object.keys(seenLocations), 0.5)}, +g_currentOptions.graph.smoothing)
	}
	else if (g_currentOptions.graph.data == "SPEECH")
	{
		const graphThis = {colours:{SPEECH:"#FFFFFF", NARRATIVE:"rgba(0,0,0,0.9)"}, data:[]}
		
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

		DrawSmoothedGraph(graphThis, +g_currentOptions.graph.smoothing, {colourUsing:g_currentOptions.graph.colourUsing})
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

		DrawSmoothedGraph(graphThis, +g_currentOptions.graph.smoothing, {colourUsing:g_currentOptions.graph.colourUsing, brightness:0.4})
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

		var nameData = {SPEECH:"Speech vs. narrative"}

		for (var eachCol of Object.keys(g_metaDataAvailableColumns))
		{
			nameData[eachCol] = eachCol
		}

		OptionsMakeSelect(options, "MetaDataDrawGraph()", "Data", "data", nameData, "SPEECH", true)
	}

	reply.push(OptionsConcat(options))
	reply.push("<BR><CANVAS WIDTH=" + CalcGraphCanvasWidth() + " HEIGHT=300 ID=graphCanvas></CANVAS>")
	thenCall.push(MetaDataDrawGraph)
}
