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
var g_metaDataGatherParagraphs
var g_metaDataCurrentContainsToDo
var g_metaDataSeenValues
var g_totalParagraphs
var g_metaDataMaxValues
var g_metaDataLongestParagraphLength

const kMetaDataDefaultDisplay = MakeSet("Words", "Estimated final words", "Percent done")
const kMetaDataDefaultGroup = MakeSet("PART")
const kCanDisplayAsTimeToRead = MakeSet("Words", "Estimated final words")
const kWordsPerSecond = (210 / 60) // Average WPM apparently 183 out loud, 238 in head

function MakeClearTally(createMentions)
{
	var reply =
	{
		Sentences:0,
		Paragraphs:0,
		Words:0,
		["Estimated final words"]:0,
		["Speech"]:0,
		["Percent speech"]:0,
		["Percent done"]:0
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

function MetaDataMakeFragmentDescription(fromThis)
{
	return Object.values(fromThis ?? g_metaDataCurrent).join(" | ")
}

function MetaDataEndProcess()
{
	if (g_metaDataTally.Sentences)
	{
		g_totalParagraphs += g_metaDataTally.Paragraphs

		if (g_metaDataCurrentCompleteness < 100 && ! g_metaDataCurrentContainsToDo)
		{
			IssueAdd("Completeness is " + g_metaDataCurrentCompleteness + " but there's no TODO in this section", "TODO")
		}

		var info = {}
		for (var [key, val] of Object.entries(g_metaDataCurrent))
		{
			g_metaDataAvailableColumns[key] = true
			info[key] = val
			
			if (key in g_metaDataSeenValues)
			{
				g_metaDataSeenValues[key][val] = true
			}
			else
			{
				g_metaDataSeenValues[key] = {[val]: true}
			}
		}
		
		var storeThis = {info:info, myParagraphs:g_metaDataGatherParagraphs}
		Assert(g_metaDataGatherParagraphs.length == g_metaDataTally.Paragraphs, g_metaDataGatherParagraphs.length + " != " + g_metaDataTally.Paragraphs)

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
	}
}

function MetaDataSet(key, val)
{
	MetaDataEndProcess()

	key = key.toUpperCase()

	// TODO: custom callback
	if (key == 'LOC')
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

	g_metaDataCurrent[key] = val
	g_metaDataCurrentContainsToDo = false
	g_metaDataCurrentCompleteness = 100
}

function MetaDataInformFoundToDo(foundInText)
{
	if (g_metaDataCurrentCompleteness >= 100)
	{
		IssueAdd("Completeness is " + g_metaDataCurrentCompleteness + " but there's a TODO in " + FixStringHTML(foundInText), "TODO")
	}

	g_metaDataCurrentContainsToDo = true
}

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
	else if (g_metaDataTally.Sentences)
	{
		IssueAdd("Ignoring badly placed completeness value " + value + " after already reading " + g_metaDataTally.Sentences + " sentences", "IGNORED COMPLETENESS")
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
	g_metaDataCurrent = {CHAPTER:"None"}
	g_metaDataInOrder = []
	g_metaDataAvailableColumns = {}
	g_metaDataTally = MakeClearTally(true)
	g_metaDataTotals = MakeClearTally()
	g_metaDataCurrentCompleteness = 100
	g_metaDataGatherParagraphs = []
	g_metaDataCurrentContainsToDo = false
	g_metaDataSeenValues = {}
	g_totalParagraphs = 0
	g_metaDataMaxValues = undefined
	g_metaDataLongestParagraphLength = 0
}

OnEvent("processingDone", false, MetaDataEndProcess)
OnEvent("clear", false, MetaDataClear)

function MetaDataProcessParagraph(numSentences)
{
	g_metaDataTally.Sentences += numSentences
}

function MetaDataDoneParagraph(pushThis)
{
	g_metaDataGatherParagraphs.push(pushThis)
	g_metaDataTally.Paragraphs ++
	
	if (pushThis.allOfIt.length > g_metaDataLongestParagraphLength)
	{
		g_metaDataLongestParagraphLength = pushThis.allOfIt.length
	}
}

function MetaDataAddWordCount(words, isSpeech)
{
	g_metaDataTally.Words += words
	
	if (isSpeech)
	{
		g_metaDataTally.Speech += words
	}
}

function MetaDataIncreaseCount(counterName)
{
	Tally(g_metaDataTally.Mentions, counterName)
}

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

//	console.log("============================")

	function AddLastDeets()
	{
		if (lastTally.Paragraphs)
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
		
		for (var colName of selectedColumns)
		{
			deets += "<TD CLASS=cellNoWrap><B>" + elem.info[colName] + "</B></TD>"
			
			seenThings[colName][elem.info[colName]] = true
		}

//		console.log("[D] " + Object.entries(elem.Mentions).join(' '))
		
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

	var maximums = MakeClearTally(false)

	// Calculate derived values (e.g. percentages) and max values
	for (var data of dataToDisplay)
	{
		data.tally["Percent speech"] = 100 * (data.tally.Speech / data.tally.Words)
		data.tally["Percent done"] = 100 * (data.tally.Words / data.tally["Estimated final words"])
		
		for (var [name, val] of Object.entries(data.tally))
		{
			if (val > maximums[name])
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

	for (var name of Object.keys(lastTally))
	{
		if (g_currentOptions.stats["display_" + name])
		{
			TableAddHeading(reply, name)
			selectedDisplay.push(name)
		}
	}
	
	function ExtraDeets(num, name)
	{
		if (name in kCanDisplayAsTimeToRead)
		{
			return ' &#x2022; ' + UtilFormatTime(num / kWordsPerSecond)
		}
		
		return ""
	}

	for (var data of dataToDisplay)
	{
		if (colourBasedOn)
		{
			TableNewRow(reply, 'BGCOLOR="' + colourLookUp[data.metaData[colourBasedOn]] + '"')
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
		reply.push('<TR><TD COLSPAN="' + selectedColumns.length + '" CLASS="cellNoWrap"><B><SMALL>TOTAL:</SMALL></B></TD>')

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

TabDefine("stats", TabFunctionStats, "&#128202;")

function TabFunctionStats(reply, thenCall)
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
	var emptyTally = MakeClearTally(true)

	for (var name of Object.keys(emptyTally))
	{
		if (typeof emptyTally[name] == "number")
		{
			sortData[name] = name
		}

		OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "display_" + name, name, kMetaDataDefaultDisplay[name], true)
	}
	
	OptionsMakeSelect(optionsTextRow, "MetaDataDrawTable()", "Sort", "sort", sortData, "none")

	reply.push("<B>Split into rows using:</B><BR>")
	reply.push(OptionsConcat(options) + "<BR>")
	reply.push("<B>Show data columns:</B><BR>")
	reply.push(OptionsConcat(optionsDisplay) + "<BR>")
	reply.push(OptionsConcat(optionsTextRow))
	
	MakeUpdatingArea(reply, "metaDataOutput")
	thenCall.push(MetaDataDrawTable)
}

TabDefine("graph", TabFunctionGraph, "&#x1F4C8;")

function MetaDataDrawGraph()
{
	const canvas = document.getElementById("graphCanvas")
	const drawToHere = canvas?.getContext("2d")
	
	if (drawToHere)
	{
		drawToHere.clearRect(0, 0, canvas.width, canvas.height)
		
		// Draw bg
		var countParagraphs = 0
		var lastX = 0

		const colourUsing = g_currentOptions.graph.colourUsing
		const colours = MakeColourLookUpTable(Object.keys(g_metaDataSeenValues[colourUsing]))

		for (var elem of g_metaDataInOrder)
		{
			countParagraphs += elem.Paragraphs
			const x = (countParagraphs / g_totalParagraphs) * canvas.width

			drawToHere.beginPath()
			drawToHere.fillStyle = colours[elem.info[colourUsing]]
			drawToHere.rect(lastX, 0, x - lastX + 1, canvas.height)
			drawToHere.fill()
			lastX = x
		}

		// Draw lines
		countParagraphs = 0
		lastX = 0

		drawToHere.fillStyle = "#00000040"

		for (var elem of g_metaDataInOrder)
		{
			Assert(elem.Paragraphs == elem.myParagraphs.length, "Paragraph count mismatch, " + elem.Paragraphs + " != " + elem.myParagraphs.length + ": " + Object.values(elem.info).join('|'))

			for (var para of elem.myParagraphs)
			{
				++ countParagraphs
				
				const val = para.allOfIt.length
				
				const x = (countParagraphs / g_totalParagraphs) * canvas.width
				const y = (1 - val / g_metaDataLongestParagraphLength) * canvas.height

				drawToHere.beginPath()
				drawToHere.rect(lastX - 1, y, x - lastX + 2, canvas.height - y)
				drawToHere.fill()

				lastX = x
			}
		}

		drawToHere.beginPath()
		drawToHere.strokeStyle = "#000000"
		drawToHere.moveTo(0, 0)
		drawToHere.lineTo(0, canvas.height)
		drawToHere.lineTo(canvas.width, canvas.height)
		drawToHere.lineTo(canvas.width, 0)
		drawToHere.lineTo(0, 0)
		drawToHere.stroke()
	}
}

function CalcGraphCanvasWidth()
{
	return Math.max(window.innerWidth - 125, 870)
}

function TabFunctionGraph(reply, thenCall)
{
	var nameData = {}

	for (var eachCol of Object.keys(g_metaDataAvailableColumns))
	{
		nameData[eachCol] = eachCol
	}

	var options = []
	OptionsMakeSelect(options, "MetaDataDrawGraph()", "Colour using", "colourUsing", nameData, "CHAPTER", true)
	reply.push(OptionsConcat(options))
	reply.push("<BR><CANVAS WIDTH=" + CalcGraphCanvasWidth() + " HEIGHT=300 ID=graphCanvas></CANVAS>")
	thenCall.push(MetaDataDrawGraph)
}

window.addEventListener('resize', function(theEvent)
{
	const elem = document.getElementById("graphCanvas")
	
	if (elem)
	{
		elem.width = CalcGraphCanvasWidth()
		MetaDataDrawGraph()
	}
}, true);
